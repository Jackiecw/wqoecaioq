<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '600px' }"
    :header="dialogTitle"
    class="store-form-modal"
    @hide="closeModal"
  >
    <div class="flex flex-column gap-3">
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

      <div class="grid formgrid p-fluid">
        <div class="field col-12">
          <label class="font-semibold text-sm mb-2 block">店铺名称 (易读) *</label>
          <InputText v-model="formData.name" class="w-full" placeholder="例如：Shopee 印尼 Mall 店" />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">平台 *</label>
          <Dropdown
            v-model="formData.platform"
            :options="options.platforms"
            placeholder="请选择平台"
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">国家 *</label>
          <Dropdown
            v-model="formData.countryCode"
            :options="countryOptions"
            option-label="name"
            option-value="code"
            placeholder="请选择国家"
            filter
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">店铺状态 *</label>
          <Dropdown
            v-model="formData.status"
            :options="statusOptions"
            placeholder="请选择状态"
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">注册日期</label>
          <Calendar v-model="formData.registeredAt" show-icon date-format="yy-mm-dd" class="w-full" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

type CountryOption = { code: string; name: string };

type StorePayload = {
  name: string;
  platform: string;
  countryCode: string;
  status: string;
  registeredAt?: string;
};

type StoreResponse = StorePayload & { id: string; country?: CountryOption };

type StoreFormState = {
  name: string;
  platform: string;
  countryCode: string;
  status: string;
  registeredAt: Date | null;
};

const props = defineProps<{
  isOpen: boolean;
  storeToEdit: StoreResponse | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'store-created', payload: StoreResponse): void;
  (e: 'store-updated', payload: StoreResponse): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const dialogTitle = computed(() => (props.storeToEdit ? '编辑店铺' : '新建店铺'));
const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref<StoreFormState>({
  name: '',
  platform: '',
  countryCode: '',
  status: 'ACTIVE',
  registeredAt: null,
});

const options = ref<{ platforms: string[] }>({ platforms: [] });
const countryOptions = ref<CountryOption[]>([]);
const statusOptions = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const parseDate = (date?: string | Date | null) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateForApi = (date?: Date | null) => {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const hydrateForm = () => {
  if (!props.storeToEdit) {
    resetForm();
    return;
  }
  const store = props.storeToEdit;
  formData.value = {
    name: store.name,
    platform: store.platform,
    countryCode: store.countryCode,
    status: store.status || 'ACTIVE',
    registeredAt: parseDate(store.registeredAt),
  };
};

const resetForm = () => {
  formData.value = {
    name: '',
    platform: '',
    countryCode: '',
    status: 'ACTIVE',
    registeredAt: null,
  };
  errorMessage.value = '';
};

const fetchOptions = async () => {
  try {
    const [platformRes, countryRes] = await Promise.all([
      apiClient.get('/admin/store-platforms'),
      apiClient.get('/admin/countries'),
    ]);
    options.value.platforms = platformRes.data || [];
    countryOptions.value = countryRes.data || [];
  } catch (error: any) {
    console.error('加载店铺选项失败:', error);
    errorMessage.value = error?.response?.data?.error || '加载店铺选项失败';
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;
  const payload: StorePayload = {
    name: formData.value.name.trim(),
    platform: formData.value.platform,
    countryCode: formData.value.countryCode,
    status: formData.value.status,
    registeredAt: formatDateForApi(formData.value.registeredAt),
  };

  try {
    if (props.storeToEdit) {
      const response = await apiClient.put<StoreResponse>(`/admin/stores/${props.storeToEdit.id}`, payload);
      emit('store-updated', response.data);
    } else {
      const response = await apiClient.post<StoreResponse>('/admin/stores', payload);
      emit('store-created', response.data);
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
  resetForm();
  emit('close');
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      fetchOptions();
      hydrateForm();
    }
  },
);

watch(
  () => props.storeToEdit,
  (val) => {
    if (val) {
      hydrateForm();
    } else {
      resetForm();
    }
  },
);
</script>
