import prisma from '../../prismaClient';
import { Platform } from '@prisma/client';

export interface MatchQuery {
    platform: string;
    title: string | null;
    sku: string | null;
    variationName?: string | null;
    platformSkuId?: string | null;
}

class ListingMatcher {
    /**
     * Match a row to a StoreProductListing using Dual-Track Combo Fingerprint Strategy
     */
    static async match(query: MatchQuery): Promise<{ listingId: string | null; matchType: string | null }> {
        const platformEnum = query.platform as Platform;
        const { title, sku, variationName, platformSkuId } = query;

        // 1. Dual-Track Mapping Lookup (Manual Overrides & Learned Mappings)
        let mapping = null;

        if (platformEnum === "TIKTOK_SHOP") {
            // TIKTOK: Platform + SKU ID + Seller SKU + Variation
            if (platformSkuId) {
                mapping = await prisma.listingMapping.findFirst({
                    where: {
                        platform: platformEnum,
                        platformSkuId: platformSkuId,
                        externalSku: sku || undefined
                    }
                });
                // 强校验（如果有variation参与）：因为我们之前的Schema设计了复合索引：[platform, platformSkuId, externalSku]
                // 为了防止换皮，建议精确匹配变体
                if (mapping && mapping.variationName && variationName && mapping.variationName !== variationName) {
                    mapping = null; // 变体名变异，抛弃原本映射
                }
            }
        } else if (platformEnum === "SHOPEE") {
            // SHOPEE: Platform + Title + Seller SKU + Variation
            // 前置模糊（去噪）可以后续在业务存入时做，现在的查询保持精确
            mapping = await prisma.listingMapping.findFirst({
                where: {
                    platform: platformEnum,
                    externalTitle: title || undefined,
                    externalSku: sku || undefined,
                    variationName: variationName || undefined
                }
            });
        }

        if (mapping) {
            return { listingId: mapping.listingId, matchType: 'MAPPING' };
        }

        // --- 以下为兜底的基础匹配逻辑（如果没找到指纹） ---

        // 2. Try to find by StoreProductListing.productCode (Exact SKU match is usually most reliable natively)
        // Only if it's the core productCode
        if (sku) {
            const listingBySku = await prisma.storeProductListing.findFirst({
                where: {
                    store: { platform: platformEnum },
                    productCode: sku
                }
            });
            if (listingBySku) {
                return { listingId: listingBySku.id, matchType: 'SKU' };
            }
        }

        // 3. Try to find by StoreProductListing.storeTitle (Exact Title match)
        if (title) {
            const listingByTitle = await prisma.storeProductListing.findFirst({
                where: {
                    store: { platform: platformEnum },
                    storeTitle: title
                }
            });
            if (listingByTitle) {
                return { listingId: listingByTitle.id, matchType: 'TITLE' };
            }
        }

        // 4. Try to find by Product.sku (if SKU matches internal SKU directly)
        if (sku) {
            const listingByInternalSku = await prisma.storeProductListing.findFirst({
                where: {
                    store: { platform: platformEnum },
                    product: { sku: sku }
                }
            });
            if (listingByInternalSku) {
                return { listingId: listingByInternalSku.id, matchType: 'INTERNAL_SKU' };
            }
        }

        return { listingId: null, matchType: null };
    }
}

export default ListingMatcher;
