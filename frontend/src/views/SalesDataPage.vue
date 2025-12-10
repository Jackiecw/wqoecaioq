<template>
  <div class="page-shell sales-data-page">
    <PageHeader
      title="销售数据"
      subtitle="查看与录入各大渠道的销售指标，保持数据同步"
    >
      <template #actions>
        <span class="pill">当前模式：<strong>{{ currentTab === 'management' ? '数据管理' : '数据录入' }}</strong></span>
      </template>
    </PageHeader>

    <SalesDataManagement />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import SalesDataManagement from '../components/sales/SalesDataManagement.vue';

type SalesTab = 'management' | 'entry';

const currentTab = ref<SalesTab>('management');
</script>

<style scoped>
.sales-data-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-bg-page);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.pill strong {
  color: var(--color-text-primary);
}
</style>
