<template>
  <div class="page-shell">
    <!-- 头部 -->
    <PageHeader 
      title="生产与物流管理" 
      subtitle="订单状态全链路追踪与控制中心"
    />

    <!-- 统计卡片 (KPI) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <ContentCard class="flex items-center gap-4 py-4 px-5">
        <div class="w-10 h-10 rounded-lg bg-[var(--color-bg-page)] flex items-center justify-center text-[var(--color-text-secondary)] border border-[var(--color-border)]">
          <i class="pi pi-box"></i>
        </div>
        <div>
          <div class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">进行中订单</div>
          <div class="text-xl font-bold text-[var(--color-text-primary)]">{{ summary.totalQuantity }}</div>
        </div>
      </ContentCard>

      <ContentCard class="flex items-center gap-4 py-4 px-5 relative overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent)]"></div>
        <div class="w-10 h-10 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)]">
          <i class="pi pi-wallet"></i>
        </div>
        <div>
          <div class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">在途货值</div>
          <div class="text-xl font-bold text-[var(--color-text-primary)]">¥{{ formatNumber(summary.totalPrice) }}</div>
        </div>
      </ContentCard>
    </div>

    <!-- 筛选与工具栏 -->
    <FilterBar class="mb-6">
      <template #left>
        <div class="pill-tab-group">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="pill-tab"
            :class="{ 'is-active': filter.view === tab.key }"
            @click="filter.view = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <div class="surface-input w-64">
          <i class="pi pi-search text-[var(--color-text-muted)]"></i>
          <input 
            v-model="filter.keyword"
            type="text" 
            placeholder="SKU / 订单号 / 批次号"
            @keyup.enter="fetchData(1)"
          >
        </div>

        <Dropdown
          v-model="filter.countryCode"
          :options="countryOptionsWithAll"
          optionLabel="name"
          optionValue="code"
          placeholder="全部国家"
          class="w-32"
          :pt="{ root: { class: 'surface-input justify-between w-full p-0 h-[40px] flex items-center' }, input: { class: 'p-2 text-sm' }, trigger: { class: 'p-2 text-gray-400' } }"
        />
      </template>

      <template #right>
        <Button label="刷新" icon="pi pi-refresh" severity="secondary" outlined size="small" @click="fetchData(1)" :pt="{ root: { class: 'h-[40px]' } }" />
        <Button v-if="isAdmin" label="导出" icon="pi pi-download" severity="secondary" outlined size="small" @click="handleExport" :pt="{ root: { class: 'h-[40px]' } }" />
        <Button v-if="isAdmin" label="新建批次" icon="pi pi-plus" size="small" @click="isCreateModalOpen = true" :pt="{ root: { class: 'h-[40px] bg-[var(--color-accent)] border-[var(--color-accent)]' } }" />
      </template>
    </FilterBar>

    <!-- 批量操作栏 -->
    <div v-if="selectedOrderIds.length > 0 && isAdmin" class="mb-4 bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-lg p-3 flex items-center justify-between animate-fade-in-up">
      <div class="flex items-center gap-2 text-[var(--color-accent)] text-sm font-medium">
        <i class="pi pi-check-square"></i>
        <span>已选择 <strong>{{ selectedOrderIds.length }}</strong> 个订单</span>
      </div>
      <div class="flex items-center gap-2">
        <Dropdown
          v-model="batchActionStatus"
          :options="statusSteps"
          optionLabel="label"
          optionValue="key"
          placeholder="选择更新状态..."
          class="w-48"
          :pt="{ root: { class: 'bg-white border-0 h-9 flex items-center' } }"
        />
        <Button
          label="批量更新"
          icon="pi pi-sync"
          size="small"
          :disabled="!batchActionStatus"
          @click="executeBatchUpdate"
        />
        <Button
          label="取消"
          text
          size="small"
          severity="secondary"
          @click="selectedRows = []"
        />
      </div>
    </div>

    <!-- 订单列表表格 -->
    <ContentCard class="p-0 overflow-hidden">
      <DataTable
        v-model:selection="selectedRows"
        :value="orders"
        :loading="isLoading"
        :paginator="true"
        :rows="pagination.pageSize"
        :totalRecords="pagination.total"
        :lazy="true"
        :rowsPerPageOptions="[10, 20, 50]"
        dataKey="id"
        stripedRows
        :pt="{
            table: { class: 'w-full' },
            headerRow: { class: 'bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] text-xs uppercase tracking-wider border-b border-[var(--color-border)]' },
            row: { class: 'border-b border-[var(--color-border)] hover:bg-[var(--color-bg-page)] transition-colors' },
            column: { headerCell: { class: 'py-3 px-4 font-medium' }, bodyCell: { class: 'py-3 px-4 text-sm text-[var(--color-text-primary)]' } }
        }"
        @page="onPageChange"
      >
        <!-- 多选列 -->
        <Column v-if="isAdmin" selectionMode="multiple" headerStyle="width: 3rem" />

        <!-- 批次/编号 -->
        <Column field="orderCode" header="批次/编号" style="min-width: 160px">
          <template #body="{ data }">
            <div class="font-medium text-[var(--color-text-primary)]">{{ data.orderCode }}</div>
            <div class="text-xs text-[var(--color-text-secondary)] mt-0.5">批次: {{ data.batchCode }}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-0.5">{{ formatDate(data.orderDate) }}</div>
          </template>
        </Column>

        <!-- SKU / 名称 -->
        <Column field="skuName" header="SKU / 名称" style="min-width: 180px">
          <template #body="{ data }">
            <div class="font-medium text-[var(--color-text-primary)]">{{ data.skuName }}</div>
            <div class="text-xs text-[var(--color-text-secondary)] mt-0.5">{{ data.productName }}</div>
          </template>
        </Column>

        <!-- 规格 / 地区 -->
        <Column field="productSpec" header="规格 / 地区" style="min-width: 160px">
          <template #body="{ data }">
            <div class="text-sm text-[var(--color-text-primary)]">{{ data.productColor }}</div>
            <div class="text-xs text-[var(--color-text-secondary)]">{{ data.productSpec }} · {{ data.plugSpec }}</div>
            <Tag :value="data.salesRegion" severity="secondary" class="mt-1 text-[10px]" />
          </template>
        </Column>

        <!-- 当前状态 -->
        <Column field="status" header="当前状态" style="min-width: 120px">
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-xs font-normal" />
            <div v-if="data.statusDate" class="text-xs text-[var(--color-text-muted)] mt-1">
              {{ formatDate(data.statusDate) }}
            </div>
          </template>
        </Column>

        <!-- 数量 -->
        <Column field="quantity" header="数量" style="min-width: 80px">
          <template #body="{ data }">
            <span class="font-medium">{{ data.quantity }}</span>
          </template>
        </Column>

        <!-- 总价 -->
        <Column field="totalPrice" header="总价" style="min-width: 120px">
          <template #body="{ data }">
            <div class="font-medium">{{ formatCurrency(data.totalPrice) }}</div>
            <div class="text-xs text-[var(--color-text-muted)]">@ {{ data.unitPrice }}</div>
          </template>
        </Column>

        <!-- 物流费用 -->
        <Column field="logisticsFee" header="物流费用" style="min-width: 100px">
          <template #body="{ data }">
            <span class="text-sm">
              {{ data.logisticsFee ? formatCurrency(data.logisticsFee) : '-' }}
            </span>
          </template>
        </Column>

        <!-- 物流信息 -->
        <Column field="logisticsProvider" header="物流信息" style="min-width: 140px">
          <template #body="{ data }">
            <div v-if="data.logisticsProvider" class="text-xs text-[var(--color-text-secondary)]">物流: {{ data.logisticsProvider }}</div>
            <div v-if="data.cartonCount" class="text-xs text-[var(--color-text-secondary)]">箱数: {{ data.cartonCount }}</div>
            <div v-if="data.totalCbm" class="text-xs text-[var(--color-text-secondary)]">Vol: {{ data.totalCbm }} m³</div>
            <span v-if="!data.logisticsProvider && !data.cartonCount && !data.totalCbm" class="text-[var(--color-text-muted)]">-</span>
          </template>
        </Column>

        <!-- 操作 -->
        <Column header="操作" style="min-width: 120px" frozen alignFrozen="right">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                label="详情"
                text
                size="small"
                @click="openDetail(data)"
                :pt="{ root: { class: 'text-blue-600 hover:bg-blue-50 px-2 py-1 h-auto text-xs' } }"
              />
              <Button
                v-if="isAdmin"
                icon="pi pi-trash"
                text
                size="small"
                severity="danger"
                @click="handleDelete(data.id)"
                :pt="{ root: { class: 'text-red-500 hover:bg-red-50 px-2 py-1 h-auto w-auto' } }"
              />
            </div>
          </template>
        </Column>

        <!-- 空状态 -->
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
            <i class="pi pi-inbox text-4xl mb-4 text-[var(--color-text-muted)]"></i>
            <p>暂无数据</p>
          </div>
        </template>
      </DataTable>
    </ContentCard>

    <!-- 详情弹窗 -->
    <LogisticsDetailModal
      v-if="detailModalOpen"
      :order-id="selectedDetailId"
      :is-open="detailModalOpen"
      @close="closeDetail"
    />

    <!-- 新建批次弹窗 -->
    <LogisticsBatchFormModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @batch-created="fetchData(1)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';

