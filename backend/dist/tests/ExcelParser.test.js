"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const path_1 = __importDefault(require("path"));
const ExcelParser_1 = __importDefault(require("../src/services/ExcelParser"));
(0, vitest_1.describe)('ExcelParser', () => {
    // Adjust path to where the sample files are located
    // User said: internal-site/资料
    // backend is in internal-site/backend
    // so ../../资料
    const shopeeFile = path_1.default.resolve(__dirname, '../../资料/xp-1.xlsx');
    const tiktokFile = path_1.default.resolve(__dirname, '../../资料/TK-7.xlsx');
    (0, vitest_1.it)('should detect SHOPEE platform and parse data', () => {
        const result = ExcelParser_1.default.parse(shopeeFile);
        (0, vitest_1.expect)(result.platform).toBe('SHOPEE');
        (0, vitest_1.expect)(result.data.length).toBeGreaterThan(0);
        const firstRow = result.data[0];
        (0, vitest_1.expect)(firstRow.platformOrderId).toBeDefined();
        (0, vitest_1.expect)(firstRow.revenue).toBeTypeOf('number');
        (0, vitest_1.expect)(firstRow.orderDate).toBeInstanceOf(Date);
        // Check specific value from summary if known, e.g. revenue 2866250
        // Based on previous summary reading
        // row 0 revenue was 2.866.250
        // expect(firstRow.revenue).toBe(2866250);
    });
    (0, vitest_1.it)('should detect TIKTOK_SHOP platform and parse data', () => {
        const result = ExcelParser_1.default.parse(tiktokFile);
        (0, vitest_1.expect)(result.platform).toBe('TIKTOK_SHOP');
        (0, vitest_1.expect)(result.data.length).toBeGreaterThan(0);
        const firstRow = result.data[0];
        (0, vitest_1.expect)(firstRow.platformOrderId).toBeDefined();
        (0, vitest_1.expect)(firstRow.revenue).toBeTypeOf('number');
        (0, vitest_1.expect)(firstRow.orderDate).toBeInstanceOf(Date);
    });
    (0, vitest_1.it)('should parse Shopee amount correctly', () => {
        (0, vitest_1.expect)(ExcelParser_1.default.parseAmount("2.866.250")).toBe(2866250);
        (0, vitest_1.expect)(ExcelParser_1.default.parseAmount("Rp 10.000")).toBe(10000);
        (0, vitest_1.expect)(ExcelParser_1.default.parseAmount("1.000,00")).toBe(1000);
        (0, vitest_1.expect)(ExcelParser_1.default.parseAmount(100)).toBe(100);
    });
});
//# sourceMappingURL=ExcelParser.test.js.map