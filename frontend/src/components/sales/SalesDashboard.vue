<template>
  <div class="flex flex-column gap-4">
    <!-- Page Header -->
    <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-900 m-0">销售数据看板</h1>
        <p class="text-500 mt-1 mb-0">实时监控关键业务指标与趋势</p>
      </div>
      <div class="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          v-model="selectedCountry"
          :options="countryOptions"
          option-label="name"
          option-value="code"
          class="w-10rem"
          placeholder="选择国家"
          :filter="countryOptions.length > 6"
        />
        <SelectButton
          v-model="currentRange"
          :options="dateRangeOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <div v-if="currentRange === 'custom'" class="flex align-items-center gap-2">
          <Calendar v-model="customStartDate" show-icon dateFormat="yy-mm-dd" placeholder="开始" class="w-8rem" />
          <span class="text-500">-</span>
          <Calendar v-model="customEndDate" show-icon dateFormat="yy-mm-dd" placeholder="结束" class="w-8rem" />
          <Button icon="pi pi-check" @click="fetchStats" />
        </div>
        <Button
          :icon="isSnapshotMode ? 'pi pi-eye-slash' : 'pi pi-camera'"
          :severity="isSnapshotMode ? 'danger' : 'secondary'"
          outlined
          @click="toggleSnapshotMode"
        />
      </div>
    </div>

    <!-- Snapshot Banner -->
    <div v-if="isSnapshotMode" class="bg-blue-50 border-blue-100 border-1 border-round-xl p-4 flex align-items-center justify-content-between">
      <div>
        <p class="text-xs font-bold text-blue-600 uppercase mb-1">Snapshot Mode</p>
        <h3 class="text-xl font-bold text-blue-900 m-0">销售周报截屏视图</h3>
      </div>
      <div class="text-right">
        <p class="text-sm text-blue-600 mb-0">报告日期</p>
        <p class="text-2xl font-bold text-blue-900 m-0">{{ todayText }}</p>
      </div>
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <!-- Stats Cards -->
    <div class="grid gap-4">
      <div class="col-12 md:col-4">
        <Card class="shadow-lg border-round-3xl overflow-hidden h-full hover:shadow-xl transition-all transition-duration-300" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <template #content>
            <div class="flex flex-column gap-3 text-white">
              <div class="flex align-items-center gap-2">
                <div class="bg-white-alpha-20 border-round-2xl p-3 backdrop-blur">
                  <i class="pi pi-chart-line text-2xl"></i>
                </div>
                <span class="font-medium opacity-90">总销售额 (GMV)</span>
              </div>
              <div class="flex align-items-baseline gap-2">
                <span class="text-5xl font-bold">{{ formatCurrency(stats.summary.totalGMV, stats.summary.currency).replace(/[^\d,.]/g, '') }}</span>
                <span class="text-xl opacity-80">{{ stats.summary.currency }}</span>
              </div>
              <div class="flex justify-content-end">
                <Tag :value="formatGrowth(stats.summary.gmvGrowth)" :severity="growthSeverity(stats.summary.gmvGrowth)" rounded class="font-bold px-3" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-4">
        <Card class="shadow-lg border-round-3xl overflow-hidden h-full hover:shadow-xl transition-all transition-duration-300" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <template #content>
            <div class="flex flex-column gap-3 text-white">
              <div class="flex align-items-center gap-2">
                <div class="bg-white-alpha-20 border-round-2xl p-3 backdrop-blur">
                  <i class="pi pi-shopping-cart text-2xl"></i>
                </div>
                <span class="font-medium opacity-90">总订单量</span>
              </div>
              <div class="flex align-items-baseline gap-2">
                <span class="text-5xl font-bold">{{ stats.summary.totalOrders.toLocaleString() }}</span>
                <span class="text-xl opacity-80">单</span>
              </div>
              <div class="flex justify-content-end">
                <Tag :value="formatGrowth(stats.summary.ordersGrowth)" :severity="growthSeverity(stats.summary.ordersGrowth)" rounded class="font-bold px-3" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-4">
        <Card class="shadow-lg border-round-3xl overflow-hidden h-full hover:shadow-xl transition-all transition-duration-300" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <template #content>
            <div class="flex flex-column gap-3 text-white">
              <div class="flex align-items-center gap-2">
                <div class="bg-white-alpha-20 border-round-2xl p-3 backdrop-blur">
                  <i class="pi pi-dollar text-2xl"></i>
                </div>
                <span class="font-medium opacity-90">平均客单价 (AOV)</span>
              </div>
              <div class="flex align-items-baseline gap-2">
                <span class="text-5xl font-bold">{{ formatCurrency(stats.summary.aov, stats.summary.currency).replace(/[^\d,.]/g, '') }}</span>
                <span class="text-xl opacity-80">{{ stats.summary.currency }}</span>
              </div>
              <div class="flex justify-content-end">
                <Tag :value="formatGrowth(stats.summary.aovGrowth)" :severity="growthSeverity(stats.summary.aovGrowth)" rounded class="font-bold px-3" />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid gap-4">
      <div class="col-12 lg:col-8">
        <Card class="shadow-lg border-round-3xl h-full hover:shadow-xl transition-all transition-duration-300">
          <template #title>
            <div class="flex align-items-center gap-2">
              <div class="bg-primary-50 text-primary border-round-2xl p-2">
                <i class="pi pi-chart-line text-xl"></i>
              </div>
              <span class="text-xl font-bold text-900">销售趋势</span>
            </div>
          </template>
          <template #content>
            <div class="h-20rem w-full relative">
              <div v-if="isLoading" class="absolute inset-0 flex align-items-center justify-content-center bg-white-alpha-50 z-1">
                <i class="pi pi-spin pi-spinner text-4xl text-500"></i>
              </div>
              <BaseChart v-else-if="hasTrendData" :option="trendChartOption" height="100%" :loading="isLoading" />
              <div v-else class="h-full flex align-items-center justify-content-center text-500">暂无趋势数据</div>
            </div>
          </template>
        </Card>
      </div>
      <div class="col-12 lg:col-4">
        <Card class="shadow-lg border-round-3xl h-full hover:shadow-xl transition-all transition-duration-300">
          <template #title>
            <div class="flex align-items-center gap-2">
              <div class="bg-primary-50 text-primary border-round-2xl p-2">
                <i class="pi pi-chart-pie text-xl"></i>
              </div>
              <span class="text-xl font-bold text-900">平台占比</span>
            </div>
          </template>
          <template #content>
            <div class="h-14rem w-full relative flex justify-content-center">
               <BaseChart v-if="hasPlatformData" :option="platformChartOption" height="100%" />
               <div v-else class="h-full flex align-items-center justify-content-center text-500">暂无数据</div>
            </div>
            <div class="flex flex-column gap-2 mt-4">
              <div v-for="(item, index) in stats.byPlatform" :key="item.platform" class="flex align-items-center justify-content-between text-sm">
                <div class="flex align-items-center gap-2">
                  <span class="w-1rem h-1rem border-circle" :style="{ backgroundColor: chartPalette[index % chartPalette.length] }"></span>
                  <span class="text-700 font-medium">{{ item.platform }}</span>
                </div>
                <span class="font-bold text-900">{{ formatCurrency(item.gmv, stats.summary.currency) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="grid">
      <div class="col-12 lg:col-4">
        <Card class="shadow-sm border-round-2xl h-full">
          <template #title><span class="text-lg font-bold text-900">国家表现</span></template>
          <template #content>
            <div v-if="stats.byCountry.length" class="flex flex-column gap-3">
              <div v-for="item in stats.byCountry" :key="item.code">
                <div class="flex justify-content-between mb-1">
                  <span class="text-sm font-medium text-700">{{ item.name || item.code }}</span>
                  <span class="text-sm font-bold text-900">{{ formatCurrency(item.gmv, stats.summary.currency) }}</span>
                </div>
                <ProgressBar :value="getPercentage(item.gmv, stats.summary.totalGMV)" :show-value="false" style="height: 6px" />
              </div>
            </div>
            <div v-else class="text-center text-500 py-4">暂无数据</div>
          </template>
        </Card>
      </div>

      <div class="col-12 lg:col-4">
        <Card class="shadow-sm border-round-2xl h-full">
          <template #title><span class="text-lg font-bold text-900">Top 5 店铺</span></template>
          <template #content>
            <ul v-if="stats.topStores.length" class="list-none p-0 m-0 flex flex-column gap-3">
              <li v-for="(store, index) in stats.topStores" :key="store.name" class="flex align-items-center justify-content-between">
                <div class="flex align-items-center gap-3">
                  <span class="flex align-items-center justify-content-center w-2rem h-2rem border-circle bg-gray-100 text-700 font-bold text-sm">{{ index + 1 }}</span>
                  <div class="flex flex-column">
                    <span class="text-sm font-medium text-900 text-overflow-ellipsis overflow-hidden white-space-nowrap" style="max-width: 120px" :title="store.name">{{ store.name }}</span>
                    <span class="text-xs text-500">GMV</span>
                  </div>
                </div>
                <span class="font-bold text-900">{{ formatCurrency(store.gmv, stats.summary.currency) }}</span>
              </li>
            </ul>
            <div v-else class="text-center text-500 py-4">暂无数据</div>
          </template>
        </Card>
      </div>

      <div class="col-12 lg:col-4">
        <Card class="shadow-sm border-round-2xl h-full">
          <template #title><span class="text-lg font-bold text-900">Top 5 热销 SKU</span></template>
          <template #content>
            <ul v-if="stats.topProducts.length" class="list-none p-0 m-0 flex flex-column gap-3">
              <li v-for="(prod, index) in stats.topProducts" :key="prod.sku" class="flex align-items-center justify-content-between">
                <div class="flex align-items-center gap-3">
                  <span class="flex align-items-center justify-content-center w-2rem h-2rem border-circle bg-green-50 text-green-600 font-bold text-sm">{{ index + 1 }}</span>
                  <div class="flex flex-column">
                    <span class="text-sm font-medium text-900 text-overflow-ellipsis overflow-hidden white-space-nowrap" style="max-width: 120px" :title="prod.sku">{{ prod.sku }}</span>
                    <span class="text-xs text-500">销量</span>
                  </div>
                </div>
                <span class="font-bold text-green-600">{{ prod.volume.toLocaleString() }} 件</span>
              </li>
            </ul>
            <div v-else class="text-center text-500 py-4">暂无数据</div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import SelectButton from 'primevue/selectbutton';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import BaseChart from '@/components/charts/BaseChart.vue';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';

type DateRangeValue = 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';
type DateRangeOption = { label: string; value: DateRangeValue };
type CountryOption = { code: string; name: string };

type SummaryStats = {
  totalGMV: number;
  totalOrders: number;
  aov: number;
  gmvGrowth: number;
  ordersGrowth: number;
  aovGrowth: number;
  currency: string;
  cnyTotalGMV?: number;
};

type TrendPoint = { date: string; gmv: number };
type PlatformStat = { platform: string; gmv: number };
type CountryStat = { code: string; name: string; gmv: number };
type StoreStat = { name: string; gmv: number };
type ProductStat = { sku: string; volume: number };

type SalesStats = {
  summary: SummaryStats;
  trend: TrendPoint[];
  byPlatform: PlatformStat[];
  byCountry: CountryStat[];
  topStores: StoreStat[];
  topProducts: ProductStat[];
};

const EMPTY_STATS: SalesStats = {
  summary: {
    totalGMV: 0,
    totalOrders: 0,
    aov: 0,
    gmvGrowth: 0,
    ordersGrowth: 0,
    aovGrowth: 0,
    currency: 'CNY',
    cnyTotalGMV: 0,
  },
  trend: [],
  byPlatform: [],
  byCountry: [],
  topStores: [],
  topProducts: [],
};

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { label: '昨日', value: 'yesterday' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '上月', value: 'last_month' },
  { label: '自定义', value: 'custom' },
];

const FALLBACK_COUNTRY_CODES = ['ID', 'VN', 'TH', 'MY', 'PH', 'SG'];

const authStore = useAuthStore();
const { role, operatedCountries, supervisedCountries } = storeToRefs(authStore);

const isSnapshotMode = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const currentRange = ref<DateRangeValue>('week');
const customStartDate = ref<Date | null>(new Date());
const customEndDate = ref<Date | null>(new Date());
const selectedCountry = ref<string>('ALL');
const stats = ref<SalesStats>({ ...EMPTY_STATS });

const countryOptions = computed<CountryOption[]>(() => {
  const options: CountryOption[] = [];
  if (role.value === 'admin') {
    options.push({ code: 'ALL', name: '全部国家' });
    const codes = new Set<string>([...supervisedCountries.value, ...FALLBACK_COUNTRY_CODES]);
    codes.forEach((code) => options.push({ code, name: code }));
  } else {
    const codes = new Set<string>(operatedCountries.value || []);
    codes.forEach((code) => options.push({ code, name: code }));
  }
  return options;
});

const dateRangeOptions = DATE_RANGE_OPTIONS;
const todayText = computed(() => new Intl.DateTimeFormat('zh-CN').format(new Date()));

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const primaryColor = computed(() => cssVar('--primary-color', '#4f46e5'));
const successColor = computed(() => cssVar('--green-500', '#22c55e'));
const warnColor = computed(() => cssVar('--yellow-500', '#f59e0b'));
const infoColor = computed(() => cssVar('--blue-500', '#2563eb'));

const chartPalette = computed(() => [
  primaryColor.value,
  successColor.value,
  warnColor.value,
  infoColor.value,
  '#8b5cf6',
]);

const hasTrendData = computed(() => !!stats.value.trend && stats.value.trend.length > 0);
const hasPlatformData = computed(() => !!stats.value.byPlatform && stats.value.byPlatform.length > 0);

// ECharts配置 - 销售趋势折线图
const trendChartOption = computed(() => {
  if (!stats.value.trend.length) return {};
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    xAxis: {
      type: 'category',
      data: stats.value.trend.map((item) => item.date.slice(5)),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatCurrency(value, stats.value.summary.currency).replace(/\.\d+$/, ''),
      },
    },
    series: [
      {
        name: '销售额 (GMV)',
        type: 'line',
        data: stats.value.trend.map((item) => item.gmv),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
            ],
          },
        },
      },
    ],
  };
});

