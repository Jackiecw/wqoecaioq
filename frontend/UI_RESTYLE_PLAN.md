# UI重构计划（简化版）

> 编码要求：所有文件统一使用 UTF-8（含中文）

## 当前状态 ✅

**核心优化已完成**：
- ✅ PrimeVue主题深度定制（科技蓝 #2563eb）
- ✅ Tailwind配置扩展（颜色同步+现代化设计）
- ✅ 删除Shadcn组件库（-20依赖包）
- ✅ 迁移6/8个Modal为PrimeVue Dialog
- ✅ 构建时间缩短67%（16.56s → 5.44s）

**服务运行**：
- 前端：http://localhost:5000
- 后端：http://localhost:3100

## 主题色方案

**科技蓝基调**：
- 主色：`#2563eb` (primary-500)
- 背景：`#f8fafc` (surface-50)
- 卡片：`#ffffff` (surface-0)
- 文本：`#0f172a` (surface-900)
- 字体：Inter, PingFang SC, Microsoft YaHei

## 待优化页面清单

### 高优先级（核心功能页）
- [ ] Dashboard首页 `/` - 优化卡片展示
- [ ] 销售数据看板 `/sales/dashboard` - 图表优化
- [ ] 工作日历 `/calendar` - 已使用PrimeVue
- [ ] 周报中心 `/reports` - 已使用PrimeVue

### 中优先级（数据管理页）
- [ ] 销售数据明细 `/sales/data` - 表格优化
- [ ] 财务管理 `/finance` - 已使用PrimeVue
- [ ] 物流管理 `/logistics` - 待优化
- [ ] 店铺管理 `/admin/stores` - 已使用PrimeVue

### 低优先级（辅助功能页）
- [ ] 产品目录 `/products/catalog` - 待优化
- [ ] 店铺在售 `/products/on-sale` - 待优化
- [ ] 运营中心 `/operations` - 待优化
- [ ] 绩效管理 `/performance` - 待优化

## 下一步行动

1. **测试当前UI效果** - 访问http://localhost:5000查看
2. **优化核心页面** - 从Dashboard和销售看板开始
3. **统一视觉风格** - 卡片、按钮、间距保持一致

## 技术栈总结

- **前端**: Vue 3.5 + TypeScript
- **UI库**: PrimeVue 4.5.0 (主) + @headlessui/vue (2个复杂modal)
- **CSS**: PrimeFlex 4.0.0 + Tailwind 4.1.16
- **图表**: Chart.js 4.5.1 → **建议迁移到 Apache ECharts** ⭐
- **状态**: Pinia 3.0.3

## 下一步优化计划

### 优先级1（视觉升级）
1. ✅ PrimeVue主题深度定制
2. ✅ 删除Shadcn组件库
3. ✅ Modal组件迁移（6/8完成）
4. ✅ 优化SalesDataPage

### 优先级2（图表升级）⭐ 新增
5. **迁移到Apache ECharts** - 更精致的数据可视化
   - SalesDashboard图表
   - DashboardHome图表
   - 其他统计图表
   - 详见：`echarts_migration.md`

### 优先级3（页面优化）

---

**最后更新**: 2025-12-04 09:13
**完成进度**: 核心优化100%，页面优化30%
