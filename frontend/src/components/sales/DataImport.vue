<template>
  <div class="page-shell">
    <!-- Header -->
    <PageHeader 
      title="数据导入中心" 
      subtitle="批量导入平台报表，或手动录入单条销售数据"
    />

    <!-- Country Selection -->
    <ContentCard v-if="currentTab !== '导入记录'" class="mb-6">
      <h3 class="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">选择国家</h3>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="country in availableCountries"
          :key="country.code"
          @click="selectedCountry = country.code"
          class="pill-tab"
          :class="{ 'is-active': selectedCountry === country.code }"
        >
          {{ country.name }}
        </button>
        <div v-if="availableCountries.length === 0 && !storesLoading" class="text-sm text-[var(--color-text-secondary)] py-2">
          暂无可用国家数据
        </div>
      </div>
    </ContentCard>

    <!-- Tab Navigation -->
    <div class="pill-tab-group mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        @click="currentTab = tab.name"
        class="pill-tab"
        :class="{ 'is-active': currentTab === tab.name }"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <ContentCard>
      <component 
        :is="currentTabComponent" 
        :selectedCountry="selectedCountry"
      />
    </ContentCard>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type Component } from 'vue'
import useStoreListings from '../../composables/useStoreListings'
import { useAuthStore } from '@/stores/auth'
import BatchImport from './BatchImport.vue'
import SalesForm from './SalesForm.vue'
import ImportHistory from './ImportHistory.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ContentCard from '@/components/common/ContentCard.vue'

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

<style scoped>
/* No specific styles needed as we use standard primitives and utility classes from dashboard-theme.css */
</style>

