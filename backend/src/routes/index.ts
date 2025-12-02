import { Express } from 'express';
import authRoutes from './auth';
import salesDataRoutes from './salesData';
import productRoutes from './productRoutes';
import storeListingRoutes from './storeListingRoutes';
import financeRoutes from './financeRoutes';
import logisticsRoutes from './logisticsRoutes';
import adminRoutes from './adminRoutes';
import managementRoutes from './managementRoutes';
import operationRoutes from './operationRoutes';
import performanceRoutes from './performanceRoutes';
import profileRoutes from './profileRoutes';
import salesImportRoutes from './salesImportRoutes';

// ...

export default function registerRoutes(app: Express) {
    // 非 Admin 路由
    app.use('/api', authRoutes);
    app.use('/api', salesDataRoutes);
    app.use('/api', profileRoutes);
    app.use('/api', salesImportRoutes);

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
