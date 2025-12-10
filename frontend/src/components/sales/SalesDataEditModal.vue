<template>
  <Dialog
    :visible="isOpen"
    modal
    :showHeader="false"
    :style="{ width: '720px' }"
    :breakpoints="{ '960px': '85vw', '640px': '95vw' }"
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'sales-edit-dialog' },
      content: { class: 'sales-edit-content' },
      mask: { class: 'sales-edit-mask' }
    }"
    @update:visible="onDialogToggle"
  >
    <div class="modal-wrapper">
      <!-- Custom Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-pencil"></i>
          </div>
          <div>
            <h3 class="modal-title">修改销售数据</h3>
            <p class="modal-subtitle">编辑销售记录的详细信息</p>
          </div>
        </div>
        <button class="close-btn" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>正在加载表单选项...</p>
      </div>

      <!-- Form -->
      <form v-else class="modal-body" @submit.prevent="handleSubmit">
        <Toast />

        <!-- Section: 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <i class="pi pi-calendar"></i>
            <span>基本信息</span>
          </div>
          <div class="form-grid">
            <!-- Date -->
            <div class="form-field">
              <label for="edit_recordDate">记录日期 <span class="required">*</span></label>
              <Calendar
                input-id="edit_recordDate"
                v-model="formData.recordDate"
                date-format="yy-mm-dd"
                show-icon
                class="w-full"
                :pt="{ input: { class: 'w-full' } }"
              />
            </div>

            <!-- Country -->
            <div class="form-field">
              <label>国家 <span class="required">*</span></label>
              <Dropdown
                v-model="selectedCountry"
                :options="countryOptions"
                option-label="name"
                option-value="code"
                placeholder="请选择国家..."
                class="w-full"
              />
            </div>

            <!-- Platform -->
            <div class="form-field">
              <label>平台 <span class="required">*</span></label>
              <Dropdown
                v-model="selectedPlatform"
                :options="platformOptions"
                placeholder="请选择平台..."
                :disabled="!selectedCountry"
                class="w-full"
              />
            </div>

            <!-- Store -->
            <div class="form-field">
              <label>店铺名称 <span class="required">*</span></label>
              <Dropdown
                v-model="formData.storeId"
                :options="storeOptions"
                option-label="name"
                option-value="id"
                placeholder="请选择店铺..."
                :disabled="!selectedPlatform"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Section: 商品链接 -->
        <div class="form-section">
          <div class="section-title">
            <i class="pi pi-link"></i>
            <span>商品链接</span>
          </div>
          <div class="form-field full-width">
            <label>
              选择商品链接 (Listing) <span class="required">*</span>
              <span class="label-hint">格式: [商品代码] 标题 (SKU)</span>
            </label>
            <Dropdown
              v-model="formData.listingId"
              :options="listingOptions"
              option-label="displayLabel"
              option-value="id"
              placeholder="请选择具体链接..."
              :disabled="!formData.storeId || isLoadingListings"
              :loading="isLoadingListings"
              class="w-full"
              panel-class="listing-dropdown-panel"
            >
              <template #option="slotProps">
                <div class="listing-option">
                  <span class="listing-title">{{ slotProps.option.displayLabel }}</span>
                  <span v-if="slotProps.option.product?.sku" class="listing-sku">SKU: {{ slotProps.option.product.sku }}</span>
                </div>
              </template>
            </Dropdown>
            <div v-if="!saleDataToEdit?.listingId && !formData.listingId" class="field-hint warning">
              <i class="pi pi-info-circle"></i>
              <span>提示：这是旧数据，请重新关联到一个具体的商品链接</span>
            </div>
          </div>
        </div>

        <!-- Section: 销售数据 -->
        <div class="form-section">
          <div class="section-title">
            <i class="pi pi-chart-line"></i>
            <span>销售数据</span>
          </div>
          <div class="form-grid cols-3">
            <!-- Sales Volume -->
            <div class="form-field">
              <label for="edit_salesVolume">销量 <span class="required">*</span></label>
              <InputNumber
                input-id="edit_salesVolume"
                v-model="formData.salesVolume"
                :min="0"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <!-- Revenue -->
            <div class="form-field">
              <label for="edit_revenue">销售额 <span class="required">*</span></label>
              <InputNumber
                input-id="edit_revenue"
                v-model="formData.revenue"
                :min="0"
                :step="0.01"
                mode="decimal"
                :max-fraction-digits="2"
                class="w-full"
                input-class="w-full"
              />
            </div>

            <!-- Order Status -->
            <div class="form-field">
              <label>订单状态</label>
              <Dropdown
                v-model="formData.orderStatus"
                :options="orderStatusOptions"
                option-label="label"
                option-value="value"
                placeholder="未设置"
                show-clear
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Section: 结算信息 -->
        <div class="form-section">
          <div class="section-title">
            <i class="pi pi-wallet"></i>
            <span>结算信息</span>
          </div>
          <div class="form-grid cols-2">
            <!-- Settlement Date -->
            <div class="form-field">
              <label for="edit_settlementDate">结算时间</label>
              <Calendar
                input-id="edit_settlementDate"
                v-model="formData.settlementDate"
                date-format="yy/mm/dd"
                show-icon
                class="w-full"
                :pt="{ input: { class: 'w-full' } }"
                placeholder="选择结算日期"
              />
            </div>

            <!-- Settlement Amount -->
            <div class="form-field">
              <label for="edit_settlementAmount">结算金额</label>
              <InputNumber
                input-id="edit_settlementAmount"
                v-model="formData.settlementAmount"
                :min="0"
                :step="0.01"
                mode="decimal"
                :max-fraction-digits="2"
                class="w-full"
                input-class="w-full"
                placeholder="输入结算金额"
              />
            </div>
          </div>

          <!-- Cancel Reason -->
          <div class="form-field full-width" style="margin-top: 1rem;">
            <label for="edit_cancelReason">取消/退货原因</label>
            <Textarea
              id="edit_cancelReason"
              v-model="formData.cancelReason"
              rows="2"
              auto-resize
              class="w-full"
              placeholder="如有取消或退货，请填写原因（可选）..."
            />
          </div>
        </div>

        <!-- Section: 备注 -->
        <div class="form-section">
          <div class="section-title">
            <i class="pi pi-file-edit"></i>
            <span>备注</span>
          </div>
          <div class="form-field full-width">
            <Textarea id="edit_notes" v-model="formData.notes" rows="3" auto-resize class="w-full" placeholder="输入备注信息（可选）..." />
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <Button type="button" label="取消" severity="secondary" outlined @click="closeModal" />
          <Button type="submit" label="保存修改" icon="pi pi-check" :loading="isSubmitting" />
        </div>
      </form>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';
