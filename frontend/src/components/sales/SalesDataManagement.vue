<template>
  <div class="sales-management">
    <Message v-if="errorMessage" severity="error" :closable="false" class="w-full">
      {{ errorMessage }}
    </Message>

    <!-- Filter Section - Matches DataImport style -->
    <ContentCard class="mb-4">
      <!-- Country Selection as Pill Tabs -->
      <div class="filter-section">
        <h3 class="filter-section-title">选择国家</h3>
        <div class="pill-tab-group">
          <button
            v-for="country in countryOptions"
            :key="country.code"
            @click="selectCountry(country.code)"
            class="pill-tab"
            :class="{ 'is-active': filters.countryCode === country.code }"
          >
            {{ country.name }}
          </button>
          <button
            v-if="filters.countryCode"
            @click="selectCountry(null)"
            class="pill-tab pill-tab--clear"
          >
            <i class="pi pi-times"></i>
            清除
          </button>
        </div>
      </div>

      <!-- Other Filters in Inline Style -->
      <div class="inline-filters">
        <div class="filter-group">
          <label class="filter-group-label">店铺</label>
          <Dropdown
            v-model="filters.storeId"
            :options="storeOptions"
            option-label="name"
            option-value="id"
            :placeholder="filters.countryCode ? '选择店铺' : '请先选择国家'"
            class="filter-dropdown"
            panelClass="clean-dropdown-panel no-filter"
            :show-clear="!!filters.storeId"
            :disabled="!filters.countryCode"
          />
        </div>

        <div class="filter-group">
          <label class="filter-group-label">日期范围</label>
          <div class="date-range-inline">
            <Calendar 
              v-model="filters.startDate" 
              date-format="yy-mm-dd" 
              placeholder="开始日期" 
              inputClass="filter-input" 
              :showIcon="true"
              iconDisplay="input"
              showButtonBar
            />
            <span class="date-range-sep">至</span>
            <Calendar 
              v-model="filters.endDate" 
              date-format="yy-mm-dd" 
              placeholder="结束日期" 
              inputClass="filter-input" 
              :showIcon="true"
              iconDisplay="input"
              showButtonBar
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-group-label">订单状态</label>
          <Dropdown
            v-model="filters.orderStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="全部状态"
            class="filter-dropdown"
            panelClass="clean-dropdown-panel no-filter"
            :show-clear="!!filters.orderStatus"
          />
        </div>

        <div class="filter-group filter-group--search">
          <label class="filter-group-label">订单搜索</label>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText 
              v-model="searchQuery" 
              placeholder="输入订单号..." 
              class="filter-search-input" 
              @keyup.enter="fetchData(true)" 
            />
          </IconField>
        </div>

        <div class="filter-group filter-group--actions">
          <span class="filter-group-label">&nbsp;</span>
          <div class="action-buttons-row">
            <Button
              label="应用筛选"
              icon="pi pi-check"
              severity="primary"
              size="small"
              @click="fetchData(true)"
            />
            <Button
              v-if="hasActiveFilters"
              label="重置"
              icon="pi pi-refresh"
              text
              severity="secondary"
              size="small"
              @click="resetFilters"
            />
          </div>
        </div>
      </div>
    </ContentCard>

    <!-- Data Table Card -->
    <div class="table-card">
      <!-- Toolbar: Actions only -->
      <div class="table-toolbar">
         <div class="toolbar-left">
           <span class="table-info">共 {{ total }} 条记录</span>
         </div>

         <!-- Right: Actions -->
         <div class="toolbar-right">
             
            <span class="divider">|</span>

            <Button
              v-if="selectedRows.length > 0"
              :label="`删除 ${selectedRows.length}`"
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="handleBatchDelete"
            />

            <div class="column-toggle-wrapper">
              <Button
                icon="pi pi-sliders-h"
                severity="secondary"
                text
                rounded
                v-tooltip="'显示列'"
                @click="showColumnMenu = !showColumnMenu"
              />
              <div v-if="showColumnMenu" class="column-menu">
                <div class="column-menu-header">显示列</div>
                <div
                  v-for="col in toggleableColumns"
                  :key="col.field"
                  class="column-menu-item"
                  @click="toggleColumn(col.field)"
                >
                  <i :class="visibleColumns.includes(col.field) ? 'pi pi-check-square' : 'pi pi-stop'"></i>
                  <span>{{ col.header }}</span>
                </div>
              </div>
            </div>
         </div>
      </div>

      <!-- Table -->
      <DataTable
        v-model:selection="selectedRows"
        v-model:sortField="sorting.by"
        :sortOrder="sorting.order === 'asc' ? 1 : -1"
        :value="salesData"
        data-key="id"
        :loading="isLoading"
        :paginator="true"
        :rows="pageSize"
        :rowsPerPageOptions="[10, 20, 50]"
        :total-records="total"
        :lazy="true"
        :first="(page - 1) * pageSize"
        rowHover
        class="modern-table"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        @page="onPage"
        @sort="onSort"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <span>暂无数据</span>
          </div>
        </template>

        <Column selectionMode="multiple" headerStyle="width: 3rem" />

        <Column v-if="visibleColumns.includes('platformOrderId')" field="platformOrderId" header="订单号" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="order-number">{{ data.platformOrderId || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('recordDate')" field="recordDate" header="下单时间" sortable style="width: 10rem">
          <template #body="{ data }">
            <span class="date-cell">{{ formatDateTime(data.recordDate) }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('country')" header="国家" style="width: 5rem">
          <template #body="{ data }">
            <span class="country-cell">{{ data.store?.country?.code || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('store')" header="店铺" style="min-width: 10rem">
          <template #body="{ data }">
            <div class="store-info">
              <span class="store-name" :title="data.store?.name">{{ data.store?.name || '-' }}</span>
              <span class="store-platform">{{ data.store?.platform || '' }}</span>
            </div>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('product')" header="商品/SKU" style="min-width: 14rem">
          <template #body="{ data }">
            <div class="product-cell">
              <span class="product-code">{{ data.listing?.productCode || '未关联' }}</span>
              <span class="product-sku">{{ data.product?.sku || 'SKU 缺失' }}</span>
            </div>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('orderStatus')" field="orderStatus" header="状态" class="text-center" headerClass="text-center" style="width: 8rem">
          <template #body="{ data }">
            <div class="flex justify-center">
                <div v-if="data.orderStatus" class="status-badge" :class="statusClass(data.orderStatus)">
                  <span>{{ ORDER_STATUS_MAP[data.orderStatus] || data.orderStatus }}</span>
                </div>
                <span v-else class="text-muted">-</span>
            </div>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('cancelReason')" header="取消/退货原因" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="notes-cell" :title="data.cancelReason || ''">{{ data.cancelReason || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('salesVolume')" field="salesVolume" header="销量" sortable class="text-right" headerClass="text-right" style="width: 6rem">
          <template #body="{ data }">
            <span class="number-cell">{{ data.salesVolume }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('revenue')" field="revenue" header="销售额" sortable class="text-right" headerClass="text-right" style="width: 8rem">
          <template #body="{ data }">
            <span class="revenue-cell">{{ formatNumber(data.revenue) }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('settlementDate')" field="settlementDate" header="结算时间" style="width: 8rem">
          <template #body="{ data }">
            <span class="date-cell">{{ formatDate(data.settlementDate) }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('settlementAmount')" field="settlementAmount" header="结算金额" class="text-right" headerClass="text-right" style="width: 8rem">
          <template #body="{ data }">
            <span class="revenue-cell">{{ formatNumber(data.settlementAmount) }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('notes')" header="备注" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="notes-cell" :title="data.notes || ''">{{ data.notes || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('enteredBy')" header="录入人" style="width: 7rem">
          <template #body="{ data }">
            {{ data.enteredBy?.nickname || '-' }}
          </template>
        </Column>

        <Column header="操作" style="width: 5rem" frozen alignFrozen="right" headerClass="text-center" class="text-center action-col">
          <template #body="{ data }">
            <div v-if="data.canManage" class="action-buttons">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                size="small"
                class="w-7 h-7"
                v-tooltip.bottom="'编辑'"
                @click="openEditModal(data)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                class="w-7 h-7"
                v-tooltip.bottom="'删除'"
                @click="handleDelete(data.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <SalesDataEditModal
      :is-open="isModalOpen"
      :sale-data-to-edit="selectedSaleData"
      @close="closeModal"
      @sale-updated="handleSaleUpdated"
    />
  </div>
</template>

<style>
/* Global style strictly for the dropdown panels in this component */
.clean-dropdown-panel {
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.05); /* Stronger layered shadow */
    margin-top: 0.25rem;
    overflow: hidden;
}

.clean-dropdown-panel .p-dropdown-items-wrapper {
    padding: 0.25rem;
}

.clean-dropdown-panel .p-dropdown-item {
    margin: 0.125rem 0;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem; /* More spacing */
    font-size: 0.875rem;
    color: var(--surface-700);
    transition: all 0.15s ease;
}

/* Hover state */
.clean-dropdown-panel .p-dropdown-item:not(.p-highlight):not(.p-disabled):hover {
    background-color: var(--surface-100);
    color: var(--surface-900);
}

/* Selected state */
.clean-dropdown-panel .p-dropdown-item.p-highlight {
    background-color: var(--primary-50);
    color: var(--primary-700);
    font-weight: 600;
}

/* Filter helper inside dropdown */
.clean-dropdown-panel .p-dropdown-filter-container {
    padding: 0.5rem;
    border-bottom: 1px solid var(--surface-100);
}
.clean-dropdown-panel .p-dropdown-filter-container .p-inputtext {
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
}

/* Hide filter search box when using no-filter class */
.clean-dropdown-panel.no-filter .p-dropdown-filter-container {
    display: none;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useAuthStore } from '@/stores/auth';
import useStoreListings from '@/composables/useStoreListings';
import SalesDataEditModal from './SalesDataEditModal.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import { salesService } from '@/services/salesService';

type CountryOption = { code: string; name: string };
type StoreOption = { id: string; name: string; countryCode: string; platform: string; country?: CountryOption };
type OrderStatus = 'PENDING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';

type SalesRow = {
  id: string;
  platformOrderId?: string | null;
  recordDate: string;
  storeId: string;
  store?: { id?: string; name?: string; country?: CountryOption; countryCode: string; platform: string };
  listing?: { productCode?: string | null };
  product?: { sku?: string | null };
  orderStatus?: OrderStatus | null;
  salesVolume: number;
  revenue: number | string;  // Decimal returns as string from backend
  notes?: string | null;
  enteredBy?: { nickname?: string | null };
  canManage?: boolean;
  // 新增字段
  cancelReason?: string | null;
  settlementDate?: string | null;
  settlementAmount?: number | string | null;  // Decimal returns as string from backend
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
  search?: string;
};

type PaginatedResponse<T> = { data: T[]; total: number; page: number };

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
const selectedRows = ref<SalesRow[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const authStore = useAuthStore();

const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

// showFilters ref is removed as filters are always inline now
const showColumnMenu = ref(false);

const toggleableColumns = [
  { field: 'platformOrderId', header: '订单号' },
  { field: 'recordDate', header: '下单时间' },
  { field: 'country', header: '国家' },
  { field: 'store', header: '店铺' },
  { field: 'product', header: '商品/SKU' },
  { field: 'orderStatus', header: '状态' },
  { field: 'cancelReason', header: '取消/退货原因' },
  { field: 'salesVolume', header: '销量' },
  { field: 'revenue', header: '销售额' },
  { field: 'settlementDate', header: '结算时间' },
  { field: 'settlementAmount', header: '结算金额' },
  { field: 'notes', header: '备注' },
  { field: 'enteredBy', header: '录入人' },
];

const visibleColumns = ref<string[]>(toggleableColumns.map((c) => c.field));

const toggleColumn = (field: string) => {
  const idx = visibleColumns.value.indexOf(field);
  if (idx > -1) {
    visibleColumns.value.splice(idx, 1);
  } else {
    visibleColumns.value.push(field);
  }
};

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

const searchQuery = ref('');

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

const hasActiveFilters = computed(() => {
  const f = filters.value;
  return !!(f.startDate || f.endDate || f.countryCode || f.platform || f.storeId || f.orderStatus);
});

const countryOptions = computed<CountryOption[]>(() => {
  const unique = new Map<string, CountryOption>();
  stores.value.forEach((store: StoreOption) => {
    if (store.country) unique.set(store.country.code, store.country);
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

watch(() => storesError.value, (val) => {
  if (val) errorMessage.value = val;
  filters.value.storeId = null;
});

// Cascading filter: reset store when country changes
watch(() => filters.value.countryCode, () => {
  filters.value.storeId = null;
});

// Select country from pill tabs
const selectCountry = (code: string | null) => {
  filters.value.countryCode = code;
};

const formatNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num) ? num.toFixed(2) : '-';
};

// 格式化下单时间为 2025/12/9 7:43
const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

// 格式化结算日期为 2025/12/9
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
};

const statusClass = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'status--success';
    case 'PENDING': return 'status--warning';
    case 'CANCELLED':
    case 'RETURNED': return 'status--danger';
    case 'READY_TO_SHIP':
    case 'SHIPPED':
    case 'DELIVERED': return 'status--info';
    default: return 'status--secondary';
  }
};

const onPage = (event: DataTablePageEvent) => {
  page.value = (event.page ?? 0) + 1;
  pageSize.value = event.rows ?? pageSize.value;
  fetchData();
};

const onSort = (event: DataTableSortEvent) => {
  if (event.sortField) sorting.value.by = event.sortField as string;
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
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
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
  if (resetPage) page.value = 1;
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
    selectedRows.value = [];
  } catch (error) {
    console.error('获取销售数据失败', error);
    errorMessage.value = '获取数据失败，请重试。';
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这条销售数据吗？')) return;
  try {
    await salesService.delete(id);
    salesData.value = salesData.value.filter((row) => row.id !== id);
    total.value = Math.max(0, total.value - 1);
  } catch (error: any) {
    console.error('删除失败:', error);
    errorMessage.value = error.response?.data?.error || '删除失败';
  }
};

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return;
  if (!confirm(`确定要删除选中的 ${selectedRows.value.length} 条数据吗？`)) return;
  try {
    const ids = selectedRows.value.map((row) => row.id);
    await Promise.all(ids.map((id) => salesService.delete(id)));
    salesData.value = salesData.value.filter((row) => !ids.includes(row.id));
    total.value = Math.max(0, total.value - ids.length);
    selectedRows.value = [];
  } catch (error: any) {
    console.error('批量删除失败:', error);
    errorMessage.value = '批量删除失败';
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
  if (index !== -1) salesData.value[index] = updatedRow;
  closeModal();
};

onMounted(async () => {
  await fetchStores();
  fetchData();
});
</script>

<style scoped>
.sales-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Filter Section Styling */
.filter-section {
  margin-bottom: 1.25rem;
}

.filter-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

/* Pill Tab Clear Button */
.pill-tab--clear {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-secondary, #6b7280);
  border: 1px dashed var(--surface-300, #d1d5db);
  background: transparent;
}

.pill-tab--clear:hover {
  color: var(--red-600, #dc2626);
  border-color: var(--red-300, #fca5a5);
  background: var(--red-50, #fef2f2);
}

.pill-tab--clear i {
  font-size: 0.75rem;
}

/* Inline Filters Layout */
.inline-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch; /* Stretch to match heights */
  gap: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-100, #f3f4f6);
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 160px;
}

.filter-group-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  height: 1.25rem; /* Fixed height for alignment */
  line-height: 1.25rem;
  margin-bottom: 0.5rem;
}

.filter-group--search {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.filter-group--actions {
  display: flex;
  flex-direction: column;
  margin-left: auto;
}

.action-buttons-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Filter Dropdown Styling */
.filter-dropdown {
  min-width: 160px;
}

:deep(.filter-dropdown) {
  background: white;
  border: 1px solid var(--surface-200, #e5e7eb);
  border-radius: 0.5rem;
  height: 2.5rem;
  transition: all 0.2s;
}

:deep(.filter-dropdown:hover) {
  border-color: var(--surface-300, #d1d5db);
}

:deep(.filter-dropdown.p-focus) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}

:deep(.filter-dropdown .p-dropdown-label) {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

:deep(.filter-dropdown .p-dropdown-trigger) {
  width: 2.25rem;
  color: var(--surface-400);
}

/* Date Range Inline */
.date-range-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range-sep {
  color: var(--surface-400, #9ca3af);
  font-size: 0.875rem;
}

:deep(.filter-input) {
  background: white;
  border: 1px solid var(--surface-200, #e5e7eb);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  width: 130px;
  transition: all 0.2s;
}

:deep(.filter-input:hover) {
  border-color: var(--surface-300, #d1d5db);
}

:deep(.filter-input:focus) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}

/* Filter Search Input */
:deep(.filter-search-input) {
  background: white;
  border: 1px solid var(--surface-200, #e5e7eb);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  font-size: 0.875rem;
  width: 100%;
  transition: all 0.2s;
}

:deep(.filter-search-input:hover) {
  border-color: var(--surface-300, #d1d5db);
}

:deep(.filter-search-input:focus) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}

.table-info {
  font-size: 0.875rem;
  color: var(--surface-500);
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 0.5rem; /* Reduced radius for compact look */
  /* Remove shadow for cleaner look or make it very subtle */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: visible; /* Allow popups */
}

/* New Toolbar */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-100);
  gap: 1rem;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.divider {
    color: var(--surface-200);
    font-size: 0.875rem;
}

/* Filter Items */
.filter-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* Clean Input/Dropdown Overrides */
:deep(.clean-input) {
    background: white;
    border: 1px solid var(--surface-200);
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
    color: var(--surface-700);
    width: 7rem; /* Slightly wider */
    transition: all 0.2s;
}
:deep(.clean-input:hover) {
    border-color: var(--surface-300);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
:deep(.clean-input:focus) {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
}

:deep(.clean-dropdown) {
    background: white;
    border: 1px solid var(--surface-200);
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    border-radius: 6px;
    height: 2.5rem;
    align-items: center;
    transition: all 0.2s;
}
:deep(.clean-dropdown:hover) {
    border-color: var(--surface-300);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
:deep(.clean-dropdown.p-focus) {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
}
:deep(.clean-dropdown .p-dropdown-label) {
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
}
:deep(.clean-dropdown .p-dropdown-trigger) {
    width: 2rem;
    color: var(--surface-400);
}

/* Enhanced Search Field */
.search-field :deep(.p-inputtext) {
    border: 1px solid var(--surface-200);
    background: white;
    border-radius: 6px;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    font-size: 0.95rem;
    width: 260px; /* Even wider */
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.search-field :deep(.p-inputtext:hover) {
    border-color: var(--surface-300);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.search-field :deep(.p-inputtext:focus) {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
    width: 300px;
}
.search-field :deep(.p-inputicon) {
    top: 50%;
    margin-top: -0.5rem;
    color: var(--surface-400);
}

/* Column Toggle Menu */
.column-toggle-wrapper {
  position: relative;
}

.column-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 100;
  overflow: hidden;
  border: 1px solid var(--surface-100);
}

.column-menu-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--surface-500);
  padding: 0.5rem 0.75rem;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-100);
}

.column-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--surface-700);
  transition: background 0.1s;
}

.column-menu-item:hover {
  background: var(--primary-50);
  color: var(--primary-700);
}

.column-menu-item i {
  font-size: 0.875rem;
}

/* Modern Table Overrides */
.modern-table :deep(.p-datatable-thead > tr > th) {
  background: white;
  font-size: 0.8rem; /* Slightly larger header font */
  font-weight: 600;
  color: var(--surface-500);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-200);
  white-space: nowrap;
}

/* Fix Right Align Headers */
.modern-table :deep(.p-datatable-thead > tr > th.text-right .p-column-header-content) {
    justify-content: flex-end;
}
/* Fix Center Align Headers */
.modern-table :deep(.p-datatable-thead > tr > th.text-center .p-column-header-content) {
    justify-content: center;
}

.modern-table :deep(.p-datatable-tbody > tr) {
  background: white;
  transition: background 0.1s;
}

/* Remove stripes, keep hover */
.modern-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

/* Row border */
.modern-table :deep(.p-datatable-tbody > tr) {
    border-bottom: 1px solid var(--surface-50);
}

.modern-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.85rem 1rem; /* More comfortable padding */
  border: none;
  font-size: 0.9rem; /* Increased cell font size */
  color: var(--surface-700);
}

/* Make action buttons visible on group hover */
.modern-table :deep(.p-datatable-tbody > tr:hover .action-buttons) {
    opacity: 1;
}

/* Cell Styles */
.date-cell {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--surface-600);
}
.order-number {
  font-family: monospace;
  font-weight: 500;
  color: var(--surface-900);
}

.country-cell {
  font-weight: 600;
  color: var(--surface-900);
}

.store-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.store-name {
  font-weight: 500;
  color: var(--surface-800);
  font-size: 0.875rem;
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-platform {
  font-size: 0.75rem;
  color: var(--surface-400);
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.product-code {
  font-weight: 500;
  color: var(--surface-900);
  font-size: 0.875rem;
}

.product-sku {
  font-size: 0.75rem;
  color: var(--surface-400); 
}

/* Status Badges - Cleaner */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status--success { background-color: #ecfdf5; color: #059669; }
.status--warning { background-color: #fffbeb; color: #d97706; }
.status--danger  { background-color: #fef2f2; color: #dc2626; }
.status--info    { background-color: #eff6ff; color: #3b82f6; }
.status--secondary { background-color: #f3f4f6; color: #6b7280; }

.number-cell, .revenue-cell {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
}

.revenue-cell {
  font-weight: 600;
  color: var(--green-600);
}

.notes-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--surface-500);
}

.text-muted {
  color: var(--surface-400);
}

/* Action Buttons - Always visible */
.action-buttons {
  display: flex;
  gap: 0.25rem;
  opacity: 1;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--surface-400);
}

.empty-state i {
  font-size: 1.25rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }

  .table-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
