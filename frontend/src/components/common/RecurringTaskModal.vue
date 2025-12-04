<template>
  <Dialog
    :visible="isOpen"
    modal
    header="新建周期任务"
    :style="{ width: '480px' }"
    @update:visible="onDialogToggle"
  >
    <div class="flex flex-column gap-3">
      <div class="flex flex-column gap-2">
        <label for="taskContent" class="text-sm font-semibold text-color">任务内容 *</label>
        <Textarea
          id="taskContent"
          v-model="formData.content"
          rows="3"
          auto-resize
          class="w-full"
          placeholder="例如：检查店铺库存，更新价格，整理周报数据"
        />
      </div>

      <div class="flex flex-column gap-2">
        <label for="taskPeriod" class="text-sm font-semibold text-color">周期 *</label>
        <Dropdown
          input-id="taskPeriod"
          v-model="formData.period"
          :options="periodOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          placeholder="请选择周期"
        />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <div class="flex justify-content-end gap-2 pt-2">
        <Button type="button" label="取消" severity="secondary" text @click="closeModal" />
        <Button type="button" label="创建" icon="pi pi-check" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

type TaskPayload = {
  content: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
};

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'task-created', payload: unknown): void;
}>();

const periodOptions = [
  { value: 'DAILY', label: '每日' },
  { value: 'WEEKLY', label: '每周' },
  { value: 'MONTHLY', label: '每月' },
];

const createDefaultForm = (): TaskPayload => ({
  content: '',
  period: 'DAILY',
});

const formData = ref<TaskPayload>(createDefaultForm());
const errorMessage = ref('');
const isSubmitting = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      formData.value = createDefaultForm();
      errorMessage.value = '';
    }
  },
);

const onDialogToggle = (visible: boolean) => {
  if (!visible) {
    closeModal();
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  if (!formData.value.content.trim()) {
    errorMessage.value = '任务内容不能为空';
    return;
  }

  isSubmitting.value = true;
  try {
    const { data } = await apiClient.post('/recurring-tasks', formData.value);
    emit('task-created', data);
    closeModal();
  } catch (error: any) {
    console.error('创建任务失败:', error);
    errorMessage.value = error.response?.data?.error || '创建失败，请稍后重试';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  emit('close');
};
</script>
