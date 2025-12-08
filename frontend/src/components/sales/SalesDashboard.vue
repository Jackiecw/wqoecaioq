<template>
  <div class="sales-dashboard page-shell">
    <PageHeader
      title="销售数据看板"
      subtitle="实时监控关键业务指标与趋势"
    >
      <template #actions>
        <span class="refresh-badge"><i class="pi pi-sync"></i> {{ lastRefreshText }}</span>
        <Button
          :icon="isSnapshotMode ? 'pi pi-eye-slash' : 'pi pi-camera'"
          :severity="isSnapshotMode ? 'danger' : 'secondary'"
          text
          rounded
          size="small"
          @click="toggleSnapshotMode"
        />
      </template>
    </PageHeader>

    <FilterBar>
      <template #start>
        <Dropdown
          v-model="selectedCountry"
          :options="countryOptions"
          option-label="name"
          option-value="code"
          placeholder="国家"
          :filter="countryOptions.length > 6"
          class="filter-dropdown"
        />
        <div class="pill-tab-group">
          <button
            v-for="opt in dateRangeOptions"
            :key="opt.value"
            class="pill-tab"
            :class="{ 'is-active': currentRange === opt.value }"
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
      </template>
      <template #end>
        <div class="pill-tab-group">
          <button
            v-for="opt in compareModeOptions"
            :key="opt.value"
            class="pill-tab"
            :class="{ 'is-active': compareMode === opt.value }"
            @click="compareMode = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </template>
    </FilterBar>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <div class="kpi-grid">
      <ContentCard
        v-for="card in kpiCards"
        :key="card.key"
        class="kpi-card"
      >
        <div class="kpi-left-bar" :style="{ backgroundColor: card.accent }"></div>
        <div v-if="isLoading" class="kpi-loading">
          <SkeletonBlock width="44px" height="44px" />
          <SkeletonBlock width="60%" height="20px" />
          <SkeletonBlock width="40%" height="14px" />
        </div>
        <template v-else-if="card.hasData">
          <div class="kpi-header">
            <div class="kpi-icon" :style="{ color: card.accent, backgroundColor: card.bg }">
              <i :class="card.icon"></i>
            </div>
            <span class="kpi-label">{{ card.label }}</span>
          </div>
          <div class="kpi-value">
            <span class="kpi-number">{{ card.value }}</span>
            <span class="kpi-currency">{{ card.suffix }}</span>
          </div>
          <div class="kpi-footer">
            <Tag :value="card.growthText" :severity="card.growthSeverity" rounded />
            <span class="kpi-compare">{{ compareMode === 'wow' ? '环比' : '同比' }}</span>
          </div>
        </template>
        <EmptyState v-else icon="pi pi-inbox" title="暂无数据" />
      </ContentCard>
    </div>

    <div class="charts-grid">
      <ContentCard class="chart-card">
        <div class="chart-header">
          <div class="chart-title">
            <div class="chart-icon chart-icon--blue">
              <i class="pi pi-chart-line"></i>
            </div>
            <span>销售趋势</span>
          </div>
        </div>
        <div class="chart-body">
          <SkeletonBlock v-if="isLoading" class="w-full h-full" />
          <BaseChart v-else-if="hasTrendData" :option="trendChartOption" height="100%" />
          <EmptyState v-else icon="pi pi-chart-line" title="暂无趋势数据" description="选择其他时间范围再试试" />
        </div>
      </ContentCard>

      <ContentCard class="chart-card">
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
          <EmptyState v-else class="pt-4" icon="pi pi-chart-pie" title="暂无数据" />
        </div>
        <div v-if="hasPlatformData" class="platform-legend">
          <div v-for="(item, index) in stats.byPlatform" :key="item.platform" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: chartPalette[index % chartPalette.length] }"></span>
            <span class="legend-name">{{ item.platform }}</span>
            <span class="legend-value">{{ formatCurrency(item.gmv, stats.summary.currency) }}</span>
          </div>
        </div>
      </ContentCard>
    </div>

    <div class="bottom-grid">
      <ContentCard class="list-card">
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
          <EmptyState v-else icon="pi pi-globe" title="暂无数据" />
        </div>
      </ContentCard>

      <ContentCard class="list-card">
        <div class="list-header">
          <div class="list-icon list-icon--purple">
            <i class="pi pi-shop"></i>
          </div>
          <span>Top 5 店铺</span>
        </div>
        <div class="list-body">
          <template v-if="stats.topStores.length">
            <div v-for="(store, index) in stats.topStores" :key="store.name" class="rank-item">
              <div class="rank-badge" :class="rankClass(index)">
                {{ index + 1 }}
              </div>
              <div class="rank-info">
                <span class="rank-name" :title="store.name">{{ store.name }}</span>
                <span class="rank-label">GMV</span>
              </div>
              <span class="rank-value">{{ formatCurrency(store.gmv, stats.summary.currency) }}</span>
            </div>
          </template>
          <EmptyState v-else icon="pi pi-shop" title="暂无数据" />
        </div>
      </ContentCard>

      <ContentCard class="list-card">
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
          <EmptyState v-else icon="pi pi-box" title="暂无数据" />
        </div>
      </ContentCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import BaseChart from '@/components/charts/BaseChart.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import SkeletonBlock from '@/components/common/SkeletonBlock.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import ContentCard from '@/components/common/ContentCard.vue';
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

