<template>
  <div class="page-shell finance-page">
    <PageHeader
      title="财务管理"
      subtitle="统一录入与查询支出，支持批量导出与下载"
    >
      <template #actions>
        <div class="pill-stats">
          <span class="pill">
            可录入：<strong>{{ canEntry ? '是' : '否' }}</strong>
          </span>
          <span class="pill">
            可导出：<strong>{{ isAdmin || canExport ? '是' : '否' }}</strong>
          </span>
        </div>
      </template>
    </PageHeader>

    <ContentCard>
      <div class="pill-tab-group">
        <button
          v-if="canEntry"
          class="pill-tab"
          :class="{ 'is-active': currentTab === 'entry' }"
          @click="currentTab = 'entry'"
        >
          支出录入
        </button>
        <button
          v-if="canView"
          class="pill-tab"
          :class="{ 'is-active': currentTab === 'management' }"
          @click="currentTab = 'management'"
        >
          支出查询
        </button>
        <button
          v-if="isAdmin || canExport"
          class="pill-tab"
          :class="{ 'is-active': currentTab === 'batch' }"
          @click="currentTab = 'batch'"
        >
          批量操作
        </button>
      </div>

      <div class="content-area">
        <div v-if="currentTab === 'entry'">
          <FinanceForm />
        </div>
        <div v-else-if="currentTab === 'management'">
          <FinanceManagement />
        </div>
        <div v-else-if="currentTab === 'batch' && (isAdmin || canExport)">
          <FinanceBatchOps />
        </div>
      </div>
    </ContentCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
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
  gap: var(--space-4);
  background: var(--color-bg-page);
}

.pill-stats {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
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

.pill-tab-group {
  width: fit-content;
  margin-bottom: var(--space-3);
}

.content-area {
  margin-top: var(--space-3);
}
</style>
