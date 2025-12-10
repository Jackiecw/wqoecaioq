<template>
  <Dialog
    :visible="isOpen"
    modal
    :style="{ width: '900px', maxWidth: '95vw' }"
    :pt="{
      root: { class: 'p-0' },
      header: { class: 'hidden' },
      content: { class: 'p-0' }
    }"
    @update:visible="onDialogToggle"
  >
    <div class="modal-container">
      <!-- Custom Header -->
      <div class="modal-header">
        <div class="header-info">
          <div class="header-icon">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h2 class="header-title">新增生产批次</h2>
            <p class="header-desc">填写订单信息</p>
          </div>
        </div>
        <button class="btn-close" @click="closeModal">
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
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">1</span>
            <span class="section-title">基本信息</span>
          </div>
          
          <div class="fields-grid fields-grid--3col">
            <div class="field-group">
              <label class="field-label">
                <i class="pi pi-calendar"></i>
                订单日期 <span class="required">*</span>
              </label>
              <input 
                type="date" 
                v-model="orderDateStr" 
                class="field-input" 
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label">
                <i class="pi pi-globe"></i>
                销售地 <span class="required">*</span>
              </label>
              <select v-model="formData.countryCode" class="field-select" required>
                <option value="" disabled>请选择...</option>
                <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                  {{ country.name }}
                </option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">
                <i class="pi pi-tag"></i>
                SKU <span class="required">*</span>
              </label>
              <select v-model="formData.productId" class="field-select" required>
                <option value="" disabled>请选择...</option>
                <option v-for="product in allProducts" :key="product.id" :value="product.id">
                  {{ product.label }}
                </option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">颜色 <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formData.productColor" 
                class="field-input" 
                placeholder="如：黑色"
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label">产品规格 <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formData.productSpec" 
                class="field-input" 
                placeholder="如：同款"
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label">插头 <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formData.plugSpec" 
                class="field-input" 
                placeholder="如：欧规"
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label">
                <i class="pi pi-hashtag"></i>
                数量 <span class="required">*</span>
              </label>
              <input 
                type="number" 
                v-model.number="formData.quantity" 
                class="field-input field-input--right" 
                min="0"
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label">
                <i class="pi pi-dollar"></i>
                单价 ($) <span class="required">*</span>
              </label>
              <input 
                type="number" 
                v-model.number="formData.unitPrice" 
                class="field-input field-input--right" 
                step="0.01"
                min="0"
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label">总价 ($)</label>
              <input 
                type="text" 
                :value="'$' + totalPrice.toFixed(2)" 
                class="field-input field-input--right field-input--readonly" 
                readonly
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Logistics -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">2</span>
            <span class="section-title">物流预填（可选）</span>
          </div>

          <div class="fields-grid fields-grid--3col">
            <div class="field-group">
              <label class="field-label">
                <i class="pi pi-truck"></i>
                计费方式
              </label>
              <select v-model="formData.billingMethod" class="field-select">
                <option value="">未确定</option>
                <option v-for="opt in billingOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div v-if="formData.billingMethod === 'BY_CBM'" class="field-group">
              <label class="field-label">计费体积 (CBM)</label>
              <input 
                type="number" 
                v-model.number="formData.billingCbm" 
                class="field-input field-input--right" 
                step="0.001"
                min="0"
              />
            </div>

            <div v-if="formData.billingMethod === 'BY_WEIGHT'" class="field-group">
              <label class="field-label">计费重量 (KG)</label>
              <input 
                type="number" 
                v-model.number="formData.billingKg" 
                class="field-input field-input--right" 
                step="0.01"
                min="0"
              />
            </div>

            <div v-if="formData.billingMethod && formData.billingMethod !== 'FLAT_FEE'" class="field-group">
              <label class="field-label">物流单价</label>
              <input 
                type="number" 
                v-model.number="formData.logisticsUnitPrice" 
                class="field-input field-input--right" 
                step="0.01"
                min="0"
              />
            </div>

            <div class="field-group">
              <label class="field-label">预估物流费</label>
              <input 
                type="number" 
                v-model.number="formData.logisticsFee" 
                class="field-input field-input--right" 
                :class="{ 'field-input--readonly': formData.billingMethod && formData.billingMethod !== 'FLAT_FEE' }"
                :readonly="formData.billingMethod && formData.billingMethod !== 'FLAT_FEE'"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Notes -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">3</span>
            <span class="section-title">备注</span>
          </div>

          <div class="field-group">
            <textarea 
              v-model="formData.notes" 
              class="field-textarea" 
              rows="3" 
              placeholder="添加备注信息（可选）..."
            ></textarea>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          {{ errorMessage }}
        </div>
      </form>

      <!-- Footer -->
      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="closeModal">取消</button>
        <button 
          type="button" 
          class="btn-primary" 
          :disabled="isSubmitting || isLoadingOptions"
          @click="handleSubmit"
        >
          <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-check"></i>
          {{ isSubmitting ? '创建中...' : '创建批次' }}
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Dialog from 'primevue/dialog';
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
const orderDateStr = ref(new Date().toISOString().slice(0, 10));
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

  if (!orderDateStr.value) {
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
      orderDate: orderDateStr.value,
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
  orderDateStr.value = new Date().toISOString().slice(0, 10);
  errorMessage.value = '';
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* ========================================
   Logistics Batch Form Modal - Modern UI
   ======================================== */
.modal-container {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-md);
  color: var(--color-accent);
  font-size: 1.125rem;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0.125rem 0 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--color-bg-page);
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
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.section-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Fields Grid */
.fields-grid {
  display: grid;
  gap: 1rem;
}

.fields-grid--3col {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .fields-grid--3col {
    grid-template-columns: 1fr;
  }
}

/* Field Group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-label i {
  color: var(--color-accent);
  font-size: 0.8125rem;
}

.required {
  color: #ef4444;
}

/* Inputs */
.field-input,
.field-select,
.field-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.field-input--right {
  text-align: right;
  font-family: 'SF Mono', monospace;
}

.field-input--readonly {
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 0.875rem;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.btn-secondary,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-bg-page);
  border-color: var(--color-text-secondary);
}

.btn-primary {
  background: var(--color-accent);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
