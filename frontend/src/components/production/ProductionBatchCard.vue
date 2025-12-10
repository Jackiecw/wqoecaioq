<template>
  <div class="batch-card" :class="[`batch-card--${batch.status?.toLowerCase()}`]">
    <!-- Card Header -->
    <div class="card-header" @click="toggleExpand">
      <div class="header-left">
        <div class="batch-code">
          <i class="pi pi-box"></i>
          <span>{{ batchCode }}</span>
        </div>
        <span class="status-badge" :class="getStatusClass(batch.status)">
          {{ getStatusLabel(batch.status) }}
        </span>
      </div>
      <div class="header-right">
        <span class="country-badge">{{ batch.countryCode }}</span>
        <i class="pi" :class="isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
      </div>
    </div>

    <!-- Card Stats -->
    <div class="card-stats">
      <div class="stat-item">
        <span class="stat-label">订单数</span>
        <span class="stat-value">{{ orderCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总数量</span>
        <span class="stat-value">{{ totalQuantity }}</span>
      </div>
      <div class="stat-item stat-item--highlight">
        <span class="stat-label">货值</span>
        <span class="stat-value">¥{{ formatNumber(totalPrice) }}</span>
      </div>
    </div>

    <!-- Card Actions -->
    <div class="card-actions">
      <button class="btn-action btn-action--primary" @click.stop="handleAddOrder">
        <i class="pi pi-plus"></i>
        添加订单
      </button>
      <div class="action-group">
        <select 
          v-model="selectedStatus" 
          class="status-select" 
          @click.stop
          @change="handleStatusChange"
        >
          <option value="" disabled>更新状态</option>
          <option v-for="s in statusOptions" :key="s.key" :value="s.key">
            {{ s.label }}
          </option>
        </select>
        <button class="btn-action btn-action--icon" @click.stop="handleDelete" title="删除批次">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <!-- Expanded Orders List -->
    <div v-if="isExpanded" class="card-orders">
      <div class="orders-header">
        <span>批次订单列表</span>
        <span class="orders-count">{{ orderCount }} 个订单</span>
      </div>
      <div v-if="orders.length === 0" class="orders-empty">
        <i class="pi pi-inbox"></i>
        <span>暂无订单，点击上方按钮添加</span>
      </div>
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-item">
          <div class="order-info">
            <span class="order-code">{{ order.orderCode }}</span>
            <span class="order-product">{{ order.skuName }}</span>
          </div>
          <div class="order-details">
            <span class="order-spec">{{ order.productColor }} / {{ order.productSpec }}</span>
            <span class="order-qty">× {{ order.quantity }}</span>
            <span class="order-price">¥{{ formatNumber(order.totalPrice) }}</span>
          </div>
          <div class="order-actions">
            <button class="btn-icon" @click="$emit('view-order', order)" title="查看详情">
              <i class="pi pi-eye"></i>
            </button>
            <button class="btn-icon btn-icon--danger" @click="$emit('delete-order', order)" title="删除">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

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
  stats?: {
    totalQuantity: number;
    totalPrice: number;
  };
}

const props = defineProps<{
  batch: Batch;
}>();

const emit = defineEmits<{
  (e: 'add-order', batch: Batch): void;
  (e: 'update-status', payload: { batch: Batch; status: StatusKey }): void;
  (e: 'delete-batch', batch: Batch): void;
  (e: 'view-order', order: Order): void;
  (e: 'delete-order', order: Order): void;
}>();

const isExpanded = ref(false);
const selectedStatus = ref<StatusKey | ''>('');

const statusOptions: Array<{ key: StatusKey; label: string }> = [
  { key: 'PENDING', label: '待下单' },
  { key: 'IN_PRODUCTION', label: '生产中' },
  { key: 'READY', label: '待出库' },
  { key: 'SHIPPED', label: '已出库' },
];

const batchCode = computed(() => `${props.batch.countryCode}${props.batch.batchNumber}`);
const orders = computed(() => props.batch.orders || []);
const orderCount = computed(() => orders.value.length);
const totalQuantity = computed(() => props.batch.stats?.totalQuantity || orders.value.reduce((sum, o) => sum + (o.quantity || 0), 0));
const totalPrice = computed(() => props.batch.stats?.totalPrice || orders.value.reduce((sum, o) => sum + (o.totalPrice || 0), 0));

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const getStatusLabel = (status?: StatusKey) => {
  return statusOptions.find(s => s.key === status)?.label || status || '未知';
};

const getStatusClass = (status?: StatusKey) => {
  if (status === 'SHIPPED') return 'status--success';
  if (status === 'PENDING') return 'status--secondary';
  if (status === 'IN_PRODUCTION') return 'status--warning';
  if (status === 'READY') return 'status--info';
  return 'status--secondary';
};

const formatNumber = (v?: number) => (v ?? 0).toLocaleString();

const handleAddOrder = () => {
  emit('add-order', props.batch);
};

const handleStatusChange = () => {
  if (selectedStatus.value) {
    emit('update-status', { batch: props.batch, status: selectedStatus.value });
    selectedStatus.value = '';
  }
};

const handleDelete = () => {
  if (confirm(`确定删除批次 ${batchCode.value} 及其所有订单吗？`)) {
    emit('delete-batch', props.batch);
  }
};
</script>

<style scoped>
.batch-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-fast);
}

.batch-card:hover {
  box-shadow: var(--shadow-md);
}

/* Status-based left border */
.batch-card--pending { border-left: 4px solid #9ca3af; }
.batch-card--in_production { border-left: 4px solid #f59e0b; }
.batch-card--ready { border-left: 4px solid #3b82f6; }
.batch-card--shipped { border-left: 4px solid #10b981; }

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  background: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.batch-code {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.batch-code i {
  color: var(--color-accent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.country-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.header-right i {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status--success { background: #d1fae5; color: #047857; }
.status--warning { background: #fef3c7; color: #b45309; }
.status--info { background: #dbeafe; color: #1d4ed8; }
.status--secondary { background: #f3f4f6; color: #6b7280; }

/* Stats */
.card-stats {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-item--highlight .stat-value {
  color: var(--color-accent);
}

/* Actions */
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.action-group {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-action--primary {
  background: var(--color-accent);
  color: white;
}

.btn-action--primary:hover {
  filter: brightness(0.95);
}

.btn-action--icon {
  padding: 0.5rem;
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.btn-action--icon:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.status-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  cursor: pointer;
}

/* Expanded Orders */
.card-orders {
  border-top: 1px solid var(--color-border);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-page);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.orders-count {
  font-weight: 400;
}

.orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.orders-list {
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.order-item:hover {
  background: var(--color-bg-page);
}

.order-item:last-child {
  border-bottom: none;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.order-code {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.order-product {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.order-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8125rem;
}

.order-spec {
  color: var(--color-text-secondary);
}

.order-qty {
  font-weight: 500;
  color: var(--color-text-primary);
}

.order-price {
  font-weight: 600;
  color: var(--color-accent);
}

.order-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.btn-icon--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

@media (max-width: 640px) {
  .card-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn-action--primary {
    width: 100%;
    justify-content: center;
  }
  
  .action-group {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
