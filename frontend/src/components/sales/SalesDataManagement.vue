<template>
  <div class="space-y-4">
    <Card class="shadow-1 border-round-2xl">
      <template #title>筛选条件</template>
      <template #content>
        <div class="grid formgrid p-fluid">
          <div class="field col-12 md:col-3">
            <label class="font-semibold text-sm mb-2 block">开始日期</label>
            <Calendar v-model="filters.startDate" date-format="yy-mm-dd" show-icon class="w-full" />
          </div>
          <div class="field col-12 md:col-3">
            <label class="font-semibold text-sm mb-2 block">结束日期</label>
            <Calendar v-model="filters.endDate" date-format="yy-mm-dd" show-icon class="w-full" />
          </div>
          <div class="field col-12 md:col-2">
            <label class="font-semibold text-sm mb-2 block">国家</label>
            <Dropdown
              v-model="filters.countryCode"
              :options="countryOptions"
              option-label="name"
              option-value="code"
              placeholder="全部国家"
              show-clear
              filter
              class="w-full"
            />
          </div>
          <div class="field col-12 md:col-2">
            <label class="font-semibold text-sm mb-2 block">平台</label>
            <Dropdown
              v-model="filters.platform"
              :options="platformOptions"
              placeholder="全部平台"
              show-clear
              class="w-full"
            />
          </div>
          <div class="field col-12 md:col-2">
            <label class="font-semibold text-sm mb-2 block">店铺</label>
            <Dropdown
              v-model="filters.storeId"
              :options="storeOptions"
              option-label="name"
              option-value="id"
              placeholder="全部店铺"
              show-clear
              filter
              :disabled="storeOptions.length === 0"
              class="w-full"
            />
          </div>
          <div class="field col-12 md:col-2">
            <label class="font-semibold text-sm mb-2 block">订单状态</label>
            <Dropdown
              v-model="filters.orderStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="全部状态"
              show-clear
              class="w-full"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="重置" severity="secondary" text icon="pi pi-refresh" @click="resetFilters" />
          <Button label="查询" icon="pi pi-search" @click="fetchData(true)" />
        </div>
      </template>
    </Card>

    <Message v-if="errorMessage" severity="error" :closable="false" class="w-full">
      {{ errorMessage }}
    </Message>

    <DataTable
      v-model:sortField="sorting.by"
      :sortOrder="sorting.order === 'asc' ? 1 : -1"
      :value="salesData"
      data-key="id"
      :loading="isLoading"
      :paginator="true"
      :rows="pageSize"
      :total-records="total"
      :lazy="true"
      :first="(page - 1) * pageSize"
      class="shadow-1 border-round-2xl"
      @page="onPage"
      @sort="onSort"
    >
      <template #header>
        <div class="flex justify-between items-center w-full">
          <div>
            <h3 class="text-lg font-semibold text-color m-0">销售数据管理</h3>
            <p class="text-sm text-color-secondary m-0">支持分页、排序与筛选</p>
          </div>
          <span class="text-sm text-color-secondary">共 {{ total }} 条</span>
        </div>
      </template>

      <template #empty>
        <div class="text-center py-4 text-color-secondary">未找到符合条件的数据。</div>
      </template>

      <Column field="recordDate" header="日期" sortable style="width: 8rem">
        <template #body="{ data }">
          {{ formatDate(data.recordDate) }}
        </template>
      </Column>
      <Column header="国家" style="width: 6rem">
        <template #body="{ data }">
          {{ data.store?.country?.name || data.store?.country?.code || '-' }}
        </template>
      </Column>
      <Column header="店铺" style="width: 10rem">
        <template #body="{ data }">
          {{ data.store?.name || '-' }}
        </template>
      </Column>
      <Column header="商品链接 / SKU" style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex flex-column gap-1">
            <span class="font-semibold text-primary">
              {{ data.listing?.productCode || '未关联' }}
            </span>
            <small class="text-color-secondary">
              {{ data.product?.sku || 'SKU 缺失' }}
              <span v-if="!data.listing" class="ml-1 text-500">(旧数据)</span>
            </small>
          </div>
        </template>
      </Column>
      <Column field="orderStatus" header="状态" style="width: 8rem">
        <template #body="{ data }">
          <Tag
            v-if="data.orderStatus"
            :value="ORDER_STATUS_MAP[data.orderStatus] || data.orderStatus"
            :severity="statusSeverity(data.orderStatus)"
            rounded
          />
          <span v-else class="text-color-secondary">-</span>
        </template>
      </Column>
      <Column field="salesVolume" header="销量" sortable style="width: 6rem" />
      <Column field="revenue" header="销售额" sortable style="width: 8rem">
        <template #body="{ data }">
          {{ formatNumber(data.revenue) }}
        </template>
      </Column>
      <Column header="备注" style="min-width: 12rem">
        <template #body="{ data }">
          <span :title="data.notes || ''" class="text-ellipsis">
            {{ data.notes || 'N/A' }}
          </span>
        </template>
      </Column>
      <Column header="录入人" style="width: 8rem">
        <template #body="{ data }">
          {{ data.enteredBy?.nickname || '-' }}
        </template>
      </Column>
      <Column header="操作" style="width: 9rem">
        <template #body="{ data }">
          <div v-if="data.canManage" class="flex gap-2">
            <Button label="修改" size="small" text @click="openEditModal(data)" />
            <Button
              label="删除"
              size="small"
              severity="danger"
              text
              @click="handleDelete(data.id)"
            />
          </div>
          <span v-else class="text-color-secondary text-sm">无权限</span>
        </template>
      </Column>
    </DataTable>

    <SalesDataEditModal
      :is-open="isModalOpen"
      :sale-data-to-edit="selectedSaleData"
      @close="closeModal"
      @sale-updated="handleSaleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import { useAuthStore } from '@/stores/auth';
