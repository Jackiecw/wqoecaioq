import * as XLSX from 'xlsx';

export interface ParsedOrder {
    platformOrderId: string;
    orderStatus: string | null;
    cancelReason: string | null;  // 新增：取消/退货原因
    title: string | null;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    revenue: number;
    orderDate: Date;
    platform: 'SHOPEE' | 'TIKTOK_SHOP';
    rawData: any;
}

export interface ParseResult {
    platform: 'SHOPEE' | 'TIKTOK_SHOP';
    data: ParsedOrder[];
}

class ExcelParser {
    /**
     * Parse Excel file and return standardized order data
     * @param {string} filePath 
     * @param {string} [platform] - Optional, if not provided, will try to detect
     */
    static parse(filePath: string, platform?: string): ParseResult {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Use raw: false to get formatted strings if needed, but raw: true is better for numbers usually.
        // However, Shopee might be text. Let's use default (raw: true usually).
        const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (!platform) {
            platform = this.detectPlatform(data) || undefined;
        }

        if (platform === 'SHOPEE') {
            return { platform, data: this.parseShopee(data) };
        } else if (platform === 'TIKTOK_SHOP') {
            return { platform, data: this.parseTikTok(data) };
        } else {
            throw new Error('Unknown platform or unable to detect platform');
        }
    }

    static detectPlatform(data: any[]): string | null {
        if (!data || data.length === 0) return null;
        // Check first row keys
        const keys = Object.keys(data[0]);

        // Shopee usually has 'No. Pesanan'
        if (keys.some(k => k.includes('No. Pesanan') || k.includes('Order ID'))) {
            // Both might have Order ID, need to distinguish
            if (keys.includes('Status Pesanan')) return 'SHOPEE';
            if (keys.includes('Order Status')) return 'TIKTOK_SHOP';
        }
        return null;
    }

    static mapStatus(platform: string, rawStatus: string): string | null {
        if (!rawStatus) return null;
        const status = rawStatus.trim();

        const STATUS_MAP: Record<string, Record<string, string>> = {
            SHOPEE: {
                'Belum Bayar': 'PENDING',
                'Perlu Dikirim': 'READY_TO_SHIP',
                'Sedang Dikirim': 'SHIPPED',
                'Telah Dikirim': 'SHIPPED',
                'Selesai': 'COMPLETED',
                'Batal': 'CANCELLED',
                'Pengembalian': 'RETURNED'
            },
            TIKTOK_SHOP: {
                'Unpaid': 'PENDING',
                'Awaiting Shipment': 'READY_TO_SHIP',
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
    static mapCancelReason(platform: string, rawReason: string | null | undefined): string | null {
        if (!rawReason) return null;
        const reason = rawReason.trim();
        if (!reason) return null;

        const SHOPEE_CANCEL_REASON_MAP: Record<string, string> = {
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
        };

        const TIKTOK_CANCEL_REASON_MAP: Record<string, string> = {
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
        } else if (platform === 'TIKTOK_SHOP') {
            return TIKTOK_CANCEL_REASON_MAP[reason] || reason;
        }

        return reason;
    }

    static parseShopee(data: any[]): ParsedOrder[] {
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
                quantity: parseInt(row['Jumlah'] || '1', 10),
                unitPrice: unitPrice,
                revenue: revenue,
                orderDate: orderDate,
                platform: 'SHOPEE',
                rawData: row
            };
        });
    }

    static parseTikTok(data: any[]): ParsedOrder[] {
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
                    quantity: parseInt(row['Quantity'] || '1', 10),
                    unitPrice: unitPrice,
                    revenue: revenue,
                    orderDate: orderDate,
                    platform: 'TIKTOK_SHOP',
                    rawData: row
                };
            });
    }

    static parseAmount(value: any): number {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        let str = value.toString();
        // Remove 'Rp', spaces
        str = str.replace(/[Rp\s]/g, '');

        // Indonesian format: 1.000.000,00
        // Remove dots (thousand separator)
        // Replace comma with dot (decimal)
        if (str.includes('.') && str.includes(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else if (str.includes(',')) {
            // 1000,00 -> 1000.00
            str = str.replace(',', '.');
        } else if (str.includes('.')) {
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

export default ExcelParser;
