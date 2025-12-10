<template>
  <div class="finance-management">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-info">
        <h2 class="section-title">财务管理</h2>
        <p class="section-desc">管理店铺支出记录与财务审核 支出列表</p>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-calendar"></i>
            开始日期
          </label>
          <input 
            type="date" 
            v-model="filterStartDateStr" 
            class="field-input"
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-calendar"></i>
            结束日期
          </label>
          <input 
            type="date" 
            v-model="filterEndDateStr" 
            class="field-input"
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-globe"></i>
            归属国家
          </label>
          <select v-model="filters.countryCode" class="field-select">
            <option value="">全部国家</option>
            <option v-for="country in countryOptions" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-shop"></i>
            归属店铺
          </label>
          <select 
            v-model="filters.storeId" 
            class="field-select"
            :disabled="storeOptions.length === 0"
          >
            <option value="">全部店铺</option>
            <option v-for="store in storeOptions" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn-reset" @click="resetFilters">
          <i class="pi pi-refresh"></i>
          重置
        </button>
        <button class="btn-search" @click="fetchData(true)">
          <i class="pi pi-search"></i>
          查询
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <i class="pi pi-exclamation-circle"></i>
      {{ errorMessage }}
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <DataTable
        v-model:sortField="sorting.by"
        :sortOrder="sorting.order === 'asc' ? 1 : -1"
        :value="expenses"
        data-key="id"
        :loading="isLoading"
        :paginator="true"
        :rows="pageSize"
        :rowsPerPageOptions="[10, 20, 50]"
        :total-records="total"
        :lazy="true"
        :first="(page - 1) * pageSize"
        class="finance-table"
        stripedRows
        @page="onPage"
        @sort="onSort"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>未找到符合条件的支出记录</p>
          </div>
        </template>

        <Column field="expenseDate" header="支出日期" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="date-badge">{{ formatDate(data.expenseDate) }}</span>
          </template>
        </Column>

        <Column header="项目" style="min-width: 180px">
          <template #body="{ data }">
            <span class="item-desc" :title="data.itemDescription">
              {{ data.itemDescription }}
            </span>
          </template>
        </Column>

        <Column field="amount" header="金额" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="amount">¥{{ formatNumber(data.amount) }}</span>
          </template>
        </Column>

        <Column header="付款方式" style="width: 90px">
          <template #body="{ data }">
            <span class="text-secondary">{{ paymentMethodMap[data.paymentMethod] || data.paymentMethod }}</span>
          </template>
        </Column>

        <Column header="付款人" style="width: 80px">
          <template #body="{ data }">
            {{ data.payer || '-' }}
          </template>
        </Column>

        <Column header="收款人" style="width: 80px">
          <template #body="{ data }">
            {{ data.payee || '-' }}
          </template>
        </Column>

        <Column header="归属店铺" style="width: 140px">
          <template #body="{ data }">
            <div class="store-cell">
              <i class="pi pi-shop"></i>
              <span>{{ data.store?.name || 'N/A' }}</span>
            </div>
          </template>
        </Column>

        <Column header="垫付" style="width: 60px">
          <template #body="{ data }">
            <span class="tag" :class="data.isAdvancePayment ? 'tag--warning' : 'tag--success'">
              {{ data.isAdvancePayment ? '是' : '否' }}
            </span>
          </template>
        </Column>

        <Column header="票据" style="width: 60px">
          <template #body="{ data }">
            <span class="tag" :class="getInvoiceTagClass(data.invoiceStatus)">
              {{ invoiceStatusMap[data.invoiceStatus] || data.invoiceStatus }}
            </span>
          </template>
        </Column>

        <Column header="录入人" style="width: 80px">
          <template #body="{ data }">
            <span class="text-muted text-sm">{{ data.enteredBy?.nickname || '-' }}</span>
          </template>
        </Column>

        <Column header="操作" style="width: 80px" alignFrozen="right" frozen>
          <template #body="{ data }">
            <div v-if="data.canManage" class="action-buttons">
              <button class="btn-icon" @click="openEditModal(data)" title="修改">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="btn-icon btn-icon--danger" @click="handleDelete(data.id)" title="删除">
                <i class="pi pi-trash"></i>
              </button>
            </div>
            <span v-else class="text-muted text-xs">无权限</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <FinanceEditModal
      :is-open="isModalOpen"
      :expense-to-edit="selectedExpense"
      @close="closeModal"
      @expense-updated="handleExpenseUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import { useAuthStore } from '@/stores/auth';
import FinanceEditModal from './FinanceEditModal.vue';
import financeService, { type ExpenseRecord, type StoreOption } from '@/services/financeService';

type SortByField = string;
type SortOrder = 'asc' | 'desc';

type Filters = {
  countryCode: string | null;
  storeId: string | null;
};

type PaginatedResponse<T> = {
  data: T[];
  total?: number;
  page?: number;
};

const paymentMethodMap: Record<string, string> = {
  ALIPAY: '支付宝',
  WECHAT_PAY: '微信支付',
  BANK_TRANSFER: '银行转账',
  CREDIT_CARD: '信用卡',
  CASH: '现金',
  OTHER: '其他',
};

const invoiceStatusMap: Record<string, string> = {
  NONE: '无票',
  REGULAR: '普票',
  SPECIAL: '专票',
};

const authStore = useAuthStore();

const expenses = ref<ExpenseRecord[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

const allStores = ref<StoreOption[]>([]);
const filterStartDateStr = ref('');
const filterEndDateStr = ref('');
const filters = ref<Filters>({
  countryCode: null,
  storeId: null,
});
const sorting = ref<{ by: SortByField; order: SortOrder }>({ by: 'expenseDate', order: 'desc' });

const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const countryOptions = computed(() => {
  const unique = new Map<string, { code: string; name: string }>();
  allStores.value.forEach((store) => {
    if (store.country) {
      unique.set(store.country.code, store.country);
    }
  });
  const all = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));

  if (authStore.role === 'admin') return all;
  const userCountries = authStore.supervisedCountries || authStore.operatedCountries || [];
  return all.filter((country) => userCountries.includes(country.code));
});