// Primitives & Styles
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import FilterBar from '@/components/common/FilterBar.vue';

// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';

// Local Components
import LogisticsBatchFormModal from '../components/logistics/LogisticsBatchFormModal.vue';
import LogisticsDetailModal from '../components/logistics/LogisticsDetailModal.vue';

type TabKey = 'in-progress' | 'completed' | 'all';
type StatusKey =
  | 'IN_PRODUCTION'
  | 'PRODUCTION_DONE'
  | 'SHIPPED_OUT'
  | 'CONTAINER_LOADED'
  | 'EXPORTED'
  | 'IN_TRANSIT'
  | 'IMPORTED'
  | 'DELIVERING'
  | 'WAREHOUSED';

type OrderId = string | number;

interface FilterState {
  view: TabKey;
  keyword: string;
  countryCode: string;
  startDate: string;
  endDate: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface SummaryState {
  totalQuantity: number;
  totalPrice: number;
}

interface CountryOption {
  code: string;
  name: string;
}

interface OrderRecord {
  id: OrderId;
  orderCode?: string;
  batchCode?: string;
  orderDate?: string;
  skuName?: string;
  productName?: string;
  productColor?: string;
  productSpec?: string;
  plugSpec?: string;
  salesRegion?: string;
  status?: StatusKey | string;
  statusDate?: string;
  quantity?: number;
  totalPrice?: number;
  unitPrice?: number;
  logisticsFee?: number;
  logisticsProvider?: string;
  cartonCount?: number;
  totalCbm?: number;
}

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'in-progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'all', label: '全部' },
];

