<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="周报详情"
    :style="{ width: '52rem' }"
    class="report-modal"
    @update:visible="handleDialogClose"
  >
    <div v-if="report" class="modal-content">
      <!-- Meta Info -->
      <div class="meta-row">
        <div class="meta-card meta-card--blue">
          <i class="pi pi-calendar"></i>
          <div>
            <span class="meta-label">开始日期</span>
            <span class="meta-value">{{ formatDate(report.weekStartDate) }}</span>
          </div>
        </div>
        <div class="meta-card meta-card--purple">
          <i class="pi pi-user"></i>
          <div>
            <span class="meta-label">提交人</span>
            <span class="meta-value">{{ report.author?.nickname ?? '--' }}</span>
          </div>
        </div>
        <div class="meta-card meta-card--green">
          <i class="pi pi-clock"></i>
          <div>
            <span class="meta-label">提交时间</span>
            <span class="meta-value">{{ formatDateTime(report.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <div class="content-card content-card--green">
          <div class="content-header">
            <i class="pi pi-check-circle"></i>
            <span>本周总结</span>
          </div>
          <div class="content-body">{{ report.summaryThisWeek || '无' }}</div>
        </div>

        <div class="content-card content-card--blue">
          <div class="content-header">
            <i class="pi pi-flag"></i>
            <span>下周计划</span>
          </div>
          <div class="content-body">{{ report.planNextWeek || '无' }}</div>
        </div>

        <div class="content-card content-card--orange">
          <div class="content-header">
            <i class="pi pi-exclamation-triangle"></i>
            <span>遇到的问题</span>
          </div>
          <div class="content-body">{{ report.problemsEncountered || '无' }}</div>
        </div>

        <div class="content-card content-card--gray">
          <div class="content-header">
            <i class="pi pi-comment"></i>
            <span>其他</span>
          </div>
          <div class="content-body">{{ report.other || '无' }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="关闭" @click="closeModal" />
    </template>
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
</script>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  border-radius: 0.75rem;
  background: var(--surface-50);
}

.meta-card i {
  font-size: 1.25rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.meta-card--blue i {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.meta-card--purple i {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.meta-card--green i {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.meta-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--surface-500);
}

.meta-value {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--surface-900);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.content-card {
  background: var(--surface-50);
  border-radius: 0.75rem;
  padding: 1rem;
  border-left: 4px solid transparent;
}

.content-card--green { border-left-color: #10b981; }
.content-card--blue { border-left-color: #3b82f6; }
.content-card--orange { border-left-color: #f59e0b; }
.content-card--gray { border-left-color: #9ca3af; }

.content-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--surface-700);
  margin-bottom: 0.75rem;
}

.content-card--green .content-header i { color: #10b981; }
.content-card--blue .content-header i { color: #3b82f6; }
.content-card--orange .content-header i { color: #f59e0b; }
.content-card--gray .content-header i { color: #9ca3af; }

.content-body {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--surface-700);
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .meta-row {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
