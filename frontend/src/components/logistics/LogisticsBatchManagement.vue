<template>
  <section class="flex flex-column gap-3">
    <header class="flex align-items-center justify-content-between">
      <div>
        <h2 class="m-0 text-2xl font-bold text-color">批次管理</h2>
        <p class="text-sm text-color-secondary m-0">查看物流链路并更新状态</p>
      </div>
      <Button
        v-if="isAdmin"
        label="新增批次"
        icon="pi pi-plus"
        @click="emit('create-batch-request')"
      />
    </header>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <DataTable
      :value="batches"
      data-key="id"
      :loading="isLoading"
      class="shadow-1 border-round-lg"
      size="small"
      :pt="{ root: { style: 'overflow: hidden' } }"
    >
      <template #empty>
        <div class="text-center text-color-secondary py-3">
          暂无物流数据。{{ isAdmin ? '点击右上角“新增批次”创建一条记录' : '' }}
        </div>
      </template>

      <Column field="batchNumber" header="批次" style="width: 8rem">
        <template #body="{ data }">
          <span class="font-semibold text-color">{{ data.batchNumber }}</span>
        </template>
      </Column>

      <Column header="订单日期" style="width: 9rem">
        <template #body="{ data }">
          {{ formatDate(data.orderDate) }}
        </template>
      </Column>

      <Column header="产品 (SKU)" style="min-width: 12rem">
        <template #body="{ data }">
          <div class="flex flex-column gap-1">
            <span class="font-medium text-color">{{ data.product.sku }}</span>
            <small class="text-color-secondary">{{ data.product.name }}</small>
          </div>
        </template>
      </Column>

      <Column header="销售地" style="width: 6rem">
        <template #body="{ data }">
          {{ data.country.code }}
        </template>
      </Column>

      <Column header="数量" style="width: 6rem">
        <template #body="{ data }">
          {{ data.quantity }}
        </template>
      </Column>

      <Column header="物流状态" style="min-width: 20rem">
        <template #body="{ data }">
          <LogisticsStepper
            :current-status="data.currentStatus"
            :events="data.events"
            :is-admin="isAdmin"
            @step-click="(status) => onUpdateStatus(data, status)"
          />
        </template>
      </Column>

      <Column header="预计入仓" style="width: 9rem">
        <template #body="{ data }">
          {{ formatDate(data.estimatedWarehouseDate) }}
        </template>
      </Column>

      <Column v-if="isAdmin" header="操作" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              label="更新"
              size="small"
              text
              @click="onUpdateStatus(data, null)"
              aria-label="更新物流状态"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              size="small"
              text
              aria-label="删除批次"
              @click="onDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '@/stores/auth';
import LogisticsStepper from './LogisticsStepper.vue';

type LogisticsStatus =
  | 'FACTORY'
  | 'WAREHOUSE_READY'
  | 'CONTAINER_LOADED'
  | 'EXPORT_CUSTOMS'
  | 'SHIPPING'
  | 'IMPORT_CUSTOMS'
  | 'LOCAL_DELIVERY'
  | 'COMPLETED';

type BatchEvent = {
  status: LogisticsStatus;
  eventDate: string;
  notes?: string | null;
};

type Batch = {
  id: string | number;
  batchNumber: string;
  orderDate: string | null;
  product: {
    sku: string;
    name: string;
  };
  country: {
    code: string;
    name?: string;
  };
  quantity: number;
  currentStatus: LogisticsStatus;
  events: BatchEvent[];
  estimatedWarehouseDate?: string | null;
};

const props = withDefaults(
  defineProps<{
    batches: Batch[];
    isLoading?: boolean;
    errorMessage?: string;
  }>(),
  {
    batches: () => [],
    isLoading: false,
    errorMessage: '',
  },
);

const emit = defineEmits<{
  (e: 'create-batch-request'): void;
  (e: 'update-status-request', payload: { batch: Batch; targetStatus: LogisticsStatus | null }): void;
  (e: 'delete-batch', batch: Batch): void;
}>();

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');

const onUpdateStatus = (batch: Batch, targetStatus: LogisticsStatus | null) => {
  emit('update-status-request', { batch, targetStatus });
};

const onDelete = (batch: Batch) => {
  emit('delete-batch', batch);
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toISOString().split('T')[0];
};
</script>
