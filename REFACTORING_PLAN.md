# Refactoring Implementation Plan: Overseas E-commerce ERP

## Goal Description
Refactor the existing Vue 3 + Express + Prisma monolith into a modern, robust, and scalable architecture. The primary goals are to improve maintainability, type safety, and development efficiency while preserving core business logic.

**Key Changes:**
- **Architecture**: Move from "Fat Routes" to **Controller-Service-Repository** pattern.
- **Language**: Migrate from JavaScript to **TypeScript** (Backend first).
- **Infrastructure**: Standardize Config, Logging, and Error Handling.
- **Frontend**: Introduce **Pinia** state management and **Shadcn-vue**.
- **Reliability**: Add Integration Tests and Async Task Queues.

## User Review Required
> [!IMPORTANT]
> **Breaking Changes**: This refactor involves significant structural changes.
> - **File Deletion**: Legacy route files will be deleted after logic is migrated to Services.
> - **API Path Changes**: Frontend API calls will be routed via Vite Proxy (`/api/...`), requiring updates to `nginx` config in production later.
> - **Database**: While Schema changes are minimal initially, strict typing may reveal existing data inconsistencies.

## Proposed Changes

### Phase 1: Foundation & Infrastructure (Stability First)
*Focus: Fix the development environment, unify configuration, and establish safety nets.*

#### [Backend] Configuration & Logging
- [NEW] `backend/src/config/config.ts` (or .js initially): Centralized env var loading with Zod validation.
- [NEW] `backend/src/utils/logger.js`: Setup **Winston** for structured logging.
- [NEW] `backend/src/middlewares/errorHandler.js`: Global error handling middleware to replace ad-hoc `try-catch`.
- [MODIFY] `backend/app.js`: Apply global error handler and remove hardcoded `dotenv` calls.

#### [Frontend] Dev Environment
- [MODIFY] `frontend/vite.config.js`: Configure `server.proxy` to forward `/api` to backend (port 3000).
- [MODIFY] `frontend/src/api.js`: Remove hardcoded URL detection; set `baseURL` to `/api`.

#### [Testing] Safety Net
- [NEW] `backend/tests/setup.js`: Setup **Vitest** + **Supertest** environment.
- [NEW] `backend/tests/integration/health.test.js`: Verify basic API connectivity.

---

### Phase 2: Backend Architecture Overhaul (The Core)
*Focus: Decouple business logic from HTTP transport layer.*

#### [Backend] Layer Separation
- [NEW] `backend/src/controllers/`: Handle HTTP requests, validation, and responses.
- [NEW] `backend/src/services/`: Handle business logic (e.g., `SalesService`, `AuthService`).
- [NEW] `backend/src/utils/AppError.js`: Standardized error class.

#### [Backend] Migration (Iterative)
*We will migrate module by module. Old route files will be deleted after migration.*
- **Auth Module**: Migrate `routes/auth.js` -> `controllers/authController.js` + `services/authService.js`.
- **Sales Module**: Migrate `routes/salesData.js` -> `controllers/salesController.js` + `services/salesService.js`.
- **Store/Product Module**: Migrate related routes.

---

### Phase 3: TypeScript Migration (Type Safety)
*Focus: Eliminate runtime errors and improve developer experience.*

#### [Backend] TypeScript Setup
- [NEW] `backend/tsconfig.json`: Strict mode configuration.
- [MODIFY] `package.json`: Add `tsx`, `typescript`, `ts-node`.
- [ACTION] Rename `.js` files to `.ts` and fix type errors (starting with Services).
- [ACTION] Generate Prisma Types (`npx prisma generate`) and apply to Service methods.

---

### Phase 4: Frontend Modernization (Experience)
*Focus: Clean up frontend code and improve state management.*

#### [Frontend] State Management
- [NEW] `frontend/src/stores/`: Setup **Pinia** stores.
    - `useAuthStore`: User session and permissions.
    - `useGlobalStore`: Country selection, currency settings.

#### [Frontend] API Layer
- [NEW] `frontend/src/services/`: Encapsulate API calls (e.g., `auth.service.js`, `sales.service.js`).
- [MODIFY] Components: Replace direct `axios` calls with Service calls.

#### [Frontend] UI Components
- [NEW] Install **Shadcn-vue** (Tailwind-based components).
- [MODIFY] Replace custom `Modal` and `Table` components with Shadcn equivalents.

---

### Phase 5: Advanced Features (Scalability)
*Focus: Handle heavy workloads.*

#### [Backend] Async Queues
- [NEW] `backend/src/queues/importQueue.js`: Setup **BullMQ** + **Redis** connection.
- [NEW] `backend/src/workers/importWorker.js`: Move Excel parsing logic here.
- [MODIFY] `salesController.js`: Change upload endpoint to dispatch job and return Job ID.

## Verification Plan

### Automated Tests
- **Integration Tests**: Run `npm test` in backend.
    - Verify Auth (Login/Register).
    - Verify Sales Data CRUD.
    - Verify Error Handling (force an error, check JSON response format).
- **Type Check**: Run `npx tsc --noEmit` to ensure no type errors.

### Manual Verification
- **Dev Environment**:
    - Start backend (`npm run dev`) and frontend (`npm run dev`).
    - Verify frontend loads without CORS errors.
    - Verify Login flow works.
- **Business Logic**:
    - Upload a Sales Excel file -> Verify data appears in DB.
    - Check "Weekly Report" generation (ensure logic wasn't broken during refactor).
