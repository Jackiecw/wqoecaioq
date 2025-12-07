<template>
  <div class="dashboard-container p-4 md:p-5 xl:px-6 w-full min-h-full flex flex-column">
    <!-- 顶部区域 (Header Area) -->
    <PageHeader
      :title="`${greeting}，${authStore.nickname}`"
      :subtitle="todayDate"
      class="mb-5"
    >
      <template #actions>
        <div class="flex align-items-center gap-3 flex-wrap justify-content-end">
          <!-- 国家筛选 -->
          <IconField>
            <InputIcon class="pi pi-globe" style="color: var(--surface-500)" />
            <Select
              v-model="selectedCountryCode"
              :options="countryFilterOptions"
              optionLabel="name"
              optionValue="code"
              placeholder="选择国家"
              class="filter-select pl-5"
              style="min-width: 150px"
            />
          </IconField>

          <!-- 店铺筛选 -->
          <IconField>
            <InputIcon class="pi pi-shop" style="color: var(--surface-500)" />
            <Select
              v-model="selectedStoreId"
              :options="storeFilterOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="选择店铺"
              :disabled="!selectedCountryCode"
              class="filter-select pl-5"
              style="min-width: 180px"
            />
          </IconField>
        </div>
      </template>
    </PageHeader>

    <!-- KPI 卡片区 (Metrics Row) -->
    <div class="grid mb-5">
      <div 
        v-for="(metric, index) in kpiMetrics" 
        :key="metric.label"
        class="col-12 sm:col-6 xl:col-3"
      >
        <ContentCard
          class="kpi-card animate-fade-in-up"
          :class="[`kpi-card--${metric.colorKey}`]"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <!-- 头部：标签 + 图标 -->
          <div class="flex align-items-center justify-content-between mb-4">
            <span class="text-xs font-semibold text-500 uppercase">{{ metric.label }}</span>
            <div class="kpi-icon" :class="[`kpi-icon--${metric.colorKey}`]">
              <i :class="metric.icon"></i>
            </div>
          </div>

          <!-- 数值 -->
          <div class="kpi-value mb-2">{{ metric.value }}</div>

          <!-- 副标题和趋势 -->
          <div class="flex align-items-center gap-2">
            <span class="text-sm text-600">{{ metric.sub }}</span>
            <span 
              v-if="metric.trend"
              class="kpi-trend"
              :class="metric.trend.type === 'up' ? 'kpi-trend--up' : 'kpi-trend--down'"
            >
              <i :class="metric.trend.type === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" style="font-size: 0.625rem"></i>
              {{ metric.trend.value }}
            </span>
          </div>
        </ContentCard>
      </div>
    </div>

    <!-- 主要内容区 (Bento Grid Layout) -->
    <div class="grid flex-1">
      <!-- 左侧 (2/3 宽度)：销售趋势图表 -->
      <div class="col-12 lg:col-8">
        <SalesTrendChart 
          class="h-full w-full"
          :country-code="selectedCountryCode"
          :store-id="selectedStoreId"
        />
      </div>

      <!-- 右侧 (1/3 宽度)：工具栏 -->
      <div class="col-12 lg:col-4 flex flex-column gap-4">
        <!-- 卡片 A: 汇率计算器 (Clean White Theme) -->
        <ContentCard class="exchange-card">
          <!-- 标题 -->
          <div class="flex align-items-center justify-content-between mb-4">
            <div>
              <h3 class="text-base font-semibold m-0" style="color: var(--color-text-primary)">汇率计算器</h3>
              <div class="text-xs mt-1" style="color: var(--color-text-secondary)">
                <span v-if="isUsingFallbackRates" class="inline-flex align-items-center gap-1">
                  <i class="pi pi-info-circle text-xs"></i>
                  离线汇率
                </span>
                <span v-else-if="formattedRatesUpdatedAt">更新于 {{ formattedRatesUpdatedAt }}</span>
                <span v-else>加载中...</span>
              </div>
            </div>
            <Button
              icon="pi pi-refresh"
              :loading="manualRefreshStatus.isRefreshing"
              :disabled="!canTriggerManualRefresh || isUsingFallbackRates"
              severity="secondary"
              text
              rounded
              size="small"
              @click="handleManualRatesRefresh"
            />
          </div>

          <!-- 汇率计算区 -->
          <div v-if="isLoading.rates" class="text-center py-6">
            <i class="pi pi-spin pi-spinner text-2xl" style="color: var(--color-text-muted)"></i>
          </div>
          <div v-else class="flex flex-column gap-3">
            <!-- CNY 输入 -->
            <div class="exchange-input-box">
              <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary)">人民币 (CNY)</div>
              <input
                v-model.number="exchangeCalcAmount"
                type="number"
                :min="0"
                class="exchange-input"
                placeholder="100.00"
              />
            </div>

            <!-- 交换按钮 -->
            <div class="flex justify-content-center" style="margin: -0.25rem 0">
              <button class="exchange-swap-btn" @click="swapExchangeCurrencies">
                <i class="pi pi-arrow-down-up"></i>
              </button>
            </div>

            <!-- 目标货币和结果 -->
            <div class="exchange-input-box">
              <div class="flex align-items-center justify-content-between mb-2">
                <div class="text-xs font-medium" style="color: var(--color-text-secondary)">目标货币</div>
                <Select
                  v-model="targetCurrency"
                  :options="supportedRateCodes"
                  placeholder="选择货币"
                  class="exchange-currency-select"
                />
              </div>
              <div class="exchange-result">
                {{ formatNumber(convertedAmount) }}
              </div>
            </div>

            <!-- 汇率比例 -->
            <div class="exchange-rate-info">
              1 CNY = {{ formatNumber(currentRate) }} {{ targetCurrency }}
            </div>
          </div>
        </ContentCard>

        <!-- 卡片 B: 待办与日程 -->
        <ContentCard class="flex-1 p-5">
          <!-- 自定义 Tab 切换 -->
          <div class="tab-switcher mb-4">
            <button
              class="tab-switcher-btn"
              :class="{ 'tab-switcher-btn--active': activeTab === 'todo' }"
              @click="activeTab = 'todo'"
            >
              待办事项
            </button>
            <button
              class="tab-switcher-btn"
              :class="{ 'tab-switcher-btn--active': activeTab === 'schedule' }"
              @click="activeTab = 'schedule'"
            >
              日程总览
            </button>
          </div>

          <!-- 内容区 -->
          <div v-if="activeTab === 'todo'">
            <DashboardTodo :compact="true" :max-items="5" />
          </div>
          <div v-else class="cursor-pointer" @click="isScheduleOpen = true">
            <div class="mb-4">
              <span class="text-sm font-semibold text-700 block mb-2">本周重点</span>
              <p class="text-sm text-600 line-height-3 m-0">
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
              class="w-full border-round-3xl"
            />
          </div>
        </ContentCard>
      </div>
    </div>

    <!-- 快捷链接栏 -->
    <div class="mt-5 pt-4 border-top-1 surface-border">
      <div class="flex align-items-center justify-content-between mb-3">
        <span class="text-sm font-semibold text-700">快捷链接</span>
        <Button
          v-if="authStore.role === 'admin'"
          label="管理"
          icon="pi pi-cog"
          size="small"
          text
          @click="goToLinksPage"
        />
      </div>
      <div class="quick-links" v-if="!isLoadingLinks && quickLinks.length > 0">
        <a
          v-for="link in quickLinks"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="quick-link-item"
        >
          <i class="pi pi-external-link text-xs"></i>
          {{ link.title }}
        </a>
      </div>
      <div v-else-if="isLoadingLinks" class="text-sm text-color-secondary">
        加载中...
      </div>
      <div v-else class="text-sm text-color-secondary">
        暂无快捷链接
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
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import apiClient from '@/services/apiClient';
import DashboardTodo from './DashboardTodo.vue';
import DashboardSchedule from './DashboardSchedule.vue';
import SalesTrendChart from './SalesTrendChart.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';

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
type LinkItem = { id: number; title: string; url: string; description?: string };

