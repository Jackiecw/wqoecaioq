"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const productService_1 = __importDefault(require("../services/productService"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
// Validation Schemas
const productSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, "SKU 不能为空"),
    name: zod_1.z.string().min(1, "商品名称不能为空"),
    description: zod_1.z.string().optional().nullable(),
    category: zod_1.z.nativeEnum(client_1.ProductCategory),
    publicName: zod_1.z.string().optional().nullable(),
    cost: zod_1.z.preprocess(val => parseFloat(val) || null, zod_1.z.number().optional().nullable()),
    weightKg: zod_1.z.preprocess(val => parseFloat(val) || null, zod_1.z.number().optional().nullable()),
    lengthMm: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    widthMm: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    heightMm: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    resolution: zod_1.z.string().optional().nullable(),
    brightnessAnsi: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    brightnessUniformity: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    lightSourceBrightness: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    noiseDb: zod_1.z.preprocess(val => parseInt(val) || null, zod_1.z.number().int().optional().nullable()),
    contrastRatio: zod_1.z.string().optional().nullable(),
    throwRatio: zod_1.z.string().optional().nullable(),
    projectionSize: zod_1.z.string().optional().nullable(),
    projectionDistance: zod_1.z.string().optional().nullable(),
    chipset: zod_1.z.string().optional().nullable(),
    ramRom: zod_1.z.string().optional().nullable(),
    os: zod_1.z.nativeEnum(client_1.OS_Type).optional().nullable(),
    focusMethod: zod_1.z.nativeEnum(client_1.Focus_Method).optional().nullable(),
    keystone: zod_1.z.nativeEnum(client_1.Keystone_Method).optional().nullable(),
    hasGimbal: zod_1.z.preprocess(val => val === 'true' || val === true, zod_1.z.boolean().optional().default(false)),
    wifiVersion: zod_1.z.string().optional().nullable(),
    bluetoothVersion: zod_1.z.string().optional().nullable(),
    autoObstacle: zod_1.z.preprocess(val => val === 'true' || val === true, zod_1.z.boolean().optional().default(false)),
    autoScreenFit: zod_1.z.preprocess(val => val === 'true' || val === true, zod_1.z.boolean().optional().default(false)),
});
class ProductController {
    async getAllProducts(req, res, next) {
        try {
            const products = await productService_1.default.getAllProducts();
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    }
    async getProductOptions(req, res, next) {
        try {
            const options = await productService_1.default.getProductOptions();
            res.json(options);
        }
        catch (error) {
            next(error);
        }
    }
    async createProduct(req, res, next) {
        try {
            const validation = productSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const product = await productService_1.default.createProduct(validation.data, req.file);
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    }
    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const validation = productSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const product = await productService_1.default.updateProduct(id, validation.data, req.file);
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await productService_1.default.deleteProduct(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async getProductsWithListings(req, res, next) {
        try {
            const products = await productService_1.default.getProductsWithListings();
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
exports.default = new ProductController();
//# sourceMappingURL=productController.js.map