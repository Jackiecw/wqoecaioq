import { Request, Response, NextFunction } from 'express';
import managementService from '../services/managementService';
import { z } from 'zod';
import { Platform, StoreStatus } from '@prisma/client';
import AppError from '../utils/AppError';

// --- Zod Schemas ---
const storeSchema = z.object({
    name: z.string().min(1, "店铺名称不能为空"),
    platform: z.nativeEnum(Platform),
    countryCode: z.string().min(1, "必须选择一个国家"),
    status: z.nativeEnum(StoreStatus),
    platformStoreId: z.string().optional().nullable(),
    registeredAt: z.string().datetime().optional().nullable(),
});

const countrySchema = z.object({
    code: z.string().min(2, "国家代码 (Code) 至少需要2个字符").max(10),
    name: z.string().min(1, "国家名称不能为空"),
    establishedAt: z.string().datetime().optional().nullable(),
});

export class ManagementController {
    // --- Options ---
    async getOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const options = await managementService.getOptions();
            res.json(options);
        } catch (error) {
            next(error);
        }
    }

    async getStorePlatforms(req: Request, res: Response, next: NextFunction) {
        try {
            const options = await managementService.getOptions();
            res.json(options.platforms);
        } catch (error) {
            next(error);
        }
    }

    // --- Stores ---
    async getAllStores(req: Request, res: Response, next: NextFunction) {
        try {
            const stores = await managementService.getAllStores();
            res.json(stores);
        } catch (error) {
            next(error);
        }
    }

    async getStoreById(req: Request, res: Response, next: NextFunction) {
        try {
            const store = await managementService.getStoreById(req.params.id);
            res.json(store);
        } catch (error) {
            next(error);
        }
    }

    async createStore(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = storeSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newStore = await managementService.createStore(validation.data);
            res.status(201).json(newStore);
        } catch (error) {
            next(error);
        }
    }

    async updateStore(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = storeSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedStore = await managementService.updateStore(req.params.id, validation.data);
            res.json(updatedStore);
        } catch (error) {
            next(error);
        }
    }

    async deleteStore(req: Request, res: Response, next: NextFunction) {
        try {
            await managementService.deleteStore(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // --- Countries ---
    async getAllCountries(req: Request, res: Response, next: NextFunction) {
        try {
            const countries = await managementService.getAllCountries();
            res.json(countries);
        } catch (error) {
            next(error);
        }
    }

    async createCountry(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = countrySchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newCountry = await managementService.createCountry(validation.data);
            res.status(201).json(newCountry);
        } catch (error) {
            next(error);
        }
    }

    async updateCountry(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = countrySchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedCountry = await managementService.updateCountry(req.params.id, validation.data);
            res.json(updatedCountry);
        } catch (error) {
            next(error);
        }
    }
}

export default new ManagementController();
