"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
class ListingMatcher {
    /**
     * Match a row to a StoreProductListing
     * @param {string} platform - SHOPEE or TIKTOK_SHOP
     * @param {string} title - Product Title
     * @param {string} sku - Product SKU (Seller SKU or Reference SKU)
     * @returns {Promise<{listingId: string|null, matchType: string|null}>}
     */
    static async match(platform, title, sku) {
        const platformEnum = platform;
        // 1. Try to find by ListingMapping first (Manual overrides)
        // We check if there is a mapping for this specific title or SKU on this platform
        const mapping = await prismaClient_1.default.listingMapping.findFirst({
            where: {
                platform: platformEnum,
                OR: [
                    { externalTitle: title || undefined },
                    { externalSku: sku || undefined }
                ]
            }
        });
        if (mapping) {
            return { listingId: mapping.listingId, matchType: 'MAPPING' };
        }
        // 2. Try to find by StoreProductListing.storeTitle (Exact Title match)
        // Title match is prioritized as per user request for "Same Product Multiple Links" scenario
        if (title) {
            const listingByTitle = await prismaClient_1.default.storeProductListing.findFirst({
                where: {
                    store: { platform: platformEnum },
                    storeTitle: title
                }
            });
            if (listingByTitle) {
                return { listingId: listingByTitle.id, matchType: 'TITLE' };
            }
        }
        // 3. Try to find by StoreProductListing.productCode (if SKU matches)
        if (sku) {
            const listingBySku = await prismaClient_1.default.storeProductListing.findFirst({
                where: {
                    store: { platform: platformEnum },
                    productCode: sku
                }
            });
            if (listingBySku) {
                return { listingId: listingBySku.id, matchType: 'SKU' };
            }
        }
        // 4. Try to find by Product.sku (if SKU matches internal SKU directly)
        // This assumes the platform SKU might be the internal SKU
        if (sku) {
            const listingByInternalSku = await prismaClient_1.default.storeProductListing.findFirst({
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
exports.default = ListingMatcher;
//# sourceMappingURL=ListingMatcher.js.map