import useStoreListings from '@/composables/useStoreListings';

type CountryOption = {
  code: string;
  name: string;
};

type StoreOption = {
  id: string;
  name: string;
  countryCode: string;
  platform: string;
  country?: CountryOption;
};

type ListingOption = {
  id: string;
  productCode?: string | null;
  storeTitle?: string | null;
  title?: string | null;
  sku?: string | null;
  productId?: string | null;
  product?: {
    id: string;
    sku: string;
  } | null;
};

type SaleData = {
  id: string;
  recordDate: string;
  storeId: string;
  listingId?: string | null;
  store?: {
    countryCode: string;
    platform: string;
  };
  salesVolume: number;
  revenue: number | string;
  notes?: string | null;
  orderStatus?: string | null;
  // 新增字段
  cancelReason?: string | null;
  settlementDate?: string | null;
  settlementAmount?: number | string | null;
};

type SaleFormState = {
  recordDate: Date | null;
  storeId: string;
  listingId: string;
  salesVolume: number;
  revenue: number;
  notes: string;
  orderStatus: string | null;
  // 新增字段
  cancelReason: string;
  settlementDate: Date | null;
  settlementAmount: number | null;
};

const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待付款' },
  { value: 'READY_TO_SHIP', label: '待发货' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'DELIVERED', label: '已送达' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'RETURNED', label: '已退货' },
];

const props = defineProps<{
  isOpen: boolean;
  saleDataToEdit: SaleData | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'sale-updated', payload: unknown): void;
}>();

