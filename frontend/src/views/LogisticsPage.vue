<template>
  <div class="logistics-page">
    <!-- 页面头部区域 (Clean White Theme) -->
    <header class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1 class="page-title">生产与物流管理</h1>
          <p class="page-subtitle">订单状态全链路追踪与控制中心</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="pi pi-box"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">进行中订单</span>
              <span class="stat-value">{{ summary.totalQuantity }}</span>
            </div>
          </div>
          <div class="stat-card stat-card--accent">
            <div class="stat-icon stat-icon--accent">
              <i class="pi pi-wallet"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">在途货值</span>
              <span class="stat-value">¥{{ formatNumber(summary.totalPrice) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 筛选器 -->
      <div class="filter-bar">
        <!-- 视图切换 Tab -->
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="filter-tab"
            :class="{ 'filter-tab--active': filter.view === tab.key }"
            @click="filter.view = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <!-- 搜索框 -->
        <div class="filter-search">
          <i class="pi pi-search"></i>
          <input
            v-model="filter.keyword"
            type="text"
            placeholder="SKU / 订单号 / 批次号"
            @keyup.enter="fetchData(1)"
          />
        </div>
        
        <!-- 国家筛选 -->
        <Dropdown
          v-model="filter.countryCode"
          :options="countryOptionsWithAll"
          optionLabel="name"
          optionValue="code"
          placeholder="全部国家"
          class="filter-dropdown"
        />
        
        <div class="filter-spacer"></div>
        
        <!-- 操作按钮 -->
        <div class="filter-actions">
          <Button label="刷新" icon="pi pi-refresh" severity="secondary" outlined size="small" @click="fetchData(1)" />
          <Button v-if="isAdmin" label="导出" icon="pi pi-download" severity="secondary" outlined size="small" @click="handleExport" />
          <Button v-if="isAdmin" label="新建批次" icon="pi pi-plus" size="small" @click="isCreateModalOpen = true" />
        </div>
      </div>
    </header>

    <!-- 批量操作栏 (仅在选中时显示) -->
    <section v-if="selectedOrderIds.length > 0 && isAdmin" class="batch-section">
      <div class="batch-info">
        <i class="pi pi-check-square"></i>
        <span>已选择 <strong>{{ selectedOrderIds.length }}</strong> 个订单</span>
      </div>
      <div class="batch-actions">
        <Dropdown
          v-model="batchActionStatus"
          :options="statusSteps"
          optionLabel="label"
          optionValue="key"
          placeholder="选择更新状态..."
          class="batch-dropdown"
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
    </section>

    <!-- 订单列表表格 -->
    <section class="table-section">
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
        showGridlines
        class="orders-table"
        @page="onPageChange"
      >
        <!-- 多选列 -->
        <Column v-if="isAdmin" selectionMode="multiple" headerStyle="width: 3rem" />

        <!-- 批次/编号 -->
        <Column field="orderCode" header="批次/编号" style="min-width: 160px">
          <template #body="{ data }">
            <div class="cell-primary">{{ data.orderCode }}</div>
            <div class="cell-secondary">批次: {{ data.batchCode }}</div>
            <div class="cell-tertiary">{{ formatDate(data.orderDate) }}</div>
          </template>
        </Column>

        <!-- SKU / 名称 -->
        <Column field="skuName" header="SKU / 名称" style="min-width: 180px">
          <template #body="{ data }">
            <div class="cell-primary">{{ data.skuName }}</div>
            <div class="cell-secondary">{{ data.productName }}</div>
          </template>
        </Column>

        <!-- 规格 / 地区 -->
        <Column field="productSpec" header="规格 / 地区" style="min-width: 160px">
          <template #body="{ data }">
            <div class="cell-primary">{{ data.productColor }}</div>
            <div class="cell-secondary">{{ data.productSpec }} · {{ data.plugSpec }}</div>
            <Tag :value="data.salesRegion" severity="secondary" class="mt-1" />
          </template>
        </Column>

        <!-- 当前状态 -->
        <Column field="status" header="当前状态" style="min-width: 120px">
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
            <div v-if="data.statusDate" class="cell-tertiary mt-1">
              {{ formatDate(data.statusDate) }}
            </div>
          </template>
        </Column>

        <!-- 数量 -->
        <Column field="quantity" header="数量" style="min-width: 80px">
          <template #body="{ data }">
            <span class="cell-primary">{{ data.quantity }}</span>
          </template>
        </Column>

        <!-- 总价 -->
        <Column field="totalPrice" header="总价" style="min-width: 120px">
          <template #body="{ data }">
            <div class="cell-primary">{{ formatCurrency(data.totalPrice) }}</div>
            <div class="cell-tertiary">@ {{ data.unitPrice }}</div>
          </template>
        </Column>

        <!-- 物流费用 -->
        <Column field="logisticsFee" header="物流费用" style="min-width: 100px">
          <template #body="{ data }">
            <span class="cell-primary">
              {{ data.logisticsFee ? formatCurrency(data.logisticsFee) : '-' }}
            </span>
          </template>
        </Column>

        <!-- 物流信息 -->
        <Column field="logisticsProvider" header="物流信息" style="min-width: 140px">
          <template #body="{ data }">
            <div v-if="data.logisticsProvider" class="cell-secondary">物流: {{ data.logisticsProvider }}</div>
            <div v-if="data.cartonCount" class="cell-secondary">箱数: {{ data.cartonCount }}</div>
            <div v-if="data.totalCbm" class="cell-secondary">Vol: {{ data.totalCbm }} m³</div>
            <span v-if="!data.logisticsProvider && !data.cartonCount && !data.totalCbm" class="cell-tertiary">-</span>
          </template>
        </Column>

        <!-- 操作 -->
        <Column header="操作" style="min-width: 120px" frozen alignFrozen="right">
          <template #body="{ data }">
            <div class="action-cell">
              <Button
                label="详情"
                text
                size="small"
                @click="openDetail(data)"
              />
              <Button
                v-if="isAdmin"
                icon="pi pi-trash"
                text
                size="small"
                severity="danger"
                @click="handleDelete(data.id)"
              />
            </div>
          </template>
        </Column>

        <!-- 空状态 -->
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox empty-icon"></i>
            <p>暂无数据</p>
          </div>
        </template>

        <!-- 加载状态 -->
        <template #loading>
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>加载数据中...</span>
          </div>
        </template>
      </DataTable>
    </section>

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
/* ========================================
   Design Tokens (继承全局)
   ======================================== */
.logistics-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-bg-page);
}