const authStore = useAuthStore();
const router = useRouter();

// 默认参考汇率（容错机制）
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

// ===== UI 状态 =====
const exchangeCalcAmount = ref(100);
const targetCurrency = ref('USD');
const isExchangeSwapped = ref(false);
const activeTab = ref<'todo' | 'schedule'>('todo');
const isUsingFallbackRates = ref(false);

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

// 快捷链接
const quickLinks = ref<LinkItem[]>([]);
const isLoadingLinks = ref(true);

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

// 核心KPI指标
const kpiMetrics = computed(() => {
  if (isLoading.value.summary) {
    return [
      { 
        label: '今日 GMV', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-dollar',
        colorKey: 'purple',
        trend: null,
      },
      { 
        label: '今日订单', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-shopping-cart',
        colorKey: 'pink',
        trend: null,
      },
      { 
        label: '待发货', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-box',
        colorKey: 'blue',
        trend: null,
      },
      { 
        label: '库存预警', 
        value: '加载中', 
        sub: '数据抓取中',
        icon: 'pi pi-exclamation-triangle',
        colorKey: 'green',
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
      colorKey: 'purple',
      trend: { type: 'up', value: '+5%' },
    },
    {
      label: '今日订单',
      value: '待开发',
      sub: '需后端API支持',
      icon: 'pi pi-shopping-cart',
      colorKey: 'pink',
      trend: null,
    },
    {
      label: '待发货',
      value: '待开发',
      sub: '需后端API支持',
      icon: 'pi pi-box',
      colorKey: 'blue',
      trend: null,
    },
    {
      label: '库存预警',
      value: '待开发',
      sub: '低于安全库存的SKU数',
      icon: 'pi pi-exclamation-triangle',
      colorKey: 'green',
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

// 汇率计算器相关
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
    
    if (!targetCurrency.value || !codes.includes(targetCurrency.value)) {
      targetCurrency.value = codes[0] || 'USD';
    }
  },
  { immediate: true },
);

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
    isUsingFallbackRates.value = false;
  } else {
    ratesData.value = { ...DEFAULT_RATES };
    isUsingFallbackRates.value = true;
  }
  ratesUpdatedAt.value = payload.updatedAt || ratesUpdatedAt.value;
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
    console.error('获取汇率失败，使用默认汇率', error);
    applyRatesPayload({});
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

    selectedCountryCode.value = countryFilterOptions.value[0]?.code || null;
    selectedStoreId.value = storeFilterOptions.value[0]?.id || null;
  } catch (error) {
    console.error('获取筛选项失败', error);
  } finally {
    isLoading.value.filters = false;
  }
}

