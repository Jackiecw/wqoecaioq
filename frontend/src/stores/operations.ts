import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useOperationsStore = defineStore('operations', () => {
    // 状态
    const countryCode = ref<string | null>(null);
    const storeId = ref<string | null>(null);

    // 初始化：从 localStorage 读取持久化状态
    const savedCountry = localStorage.getItem('ops_countryCode');
    const savedStore = localStorage.getItem('ops_storeId');

    if (savedCountry) {
        countryCode.value = savedCountry;
    }
    if (savedStore) {
        storeId.value = savedStore;
    }

    // 监听状态变化并持久化
    watch(countryCode, (newVal) => {
        if (newVal) {
            localStorage.setItem('ops_countryCode', newVal);
        } else {
            localStorage.removeItem('ops_countryCode');
        }
        // 当国家改变时，清空选中的店铺
        storeId.value = null;
    });

    watch(storeId, (newVal) => {
        if (newVal) {
            localStorage.setItem('ops_storeId', newVal);
        } else {
            localStorage.removeItem('ops_storeId');
        }
    });

    return {
        countryCode,
        storeId
    };
});
