<template>
  <Dialog
    :visible="isOpen"
    modal
    header="新增生产物流批次"
    :style="{ width: '840px' }"
    @update:visible="onDialogToggle"
  >
    <div v-if="isLoadingOptions" class="p-4 text-center text-color-secondary">
      正在加载表单选项（SKU/国家）...
    </div>

    <form v-else class="flex flex-column gap-4" @submit.prevent="handleSubmit">
      <div class="grid formgrid p-fluid">
        <div class="col-12 text-sm font-semibold text-primary pb-1 border-bottom-1 surface-border">
          1. 基本信息
        </div>

        <div class="field col-12 md:col-4">
          <label for="orderDate" class="font-semibold text-sm mb-2 block">订单日期 *</label>
          <Calendar
            input-id="orderDate"
            v-model="formData.orderDate"
            date-format="yy-mm-dd"
            show-icon
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4">
          <label for="countryCode" class="font-semibold text-sm mb-2 block">销售地 *</label>
          <Dropdown
            input-id="countryCode"
            v-model="formData.countryCode"
            :options="countryOptions"
            option-label="name"
            option-value="code"
            placeholder="请选择..."
            filter
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4">
          <label for="productId" class="font-semibold text-sm mb-2 block">SKU *</label>
          <Dropdown
            input-id="productId"
            v-model="formData.productId"
            :options="allProducts"
            option-label="label"
            option-value="id"
            placeholder="请选择..."
            filter
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4">
          <label for="productColor" class="font-semibold text-sm mb-2 block">颜色 *</label>
          <InputText id="productColor" v-model="formData.productColor" placeholder="如：黑色" />
        </div>

        <div class="field col-12 md:col-4">
          <label for="productSpec" class="font-semibold text-sm mb-2 block">产品规格 *</label>
          <InputText id="productSpec" v-model="formData.productSpec" placeholder="如：同款" />
        </div>

        <div class="field col-12 md:col-4">
          <label for="plugSpec" class="font-semibold text-sm mb-2 block">插头 *</label>
          <InputText id="plugSpec" v-model="formData.plugSpec" placeholder="如：欧规" />
        </div>

        <div class="field col-12 md:col-4">
          <label for="quantity" class="font-semibold text-sm mb-2 block">数量 *</label>
          <InputNumber
            input-id="quantity"
            v-model="formData.quantity"
            :min="0"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4">
          <label for="unitPrice" class="font-semibold text-sm mb-2 block">单价 ($) *</label>
          <InputNumber
            input-id="unitPrice"
            v-model="formData.unitPrice"
            :min="0"
            mode="decimal"
            :step="0.01"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4">
          <label for="totalPrice" class="font-semibold text-sm mb-2 block">总价 ($)</label>
          <InputNumber
            input-id="totalPrice"
            :model-value="totalPrice"
            mode="decimal"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
            readonly
            disabled
          />
        </div>

        <div class="col-12 text-sm font-semibold text-primary pb-1 border-bottom-1 surface-border mt-2">
          2. 物流预填（可选）
        </div>

        <div class="field col-12 md:col-4">
          <label for="billingMethod" class="font-semibold text-sm mb-2 block">计费方式</label>
          <Dropdown
            input-id="billingMethod"
            v-model="formData.billingMethod"
            :options="billingOptions"
            option-label="label"
            option-value="value"
            placeholder="未确定"
            class="w-full"
            show-clear
          />
        </div>

        <div class="field col-12 md:col-4" v-if="formData.billingMethod === 'BY_CBM'">
          <label for="billingCbm" class="font-semibold text-sm mb-2 block">计费体积 (CBM)</label>
          <InputNumber
            input-id="billingCbm"
            v-model="formData.billingCbm"
            mode="decimal"
            :min="0"
            :step="0.001"
            :max-fraction-digits="3"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4" v-if="formData.billingMethod === 'BY_WEIGHT'">
          <label for="billingKg" class="font-semibold text-sm mb-2 block">计费重量 (KG)</label>
          <InputNumber
            input-id="billingKg"
            v-model="formData.billingKg"
            mode="decimal"
            :min="0"
            :step="0.01"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4" v-if="formData.billingMethod && formData.billingMethod !== 'FLAT_FEE'">
          <label for="logisticsUnitPrice" class="font-semibold text-sm mb-2 block">物流单价</label>
          <InputNumber
            input-id="logisticsUnitPrice"
            v-model="formData.logisticsUnitPrice"
            mode="decimal"
            :min="0"
            :step="0.01"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <div class="field col-12 md:col-4">
          <label for="logisticsFee" class="font-semibold text-sm mb-2 block">预估物流</label>
          <InputNumber
            input-id="logisticsFee"
            :model-value="logisticsFeeDisplay"
            mode="decimal"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
            :disabled="formData.billingMethod && formData.billingMethod !== 'FLAT_FEE'"
            @input="(value) => formData.logisticsFee = toNumberOrNull(value)"
          />
        </div>

        <div class="field col-12">
          <label for="notes" class="font-semibold text-sm mb-2 block">备注（可选）</label>
          <Textarea id="notes" v-model="formData.notes" rows="3" auto-resize class="w-full" />
        </div>
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <div class="flex justify-content-end gap-2">
        <Button type="button" label="取消" severity="secondary" text @click="closeModal" />
        <Button type="submit" label="创建批次" icon="pi pi-check" :loading="isSubmitting" />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
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
  orderDate: Date | null;
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
  orderDate: new Date(),
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
const errorMessage = ref('');
const isLoadingOptions = ref(false);
const isSubmitting = ref(false);
const allProducts = ref<ProductOption[]>([]);