import useStoreListings from '@/composables/useStoreListings';
import SalesDataEditModal from './SalesDataEditModal.vue';
import { salesService } from '@/services/salesService';

type CountryOption = { code: string; name: string };
type StoreOption = { id: string; name: string; countryCode: string; platform: string; country?: CountryOption };
type OrderStatus =
  | 'PENDING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED';

type SalesRow = {
  id: string;
  recordDate: string;
  storeId: string;
  store?: {
    id?: string;
    name?: string;
    country?: CountryOption;
    countryCode: string;
    platform: string;
  };
  listing?: { productCode?: string | null };
  product?: { sku?: string | null };
  orderStatus?: OrderStatus | null;
  salesVolume: number;
  revenue: number;
  notes?: string | null;
  enteredBy?: { nickname?: string | null };
  canManage?: boolean;
};

type SalesQueryParams = {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  countryCode?: string;
  platform?: string;
  storeId?: string;
  orderStatus?: string;
};

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
};

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: '待付款',
  READY_TO_SHIP: '待发货',
  SHIPPED: '已发货',
  DELIVERED: '已送达',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  RETURNED: '已退货',
};

const salesData = ref<SalesRow[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const authStore = useAuthStore();

const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const statusOptions = Object.entries(ORDER_STATUS_MAP).map(([value, label]) => ({ value, label }));

const { stores, fetchStores, storesError } = useStoreListings();

type Filters = {
  startDate: Date | null;
  endDate: Date | null;
  countryCode: string | null;
  platform: string | null;
  storeId: string | null;
  orderStatus: OrderStatus | null;
};

const defaultFilters = (): Filters => ({
  startDate: null,
  endDate: null,
  countryCode: null,
  platform: null,
  storeId: null,
  orderStatus: null,
});

const filters = ref<Filters>(defaultFilters());
const sorting = ref<{ by: string; order: 'asc' | 'desc' }>({ by: 'recordDate', order: 'desc' });

const countryOptions = computed<CountryOption[]>(() => {
  const unique = new Map<string, CountryOption>();
  stores.value.forEach((store: StoreOption) => {
    if (store.country) {
      unique.set(store.country.code, store.country);
    }
  });
  const all = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  if (authStore.role === 'admin') return all;
  const allowed = authStore.operatedCountries || [];
  return all.filter((country) => allowed.includes(country.code));
});

const platformOptions = computed(() => {
  let list = stores.value as StoreOption[];
  if (filters.value.countryCode) {
    list = list.filter((store) => store.countryCode === filters.value.countryCode);
  }
  return Array.from(new Set(list.map((store) => store.platform))).sort();
});

const storeOptions = computed<StoreOption[]>(() => {
  let list = stores.value as StoreOption[];
  if (filters.value.countryCode) {
    list = list.filter((store) => store.countryCode === filters.value.countryCode);
  }
  if (filters.value.platform) {
    list = list.filter((store) => store.platform === filters.value.platform);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
});

watch(
  () => storesError.value,
  (val) => {
    if (val) {
      errorMessage.value = val;
    }
    filters.value.storeId = null;
  },
);

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '0.00');

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const statusSeverity = (status: string | undefined | null) => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'RETURNED':
      return 'danger';
    case 'READY_TO_SHIP':
    case 'SHIPPED':
      return 'info';
    default:
      return 'secondary';
  }
};

