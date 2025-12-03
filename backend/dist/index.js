"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
// Infrastructure
const config_1 = __importDefault(require("./src/config/config"));
const logger_1 = __importDefault(require("./src/utils/logger"));
const errorHandler_1 = __importDefault(require("./src/middlewares/errorHandler"));
// Routes
const routes_1 = __importDefault(require("./src/routes"));
// Initialize App
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Request ID
app.use((req, res, next) => {
    req.requestId = (0, crypto_1.randomUUID)();
    res.setHeader('X-Request-Id', req.requestId);
    next();
});
// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.default.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
            requestId: req.requestId,
            ip: req.ip,
        });
    });
    next();
});
// Static Files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Backend API is running' });
});
// Routes
(0, routes_1.default)(app);
// 404 Handler
// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });
// Global Error Handler
app.use(errorHandler_1.default);
// Start Server
if (require.main === module) {
    const server = app.listen(config_1.default.PORT, config_1.default.HOST, () => {
        logger_1.default.info(`🚀 Server running on http://${config_1.default.HOST}:${config_1.default.PORT}`);
        // Keep process alive
        setInterval(() => { }, 1000 * 60 * 60);
    });
    // Process Handlers
    process.on('unhandledRejection', (err) => {
        logger_1.default.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
        server.close(() => {
            process.exit(1);
        });
    });
    process.on('uncaughtException', (err) => {
        logger_1.default.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map