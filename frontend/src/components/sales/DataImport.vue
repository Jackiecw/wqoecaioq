<template>

  <div class="data-import-page">

    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="page-badge">DATA IMPORT CENTER</span>
          <h1 class="page-title">数据导入中心</h1>
          <p class="page-subtitle">批量导入平台报表，或手动录入单条销售数据，保持数据实时更新。</p>
        </div>
        <div class="stat-card">
          <span class="stat-label">当前操作</span>
          <span class="stat-value">{{ currentTab }}</span>
        </div>
      </div>
    </header>

    <!-- Country Selection -->
    <section class="content-card" v-if="currentTab !== '导入记录'">
      <h3 class="section-title">选择国家</h3>
      <div class="country-buttons">
        <button
          v-for="country in availableCountries"
          :key="country.code"
          @click="selectedCountry = country.code"
          :class="['country-btn', { 'country-btn--active': selectedCountry === country.code }]"
        >
          {{ country.name }}
        </button>
        <div v-if="availableCountries.length === 0 && !storesLoading" class="empty-text">
          暂无可用国家数据
        </div>
      </div>
    </section>

    <!-- Tab Navigation -->
    <section class="content-card tab-section">
      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          @click="currentTab = tab.name"
          :class="['tab-btn', { 'tab-btn--active': currentTab === tab.name }]"
        >
          {{ tab.name }}
        </button>
      </nav>
    </section>

    <!-- Tab Content -->
    <section class="content-card">
      <component 
        :is="currentTabComponent" 
        :selectedCountry="selectedCountry"
      />
    </section>

  </div>

</template>

<style scoped>
.data-import-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .header-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  color: var(--color-accent);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.stat-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  text-align: right;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.content-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.country-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.country-btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.country-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.country-btn--active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.empty-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  padding: 0.5rem 0;
}

.tab-section {
  padding: 1rem 1.5rem;
}

.tab-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn--active {
  background: var(--color-accent);
  color: white;
  box-shadow: var(--shadow-sm);
}
</style>


<script setup lang="ts">

import { ref, computed, onMounted, watch, type Component } from 'vue'
import useStoreListings from '../../composables/useStoreListings'
import { useAuthStore } from '@/stores/auth'
import BatchImport from './BatchImport.vue'
import SalesForm from './SalesForm.vue'
import ImportHistory from './ImportHistory.vue'

const authStore = useAuthStore()
const { stores, fetchStores, storesLoading } = useStoreListings()



const tabs = [

  { name: '批量导入', component: BatchImport },

  { name: '手动录入', component: SalesForm },

  { name: '导入记录', component: ImportHistory },

]



const currentTab = ref('批量导入')

const selectedCountry = ref('')



const currentTabComponent = computed<Component>(() => {

  return tabs.find(t => t.name === currentTab.value)?.component || BatchImport

})



const availableCountries = computed(() => {

  const uniqueCountriesMap = new Map()

  stores.value.forEach(store => {

    if (store.country) {

      uniqueCountriesMap.set(store.country.code, store.country)

    }

  })

  

  const allUniqueCountries = Array.from(uniqueCountriesMap.values())

    .sort((a, b) => a.name.localeCompare(b.name))



  if (authStore.role === 'admin') {

    return allUniqueCountries

  }

  

  const userCountryCodes = authStore.operatedCountries || []

  return allUniqueCountries.filter(country => 

    userCountryCodes.includes(country.code)

  )

})



onMounted(async () => {

  await fetchStores()

})



// Auto-select if only one country

watch(availableCountries, (newVal) => {

  if (newVal.length === 1 && !selectedCountry.value) {

    selectedCountry.value = newVal[0].code

  }

}, { immediate: true })



</script>

