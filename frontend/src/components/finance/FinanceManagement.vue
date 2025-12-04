<template>
  <div class="flex flex-column gap-4">
    <!-- Page Header -->
    <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-900 m-0">财务管理</h1>
        <p class="text-500 mt-1 mb-0">管理店铺支出记录与财务审核</p>
      </div>
      <div class="flex gap-2">
        <!-- Future actions like "Export" can go here -->
      </div>
    </div>

    <!-- Main Content Card -->
    <Card class="shadow-sm border-round-2xl">
      <template #content>
        <!-- Filters Section -->
        <div class="surface-ground p-4 border-round-xl mb-4">
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-3 mb-0">
              <label class="font-semibold text-sm mb-2 block text-700">开始日期</label>
              <Calendar v-model="filters.startDate" date-format="yy-mm-dd" show-icon class="w-full" placeholder="选择开始日期" />
            </div>
            <div class="field col-12 md:col-3 mb-0">
              <label class="font-semibold text-sm mb-2 block text-700">结束日期</label>
              <Calendar v-model="filters.endDate" date-format="yy-mm-dd" show-icon class="w-full" placeholder="选择结束日期" />
            </div>
            <div class="field col-12 md:col-3 mb-0">
              <label class="font-semibold text-sm mb-2 block text-700">归属国家</label>
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
            <div class="field col-12 md:col-3 mb-0">
              <label class="font-semibold text-sm mb-2 block text-700">归属店铺</label>
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
          </div>
          <div class="flex justify-content-end gap-2 mt-3">
            <Button label="重置" severity="secondary" text icon="pi pi-refresh" @click="resetFilters" />
            <Button label="查询" icon="pi pi-search" @click="fetchData(true)" />
          </div>
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
          {{ errorMessage }}
        </Message>

        <!-- Data Table -->
        <DataTable
          v-model:sortField="sorting.by"
          :sortOrder="sorting.order === 'asc' ? 1 : -1"
          :value="expenses"
          data-key="id"
          :loading="isLoading"
          :paginator="true"
          :rows="pageSize"
          :total-records="total"
          :lazy="true"
          :first="(page - 1) * pageSize"
          class="p-datatable-lg"
          @page="onPage"
          @sort="onSort"
        >
          <template #empty>
            <div class="text-center py-6">
              <i class="pi pi-file-excel text-4xl text-400 mb-3"></i>
              <p class="text-500">未找到符合条件的支出记录</p>
            </div>
          </template>

          <Column field="expenseDate" header="支出日期" sortable style="width: 10%">
            <template #body="{ data }">
              <span class="font-medium text-900">{{ formatDate(data.expenseDate) }}</span>
            </template>
          </Column>
          <Column header="项目" style="min-width: 15%">
            <template #body="{ data }">
              <span :title="data.itemDescription" class="text-ellipsis text-700 font-medium">
                {{ data.itemDescription }}
              </span>
            </template>
          </Column>
          <Column field="amount" header="金额" sortable style="width: 10%">
            <template #body="{ data }">
              <span class="font-bold text-900">{{ formatNumber(data.amount) }}</span>
            </template>
          </Column>
          <Column header="付款方式" style="width: 10%">
            <template #body="{ data }">
              <span class="text-700">{{ paymentMethodMap[data.paymentMethod] || data.paymentMethod }}</span>
            </template>
          </Column>
          <Column header="付款人" style="width: 10%">
            <template #body="{ data }">
              {{ data.payer || '-' }}
            </template>
          </Column>
          <Column header="收款人" style="width: 10%">
            <template #body="{ data }">
              {{ data.payee || '-' }}
            </template>
          </Column>
          <Column header="归属店铺" style="width: 12%">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-shop text-500"></i>
                <span>{{ data.store?.name || 'N/A' }}</span>
              </div>
            </template>
          </Column>
          <Column header="垫付" style="width: 8%">
            <template #body="{ data }">
              <Tag :value="data.isAdvancePayment ? '是' : '否'" :severity="data.isAdvancePayment ? 'warning' : 'success'" rounded />
            </template>
          </Column>
          <Column header="票据" style="width: 8%">
            <template #body="{ data }">
              <Tag
                :value="invoiceStatusMap[data.invoiceStatus] || data.invoiceStatus"
                :severity="invoiceSeverity(data.invoiceStatus)"
                rounded
              />
            </template>
          </Column>
          <Column header="录入人" style="width: 8%">
            <template #body="{ data }">
              <span class="text-sm text-500">{{ data.enteredBy?.nickname || '-' }}</span>
            </template>
          </Column>
          <Column header="操作" style="width: 10%" alignFrozen="right" frozen>
            <template #body="{ data }">
              <div v-if="data.canManage" class="flex gap-2">
                <Button icon="pi pi-pencil" size="small" text rounded severity="secondary" @click="openEditModal(data)" v-tooltip.top="'修改'" />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  rounded
                  @click="handleDelete(data.id)"
                  v-tooltip.top="'删除'"
                />
              </div>
              <span v-else class="text-500 text-xs">无权限</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

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
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import { useAuthStore } from '@/stores/auth';
import FinanceEditModal from './FinanceEditModal.vue';
import financeService, { type ExpenseRecord, type StoreOption } from '@/services/financeService';

type SortByField = string;
type SortOrder = 'asc' | 'desc';

type Filters = {
  startDate: Date | null;
  endDate: Date | null;
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
const filters = ref<Filters>({
  startDate: null,
  endDate: null,
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

const invoiceSeverity = (status: string | undefined) => {
  switch (status) {
    case 'SPECIAL':
      return 'info';
    case 'REGULAR':
      return 'success';
    default:
      return 'secondary';
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

const formatDateInput = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const buildParams = () => {
  const params: Record<string, any> = {
    sortBy: sorting.value.by,
    sortOrder: sorting.value.order,
    page: page.value,
    pageSize: pageSize.value,
  };

  const { startDate, endDate, countryCode, storeId } = filters.value;
  if (startDate) params.startDate = formatDateInput(startDate);
  if (endDate) params.endDate = formatDateInput(endDate);
  if (countryCode) params.countryCode = countryCode;
  if (storeId) params.storeId = storeId;

  return params;
};

const resetFilters = () => {
  filters.value = {
    startDate: null,
    endDate: null,
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
.text-ellipsis {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
