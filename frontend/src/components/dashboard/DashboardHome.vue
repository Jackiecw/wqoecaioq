<template>
  <div class="flex flex-column gap-4">
    <!-- Page Header -->
    <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-900 m-0">工作台</h1>
        <p class="text-500 mt-1 mb-0">{{ greeting }}，{{ authStore.nickname }}。{{ hitokoto || '今天也要加油' }}</p>
      </div>
      <div class="flex align-items-center gap-2">
        <span class="text-sm text-500">{{ todayDate }}</span>
      </div>
    </div>

    <!-- KPI Metrics - Simple & Clean -->
    <div class="grid">
      <div v-for="(metric, idx) in kpiMetrics" :key="metric.label" class="col-12 md:col-6 xl:col">
        <div 
          class="surface-card border-round-xl p-4 h-full shadow-1 hover:shadow-2 transition-all transition-duration-200"
          :style="{ borderLeft: `4px solid ${metric.color}` }"
        >
          <div class="flex flex-column gap-3">
            <div class="flex align-items-center justify-content-between">
              <span class="text-xs font-semibold text-500 uppercase">
                {{ metric.label }}
              </span>
              <div 
                class="flex align-items-center justify-content-center border-round-lg p-2"
                :style="{ background: metric.color + '15' }"
              >
                <i :class="metric.icon" :style="{ color: metric.color }" class="text-xl"></i>
              </div>
            </div>
            <div>
              <div class="text-3xl font-bold text-900 mb-1">{{ metric.value }}</div>
              <div class="flex align-items-center gap-2">
                <span class="text-sm text-600">{{ metric.sub }}</span>
                <span 
                  v-if="metric.trend" 
                  class="text-xs font-semibold px-2 py-1 border-round"
                  :style="{ 
                    background: metric.trend.type === 'up' ? '#22c55e20' : '#ef444420',
                    color: metric.trend.type === 'up' ? '#22c55e' : '#ef4444'
                  }"
                >
                  <i :class="metric.trend.type === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-xs"></i>
                  {{ metric.trend.value }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid">
      <!-- Left Column: Sales Trend Chart -->
      <div class="col-12 xl:col-8">
        <div class="flex flex-column gap-4 h-full">
          <SalesTrendChart 
            :country-code="selectedCountryCode"
            :store-id="selectedStoreId"
          />
        </div>
      </div>

      <!-- Right Column: Todo, Schedule & Rates -->
      <div class="col-12 xl:col-4">
        <div class="flex flex-column gap-6 h-full">
          <!-- 待办事项 Top 5 - 新位置 -->
          <Card class="shadow-sm border-round-2xl">
            <template #title>
              <div class="px-1">
                <span class="text-lg font-bold text-900">待办事项</span>
              </div>
            </template>
            <template #content>
              <div class="pt-2">
                <DashboardTodo :compact="true" :max-items="5" />
              </div>
            </template>
          </Card>
          <!-- Schedule -->
          <Card class="shadow-sm border-round-2xl">
            <template #title>
              <div class="px-1 cursor-pointer" @click="isScheduleOpen = true">
                <div class="flex align-items-center justify-content-between">
                  <span class="text-lg font-bold text-900">日程总览</span>
                  <i class="pi pi-angle-right text-500"></i>
                </div>
              </div>
            </template>
            <template #content>
              <div class="pt-2 cursor-pointer" @click="isScheduleOpen = true">
                <span class="text-sm font-semibold text-700 block mb-2">本周重点</span>
                <p class="text-sm text-600 line-height-3 m-0 line-clamp-3">
                  {{ summaryData.schedule.planNextWeek || '暂无计划，点击填写' }}
                </p>
              </div>
            </template>
          </Card>

          <!-- Rates -->
          <Card class="shadow-sm border-round-2xl flex-1">
            <template #title>
              <div class="px-1">
                <div class="flex flex-column gap-2">
                  <div class="flex align-items-center justify-content-between">
                    <span class="text-lg font-bold text-900">今日汇率</span>
                    <div class="flex gap-1">
                      <Button
                        icon="pi pi-calculator"
                        :severity="isCalculationMode ? 'primary' : 'secondary'"
                        text
                        rounded
                        size="small"
                        title="计算模式"
                        @click="toggleCalculationMode"
                      />
                      <Button
                        icon="pi pi-refresh"
                        :loading="manualRefreshStatus.isRefreshing"
                        :disabled="!canTriggerManualRefresh"
                        severity="success"
                        text
                        rounded
                        size="small"
                        title="手动刷新"
                        @click="handleManualRatesRefresh"
                      />
                    </div>
                  </div>
                  <div class="flex align-items-center justify-content-between text-xs text-500">
                    <span>{{ formattedRatesUpdatedAt ? `更新于 ${formattedRatesUpdatedAt}` : '' }}</span>
                    <span>{{ manualRefreshQuotaText }}</span>
                  </div>
                  <span v-if="manualRefreshStatus.error" class="text-xs text-red-500">{{ manualRefreshStatus.error }}</span>
                </div>
              </div>
            </template>
            <template #content>
              <div v-if="isLoading.rates" class="text-center text-500 py-4">加载汇率中...</div>
              <div v-else class="flex flex-column gap-1 overflow-y-auto" style="max-height: 18rem">
                <div v-for="row in rateRows" :key="row.code" class="surface-ground p-2 border-round-lg flex flex-column gap-1">
                   <div class="flex align-items-center justify-content-between">
                      <div class="flex align-items-center gap-2">
                         <template v-if="isCalculationMode">
                            <input
                              type="number"
                              class="w-4rem p-1 border-1 border-300 border-round text-center text-sm"
                              :value="rateStates[row.code]?.amount ?? 1"
                              @input="updateRateAmount(row.code, ($event.target as HTMLInputElement).value)"
                            />
                         </template>
                         <span v-else class="font-semibold text-900 text-sm">{{ formatInputAmount(rateStates[row.code]?.amount ?? 1) }}</span>
                         <span class="text-xs text-600">{{ row.baseCurrency }}</span>
                      </div>
                      <i class="pi pi-arrow-right-arrow-left text-xs text-500 cursor-pointer hover:text-primary" @click="toggleRateDirection(row.code)"></i>
                      <div class="flex align-items-center gap-2">
                         <span class="font-bold text-900 text-base">{{ row.unitRate !== null ? formatNumber(row.unitRate) : '--' }}</span>
                         <span class="text-xs text-600">{{ row.quoteCurrency }}</span>
                      </div>
                   </div>
                   <div v-if="row.convertedValue !== null" class="text-xs text-500 text-right">
                      = {{ formatNumber(row.convertedValue) }} {{ row.quoteCurrency }}
                   </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <DashboardSchedule
      :is-open="isScheduleOpen"
      :plan-next-week="summaryData.schedule.planNextWeek"
      :team-focus="summaryData.schedule.teamFocus"
      @close="isScheduleOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { useAuthStore } from '../../stores/auth';
import apiClient from '@/services/apiClient';
import DashboardTodo from './DashboardTodo.vue';
import DashboardSchedule from './DashboardSchedule.vue';
import SalesTrendChart from './SalesTrendChart.vue';

type GmvSummary = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  currency: string;
  cnyEquivalent: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
};

