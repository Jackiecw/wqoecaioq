<template>
  <div class="sales-data-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1 class="page-title">销售数据</h1>
          <p class="page-subtitle">查看与录入各大渠道的销售指标，保持数据同步</p>
        </div>
        <div class="stat-card">
          <span class="stat-label">当前模式</span>
          <span class="stat-value">{{ currentTab === 'management' ? '数据管理' : '数据录入' }}</span>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <section class="content-area">
      <SalesDataManagement />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SalesDataManagement from '../components/sales/SalesDataManagement.vue';

type SalesTab = 'management' | 'entry';

const currentTab = ref<SalesTab>('management');
</script>

<style scoped>
.sales-data-page {
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
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.content-area {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}
</style>
