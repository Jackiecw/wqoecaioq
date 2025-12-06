<template>
  <div class="finance-page">
    <!-- 页面头部 (Clean White Theme) -->
    <header class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1 class="page-title">财务管理</h1>
          <p class="page-subtitle">统一录入与查询支出，支持批量导出与下载</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <span class="stat-label">可录入</span>
            <span class="stat-value">{{ canEntry ? '是' : '否' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">可导出</span>
            <span class="stat-value">{{ isAdmin || canExport ? '是' : '否' }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Tab Navigation -->
    <nav class="tab-nav">
      <button
        v-if="canEntry"
        class="tab-btn"
        :class="{ 'tab-btn--active': currentTab === 'entry' }"
        @click="currentTab = 'entry'"
      >
        支出录入
      </button>
      <button
        v-if="canView"
        class="tab-btn"
        :class="{ 'tab-btn--active': currentTab === 'management' }"
        @click="currentTab = 'management'"
      >
        支出查询
      </button>
      <button
        v-if="isAdmin || canExport"
        class="tab-btn"
        :class="{ 'tab-btn--active': currentTab === 'batch' }"
        @click="currentTab = 'batch'"
      >
        批量操作
      </button>
    </nav>

    <!-- Content Area -->
    <section class="content-area">
      <div v-if="currentTab === 'entry'">
        <FinanceForm />
      </div>
      <div v-else-if="currentTab === 'management'">
        <FinanceManagement />
      </div>
      <div v-else-if="currentTab === 'batch' && (isAdmin || canExport)">
        <FinanceBatchOps />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import FinanceForm from '../components/finance/FinanceForm.vue';
import FinanceManagement from '../components/finance/FinanceManagement.vue';
import FinanceBatchOps from '../components/finance/FinanceBatchOps.vue';

const authStore = useAuthStore();

const canEntry = computed(() => authStore.permissions.includes('FINANCE_ENTRY'));
const canView = computed(() => authStore.permissions.includes('FINANCE_VIEW'));
const isAdmin = computed(() => authStore.role === 'admin');
const canExport = computed(() => authStore.permissions.includes('FINANCE_EXPORT'));

type FinanceTab = 'entry' | 'management' | 'batch';

const getDefaultTab = (): FinanceTab => {
  if (canView.value && (authStore.role === 'admin' || canExport.value)) {
    return 'management';
  }
  if (canEntry.value) {
    return 'entry';
  }
  return canView.value ? 'management' : 'batch';
};

const currentTab = ref<FinanceTab>(getDefaultTab());
</script>

<style scoped>
.finance-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-bg-page);
}

/* 页面头部 */
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

.header-text {
  flex: 1;
}

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

.header-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.625rem 1rem;
  min-width: 80px;
}

.stat-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 0.375rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
  width: fit-content;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn--active {
  background: var(--color-accent);
  color: white;
  box-shadow: var(--shadow-xs);
}

/* Content Area */
.content-area {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}
</style>