// ECharts配置 - 平台占比饼图
const platformChartOption = computed(() => {
  if (!stats.value.byPlatform.length) return {};
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const value = formatCurrency(params.value, stats.value.summary.currency);
        return `${params.name}: ${value} (${params.percent}%)`;
      },
    },
    series: [
      {
        name: '平台销售额',
        type: 'pie',
        radius: ['50%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        data: stats.value.byPlatform.map((p, index) => ({
          name: p.platform,
          value: p.gmv,
          itemStyle: {
            color: chartPalette.value[index % chartPalette.value.length],
          },
        })),
      },
    ],
  };
});


const toggleSnapshotMode = () => {
  isSnapshotMode.value = !isSnapshotMode.value;
};

const getPercentage = (val: number, total: number) => {
  if (!total) return 0;
  return Math.round((val / total) * 100);
};

const formatCurrency = (val: number, currency = 'CNY') => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(val) ? val : 0);
};

const formatGrowth = (val: number | null | undefined) => {
  if (val === undefined || val === null) return '0%';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
};

const growthSeverity = (val: number | null | undefined) => {
  if (!val) return 'secondary';
  if (val > 0) return 'success';
  if (val < 0) return 'danger';
  return 'secondary';
};

const fetchStats = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  const range = resolveRange();
  if (!range) {
    isLoading.value = false;
    errorMessage.value = '请选择有效的时间范围';
    return;
  }

  try {
    const response = await apiClient.get<SalesStats>('/sales-data/stats', {
      params: {
        startDate: range.startDate,
        endDate: range.endDate,
        countryCode: selectedCountry.value,
      },
    });
    stats.value = normalizeStats(response.data);
  } catch (error) {
    console.error('Failed to fetch stats', error);
    errorMessage.value = '无法加载销售统计，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
};

