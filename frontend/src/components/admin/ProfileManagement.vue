<template>
  <div class="space-y-4">
    <Card class="shadow-1 border-round-2xl">
      <template #title>个人中心</template>
      <template #content>
        <p class="m-0 text-sm text-color-secondary">更新个人资料、上传头像并及时修改密码。</p>
      </template>
    </Card>

    <div class="grid gap-4 md:grid-cols-3">
      <Card class="shadow-1 border-round-2xl md:col-span-1">
        <template #title>个人资料</template>
        <template #content>
          <div class="flex flex-column gap-3">
            <div class="flex flex-column align-items-center gap-2">
              <Avatar :image="previewUrl || userAvatar" shape="circle" size="xlarge" />
              <FileUpload
                mode="basic"
                name="avatarImage"
                :auto="false"
                :custom-upload="true"
                accept="image/png,image/jpeg"
                choose-label="选择头像"
                :disabled="isUpdating"
                @select="onFileSelected"
                @clear="clearFile"
              />
            </div>

            <div class="field">
              <label class="font-semibold text-sm mb-2 block">昵称 *</label>
              <InputText v-model="profileForm.nickname" class="w-full" />
            </div>

            <Message v-if="profileError" severity="error" :closable="false">{{ profileError }}</Message>
            <Message v-if="profileSuccess" severity="success" :closable="false">{{ profileSuccess }}</Message>

            <div class="flex justify-end">
              <Button
                label="保存资料"
                icon="pi pi-check"
                :loading="isUpdating"
                @click="handleProfileUpdate"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-1 border-round-2xl md:col-span-2">
        <template #title>修改密码</template>
        <template #content>
          <div class="flex flex-column gap-3">
            <div class="field">
              <label class="font-semibold text-sm mb-2 block">旧密码</label>
              <Password v-model="passwordForm.oldPassword" toggle-mask :feedback="false" class="w-full" />
            </div>
            <div class="field">
              <label class="font-semibold text-sm mb-2 block">新密码（至少 8 位）</label>
              <Password v-model="passwordForm.newPassword" toggle-mask prompt-label="至少 8 位" class="w-full" />
            </div>
            <div class="field">
              <label class="font-semibold text-sm mb-2 block">确认新密码</label>
              <Password v-model="passwordForm.confirmPassword" toggle-mask :feedback="false" class="w-full" />
            </div>

            <Message v-if="passwordError" severity="error" :closable="false">{{ passwordError }}</Message>
            <Message v-if="passwordSuccess" severity="success" :closable="false">{{ passwordSuccess }}</Message>

            <div class="flex justify-end">
              <Button
                label="确认修改"
                icon="pi pi-lock"
                :loading="isChangingPassword"
                @click="handleChangePassword"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const profileForm = ref({ nickname: authStore.nickname });
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const isUpdating = ref(false);
const profileError = ref('');
const profileSuccess = ref('');

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const isChangingPassword = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
const userAvatar = computed(() => {
  if (!authStore.avatarUrl) return 'https://via.placeholder.com/150';
  return authStore.avatarUrl.startsWith('http') ? authStore.avatarUrl : `${apiBaseUrl}${authStore.avatarUrl}`;
});

watch(
  () => authStore.nickname,
  (newNickname) => {
    profileForm.value.nickname = newNickname;
  },
);

const clearFile = () => {
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
};

const onFileSelected = (event: FileUploadSelectEvent) => {
  const file = event.files?.[0];
  if (file) {
    clearFile();
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handleProfileUpdate = async () => {
  isUpdating.value = true;
  profileError.value = '';
  profileSuccess.value = '';

  const payload = new FormData();
  payload.append('nickname', profileForm.value.nickname);
  if (selectedFile.value) {
    payload.append('avatarImage', selectedFile.value);
  }

  try {
    const response = await apiClient.put('/profile/update-details', payload);
    authStore.login(response.data.token);
    profileSuccess.value = '资料更新成功';
    clearFile();
  } catch (error: any) {
    console.error('更新资料失败:', error);
    profileError.value = error.response?.data?.error || '更新失败，请重试。';
  } finally {
    isUpdating.value = false;
  }
};

const handleChangePassword = async () => {
  passwordError.value = '';
  passwordSuccess.value = '';
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致';
    return;
  }
  isChangingPassword.value = true;
  try {
    const payload = {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    };
    await apiClient.post('/profile/change-password', payload);
    passwordSuccess.value = '密码修改成功';
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error: any) {
    console.error('修改密码失败:', error);
    passwordError.value = error.response?.data?.error || '修改失败，请重试。';
  } finally {
    isChangingPassword.value = false;
  }
};
</script>
