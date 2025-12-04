<template>
  <div class="dashboard-home p-6 max-w-[1920px] mx-auto">
    <!-- 顶部区域 (Header Area) -->
    <div class="flex items-center justify-between mb-6">
      <!-- 左侧：问候语 -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 m-0">{{ greeting }}，{{ authStore.nickname }}</h1>
        <p class="text-slate-500 mt-1 mb-0">{{ todayDate }}</p>
      </div>

      <!-- 右侧：过滤器 -->
      <div class="flex items-center gap-3">
        <!-- 国家筛选 -->
        <IconField>
          <InputIcon class="pi pi-globe text-slate-400" />
          <Select
            v-model="selectedCountryCode"
            :options="countryFilterOptions"
            optionLabel="name"
            optionValue="code"
            placeholder="选择国家"
            class="
              bg-white border-0 shadow-sm rounded-full pl-10
              min-w-[150px]
              focus:ring-2 focus:ring-indigo-500
            "
          />
        </IconField>

        <!-- 店铺筛选 -->
        <IconField>
          <InputIcon class="pi pi-shop text-slate-400" />
          <Select
            v-model="selectedStoreId"
            :options="storeFilterOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="选择店铺"
            :disabled="!selectedCountryCode"
            class="
              bg-white border-0 shadow-sm rounded-full pl-10
              min-w-[180px]
              focus:ring-2 focus:ring-indigo-500
            "
          />
        </IconField>
      </div>
    </div>

    <!-- KPI 卡片区 (Metrics Row) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div 
        v-for="metric in kpiMetrics" 
        :key="metric.label"
        class="
          bg-white rounded-xl p-5
          shadow-sm hover:shadow-md
          transition-all duration-200
          border border-slate-100
        "
      >
        <!-- 图标 -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500 uppercase">{{ metric.label }}</span>
          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :style="{ backgroundColor: metric.color + '15' }"
          >
            <i :class="metric.icon" :style="{ color: metric.color }" class="text-lg"></i>
          </div>
        </div>

        <!-- 数值 -->
        <div class="text-2xl font-bold text-slate-900 mb-2">{{ metric.value }}</div>

        <!-- 副标题和趋势 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">{{ metric.sub }}</span>
          <span 
            v-if="metric.trend"
            class="text-xs font-semibold px-2 py-0.5 rounded-full"
            :class="metric.trend.type === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'"
          >
            <i :class="metric.trend.type === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-xs"></i>
            {{ metric.trend.value }}
          </span>
        </div>
      </div>
    </div>

    <!-- 主要内容区 (Bento Grid Layout) -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- 左侧 (2/3 宽度)：销售趋势图表 -->
      <div class="xl:col-span-2">
        <Card class="shadow-sm rounded-2xl border border-slate-100 h-full">
          <template #header>
            <div class="px-6 pt-6 pb-0 flex items-center justify-between">
              <h2 class="text-xl font-bold text-slate-900 m-0">销售趋势</h2>
              <!-- 图表类型切换 -->
              <div class="flex gap-2">
                <Button
                  label="销售额"
                  :severity="chartType === 'revenue' ? 'primary' : 'secondary'"
                  :outlined="chartType !== 'revenue'"
                  size="small"
                  class="rounded-full"
                  @click="chartType = 'revenue'"
                />
                <Button
                  label="订单量"
                  :severity="chartType === 'orders' ? 'primary' : 'secondary'"
                  :outlined="chartType !== 'orders'"
                  size="small"
                  class="rounded-full"
                  @click="chartType = 'orders'"
                />
              </div>
            </div>
          </template>
          <template #content>
            <SalesTrendChart 
              :country-code="selectedCountryCode"
              :store-id="selectedStoreId"
            />
          </template>
        </Card>
      </div>

      <!-- 右侧 (1/3 宽度)：工具栏 -->
      <div class="flex flex-col gap-6">
        <!-- 卡片 A: 极简汇率计算器 -->
        <Card class="
          shadow-sm rounded-2xl border-0
          bg-gradient-to-br from-indigo-500 to-violet-600
          text-white
        ">
          <template #header>
            <div class="px-6 pt-6 pb-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-bold m-0">汇率计算器</h3>
                <Button
                  icon="pi pi-refresh"
                  :loading="manualRefreshStatus.isRefreshing"
                  :disabled="!canTriggerManualRefresh"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  class="text-white hover:bg-white/20"
                  @click="handleManualRatesRefresh"
                />
              </div>
              <div class="text-xs opacity-80">
                {{ formattedRatesUpdatedAt ? `更新于 ${formattedRatesUpdatedAt}` : '加载中...' }}
                <span class="mx-2">·</span>
                {{ manualRefreshQuotaText }}
              </div>
            </div>
          </template>
          <template #content>
            <div v-if="isLoading.rates" class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-2xl opacity-50"></i>
            </div>
            <div v-else class="space-y-3">
              <!-- CNY 输入 -->
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div class="text-xs opacity-80 mb-2">人民币 (CNY)</div>
                <InputNumber
                  v-model="exchangeCalcAmount"
                  :min="0"
                  :maxFractionDigits="2"
                  class="
                    w-full
                    bg-transparent border-0
                    text-white
                    [&_.p-inputnumber-input]:bg-transparent
                    [&_.p-inputnumber-input]:border-0
                    [&_.p-inputnumber-input]:text-white
                    [&_.p-inputnumber-input]:text-2xl
                    [&_.p-inputnumber-input]:font-bold
                    [&_.p-inputnumber-input]:p-0
                  "
                  placeholder="0.00"
                />
              </div>

              <!-- 交换按钮 -->
              <div class="flex justify-center -my-1">
                <Button
                  icon="pi pi-arrow-down-up"
                  rounded
                  text
                  severity="secondary"
                  class="w-10 h-10 bg-white/20 hover:bg-white/30 text-white"
                  @click="swapExchangeCurrencies"
                />
              </div>

              <!-- 目标货币选择和结果 -->
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs opacity-80">目标货币</div>
                  <Select
                    v-model="targetCurrency"
                    :options="supportedRateCodes"
                    placeholder="选择货币"
                    class="
                      bg-white/20 border-0 rounded-lg text-white min-w-[100px]
                      [&_.p-select-label]:text-white
                    "
                  />
                </div>
                <div class="text-2xl font-bold">
                  {{ formatNumber(convertedAmount) }}
                </div>
              </div>

              <!-- 汇率显示 -->
              <div class="text-xs opacity-80 text-center">
                1 CNY = {{ formatNumber(currentRate) }} {{ targetCurrency }}
              </div>
            </div>
          </template>
        </Card>

        <!-- 卡片 B: 待办与日程 (Tabs) -->
        <Card class="shadow-sm rounded-2xl border border-slate-100 flex-1">
          <template #content>
            <TabView class="dashboard-tabs">
              <TabPanel value="0">
                <template #header>
                  <span>待办事项</span>
                </template>
                <DashboardTodo :compact="true" :max-items="5" />
              </TabPanel>
              <TabPanel value="1">
                <template #header>
                  <span>日程总览</span>
                </template>
                <div class="cursor-pointer" @click="isScheduleOpen = true">
                  <div class="mb-3">
                    <span class="text-sm font-semibold text-slate-700 block mb-2">本周重点</span>
                    <p class="text-sm text-slate-600 line-height-3 m-0">
                      {{ summaryData.schedule.planNextWeek || '暂无计划，点击填写' }}
                    </p>
                  </div>
                  <Button
                    label="查看详情"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    severity="secondary"
                    outlined
                    size="small"
                    class="w-full rounded-full"
                  />
                </div>
              </TabPanel>
            </TabView>
          </template>
        </Card>
      </div>
    </div>

    <!-- 日程弹窗 -->
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
import Select from 'primevue/select';
import Button from 'primevue/button';
import Card from 'primevue/card';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputNumber from 'primevue/inputnumber';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
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

