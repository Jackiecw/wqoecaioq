<template>
  <div class="page-shell">
    <PageHeader 
      title="个人中心" 
      subtitle="管理您的个人资料与账户安全设置。"
    />

    <div class="profile-layout">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="card-inner">
          <div class="card-section-title">
            <i class="pi pi-user"></i>
            个人资料
          </div>
          
          <!-- Avatar Section -->
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerFileInput">
              <Avatar 
                :image="previewUrl || userAvatar" 
                shape="circle" 
                size="xlarge" 
                class="profile-avatar"
              />
              <div class="avatar-overlay">
                <i class="pi pi-camera"></i>
                <span>更换</span>
              </div>
            </div>
            <input 
              ref="fileInputRef"
              type="file" 
              class="hidden-input" 
              accept="image/png,image/jpeg"
              @change="handleFileChange"
            />
            <div class="avatar-info">
              <div class="avatar-name">{{ authStore.nickname || '未设置昵称' }}</div>
              <div class="avatar-role">{{ isAdmin ? '管理员' : '普通成员' }}</div>
              <button class="avatar-change-btn" @click="triggerFileInput">
                <i class="pi pi-upload"></i> 上传头像
              </button>
            </div>
          </div>

          <!-- Nickname -->
          <div class="form-field">
            <label class="uni-form-label">昵称</label>
            <InputText v-model="profileForm.nickname" class="w-full" placeholder="请输入您的昵称" />
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
      </div>

      <!-- Password Card -->
      <div class="password-card">
        <div class="card-inner">
          <div class="card-section-title">
            <i class="pi pi-shield"></i>
            账户安全
          </div>
          <p class="section-desc">定期修改密码有助于保护您的账户安全。</p>

          <div class="password-form">
            <div class="form-field">
              <label class="uni-form-label">当前密码</label>
              <Password 
                v-model="passwordForm.oldPassword" 
                toggle-mask 
                :feedback="false" 
                class="w-full" 
                input-class="w-full"
                placeholder="请输入当前密码"
              />
            </div>

            <div class="form-field">
              <label class="uni-form-label">新密码</label>
              <Password 
                v-model="passwordForm.newPassword" 
                toggle-mask 
                prompt-label="至少 8 位" 
                class="w-full" 
                input-class="w-full"
                placeholder="请输入新密码（至少 8 位）"
              />
            </div>

            <div class="form-field">
              <label class="uni-form-label">确认新密码</label>
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

            <div class="flex justify-end pt-1">
              <Button
                label="确认修改"
                icon="pi pi-lock"
                :loading="isChangingPassword"
                @click="handleChangePassword"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';
import { usePermission } from '@/composables/usePermission';
import PageHeader from '@/components/common/PageHeader.vue';

const authStore = useAuthStore();
const { isAdmin } = usePermission();

const profileForm = ref({ nickname: authStore.nickname });
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
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

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    clearFile();
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const clearFile = () => {
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
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
/* ==========================================
   Profile Page — Clean & Modern
   ========================================== */
.profile-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 768px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

/* Cards */
.profile-card,
.password-card {
  background: var(--color-bg-card, #ffffff);
  border-radius: var(--radius-lg, 0.75rem);
  border: 1px solid var(--color-border, #e2e8f0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-inner {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary, #1e293b);
}

.card-section-title i {
  color: var(--color-accent, #3b82f6);
  font-size: 1rem;
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #64748b);
  margin: -0.5rem 0 0;
  line-height: 1.5;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  background: var(--color-bg-page, #f8f9fb);
  border-radius: var(--radius-md, 0.5rem);
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.profile-avatar {
  width: 4.5rem !important;
  height: 4.5rem !important;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  color: #ffffff;
  font-size: 0.625rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-overlay i {
  font-size: 0.875rem;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.avatar-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-role {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #94a3b8);
}

.avatar-change-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.35rem;
  padding: 0.25rem 0.625rem;
  background: transparent;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 0.375rem);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-accent, #3b82f6);
  cursor: pointer;
  transition: all 0.15s ease;
  width: fit-content;
}

.avatar-change-btn:hover {
  background: var(--color-accent-soft, #eff6ff);
  border-color: var(--color-accent, #3b82f6);
}

.hidden-input {
  display: none;
}

/* Form fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* Password form */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 480px;
}
</style>
