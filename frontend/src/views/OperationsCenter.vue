<template>
  <div class="ops-center-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1 class="page-title">运营中心</h1>
          <p class="page-subtitle">按国家维度查看责任人矩阵和执行 SOP</p>
        </div>
        <div class="stat-card">
          <span class="stat-label">可见国家</span>
          <span class="stat-value">{{ countries.length }}</span>
        </div>
      </div>
    </header>

    <!-- 国家选择 -->
    <nav class="country-nav">
      <p v-if="isLoadingCountries" class="loading-text">正在加载国家...</p>
      <button
        v-for="country in countries"
        :key="country.code"
        class="country-btn"
        :class="{ 'country-btn--active': currentCountryCode === country.code }"
        @click="currentCountryCode = country.code"
      >
        {{ country.name }}
      </button>
    </nav>

    <!-- Tab 切换 -->
    <nav class="tab-nav">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': currentSubTab === 'matrix' }"
        @click="currentSubTab = 'matrix'"
      >
        责任人矩阵
      </button>
      <button
        class="tab-btn tab-btn--disabled"
        disabled
      >
        SOP 文档（规划中）
      </button>
    </nav>

    <!-- 内容区 -->
    <section class="content-area">
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div v-if="currentSubTab === 'matrix' && currentCountryCode">
        <ResponsibilityTable :country-code="currentCountryCode" />
      </div>

      <div v-if="currentSubTab === 'sop'" class="empty-state">
        <p>SOP 文档功能正在规划中，敬请期待。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/apiClient';
import ResponsibilityTable from '../components/common/ResponsibilityTable.vue';

interface Country {
  code: string;
  name: string;
}

const countries = ref<Country[]>([]);
const isLoadingCountries = ref(false);
const errorMessage = ref('');
const currentCountryCode = ref<string | null>(null);
const currentSubTab = ref<'matrix' | 'sop'>('matrix');

const authStore = useAuthStore();

const fetchCountries = async () => {
  isLoadingCountries.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get<Country[]>('/countries');
    const allCountries = response.data;

    if (authStore.role === 'admin') {
      countries.value = allCountries;
    } else {
      const userOperatedCodes = authStore.operatedCountries || [];
      countries.value = allCountries.filter((country) => userOperatedCodes.includes(country.code));
    }

    if (countries.value.length > 0) {
      currentCountryCode.value = countries.value[0].code;
    }
  } catch (error) {
    console.error('获取国家列表失败:', error);
    errorMessage.value = '无法加载国家列表。';
  } finally {
    isLoadingCountries.value = false;
  }
};

onMounted(() => {
  fetchCountries();
});
</script>

<style scoped>
.ops-center-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-bg-page);
}

.page-header {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-text { flex: 1; }

.page-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.625rem 1rem;
}

.stat-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.country-nav, .tab-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
}

.loading-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 0.5rem;
}

.country-btn, .tab-btn {
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.country-btn:hover, .tab-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.country-btn--active, .tab-btn--active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.tab-btn--disabled {
  color: var(--color-text-muted);
  background: var(--color-bg-page);
  cursor: not-allowed;
  opacity: 0.6;
}

.content-area {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.empty-state {
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}
</style>
