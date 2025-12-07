<template>
  <div class="page-shell ops-center-page">
    <PageHeader
      title="运营中心"
      subtitle="按国家维度查看责任人矩阵和执行 SOP"
    >
      <template #actions>
        <span class="pill">可见国家：<strong>{{ countries.length }}</strong></span>
      </template>
    </PageHeader>

    <ContentCard>
      <FilterBar>
        <template #start>
          <div class="pill-tab-group">
            <button
              v-for="country in countries"
              :key="country.code"
              class="pill-tab"
              :class="{ 'is-active': currentCountryCode === country.code }"
              @click="currentCountryCode = country.code"
            >
              {{ country.name }}
            </button>
          </div>
        </template>
        <template #end>
          <div class="pill-tab-group">
            <button
              class="pill-tab"
              :class="{ 'is-active': currentSubTab === 'matrix' }"
              @click="currentSubTab = 'matrix'"
            >
              责任人矩阵
            </button>
            <button class="pill-tab is-disabled" disabled>
              SOP 文档（规划中）
            </button>
          </div>
        </template>
      </FilterBar>

      <div class="content-area">
        <p v-if="isLoadingCountries" class="loading-text">正在加载国家...</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <div v-if="currentSubTab === 'matrix' && currentCountryCode">
          <ResponsibilityTable :country-code="currentCountryCode" />
        </div>

        <EmptyState
          v-if="currentSubTab === 'sop'"
          icon="pi pi-file"
          title="SOP 文档规划中"
          description="敬请期待。"
        />
      </div>
    </ContentCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import EmptyState from '@/components/common/EmptyState.vue';
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

.loading-text {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}

.content-area {
  margin-top: var(--space-3);
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.pill-tab-group .is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