type ScheduleSummary = {
  planNextWeek: string;
  teamFocus: string;
};

type SummaryResponse = {
  gmv: GmvSummary;
  schedule: ScheduleSummary;
};

type RateState = {
  amount: number;
  swapped: boolean;
};

type CountryOption = { code: string; name: string };
type StoreOption = { id: string; name: string; countryCode: string };

const authStore = useAuthStore();
const DEFAULT_RATES: Record<string, number> = Object.freeze({
  CNY_USD: 0.14,
  CNY_IDR: 2300,
  CNY_VND: 3500,
  CNY_THB: 5,
  CNY_MYR: 0.65,
  CNY_PHP: 8,
  CNY_SGD: 0.19,
});
const MANUAL_REFRESH_LIMIT = 3;

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const todayDate = computed(() =>
  new Date().toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
);

const hitokoto = ref('...');

const isLoading = ref({
  summary: true,
  rates: true,
  filters: true,
});

const summaryData = ref<SummaryResponse>({
  gmv: {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    currency: '¥',
    cnyEquivalent: { today: 0, thisWeek: 0, thisMonth: 0 },
  },
  schedule: { planNextWeek: '加载中...', teamFocus: '' },
});
const ratesData = ref<Record<string, number>>({});
const ratesUpdatedAt = ref<string | null>(null);
const rateStates = ref<Record<string, RateState>>({});
const isCalculationMode = ref(false);
const remainingManualRefreshes = ref<number | null>(null);
const manualRefreshStatus = ref({
  isRefreshing: false,
  error: '',
});
const allCountries = ref<CountryOption[]>([]);
const allStores = ref<StoreOption[]>([]);
const selectedCountryCode = ref<string | null>(null);
const selectedStoreId = ref<string | null>(null);
const isScheduleOpen = ref(false);