const storeOptions = computed(() => {
  let list = allStores.value;
  if (filters.value.countryCode) {
    list = list.filter((store) => store.countryCode === filters.value.countryCode);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
});

watch(
  () => filters.value.countryCode,
  () => {
    filters.value.storeId = null;
  },
);

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const formatNumber = (num: number) => (Number.isFinite(num) ? num.toFixed(2) : '0.00');

const getInvoiceTagClass = (status: string | undefined) => {
  switch (status) {
    case 'SPECIAL': return 'tag--info';
    case 'REGULAR': return 'tag--success';
    default: return 'tag--secondary';
  }
};

const onPage = (event: DataTablePageEvent) => {
  page.value = (event.page ?? 0) + 1;
  pageSize.value = event.rows ?? pageSize.value;
  fetchData(false);
};

const onSort = (event: DataTableSortEvent) => {
  if (event.sortField) sorting.value.by = event.sortField as SortByField;
  sorting.value.order = event.sortOrder === 1 ? 'asc' : 'desc';
  fetchData(false);
};

const buildParams = () => {
  const params: Record<string, any> = {
    sortBy: sorting.value.by,
    sortOrder: sorting.value.order,
    page: page.value,
    pageSize: pageSize.value,
  };

  if (filterStartDateStr.value) params.startDate = filterStartDateStr.value;
  if (filterEndDateStr.value) params.endDate = filterEndDateStr.value;
  if (filters.value.countryCode) params.countryCode = filters.value.countryCode;
  if (filters.value.storeId) params.storeId = filters.value.storeId;

  return params;
};

const resetFilters = () => {
  filterStartDateStr.value = '';
  filterEndDateStr.value = '';
  filters.value = {
    countryCode: null,
    storeId: null,
  };
  sorting.value = { by: 'expenseDate', order: 'desc' };
  page.value = 1;
  fetchData();
};

const fetchData = async (resetPage = false) => {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const params = buildParams();
    const data = await financeService.listExpenses(params);
    if (Array.isArray(data)) {
      expenses.value = data;
      total.value = data.length;
    } else {
      const paged = data as PaginatedResponse<ExpenseRecord>;
      expenses.value = paged.data || [];
      total.value = paged.total ?? expenses.value.length;
      page.value = paged.page ?? page.value;
    }
  } catch (error) {
    console.error('获取支出数据失败:', error);
    errorMessage.value = '获取数据失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这条支出记录吗？此操作不可逆。')) return;
  try {
    await financeService.deleteExpense(id);
    expenses.value = expenses.value.filter((row) => row.id !== id);
    total.value = Math.max(0, total.value - 1);
  } catch (error: any) {
    console.error('删除失败:', error);
    errorMessage.value = error?.response?.data?.error || '删除失败，请重试';
  }
};

const isModalOpen = ref(false);
const selectedExpense = ref<ExpenseRecord | null>(null);

const openEditModal = (row: ExpenseRecord) => {
  selectedExpense.value = row;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedExpense.value = null;
};

const handleExpenseUpdated = (updatedRow: ExpenseRecord) => {
  const index = expenses.value.findIndex((row) => row.id === updatedRow.id);
  if (index !== -1) {
    expenses.value[index] = updatedRow;
  }
  closeModal();
};

const fetchStoresForFilter = async () => {
  try {
    allStores.value = await financeService.getStores();
  } catch (error) {
    console.error('获取店铺列表失败:', error);
  }
};

onMounted(() => {
  fetchStoresForFilter();
  fetchData();
});
</script>

<style scoped>
/* ========================================
   Finance Management - Modern Clean UI
   ======================================== */
.finance-management {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem;
}

.section-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Filters Section */
.filters-section {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}

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
  color: var(--color-text-secondary);
}

.field-label i {
  font-size: 0.875rem;
  color: var(--color-accent);
}

.field-input,
.field-select {
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
.field-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.field-select:disabled {
  background: var(--color-bg-page);
  cursor: not-allowed;
  opacity: 0.6;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-reset,
.btn-search {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-reset {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-reset:hover {
  background: var(--color-bg-page);
  border-color: var(--color-text-secondary);
}

.btn-search {
  background: var(--color-accent);
  border: none;
  color: white;
}

.btn-search:hover {
  filter: brightness(0.95);
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

/* Table Container */
.table-container {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Table Styles */
.finance-table :deep(.p-datatable-thead > tr > th) {
  background: var(--color-bg-page);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
}

.finance-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

.finance-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-bg-page);
}

.finance-table :deep(.p-paginator) {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

/* Cell Styles */
.date-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.item-desc {
  display: block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount {
  font-weight: 600;
  font-family: 'SF Mono', monospace;
  color: var(--color-text-primary);
}

.store-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.store-cell i {
  color: var(--color-text-muted);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.text-muted {
  color: var(--color-text-muted);
}

.text-sm {
  font-size: 0.8125rem;
}

.text-xs {
  font-size: 0.75rem;
}

/* Tags */
.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag--success {
  background: #d1fae5;
  color: #047857;
}

.tag--warning {
  background: #fef3c7;
  color: #b45309;
}

.tag--info {
  background: #dbeafe;
  color: #1d4ed8;
}

.tag--secondary {
  background: #f3f4f6;
  color: #6b7280;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-bg-page);
  color: var(--color-accent);
}

.btn-icon--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
}
</style>