async function fetchLinks() {
  isLoadingLinks.value = true;
  try {
    const response = await apiClient.get('/links');
    quickLinks.value = (response.data || []).slice(0, 8); // 最多显示8个
  } catch (error) {
    console.error('获取链接失败', error);
    quickLinks.value = [];
  } finally {
    isLoadingLinks.value = false;
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

function swapExchangeCurrencies() {
  isExchangeSwapped.value = !isExchangeSwapped.value;
  if (convertedAmount.value > 0) {
    exchangeCalcAmount.value = convertedAmount.value;
  }
}

function goToLinksPage() {
  router.push('/links');
}

function applyStoreFilter() {
  // Placeholder
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
  await Promise.all([fetchSummary(), fetchRates(), fetchFilters(), fetchLinks(), fetchManualRefreshQuota()]);
});
</script>

<style scoped>
/* 组件级样式 - Clean Premium White Theme */
.dashboard-container {
  background: var(--color-bg-page);
}

/* ========================================
   汇率计算器卡片
   ======================================== */
.exchange-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.exchange-card:hover {
  box-shadow: var(--shadow-md);
}

.exchange-input-box {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
}

.exchange-input {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  outline: none;
  font-variant-numeric: tabular-nums;
}

.exchange-input::placeholder {
  color: var(--color-text-muted);
}

.exchange-swap-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  transition: all var(--transition-fast);
}

.exchange-swap-btn:hover {
  background: var(--color-accent);
  color: white;
  transform: scale(1.05);
}

.exchange-result {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.exchange-currency-select {
  min-width: 90px;
}

.exchange-currency-select :deep(.p-select) {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.exchange-rate-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: center;
  background: var(--color-accent-soft);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
}

/* ========================================
   数字输入框样式
   ======================================== */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