const countryFilterOptions = computed(() => {
  const countries = allCountries.value.map((c) => ({ code: c.code, name: c.name }));
  if (authStore.role === 'admin') return countries;
  const operatedCountries = authStore.operatedCountries || [];
  return countries.filter((c) => operatedCountries.includes(c.code));
});

const storeFilterOptions = computed(() => {
  if (!selectedCountryCode.value) return [];
  return allStores.value.filter((store) => store.countryCode === selectedCountryCode.value);
});

const selectedStoreName = computed(() => {
  const store = storeFilterOptions.value.find((s) => s.id === selectedStoreId.value);
  return store ? store.name : '选择店铺...';
});

const highlightMetrics = computed(() => {
  if (isLoading.value.summary) {
    return [
      { label: '今日 GMV', value: '加载中', sub: '数据抓取中' },
      { label: '本周 GMV', value: '加载中', sub: '数据抓取中' },
      { label: '本月 GMV', value: '加载中', sub: '数据抓取中' },
      { label: '团队计划', value: '同步中', sub: '请稍候' },
    ];
  }
  const { gmv, schedule } = summaryData.value;
  const cny = gmv.cnyEquivalent;
  return [
    {
      label: '今日 GMV',
      value: formatCurrency(gmv.today, gmv.currency),
      sub: `≈${formatCurrency(cny.today, 'CNY')}`,
      icon: 'pi pi-dollar',
    },
    {
      label: '本周 GMV',
      value: formatCurrency(gmv.thisWeek, gmv.currency),
      sub: `≈${formatCurrency(cny.thisWeek, 'CNY')}`,
      icon: 'pi pi-chart-line',
    },
    {
      label: '本月 GMV',
      value: formatCurrency(gmv.thisMonth, gmv.currency),
      sub: `≈${formatCurrency(cny.thisMonth, 'CNY')}`,
      icon: 'pi pi-calendar',
    },
    {
      label: '团队计划',
      value: schedule.planNextWeek ? '已同步' : '待填写',
      sub: schedule.planNextWeek || '周报 > 下周计划',
      icon: 'pi pi-users',
    },
  ];
});

// 核心KPI指标，简洁设计
const kpiMetrics = computed(() => {
  if (isLoading.value.summary) {
    return [
      { 
        label: '今日 GMV', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-dollar',
        color: '#8b5cf6',
        trend: null,
      },
      { 
        label: '今日订单', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-shopping-cart',
        color: '#ec4899',
        trend: null,
      },
      { 
        label: '待发货', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-box',
        color: '#3b82f6',
        trend: null,
      },
      { 
        label: '库存预警', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-exclamation-triangle',
        color: '#10b981',
        trend: null,
      },
      { 
        label: '广告花费', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-megaphone',
        color: '#f59e0b',
        trend: null,
      },
    ];
  }

  const { gmv } = summaryData.value;
  const cny = gmv.cnyEquivalent;

  return [
    {
      label: '今日 GMV',
      value: formatCurrency(gmv.today, gmv.currency),
      sub: `≈${formatCurrency(cny.today, 'CNY')}`,
      icon: 'pi pi-dollar',
      color: '#8b5cf6', // 紫色
      trend: null, // 待开发：需后端API提供日环比数据
    },
    {
      label: '今日订单',
      value: '待开发',
      sub: '需后端API支持',
      icon: 'pi pi-shopping-cart',
      color: '#ec4899', // 粉色
      trend: null,
    },
    {
      label: '待发货',
      value: '待开发',
      sub: '需后端API支持',
      icon: 'pi pi-box',
      color: '#3b82f6', // 蓝色
      trend: null,
    },
    {
      label: '库存预警',
      value: '待开发',
      sub: '低于安全库存的SKU数',
      icon: 'pi pi-exclamation-triangle',
      color: '#10b981', // 绿色
      trend: null,
    },
    {
      label: '广告花费',
      value: '待开发',
      sub: '今日广告消耗金额',
      icon: 'pi pi-megaphone',
      color: '#f59e0b', // 橙色
      trend: null,
    },
  ];
});