const countryOptions = computed<CountryOption[]>(() =>
  countries.value.slice().sort((a, b) => a.name.localeCompare(b.name)),
);

const totalPrice = computed(() => {
  const qty = toNumberOrNull(formData.value.quantity);
  const price = toNumberOrNull(formData.value.unitPrice);
  if (qty === null || price === null) return 0;
  return parseFloat((qty * price).toFixed(2));
});

const estimatedLogisticsFee = computed(() => {
  const method = formData.value.billingMethod;
  const unit = toNumberOrNull(formData.value.logisticsUnitPrice);
  if (method === 'BY_CBM' && unit !== null) {
    const vol = toNumberOrNull(formData.value.billingCbm);
    return vol !== null ? parseFloat((vol * unit).toFixed(2)) : null;
  }
  if (method === 'BY_WEIGHT' && unit !== null) {
    const weight = toNumberOrNull(formData.value.billingKg);
    return weight !== null ? parseFloat((weight * unit).toFixed(2)) : null;
  }
  return null;
});

const logisticsFeeDisplay = computed(() => estimatedLogisticsFee.value ?? formData.value.logisticsFee ?? null);

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

  if (!formData.value.orderDate) {
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
      orderDate: formatDate(formData.value.orderDate),
      productId: formData.value.productId,
      skuName: selectedProduct ? selectedProduct.sku : '',
      productColor: formData.value.productColor,
      productSpec: formData.value.productSpec,
      salesRegion: formData.value.countryCode,
      plugSpec: formData.value.plugSpec,
      quantity: toNumberOrNull(formData.value.quantity) ?? 0,
      unitPrice: toNumberOrNull(formData.value.unitPrice) ?? 0,
      totalPrice: totalPrice.value ?? 0,
      billingMethod: formData.value.billingMethod || null,
      billingCbm: toNumberOrNull(formData.value.billingCbm),
      billingKg: toNumberOrNull(formData.value.billingKg),
      logisticsUnitPrice: toNumberOrNull(formData.value.logisticsUnitPrice),
      logisticsFee: estimatedLogisticsFee.value ?? toNumberOrNull(formData.value.logisticsFee),
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
  errorMessage.value = '';
};

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isNaN(num) ? null : num;
};

const closeModal = () => {
  emit('close');
};
</script>
