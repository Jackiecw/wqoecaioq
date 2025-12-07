---
description: Notion 风格 UI 统一改造计划（可迭代更新进度）
---

# Notion 风格 UI 统一计划

> 目标：统一全站视觉为浅色、描边、轻阴影的 Notion 风；减少硬编码颜色/阴影，抽象基础组件，提升一致性与可维护性。  
> 允许：引入小型 UI primitives（仅辅助 token/微交互，不新增重量级组件库）。

## 里程碑 & 进度
- [x] M1 基础设计资产完成（Token/Primitives）
- [ ] M2 核心页面落地（Dashboard/Sales/Calendar）
- [ ] M3 数据管理页落地（OnSale/Finance/Logistics）
- [ ] M4 收尾与文档（空态/骨架统一、指南补充）

## 执行顺序（建议按顺序推进）
1) **Token 收敛**
   - [x] 扩充 `dashboard-theme.css`：补齐间距/阴影/圆角/字体/动画 token，统一 `--color-*`，补胶囊半径、标准间距（8/12/16/20/24）。
   - [ ] Tailwind `theme.extend` 同步 spacing/radius/shadow，禁用内联色值（lint/grep 清单）。
2) **基础 Primitives 抽象**
   - [x] `PageShell`/`PageHeader`
   - [x] `ContentCard`
   - [x] `FilterBar`
   - [x] `EmptyState`/`SkeletonBlock`
3) **页面全面套用（M2 扩展到所有页面）**
   - [ ] `SalesDashboard.vue`：头部/筛选已统一；KPI/图表卡仍需左色条+轻阴影、空态微调（新版已上线）。
   - [ ] `DashboardHome.vue`：统一卡片/统计样式，移除残余渐变。
   - [x] `CalendarPage.vue`：Header/FilterBar + ContentCard，移除渐变，空态统一。
   - [x] `WeeklyReportPage.vue`
   - [ ] 其他组件页（Admin/Reports/Performance 等）逐页收敛。
4) **数据管理页（M3，继续推进直到全覆盖）**
   - [x] `OnSaleProductsPage.vue`
   - [x] `FinancePage.vue`
   - [x] `OperationsCenter.vue`
   - [x] `SalesDataPage.vue`
   - [x] `LogisticsPage.vue`：表格工具栏/批量栏用 FilterBar；表格空态/骨架统一。
   - [ ] 其余数据页（Imports 等）逐页应用。
5) **收尾（M4）**
   - [ ] 按三态按钮体系（primary/subtle/ghost），统一 PrimeIcons，去自绘按钮。
   - [ ] 用 `rg` 清单清理硬编码色值/阴影。
   - [ ] 在 `UI_REFACTOR_SUMMARY.md` 补充组件用法、空态/骨架示例。

## 附：落地准则（执行时检查）
- 背景：`--color-bg-page`，卡片：`--color-bg-card` + 1px `--color-border` + `--shadow-sm`
- 圆角：卡片 12px，胶囊按钮 full，输入框/下拉 8px
- 文字：标题 22–24/600，正文 14/400，行距 1.5；字体 Inter
- Tab/筛选：统一胶囊描边，选中填充；搜索框图标内嵌，控件同高
- 图表：使用 `echarts-theme.ts` 调色板，单色渐变，浅网格；空态提示一致
- 禁止硬编码色值/阴影/渐变，优先用 token 或 Tailwind 语义类

## 记忆卡（下次对话要带的信息）
- 主题：Notion 风浅色，主色科技蓝 #2563eb，描边+轻阴影，圆角 12px。
- Primitives：PageHeader、FilterBar、ContentCard、EmptyState、SkeletonBlock（均在 `frontend/src/components/common/`）。
- 已重构页面：OnSaleProductsPage、FinancePage、OperationsCenter、SalesDataPage、WeeklyReportPage、CalendarPage、SalesDashboard（新版已上线，KPI/图表卡可继续微调）。
- 待推进：LogisticsPage、导入等数据页、DashboardHome、Admin/Performance 等未统一页；Tailwind spacing/radius/shadow 同步；按钮三态体系和内联色清理。
- 构建：`cd frontend; npm run build` 最近通过，仅有 Rollup 大包警告。
