"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../prismaClient', () => ({}));
const salesService_1 = require("../src/services/salesService");
(0, vitest_1.describe)('sales-data helper utilities', () => {
    (0, vitest_1.describe)('buildRecordDateFilter', () => {
        (0, vitest_1.it)('returns null when no dates provided', () => {
            (0, vitest_1.expect)((0, salesService_1.buildRecordDateFilter)(undefined, undefined)).toBeNull();
        });
        (0, vitest_1.it)('builds range when both dates are valid', () => {
            const result = (0, salesService_1.buildRecordDateFilter)('2025-01-01', '2025-01-05');
            (0, vitest_1.expect)(result).toEqual(vitest_1.expect.objectContaining({
                gte: new Date('2025-01-01'),
            }));
        });
    });
    (0, vitest_1.describe)('normalizePagination', () => {
        (0, vitest_1.it)('clamps page and pageSize', () => {
            const { page, pageSize, skip } = (0, salesService_1.normalizePagination)({ page: '-1', pageSize: '9999' });
            (0, vitest_1.expect)(page).toBe(1);
            (0, vitest_1.expect)(pageSize).toBeLessThanOrEqual(200);
            (0, vitest_1.expect)(skip).toBe(0);
        });
    });
    (0, vitest_1.describe)('buildSalesDataOrder', () => {
        (0, vitest_1.it)('preserves sort order even when field invalid', () => {
            const order = (0, salesService_1.buildSalesDataOrder)({ sortBy: 'unknown', sortOrder: 'asc' });
            (0, vitest_1.expect)(order).toEqual({ recordDate: 'asc' });
        });
    });
    (0, vitest_1.describe)('buildSalesDataWhere', () => {
        const baseUser = {
            role: 'operation',
            operatedCountries: ['ID'],
        };
        (0, vitest_1.it)('allows non-admin to query unauthorized country but returns restricted results', () => {
            const { where } = (0, salesService_1.buildSalesDataWhere)({ countryCode: 'TH' }, baseUser);
            // expect(error).toBeUndefined(); // buildSalesDataWhere no longer returns error, just where clause
            (0, vitest_1.expect)(where.store.countryCode).toBe('TH');
            (0, vitest_1.expect)(where.AND).toBeDefined();
        });
        (0, vitest_1.it)('allows admin to query any country', () => {
            const { where } = (0, salesService_1.buildSalesDataWhere)({ countryCode: 'TH' }, { role: 'admin' });
            (0, vitest_1.expect)(where.store).toEqual(vitest_1.expect.objectContaining({ countryCode: 'TH' }));
        });
    });
    (0, vitest_1.describe)('appendManagePermission', () => {
        (0, vitest_1.it)('sets canManage based on supervised countries or admin', () => {
            const rows = [
                { store: { countryCode: 'ID' } },
                { store: { countryCode: 'TH' } },
            ];
            const result = (0, salesService_1.appendManagePermission)(rows, ['ID'], false);
            (0, vitest_1.expect)(result[0].canManage).toBe(true);
            (0, vitest_1.expect)(result[1].canManage).toBe(false);
        });
    });
});
//# sourceMappingURL=salesData.utils.test.js.map