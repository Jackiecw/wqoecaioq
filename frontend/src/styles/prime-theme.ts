import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

/**
 * 深度定制PrimeVue主题配置
 * 目标：实现"明亮科技蓝"高级视觉效果
 * 编码：UTF-8
 */

// 自定义预设：基于Aura，注入科技蓝色系
const CustomPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#2563eb', // 主色：科技蓝
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e3a8a',
      950: '#172554',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafc',   // 浅米白背景
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
    },
  },
});

// 主题配置
export const primeTheme = {
  preset: CustomPreset,
  options: {
    prefix: 'p',
    darkModeSelector: false, // 仅支持亮色模式
    cssLayer: {
      name: 'primevue',
      order: 'tailwind-base, primevue, tailwind-utilities',
    },
  },
};

