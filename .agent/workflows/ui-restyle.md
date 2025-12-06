---
description: UI 风格统一优化规则 - Clean Premium White Theme (Notion 风格)
---

# 全局 UI 优化规则 — Clean Premium White Theme

> **风格参考**: Notion
> **项目**: Overseas Ops 跨境电商 ERP
> **配色方案**: Neutral Slate (中性灰蓝)

---

## 📋 核心规则

1. **白底为主** — 页面背景 `#f8fafc`，卡片 `#ffffff`
2. **Neutral Slate 配色** — 中性灰 + 蓝色点缀
3. **极简克制** — 无深色 Hero，轻量标题栏
4. **中圆角 12px** — 卡片、按钮统一
5. **极浅阴影** — 柔和不抢眼
6. **微动效** — hover 轻微上浮

---

## 🎨 配色规范

### 主色系
```css
--color-primary: #475569;        /* Slate 600 - 主色 */
--color-primary-hover: #334155;  /* Slate 700 */
--color-accent: #3b82f6;         /* Blue 500 - 强调色 */
--color-accent-soft: #eff6ff;    /* Blue 50 - 浅强调背景 */
```

### 语义色
```css
--color-success: #10b981;        /* 增长、成功 */
--color-danger: #ef4444;         /* 下降、错误 */
--color-warning: #f59e0b;        /* 警告 */
```

### 背景与边框
```css
--color-bg-page: #f8fafc;        /* Slate 50 - 页面背景 */
--color-bg-card: #ffffff;        /* 卡片背景 */
--color-border: #e2e8f0;         /* Slate 200 - 边框 */
```

### 文字
```css
--color-text-primary: #1e293b;   /* Slate 800 */
--color-text-secondary: #64748b; /* Slate 500 */
--color-text-muted: #94a3b8;     /* Slate 400 */
```

---

## 🏗️ 布局规范

### 圆角 (中圆角)
```css
--radius-xs: 4px;      /* 标签、小按钮 */
--radius-sm: 8px;      /* 输入框 */
--radius-md: 12px;     /* ⭐ 主要卡片，默认 */
--radius-lg: 16px;     /* 大容器、弹窗 */
--radius-full: 9999px; /* 胶囊按钮 */
```

### 阴影 (极浅)
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02);
```

### 过渡
```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
```

---

## 🧩 组件规范

### 页面标题栏 (替代深色 Hero)
```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
```

### 卡片
```css
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### 统计卡片
```css
.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  box-shadow: var(--shadow-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 🔧 技术规范

### 禁止 ❌
```vue
<div class="bg-[#3B82F6]">...</div>
<div style="color: #6366f1">...</div>
<section class="bg-gradient-to-r from-slate-900">...</section>
```

### 推荐 ✅
```vue
<div class="bg-surface-0">...</div>
<div :style="{ color: 'var(--color-primary)' }">...</div>
<header class="page-header">...</header>
```

---

## 📝 页面优化检查清单

- [ ] 移除深色 Hero → 轻量标题栏
- [ ] 背景改为 `--color-bg-page`
- [ ] 卡片使用白底 + 极浅阴影
- [ ] 圆角统一 12px
- [ ] 移除硬编码颜色
- [ ] 确保 hover 有微动效

---

## 🗂️ 已完成优化页面

| 状态 | 页面 | 主要改动 |
|:----:|------|---------| 
| ✅ | DashboardHome.vue | 移除渐变卡片，白底统计卡 |
| ✅ | LogisticsPage.vue | 移除深色 Hero，白色标题栏 |
| ✅ | SalesDashboard.vue | 统一白底风格 |
| ✅ | CalendarPage.vue | 简化视觉 |
| ✅ | WeeklyReportPage.vue | 清理样式 |
| ✅ | FinancePage.vue | 白底卡片 |
| ✅ | OperationsCenter.vue | 白色标题栏 |
| ✅ | OnSaleProductsPage.vue | CSS 变量覆盖 |
| ✅ | DataImport.vue | 白色页头，标准 CSS |
| ✅ | CommonLinks.vue | 白色页头，链接卡片 |
| ✅ | Login.vue | accent 色登录面板 |
| ✅ | BatchImport.vue | CSS 变量覆盖 |
| ✅ | ImportHistory.vue | CSS 变量覆盖 |
| ✅ | Performance 系列组件 | CSS 变量覆盖 |
| ✅ | PrimeVue Admin 组件 | 主题自动对齐 |

---

## 💬 Prompt 模板

// turbo-all

```
请优化 [页面名称] 的 UI 风格，遵循 Clean Premium White Theme：

1. 背景: 页面 #f8fafc，卡片纯白
2. 配色: Neutral Slate (主色 #475569，强调 #3b82f6)
3. 圆角: 统一 12px
4. 阴影: 极浅 (--shadow-sm)
5. 标题: 轻量标题栏，移除深色 Hero
6. 动效: hover 上浮 2px + 阴影加深
7. 边框: 1px solid #e2e8f0

参考风格: Notion
```