const userCountryCodesForRates = computed(() => {
  if (authStore.role === 'admin') {
    return ['IDR', 'VND', 'THB', 'MYR', 'PHP', 'SGD'];
  }
  return authStore.operatedCountries
    .map((code: string) => {
      const currencyMap: Record<string, string> = { ID: 'IDR', VN: 'VND', TH: 'THB', MY: 'MYR', PH: 'PHP', SG: 'SGD' };
      return currencyMap[code];
    })
    .filter(Boolean);
});

const supportedRateCodes = computed(() => {
  const codes = ['USD', ...userCountryCodesForRates.value];
  return Array.from(new Set(codes.filter(Boolean)));
});

watch(
  supportedRateCodes,
  (codes) => {
    const nextState: Record<string, RateState> = {};
    codes.forEach((code) => {
      nextState[code] = rateStates.value[code] || { amount: 1, swapped: false };
    });
    rateStates.value = nextState;
  },
  { immediate: true },
);

const rateRows = computed(() => {
  return supportedRateCodes.value.map((code) => {
    const state = rateStates.value[code] || { amount: 1, swapped: false };
    const baseCurrency = state.swapped ? code : 'CNY';
    const quoteCurrency = state.swapped ? 'CNY' : code;
    const amount = Number.isFinite(state.amount) ? state.amount : 1;
    const rawRate = ratesData.value[`CNY_${code}`];
    let unitRate: number | null = null;
    if (typeof rawRate === 'number' && rawRate > 0) {
      unitRate = state.swapped ? 1 / rawRate : rawRate;
    }
    const convertedValue = unitRate !== null ? amount * unitRate : null;
    return {
      code,
      baseCurrency,
      quoteCurrency,
      amount,
      unitRate,
      convertedValue,
    };
  });
});

const formattedRatesUpdatedAt = computed(() => {
  if (!ratesUpdatedAt.value) return '';
  try {
    return new Date(ratesUpdatedAt.value).toLocaleString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    return '';
  }
});

const isRateRefreshLimited = computed(() => authStore.role !== 'admin');

const manualRefreshQuotaText = computed(() => {
  if (!isRateRefreshLimited.value) {
    return '管理员刷新不限次数';
  }
  const remaining =
    typeof remainingManualRefreshes.value === 'number'
      ? remainingManualRefreshes.value
      : MANUAL_REFRESH_LIMIT;
  return `今日剩余 ${remaining} 次`;
});

const canTriggerManualRefresh = computed(() => {
  if (manualRefreshStatus.value.isRefreshing) {
    return false;
  }
  if (!isRateRefreshLimited.value) {
    return true;
  }
  const remaining = remainingManualRefreshes.value;
  if (typeof remaining !== 'number') {
    return MANUAL_REFRESH_LIMIT > 0;
  }
  return remaining > 0;
});

function applyRatesPayload(payload: any = {}) {
  const incomingRates = payload.rates;
  if (incomingRates && Object.keys(incomingRates).length) {
    ratesData.value = incomingRates;
  } else if (!Object.keys(ratesData.value || {}).length) {
    ratesData.value = { ...DEFAULT_RATES };
  }
  ratesUpdatedAt.value = payload.updatedAt || ratesUpdatedAt.value;
}

