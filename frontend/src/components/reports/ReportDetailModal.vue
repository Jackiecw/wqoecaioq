<template>
  <Dialog v-model:visible="isVisible" modal header="周报详情" :style="{ width: '40rem' }" @update:visible="handleDialogClose">
    <div v-if="report" class="flex flex-column gap-4">
      <div class="flex flex-wrap gap-6 text-sm">
        <div class="flex flex-column gap-1">
          <span class="font-bold text-500">开始日期</span>
          <span class="text-900">{{ formatDate(report.weekStartDate) }}</span>
        </div>
        <div class="flex flex-column gap-1">
          <span class="font-bold text-500">提交人</span>
          <span class="text-900">{{ report.author?.nickname ?? '--' }}</span>
        </div>
        <div class="flex flex-column gap-1">
          <span class="font-bold text-500">提交时间</span>
          <span class="text-900">{{ formatDateTime(report.createdAt) }}</span>
        </div>
      </div>

      <Divider />

      <div class="flex flex-column gap-2">
        <label class="font-bold text-700">本周总结</label>
        <div class="p-3 border-1 border-200 border-round bg-surface-50 text-sm white-space-pre-wrap">
          {{ report.summaryThisWeek || '无' }}
        </div>
      </div>

      <div class="flex flex-column gap-2">
        <label class="font-bold text-700">下周计划</label>
        <div class="p-3 border-1 border-200 border-round bg-surface-50 text-sm white-space-pre-wrap">
          {{ report.planNextWeek || '无' }}
        </div>
      </div>

      <div class="flex flex-column gap-2">
        <label class="font-bold text-700">遇到的问题</label>
        <div class="p-3 border-1 border-200 border-round bg-surface-50 text-sm white-space-pre-wrap">
          {{ report.problemsEncountered || '无' }}
        </div>
      </div>

      <div class="flex flex-column gap-2">
        <label class="font-bold text-700">其他</label>
        <div class="p-3 border-1 border-200 border-round bg-surface-50 text-sm white-space-pre-wrap">
          {{ report.other || '无' }}
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
import Divider from 'primevue/divider';
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
  return new Date(dateString).toLocaleString('zh-CN', { hour12: false });
};
</script>
