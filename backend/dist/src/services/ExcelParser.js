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
const XLSX = __importStar(require("xlsx"));
class ExcelParser {
    /**
     * Parse Excel file and return standardized order data
     * @param {string} filePath
     * @param {string} [platform] - Optional, if not provided, will try to detect
     */
    static parse(filePath, platform) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Use raw: false to get formatted strings if needed, but raw: true is better for numbers usually.
        // However, Shopee might be text. Let's use default (raw: true usually).
        const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
        if (!platform) {
            platform = this.detectPlatform(data) || undefined;
        }
        if (platform === 'SHOPEE') {
            return { platform, data: this.parseShopee(data) };
        }
        else if (platform === 'TIKTOK_SHOP') {
            return { platform, data: this.parseTikTok(data) };
        }
        else {
            throw new Error('Unknown platform or unable to detect platform');
        }
    }
    static detectPlatform(data) {
        if (!data || data.length === 0)
            return null;
        // Check first row keys
        const keys = Object.keys(data[0]);
        // Shopee usually has 'No. Pesanan'
        if (keys.some(k => k.includes('No. Pesanan') || k.includes('Order ID'))) {
            // Both might have Order ID, need to distinguish
            if (keys.includes('Status Pesanan'))
                return 'SHOPEE';
            if (keys.includes('Order Status'))
                return 'TIKTOK_SHOP';
        }
        return null;
    }
    static mapStatus(platform, rawStatus) {
        if (!rawStatus)
            return null;
        const status = rawStatus.trim();
        // Shopee special dynamic status
        if (platform === 'SHOPEE' && status.startsWith('Pesanan diterima, namun Pembeli masih dapat mengajukan pengembalian hingga')) {
            return 'COMPLETED';
        }
        const STATUS_MAP = {
            SHOPEE: {
                'Belum Bayar': 'PENDING',
                'Perlu Dikirim': 'READY_TO_SHIP',
                'Sedang Dikirim': 'SHIPPED',
                'Telah Dikirim': 'SHIPPED',
                'Pesanan Diterima': 'COMPLETED',
                'Selesai': 'COMPLETED',
                'Batal': 'CANCELLED',
                'Pengembalian': 'RETURNED'
            },
            TIKTOK_SHOP: {
                'Unpaid': 'PENDING',
                'Awaiting Shipment': 'READY_TO_SHIP',
                'To ship': 'READY_TO_SHIP',
                'Awaiting Collection': 'READY_TO_SHIP',
                'Shipped': 'SHIPPED',
                'In Transit': 'SHIPPED',
                'Delivered': 'DELIVERED',
                'Completed': 'COMPLETED',
                'Canceled': 'CANCELLED',
                'Returned': 'RETURNED'
            }
        };
        return STATUS_MAP[platform]?.[status] || status; // Fallback to raw status if not mapped
    }
    /**
     * 取消/退货原因翻译映射
     */
    static mapCancelReason(platform, rawReason) {
        if (!rawReason)
            return null;
        const reason = rawReason.trim();
        if (!reason)
            return null;
        const SHOPEE_CANCEL_REASON_MAP = {
            'Dibatalkan oleh Pembeli. Alasan: Lainnya/ berubah pikiran': '买家取消：其他/改变主意',
            'Dibatalkan oleh Pembeli. Alasan: Ubah Pesanan yang Ada': '买家取消：修改现有订单',
            'Dibatalkan oleh Pembeli. Alasan: Proses pembayaran sulit': '买家取消：支付流程困难',
            'Dibatalkan oleh Pembeli. Alasan: Need to change delivery address': '买家取消：需更改收货地址',
            'Dibatalkan secara otomatis oleh sistem Shopee. Alasan: Penjual tidak mengatur pengiriman tepat waktu': '系统自动取消：卖家未及时安排发货',
            'Dibatalkan secara otomatis oleh sistem Shopee. Alasan: Pesanan belum dibayar': '系统自动取消：订单未付款',
            'Dibatalkan oleh Pembeli. Alasan: Lainnya': '买家取消：其他原因',
            'Dibatalkan secara otomatis oleh sistem Shopee. Alasan: Pengiriman gagal': '系统自动取消：配送失败',
            'Dibatalkan oleh Pembeli. Alasan: Perlu mengubah pesanan': '买家取消：需修改订单',
            'Dibatalkan oleh Pembeli. Alasan: Tidak ingin membeli lagi': '买家取消：不想再购买',
            'Dibatalkan oleh Pembeli. Alasan: Perlu mengubah alamat pengiriman': '买家取消：需更改收货地址',
            'Dibatalkan secara otomatis oleh sistem Shopee. Alasan: Paket hilang di perjalanan. Kompensasi yang memenuhi syarat telah dikreditkan ke Saldo Penjual-mu.': '系统自动取消：包裹运输途中丢失并已赔付',
            'Dibatalkan secara otomatis oleh sistem Shopee. Alasan: Lainnya': '系统自动取消：其他原因',
            'Dibatalkan oleh Pembeli. Alasan: Perlu mengubah Voucher': '买家取消：需更改优惠券'
        };
        const TIKTOK_CANCEL_REASON_MAP = {
            'Better price available': '其他渠道价格更优',
            'Customer overdue to pay': '买家逾期未付款',
            'High delivery costs': '运费过高',
            'Need to change color or size': '需更改颜色或尺寸',
            'Need to change payment method': '需更改支付方式',
            'Need to change shipping address': '需更改收货地址',
            'No longer needed': '不再需要',
            'Out of stock': '缺货',
            'Package delivery failed': '包裹配送失败',
            'Payment method not available': '支付方式不可用',
            'Pricing error': '价格错误',
            'Buyer cancelled': '买家取消',
            'Seller cancelled': '卖家取消',
            'System cancelled': '系统取消',
        };
        if (platform === 'SHOPEE') {
            return SHOPEE_CANCEL_REASON_MAP[reason] || reason;
        }
        else if (platform === 'TIKTOK_SHOP') {
            return TIKTOK_CANCEL_REASON_MAP[reason] || reason;
        }
        return reason;
    }
    static parseShopee(data) {
        return data.map(row => {
            // Shopee: "2.866.250" -> need to remove dots
            const revenue = this.parseAmount(row['Total Harga Produk']);
            const unitPrice = this.parseAmount(row['Harga Setelah Diskon']);
            // Date: "Waktu Pesanan Dibuat" -> "2023-10-27 10:00"
            let orderDate = new Date();
            if (row['Waktu Pesanan Dibuat']) {
                orderDate = new Date(row['Waktu Pesanan Dibuat']);
            }
            // 取消原因: "Alasan Pembatalan" 列
            const rawCancelReason = row['Alasan Pembatalan'] || null;
            return {
                platformOrderId: String(row['No. Pesanan']).trim(),
                orderStatus: this.mapStatus('SHOPEE', row['Status Pesanan']),
                cancelReason: this.mapCancelReason('SHOPEE', rawCancelReason),
                title: row['Nama Produk'] ? String(row['Nama Produk']).trim() : null,
                sku: row['Nomor Referensi SKU'] ? String(row['Nomor Referensi SKU']).trim() : (row['SKU Induk'] ? String(row['SKU Induk']).trim() : null),
                variationName: row['Nama Variasi'] ? String(row['Nama Variasi']).trim() : null,
                platformSkuId: null, // Shopee 导出的普通表没有商品级唯一ID
                quantity: parseInt(row['Jumlah'] || '1', 10),
                unitPrice: unitPrice,
                revenue: revenue,
                orderDate: orderDate,
                platform: 'SHOPEE',
                rawData: row
            };
        });
    }
    static parseTikTok(data) {
        return data
            .filter(row => {
            const orderId = row['Order ID'];
            // Filter out empty rows or comment rows (TikTok export has a comment row below header)
            return orderId && String(orderId).trim() !== 'Platform unique order ID.';
        })
            .map(row => {
            // TikTok: usually raw numbers
            const revenue = this.parseAmount(row['SKU Subtotal After Discount']);
            const unitPrice = this.parseAmount(row['SKU Unit Original Price']);
            // Date: "Order Created Time"
            let orderDate = new Date();
            if (row['Order Created Time']) {
                orderDate = new Date(row['Order Created Time']);
            }
            // 取消原因: "Cancel Reason" 列
            const rawCancelReason = row['Cancel Reason'] || null;
            return {
                platformOrderId: String(row['Order ID']).trim(), // Ensure string
                orderStatus: this.mapStatus('TIKTOK_SHOP', row['Order Status']),
                cancelReason: this.mapCancelReason('TIKTOK_SHOP', rawCancelReason),
                title: row['Product Name'] ? String(row['Product Name']).trim() : null,
                sku: row['Seller SKU'] ? String(row['Seller SKU']).trim() : null,
                variationName: row['Variation'] ? String(row['Variation']).trim() : null,
                platformSkuId: row['SKU ID'] ? String(row['SKU ID']).trim() : null,
                quantity: parseInt(row['Quantity'] || '1', 10),
                unitPrice: unitPrice,
                revenue: revenue,
                orderDate: orderDate,
                platform: 'TIKTOK_SHOP',
                rawData: row
            };
        });
    }
    static parseAmount(value) {
        if (typeof value === 'number')
            return value;
        if (!value)
            return 0;
        let str = value.toString();
        // Remove 'Rp', spaces
        str = str.replace(/[Rp\s]/g, '');
        // Indonesian format: 1.000.000,00
        // Remove dots (thousand separator)
        // Replace comma with dot (decimal)
        if (str.includes('.') && str.includes(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
        }
        else if (str.includes(',')) {
            // 1000,00 -> 1000.00
            str = str.replace(',', '.');
        }
        else if (str.includes('.')) {
            // If only dots: "1.000" -> 1000
            // But "1.5" -> 1.5?
            // Context matters. For price "2.866.250", it's 2 million.
            // If it has 3 decimal places or more, likely thousand separator.
            // Or if it matches \d{1,3}(\.\d{3})*
            if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
                str = str.replace(/\./g, '');
            }
        }
        return parseFloat(str) || 0;
    }
}
exports.default = ExcelParser;
//# sourceMappingURL=ExcelParser.js.map