// ===== 新增的 UI 状态 =====
const chartType = ref<'revenue' | 'orders'>('revenue'); // 图表类型切换
const exchangeCalcAmount = ref(100); // 汇率计算器输入金额
const targetCurrency = ref('USD'); // 目标货币
const isExchangeSwapped = ref(false); // 是否交换了货币方向

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '早安';
  if (hour < 18) return '下午好';
  return '晚安';
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

// 核心KPI指标
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
      trend: { type: 'up', value: '+5%' }, // TODO: 需后端API提供
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

// 汇率计算器相关计算属性
const currentRate = computed(() => {
  const rawRate = ratesData.value[`CNY_${targetCurrency.value}`];
  if (typeof rawRate === 'number' && rawRate > 0) {
    return isExchangeSwapped.value ? 1 / rawRate : rawRate;
  }
  return 0;
});

const convertedAmount = computed(() => {
  if (!exchangeCalcAmount.value) return 0;
  return exchangeCalcAmount.value * currentRate.value;
});

watch(
  supportedRateCodes,
  (codes) => {
    const nextState: Record<string, RateState> = {};
    codes.forEach((code) => {
      nextState[code] = rateStates.value[code] || { amount: 1, swapped: false };
    });
    rateStates.value = nextState;
    
    // 设置默认目标货币
    if (!targetCurrency.value || !codes.includes(targetCurrency.value)) {
      targetCurrency.value = codes[0] || 'USD';
    }
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
    return '管理员无限次';
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

function swapExchangeCurrencies() {
  isExchangeSwapped.value = !isExchangeSwapped.value;
  // 交换后重新计算
  if (convertedAmount.value > 0) {
    exchangeCalcAmount.value = convertedAmount.value;
  }
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

<style scoped>
/* 自定义 TabView 样式 */
.dashboard-tabs :deep(.p-tabview-nav) {
  background: transparent;
  border: 0;
}

.dashboard-tabs :deep(.p-tabview-nav-link) {
  color: rgb(71 85 105);
  font-weight: 500;
}

.dashboard-tabs :deep(.p-tabview-nav-link:focus) {
  box-shadow: none;
}

.dashboard-tabs :deep(.p-tabview-selected .p-tabview-nav-link) {
  color: rgb(79 70 229);
  border-color: rgb(79 70 229);
}

.dashboard-tabs :deep(.p-tabview-panels) {
  padding: 1rem 0 0 0;
}
</style>
