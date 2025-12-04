<template>
  <div class="flex flex-column gap-4">
    <!-- Header Card -->
    <Card class="bg-primary border-noround-top">
      <template #content>
        <div class="flex flex-column lg:flex-row align-items-center justify-content-between gap-4 text-white">
          <div>
            <p class="text-xs font-semibold uppercase m-0 mb-2 opacity-80">Sales Intelligence</p>
            <h2 class="text-3xl font-semibold m-0 mb-2">销售数据</h2>
            <p class="text-sm m-0 opacity-90">查看与录入各大渠道的销售指标，保持数据同步。</p>
          </div>
          <div class="border-round-2xl surface-0 px-4 py-3 text-right" style="opacity: 0.95">
            <p class="text-xs text-500 m-0 mb-1">当前模式</p>
            <p class="text-xl font-semibold text-900 m-0">{{ currentTab === 'management' ? '数据管理' : '数据录入' }}</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Content Card -->
    <Card>
      <template #content>
        <SalesDataManagement />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from 'primevue/card';
import SalesDataManagement from '../components/sales/SalesDataManagement.vue';

type SalesTab = 'management' | 'entry';

const currentTab = ref<SalesTab>('management');
</script>
