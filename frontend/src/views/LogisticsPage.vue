<template>
  <div class="page-shell">
    <!-- 头部 -->
    <PageHeader 
      title="生产管理" 
      subtitle="产品生产批次与订单管理"
    />

    <!-- 统计卡片 (KPI) -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">进行中批次</div>
          <div class="stat-value">{{ activeBatchCount }}</div>
        </div>
      </div>

      <div class="stat-card stat-card--accent">
        <div class="stat-icon stat-icon--accent">
          <i class="pi pi-wallet"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">在途货值</div>
          <div class="stat-value">¥{{ formatNumber(overall.totalPrice) }}</div>
        </div>
      </div>

      <div class="stat-card stat-card--action">
        <button v-if="canManage" class="btn-add-batch" @click="isCreateModalOpen = true">
          <i class="pi pi-plus"></i>
          新建批次
        </button>
      </div>
    </div>

    <!-- 筛选与工具栏 -->
    <FilterBar class="mb-6">
      <template #left>
        <div class="pill-tab-group">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="pill-tab"
            :class="{ 'is-active': filter.status === tab.key }"
            @click="filter.status = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="pill-count">{{ tab.count }}</span>
          </button>
        </div>
        
        <div class="surface-input w-64">
          <i class="pi pi-search text-[var(--color-text-muted)]"></i>
          <input 
            v-model="filter.keyword"
            type="text" 
            placeholder="搜索批次号 / SKU"
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
        <Button label="刷新" icon="pi pi-refresh" severity="secondary" outlined size="small" @click="fetchBatches" :pt="{ root: { class: 'h-[40px]' } }" />
      </template>
    </FilterBar>

    <!-- 批次卡片列表 -->
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>加载中...</span>
    </div>

    <div v-else-if="filteredBatches.length === 0" class="empty-state">
      <i class="pi pi-inbox"></i>
      <span>暂无批次数据</span>
      <button v-if="canManage" class="btn-empty-action" @click="isCreateModalOpen = true">
        <i class="pi pi-plus"></i>
        创建第一个批次
      </button>
    </div>

    <div v-else class="batch-grid">
      <ProductionBatchCard
        v-for="batch in filteredBatches"
        :key="batch.id"
        :batch="batch"
        @add-order="handleAddOrder"
        @update-status="handleUpdateBatchStatus"
        @delete-batch="handleDeleteBatch"
        @view-order="openDetail"
        @delete-order="handleDeleteOrder"
      />
    </div>

    <!-- Create Batch Modal -->
    <LogisticsBatchFormModal
      :isOpen="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="onBatchCreated"
    />

    <!-- Order Detail Modal -->
    <LogisticsDetailModal
      v-if="detailModalOpen"
      :isOpen="detailModalOpen"
      :orderId="selectedDetailId"
      @close="closeDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import ProductionBatchCard from '@/components/production/ProductionBatchCard.vue';
import LogisticsBatchFormModal from '@/components/logistics/LogisticsBatchFormModal.vue';
import LogisticsDetailModal from '@/components/logistics/LogisticsDetailModal.vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/apiClient';

type StatusKey = 'PENDING' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED';

interface Order {
  id: string | number;
  orderCode: string;
  skuName: string;
  productColor?: string;
  productSpec?: string;
  quantity: number;
  totalPrice: number;
}

interface Batch {
  id: string;
  countryCode: string;
  batchSequence: number;
  batchNumber: string;
  status: StatusKey;
  notes?: string;
  orders?: Order[];
  batchCode?: string;
  stats?: {
    totalQuantity: number;
    totalPrice: number;
  };
}

interface CountryOption {
  code: string;
  name: string;
}

const authStore = useAuthStore();
const canManage = computed(() => {
  const role = authStore.role?.toLowerCase() || '';
  return role === 'admin' || role.includes('管理员') || role.includes('admin');
});

const tabs = computed(() => [
  { key: '', label: '全部', count: batches.value.length },
  { key: 'PENDING', label: '待下单', count: batches.value.filter(b => b.status === 'PENDING').length },
  { key: 'IN_PRODUCTION', label: '生产中', count: batches.value.filter(b => b.status === 'IN_PRODUCTION').length },
  { key: 'READY', label: '待出库', count: batches.value.filter(b => b.status === 'READY').length },
  { key: 'SHIPPED', label: '已出库', count: batches.value.filter(b => b.status === 'SHIPPED').length },
]);

const filter = ref({
  status: '' as StatusKey | '',
  keyword: '',
  countryCode: '',
});

const batches = ref<Batch[]>([]);
const overall = ref({ totalQuantity: 0, totalPrice: 0 });
const isLoading = ref(false);
const countryOptions = ref<CountryOption[]>([]);

const isCreateModalOpen = ref(false);
const detailModalOpen = ref(false);
const selectedDetailId = ref<string | number | null>(null);

const countryOptionsWithAll = computed(() => [
  { code: '', name: '全部' },
  ...countryOptions.value,
]);