const authStore = useAuthStore();
const toast = useToast();
const { stores, fetchStores, storesError, getStoresByCountry, getStoresByCountryAndPlatform, fetchListings } =
  useStoreListings();

const formData = ref<SaleFormState>({
  recordDate: null,
  storeId: '',
  listingId: '',
  salesVolume: 0,
  revenue: 0,
  notes: '',
  orderStatus: null,
  cancelReason: '',
  settlementDate: null,
  settlementAmount: null,
});

const isLoading = ref(false);
const isSubmitting = ref(false);
const isLoadingListings = ref(false);
const storeListings = ref<ListingOption[]>([]);
const selectedCountry = ref('');
const selectedPlatform = ref('');

const orderStatusOptions = ORDER_STATUS_OPTIONS;

const countryOptions = computed<CountryOption[]>(() => {
  const map = new Map<string, CountryOption>();
  stores.value.forEach((store) => {
    if (store.country) {
      map.set(store.country.code, store.country);
    }
  });
  const all = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  if (authStore.role === 'admin') return all;
  return all.filter((country) => authStore.operatedCountries.includes(country.code));
});

const platformOptions = computed(() => {
  if (!selectedCountry.value) return [];
  const platforms = getStoresByCountry(selectedCountry.value).map((store: StoreOption) => store.platform);
  return Array.from(new Set(platforms)).sort();
});

const storeOptions = computed<StoreOption[]>(() => {
  if (!selectedCountry.value || !selectedPlatform.value) return [];
  return getStoresByCountryAndPlatform(selectedCountry.value, selectedPlatform.value).sort((a: StoreOption, b: StoreOption) =>
    a.name.localeCompare(b.name),
  );
});

const listingOptions = computed(() =>
  storeListings.value.map((listing) => ({
    ...listing,
    displayLabel: buildListingLabel(listing),
  })),
);

watch(
  () => storesError.value,
  (val) => {
    if (val) {
      toast.add({ severity: 'error', summary: 'Error', detail: val, life: 3000 });
    }
  },
);

watch(selectedCountry, () => {
  selectedPlatform.value = '';
  formData.value.storeId = '';
  formData.value.listingId = '';
  storeListings.value = [];
});

watch(selectedPlatform, () => {
  formData.value.storeId = '';
  formData.value.listingId = '';
  storeListings.value = [];
});

watch(
  () => formData.value.storeId,
  async (newStoreId, oldStoreId) => {
    if (newStoreId === oldStoreId) return;
    formData.value.listingId = '';
    storeListings.value = [];
    if (!newStoreId) return;

    isLoadingListings.value = true;
    try {
      const listings = await fetchListings(newStoreId);
      storeListings.value = Array.isArray(listings) ? listings : [];
    } catch (error) {
       toast.add({ severity: 'error', summary: '加载失败', detail: '无法加载店铺链接', life: 3000 });
    } finally {
      isLoadingListings.value = false;
    }
  },
);

watch(
  () => props.isOpen,
  async (visible) => {
    if (!visible) return;
    if (!props.saleDataToEdit) {
      toast.add({ severity: 'warn', summary: '提示', detail: '未找到要编辑的销售数据', life: 3000 });
      return;
    }

    isLoading.value = true;

    try {
      await fetchStores();
      hydrateForm(props.saleDataToEdit);
      if (formData.value.storeId) {
        isLoadingListings.value = true;
        try {
          const listings = await fetchListings(formData.value.storeId, true);
          storeListings.value = Array.isArray(listings) ? listings : [];
        } finally {
          isLoadingListings.value = false;
        }
      }
    } catch (error) {
       toast.add({ severity: 'error', summary: '错误', detail: extractError(error, '加载数据失败'), life: 3000 });
    } finally {
      isLoading.value = false;
    }
  },
);

const onDialogToggle = (visible: boolean) => {
  if (!visible) {
    closeModal();
  }
};

