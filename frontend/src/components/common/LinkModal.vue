<template>
  <Dialog v-model:visible="isVisible" modal header="新建/编辑链接" :style="{ width: '32rem' }" @update:visible="handleDialogClose">
    <template #header>
      <span class="text-lg font-bold text-900">{{ dialogTitle }}</span>
    </template>

    <div class="flex flex-column gap-4">
      <div class="flex flex-column gap-2">
        <label for="linkTitle" class="font-medium text-900">标题 *</label>
        <InputText id="linkTitle" v-model="formData.title" placeholder="例如: Shopee 印尼卖家中心" />
      </div>

      <div class="flex flex-column gap-2">
        <label for="linkUrl" class="font-medium text-900">URL (链接地址) *</label>
        <InputText id="linkUrl" v-model="formData.url" placeholder="例如: https://seller.shopee.co.id/" />
      </div>

      <div class="flex flex-column gap-2">
        <label for="linkDesc" class="font-medium text-900">备注 (说明)</label>
        <InputText id="linkDesc" v-model="formData.description" placeholder="例如: 财务后台" />
      </div>

      <div class="flex flex-column gap-2">
        <label for="linkOrder" class="font-medium text-900">显示顺序 (数字越小越靠前)</label>
        <InputNumber v-model="formData.displayOrder" :use-grouping="false" />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
    </div>

    <template #footer>
      <Button label="取消" severity="secondary" outlined @click="closeModal" />
      <Button :label="submitButtonText" @click="handleSubmit" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

interface LinkPayload {
  title: string;
  url: string;
  description?: string | null;
  displayOrder: number;
}

const props = defineProps<{
  isOpen: boolean;
  linkToEdit?: (Partial<LinkPayload> & { id?: string }) | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'link-created', value: any): void;
  (e: 'link-updated', value: any): void;
}>();

const defaultFormData = (): LinkPayload => ({
  title: '',
  url: '',
  description: '',
  displayOrder: 0,
});

const formData = ref<LinkPayload>(defaultFormData());
const errorMessage = ref('');
const isVisible = ref(false);

const isEditMode = computed(() => !!props.linkToEdit?.id);
const dialogTitle = computed(() => (isEditMode.value ? '编辑链接' : '新建链接'));
const submitButtonText = computed(() => (isEditMode.value ? '保存更改' : '创建'));

const handleSubmit = async () => {
  errorMessage.value = '';
  const payload: LinkPayload = {
    ...formData.value,
    description: formData.value.description || null,
    displayOrder: parseInt(String(formData.value.displayOrder), 10) || 0,
  };

  try {
    if (isEditMode.value && props.linkToEdit?.id) {
      const response = await apiClient.put(`/admin/links/${props.linkToEdit.id}`, payload);
      emit('link-updated', response.data);
    } else {
      const response = await apiClient.post('/admin/links', payload);
      emit('link-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('操作链接失败:', error);
    if (error.response?.data?.error) {
      errorMessage.value = error.response.data.error;
    } else if (error.response?.data?.details) {
      errorMessage.value = error.response.data.details.map((d: any) => d.message).join('; ');
    } else {
      errorMessage.value = '操作失败，请检查网络或联系管理员。';
    }
  }
};

watch(
  () => props.isOpen,
  (newVal) => {
    isVisible.value = newVal;
    if (newVal) {
      errorMessage.value = '';
      if (isEditMode.value && props.linkToEdit) {
        formData.value = {
          title: props.linkToEdit.title || '',
          url: props.linkToEdit.url || '',
          description: props.linkToEdit.description || '',
          displayOrder: props.linkToEdit.displayOrder || 0,
        };
      } else {
        resetForm();
      }
    }
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

const resetForm = () => {
  formData.value = defaultFormData();
  errorMessage.value = '';
};
</script>