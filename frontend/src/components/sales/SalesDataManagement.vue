<template>
  <div class="sales-management">
    <Message v-if="errorMessage" severity="error" :closable="false" class="w-full">
      {{ errorMessage }}
    </Message>

    <!-- Data Table Card -->
    <div class="table-card">
      <!-- Toolbar -->
      <div class="table-header">
        <div class="header-main">
          <div class="header-title">
            <h2>销售数据</h2>
            <span class="badge">{{ total }} 条</span>
          </div>
          <div class="header-actions">
            <Button
              v-if="selectedRows.length > 0"
              :label="`删除 ${selectedRows.length} 项`"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              outlined
              @click="handleBatchDelete"
            />
            <Button
              :icon="showFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
              :label="showFilters ? '' : '筛选'"
              :severity="hasActiveFilters ? 'primary' : 'secondary'"
              :outlined="!hasActiveFilters"
              size="small"
              @click="showFilters = !showFilters"
            />
            <div class="column-toggle-wrapper">
              <Button
                icon="pi pi-sliders-h"
                severity="secondary"
                text
                size="small"
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

        <!-- Expandable Filters -->
        <Transition name="expand">
          <div v-if="showFilters" class="filters-panel">
            <div class="filters-grid">
              <div class="filter-group">
                <label>日期范围</label>
                <div class="date-range">
                  <Calendar v-model="filters.startDate" date-format="yy-mm-dd" placeholder="开始" show-icon />
                  <span>-</span>
                  <Calendar v-model="filters.endDate" date-format="yy-mm-dd" placeholder="结束" show-icon />
                </div>
              </div>
              <div class="filter-group">
                <label>国家</label>
                <Dropdown
                  v-model="filters.countryCode"
                  :options="countryOptions"
                  option-label="name"
                  option-value="code"
                  placeholder="全部"
                  show-clear
                  filter
                />
              </div>
              <div class="filter-group">
                <label>平台</label>
                <Dropdown
                  v-model="filters.platform"
                  :options="platformOptions"
                  placeholder="全部"
                  show-clear
                />
              </div>
              <div class="filter-group">
                <label>店铺</label>
                <Dropdown
                  v-model="filters.storeId"
                  :options="storeOptions"
                  option-label="name"
                  option-value="id"
                  placeholder="全部"
                  show-clear
                  filter
                  :disabled="storeOptions.length === 0"
                />
              </div>
              <div class="filter-group">
                <label>状态</label>
                <Dropdown
                  v-model="filters.orderStatus"
                  :options="statusOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="全部"
                  show-clear
                />
              </div>
            </div>
            <div class="filters-footer">
              <Button label="重置" severity="secondary" text size="small" @click="resetFilters" />
              <Button label="应用筛选" icon="pi pi-check" size="small" @click="fetchData(true)" />
            </div>
          </div>
        </Transition>
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
        :total-records="total"
        :lazy="true"
        :first="(page - 1) * pageSize"
        stripedRows
        rowHover
        class="modern-table"
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

        <Column v-if="visibleColumns.includes('recordDate')" field="recordDate" header="日期" sortable style="width: 7rem">
          <template #body="{ data }">
            <span class="date-cell">{{ formatDate(data.recordDate) }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('country')" header="国家" style="width: 5rem">
          <template #body="{ data }">
            <span class="country-cell">{{ data.store?.country?.code || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('store')" header="店铺" style="width: 9rem">
          <template #body="{ data }">
            <span class="store-cell" :title="data.store?.name">{{ data.store?.name || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('product')" header="商品/SKU" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="product-cell">
              <span class="product-code">{{ data.listing?.productCode || '未关联' }}</span>
              <span class="product-sku">{{ data.product?.sku || 'SKU 缺失' }}</span>
            </div>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('orderStatus')" field="orderStatus" header="状态" style="width: 7rem">
          <template #body="{ data }">
            <div v-if="data.orderStatus" class="status-badge" :class="statusClass(data.orderStatus)">
              <i :class="statusIcon(data.orderStatus)"></i>
              <span>{{ ORDER_STATUS_MAP[data.orderStatus] || data.orderStatus }}</span>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('salesVolume')" field="salesVolume" header="销量" sortable style="width: 5rem">
          <template #body="{ data }">
            <span class="number-cell">{{ data.salesVolume }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('revenue')" field="revenue" header="销售额" sortable style="width: 7rem">
          <template #body="{ data }">
            <span class="revenue-cell">{{ formatNumber(data.revenue) }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('notes')" header="备注" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="notes-cell" :title="data.notes || ''">{{ data.notes || '-' }}</span>
          </template>
        </Column>

        <Column v-if="visibleColumns.includes('enteredBy')" header="录入人" style="width: 6rem">
          <template #body="{ data }">
            {{ data.enteredBy?.nickname || '-' }}
          </template>
        </Column>

        <Column header="操作" style="width: 6rem" frozen alignFrozen="right">
          <template #body="{ data }">
            <div v-if="data.canManage" class="action-buttons">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                size="small"
                v-tooltip.bottom="'编辑'"
                @click="openEditModal(data)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                v-tooltip.bottom="'删除'"
                @click="handleDelete(data.id)"
              />
            </div>
            <span v-else class="text-muted text-sm">-</span>
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import { useAuthStore } from '@/stores/auth';
import useStoreListings from '@/composables/useStoreListings';
import SalesDataEditModal from './SalesDataEditModal.vue';
import { salesService } from '@/services/salesService';

type CountryOption = { code: string; name: string };
type StoreOption = { id: string; name: string; countryCode: string; platform: string; country?: CountryOption };
type OrderStatus = 'PENDING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';

type SalesRow = {
  id: string;
  recordDate: string;
  storeId: string;
  store?: { id?: string; name?: string; country?: CountryOption; countryCode: string; platform: string };
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

const showFilters = ref(false);
const showColumnMenu = ref(false);

const toggleableColumns = [
  { field: 'recordDate', header: '日期' },
  { field: 'country', header: '国家' },
  { field: 'store', header: '店铺' },
  { field: 'product', header: '商品/SKU' },
  { field: 'orderStatus', header: '状态' },
  { field: 'salesVolume', header: '销量' },
  { field: 'revenue', header: '销售额' },
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

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '0.00');
const formatDate = (dateString: string) => (!dateString ? '-' : new Date(dateString).toISOString().split('T')[0]);

const statusIcon = (status: string) => {
  switch (status) {
    case 'PENDING': return 'pi pi-clock';
    case 'READY_TO_SHIP': return 'pi pi-box';
    case 'SHIPPED': return 'pi pi-truck';
    case 'DELIVERED': return 'pi pi-home';
    case 'COMPLETED': return 'pi pi-check-circle';
    case 'CANCELLED': return 'pi pi-times-circle';
    case 'RETURNED': return 'pi pi-replay';
    default: return 'pi pi-circle';
  }
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
  gap: 1rem;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* Table Header */
.table-header {
  border-bottom: 1px solid var(--surface-100);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--surface-900);
  margin: 0;
}

.badge {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--surface-500);
  background: var(--surface-100);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-toggle-wrapper {
  position: relative;
}

.column-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  min-width: 150px;
  z-index: 20;
  overflow: hidden;
}

.column-menu-header {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--surface-400);
  padding: 0.75rem 1rem 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.column-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.1s;
}

.column-menu-item:hover {
  background: var(--surface-50);
}

.column-menu-item i {
  color: var(--primary-color);
  font-size: 0.85rem;
}

/* Filters Panel */
.filters-panel {
  padding: 1rem 1.25rem;
  background: var(--surface-50);
  border-top: 1px solid var(--surface-100);
}

.filters-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-group label {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--surface-500);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.filter-group :deep(.p-dropdown),
.filter-group :deep(.p-calendar) {
  min-width: 120px;
}

.filter-group :deep(.p-inputtext) {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range span {
  color: var(--surface-400);
  font-size: 0.8rem;
}

.date-range :deep(.p-calendar) {
  width: 120px;
}

.filters-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-200);
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Modern Table */
.modern-table :deep(.p-datatable-header) {
  display: none;
}

.modern-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-50);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--surface-600);
  padding: 0.75rem 1rem;
  border: none;
}

.modern-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.1s;
}

.modern-table :deep(.p-datatable-tbody > tr:nth-child(even)) {
  background: var(--surface-50);
}

.modern-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--primary-50) !important;
}

.modern-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.625rem 1rem;
  border: none;
  font-size: 0.8rem;
}

/* Cell Styles */
.date-cell {
  font-weight: 500;
  color: var(--surface-700);
}

.country-cell {
  font-weight: 600;
  color: var(--surface-600);
}

.store-cell {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.product-code {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.8rem;
}

.product-sku {
  font-size: 0.7rem;
  color: var(--surface-500);
}

.number-cell {
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

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 500;
}

.status--success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status--warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status--danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status--info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status--secondary {
  background: var(--surface-100);
  color: var(--surface-600);
}

.status-badge i {
  font-size: 0.65rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
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
