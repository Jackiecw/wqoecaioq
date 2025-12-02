"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementController = void 0;
const managementService_1 = __importDefault(require("../services/managementService"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
// --- Zod Schemas ---
const storeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "店铺名称不能为空"),
    platform: zod_1.z.nativeEnum(client_1.Platform),
    countryCode: zod_1.z.string().min(1, "必须选择一个国家"),
    status: zod_1.z.nativeEnum(client_1.StoreStatus),
    platformStoreId: zod_1.z.string().optional().nullable(),
    registeredAt: zod_1.z.string().datetime().optional().nullable(),
});
const countrySchema = zod_1.z.object({
    code: zod_1.z.string().min(2, "国家代码 (Code) 至少需要2个字符").max(10),
    name: zod_1.z.string().min(1, "国家名称不能为空"),
    establishedAt: zod_1.z.string().datetime().optional().nullable(),
});
class ManagementController {
    // --- Options ---
    async getOptions(req, res, next) {
        try {
            const options = await managementService_1.default.getOptions();
            res.json(options);
        }
        catch (error) {
            next(error);
        }
    }
    // --- Stores ---
    async getAllStores(req, res, next) {
        try {
            const stores = await managementService_1.default.getAllStores();
            res.json(stores);
        }
        catch (error) {
            next(error);
        }
    }
    async getStoreById(req, res, next) {
        try {
            const store = await managementService_1.default.getStoreById(req.params.id);
            res.json(store);
        }
        catch (error) {
            next(error);
        }
    }
    async createStore(req, res, next) {
        try {
            const validation = storeSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newStore = await managementService_1.default.createStore(validation.data);
            res.status(201).json(newStore);
        }
        catch (error) {
            next(error);
        }
    }
    async updateStore(req, res, next) {
        try {
            const validation = storeSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedStore = await managementService_1.default.updateStore(req.params.id, validation.data);
            res.json(updatedStore);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteStore(req, res, next) {
        try {
            await managementService_1.default.deleteStore(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    // --- Countries ---
    async getAllCountries(req, res, next) {
        try {
            const countries = await managementService_1.default.getAllCountries();
            res.json(countries);
        }
        catch (error) {
            next(error);
        }
    }
    async createCountry(req, res, next) {
        try {
            const validation = countrySchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newCountry = await managementService_1.default.createCountry(validation.data);
            res.status(201).json(newCountry);
        }
        catch (error) {
            next(error);
        }
    }
    async updateCountry(req, res, next) {
        try {
            const validation = countrySchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedCountry = await managementService_1.default.updateCountry(req.params.id, validation.data);
            res.json(updatedCountry);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ManagementController = ManagementController;
exports.default = new ManagementController();
//# sourceMappingURL=managementController.js.map