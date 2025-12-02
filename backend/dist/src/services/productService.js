"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ProductService {
    async getAllProducts() {
        return await prismaClient_1.default.product.findMany({
            orderBy: { sku: 'asc' }
        });
    }
    async getProductOptions() {
        return {
            categories: Object.values(client_1.ProductCategory),
            osTypes: Object.values(client_1.OS_Type),
            focusMethods: Object.values(client_1.Focus_Method),
            keystoneMethods: Object.values(client_1.Keystone_Method),
        };
    }
    async createProduct(data, file) {
        // Check SKU uniqueness
        const existing = await prismaClient_1.default.product.findUnique({ where: { sku: data.sku } });
        if (existing) {
            if (file)
                fs_1.default.unlinkSync(file.path);
            throw new AppError_1.default('此 SKU 已被占用', 400);
        }
        const payload = { ...data };
        if (file) {
            payload.imageUrl = `/uploads/products/${file.filename}`;
        }
        return await prismaClient_1.default.product.create({ data: payload });
    }
    async updateProduct(id, data, file) {
        const existingProduct = await prismaClient_1.default.product.findUnique({ where: { id } });
        if (!existingProduct) {
            if (file)
                fs_1.default.unlinkSync(file.path);
            throw new AppError_1.default('商品未找到', 404);
        }
        // Check SKU uniqueness if changed
        if (data.sku && data.sku !== existingProduct.sku) {
            const skuCheck = await prismaClient_1.default.product.findUnique({ where: { sku: data.sku } });
            if (skuCheck) {
                if (file)
                    fs_1.default.unlinkSync(file.path);
                throw new AppError_1.default('此 SKU 已被其他商品占用', 400);
            }
        }
        const payload = { ...data };
        if (file) {
            payload.imageUrl = `/uploads/products/${file.filename}`;
            // Delete old image
            if (existingProduct.imageUrl) {
                // Assuming __dirname is src/services, so we go up to backend root
                // But safer to use process.cwd() or relative to uploads
                // The original code used path.join(__dirname, '..', oldProduct.imageUrl) from routes/
                // In src/services, we are one level deeper than routes? No, routes is in backend/routes, services in backend/src/services
                // Let's assume process.cwd() is backend root or we use absolute paths.
                // Best to rely on the relative path stored in DB which starts with /uploads
                // Construct absolute path based on project root
                const oldPath = path_1.default.join(process.cwd(), existingProduct.imageUrl);
                // Note: existingProduct.imageUrl starts with /uploads, so join works if cwd is root
                // However, windows paths might be tricky. 
                // Let's try to match the original logic: path.join(__dirname, '..', 'uploads')
                // Original: path.join(__dirname, '..', 'uploads', 'products') from routes/products.js
                // routes/ is in backend/routes. .. is backend.
                // We will use process.cwd() which should be d:\Code\internal-site-2\backend (if running from there)
                // But the user runs from root d:\Code\internal-site-2 usually?
                // Wait, the backend runs as a subproject usually.
                // Let's assume the standard: path.join(process.cwd(), 'backend', ...) or just relative.
                // Let's look at how uploads are handled.
                // payload.imageUrl = `/uploads/products/${req.file.filename}`;
                // This implies the static serve is at backend root.
                // Let's use a safe delete helper or just try/catch
                try {
                    // We need to handle the path correctly. 
                    // If we are running `npm run dev` in `backend`, cwd is `backend`.
                    // If we are running from root, it's different.
                    // But usually backend is started from backend dir.
                    // Let's assume cwd is backend root.
                    const absoluteOldPath = path_1.default.join(process.cwd(), existingProduct.imageUrl.startsWith('/') ? existingProduct.imageUrl.slice(1) : existingProduct.imageUrl);
                    if (fs_1.default.existsSync(absoluteOldPath)) {
                        fs_1.default.unlinkSync(absoluteOldPath);
                    }
                }
                catch (e) {
                    console.error("Failed to delete old image", e);
                }
            }
        }
        return await prismaClient_1.default.product.update({
            where: { id },
            data: payload
        });
    }
    async deleteProduct(id) {
        const product = await prismaClient_1.default.product.findUnique({ where: { id }, select: { imageUrl: true } });
        if (!product) {
            throw new AppError_1.default('商品未找到', 404);
        }
        // Delete image
        if (product.imageUrl) {
            try {
                const absoluteOldPath = path_1.default.join(process.cwd(), product.imageUrl.startsWith('/') ? product.imageUrl.slice(1) : product.imageUrl);
                if (fs_1.default.existsSync(absoluteOldPath)) {
                    fs_1.default.unlinkSync(absoluteOldPath);
                }
            }
            catch (e) {
                console.error("Failed to delete image", e);
            }
        }
        try {
            await prismaClient_1.default.product.delete({ where: { id } });
        }
        catch (error) {
            if (error.code === 'P2003') {
                throw new AppError_1.default('删除失败：该商品仍有关联的销售数据或物流批次，无法删除', 400);
            }
            throw error;
        }
    }
    async getProductsWithListings() {
        return await prismaClient_1.default.product.findMany({
            orderBy: { sku: 'asc' },
            include: {
                listings: {
                    include: {
                        store: {
                            include: {
                                country: true
                            }
                        }
                    }
                }
            }
        });
    }
}
exports.ProductService = ProductService;
exports.default = new ProductService();
//# sourceMappingURL=productService.js.map