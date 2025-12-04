# AppLayout 集成示例

## 路由配置示例

将以下代码添加到 `src/router/index.ts` 中，展示如何使用新创建的 Layout 组件:

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: 'finance',
          name: 'Finance',
          component: () => import('@/views/FinanceView.vue')
        },
        {
          path: 'logistics',
          name: 'Logistics',
          component: () => import('@/views/LogisticsView.vue')
        },
        {
          path: 'sales',
          name: 'Sales',
          component: () => import('@/views/SalesView.vue')
        },
        {
          path: 'operations',
          name: 'Operations',
          component: () => import('@/views/OperationsView.vue')
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/ReportsView.vue')
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/SettingsView.vue')
        }
      ]
    },
    // 登录页面不使用 Layout
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue')
    }
  ]
});

export default router;
```

## 要点说明

1. **嵌套路由**: 使用 `children` 属性将所有需要 Layout 的页面作为子路由
2. **默认重定向**: 设置 `redirect: '/dashboard'` 确保访问根路径时跳转到仪表盘
3. **懒加载**: 使用动态 `import()` 实现路由组件的按需加载
4. **独立页面**: 登录等页面不需要 Layout，直接作为顶级路由

## 视觉效果预览

```
┌─────────────────────────────────────────────────────────┐
│  Logo (h-16)                                             │
├─────────────────────────────────────────────────────────┤
│                         ┌───────────────────────────────┐│
│  📊 仪表盘              │  首页 > 仪表盘      🔍 🔔 👤 ││
│  💰 财务                ├───────────────────────────────┤│
│  🚚 物流                │                               ││
│  🛒 销售  ◄─ Active    │   Content Area                ││
│  💼 运营                │   (router-view)               ││
│  📝 报表                │                               ││
│  ⚙️  设置                │                               ││
│                         │                               ││
│                         │                               ││
│                         └───────────────────────────────┘│
│  © 2025 海外ERP系统                                      │
└─────────────────────────────────────────────────────────┘
   ↑ w-64 固定宽度          ↑ flex-1 自适应宽度
```