const kpiCards = computed(() => {
  const s = stats.value.summary;
  return [
    {
      key: 'gmv',
      label: '总销售额 (GMV)',
      icon: 'pi pi-chart-line',
      accent: '#2563eb',
      bg: 'rgba(37,99,235,0.1)',
      value: formatNumber(s.totalGMV),
      suffix: s.currency,
      growthText: formatGrowth(s.gmvGrowth),
      growthSeverity: growthSeverity(s.gmvGrowth),
      hasData: s.totalGMV > 0,
    },
    {
      key: 'orders',
      label: '总订单量',
      icon: 'pi pi-shopping-cart',
      accent: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      value: s.totalOrders.toLocaleString(),
      suffix: '单',
      growthText: formatGrowth(s.ordersGrowth),
      growthSeverity: growthSeverity(s.ordersGrowth),
      hasData: s.totalOrders > 0,
    },
    {
      key: 'aov',
      label: '平均客单价 (AOV)',
      icon: 'pi pi-dollar',
      accent: '#14b8a6',
      bg: 'rgba(20,184,166,0.1)',
      value: formatNumber(s.aov),
      suffix: s.currency,
      growthText: formatGrowth(s.aovGrowth),
      growthSeverity: growthSeverity(s.aovGrowth),
      hasData: s.aov > 0,
    },
  ];
});

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
  // console.log('Fetching stats...', { range: currentRange.value, country: selectedCountry.value });
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
    // console.log('Stats fetched successfully', response.data);
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

const rankClass = (index: number) => ({
  'rank-badge--gold': index === 0,
  'rank-badge--silver': index === 1,
  'rank-badge--bronze': index === 2,
});
</script>

<style scoped>
.sales-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-bg-page);
}

.refresh-badge {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-bg-page);
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
}

.filter-dropdown :deep(.p-select),
.filter-dropdown :deep(.p-dropdown) {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.filter-dropdown :deep(.p-select-label),
.filter-dropdown :deep(.p-dropdown-label) {
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.filter-custom {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
.filter-calendar {
  width: 110px;
}
.filter-calendar :deep(.p-inputtext) {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  font-size: 0.85rem;
  padding: 0.375rem 0.5rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
.kpi-card {
  position: relative;
  padding: 1.25rem;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.kpi-left-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}
.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.kpi-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-label { font-size: 0.85rem; color: var(--color-text-secondary); }
.kpi-value { display: flex; align-items: baseline; gap: 0.35rem; }
.kpi-number { font-size: 2rem; font-weight: 700; color: var(--color-text-primary); }
.kpi-currency { font-size: 0.9rem; color: var(--color-text-secondary); }
.kpi-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-start;
}
.kpi-compare { font-size: 0.75rem; color: var(--color-text-muted); }
.kpi-loading { display: flex; flex-direction: column; gap: 0.5rem; }

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
}
.chart-card { padding: 1.25rem; }
.chart-header { margin-bottom: 0.75rem; }
.chart-title { display: flex; align-items: center; gap: 0.75rem; }
.chart-icon {
  width: 2.5rem; height: 2.5rem;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.chart-icon--blue { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.chart-icon--purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
.chart-body { height: 280px; padding-top: 0.5rem; }
.chart-body--pie { height: 200px; display: flex; justify-content: center; }
.platform-legend {
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-name { flex: 1; color: var(--color-text-secondary); font-weight: 500; }
.legend-value { font-weight: 700; color: var(--color-text-primary); }

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
.list-card { padding: 1.25rem; }
.list-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.list-icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}
.list-icon--blue { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.list-icon--purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
.list-icon--green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.list-header span { font-weight: 700; color: var(--color-text-primary); }
.list-body { display: flex; flex-direction: column; gap: 0.75rem; }

.country-item { display: flex; flex-direction: column; gap: 0.35rem; }
.country-info { display: flex; justify-content: space-between; align-items: center; }
.country-name { font-weight: 600; color: var(--color-text-secondary); }
.country-value { font-weight: 700; color: var(--color-text-primary); }
.country-bar { height: 6px; }
.country-bar :deep(.p-progressbar-value) { background: linear-gradient(90deg, #3b82f6, #60a5fa); }

.rank-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-page);
}
.rank-badge {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
}
.rank-badge--gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
.rank-badge--silver { background: linear-gradient(135deg, #d1d5db, #9ca3af); color: white; }
.rank-badge--bronze { background: linear-gradient(135deg, #d97706, #b45309); color: white; }
.rank-badge--green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { display: block; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-label { font-size: 0.75rem; color: var(--color-text-muted); }
.rank-value { font-weight: 700; color: var(--color-text-primary); }
.rank-value--green { color: #10b981; }

@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
  .content-grid { grid-template-columns: 1fr; }
}
</style>