watch(
  countryOptions,
  (options) => {
    if (!options.length) return;
    const current = options.some((opt) => opt.code === selectedCountry.value)
      ? selectedCountry.value
      : options[0].code;
    selectedCountry.value = current;
  },
  { immediate: true },
);

watch(currentRange, (range) => {
  if (range !== 'custom') {
    fetchStats();
  }
});

watch(
  () => [customStartDate.value, customEndDate.value],
  () => {
    if (currentRange.value === 'custom' && customStartDate.value && customEndDate.value) {
      fetchStats();
    }
  },
);

watch(
  selectedCountry,
  () => {
    fetchStats();
  },
  { immediate: true },
);

const resolveRange = () => {
  const end = new Date();
  const start = new Date();

  switch (currentRange.value) {
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;
    case 'week': {
      const day = start.getDay() || 7;
      if (day !== 1) start.setDate(start.getDate() - (day - 1));
      break;
    }
    case 'month':
      start.setDate(1);
      break;
    case 'last_month':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      break;
    case 'custom':
      if (!customStartDate.value || !customEndDate.value) return null;
      if (customStartDate.value > customEndDate.value) {
        errorMessage.value = '自定义开始日期不能晚于结束日期';
        return null;
      }
      return {
        startDate: formatDate(customStartDate.value),
        endDate: formatDate(customEndDate.value),
      };
    default:
      break;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};

const normalizeStats = (payload: Partial<SalesStats>): SalesStats => ({
  summary: {
    totalGMV: payload.summary?.totalGMV ?? 0,
    totalOrders: payload.summary?.totalOrders ?? 0,
    aov: payload.summary?.aov ?? 0,
    gmvGrowth: payload.summary?.gmvGrowth ?? 0,
    ordersGrowth: payload.summary?.ordersGrowth ?? 0,
    aovGrowth: payload.summary?.aovGrowth ?? 0,
    currency: payload.summary?.currency || 'CNY',
    cnyTotalGMV: payload.summary?.cnyTotalGMV ?? 0,
  },
  trend: payload.trend ?? [],
  byPlatform: payload.byPlatform ?? [],
  byCountry: payload.byCountry ?? [],
  topStores: payload.topStores ?? [],
  topProducts: payload.topProducts ?? [],
});

const withAlpha = (hex: string, alpha: number) => {
  const normalizedHex = hex.replace('#', '');
  const expanded = normalizedHex.length === 3 ? normalizedHex.split('').map((c) => c + c).join('') : normalizedHex;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatDate = (date: Date) => {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned.toISOString().slice(0, 10);
};
</script>

<style scoped>
.sales-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.snapshot-mode {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: var(--surface-ground);
  overflow: auto;
  padding: 2rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .header {
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

.title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: var(--text-color-secondary);
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-start;
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-separator {
  color: var(--text-color-secondary);
}

.snapshot-banner {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.snapshot-title {
  margin: 0.2rem 0 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.snapshot-date {
  margin: 0.2rem 0 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--primary-color);
}

.snapshot-toggle {
  min-width: 8rem;
}

.metric-card {
  min-height: 160px;
}

.metric-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.metric-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.currency {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.muted {
  margin: 0;
  color: var(--text-color-secondary);
}

.chart-wrap {
  min-height: 16rem;
}

.chart-wrap.small {
  min-height: 12rem;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.platform-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
}

.platform-name {
  font-weight: 600;
  color: var(--text-color);
}

.platform-value {
  font-weight: 600;
  color: var(--primary-color);
  text-align: right;
}

.dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  display: inline-block;
}

.country-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.country-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.country-name {
  font-weight: 600;
  color: var(--text-color);
}

.country-value {
  font-weight: 600;
  color: var(--primary-color);
}

.progress {
  height: 0.6rem;
  border-radius: 9999px;
}

.top-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--surface-section);
  border: 1px solid var(--surface-border);
}

.rank {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  font-weight: 700;
  color: var(--text-color-secondary);
}

.rank.success {
  background: rgba(34, 197, 94, 0.08);
  color: var(--green-600, #16a34a);
  border-color: rgba(34, 197, 94, 0.2);
}

.top-list-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.name {
  margin: 0;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value {
  font-weight: 700;
  color: var(--primary-color);
}

.value.success {
  color: var(--green-600, #16a34a);
}
</style>