const filter = ref<FilterState>({
  view: 'in-progress',
  keyword: '',
  countryCode: '',
  startDate: '',
  endDate: '',
});

const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 20,
  total: 0,
});

const summary = ref<SummaryState>({ totalQuantity: 0, totalPrice: 0 });
const orders = ref<OrderRecord[]>([]);
const isLoading = ref(false);
const countryOptions = ref<CountryOption[]>([]);

const isCreateModalOpen = ref(false);
const selectedOrderIds = ref<OrderId[]>([]);
const selectedRows = ref<OrderRecord[]>([]);
const batchActionStatus = ref<StatusKey | ''>('');

const detailModalOpen = ref(false);
const selectedDetailId = ref<OrderId | null>(null);

const statusSteps: Array<{ key: StatusKey; label: string }> = [
  { key: 'IN_PRODUCTION', label: '生产中' },
  { key: 'PRODUCTION_DONE', label: '生产完成' },
  { key: 'SHIPPED_OUT', label: '已出库' },
  { key: 'CONTAINER_LOADED', label: '已装柜' },
  { key: 'EXPORTED', label: '出口' },
  { key: 'IN_TRANSIT', label: '运输' },
  { key: 'IMPORTED', label: '进口' },
  { key: 'DELIVERING', label: '派送' },
  { key: 'WAREHOUSED', label: '已入仓' },
];

