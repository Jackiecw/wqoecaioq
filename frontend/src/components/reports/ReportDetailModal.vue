<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :style="{ width: '56rem' }"
    :breakpoints="{ '960px': '80vw', '640px': '95vw' }"
    :dismissableMask="true"
    :draggable="false"
    :showHeader="false"
    :pt="{
      root: { class: 'report-dialog' },
      content: { class: 'report-dialog-content' },
      mask: { class: 'report-dialog-mask' }
    }"
    @update:visible="handleDialogClose"
  >
    <div v-if="report" class="report-detail">
      <!-- Custom Header -->
      <div class="dialog-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-file-edit"></i>
          </div>
          <div class="header-info">
            <h3 class="dialog-title">周报详情</h3>
            <p class="dialog-subtitle">{{ formatWeekRange(report.weekStartDate) }}</p>
          </div>
        </div>
        <button class="close-btn" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Meta Cards -->
      <div class="meta-row">
        <div class="meta-card meta-card--blue">
          <i class="pi pi-calendar meta-icon"></i>
          <div class="meta-content">
            <span class="meta-label">开始日期</span>
            <span class="meta-value">{{ formatDate(report.weekStartDate) }}</span>
          </div>
        </div>
        <div class="meta-card meta-card--purple">
          <i class="pi pi-user meta-icon"></i>
          <div class="meta-content">
            <span class="meta-label">提交人</span>
            <span class="meta-value">{{ report.author?.nickname ?? '未知' }}</span>
          </div>
        </div>
        <div class="meta-card meta-card--green">
          <i class="pi pi-clock meta-icon"></i>
          <div class="meta-content">
            <span class="meta-label">提交时间</span>
            <span class="meta-value">{{ formatDateTime(report.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="content-grid">
        <div class="content-section content-section--primary">
          <div class="section-header">
            <div class="section-icon section-icon--green">
              <i class="pi pi-check-circle"></i>
            </div>
            <span class="section-title">本周工作总结</span>
          </div>
          <div class="section-body">
            <p class="section-text">{{ report.summaryThisWeek || '暂无内容' }}</p>
          </div>
        </div>

        <div class="content-section content-section--primary">
          <div class="section-header">
            <div class="section-icon section-icon--blue">
              <i class="pi pi-flag"></i>
            </div>
            <span class="section-title">下周工作计划</span>
          </div>
          <div class="section-body">
            <p class="section-text">{{ report.planNextWeek || '暂无内容' }}</p>
          </div>
        </div>

        <div class="content-section content-section--secondary">
          <div class="section-header">
            <div class="section-icon section-icon--amber">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <span class="section-title">遇到的问题</span>
          </div>
          <div class="section-body">
            <p class="section-text section-text--muted">{{ report.problemsEncountered || '暂无问题' }}</p>
          </div>
        </div>

        <div class="content-section content-section--secondary">
          <div class="section-header">
            <div class="section-icon section-icon--gray">
              <i class="pi pi-comment"></i>
            </div>
            <span class="section-title">其他备注</span>
          </div>
          <div class="section-body">
            <p class="section-text section-text--muted">{{ report.other || '暂无备注' }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <Button 
          label="关闭" 
          icon="pi pi-times" 
          severity="secondary" 
          outlined
          @click="closeModal" 
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import type { WeeklyReport } from '@/services/reportService';

const props = defineProps<{
  isOpen: boolean;
  report: WeeklyReport | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const isVisible = ref(false);

watch(
  () => props.isOpen,
  (newVal) => {
    isVisible.value = newVal;
  },
);

const handleDialogClose = (val: boolean) => {
  if (!val) {
    closeModal();
  }
};

const closeModal = () => {
  isVisible.value = false;
  emit('close');
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('zh-CN', {
    hour12: false,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatWeekRange = (startDateString?: string) => {
  if (!startDateString) return '';
  const start = new Date(startDateString);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const formatShort = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${formatShort(start)} - ${formatShort(end)}`;
};
</script>

<style scoped>
.report-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Dialog Header */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.header-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.dialog-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* Meta Row */
.meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.meta-card--blue .meta-icon { color: #3b82f6; }
.meta-card--purple .meta-icon { color: #8b5cf6; }
.meta-card--green .meta-icon { color: #10b981; }

.meta-icon {
  font-size: 1.25rem;
}

.meta-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.meta-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.meta-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.content-section {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.content-section--primary {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.content-section--secondary {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.section-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.section-icon--green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.section-icon--blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.section-icon--amber {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.section-icon--gray {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-body {
  padding: 1rem;
  min-height: 80px;
}

.section-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.section-text--muted {
  color: var(--color-text-secondary);
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

/* Responsive */
@media (max-width: 768px) {
  .meta-row {
    grid-template-columns: 1fr;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Global Dialog Styles */
.report-dialog .p-dialog-content {
  padding: 1.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.report-dialog-mask {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
</style>
