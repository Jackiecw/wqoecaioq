import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/apiClient';

export interface Country {
    id: number;
    code: string;
    name: string;
    currency: string;
    region: string;
}

export const useCountriesStore = defineStore('countries', () => {
    const countries = ref<Country[]>([]);
    const isLoading = ref(false);
    const error = ref('');
    let loadedOnce = false;

    async function fetchCountries(force = false) {
        if (isLoading.value || (loadedOnce && !force)) {
            return countries.value;
        }
        isLoading.value = true;
        error.value = '';
        try {
            const response = await apiClient.get('/countries');
            countries.value = Array.isArray(response.data) ? response.data : [];
            loadedOnce = true;
        } catch (e: any) {
            error.value = e.response?.data?.error || '无法加载国家列表';
            countries.value = [];
        } finally {
            isLoading.value = false;
        }
        return countries.value;
    }

    function reset() {
        countries.value = [];
        error.value = '';
        loadedOnce = false;
    }

    return {
        countries,
        isLoading,
        error,
        fetchCountries,
        reset,
    };
});
