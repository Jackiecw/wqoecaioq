<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '500px' }"
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
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">国家名称 <span class="text-red-500">*</span></label>
          <InputText v-model="formData.name" class="w-full" :pt="{ root: { class: 'w-full' } }" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">国家代码 <span class="text-red-500">*</span></label>
          <InputText v-model="formData.code" class="w-full" placeholder="如 CN / SG" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">设立日期</label>
           <Calendar 
            v-model="formData.establishedAt" 
            show-icon 
            date-format="yy-mm-dd" 
            class="w-full"
            :pt="{ input: { class: 'w-full' } }" 
          />
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
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

type CountryPayload = {
  name: string;
  code: string;
  establishedAt?: string;
};

type CountryResponse = CountryPayload & { id: string };

type CountryFormState = {
  name: string;
  code: string;
  establishedAt: Date | null;
};

const props = defineProps<{
  isOpen: boolean;
  countryToEditId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'country-created', payload: CountryResponse): void;
  (e: 'country-updated', payload: CountryResponse): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const dialogTitle = computed(() => (props.countryToEditId ? '编辑国家' : '新建国家'));
const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref<CountryFormState>({
  name: '',
  code: '',
  establishedAt: null,
});

const parseDate = (val?: string | Date | null): Date | null => {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateForApi = (val?: Date | null) => {
  if (!val) return undefined;
  const d = new Date(val);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const hydrateForm = async () => {
  if (!props.countryToEditId) {
    formData.value = { name: '', code: '', establishedAt: null };
    return;
  }
  errorMessage.value = '';
  try {
    const response = await apiClient.get<CountryResponse>(`/admin/countries/${props.countryToEditId}`);
    const data = response.data;
    formData.value = {
      name: data.name,
      code: data.code,
      establishedAt: parseDate(data.establishedAt),
    };
  } catch (error: any) {
    console.error('加载国家详情失败:', error);
    errorMessage.value = error?.response?.data?.error || '加载国家详情失败';
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;
  const payload: CountryPayload = {
    name: formData.value.name.trim(),
    code: formData.value.code.trim(),
    establishedAt: formatDateForApi(formData.value.establishedAt),
  };

  try {
    if (props.countryToEditId) {
      const response = await apiClient.put<CountryResponse>(
        `/admin/countries/${props.countryToEditId}`,
        payload,
      );
      emit('country-updated', response.data);
    } else {
      const response = await apiClient.post<CountryResponse>('/admin/countries', payload);
      emit('country-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('保存失败:', error);
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
  () => props.countryToEditId,
  () => {
    if (props.isOpen) {
      hydrateForm();
    }
  },
);
</script>
