"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const reportService_1 = __importDefault(require("../services/reportService"));
const zod_1 = require("zod");
const createReportSchema = zod_1.z.object({
    weekStartDate: zod_1.z.string().date(),
    summaryThisWeek: zod_1.z.string().min(1),
    planNextWeek: zod_1.z.string().min(1),
    problemsEncountered: zod_1.z.string().optional(),
    other: zod_1.z.string().optional(),
});
class ReportController {
    async getReports(req, res, next) {
        try {
            const reports = await reportService_1.default.getReports(req.user);
            res.json(reports);
        }
        catch (error) {
            next(error);
        }
    }
    async createReport(req, res, next) {
        try {
            const validation = createReportSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: validation.error.errors
                });
            }
            const report = await reportService_1.default.createReport(validation.data, req.user.userId);
            res.status(201).json(report);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteReport(req, res, next) {
        try {
            const { userId, role } = req.user;
            await reportService_1.default.deleteReport(req.params.id, userId, role);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
exports.default = new ReportController();
//# sourceMappingURL=reportController.js.map