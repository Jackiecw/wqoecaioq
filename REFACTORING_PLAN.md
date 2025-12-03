# 重构实施计划：海外电商 ERP

## 目标
在保持核心业务逻辑稳定的前提下，重构现有 Vue 3 + Express + Prisma 单体，提升可维护性、类型安全与开发效率，并为后续扩展（队列、审计、CI/CD）奠定基础。

**关键变更**
- **架构**：从“胖路由”迁移为 **Controller-Service-Repository** 分层。
- **语言**：后端全面迁移 **TypeScript**，前端逐步切换。
- **基础设施**：统一配置、日志、错误处理；前后端统一 `/api` 代理。
- **前端**：引入 **Pinia**、**Shadcn-vue**，服务层封装 API。
- **可靠性**：补齐集成测试与异步任务队列（队列稍后实施）。

## 用户注意事项
> [!IMPORTANT]
> **破坏性变更**
> - 路由文件会在迁移后删除旧版实现。
> - 前端 API 调用统一走 `/api/...`，生产的 Nginx 需要对应转发。
> - 数据库类型约束更严格，可能暴露历史脏数据。

## 计划分阶段

### Phase 1：基础设施（优先完成）
*目标：消除环境差异，确保开发/测试安全网。*
- 【后端】集中配置 + Zod 校验：`backend/src/config/config.ts`。
- 【后端】结构化日志：`backend/src/utils/logger.ts`。
- 【后端】全局错误处理中间件：`backend/src/middlewares/errorHandler.ts`。
- 【前端】`frontend/vite.config.js` 配置 `/api` 代理（默认指向后端端口），移除跨域硬编码。
- 【前端】统一 HTTP 入口：删除/替换 `frontend/src/api.js`，基线 `baseURL=/api`。
- 【测试】`backend/tests/setup.ts` + `integration/health.test.ts` 等集成测试。

### Phase 2：后端分层重构
*目标：解耦路由与业务逻辑。*
- 控制器目录：`backend/src/controllers/` 处理 HTTP 和校验。
- 服务目录：`backend/src/services/` 处理业务逻辑（Auth、Sales、Store/Product、Finance、Logistics、Admin、Operations、Performance、Sales Import 等）。
- 统一错误类：`backend/src/utils/AppError.ts`。

### Phase 3：TypeScript 迁移
*目标：类型安全，减少运行时错误。*
- 后端开启严格模式 `tsconfig.json`，`package.json` 增加 `ts-node`/`tsx` 脚本。
- 路由与入口移动到 `backend/src`，编译产物跑在 `dist`。
- Prisma 类型应用于服务层。
- 前端逐步为 `.vue` 加 `lang="ts"`，补全类型。

### Phase 4：前端现代化（已完成）
*目标：提升复用与一致性。*
- **状态管理**：`frontend/src/stores/` 建立 Pinia（`useAuthStore`、`useGlobalStore`）。
- **服务层**：`frontend/src/services/` 按模块封装（auth/sales/report/finance/performance/calendar 等），组件不再直接调 axios。
- **UI 组件**：引入 Shadcn-vue，替换自定义 Modal/Table/Form。
- **体验**：修复中文文案编码，统一交互/样式；全部 `script setup` 统一 `lang="ts"`。

### Phase 5：高级能力（稍后执行）
*目标：可扩展与稳定性。*
- **基础配置**：新增 Redis 连接配置（env + Zod 校验），统一放在 `config` 中；明确队列命名前缀、防重幂等 key 约定。
- **队列与 Worker**：引入 BullMQ；拆分 Worker 进程（如 `importWorker`、`emailWorker`），提供健康检查与 SIGTERM 优雅退出。
- **作业设计（建议）**：
  - `salesImport`：接收上传批次 ID，异步解析入库，按行幂等，失败行记录重试/补偿。
  - `reportEmail`：异步发送报表/通知，带最大重试与死信队列。
  - 预留 `dataSync`（跨系统同步）、`auditLogExport`。
- **监控与可观测性**：为 Job 添加 metrics/logging，暴露队列堆积报警阈值；提供管理端点查看失败任务。
- **接口改造**：上传/触发类接口改为“入队 + 返回 jobId”，前端轮询/订阅进度。
- **安全与治理**：设置并发/速率限制、重试/backoff 策略、死信队列；敏感数据不落盘；确保作业幂等。
- （财务本位币入库优化已暂缓，待后续独立规划。）

## 验证计划
**自动化**
- 后端集成测试：`npm test`（Auth、Sales CRUD、错误处理）。
- 类型检查：`npx tsc --noEmit`。

**手动验证**
- 前后端 `npm run dev` 启动，确认无 CORS。
- 登录流程验证。
- 销售 Excel 上传后入库校验。
- 周报生成/查看未受影响。