const onPage = (event: DataTablePageEvent) => {
  page.value = (event.page ?? 0) + 1;
  pageSize.value = event.rows ?? pageSize.value;
  fetchData();
};

const onSort = (event: DataTableSortEvent) => {
  if (event.sortField) {
    sorting.value.by = event.sortField as string;
  }
  sorting.value.order = event.sortOrder === 1 ? 'asc' : 'desc';
  fetchData();
};

const buildParams = (): SalesQueryParams => {
  const params: SalesQueryParams = {
    sortBy: sorting.value.by,
    sortOrder: sorting.value.order,
    page: page.value,
    pageSize: pageSize.value,
  };

  const { startDate, endDate, countryCode, platform, storeId, orderStatus } = filters.value;

  if (startDate) params.startDate = formatDateInput(startDate);
  if (endDate) params.endDate = formatDateInput(endDate);
  if (countryCode) params.countryCode = countryCode;
  if (platform) params.platform = platform;
  if (storeId) params.storeId = storeId;
  if (orderStatus) params.orderStatus = orderStatus;

  return params;
};

const formatDateInput = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const resetFilters = () => {
  filters.value = defaultFilters();
  sorting.value = { by: 'recordDate', order: 'desc' };
  page.value = 1;
  fetchData();
};

const fetchData = async (resetPage = false) => {
  if (resetPage) {
    page.value = 1;
  }
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = buildParams();
    const data = await salesService.getSalesData(params);

    if (Array.isArray(data)) {
      salesData.value = data;
      total.value = data.length;
    } else {
      const paged = data as PaginatedResponse<SalesRow>;
      salesData.value = paged.data;
      total.value = paged.total;
      page.value = paged.page;
    }
  } catch (error) {
    console.error('获取销售数据失败', error);
    errorMessage.value = '获取数据失败，请重试。';
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这条销售数据吗？此操作不可逆。')) return;
  try {
    await salesService.delete(id);
    salesData.value = salesData.value.filter((row) => row.id !== id);
    total.value = Math.max(0, total.value - 1);
  } catch (error: any) {
    console.error('删除失败:', error);
    errorMessage.value = error.response?.data?.error || '删除失败，请重试。';
  }
};

const isModalOpen = ref(false);
const selectedSaleData = ref<SalesRow | null>(null);

const openEditModal = (row: SalesRow) => {
  selectedSaleData.value = row;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedSaleData.value = null;
};

const handleSaleUpdated = (updatedRow: SalesRow) => {
  const index = salesData.value.findIndex((row) => row.id === updatedRow.id);
  if (index !== -1) {
    salesData.value[index] = updatedRow;
  }
  closeModal();
};

onMounted(async () => {
  await fetchStores();
  fetchData();
});
</script>

<style scoped>
.text-ellipsis {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