const filteredBatches = computed(() => {
  let result = batches.value;
  
  if (filter.value.status) {
    result = result.filter(b => b.status === filter.value.status);
  }
  
  if (filter.value.countryCode) {
    result = result.filter(b => b.countryCode === filter.value.countryCode);
  }
  
  if (filter.value.keyword) {
    const kw = filter.value.keyword.toLowerCase();
    result = result.filter(b => 
      b.batchCode?.toLowerCase().includes(kw) ||
      b.batchNumber?.toLowerCase().includes(kw) ||
      b.orders?.some(o => 
        o.orderCode.toLowerCase().includes(kw) ||
        o.skuName?.toLowerCase().includes(kw)
      )
    );
  }
  
  return result;
});

const activeBatchCount = computed(() => 
  batches.value.filter(b => b.status !== 'SHIPPED').length
);

const fetchBatches = async () => {
  isLoading.value = true;
  try {
    const res = await apiClient.get('/production/batches');
    batches.value = res.data.batches || [];
    overall.value = res.data.overall || { totalQuantity: 0, totalPrice: 0 };
  } catch (error) {
    console.error('Failed to fetch batches:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchCountries = async () => {
  try {
    const res = await apiClient.get('/countries');
    countryOptions.value = res.data || [];
  } catch (error) {
    console.error('Failed to fetch countries:', error);
  }
};

const handleAddOrder = (batch: Batch) => {
  // TODO: Open add order modal for specific batch
  alert(`添加订单到批次 ${batch.batchCode} - 功能待实现`);
};

const handleUpdateBatchStatus = async ({ batch, status }: { batch: Batch; status: StatusKey }) => {
  if (!batch.orders?.length) {
    alert('批次内没有订单，无法更新状态');
    return;
  }
  
  try {
    const orderIds = batch.orders.map(o => o.id);
    await apiClient.post('/admin/production/orders/batch-status', {
      orderIds,
      status,
      occurredAt: new Date().toISOString(),
    });
    await fetchBatches();
  } catch (error) {
    console.error('Failed to update batch status:', error);
    alert('更新状态失败');
  }
};

const handleDeleteBatch = async (batch: Batch) => {
  try {
    await apiClient.delete(`/admin/production/batches/${batch.id}`);
    await fetchBatches();
  } catch (error) {
    console.error('Failed to delete batch:', error);
    alert('删除批次失败');
  }
};

const handleDeleteOrder = async (order: Order) => {
  if (!confirm(`确定删除订单 ${order.orderCode} 吗？`)) return;
  
  try {
    await apiClient.delete(`/admin/production/orders/${order.id}`);
    await fetchBatches();
  } catch (error) {
    console.error('Failed to delete order:', error);
    alert('删除订单失败');
  }
};

const openDetail = (order: Order) => {
  selectedDetailId.value = order.id;
  detailModalOpen.value = true;
};

const closeDetail = () => {
  detailModalOpen.value = false;
  selectedDetailId.value = null;
};

const onBatchCreated = () => {
  isCreateModalOpen.value = false;
  fetchBatches();
};

const formatNumber = (v?: number) => (v ?? 0).toLocaleString();

onMounted(() => {
  fetchBatches();
  fetchCountries();
});
</script>

<style scoped>
.page-shell {
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Stats Row */
.stats-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  min-width: 180px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--color-bg-page);
  color: var(--color-text-muted);
  font-size: 1.25rem;
}

.stat-icon--accent {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.125rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-card--accent .stat-value {
  color: var(--color-accent);
}

.stat-card--action {
  margin-left: auto;
  padding: 0;
  border: none;
  background: transparent;
}

.btn-add-batch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-add-batch:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

/* Pill Tabs with Count */
.pill-tab-group {
  display: flex;
  gap: 0.25rem;
  background: var(--color-bg-page);
  padding: 0.25rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}

.pill-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pill-tab:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.pill-tab.is-active {
  background: var(--color-accent);
  color: white;
}

.pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.pill-tab:not(.is-active) .pill-count {
  background: var(--color-border);
}

/* Surface Input */
.surface-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  height: 40px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.surface-input input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  outline: none;
}

/* Batch Grid */
.batch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

/* Loading & Empty State */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.loading-state i,
.empty-state i {
  font-size: 2.5rem;
}

.btn-empty-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  margin-top: 0.5rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-empty-action:hover {
  filter: brightness(0.95);
}

@media (max-width: 768px) {
  .page-shell {
    padding: 1rem;
  }
  
  .stats-row {
    flex-wrap: wrap;
  }
  
  .stat-card {
    min-width: 140px;
    flex: 1;
  }
  
  .stat-card--action {
    width: 100%;
  }
  
  .btn-add-batch {
    width: 100%;
    justify-content: center;
  }
  
  .batch-grid {
    grid-template-columns: 1fr;
  }
  
  .pill-tab-group {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>

