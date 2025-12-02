import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';

interface User {
    userId: string;
    username: string;
    nickname: string;
    role: string;
    permissions: string[];
    operatedCountries: string[];
    supervisedCountries: string[];
    avatarUrl?: string;
    exp: number;
    iat: number;
}

export const useAuthStore = defineStore('auth', () => {
    // 1. State
    const token = ref<string | null>(localStorage.getItem('token'));
    const user = ref<User | null>(null);

    // 2. Getters
    const isLoggedIn = computed(() => !!token.value);
    const nickname = computed(() => user.value?.nickname || '用户');
    const role = computed(() => user.value?.role || 'GUEST');

    // 菜单权限
    const permissions = computed(() => {
        const perms = user.value?.permissions || [];
        // TODO: Remove this dev hack
        if (!perms.includes('SALES_IMPORT')) {
            return [...perms, 'SALES_IMPORT'];
        }
        return perms;
    });

    // 国家权限
    const operatedCountries = computed(() => user.value?.operatedCountries || []);
    const supervisedCountries = computed(() => user.value?.supervisedCountries || []);

    // 头像 Getter
    const avatarUrl = computed(() => user.value?.avatarUrl || null);

    // 3. 核心解码函数
    function checkAndDecodeToken() {
        if (token.value) {
            try {
                const decoded = jwtDecode<User>(token.value);
                // 检查 Token 是否过期
                if (decoded.exp * 1000 > Date.now()) {
                    user.value = decoded;
                } else {
                    // Token 过期了
                    logout();
                }
            } catch (error) {
                // Token 格式错误
                logout();
            }
        } else {
            user.value = null;
        }
    }

    // 4. Actions
    function login(newToken: string) {
        localStorage.setItem('token', newToken);
        token.value = newToken;
        checkAndDecodeToken();
    }

    function logout() {
        localStorage.removeItem('token');
        token.value = null;
        user.value = null;
    }

    // 5. 应用加载时，立即检查一次
    checkAndDecodeToken();

    // 6. 暴露新 Getter
    return {
        token,
        user,
        isLoggedIn,
        nickname,
        role,
        permissions,
        operatedCountries,
        supervisedCountries,
        avatarUrl,
        login,
        logout
    };
});
