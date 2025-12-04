<template>
  <Dialog
    :visible="isOpen"
    modal
    :style="{ width: '32rem' }"
    :header="dialogTitle"
    @update:visible="onDialogToggle"
  >
    <section class="flex flex-column gap-3">
      <div class="flex flex-column gap-2">
        <label for="link-title" class="text-sm font-semibold text-color">标题</label>
        <InputText
          id="link-title"
          v-model="formData.title"
          class="w-full"
          autocomplete="off"
          placeholder="例如：Google Drive"
        />
      </div>

      <div class="flex flex-column gap-2">
        <label for="link-url" class="text-sm font-semibold text-color">URL</label>
        <InputText
          id="link-url"
          v-model="formData.url"
          class="w-full"
          type="url"
          placeholder="https://..."
        />
      </div>

      <div class="flex flex-column gap-2">
        <label for="link-description" class="text-sm font-semibold text-color">描述（可选）</label>
        <Textarea
          id="link-description"
          v-model="formData.description"
          class="w-full"
          auto-resize
          rows="3"
          placeholder="简短说明用途"
        />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <div class="flex justify-content-end gap-2 pt-2">
        <Button
          type="button"
          label="取消"
          severity="secondary"
          text
          @click="closeModal"
          :disabled="isLoading"
        />
        <Button
          type="button"
          :label="isEditMode ? '保存' : '创建'"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="isLoading"
        />
      </div>
    </section>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { isAxiosError } from 'axios';
import apiClient from '@/services/apiClient';

type LinkPayload = {
  title: string;
  url: string;
  description: string;
};

type Link = LinkPayload & {
  id: number;
};

const props = defineProps<{
  isOpen: boolean;
  linkToEdit: Link | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'link-created'): void;
  (e: 'link-updated'): void;
}>();

const createEmptyForm = (): LinkPayload => ({
  title: '',
  url: '',
  description: '',
});

const formData = ref<LinkPayload>(createEmptyForm());
const isLoading = ref(false);
const errorMessage = ref('');

const isEditMode = computed(() => !!props.linkToEdit);
const dialogTitle = computed(() => (isEditMode.value ? '编辑链接' : '新建链接'));

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return;
    errorMessage.value = '';
    if (props.linkToEdit) {
      const { title, url, description = '' } = props.linkToEdit;
      formData.value = { title, url, description };
    } else {
      formData.value = createEmptyForm();
    }
  },
);

const onDialogToggle = (visible: boolean) => {
  if (!visible) {
    closeModal();
  }
};

const handleSubmit = async () => {
  if (!formData.value.title || !formData.value.url) {
    errorMessage.value = '标题和 URL 不能为空';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  const payload: LinkPayload = {
    title: formData.value.title.trim(),
    url: formData.value.url.trim(),
    description: formData.value.description.trim(),
  };

  try {
    if (isEditMode.value && props.linkToEdit) {
      await apiClient.put(`/admin/links/${props.linkToEdit.id}`, payload);
      emit('link-updated');
    } else {
      await apiClient.post('/admin/links', payload);
      emit('link-created');
    }
    closeModal();
  } catch (error) {
    if (isAxiosError(error)) {
      errorMessage.value = error.response?.data?.error || '操作失败，请稍后重试';
    } else {
      errorMessage.value = '操作失败，请稍后重试';
    }
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  emit('close');
};
</script>
