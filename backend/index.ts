import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import path from 'path';

// Infrastructure
import config from './src/config/config';
import logger from './src/utils/logger';
import errorHandler from './src/middlewares/errorHandler';
import AppError from './src/utils/AppError';

// Routes
import registerRoutes from './src/routes';

// Initialize App
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).requestId = randomUUID();
    res.setHeader('X-Request-Id', (req as any).requestId);
    next();
});

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
            requestId: (req as any).requestId,
            ip: req.ip,
        });
    });
    next();
});

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'Backend API is running' });
});

// Routes
registerRoutes(app);

// 404 Handler
// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global Error Handler
app.use(errorHandler);

// Start Server
if (require.main === module) {
    const server = app.listen(config.PORT, config.HOST, () => {
        logger.info(`🚀 Server running on http://${config.HOST}:${config.PORT}`);
        // Keep process alive
        setInterval(() => { }, 1000 * 60 * 60);
    });

    // Process Handlers
    process.on('unhandledRejection', (err: any) => {
        logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
        server.close(() => {
            process.exit(1);
        });
    });

    process.on('uncaughtException', (err: any) => {
        logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
        process.exit(1);
    });
}

export default app;
