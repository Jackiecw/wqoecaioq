<template>
  <Dialog
    :visible="isOpen"
    modal
    :style="{ width: '640px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :dismissableMask="true"
    :draggable="false"
    header="修改销售数据"
    class="p-dialog-custom"
    @update:visible="onDialogToggle"
  >
    <div v-if="isLoading" class="p-8 text-center text-[var(--color-text-secondary)]">
      <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
      <p>正在加载表单选项...</p>
    </div>

    <form v-else class="flex flex-col gap-6 pt-1" @submit.prevent="handleSubmit">
      <Toast />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Date -->
        <div class="flex flex-col gap-2">
          <label for="edit_recordDate" class="text-sm font-medium text-[var(--color-text-secondary)]">记录日期 <span class="text-red-500">*</span></label>
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
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">国家 <span class="text-red-500">*</span></label>
          <Dropdown
            v-model="selectedCountry"
            :options="countryOptions"
            option-label="name"
            option-value="code"
            placeholder="请选择国家..."
            filter
            class="w-full"
          />
        </div>

        <!-- Platform -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">平台 <span class="text-red-500">*</span></label>
          <Dropdown
            v-model="selectedPlatform"
            :options="platformOptions"
            placeholder="请选择平台..."
            :disabled="!selectedCountry"
            filter
            class="w-full"
          />
        </div>

        <!-- Store -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">店铺名称 <span class="text-red-500">*</span></label>
          <Dropdown
            v-model="formData.storeId"
            :options="storeOptions"
            option-label="name"
            option-value="id"
            placeholder="请选择店铺..."
            :disabled="!selectedPlatform"
            filter
            class="w-full"
          />
        </div>

        <!-- Listing (Full Width) -->
        <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
            选择商品链接 (Listing) <span class="text-red-500">*</span>
            <span class="text-xs font-normal text-gray-400">格式: [商品代码] 标题 (SKU)</span>
          </label>
          <Dropdown
            v-model="formData.listingId"
            :options="listingOptions"
            option-label="displayLabel"
            option-value="id"
            placeholder="请选择具体链接..."
            :disabled="!formData.storeId || isLoadingListings"
            :loading="isLoadingListings"
            filter
            class="w-full"
            panel-class="max-w-[600px]"
          >
             <template #option="slotProps">
              <div class="flex flex-col py-1">
                <span class="font-medium text-sm text-[var(--color-text-primary)]">{{ slotProps.option.displayLabel }}</span>
                <span v-if="slotProps.option.product?.sku" class="text-xs text-[var(--color-text-secondary)] mt-0.5">SKU: {{ slotProps.option.product.sku }}</span>
              </div>
            </template>
          </Dropdown>
           <p v-if="!saleDataToEdit?.listingId && !formData.listingId" class="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            <i class="pi pi-info-circle mr-1"></i>
            提示：这是旧数据，请重新关联到一个具体的商品链接
          </p>
        </div>

        <!-- Sales Volume -->
        <div class="flex flex-col gap-2">
          <label for="edit_salesVolume" class="text-sm font-medium text-[var(--color-text-secondary)]">销量 <span class="text-red-500">*</span></label>
          <InputNumber
            input-id="edit_salesVolume"
            v-model="formData.salesVolume"
            :min="0"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <!-- Revenue -->
        <div class="flex flex-col gap-2">
          <label for="edit_revenue" class="text-sm font-medium text-[var(--color-text-secondary)]">销售额 <span class="text-red-500">*</span></label>
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
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">订单状态</label>
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

        <!-- Notes (Full Width) -->
        <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
          <label for="edit_notes" class="text-sm font-medium text-[var(--color-text-secondary)]">备注（可选）</label>
          <Textarea id="edit_notes" v-model="formData.notes" rows="3" auto-resize class="w-full" />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button type="button" label="取消" severity="secondary" text @click="closeModal" />
        <Button type="submit" label="保存修改" icon="pi pi-check" :loading="isSubmitting" />
      </div>
    </form>
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
  revenue: number;
  notes?: string | null;
  orderStatus?: string | null;
};

type SaleFormState = {
  recordDate: Date | null;
  storeId: string;
  listingId: string;
  salesVolume: number;
  revenue: number;
  notes: string;
  orderStatus: string | null;
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

  formData.value = {
    recordDate: parseDateInput(data.recordDate),
    storeId: data.storeId,
    listingId: data.listingId || '',
    salesVolume: data.salesVolume ?? 0,
    revenue: data.revenue ?? 0,
    notes: data.notes || '',
    orderStatus: data.orderStatus || null,
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
