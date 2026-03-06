import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export interface ParsedDynamicData {
    recordDate: Date;
    storeId: string;
    listingId?: string | null;
    currency: string;
    metrics: Record<string, any>;
    notes?: string | null;
    rawData: any;
    hasError?: boolean;
    errorMessage?: string;
}

export interface DynamicImportResult {
    headers: string[];
    data: ParsedDynamicData[];
}

export class DynamicDataImporter {
    static async parseAdvertisingPreview(filePath: string, storeId: string): Promise<DynamicImportResult> {
        return this.parseDynamicPreview(filePath, storeId, 'ADVERTISING');
    }

    static async parseTrafficPreview(filePath: string, storeId: string): Promise<DynamicImportResult> {
        return this.parseDynamicPreview(filePath, storeId, 'TRAFFIC');
    }

    private static async parseDynamicPreview(filePath: string, storeId: string, type: 'ADVERTISING' | 'TRAFFIC'): Promise<DynamicImportResult> {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // 使用 defval: null 保留所有列
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (!rawData || rawData.length === 0) {
            throw new Error('The uploaded Excel file is empty.');
        }

        // 获取有效的表头
        const headers = Object.keys(rawData[0]);

        // 取出系统中该类型配置的活跃指标
        const activeMetrics = await prisma.metricDefinition.findMany({
            where: { type, isActive: true }
        });

        const parsedData: ParsedDynamicData[] = [];
        rawData.forEach((row, index) => {
            const result: ParsedDynamicData = {
                recordDate: new Date(),
                storeId,
                currency: 'CNY',
                metrics: {},
                rawData: row,
                hasError: false
            };

            try {
                // 尝试从常见列名中获取日期 (Date, 日期, Record Date)
                const dateKey = headers.find((h: string) => h.toLowerCase().includes('date') || h.includes('日期'));
                if (dateKey && row[dateKey]) {
                    const parsedDate = new Date(row[dateKey]);
                    if (isNaN(parsedDate.getTime())) {
                        // 尝试解析 Excel 序列号日期
                        if (typeof row[dateKey] === 'number') {
                            const excelStart = new Date(1899, 11, 30);
                            result.recordDate = new Date(excelStart.getTime() + row[dateKey] * 86400000);
                        } else {
                            throw new Error('Invalid date format');
                        }
                    } else {
                        result.recordDate = parsedDate;
                    }
                } else {
                    throw new Error('Missing date column (must contain ' + "'date'" + ' or ' + "'日期'" + ' in header)');
                }

                // 提取动态指标数据
                activeMetrics.forEach((metric: any) => {
                    // 灵活匹配表头：包含 name 或 label
                    const matchedHeader = headers.find((h: string) =>
                        h.toLowerCase() === metric.name.toLowerCase() ||
                        h.toLowerCase() === metric.label.toLowerCase() ||
                        h.includes(metric.label)
                    );

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

            } catch (err: any) {
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
