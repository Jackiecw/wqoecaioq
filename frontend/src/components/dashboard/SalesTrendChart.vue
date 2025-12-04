<template>
  <Card class="shadow-sm border-round-2xl h-full w-full">
    <template #title>
      <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 px-1">
        <div>
          <h3 class="text-lg font-bold text-900 m-0">销售趋势</h3>
          <p class="text-xs text-500 mt-1 mb-0">GMV 与订单量走势分析</p>
        </div>
        <div class="flex gap-2">
          <Button
            v-for="range in timeRanges"
            :key="range.value"
            :label="range.label"
            :severity="selectedRange === range.value ? 'primary' : 'secondary'"
            :outlined="selectedRange !== range.value"
            size="small"
            @click="selectedRange = range.value"
          />
        </div>
      </div>
    </template>
    <template #content>
      <div class="pt-2">
        <BaseChart 
          :option="chartOption" 
          height="380px"
          :loading="isLoading"
        />
        <div v-if="!isLoading" class="flex justify-content-center gap-4 mt-3 text-sm">
          <div class="flex align-items-center gap-2">
            <div class="w-3rem h-0" style="border-top: 3px solid #8b5cf6"></div>
            <span class="text-600">GMV (¥)</span>
          </div>
          <div class="flex align-items-center gap-2">
            <div class="w-3rem h-0" style="border-top: 3px dashed #3b82f6"></div>
            <span class="text-600">订单量</span>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import BaseChart from '@/components/charts/BaseChart.vue';

type TimeRange = '7d' | '14d' | '30d';

const props = defineProps<{
  countryCode?: string | null;
  storeId?: string | null;
}>();

const isLoading = ref(false);
const selectedRange = ref<TimeRange>('7d');

const timeRanges = [
  { label: '7天', value: '7d' as TimeRange },
  { label: '14天', value: '14d' as TimeRange },
  { label: '30天', value: '30d' as TimeRange },
];

// Mock数据生成函数
const generateMockData = (days: number) => {
  const dates: string[] = [];
  const gmv: number[] = [];
  const orders: number[] = [];
  
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
    
    // 生成模拟数据（带一些随机波动）
    const baseGmv = 15000 + Math.random() * 10000;
    const baseOrders = 50 + Math.random() * 50;
    gmv.push(Math.round(baseGmv));
    orders.push(Math.round(baseOrders));
  }
  
  return { dates, gmv, orders };
};

const chartOption = computed(() => {
  const days = selectedRange.value === '7d' ? 7 : selectedRange.value === '14d' ? 14 : 30;
  const data = generateMockData(days);
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: any) => {
        const date = params[0].axisValue;
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${date}</div>`;
        params.forEach((param: any) => {
          const value = param.seriesName === 'GMV' 
            ? `¥${param.value.toLocaleString()}` 
            : `${param.value} 单`;
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
              <span style="flex: 1;">${param.seriesName}</span>
              <span style="font-weight: 600;">${value}</span>
            </div>
          `;
        });
        return result;
      },
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisTick: {
        alignWithLabel: true,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: 'GMV (¥)',
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#8b5cf6',
          },
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: '订单量',
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3b82f6',
          },
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: 'GMV',
        type: 'line',
        yAxisIndex: 0,
        data: data.gmv,
        smooth: true,
        lineStyle: {
          color: '#8b5cf6',
          width: 3,
        },
        itemStyle: {
          color: '#8b5cf6',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(139, 92, 246, 0.3)',
              },
              {
                offset: 1,
                color: 'rgba(139, 92, 246, 0.05)',
              },
            ],
          },
        },
        emphasis: {
          focus: 'series',
        },
      },
      {
        name: '订单量',
        type: 'line',
        yAxisIndex: 1,
        data: data.orders,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
          type: 'dashed',
        },
        itemStyle: {
          color: '#3b82f6',
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
  };
});

// 监听筛选条件变化（为后续API集成预留）
watch(
  () => [props.countryCode, props.storeId, selectedRange.value],
  () => {
    // TODO: 后端API开发后，在这里调用真实数据接口
    // fetchSalesTrend(props.countryCode, props.storeId, selectedRange.value);
    console.log('筛选条件变化:', {
      countryCode: props.countryCode,
      storeId: props.storeId,
      range: selectedRange.value,
    });
  }
);
</script>

<style scoped>
/* 确保图表容器高度正确 */
:deep(.echarts-container) {
  min-height: 360px;
}
</style>