/* ========================================
   页面头部 (Clean White Theme)
   ======================================== */
.page-header {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.header-text {
  flex: 1;
  min-width: 200px;
}

.page-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* 统计卡片 */
.header-stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 140px;
  transition: all var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.stat-card--accent {
  border-left: 3px solid var(--color-accent);
}

.stat-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.stat-icon--accent {
  background: var(--color-accent-soft);
  border-color: transparent;
  color: var(--color-accent);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.625rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.125rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

/* ========================================
   筛选栏
   ======================================== */
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.625rem;
}

/* Tab 切换 */
.filter-tabs {
  display: flex;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.1875rem;
}

.filter-tab {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.filter-tab:hover {
  color: var(--color-text-primary);
}

.filter-tab--active {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-xs);
}

/* 搜索框 */
.filter-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0 0.75rem;
  transition: all var(--transition-fast);
}

.filter-search:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.filter-search i {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.filter-search input {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  padding: 0.5rem 0;
  width: 160px;
  outline: none;
}

.filter-search input::placeholder {
  color: var(--color-text-muted);
}

/* 下拉框 */
.filter-dropdown {
  min-width: 110px;
}

.filter-dropdown :deep(.p-select),
.filter-dropdown :deep(.p-dropdown) {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.filter-dropdown :deep(.p-select-label),
.filter-dropdown :deep(.p-dropdown-label) {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-primary);
}

.filter-spacer {
  flex: 1;
}

/* 操作按钮 */
.filter-actions {
  display: flex;
  gap: 0.375rem;
}

/* ========================================
   批量操作栏
   ======================================== */
.batch-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-accent);
}

.batch-info i {
  font-size: 1rem;
}

.batch-info strong {
  font-weight: 700;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.batch-dropdown {
  min-width: 150px;
}

/* ========================================
   表格区域
   ======================================== */
.table-section {
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 40px -10px rgba(0, 0, 0, 0.08);
}

.orders-table {
  border: none;
}

.orders-table :deep(.p-datatable-header) {
  background: transparent;
  border: none;
}

.orders-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-50, #f8fafc);
  border-color: var(--surface-200, #e2e8f0);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--surface-500, #64748b);
}

.orders-table :deep(.p-datatable-tbody > tr) {
  transition: background-color 0.15s ease;
}

.orders-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50, #f8fafc);
}

.orders-table :deep(.p-paginator) {
  border: none;
  background: transparent;
  padding: 1rem;
}

/* 表格单元格样式 */
.cell-primary {
  font-weight: 600;
  color: var(--surface-900, #0f172a);
}

.cell-secondary {
  font-size: 0.8rem;
  color: var(--surface-500, #64748b);
}

.cell-tertiary {
  font-size: 0.75rem;
  color: var(--surface-400, #94a3b8);
}

.action-cell {
  display: flex;
  gap: 0.25rem;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--surface-400, #94a3b8);
}

.empty-icon {
  width: 4.5rem;
  height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  border-radius: 1rem;
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--surface-500, #64748b);
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--surface-500, #64748b);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem;
  color: var(--color-primary, #0ea5e9);
}

.loading-state i {
  font-size: 2rem;
}

.loading-state span {
  font-size: 0.875rem;
  color: var(--surface-500, #64748b);
}

/* ========================================
   响应式
   ======================================== */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.25rem;
  }

  .hero-stats {
    width: 100%;
  }

  .hero-stat-card {
    flex: 1;
    min-width: 120px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-spacer {
    display: none;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .search-input {
    width: 100%;
  }

  .batch-action-bar {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .batch-actions {
    flex-wrap: wrap;
  }
}
</style>
