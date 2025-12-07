<template>
  <div class="page-shell">
    <PageHeader 
      title="个人中心" 
      subtitle="更新个人资料、上传头像并及时修改密码。"
    />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Profile Update Card -->
      <ContentCard class="md:col-span-1 h-fit">
        <template #title>
          <div class="flex items-center gap-2 mb-4">
            <i class="pi pi-user text-[var(--color-accent)]"></i>
            <span class="font-bold text-lg">个人资料</span>
          </div>
        </template>
        
        <div class="flex flex-col items-center gap-6">
          <div class="flex flex-col items-center gap-3">
            <div class="relative group">
              <Avatar 
                :image="previewUrl || userAvatar" 
                shape="circle" 
                size="xlarge" 
                class="w-24 h-24 shadow-md border-2 border-white ring-2 ring-[var(--color-border)]"
              />
              <div class="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-[var(--color-border)]">
                 <i class="pi pi-camera text-[var(--color-text-secondary)] text-sm"></i>
              </div>
            </div>
            
            <FileUpload
              mode="basic"
              name="avatarImage"
              :auto="false"
              :custom-upload="true"
              accept="image/png,image/jpeg"
              choose-label="更换头像"
              class="p-button-sm p-button-outlined"
              :disabled="isUpdating"
              @select="onFileSelected"
            />
          </div>

          <div class="w-full">
            <label class="font-medium text-sm text-[var(--color-text-secondary)] mb-1.5 block">昵称</label>
            <IconField>
              <InputIcon class="pi pi-id-card" />
              <InputText v-model="profileForm.nickname" class="w-full" placeholder="请输入您的昵称" />
            </IconField>
          </div>

          <Message v-if="profileError" severity="error" :closable="false" class="w-full">{{ profileError }}</Message>
          <Message v-if="profileSuccess" severity="success" :closable="false" class="w-full">{{ profileSuccess }}</Message>

          <Button
            label="保存资料"
            icon="pi pi-check"
            :loading="isUpdating"
            class="w-full"
            @click="handleProfileUpdate"
          />
        </div>
      </ContentCard>

      <!-- Password Change Card -->
      <ContentCard class="md:col-span-2 h-fit">
        <template #title>
           <div class="flex items-center gap-2 mb-4">
            <i class="pi pi-lock text-[var(--color-accent)]"></i>
            <span class="font-bold text-lg">修改密码</span>
          </div>
        </template>

        <div class="flex flex-col gap-5 max-w-xl">
          <div class="field">
            <label class="font-medium text-sm text-[var(--color-text-secondary)] mb-1.5 block">旧密码</label>
            <Password 
              v-model="passwordForm.oldPassword" 
              toggle-mask 
              :feedback="false" 
              class="w-full" 
              input-class="w-full"
              placeholder="请输入当前密码"
            />
          </div>
          <div class="field">
            <label class="font-medium text-sm text-[var(--color-text-secondary)] mb-1.5 block">新密码</label>
            <Password 
              v-model="passwordForm.newPassword" 
              toggle-mask 
              prompt-label="至少 8 位" 
              class="w-full" 
              input-class="w-full"
              placeholder="请输入新密码（至少 8 位）"
            />
          </div>
          <div class="field">
            <label class="font-medium text-sm text-[var(--color-text-secondary)] mb-1.5 block">确认新密码</label>
            <Password 
              v-model="passwordForm.confirmPassword" 
              toggle-mask 
              :feedback="false" 
              class="w-full" 
              input-class="w-full"
              placeholder="请再次输入新密码"
            />
          </div>

          <Message v-if="passwordError" severity="error" :closable="false">{{ passwordError }}</Message>
          <Message v-if="passwordSuccess" severity="success" :closable="false">{{ passwordSuccess }}</Message>

          <div class="flex justify-end pt-2">
            <Button
              label="确认修改"
              icon="pi pi-save"
              :loading="isChangingPassword"
              @click="handleChangePassword"
            />
          </div>
        </div>
      </ContentCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';

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

<style scoped>
/* No specific styles needed using standard primitives */
</style>
