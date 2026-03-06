"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
class CategoryController {
    // 获取分类列表
    async getCategories(req, res) {
        try {
            const categories = await prismaClient_1.default.productCategory.findMany({
                orderBy: { name: 'asc' },
            });
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: '获取分类列表失败' });
        }
    }
    // 创建新分类
    async createCategory(req, res) {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: '分类名称不能为空' });
        }
        try {
            const newCategory = await prismaClient_1.default.productCategory.create({
                data: {
                    name: name.trim(),
                    description: description?.trim() || null,
                },
            });
            res.status(201).json(newCategory);
        }
        catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({ error: '分类名称已存在' });
            }
            console.error('Error creating category:', error);
            res.status(500).json({ error: '创建分类失败' });
        }
    }
    // 更新分类
    async updateCategory(req, res) {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: '分类名称不能为空' });
        }
        try {
            const updatedCategory = await prismaClient_1.default.productCategory.update({
                where: { id },
                data: {
                    name: name.trim(),
                    description: description?.trim() || null,
                },
            });
            res.json(updatedCategory);
        }
        catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({ error: '分类名称已存在' });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ error: '分类不存在' });
            }
            console.error('Error updating category:', error);
            res.status(500).json({ error: '更新分类失败' });
        }
    }
    // 删除分类
    async deleteCategory(req, res) {
        const { id } = req.params;
        try {
            await prismaClient_1.default.productCategory.delete({
                where: { id },
            });
            res.status(204).send();
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: '分类不存在' });
            }
            console.error('Error deleting category:', error);
            res.status(500).json({ error: '删除分类失败' });
        }
    }
}
exports.default = new CategoryController();
//# sourceMappingURL=categoryController.js.map