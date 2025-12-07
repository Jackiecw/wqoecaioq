<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '680px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :header="dialogTitle"
    :dismissableMask="true"
    :draggable="false"
    class="p-dialog-custom"
    @hide="closeModal"
  >
    <div class="flex flex-col gap-6 pt-1">
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">用户名（登录账号） <span class="text-red-500">*</span></label>
          <InputText v-model="formData.username" :disabled="isEditMode" class="w-full" />
        </div>

        <!-- Password Field (Conditional) -->
        <div v-if="!isEditMode" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">初始密码（至少 8 位） <span class="text-red-500">*</span></label>
          <Password v-model="formData.password" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">昵称 <span class="text-red-500">*</span></label>
          <InputText v-model="formData.nickname" class="w-full" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">分配角色 <span class="text-red-500">*</span></label>
          <Dropdown
            v-model="formData.roleId"
            :options="roleOptions"
            option-label="description"
            option-value="id"
            placeholder="请选择角色"
            class="w-full"
          />
        </div>

        <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">监管国家（自动加入运营国家）</label>
          <MultiSelect
            v-model="selectedSupervisedIds"
            :options="countryOptions"
            option-label="label"
            option-value="id"
            placeholder="选择监管国家"
            display="chip"
            class="w-full"
            :pt="{ token: { class: 'bg-purple-100 text-purple-700' } }"
          />
        </div>

        <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium text-[var(--color-text-secondary)]">运营国家</label>
          <MultiSelect
            v-model="selectedOperatedIds"
            :options="countryOptions"
            option-label="label"
            option-value="id"
            placeholder="选择运营国家"
            display="chip"
            class="w-full"
          >
             <template #option="slotProps">
              <div class="flex items-center gap-2 w-full">
                <Checkbox
                  :model-value="slotProps.selected"
                  :disabled="isOperatedCountryDisabled(slotProps.option.id)"
                  binary
                />
                <span class="text-sm">{{ slotProps.option.label }}</span>
                <span v-if="isOperatedCountryDisabled(slotProps.option.id)" class="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">监管已选</span>
              </div>
            </template>
          </MultiSelect>
          <small class="text-xs text-[var(--color-text-muted)]">监管国家会自动加入运营列表，不可取消。</small>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" :loading="loading" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import MultiSelect from 'primevue/multiselect';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import apiClient from '@/services/apiClient';
import useManagedCountries from '@/composables/useManagedCountries';

type RoleOption = { id: string; name: string; description: string };
type CountryOption = { id: string; code: string; name: string; label: string };

type FormState = {
  username: string;
  password: string;
  nickname: string;
  roleId: string;
};

const props = defineProps<{
  isOpen: boolean;
  roles: RoleOption[];
  userToEdit: {
    id: string;
    username: string;
    nickname: string;
    roleId: string;
    supervisedCountryIds?: string[];
    operatedCountryIds?: string[];
  } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'user-created', payload: any): void;
  (e: 'user-updated', payload: any): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const formData = ref<FormState>({
  username: '',
  password: '',
  nickname: '',
  roleId: '',
});

const errorMessage = ref('');
const loading = ref(false);

const selectedSupervisedIds = ref<string[]>([]);
const selectedOperatedIds = ref<string[]>([]);

const isEditMode = computed(() => !!props.userToEdit);
const dialogTitle = computed(() => (isEditMode.value ? '编辑用户' : '新建用户'));

const roleOptions = computed(() => props.roles || []);

const {
  countries,
  fetchCountries,
  countriesError,
} = useManagedCountries();

const countryOptions = computed<CountryOption[]>(() =>
  countries.value
    .map((c: any) => ({ id: c.id, code: c.code, name: c.name, label: `${c.name} (${c.code})` }))
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const resetForm = () => {
  formData.value = {
    username: '',
    password: '',
    nickname: '',
    roleId: '',
  };
  errorMessage.value = '';
  selectedSupervisedIds.value = [];
  selectedOperatedIds.value = [];
};

const hydrateForm = () => {
  if (!props.userToEdit) {
    resetForm();
    return;
  }
  formData.value = {
    username: props.userToEdit.username,
    password: '',
    nickname: props.userToEdit.nickname,
    roleId: props.userToEdit.roleId,
  };
  selectedSupervisedIds.value = props.userToEdit.supervisedCountryIds || [];
  selectedOperatedIds.value = props.userToEdit.operatedCountryIds || [];
};

const isOperatedCountryDisabled = (countryId: string) => selectedSupervisedIds.value.includes(countryId);

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    if (isEditMode.value && props.userToEdit) {
      const payload = {
        nickname: formData.value.nickname.trim(),
        roleId: formData.value.roleId,
        supervisedCountryIds: selectedSupervisedIds.value,
        operatedCountryIds: selectedOperatedIds.value,
      };
      const response = await apiClient.put(`/admin/users/${props.userToEdit.id}`, payload);
      emit('user-updated', response.data);
    } else {
      const payload = {
        username: formData.value.username.trim(),
        password: formData.value.password,
        nickname: formData.value.nickname.trim(),
        roleId: formData.value.roleId,
        supervisedCountryIds: selectedSupervisedIds.value,
        operatedCountryIds: selectedOperatedIds.value,
      };
      const response = await apiClient.post('/admin/users', payload);
      emit('user-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('操作失败:', error);
    errorMessage.value = error?.response?.data?.error || '操作失败，请检查网络或联系管理员。';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  resetForm();
  emit('close');
};

watch(
  () => props.isOpen,
  async (val) => {
    if (val) {
      try {
        await fetchCountries();
      } catch (error) {
        console.error('获取国家列表失败:', error);
        errorMessage.value = countriesError.value || '无法加载国家列表。';
      }
      hydrateForm();
    }
  },
);

watch(
  selectedSupervisedIds,
  (newSupervisorIds) => {
    const newOperatedSet = new Set([...selectedOperatedIds.value, ...newSupervisorIds]);
    selectedOperatedIds.value = Array.from(newOperatedSet);
  },
  { deep: true },
);
</script>
