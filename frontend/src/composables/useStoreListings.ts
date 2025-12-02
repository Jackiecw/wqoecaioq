import { ref, computed } from 'vue';
import apiClient from '../services/apiClient'; // Updated import path to use apiClient.ts
import { useAuthStore } from '../stores/auth';

// Define types
interface Store {
    id: string;
    name: string;
    countryCode: string;
    platform: string;
    country?: {
        code: string;
        name: string;
    };
}

interface Listing {
    id: string;
    platformListingId: string;
    title: string;
    sku: string;
    storeId: string;
}

const storesCache = ref<Store[]>([]);
const storesLoaded = ref(false);
const storesLoading = ref(false);
const storesError = ref('');

const listingCache = ref(new Map<string, Listing[]>());
const listingLoading = ref(new Map<string, boolean>());
const listingError = ref(new Map<string, string>());

function resetListingState(storeId: string) {
    listingCache.value.delete(storeId);
    listingLoading.value.delete(storeId);
    listingError.value.delete(storeId);
}

async function fetchStores(force = false) {
    if (storesLoaded.value && !force) {
        return storesCache.value;
    }
    if (storesLoading.value) {
        return storesCache.value;
    }

    storesLoading.value = true;
    storesError.value = '';
    try {
        const response = await apiClient.get('/stores-list');
        storesCache.value = Array.isArray(response.data) ? response.data : [];
        storesLoaded.value = true;
    } catch (error: any) {
        storesError.value = error.response?.data?.error || '获取店铺列表失败';
        storesCache.value = [];
        storesLoaded.value = false;
    } finally {
        storesLoading.value = false;
    }
    return storesCache.value;
}

function getStoresByCountry(countryCode: string) {
    if (!countryCode) return storesCache.value;
    return storesCache.value.filter((store) => store.countryCode === countryCode);
}

function getStoresByCountryAndPlatform(countryCode: string, platform: string) {
    return storesCache.value.filter(
        (store) =>
            (!countryCode || store.countryCode === countryCode) &&
            (!platform || store.platform === platform)
    );
}

async function fetchListings(storeId: string, force = false) {
    if (!storeId) {
        return [];
    }

    if (!force && listingCache.value.has(storeId)) {
        return listingCache.value.get(storeId) || [];
    }

    if (listingLoading.value.get(storeId)) {
        return listingCache.value.get(storeId) || [];
    }

    listingLoading.value.set(storeId, true);
    listingError.value.set(storeId, '');
    try {
        const response = await apiClient.get(`/stores/${storeId}/listings`);
        const data = Array.isArray(response.data) ? response.data : [];
        listingCache.value.set(storeId, data);
        return data;
    } catch (error: any) {
        const message = error.response?.data?.error || '无法加载店铺链接';
        listingError.value.set(storeId, message);
        listingCache.value.delete(storeId);
        throw new Error(message);
    } finally {
        listingLoading.value.set(storeId, false);
    }
}

function invalidateStore(storeId: string) {
    resetListingState(storeId);
}

function invalidateAllListings() {
    listingCache.value.clear();
    listingLoading.value.clear();
    listingError.value.clear();
}

function useStoreListings() {
    const authStore = useAuthStore();
    const permittedCountries = computed(() => {
        if (authStore.role === 'admin') {
            return storesCache.value
                .map((store) => store.country?.code)
                .filter(Boolean) as string[];
        }
        return authStore.operatedCountries;
    });

    return {
        stores: storesCache,
        storesLoaded,
        storesLoading,
        storesError,
        fetchStores,
        getStoresByCountry,
        getStoresByCountryAndPlatform,
        permittedCountries,
        fetchListings,
        listingCache,
        listingLoading,
        listingError,
        invalidateStore,
        invalidateAllListings,
    };
}

export default useStoreListings;
