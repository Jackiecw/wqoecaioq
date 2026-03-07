<template>
  <Dialog
    :visible="isOpen"
    modal
    :showHeader="false"
    :style="{ width: '900px', maxWidth: '95vw' }"
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'logistics-batch-dialog' },
      content: { class: 'logistics-batch-content' },
    }"
    @update:visible="onDialogToggle"
  >
    <div class="modal-wrapper">
      <!-- Custom Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h3 class="modal-title">新增生产批次</h3>
            <p class="modal-subtitle">填写订单信息</p>
          </div>
        </div>
        <button class="close-btn" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingOptions" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>正在加载表单选项...</span>
      </div>

      <!-- Form Content -->
      <form v-else class="modal-body" @submit.prevent="handleSubmit">
        <!-- Section 1: Basic Info -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-info-circle"></i>
            <span>基本信息</span>
          </div>

          <div class="uni-form-grid uni-form-grid--3col">
            <div class="uni-form-field">
              <label class="uni-form-label">
                <i class="pi pi-calendar"></i>
                订单日期 <span class="required">*</span>
              </label>
              <Calendar
                v-model="orderDate"
                date-format="yy-mm-dd"
                show-icon
                class="w-full"
                :pt="{ input: { class: 'w-full' } }"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">
                <i class="pi pi-globe"></i>
                销售地 <span class="required">*</span>
              </label>
              <Dropdown
                v-model="formData.countryCode"
                :options="countryOptions"
                option-label="name"
                option-value="code"
                placeholder="请选择..."
                class="w-full"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">
                <i class="pi pi-tag"></i>
                SKU <span class="required">*</span>
              </label>
              <Dropdown
                v-model="formData.productId"
                :options="allProducts"
                option-label="label"
                option-value="id"
                placeholder="请选择..."
                class="w-full"
                filter
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">颜色 <span class="required">*</span></label>
              <InputText
                v-model="formData.productColor"
                class="w-full"
                placeholder="如：黑色"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">产品规格 <span class="required">*</span></label>
              <InputText
                v-model="formData.productSpec"
                class="w-full"
                placeholder="如：同款"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">插头 <span class="required">*</span></label>
              <InputText
                v-model="formData.plugSpec"
                class="w-full"
                placeholder="如：欧规"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">
                <i class="pi pi-hashtag"></i>
                数量 <span class="required">*</span>
              </label>
              <InputNumber
                v-model="formData.quantity"
                :min="0"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">
                <i class="pi pi-dollar"></i>
                单价 ($) <span class="required">*</span>
              </label>
              <InputNumber
                v-model="formData.unitPrice"
                :min="0"
                :max-fraction-digits="2"
                mode="decimal"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">总价 ($)</label>
              <InputText
                :value="'$' + totalPrice.toFixed(2)"
                disabled
                class="w-full text-right"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Logistics -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-truck"></i>
            <span>物流预填（可选）</span>
          </div>

          <div class="uni-form-grid uni-form-grid--3col">
            <div class="uni-form-field">
              <label class="uni-form-label">计费方式</label>
              <Dropdown
                v-model="formData.billingMethod"
                :options="billingOptions"
                option-label="label"
                option-value="value"
                placeholder="未确定"
                show-clear
                class="w-full"
              />
            </div>

            <div v-if="formData.billingMethod === 'BY_CBM'" class="uni-form-field">
              <label class="uni-form-label">计费体积 (CBM)</label>
              <InputNumber
                v-model="formData.billingCbm"
                :min="0"
                :max-fraction-digits="3"
                mode="decimal"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <div v-if="formData.billingMethod === 'BY_WEIGHT'" class="uni-form-field">
              <label class="uni-form-label">计费重量 (KG)</label>
              <InputNumber
                v-model="formData.billingKg"
                :min="0"
                :max-fraction-digits="2"
                mode="decimal"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <div v-if="formData.billingMethod && formData.billingMethod !== 'FLAT_FEE'" class="uni-form-field">
              <label class="uni-form-label">物流单价</label>
              <InputNumber
                v-model="formData.logisticsUnitPrice"
                :min="0"
                :max-fraction-digits="2"
                mode="decimal"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <div class="uni-form-field">
              <label class="uni-form-label">预估物流费</label>
              <InputNumber
                v-model="formData.logisticsFee"
                :min="0"
                :max-fraction-digits="2"
                mode="decimal"
                :disabled="!!formData.billingMethod && formData.billingMethod !== 'FLAT_FEE'"
                class="w-full"
                input-class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Notes -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-file-edit"></i>
            <span>备注</span>
          </div>

          <div class="uni-form-field">
            <Textarea
              v-model="formData.notes"
              rows="3"
              auto-resize
              class="w-full"
              placeholder="添加备注信息（可选）..."
            />
          </div>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
      </form>

      <!-- Footer -->
      <div class="uni-modal-footer" style="padding: 1rem 1.5rem; margin-top: 0;">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button
          label="创建批次"
          icon="pi pi-check"
          :loading="isSubmitting"
          :disabled="isLoadingOptions"
          @click="handleSubmit"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';
import { useCountriesStore } from '@/stores/countries';

type CountryOption = {
  code: string;
  name: string;
};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  label: string;
};

type BillingMethod = '' | 'BY_CBM' | 'BY_WEIGHT' | 'FLAT_FEE';

type FormState = {
  productId: string;
  countryCode: string;
  notes: string;
  productColor: string;
  productSpec: string;
  plugSpec: string;
  quantity: number | null;
  unitPrice: number | null;
  billingMethod: BillingMethod;
  billingCbm: number | null;
  billingKg: number | null;
  logisticsUnitPrice: number | null;
  logisticsFee: number | null;
};

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'batch-created'): void;
}>();

