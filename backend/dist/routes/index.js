"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerRoutes;
const auth_1 = __importDefault(require("./auth"));
const salesData_1 = __importDefault(require("./salesData"));
const productRoutes_1 = __importDefault(require("../src/routes/productRoutes"));
const storeListingRoutes_1 = __importDefault(require("../src/routes/storeListingRoutes"));
const financeRoutes_1 = __importDefault(require("../src/routes/financeRoutes"));
const logisticsRoutes_1 = __importDefault(require("../src/routes/logisticsRoutes"));
const adminRoutes_1 = __importDefault(require("../src/routes/adminRoutes"));
const managementRoutes_1 = __importDefault(require("../src/routes/managementRoutes"));
const operationRoutes_1 = __importDefault(require("../src/routes/operationRoutes"));
const performanceRoutes_1 = __importDefault(require("../src/routes/performanceRoutes"));
const profileRoutes_1 = __importDefault(require("../src/routes/profileRoutes"));
const salesImportRoutes_1 = __importDefault(require("../src/routes/salesImportRoutes"));
// ...
function registerRoutes(app) {
    // 非 Admin 路由
    app.use('/api', auth_1.default);
    app.use('/api', salesData_1.default);
    app.use('/api', profileRoutes_1.default);
    app.use('/api', salesImportRoutes_1.default);
    // Migrated Routes
    app.use('/api/admin', productRoutes_1.default);
    app.use('/api/admin', storeListingRoutes_1.default);
    app.use('/api/admin', adminRoutes_1.default);
    app.use('/api/admin', managementRoutes_1.default);
    // 其他域模块
    app.use('/api', operationRoutes_1.default);
    app.use('/api', financeRoutes_1.default);
    app.use('/api', logisticsRoutes_1.default);
    app.use('/api', performanceRoutes_1.default); // ⬇️ 【新增】 绩效管理
}
;
//# sourceMappingURL=index.js.map