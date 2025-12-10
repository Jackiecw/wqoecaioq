<template>
  <Dialog
    :visible="isOpen"
    modal
    :style="{ width: '700px', maxWidth: '95vw' }"
    :pt="{
      root: { class: 'p-0' },
      header: { class: 'hidden' },
      content: { class: 'p-0' }
    }"
    @update:visible="handleDialogClose"
  >
    <div class="modal-container">
      <!-- Custom Header -->
      <div class="modal-header">
        <div class="header-info">
          <div class="header-icon">
            <i class="pi pi-truck"></i>
          </div>
          <div>
            <h2 class="header-title">订单详情</h2>
            <p class="header-desc">订单 #{{ orderId }}</p>
          </div>
        </div>
        <button class="btn-close" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>加载中...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="error-state">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Content -->
      <div v-else-if="orderDetail" class="modal-body">
        <!-- Order Info Section -->
        <div class="detail-section">
          <h3 class="section-title">
            <i class="pi pi-info-circle"></i>
            订单信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">订单编号</span>
              <span class="info-value">{{ orderDetail.orderCode || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">批次号</span>
              <span class="info-value">{{ orderDetail.batchCode || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">订单日期</span>
              <span class="info-value">{{ formatDate(orderDetail.orderDate) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前状态</span>
              <span class="info-value">
                <span class="status-badge" :class="getStatusClass(orderDetail.status)">
                  {{ statusLabel(orderDetail.status) }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Product Info Section -->
        <div class="detail-section">
          <h3 class="section-title">
            <i class="pi pi-box"></i>
            产品信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">SKU</span>
              <span class="info-value font-medium">{{ orderDetail.skuName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">产品名称</span>
              <span class="info-value">{{ orderDetail.productName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">颜色</span>
              <span class="info-value">{{ orderDetail.productColor || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">规格</span>
              <span class="info-value">{{ orderDetail.productSpec || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">插头</span>
              <span class="info-value">{{ orderDetail.plugSpec || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">销售地区</span>
              <span class="info-value">{{ orderDetail.salesRegion || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Quantity & Price Section -->
        <div class="detail-section">
          <h3 class="section-title">
            <i class="pi pi-dollar"></i>
            数量与价格
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">数量</span>
              <span class="info-value font-bold">{{ orderDetail.quantity || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">单价</span>
              <span class="info-value">¥{{ formatNumber(orderDetail.unitPrice) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总价</span>
              <span class="info-value font-bold text-accent">¥{{ formatNumber(orderDetail.totalPrice) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">物流费用</span>
              <span class="info-value">{{ orderDetail.logisticsFee ? '¥' + formatNumber(orderDetail.logisticsFee) : '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Logistics Info Section -->
        <div class="detail-section">
          <h3 class="section-title">
            <i class="pi pi-truck"></i>
            物流信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">物流商</span>
              <span class="info-value">{{ orderDetail.logisticsProvider || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">箱数</span>
              <span class="info-value">{{ orderDetail.cartonCount || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">体积 (CBM)</span>
              <span class="info-value">{{ orderDetail.totalCbm || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">计费方式</span>
              <span class="info-value">{{ billingMethodLabel(orderDetail.billingMethod) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div v-if="orderDetail.notes" class="detail-section">
          <h3 class="section-title">
            <i class="pi pi-file-edit"></i>
            备注
          </h3>
          <p class="notes-text">{{ orderDetail.notes }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="pi pi-inbox"></i>
        <span>未找到订单信息</span>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="closeModal">关闭</button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import apiClient from '@/services/apiClient';

type StatusKey = string;
type BillingMethod = '' | 'BY_CBM' | 'BY_WEIGHT' | 'FLAT_FEE';

interface OrderDetail {
  id: string | number;
  orderCode?: string;
  batchCode?: string;
  orderDate?: string;
  status?: string;
  skuName?: string;
  productName?: string;
  productColor?: string;
  productSpec?: string;
  plugSpec?: string;
  salesRegion?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  logisticsFee?: number;
  logisticsProvider?: string;
  cartonCount?: number;
  totalCbm?: number;
  billingMethod?: BillingMethod;
  notes?: string;
}

const props = defineProps<{
  isOpen: boolean;
  orderId: string | number | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isLoading = ref(false);
const errorMessage = ref('');
const orderDetail = ref<OrderDetail | null>(null);

const statusSteps = [
  { key: 'PENDING', label: '待下单' },
  { key: 'IN_PRODUCTION', label: '生产中' },
  { key: 'READY', label: '待出库' },
  { key: 'SHIPPED', label: '已出库' },
];

const statusLabel = (s?: StatusKey) => statusSteps.find((step) => step.key === s)?.label || s || '-';

const getStatusClass = (s?: StatusKey) => {
  if (s === 'SHIPPED') return 'status--success';
  if (s === 'PENDING') return 'status--secondary';
  if (s === 'IN_PRODUCTION') return 'status--warning';
  if (s === 'READY') return 'status--info';
  return 'status--secondary';
};

const billingMethodLabel = (method?: BillingMethod) => {
  if (method === 'BY_CBM') return '按体积';
  if (method === 'BY_WEIGHT') return '按重量';
  if (method === 'FLAT_FEE') return '一次性费用';
  return '-';
};

const formatNumber = (val?: number) => (val ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('zh-CN') : '-');

const fetchOrderDetail = async () => {
  if (!props.orderId) return;

  isLoading.value = true;
  errorMessage.value = '';
  orderDetail.value = null;

  try {
    const res = await apiClient.get(`/production/orders/${props.orderId}`);
    orderDetail.value = res.data;
  } catch (error: any) {
    console.error('获取订单详情失败:', error);
    errorMessage.value = error?.response?.data?.error || '获取订单详情失败';
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.orderId) {
      fetchOrderDetail();
    }
  },
  { immediate: true }
);

const handleDialogClose = (val: boolean) => {
  if (!val) {
    closeModal();
  }
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* ========================================
   Logistics Detail Modal - Modern UI
   ======================================== */
.modal-container {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-md);
  color: var(--color-accent);
  font-size: 1.125rem;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0.125rem 0 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

/* Loading & Error States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.error-state {
  color: #dc2626;
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.section-title i {
  color: var(--color-accent);
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1.5rem;
}

@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.info-label {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  text-align: right;
}

.info-value.font-medium {
  font-weight: 500;
}

.info-value.font-bold {
  font-weight: 600;
}

.info-value.text-accent {
  color: var(--color-accent);
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status--success {
  background: #d1fae5;
  color: #047857;
}

.status--warning {
  background: #fef3c7;
  color: #b45309;
}

.status--info {
  background: #dbeafe;
  color: #1d4ed8;
}

.status--secondary {
  background: #f3f4f6;
  color: #6b7280;
}

/* Notes */
.notes-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  padding: 0.75rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--color-bg-page);
  border-color: var(--color-text-secondary);
}
</style>
