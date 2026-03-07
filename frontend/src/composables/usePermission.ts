import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

/**
 * 权限检查 composable
 *
 * 统一前端权限判断逻辑，替代分散在各组件中的 `authStore.role === 'admin'` 硬编码检查。
 *
 * 用法:
 *   const { hasPermission, isAdmin } = usePermission();
 *   const canExport = computed(() => hasPermission('FINANCE:EXPORT'));
 *   const canManage = computed(() => hasPermission('ADMIN_USERS:MANAGE'));
 */
export function usePermission() {
    const authStore = useAuthStore();

    /**
     * 检查当前用户是否拥有指定权限
     * admin 角色自动拥有所有权限
     */
    const hasPermission = (permission: string): boolean => {
        if (authStore.role === 'admin') return true;
        return authStore.permissions.includes(permission);
    };

    /**
     * 检查当前用户是否拥有所有指定权限
     */
    const hasAllPermissions = (...permissions: string[]): boolean => {
        if (authStore.role === 'admin') return true;
        return permissions.every((p) => authStore.permissions.includes(p));
    };

    /**
     * 检查当前用户是否拥有任意一个指定权限
     */
    const hasAnyPermission = (...permissions: string[]): boolean => {
        if (authStore.role === 'admin') return true;
        return permissions.some((p) => authStore.permissions.includes(p));
    };

    /**
     * 当前用户是否为管理员
     */
    const isAdmin = computed(() => authStore.role === 'admin');

    return {
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
        isAdmin,
    };
}
