<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="周报详情"
    :style="{ width: '52rem' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :dismissableMask="true"
    :draggable="false"
    class="p-dialog-custom"
    @update:visible="handleDialogClose"
  >
    <div v-if="report" class="flex flex-col gap-6 p-1">
      <!-- Meta Info -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="meta-card">
          <div class="meta-icon text-blue-600 bg-blue-50">
             <i class="pi pi-calendar"></i>
          </div>
          <div>
            <span class="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">开始日期</span>
            <span class="block text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{{ formatDate(report.weekStartDate) }}</span>
          </div>
        </div>
        <div class="meta-card">
           <div class="meta-icon text-purple-600 bg-purple-50">
             <i class="pi pi-user"></i>
          </div>
          <div>
            <span class="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">提交人</span>
            <span class="block text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{{ report.author?.nickname ?? '--' }}</span>
          </div>
        </div>
        <div class="meta-card">
           <div class="meta-icon text-green-600 bg-green-50">
             <i class="pi pi-clock"></i>
          </div>
          <div>
            <span class="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">提交时间</span>
            <span class="block text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{{ formatDateTime(report.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="content-card">
          <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <i class="pi pi-check-circle text-green-500"></i>
            <span class="font-bold text-gray-700">本周总结</span>
          </div>
          <div class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ report.summaryThisWeek || '无' }}</div>
        </div>

        <div class="content-card">
          <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <i class="pi pi-flag text-blue-500"></i>
            <span class="font-bold text-gray-700">下周计划</span>
          </div>
          <div class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ report.planNextWeek || '无' }}</div>
        </div>

        <div class="content-card">
          <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <i class="pi pi-exclamation-triangle text-amber-500"></i>
            <span class="font-bold text-gray-700">遇到的问题</span>
          </div>
          <div class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ report.problemsEncountered || '无' }}</div>
        </div>

        <div class="content-card">
          <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <i class="pi pi-comment text-gray-400"></i>
            <span class="font-bold text-gray-700">其他</span>
          </div>
          <div class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ report.other || '无' }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4 border-t border-gray-100">
        <Button label="关闭" severity="secondary" text @click="closeModal" />
      </div>
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
.meta-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-page);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.meta-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
}

.content-card {
  background-color: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  height: 100%;
  box-shadow: var(--shadow-sm);
}
</style>