// 带"全部"选项的国家列表
const countryOptionsWithAll = computed(() => [
  { code: '', name: '全部' },
  ...countryOptions.value,
]);

// 同步 selectedRows 与 selectedOrderIds
watch(selectedRows, (newRows) => {
  selectedOrderIds.value = newRows.map((r) => r.id);
});

// 监听筛选器变化以触发数据刷新
watch(
  () => [filter.value.view, filter.value.countryCode],
  () => {
    fetchData(1);
  }
);

const fetchOptions = async () => {
  try {
    const res = await apiClient.get<CountryOption[]>('/admin/countries');
    countryOptions.value = res.data;
  } catch (error) {
    console.error(error);
  }
};

const fetchData = async (page = 1) => {
  isLoading.value = true;
  selectedRows.value = [];
  try {
    const params = {
      page,
      pageSize: pagination.value.pageSize,
      view: filter.value.view,
      keyword: filter.value.keyword,
      countryCode: filter.value.countryCode,
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
    };
    const res = await apiClient.get('/production/orders', { params });
    const data = res.data;
    orders.value = (data.data || []) as OrderRecord[];
    pagination.value.page = data.page ?? page;
    pagination.value.total = data.total ?? 0;
    summary.value = data.summary ?? summary.value;
  } catch (error) {
    console.error('加载失败', error);
  } finally {
    isLoading.value = false;
  }
};

const onPageChange = (event: { page: number; rows: number }) => {
  pagination.value.page = event.page + 1;
  pagination.value.pageSize = event.rows;
  fetchData(pagination.value.page);
};

const handleExport = async () => {
  try {
    const params = {
      view: filter.value.view,
      keyword: filter.value.keyword,
      countryCode: filter.value.countryCode,
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
    };
    const response = await apiClient.get('/admin/production/export', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Production_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  } catch (error) {
    alert('导出失败');
  }
};

const executeBatchUpdate = async () => {
  if (!batchActionStatus.value) return;
  if (!confirm(`确定将选中的 ${selectedOrderIds.value.length} 个订单更新为"${statusLabel(batchActionStatus.value)}"吗？`)) return;

  try {
    await apiClient.post('/admin/production/orders/batch-status', {
      orderIds: selectedOrderIds.value,
      status: batchActionStatus.value,
      occurredAt: new Date().toISOString(),
    });
    alert('批量更新成功');
    selectedRows.value = [];
    batchActionStatus.value = '';
    fetchData(pagination.value.page);
  } catch (error: any) {
    alert(error.response?.data?.error || '更新失败');
  }
};

const handleDelete = async (id: OrderId) => {
  if (!confirm('确定删除该订单？（软删除）')) return;
  try {
    await apiClient.delete(`/admin/production/orders/${id}`);
    fetchData(pagination.value.page);
  } catch (error) {
    alert('删除失败');
  }
};

const formatNumber = (v?: number) => (v ?? 0).toLocaleString();
const formatCurrency = (v?: number) => (v ? `￥${v.toLocaleString()}` : '-');
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '-');
const statusLabel = (s: StatusKey | string) => statusSteps.find((step) => step.key === s)?.label || s;

const getStatusSeverity = (s: StatusKey | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined => {
  if (s === 'WAREHOUSED') return 'success';
  if (s === 'IN_PRODUCTION') return 'warn';
  if (s === 'IN_TRANSIT' || s === 'DELIVERING') return 'info';
  return 'secondary';
};

const openDetail = (order: OrderRecord) => {
  selectedDetailId.value = order.id;
  detailModalOpen.value = true;
};

const closeDetail = () => {
  detailModalOpen.value = false;
  selectedDetailId.value = null;
};

onMounted(() => {
  fetchOptions();
  fetchData();
});
</script>

<style scoped>
/* Scoped styles mainly for specific overrides if needed */
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
