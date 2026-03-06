"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicDataImporter = void 0;
const XLSX = __importStar(require("xlsx"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DynamicDataImporter {
    static async parseAdvertisingPreview(filePath, storeId) {
        return this.parseDynamicPreview(filePath, storeId, 'ADVERTISING');
    }
    static async parseTrafficPreview(filePath, storeId) {
        return this.parseDynamicPreview(filePath, storeId, 'TRAFFIC');
    }
    static async parseDynamicPreview(filePath, storeId, type) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // 使用 defval: null 保留所有列
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        if (!rawData || rawData.length === 0) {
            throw new Error('The uploaded Excel file is empty.');
        }
        // 获取有效的表头
        const headers = Object.keys(rawData[0]);
        // 取出系统中该类型配置的活跃指标
        const activeMetrics = await prisma.metricDefinition.findMany({
            where: { type, isActive: true }
        });
        const parsedData = [];
        rawData.forEach((row, index) => {
            const result = {
                recordDate: new Date(),
                storeId,
                currency: 'CNY',
                metrics: {},
                rawData: row,
                hasError: false
            };
            try {
                // 尝试从常见列名中获取日期 (Date, 日期, Record Date)
                const dateKey = headers.find((h) => h.toLowerCase().includes('date') || h.includes('日期'));
                if (dateKey && row[dateKey]) {
                    const parsedDate = new Date(row[dateKey]);
                    if (isNaN(parsedDate.getTime())) {
                        // 尝试解析 Excel 序列号日期
                        if (typeof row[dateKey] === 'number') {
                            const excelStart = new Date(1899, 11, 30);
                            result.recordDate = new Date(excelStart.getTime() + row[dateKey] * 86400000);
                        }
                        else {
                            throw new Error('Invalid date format');
                        }
                    }
                    else {
                        result.recordDate = parsedDate;
                    }
                }
                else {
                    throw new Error('Missing date column (must contain ' + "'date'" + ' or ' + "'日期'" + ' in header)');
                }
                // 提取动态指标数据
                activeMetrics.forEach((metric) => {
                    // 灵活匹配表头：包含 name 或 label
                    const matchedHeader = headers.find((h) => h.toLowerCase() === metric.name.toLowerCase() ||
                        h.toLowerCase() === metric.label.toLowerCase() ||
                        h.includes(metric.label));
                    if (matchedHeader && row[matchedHeader] !== null) {
                        const rawVal = row[matchedHeader];
                        let val = rawVal;
                        // 尝试去除逗号、货币符号后转为数字
                        if (typeof rawVal === 'string') {
                            const cleaned = rawVal.replace(/[^\d.-]/g, '');
                            if (cleaned !== '') {
                                val = parseFloat(cleaned);
                            }
                        }
                        result.metrics[metric.name] = (typeof val === 'number' && !isNaN(val)) ? val : rawVal;
                    }
                });
            }
            catch (err) {
                result.hasError = true;
                result.errorMessage = `Row ${index + 2}: ${err.message}`;
            }
            parsedData.push(result);
        });
        return {
            headers,
            data: parsedData
        };
    }
}
exports.DynamicDataImporter = DynamicDataImporter;
//# sourceMappingURL=DynamicDataImporter.js.map