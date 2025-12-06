<template>
  <div class="kanban-board" :class="{ 'kanban-board--empty': batches.length === 0 }">
    <div
      v-for="column in columns"
      :key="column.status"
      class="kanban-column"
      @dragover.prevent="onDragOver(column.status)"
      @dragleave.prevent="onDragLeave(column.status)"
      @drop.prevent="onDrop(column.status)"
      :class="{ 'drag-over': dragOverStatus === column.status }"
      :style="{ '--accent': column.accent }"
    >
      <div class="column-header">
        <div>
          <p class="column-title">{{ column.label }}</p>
          <p class="column-subtitle">{{ column.subtitle }}</p>
        </div>
        <div class="column-metrics">
          <span class="column-count">{{ column.batches.length }}</span>
          <span v-if="column.totalAmount" class="column-amount">
            ¥{{ column.totalAmount }}
          </span>
        </div>
      </div>

      <div class="column-body">
        <LogisticsKanbanCard
          v-for="batch in column.batches"
          :key="batch.id"
          :batch="batch"
          :is-admin="isAdmin"
          @click="onCardClick"
          @dragstart="onDragStart(batch)"
        />

        <div v-if="column.batches.length === 0" class="column-empty">
          <p>无批次</p>
          <p class="muted">等待新的进度...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import LogisticsKanbanCard from './LogisticsKanbanCard.vue';

type LogisticsStatus =
  | 'FACTORY'
  | 'WAREHOUSE_READY'
  | 'CONTAINER_LOADED'
  | 'EXPORT_CUSTOMS'
  | 'SHIPPING'
  | 'IMPORT_CUSTOMS'
  | 'LOCAL_DELIVERY'
  | 'COMPLETED';

type Batch = {
  id: string | number;
  batchNumber: string;
  currentStatus: LogisticsStatus;
  totalPrice?: number | string | null;
  product: {
    sku: string;
    name: string;
  };
  productSpec?: string | null;
  quantity: number;
  estimatedWarehouseDate?: string | null;
  country: {
    code: string;
    name?: string | null;
  };
  [key: string]: any;
};

type ColumnMeta = {
  key: LogisticsStatus;
  label: string;
  subtitle: string;
  accent: string;
};

type ColumnState = ColumnMeta & {
  batches: Batch[];
  totalAmount: string | null;
  status: LogisticsStatus;
};

const props = defineProps<{
  batches: Batch[];
  isLoading?: boolean;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update-status-request', payload: { batch: Batch; targetStatus: LogisticsStatus | null }): void;
}>();

const STATUS_META: ColumnMeta[] = [
  { key: 'FACTORY', label: '生产中', subtitle: '排产与备料', accent: '#A5B4FC' },
  { key: 'WAREHOUSE_READY', label: '待出库', subtitle: '成品待发', accent: '#67E8F9' },
  { key: 'CONTAINER_LOADED', label: '已装柜', subtitle: '等待出口', accent: '#34D399' },
  { key: 'EXPORT_CUSTOMS', label: '出口清关', subtitle: '报关与查验', accent: '#FBBF24' },
  { key: 'SHIPPING', label: '国际运输', subtitle: '海运 / 空运', accent: '#F472B6' },
  { key: 'IMPORT_CUSTOMS', label: '进口清关', subtitle: '海外报关', accent: '#FB7185' },
  { key: 'LOCAL_DELIVERY', label: '本地派送', subtitle: '海外末端', accent: '#38BDF8' },
  { key: 'COMPLETED', label: '已入仓', subtitle: '入仓完成', accent: '#A7F3D0' },
];

const draggingBatchId = ref<string | number | null>(null);
const dragOverStatus = ref<LogisticsStatus | null>(null);

const columns = computed<ColumnState[]>(() => {
  const batchesByStatus = props.batches.reduce<Record<string, Batch[]>>((acc, batch) => {
    const status = batch.currentStatus;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(batch);
    return acc;
  }, {});

  return STATUS_META.map((statusInfo) => {
    const batchesInColumn = batchesByStatus[statusInfo.key] || [];
    const totalAmountNumber = batchesInColumn.reduce((sum, batch) => sum + (Number(batch.totalPrice) || 0), 0);
    return {
      ...statusInfo,
      status: statusInfo.key,
      batches: batchesInColumn,
      totalAmount: totalAmountNumber
        ? totalAmountNumber.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
        : null,
    };
  });
});

const onDragStart = (batch: Batch) => {
  draggingBatchId.value = batch.id;
  dragOverStatus.value = null;
};

const onDragOver = (statusKey: LogisticsStatus) => {
  if (!props.isAdmin) return;
  dragOverStatus.value = statusKey;
};

const onDragLeave = (statusKey: LogisticsStatus) => {
  if (dragOverStatus.value === statusKey) {
    dragOverStatus.value = null;
  }
};

const onDrop = (targetStatus: LogisticsStatus) => {
  if (!props.isAdmin) return;
  const batchId = draggingBatchId.value;
  const batch = props.batches.find((item) => item.id === batchId);

  dragOverStatus.value = null;
  draggingBatchId.value = null;

  if (batch && batch.currentStatus !== targetStatus) {
    emit('update-status-request', { batch, targetStatus });
  }
};

const onCardClick = (batch: Batch) => {
  if (!props.isAdmin) return;
  emit('update-status-request', { batch, targetStatus: null });
};
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-auto-flow: column;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem;
  background-color: var(--color-bg-page);
  border-radius: var(--radius-md);
  min-height: 540px;
}
.kanban-board--empty {
  justify-content: center;
}
.kanban-column {
  width: 300px;
  min-width: 280px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  position: relative;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: var(--shadow-sm);
}
.kanban-column::before {
  content: '';
  position: absolute;
  inset: 0;
  width: 6px;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  background: var(--accent, var(--color-text-muted));
}
.kanban-column.drag-over {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
}
.column-header {
  position: sticky;
  top: 0;
  background: var(--color-bg-card);
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  border-top-right-radius: var(--radius-md);
}
.column-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
.column-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}
.column-metrics {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.column-count {
  background: var(--color-accent);
  color: #fff;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
}
.column-amount {
  font-size: 0.85rem;
  color: var(--color-text-primary);
  font-weight: 600;
}
.column-body {
  padding: 0.75rem 1rem 1rem;
  min-height: 420px;
}
.column-empty {
  text-align: center;
  padding: 1.5rem 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
}
.column-empty .muted {
  font-size: 0.8rem;
  margin-top: 0.35rem;
}
</style>
