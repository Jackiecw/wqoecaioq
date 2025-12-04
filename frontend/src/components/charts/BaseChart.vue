<template>
  <div ref="chartContainer" :style="{ width: '100%', height: height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { techBlueTheme } from '@/styles/echarts-theme';

// 注册必要的组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

interface Props {
  option: any;
  height?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
});

const chartContainer = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

onMounted(async () => {
  await nextTick();
  if (!chartContainer.value) return;

  // 注册主题
  echarts.registerTheme('techBlue', techBlueTheme);

  // 初始化图表
  chartInstance = echarts.init(chartContainer.value, 'techBlue');
  
  // 设置初始配置
  if (props.option) {
    chartInstance.setOption(props.option);
  }

  // 响应式调整
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});

// 监听配置变化
watch(
  () => props.option,
  (newOption) => {
    if (chartInstance && newOption) {
      chartInstance.setOption(newOption, true);
    }
  },
  { deep: true }
);

// 监听loading状态
watch(
  () => props.loading,
  (isLoading) => {
    if (!chartInstance) return;
    if (isLoading) {
      chartInstance.showLoading('default', {
        text: '加载中...',
        color: '#2563eb',
        textColor: '#64748b',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        zlevel: 0,
      });
    } else {
      chartInstance.hideLoading();
    }
  }
);


// 防抖优化：避免频繁 resize 造成性能问题
let resizeTimer: number | null = null;
const handleResize = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    chartInstance?.resize();
    resizeTimer = null;
  }, 300);
};


// 暴露实例方法供父组件调用
defineExpose({
  getChartInstance: () => chartInstance,
  resize: handleResize,
});
</script>
