# Layout 组件使用指南

## 📦 已创建的文件

```
src/layout/
├── types.ts           # TypeScript 类型定义
├── AppLayout.vue      # 主布局容器
├── AppSidebar.vue     # 左侧侧边栏
└── AppTopbar.vue      # 顶部导航栏
```

## 🎨 设计特点

### AppSidebar (侧边栏)
- **固定宽度**: `w-64` (16rem / 256px)
- **背景**: 纯白背景 `bg-white`，右侧细边框 `border-slate-200`
- **Logo 区域**: 高度 `h-16`，深色文字 `text-slate-800`，加粗 `font-bold`
- **菜单项**:
  - 普通状态: `text-slate-500`，字体 `font-medium`
  - Hover 状态: `bg-slate-100`，文字变深 `text-slate-900`
  - 激活状态: `bg-indigo-50` + `text-indigo-600` + 左侧 4px 品牌色指示条
  - 过渡动画: `transition-all duration-200`

### AppTopbar (顶部栏)
- **半透明背景**: `bg-white/80` + `backdrop-blur-md`
- **固定高度**: `h-16`
- **功能区域**:
  - 左侧: 面包屑导航 (自动根据路由生成)
  - 右侧: 搜索框 (圆角胶囊状) + 通知铃铛 + 用户头像

### AppLayout (主布局)
- **Flex 布局**: 左侧 Sidebar 固定，右侧内容区自适应
- **全局背景**: `bg-slate-50` (提供层次感)
- **内容区**: 自动滚动，带 padding

## 🚀 如何使用

### 1. 在路由中使用

编辑 `src/router/index.ts`，将需要使用 Layout 的路由包裹起来:

```typescript
import AppLayout from '@/layout/AppLayout.vue';

const routes = [
  {
    path: '/',
    component: AppLayout,
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
      // ... 其他路由
    ]
  }
];
```

### 2. 调整菜单项

编辑 `src/layout/AppSidebar.vue`，修改 `menuItems` 数组:

```typescript
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '仪表盘',
    to: '/dashboard',
    icon: 'pi pi-chart-line'  // PrimeVue 图标
  },
  // 添加或修改菜单项...
];
```

### 3. 自定义面包屑

编辑 `src/layout/AppTopbar.vue`，在 `routeNameMap` 中添加路由名称映射:

```typescript
const routeNameMap: Record<string, string> = {
  'dashboard': '仪表盘',
  'your-route': '你的路由名称'
};
```

## 🎯 下一步优化建议

1. **集成用户信息**: 从 Pinia store 获取真实用户数据显示在头像和菜单中
2. **通知面板**: 实现 `toggleNotifications` 函数，添加通知弹出层
3. **用户菜单**: 实现 `toggleUserMenu` 函数，添加个人资料、设置、退出等选项
4. **响应式设计**: 添加移动端适配，在小屏幕上隐藏 Sidebar 并提供汉堡菜单
5. **权限控制**: 根据用户角色动态显示菜单项
6. **主题切换**: 添加明暗主题切换功能

## 💡 样式调整技巧

### 更改品牌色
全局搜索 `indigo` 并替换为你的品牌色 (如 `blue`、`violet`、`emerald` 等)

### 调整侧边栏宽度
在 `AppSidebar.vue` 中修改 `w-64` 为其他值 (如 `w-56`、`w-72`)

### 修改背景色
在 `AppLayout.vue` 中修改 `bg-slate-50` 为其他背景色

## 🔧 技术栈

- **Vue 3** (Composition API + Script Setup)
- **TypeScript** (严格类型检查)
- **Tailwind CSS** (样式控制)
- **PrimeVue** (图标、按钮、头像等组件)
- **Vue Router** (路由管理)
