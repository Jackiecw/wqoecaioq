<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '520px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :header="dialogTitle"
    :dismissableMask="true"
    :draggable="false"
    class="p-dialog-custom"
    @hide="closeModal"
  >
    <div class="flex flex-col gap-6 pt-1">
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

      <div class="grid grid-cols-1 gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)] block mb-2">角色描述 <span class="text-red-500">*</span></label>
          <InputText v-model="formData.description" class="w-full" placeholder="如：运营主管" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)] block mb-2">角色 Key <span class="text-red-500">*</span></label>
          <InputText v-model="formData.name" class="w-full" placeholder="如：ops_manager" />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

type RolePayload = {
  name: string;
  description: string;
};

type RoleResponse = RolePayload & { id: string };

const props = defineProps<{
  isOpen: boolean;
  roleToEditId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'role-created', payload: RoleResponse): void;
  (e: 'role-updated', payload: RoleResponse): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const dialogTitle = computed(() => (props.roleToEditId ? '编辑角色' : '新建角色'));
const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref<RolePayload>({
  name: '',
  description: '',
});

const hydrateForm = async () => {
  if (!props.roleToEditId) {
    formData.value = { name: '', description: '' };
    return;
  }
  errorMessage.value = '';
  try {
    const response = await apiClient.get<RoleResponse>(`/admin/roles/${props.roleToEditId}`);
    const data = response.data;
    formData.value = { name: data.name, description: data.description };
  } catch (error: any) {
    console.error('加载角色详情失败:', error);
    errorMessage.value = error?.response?.data?.error || '加载角色详情失败';
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;
  const payload: RolePayload = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
  };

  try {
    if (props.roleToEditId) {
      const response = await apiClient.put<RoleResponse>(`/admin/roles/${props.roleToEditId}`, payload);
      emit('role-updated', response.data);
    } else {
      const response = await apiClient.post<RoleResponse>('/admin/roles', payload);
      emit('role-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('保存角色失败:', error);
    errorMessage.value = error?.response?.data?.error || '保存失败，请稍后再试。';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  emit('close');
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      hydrateForm();
    }
  },
);

watch(
  () => props.roleToEditId,
  () => {
    if (props.isOpen) hydrateForm();
  },
);
</script>
