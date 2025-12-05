"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerRoutes;
const auth_1 = __importDefault(require("./auth"));
const salesData_1 = __importDefault(require("./salesData"));
const productRoutes_1 = __importDefault(require("./productRoutes"));
const storeListingRoutes_1 = __importDefault(require("./storeListingRoutes"));
const financeRoutes_1 = __importDefault(require("./financeRoutes"));
const logisticsRoutes_1 = __importDefault(require("./logisticsRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const managementRoutes_1 = __importDefault(require("./managementRoutes"));
const operationRoutes_1 = __importDefault(require("./operationRoutes"));
const performanceRoutes_1 = __importDefault(require("./performanceRoutes"));
const profileRoutes_1 = __importDefault(require("./profileRoutes"));
const salesImportRoutes_1 = __importDefault(require("./salesImportRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const calendarRoutes_1 = __importDefault(require("./calendarRoutes"));
const commonRoutes_1 = __importDefault(require("./commonRoutes"));
function registerRoutes(app) {
    app.use('/api', auth_1.default);
    app.use('/api', salesData_1.default);
    app.use('/api', profileRoutes_1.default);
    app.use('/api', salesImportRoutes_1.default);
    app.use('/api', dashboardRoutes_1.default);
    app.use('/api', calendarRoutes_1.default);
    app.use('/api', commonRoutes_1.default);
    app.use('/api/admin', productRoutes_1.default);
    app.use('/api/admin', storeListingRoutes_1.default);
    app.use('/api/admin', adminRoutes_1.default);
    app.use('/api/admin', managementRoutes_1.default);
    app.use('/api', operationRoutes_1.default);
    app.use('/api', financeRoutes_1.default);
    app.use('/api', logisticsRoutes_1.default);
    app.use('/api', performanceRoutes_1.default);
}
//# sourceMappingURL=index.js.map