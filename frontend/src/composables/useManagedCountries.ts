import { ref } from 'vue';
import apiClient from '../services/apiClient';

// Define a basic interface for Country. Adjust fields based on actual API response.
export interface Country {
    id: number;
    code: string;
    name: string;
    currency: string;
    region: string;
}

const countries = ref<Country[]>([]);
const isLoadingCountries = ref(false);
const countriesError = ref('');
let loadedOnce = false;

async function fetchCountries(force = false) {
    if (isLoadingCountries.value || (loadedOnce && !force)) {
        return countries.value;
    }
    isLoadingCountries.value = true;
    countriesError.value = '';
    try {
        const response = await apiClient.get('/countries');
        // Ensure response.data is what we expect. 
        // If apiClient returns the data directly (interceptor), use response.
        // If it returns axios response, use response.data.
        // Assuming apiClient returns AxiosResponse based on typical usage.
        countries.value = Array.isArray(response.data) ? response.data : [];
        loadedOnce = true;
    } catch (error: any) {
        countriesError.value = error.response?.data?.error || '无法加载国家列表';
        countries.value = [];
    } finally {
        isLoadingCountries.value = false;
    }
    return countries.value;
}

export default function useManagedCountries() {
    return {
        countries,
        fetchCountries,
        countriesError,
        isLoadingCountries,
    };
}
