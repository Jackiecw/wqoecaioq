import { Request, Response, NextFunction } from 'express';
import productService from '../services/productService';
import { z } from 'zod';
import { ProductCategory, OS_Type, Focus_Method, Keystone_Method } from '@prisma/client';
import AppError from '../utils/AppError';

// Validation Schemas
const productSchema = z.object({
    sku: z.string().min(1, "SKU 不能为空"),
    name: z.string().min(1, "商品名称不能为空"),
    description: z.string().optional().nullable(),
    category: z.nativeEnum(ProductCategory),

    publicName: z.string().optional().nullable(),

    cost: z.preprocess(val => parseFloat(val as string) || null, z.number().optional().nullable()),
    weightKg: z.preprocess(val => parseFloat(val as string) || null, z.number().optional().nullable()),
    lengthMm: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),
    widthMm: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),
    heightMm: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),

    resolution: z.string().optional().nullable(),
    brightnessAnsi: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),
    brightnessUniformity: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),
    lightSourceBrightness: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),
    noiseDb: z.preprocess(val => parseInt(val as string) || null, z.number().int().optional().nullable()),
    contrastRatio: z.string().optional().nullable(),
    throwRatio: z.string().optional().nullable(),
    projectionSize: z.string().optional().nullable(),
    projectionDistance: z.string().optional().nullable(),

    chipset: z.string().optional().nullable(),
    ramRom: z.string().optional().nullable(),
    os: z.nativeEnum(OS_Type).optional().nullable(),
    focusMethod: z.nativeEnum(Focus_Method).optional().nullable(),
    keystone: z.nativeEnum(Keystone_Method).optional().nullable(),

    hasGimbal: z.preprocess(val => val === 'true' || val === true, z.boolean().optional().default(false)),
    wifiVersion: z.string().optional().nullable(),
    bluetoothVersion: z.string().optional().nullable(),
    autoObstacle: z.preprocess(val => val === 'true' || val === true, z.boolean().optional().default(false)),
    autoScreenFit: z.preprocess(val => val === 'true' || val === true, z.boolean().optional().default(false)),
});

export class ProductController {
    async getAllProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const products = await productService.getAllProducts();
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    async getProductOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const options = await productService.getProductOptions();
            res.json(options);
        } catch (error) {
            next(error);
        }
    }

    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = productSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }

            const product = await productService.createProduct(validation.data, req.file);
            res.status(201).json(product);
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const validation = productSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }

            const product = await productService.updateProduct(id, validation.data, req.file);
            res.json(product);
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await productService.deleteProduct(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getProductsWithListings(req: Request, res: Response, next: NextFunction) {
        try {
            const products = await productService.getProductsWithListings();
            res.json(products);
        } catch (error) {
            next(error);
        }
    }
}

export default new ProductController();
