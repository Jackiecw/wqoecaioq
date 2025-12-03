<template>
  <div class="space-y-8">
    <section class="rounded-3xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] p-6 text-white shadow-xl shadow-blue-900/20">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Ops Control</p>
          <h2 class="text-3xl font-semibold">运营中心</h2>
          <p class="text-sm text-white/80">按国家维度查看责任人矩阵和执行 SOP。</p>
        </div>
        <div class="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-right backdrop-blur">
          <p class="text-xs text-white/70">可见国家</p>
          <p class="text-xl font-semibold">{{ countries.length }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-2">
        <p v-if="isLoadingCountries" class="px-4 py-2 text-sm text-[#6B7280]">正在加载国家...</p>
        <button
          v-for="country in countries"
          :key="country.code"
          @click="currentCountryCode = country.code"
          :class="[
            'rounded-full px-4 py-2 text-sm font-semibold transition',
            currentCountryCode === country.code
              ? 'bg-[#3B82F6] text-white shadow'
              : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937]'
          ]"
        >
          {{ country.name }}
        </button>
      </div>
    </section>

    <section class="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <nav class="flex gap-3">
        <button
          @click="currentSubTab = 'matrix'"
          :class="[
            'rounded-full px-4 py-2 text-sm font-semibold',
            currentSubTab === 'matrix'
              ? 'bg-[#3B82F6] text-white shadow'
              : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937]'
          ]"
        >
          责任人矩阵
        </button>
        <button
          @click="currentSubTab = 'sop'"
          disabled
          class="rounded-full px-4 py-2 text-sm font-semibold text-[#94A3B8] bg-[#F9FAFB] cursor-not-allowed"
        >
          SOP 文档（规划中）
        </button>
      </nav>
    </section>

    <section class="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>

      <div v-if="currentSubTab === 'matrix' && currentCountryCode">
        <ResponsibilityTable :country-code="currentCountryCode" />
      </div>

      <div v-if="currentSubTab === 'sop'" class="rounded-2xl bg-[#F9FAFB] p-6 text-center text-sm text-[#6B7280]">
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
