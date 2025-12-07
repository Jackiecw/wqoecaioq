---
description: Notion 风格 UI 统一改造计划（可迭代更新进度）
---

# Notion 风格 UI 统一计划

> 目标：统一全站视觉为浅色、描边、轻阴影的 Notion 风；减少硬编码颜色/阴影，抽象基础组件，提升一致性与可维护性。
> **关键规范**：
> - 头部策略：Option A (极大简化，仅保留 Title/Subtitle/Action)
> - 视觉 Token：`--color-bg-page`, `--color-border`, `--shadow-sm`

## 里程碑 & 进度
- [x] **M1 基础设计资产完成** (Token/Primitives: `PageHeader`, `ContentCard`, `FilterBar`, `SkeletonBlock`)
- [ ] **M2 核心页面落地** (Dashboard/Sales/Calendar)
    - [ ] `DashboardHome.vue` (需重构 Header, 样式微调)
    - [x] `SalesDashboard.vue` (已统一)
    - [x] `CalendarPage.vue` (已统一)
    - [x] `WeeklyReportPage.vue` (已统一)
- [ ] **M3 数据管理页落地** (OnSale/Finance/Logistics) - **大部分已完成**
    - [x] `OnSaleProductsPage.vue`
    - [x] `FinancePage.vue`
    - [x] `OperationsCenter.vue`
    - [x] `SalesDataPage.vue`
    - [x] `LogisticsPage.vue` (已应用 Primitives)
    - [ ] `PerformanceTemplateList.vue` (结构已统一，需收敛按钮样式)
- [ ] **M4 收尾与文档** (空态/骨架统一、指南补充)

## 执行顺序（建议按顺序推进）
1) **DashboardHome 头部重构**
   - [ ] 将手动实现的 Header 替换为标准 `<PageHeader>` 组件。
   - [ ] 确保 "汇率计算器" 和 "待办/日程" 卡片风格与全站一致。

2) **全局头部/按钮收敛**
   - [ ] 检查 `PerformanceTemplateList` 等页面，将硬编码 Tailwind 按钮替换为 PrimeVue `Button` (text/outlined/severity)。
   - [ ] 确保所有页面头部均使用 Option A 风格（移除冗余统计卡片，移至内容区）。

3) **样式清理 (Cleanup)**
   - [ ] 全局搜索 `bg-blue-600` 等硬编码色，替换为语义化 CSS 变量或 PrimeVue props。
   - [ ] 确保所有 `Shadow` 使用 `--shadow-sm` 或 `--shadow-md`。

## 附：落地准则（执行时检查）
- **Header**: 必须使用 `<PageHeader>`，禁止手写 `div` 布局。
- **Card**: 必须使用 `<ContentCard>` 或 `.card` 类（配合 Token）。
- **Button**: 优先使用 PrimeVue `Button`，配合 `text`, `outlined` 或 `severity="secondary"` 实现 Notion 风格。
- **Empty**: 使用 `<EmptyState>`。

## 记忆卡（下次对话要带的信息）
- **当前重点**: `DashboardHome.vue` 的 Header 重构。
- **已完成**: Sales, Calendar, Logistics, Finance 等核心功能页已完成风格迁移。
- **待优化**: DashboardHome (Header), Performance (Buttons), Import (Check status).
