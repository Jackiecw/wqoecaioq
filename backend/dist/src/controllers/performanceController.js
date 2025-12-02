"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceController = void 0;
const performanceService_1 = __importDefault(require("../services/performanceService"));
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
// --- Zod Schemas ---
const templateItemSchema = zod_1.z.object({
    category: zod_1.z.string().min(1),
    kpiName: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    weight: zod_1.z.number().min(0).max(100),
});
const createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    items: zod_1.z.array(templateItemSchema).min(1),
});
const assignReviewSchema = zod_1.z.object({
    employeeId: zod_1.z.string(),
    templateId: zod_1.z.string(),
    month: zod_1.z.string(), // "YYYY-MM" format
    managerId: zod_1.z.string(),
    directorId: zod_1.z.string().optional(),
});
const updateReviewSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'DIRECTOR_REVIEW', 'COMPLETED', 'CANCELED']).optional(),
    summaryThisMonth: zod_1.z.string().nullable().optional(),
    planNextMonth: zod_1.z.string().nullable().optional(),
    companySuggestions: zod_1.z.string().nullable().optional(),
    items: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        selfScore: zod_1.z.number().nullable().optional(),
        selfComment: zod_1.z.string().nullable().optional(),
        managerScore: zod_1.z.number().nullable().optional(),
        managerComment: zod_1.z.string().nullable().optional(),
        directorScore: zod_1.z.number().nullable().optional(),
        directorComment: zod_1.z.string().nullable().optional(),
    })).optional(),
});
class PerformanceController {
    async getAllTemplates(req, res, next) {
        try {
            const templates = await performanceService_1.default.getAllTemplates();
            res.json(templates);
        }
        catch (error) {
            next(error);
        }
    }
    async createTemplate(req, res, next) {
        try {
            const validation = createTemplateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const template = await performanceService_1.default.createTemplate(validation.data);
            res.status(201).json(template);
        }
        catch (error) {
            next(error);
        }
    }
    async assignReview(req, res, next) {
        try {
            const validation = assignReviewSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const review = await performanceService_1.default.assignReview(validation.data);
            res.status(201).json(review);
        }
        catch (error) {
            next(error);
        }
    }
    async getMyReviews(req, res, next) {
        try {
            const { userId } = req.user;
            const reviews = await performanceService_1.default.getMyReviews(userId);
            res.json(reviews);
        }
        catch (error) {
            next(error);
        }
    }
    async getPendingReviews(req, res, next) {
        try {
            const { userId } = req.user;
            const reviews = await performanceService_1.default.getPendingReviews(userId);
            res.json(reviews);
        }
        catch (error) {
            next(error);
        }
    }
    async getReviewDetail(req, res, next) {
        try {
            const { userId, role } = req.user;
            const review = await performanceService_1.default.getReviewDetail(req.params.id, userId, role);
            res.json(review);
        }
        catch (error) {
            next(error);
        }
    }
    async updateReview(req, res, next) {
        try {
            const validation = updateReviewSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedReview = await performanceService_1.default.updateReview(req.params.id, validation.data);
            res.json(updatedReview);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PerformanceController = PerformanceController;
exports.default = new PerformanceController();
//# sourceMappingURL=performanceController.js.map