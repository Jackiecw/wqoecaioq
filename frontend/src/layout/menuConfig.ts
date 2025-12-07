import type { RouteLocationNormalizedLoaded } from 'vue-router';

/**
 * 菜单项接口
 */
export interface NavItem {
    /** 菜单项唯一标识 */
    key: string;
    /** 显示文本 */
    name: string;
    /** 路由路径 */
    path: string;
    /** PrimeVue 图标名称 */
    icon: string;
    /** 徽章标记 */
    badge?: string;
    /** 子菜单项 */
    children?: NavItem[];
}

/**
 * 菜单组接口
 */
export interface NavGroup {
    /** 菜单组唯一标识 */
    key: string;
    /** 分组标题 */
    title: string;
    /** 分组描述 */
    description: string;
    /** 菜单项列表 */
    items: NavItem[];
}

/**
 * 全局菜单配置
 * 包含所有菜单分组和菜单项的定义
 */
export const MENU_GROUPS: NavGroup[] = [
    {
        key: 'workspace',
        title: '工作区',
        description: '概览 · 节奏',
        items: [
            {
                key: 'DASHBOARD',
                name: '仪表盘',
                path: '/',
                icon: 'pi pi-home',
                badge: 'live'
            },
            {
                key: 'CALENDAR',
                name: '工作日历',
                path: '/calendar',
                icon: 'pi pi-calendar',
                badge: 'team'
            },
            {
                key: 'REPORTS',
                name: '周报中心',
                path: '/reports',
                icon: 'pi pi-book'
            },
        ],
    },
    {
        key: 'sales',
        title: '销售数据',
        description: '明细 · 导入',
        items: [
            {
                key: 'SALES_VISUALIZATION',
                name: '数据看板',
                path: '/sales/dashboard',
                icon: 'pi pi-chart-bar',
                badge: 'new'
            },
            {
                key: 'SALES_DATA',
                name: '销售明细',
                path: '/sales/data',
                icon: 'pi pi-list'
            },
            {
                key: 'SALES_IMPORT',
                name: '数据导入',
                path: '/sales/import',
                icon: 'pi pi-upload'
            },
        ],
    },
    {
        key: 'operations',
        title: '业务运营',
        description: '销售 · 运营 · 财务',
        items: [
            {
                key: 'ON_SALE_PRODUCTS',
                name: '店铺在售',
                path: '/products/on-sale',
                icon: 'pi pi-shopping-bag'
            },
            {
                key: 'PRODUCT_CATALOG',
                name: '产品目录',
                path: '/products/catalog',
                icon: 'pi pi-tags'
            },
            {
                key: 'OPERATION_CENTER',
                name: '运营中心',
                path: '/operations',
                icon: 'pi pi-cog'
            },
            {
                key: 'FINANCE_ADMIN',
                name: '财务管理',
                path: '/finance',
                icon: 'pi pi-wallet'
            },
            {
                key: 'LOGISTICS_MGMT',
                name: '生产与物流',
                path: '/logistics',
                icon: 'pi pi-box'
            },
            {
                key: 'PERFORMANCE_MGMT',
                name: '绩效管理',
                path: '/performance',
                icon: 'pi pi-chart-line',
                badge: 'beta'
            },
        ],
    },
    {
        key: 'resources',
        title: '协作资源',
        description: '常用资料 · 链接',
        items: [
            {
                key: 'LINKS',
                name: '常用链接',
                path: '/links',
                icon: 'pi pi-link'
            }
        ],
    },
    {
        key: 'management',
        title: '组织配置',
        description: '门店 · 人员',
        items: [
            {
                key: 'ADMIN_STORES',
                name: '店铺管理',
                path: '/admin/stores',
                icon: 'pi pi-shop'
            },
            {
                key: 'ADMIN_USERS',
                name: '员工配置与管理',
                path: '/admin/users',
                icon: 'pi pi-users'
            },
        ],
    },
    {
        key: 'admin',
        title: '系统管理',
        description: '国家 · 角色',
        items: [
            {
                key: 'ADMIN_COUNTRIES',
                name: '国家管理',
                path: '/admin/countries',
                icon: 'pi pi-globe'
            },
        ],
    }
];

/**
 * 根据当前路由获取页面标题
 * 优先匹配最长路径，确保子路由能正确显示
 * 
 * @param route - Vue Router 的路由对象
 * @returns 当前页面的标题，如果找不到则返回 'Dashboard'
 */
export function getCurrentPageTitle(route: RouteLocationNormalizedLoaded): string {
    const currentPath = route.path;

    // 特殊路径处理
    if (currentPath === '/profile') return '个人中心';

    // 用于存储匹配结果，优先匹配最长路径
    let matchedItem: NavItem | null = null;
    let longestMatchLength = 0;

    for (const group of MENU_GROUPS) {
        for (const item of group.items) {
            // 检查当前路径是否匹配菜单项路径
            const isMatch = currentPath.startsWith(item.path) &&
                (item.path !== '/' || currentPath === '/');

            if (isMatch && item.path.length > longestMatchLength) {
                matchedItem = item;
                longestMatchLength = item.path.length;
            }
        }
    }

    return matchedItem?.name || 'Dashboard';
}
