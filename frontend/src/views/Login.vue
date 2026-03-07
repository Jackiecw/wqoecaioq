<template>
  <div class="login-page">
    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle--1"></div>
      <div class="bg-circle bg-circle--2"></div>
      <div class="bg-circle bg-circle--3"></div>
    </div>

    <div class="login-container">
      <!-- Left: Hero / Branding -->
      <div class="login-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <i class="pi pi-globe"></i>
            Internal Platform
          </div>
          <h1 class="hero-title">海外电商<br/>运营管理系统</h1>
          <p class="hero-desc">
            集中管理仪表盘、运营中心、财务与销售数据，<br/>帮助团队保持高效协同。
          </p>
          <div class="hero-features">
            <div class="feature-item">
              <div class="feature-icon"><i class="pi pi-chart-bar"></i></div>
              <div>
                <div class="feature-label">数据驱动</div>
                <div class="feature-text">实时同步 GMV 与核心运营指标</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><i class="pi pi-users"></i></div>
              <div>
                <div class="feature-label">多团队协同</div>
                <div class="feature-text">跨国团队在同一系统中高效协作</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><i class="pi pi-shield"></i></div>
              <div>
                <div class="feature-label">安全可控</div>
                <div class="feature-text">基于角色的权限体系与操作审计</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Login Form -->
      <div class="login-form-side">
        <div class="login-card">
          <div class="card-header">
            <img :src="logoUrl" alt="Logo" class="login-logo" />
            <h2 class="card-title">欢迎回来</h2>
            <p class="card-subtitle">登录您的企业账号以继续</p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-field">
              <label class="form-label" for="username">
                <i class="pi pi-user"></i> 用户名
              </label>
              <InputText
                id="username"
                v-model="username"
                class="w-full"
                required
                autocomplete="username"
                placeholder="请输入用户名"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="password">
                <i class="pi pi-lock"></i> 密码
              </label>
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
              label="登 录"
              icon="pi pi-sign-in"
              class="w-full login-btn"
              :loading="loading"
            />
          </form>

          <div class="card-footer">
            <span>登录遇到问题？</span>
            <a href="mailto:wei@cheerlux.com" class="footer-link">联系管理员</a>
          </div>
        </div>

        <p class="copyright">&copy; {{ new Date().getFullYear() }} Overseas Ops. All rights reserved.</p>
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
/* ==========================================
   Login Page — Modern Clean Design
   ========================================== */
.login-page {
  min-height: 100vh;
  background: #f8f9fb;
  position: relative;
  overflow: hidden;
}

/* Background decorative circles */
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}

.bg-circle--1 {
  width: 600px;
  height: 600px;
  background: var(--color-accent, #3b82f6);
  top: -200px;
  right: -100px;
}

.bg-circle--2 {
  width: 400px;
  height: 400px;
  background: #8b5cf6;
  bottom: -100px;
  left: -100px;
}

.bg-circle--3 {
  width: 300px;
  height: 300px;
  background: #06b6d4;
  top: 50%;
  left: 40%;
}

/* Main container */
.login-container {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

/* ===== Hero Side ===== */
.login-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.login-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
}

.hero-content {
  position: relative;
  max-width: 480px;
  color: #ffffff;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #ffffff 30%, rgba(147, 197, 253, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 2.5rem;
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  font-size: 1rem;
  flex-shrink: 0;
}

.feature-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.15rem;
}

.feature-text {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ===== Form Side ===== */
.login-form-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 1.25rem;
  padding: 2.5rem;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  height: 3rem;
  width: auto;
  margin-bottom: 1.25rem;
  object-fit: contain;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary, #1e293b);
  margin: 0 0 0.35rem;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.form-label i {
  font-size: 0.75rem;
  opacity: 0.7;
}

.login-btn {
  margin-top: 0.5rem;
  height: 2.75rem;
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.05em;
}

.card-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #94a3b8);
}

.footer-link {
  color: var(--color-accent, #3b82f6);
  font-weight: 600;
  text-decoration: none;
  margin-left: 0.25rem;
}

.footer-link:hover {
  text-decoration: underline;
}

.copyright {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

/* ===== Responsive ===== */
@media (max-width: 991px) {
  .login-container {
    grid-template-columns: 1fr;
  }

  .login-hero {
    display: none;
  }

  .login-form-side {
    min-height: 100vh;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem;
    border-radius: 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }
}
</style>
