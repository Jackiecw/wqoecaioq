import { Express } from 'express';
import authRoutes from './auth';
import salesDataRoutes from './salesData';
import productRoutes from '../src/routes/productRoutes';
import storeListingRoutes from '../src/routes/storeListingRoutes';
import financeRoutes from '../src/routes/financeRoutes';
import logisticsRoutes from '../src/routes/logisticsRoutes';
import adminRoutes from '../src/routes/adminRoutes';
import managementRoutes from '../src/routes/managementRoutes';
import operationRoutes from '../src/routes/operationRoutes';
import performanceRoutes from '../src/routes/performanceRoutes';
import profileRoutes from '../src/routes/profileRoutes';

/**
 * 统一管理 API 路由挂载，防止入口文件变得臃肿。
 * 仅在这里维护路径前缀和模块映射，方便日后扩展。
 */
export default function registerRoutes(app: Express) {
    // 非 Admin 路由
    app.use('/api', authRoutes);
    app.use('/api', salesDataRoutes);
    app.use('/api', profileRoutes);
    app.use('/api', require('./salesImport'));

    // Migrated Routes
    app.use('/api/admin', productRoutes);
    app.use('/api/admin', storeListingRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin', managementRoutes);

    // 其他域模块
    app.use('/api', operationRoutes);
    app.use('/api', financeRoutes);
    app.use('/api', logisticsRoutes);
    app.use('/api', performanceRoutes); // ⬇️ 【新增】 绩效管理
};