const billingOptions = [
  { label: '按体积 (CBM)', value: 'BY_CBM' },
  { label: '按重量 (KG)', value: 'BY_WEIGHT' },
  { label: '一次性费用', value: 'FLAT_FEE' },
];

const countriesStore = useCountriesStore();
const { countries, isLoading: isLoadingCountries, error: countriesError } = storeToRefs(countriesStore);

const createDefaultForm = (): FormState => ({
  productId: '',
  countryCode: '',
  notes: '',
  productColor: '',
  productSpec: '',
  plugSpec: '',
  quantity: null,
  unitPrice: null,
  billingMethod: '',
  billingCbm: null,
  billingKg: null,
  logisticsUnitPrice: null,
  logisticsFee: null,
});

const formData = ref<FormState>(createDefaultForm());
const orderDate = ref<Date>(new Date());
const errorMessage = ref('');
const isLoadingOptions = ref(false);
const isSubmitting = ref(false);
const allProducts = ref<ProductOption[]>([]);

const countryOptions = computed<CountryOption[]>(() =>
  countries.value.slice().sort((a, b) => a.name.localeCompare(b.name)),
);

const totalPrice = computed(() => {
  const qty = formData.value.quantity ?? 0;
  const price = formData.value.unitPrice ?? 0;
  return qty * price;
});

// Auto-calculate logistics fee based on billing method
watch(
  () => [formData.value.billingMethod, formData.value.billingCbm, formData.value.billingKg, formData.value.logisticsUnitPrice],
  () => {
    const method = formData.value.billingMethod;
    const unit = formData.value.logisticsUnitPrice ?? 0;

    if (method === 'BY_CBM' && formData.value.billingCbm) {
      formData.value.logisticsFee = parseFloat((formData.value.billingCbm * unit).toFixed(2));
    } else if (method === 'BY_WEIGHT' && formData.value.billingKg) {
      formData.value.logisticsFee = parseFloat((formData.value.billingKg * unit).toFixed(2));
    }
  }
);

watch(
  () => props.isOpen,
  async (visible) => {
    if (!visible) return;
    resetForm();
    await fetchOptions();
  },
);

const onDialogToggle = (visible: boolean) => {
  if (!visible) {
    closeModal();
  }
};

const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fetchOptions = async () => {
  isLoadingOptions.value = true;
  errorMessage.value = '';
  try {
    if (!countries.value.length && !isLoadingCountries.value) {
      await countriesStore.fetchCountries();
    }
    const productsRes = await apiClient.get('/admin/products');
    const products = Array.isArray(productsRes.data) ? productsRes.data : [];
    allProducts.value = products.map((p: any) => ({
      ...p,
      label: `${p.sku} (${p.name})`,
    }));

    if (!formData.value.countryCode && countryOptions.value.length > 0) {
      formData.value.countryCode = countryOptions.value[0].code;
    }
    if (!formData.value.productId && allProducts.value.length > 0) {
      formData.value.productId = allProducts.value[0].id;
    }
  } catch (error: any) {
    console.error('加载选项失败:', error);
    errorMessage.value = countriesError.value || '无法加载 SKU 和国家列表';
  } finally {
    isLoadingOptions.value = false;
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!orderDate.value) {
    errorMessage.value = '请填写订单日期';
    return;
  }
  if (!formData.value.countryCode) {
    errorMessage.value = '请选择销售地';
    return;
  }
  if (!formData.value.productId) {
    errorMessage.value = '请选择 SKU';
    return;
  }
  if (!formData.value.productColor || !formData.value.productSpec || !formData.value.plugSpec) {
    errorMessage.value = '请填写颜色、规格、插头';
    return;
  }
  if (formData.value.quantity === null || formData.value.unitPrice === null) {
    errorMessage.value = '请填写数量和单价';
    return;
  }

  const selectedProduct = allProducts.value.find((p) => p.id === formData.value.productId);

  const orders = [
    {
      orderDate: formatDateForApi(orderDate.value),
      productId: formData.value.productId,
      skuName: selectedProduct ? selectedProduct.sku : '',
      productColor: formData.value.productColor,
      productSpec: formData.value.productSpec,
      salesRegion: formData.value.countryCode,
      plugSpec: formData.value.plugSpec,
      quantity: formData.value.quantity ?? 0,
      unitPrice: formData.value.unitPrice ?? 0,
      totalPrice: totalPrice.value ?? 0,
      billingMethod: formData.value.billingMethod || null,
      billingCbm: formData.value.billingCbm,
      billingKg: formData.value.billingKg,
      logisticsUnitPrice: formData.value.logisticsUnitPrice,
      logisticsFee: formData.value.logisticsFee,
    },
  ];

  const payload = {
    countryCode: formData.value.countryCode,
    notes: formData.value.notes?.trim() || null,
    orders,
  };

  isSubmitting.value = true;
  try {
    await apiClient.post('/admin/production/batches', payload);
    emit('batch-created');
    closeModal();
  } catch (error: any) {
    console.error('创建失败:', error);
    if (error.response?.data?.details) {
      errorMessage.value = error.response.data.details.map((d: any) => d.message).join('; ');
    } else {
      errorMessage.value = error.response?.data?.error || '操作失败';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.value = createDefaultForm();
  orderDate.value = new Date();
  errorMessage.value = '';
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* Modal Layout */
.modal-wrapper {
  display: flex;
  flex-direction: column;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.header-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  font-size: 1.125rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-secondary);
}

/* Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Label icons */
.uni-form-label i {
  color: var(--color-accent);
  font-size: 0.8125rem;
  margin-right: 0.25rem;
}

.text-right :deep(input) {
  text-align: right;
  font-family: 'SF Mono', monospace;
}
</style>

<style>
.logistics-batch-dialog .p-dialog-content {
  padding: 1.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}
</style>