async function fetchHitokoto() {
  try {
    const res = await fetch('https://v1.hitokoto.cn/?c=i');
    const data = await res.json();
    hitokoto.value = data.hitokoto || hitokoto.value;
  } catch (error) {
    console.error(error);
  }
}

async function fetchSummary() {
  isLoading.value.summary = true;
  try {
    const response = await apiClient.get<SummaryResponse>('/dashboard/summary');
    summaryData.value = response.data;
  } catch (error) {
    console.error('获取 summary 失败', error);
  } finally {
    isLoading.value.summary = false;
  }
}

async function fetchRates() {
  isLoading.value.rates = true;
  try {
    const response = await apiClient.get('/exchange-rates');
    applyRatesPayload(response.data);
  } catch (error) {
    console.error('获取汇率失败', error);
  } finally {
    isLoading.value.rates = false;
  }
}

async function fetchFilters() {
  isLoading.value.filters = true;
  try {
    const [countriesRes, storesRes] = await Promise.all([
      apiClient.get('/countries'),
      apiClient.get('/stores'),
    ]);
    allCountries.value = countriesRes.data || [];
    allStores.value = storesRes.data || [];

    // 默认选第一项
    selectedCountryCode.value = countryFilterOptions.value[0]?.code || null;
    selectedStoreId.value = storeFilterOptions.value[0]?.id || null;
  } catch (error) {
    console.error('获取筛选项失败', error);
  } finally {
    isLoading.value.filters = false;
  }
}

async function fetchManualRefreshQuota() {
  if (!isRateRefreshLimited.value) return;
  try {
    const res = await apiClient.get('/exchange-rates/refresh-quota');
    remainingManualRefreshes.value = res.data?.remaining ?? MANUAL_REFRESH_LIMIT;
  } catch (error) {
    remainingManualRefreshes.value = MANUAL_REFRESH_LIMIT;
  }
}

async function handleManualRatesRefresh() {
  if (!canTriggerManualRefresh.value) return;
  manualRefreshStatus.value.isRefreshing = true;
  manualRefreshStatus.value.error = '';
  try {
    const res = await apiClient.post('/exchange-rates/refresh');
    applyRatesPayload(res.data);
    await fetchManualRefreshQuota();
  } catch (error: any) {
    manualRefreshStatus.value.error = error.response?.data?.error || '刷新失败，请稍后重试';
  } finally {
    manualRefreshStatus.value.isRefreshing = false;
  }
}

function formatCurrency(value: number, currency: string) {
  if (value === null || value === undefined) return '--';
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `${currency} ${value}`;
  }
}

function formatNumber(value: number) {
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 4 });
}

function formatInputAmount(value: number) {
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function toggleRateDirection(code: string) {
  rateStates.value = {
    ...rateStates.value,
    [code]: { ...(rateStates.value[code] || { amount: 1, swapped: false }), swapped: !rateStates.value[code]?.swapped },
  };
}

function toggleCalculationMode() {
  isCalculationMode.value = !isCalculationMode.value;
}

function updateRateAmount(code: string, input: string) {
  const num = Number(input);
  rateStates.value = {
    ...rateStates.value,
    [code]: { ...(rateStates.value[code] || { amount: 1, swapped: false }), amount: Number.isFinite(num) ? num : 1 },
  };
}

function applyStoreFilter() {
  // Placeholder for store-based filtering. Currently no-op.
}

function applyCountryFilter() {
  if (selectedCountryCode.value && !storeFilterOptions.value.find((s) => s.id === selectedStoreId.value)) {
    selectedStoreId.value = storeFilterOptions.value[0]?.id || null;
  }
  nextTick(applyStoreFilter);
}

watch(selectedCountryCode, () => applyCountryFilter());
watch(selectedStoreId, () => applyStoreFilter());

onMounted(async () => {
  await Promise.all([fetchSummary(), fetchRates(), fetchFilters(), fetchHitokoto(), fetchManualRefreshQuota()]);
});
</script>
