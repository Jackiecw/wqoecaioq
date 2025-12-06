<template>
  <div class="sales-dashboard">
    <!-- 页面头部 (Clean White Theme) -->
    <header class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1 class="page-title">销售数据看板</h1>
          <p class="page-subtitle">实时监控关键业务指标与趋势</p>
        </div>
        <div class="header-actions">
          <span class="refresh-badge"><i class="pi pi-sync"></i> {{ lastRefreshText }}</span>
          <Button
            :icon="isSnapshotMode ? 'pi pi-eye-slash' : 'pi pi-camera'"
            :severity="isSnapshotMode ? 'danger' : 'secondary'"
            text
            rounded
            size="small"
            @click="toggleSnapshotMode"
          />
        </div>
      </div>
      <div class="filter-bar">
        <Dropdown
          v-model="selectedCountry"
          :options="countryOptions"
          option-label="name"
          option-value="code"
          placeholder="国家"
          :filter="countryOptions.length > 6"
          class="filter-dropdown"
        />
        <div class="filter-tabs">
          <button
            v-for="opt in dateRangeOptions"
            :key="opt.value"
            class="filter-tab"
            :class="{ 'filter-tab--active': currentRange === opt.value }"
            @click="currentRange = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <div v-if="currentRange === 'custom'" class="filter-custom">
          <Calendar v-model="customStartDate" show-icon dateFormat="yy-mm-dd" placeholder="开始" class="filter-calendar" />
          <span>→</span>
          <Calendar v-model="customEndDate" show-icon dateFormat="yy-mm-dd" placeholder="结束" class="filter-calendar" />
          <Button icon="pi pi-check" size="small" text @click="fetchStats" />
        </div>
        <div class="filter-spacer"></div>
        <div class="filter-compare">
          <span>对比:</span>
          <button
            v-for="opt in compareModeOptions"
            :key="opt.value"
            class="compare-btn"
            :class="{ 'compare-btn--active': compareMode === opt.value }"
            @click="compareMode = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- Snapshot Banner -->
    <div v-if="isSnapshotMode" class="snapshot-banner">
      <div>
        <span class="snapshot-badge">Snapshot Mode</span>
        <h3>销售周报截屏视图</h3>
      </div>
      <div class="snapshot-date">
        <span>报告日期</span>
        <strong>{{ todayText }}</strong>
      </div>
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <!-- GMV Card -->
      <div class="kpi-card kpi-card--gmv" :class="{ 'kpi-card--loading': isLoading }">
        <template v-if="isLoading">
          <div class="skeleton skeleton--icon"></div>
          <div class="skeleton skeleton--text-lg"></div>
          <div class="skeleton skeleton--text-sm"></div>
        </template>
        <template v-else-if="stats.summary.totalGMV > 0">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <span>总销售额 (GMV)</span>
          </div>
          <div class="kpi-value">
            <span class="kpi-number">{{ formatNumber(stats.summary.totalGMV) }}</span>
            <span class="kpi-currency">{{ stats.summary.currency }}</span>
          </div>
          <div class="kpi-footer">
            <Tag :value="formatGrowth(stats.summary.gmvGrowth)" :severity="growthSeverity(stats.summary.gmvGrowth)" rounded />
            <span class="kpi-compare">{{ compareMode === 'wow' ? '环比' : '同比' }}</span>
          </div>
        </template>
        <template v-else>
          <div class="kpi-empty">
            <i class="pi pi-inbox"></i>
            <span>暂无数据</span>
          </div>
        </template>
      </div>

      <!-- Orders Card -->
      <div class="kpi-card kpi-card--orders" :class="{ 'kpi-card--loading': isLoading }">
        <template v-if="isLoading">
          <div class="skeleton skeleton--icon"></div>
          <div class="skeleton skeleton--text-lg"></div>
          <div class="skeleton skeleton--text-sm"></div>
        </template>
        <template v-else-if="stats.summary.totalOrders > 0">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="pi pi-shopping-cart"></i>
            </div>
            <span>总订单量</span>
          </div>
          <div class="kpi-value">
            <span class="kpi-number">{{ stats.summary.totalOrders.toLocaleString() }}</span>
            <span class="kpi-currency">单</span>
          </div>
          <div class="kpi-footer">
            <Tag :value="formatGrowth(stats.summary.ordersGrowth)" :severity="growthSeverity(stats.summary.ordersGrowth)" rounded />
            <span class="kpi-compare">{{ compareMode === 'wow' ? '环比' : '同比' }}</span>
          </div>
        </template>
        <template v-else>
          <div class="kpi-empty">
            <i class="pi pi-inbox"></i>
            <span>暂无数据</span>
          </div>
        </template>
      </div>

      <!-- AOV Card -->
      <div class="kpi-card kpi-card--aov" :class="{ 'kpi-card--loading': isLoading }">
        <template v-if="isLoading">
          <div class="skeleton skeleton--icon"></div>
          <div class="skeleton skeleton--text-lg"></div>
          <div class="skeleton skeleton--text-sm"></div>
        </template>
        <template v-else-if="stats.summary.aov > 0">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="pi pi-dollar"></i>
            </div>
            <span>平均客单价 (AOV)</span>
          </div>
          <div class="kpi-value">
            <span class="kpi-number">{{ formatNumber(stats.summary.aov) }}</span>
            <span class="kpi-currency">{{ stats.summary.currency }}</span>
          </div>
          <div class="kpi-footer">
            <Tag :value="formatGrowth(stats.summary.aovGrowth)" :severity="growthSeverity(stats.summary.aovGrowth)" rounded />
            <span class="kpi-compare">{{ compareMode === 'wow' ? '环比' : '同比' }}</span>
          </div>
        </template>
        <template v-else>
          <div class="kpi-empty">
            <i class="pi pi-inbox"></i>
            <span>暂无数据</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-grid">
      <!-- Trend Chart -->
      <div class="chart-card chart-card--main">
        <div class="chart-header">
          <div class="chart-title">
            <div class="chart-icon chart-icon--blue">
              <i class="pi pi-chart-line"></i>
            </div>
            <span>销售趋势</span>
          </div>
        </div>
        <div class="chart-body">
          <template v-if="isLoading">
            <div class="skeleton-chart">
              <div class="skeleton skeleton--bar" style="height: 60%"></div>
              <div class="skeleton skeleton--bar" style="height: 80%"></div>
              <div class="skeleton skeleton--bar" style="height: 45%"></div>
              <div class="skeleton skeleton--bar" style="height: 90%"></div>
              <div class="skeleton skeleton--bar" style="height: 55%"></div>
              <div class="skeleton skeleton--bar" style="height: 70%"></div>
              <div class="skeleton skeleton--bar" style="height: 85%"></div>
            </div>
          </template>
          <BaseChart v-else-if="hasTrendData" :option="trendChartOption" height="100%" />
          <div v-else class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <p>暂无趋势数据</p>
          </div>
        </div>
      </div>

      <!-- Platform Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">
            <div class="chart-icon chart-icon--purple">
              <i class="pi pi-chart-pie"></i>
            </div>
            <span>平台占比</span>
          </div>
        </div>
        <div class="chart-body chart-body--pie">
          <BaseChart v-if="hasPlatformData" :option="platformChartOption" height="160px" />
          <div v-else class="empty-state empty-state--sm">
            <i class="pi pi-chart-pie"></i>
            <span>暂无数据</span>
          </div>
        </div>
        <div v-if="hasPlatformData" class="platform-legend">
          <div v-for="(item, index) in stats.byPlatform" :key="item.platform" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: chartPalette[index % chartPalette.length] }"></span>
            <span class="legend-name">{{ item.platform }}</span>
            <span class="legend-value">{{ formatCurrency(item.gmv, stats.summary.currency) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-grid">
      <!-- Country Performance -->
      <div class="list-card">
        <div class="list-header">
          <div class="list-icon list-icon--blue">
            <i class="pi pi-globe"></i>
          </div>
          <span>国家表现</span>
        </div>
        <div class="list-body">
          <template v-if="stats.byCountry.length">
            <div v-for="item in stats.byCountry" :key="item.code" class="country-item">
              <div class="country-info">
                <span class="country-name">{{ item.name || item.code }}</span>
                <span class="country-value">{{ formatCurrency(item.gmv, stats.summary.currency) }}</span>
              </div>
              <ProgressBar :value="getPercentage(item.gmv, stats.summary.totalGMV)" :show-value="false" class="country-bar" />
            </div>
          </template>
          <div v-else class="empty-state empty-state--sm">
            <i class="pi pi-globe"></i>
            <span>暂无数据</span>
          </div>
        </div>
      </div>

      <!-- Top Stores -->
      <div class="list-card">
        <div class="list-header">
          <div class="list-icon list-icon--purple">
            <i class="pi pi-shop"></i>
          </div>
          <span>Top 5 店铺</span>
        </div>
        <div class="list-body">
          <template v-if="stats.topStores.length">
            <div v-for="(store, index) in stats.topStores" :key="store.name" class="rank-item">
              <div class="rank-badge" :class="{ 'rank-badge--gold': index === 0, 'rank-badge--silver': index === 1, 'rank-badge--bronze': index === 2 }">
                {{ index + 1 }}
              </div>
              <div class="rank-info">
                <span class="rank-name" :title="store.name">{{ store.name }}</span>
                <span class="rank-label">GMV</span>
              </div>
              <span class="rank-value">{{ formatCurrency(store.gmv, stats.summary.currency) }}</span>
            </div>
          </template>
          <div v-else class="empty-state empty-state--sm">
            <i class="pi pi-shop"></i>
            <span>暂无数据</span>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="list-card">
        <div class="list-header">
          <div class="list-icon list-icon--green">
            <i class="pi pi-box"></i>
          </div>
          <span>Top 5 热销 SKU</span>
        </div>
        <div class="list-body">
          <template v-if="stats.topProducts.length">
            <div v-for="(prod, index) in stats.topProducts" :key="prod.sku" class="rank-item">
              <div class="rank-badge rank-badge--green" :class="{ 'rank-badge--gold': index === 0 }">
                {{ index + 1 }}
              </div>
              <div class="rank-info">
                <span class="rank-name" :title="prod.sku">{{ prod.sku }}</span>
                <span class="rank-label">销量</span>
              </div>
              <span class="rank-value rank-value--green">{{ prod.volume.toLocaleString() }} 件</span>
            </div>
          </template>
          <div v-else class="empty-state empty-state--sm">
            <i class="pi pi-box"></i>
            <span>暂无数据</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
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
type CompareMode = 'wow' | 'yoy';

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

const DATE_RANGE_OPTIONS = [
  { label: '昨日', value: 'yesterday' as DateRangeValue },
  { label: '本周', value: 'week' as DateRangeValue },
  { label: '本月', value: 'month' as DateRangeValue },
  { label: '上月', value: 'last_month' as DateRangeValue },
  { label: '自定义', value: 'custom' as DateRangeValue },
];

const COMPARE_MODE_OPTIONS = [
  { label: '环比', value: 'wow' as CompareMode },
  { label: '同比', value: 'yoy' as CompareMode },
];

const FALLBACK_COUNTRY_CODES = ['ID', 'VN', 'TH', 'MY', 'PH', 'SG'];

const authStore = useAuthStore();
const { role, operatedCountries, supervisedCountries } = storeToRefs(authStore);

const isSnapshotMode = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const currentRange = ref<DateRangeValue>('week');
const compareMode = ref<CompareMode>('wow');
const customStartDate = ref<Date | null>(new Date());
const customEndDate = ref<Date | null>(new Date());
const selectedCountry = ref<string>('ALL');
const stats = ref<SalesStats>({ ...EMPTY_STATS });
const lastRefreshTime = ref<Date | null>(null);

const countryOptions = computed(() => {
  const options: { code: string; name: string }[] = [];
  if (role.value === 'admin') {
    options.push({ code: 'ALL', name: '全部国家' });
    const codes = new Set([...supervisedCountries.value, ...FALLBACK_COUNTRY_CODES]);
    codes.forEach((code) => options.push({ code, name: code }));
  } else {
    const codes = new Set(operatedCountries.value || []);
    codes.forEach((code) => options.push({ code, name: code }));
  }
  return options;
});

const dateRangeOptions = DATE_RANGE_OPTIONS;
const compareModeOptions = COMPARE_MODE_OPTIONS;
const todayText = computed(() => new Intl.DateTimeFormat('zh-CN').format(new Date()));

const lastRefreshText = computed(() => {
  if (!lastRefreshTime.value) return '尚未刷新';
  const now = new Date();
  const diff = Math.floor((now.getTime() - lastRefreshTime.value.getTime()) / 1000);
  if (diff < 60) return '刚刚更新';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前更新`;
  return lastRefreshTime.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + ' 更新';
});

const chartPalette = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

const hasTrendData = computed(() => stats.value.trend && stats.value.trend.length > 0);
const hasPlatformData = computed(() => stats.value.byPlatform && stats.value.byPlatform.length > 0);

const trendChartOption = computed(() => {
  if (!stats.value.trend.length) return {};
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151' },
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: stats.value.trend.map((item) => item.date.slice(5)),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => formatNumber(value),
      },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        data: stats.value.trend.map((item) => item.gmv),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
            ],
          },
        },
      },
    ],
  };
});

const platformChartOption = computed(() => {
  if (!stats.value.byPlatform.length) return {};
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${formatCurrency(params.value, stats.value.summary.currency)} (${params.percent}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '85%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: stats.value.byPlatform.map((p, index) => ({
          name: p.platform,
          value: p.gmv,
          itemStyle: { color: chartPalette[index % chartPalette.length] },
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

const formatNumber = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
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
        compareMode: compareMode.value,
      },
    });
    stats.value = normalizeStats(response.data);
    lastRefreshTime.value = new Date();
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

watch(compareMode, () => {
  fetchStats();
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
  gap: 1rem;
  background: var(--color-bg-page);
}

/* ========================================
   页面头部 (Clean White Theme)
   ======================================== */
.page-header {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-badge {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-bg-page);
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
}

.refresh-badge i {
  font-size: 0.625rem;
}

/* ========================================
   筛选栏
   ======================================== */
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.filter-dropdown {
  min-width: 100px;
}

.filter-dropdown :deep(.p-select),
.filter-dropdown :deep(.p-dropdown) {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.filter-dropdown :deep(.p-select-label),
.filter-dropdown :deep(.p-dropdown-label) {
  font-size: 0.75rem;
  color: var(--color-text-primary);
}

.filter-tabs {
  display: flex;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.1875rem;
}

.filter-tab {
  padding: 0.375rem 0.625rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  color: var(--color-text-primary);
}

.filter-tab--active {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-xs);
}

.filter-custom {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.filter-calendar {
  width: 100px;
}

.filter-calendar :deep(.p-inputtext) {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  font-size: 0.7rem;
  padding: 0.375rem 0.5rem;
}

.filter-spacer {
  flex: 1;
}

.filter-compare {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.filter-compare > span {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.compare-btn {
  padding: 0.3rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.compare-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.compare-btn--active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

/* ========================================
   Snapshot Banner
   ======================================== */
.snapshot-banner {
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.snapshot-badge {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-accent);
}

.snapshot-banner h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0.25rem 0 0;
  color: var(--color-text-primary);
}

.snapshot-date {
  text-align: right;
}

.snapshot-date span {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  display: block;
}

.snapshot-date strong {
  font-size: 1.25rem;
  color: var(--color-accent);
}

/* ========================================
   KPI Grid
   ======================================== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* KPI Card - Clean White Theme */
.kpi-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.kpi-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
}

/* KPI Card Variants - Left Border Colors */
.kpi-card--gmv::before {
  background: var(--color-accent);
}

.kpi-card--orders::before {
  background: #8b5cf6;
}

.kpi-card--aov::before {
  background: #14b8a6;
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.kpi-icon {
  width: 2.25rem;
  height: 2.25rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: var(--color-accent);
}

.kpi-card--orders .kpi-icon {
  background: #f3e8ff;
  color: #8b5cf6;
}

.kpi-card--aov .kpi-icon {
  background: #ccfbf1;
  color: #14b8a6;
}

.kpi-header span {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.kpi-value {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.kpi-number {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.kpi-currency {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.kpi-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.kpi-compare {
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.kpi-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.6;
  gap: 0.5rem;
}

.kpi-empty i {
  font-size: 2rem;
}

/* Skeleton */
.skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 0.5rem;
}

.skeleton--icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
}

.skeleton--text-lg {
  height: 2.5rem;
  width: 60%;
  margin-top: 1rem;
}

.skeleton--text-sm {
  height: 1.5rem;
  width: 40%;
  margin-top: 0.5rem;
}

.skeleton--bar {
  width: 12%;
  border-radius: 0.25rem 0.25rem 0 0;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.chart-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.chart-header {
  padding: 1.25rem 1.5rem 0;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chart-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.chart-icon--blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.chart-icon--purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.chart-title span {
  font-size: 1rem;
  font-weight: 700;
  color: var(--surface-900);
}

.chart-body {
  padding: 1rem 1.5rem 1.5rem;
  height: 280px;
}

.chart-body--pie {
  height: 180px;
  display: flex;
  justify-content: center;
}

.skeleton-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  padding: 1rem;
}

.skeleton-chart .skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
}

.platform-legend {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.legend-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
}

.legend-name {
  flex: 1;
  color: var(--surface-700);
  font-weight: 500;
}

.legend-value {
  font-weight: 600;
  color: var(--surface-900);
}

/* Bottom Grid */
.bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.list-card {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-100);
}

.list-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.list-icon--blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.list-icon--purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.list-icon--green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.list-header span {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--surface-900);
}

.list-body {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* Country Item */
.country-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.country-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.country-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--surface-700);
}

.country-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--surface-900);
}

.country-bar {
  height: 6px;
}

.country-bar :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

/* Rank Item */
.rank-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: var(--surface-50);
  border-radius: 0.75rem;
  transition: background 0.15s ease;
}

.rank-item:hover {
  background: var(--surface-100);
}

.rank-badge {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--surface-200);
  color: var(--surface-600);
}

.rank-badge--gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.rank-badge--silver {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  color: white;
}

.rank-badge--bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}

.rank-badge--green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--surface-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-label {
  font-size: 0.65rem;
  color: var(--surface-500);
}

.rank-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--surface-900);
}

.rank-value--green {
  color: #10b981;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--surface-400);
  gap: 0.75rem;
}

.empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon i {
  font-size: 1.25rem;
  color: white;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-state--sm {
  flex-direction: row;
  gap: 0.5rem;
  padding: 2rem;
}

.empty-state--sm i {
  font-size: 1rem;
}

.empty-state--sm span {
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
