import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore('global', () => {
    const selectedCountry = ref<string>('');
    const currency = ref<string>('USD');

    function setCountry(country: string) {
        selectedCountry.value = country;
    }

    function setCurrency(curr: string) {
        currency.value = curr;
    }

    return {
        selectedCountry,
        currency,
        setCountry,
        setCurrency
    };
});