const handleSubmit = async () => {
  if (!props.saleDataToEdit) return;


  if (!formData.value.recordDate) {
    toast.add({ severity: 'warn', summary: '请填写记录日期', life: 3000 });
    return;
  }
  if (!formData.value.storeId) {
    toast.add({ severity: 'warn', summary: '请选择店铺', life: 3000 });
    return;
  }
  if (!formData.value.listingId) {
    toast.add({ severity: 'warn', summary: '请选择一个商品链接', life: 3000 });
    return;
  }

  const targetListing = storeListings.value.find((item) => item.id === formData.value.listingId);
  const productId = targetListing?.product?.id || targetListing?.productId || null;
  if (!productId) {
    toast.add({ severity: 'error', summary: '数据错误', detail: '链接数据缺少对应商品，无法提交', life: 3000 });
    return;
  }

  const payload = {
    recordDate: formatDate(formData.value.recordDate),
    storeId: formData.value.storeId,
    listingId: formData.value.listingId,
    productId,
    salesVolume: Number.isFinite(formData.value.salesVolume) ? formData.value.salesVolume : 0,
    revenue: Number.isFinite(formData.value.revenue) ? formData.value.revenue : 0,
    notes: formData.value.notes?.trim() || null,
    orderStatus: formData.value.orderStatus || null,
    cancelReason: formData.value.cancelReason?.trim() || null,
    settlementDate: formData.value.settlementDate ? formatDate(formData.value.settlementDate) : null,
    settlementAmount: Number.isFinite(formData.value.settlementAmount) ? formData.value.settlementAmount : null,
  };

  isSubmitting.value = true;
  try {
    const response = await apiClient.put(`/sales-data/${props.saleDataToEdit.id}`, payload);
    emit('sale-updated', response.data);
    closeModal();
    toast.add({ severity: 'success', summary: '成功', detail: '销售数据已更新', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: '更新失败', detail: extractError(error, '请稍后重试'), life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
};

const hydrateForm = (data: SaleData) => {
  selectedCountry.value = data.store?.countryCode || '';
  selectedPlatform.value = data.store?.platform || '';

  const revenueNum = typeof data.revenue === 'string' ? parseFloat(data.revenue) : (data.revenue ?? 0);
  const settlementAmountNum = data.settlementAmount 
    ? (typeof data.settlementAmount === 'string' ? parseFloat(data.settlementAmount) : data.settlementAmount)
    : null;

  formData.value = {
    recordDate: parseDateInput(data.recordDate),
    storeId: data.storeId,
    listingId: data.listingId || '',
    salesVolume: data.salesVolume ?? 0,
    revenue: Number.isFinite(revenueNum) ? revenueNum : 0,
    notes: data.notes || '',
    orderStatus: data.orderStatus || null,
    cancelReason: data.cancelReason || '',
    settlementDate: parseDateInput(data.settlementDate),
    settlementAmount: Number.isFinite(settlementAmountNum) ? settlementAmountNum : null,
  };
};

const buildListingLabel = (listing: ListingOption) => {
  const code = listing.productCode ? `[${listing.productCode}] ` : '';
  const title = listing.storeTitle || listing.title || '未命名链接';
  const sku = listing.product?.sku || listing.sku || '';
  return sku ? `${code}${title} (${sku})` : `${code}${title}`;
};

const parseDateInput = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractError = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
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
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--color-text-secondary);
  gap: 0.75rem;
}

.loading-state i {
  font-size: 1.5rem;
}

/* Form Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Form Sections */
.form-section {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section-title i {
  color: var(--color-accent);
  font-size: 0.875rem;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 640px) {
  .form-grid,
  .form-grid.cols-3 {
    grid-template-columns: 1fr;
  }
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required {
  color: #ef4444;
}

.label-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 0.5rem;
}

/* Field Hints */
.field-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  margin-top: 0.25rem;
}

.field-hint.warning {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.field-hint i {
  font-size: 0.75rem;
}

/* Listing Dropdown */
.listing-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem 0;
}

.listing-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.listing-sku {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.25rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}
</style>

<style>
/* Global Dialog Styles */
.sales-edit-dialog .p-dialog-content {
  padding: 1.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.sales-edit-mask {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.listing-dropdown-panel {
  max-width: 600px;
}
</style>
