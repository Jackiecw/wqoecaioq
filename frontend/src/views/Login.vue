<template>
  <div class="login-shell">
    <div class="grid min-h-screen m-0">
      <div class="col-12 lg:col-6 promo-panel">
        <div class="promo-content">
          <p class="promo-kicker">Overseas Ops</p>
          <h2 class="promo-title">海外电商 ERP 内部系统</h2>
          <p class="promo-sub">集中管理仪表盘、运营中心、财务与销售数据，帮助团队保持节奏一致。</p>

          <div class="promo-cards">
            <div class="promo-card">
              <p class="promo-label">今日指标</p>
              <p class="promo-value">12,640</p>
              <p class="promo-desc">实时同步 GMV & 任务状态</p>
            </div>
            <div class="promo-card">
              <p class="promo-label">协同效率</p>
              <p class="promo-value">+34%</p>
              <p class="promo-desc">跨国团队在同一系统中协作</p>
            </div>
            <div class="promo-card">
              <p class="promo-label">安全级别</p>
              <p class="promo-value">零事故</p>
              <p class="promo-desc">访问审计与审批链条全程可查</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 lg:col-6 flex align-items-center justify-content-center px-4 py-6">
        <div class="surface-card border-1 border-round-2xl shadow-2 w-full" style="max-width: 30rem;">
          <div class="p-4 md:p-5 flex flex-column gap-4">
            <div class="text-center flex flex-column gap-2">
              <img :src="logoUrl" alt="Company Logo" class="mx-auto h-3rem w-auto" />
              <div>
                <p class="text-xs uppercase letter-spacing-3 text-color-secondary mb-1">Welcome Back</p>
                <h1 class="text-2xl font-bold m-0">登录账号</h1>
                <p class="text-sm text-color-secondary m-0">使用企业账号进入内部系统。</p>
              </div>
            </div>

            <form class="flex flex-column gap-3" @submit.prevent="handleLogin">
              <div class="field flex flex-column gap-2">
                <label class="font-semibold text-sm" for="username">用户名</label>
                <InputText
                  id="username"
                  v-model="username"
                  class="w-full"
                  required
                  autocomplete="username"
                  placeholder="请输入用户名"
                />
              </div>

              <div class="field flex flex-column gap-2">
                <label class="font-semibold text-sm" for="password">密码</label>
                <Password
                  input-id="password"
                  v-model="password"
                  :feedback="false"
                  toggle-mask
                  class="w-full"
                  input-class="w-full"
                  required
                  autocomplete="current-password"
                  placeholder="请输入密码"
                  @keydown.enter="handleLogin"
                />
              </div>

              <Message v-if="errorMessage" severity="error" :closable="false">
                {{ errorMessage }}
              </Message>

              <Button
                type="submit"
                label="登录"
                icon="pi pi-sign-in"
                class="w-full"
                :loading="loading"
              />
            </form>

            <p class="text-center text-sm text-color-secondary m-0">
              登录遇到问题？
              <a href="mailto:wei@cheerlux.com" class="font-semibold text-primary hover:underline">
                联系管理员
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/authService';
import logoUrl from '../assets/logo.png';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = '请填写用户名和密码';
    return;
  }

  errorMessage.value = '';
  loading.value = true;
  try {
    const data = await authService.login({
      username: username.value.trim(),
      password: password.value,
    });
    authStore.login(data.token);
    router.push('/');
  } catch (error: any) {
    const serverMsg = error?.response?.data?.error;
    errorMessage.value = serverMsg || '登录失败，请检查网络或联系管理员。';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-shell {
  background: var(--color-bg-page);
}

.promo-panel {
  background: var(--color-accent);
  color: #ffffff;
  display: flex;
  align-items: center;
  padding: 3rem;
}

.promo-content {
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.promo-kicker {
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.75rem;
  opacity: 0.9;
  margin: 0;
}

.promo-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
}

.promo-sub {
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
}

.promo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.promo-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  backdrop-filter: blur(4px);
}

.promo-label {
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.75rem;
  opacity: 0.8;
  margin: 0;
}

.promo-value {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0.2rem 0 0;
}

.promo-desc {
  margin: 0.15rem 0 0;
  opacity: 0.9;
}

.letter-spacing-3 {
  letter-spacing: 0.3em;
}

@media (max-width: 991px) {
  .promo-panel {
    display: none;
  }
}
</style>
