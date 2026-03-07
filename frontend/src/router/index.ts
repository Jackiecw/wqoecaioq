import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Lazy load components
const AppLayout = () => import('../layout/AppLayout.vue');
const Login = () => import('../views/Login.vue');

// Existing Components
const DashboardHome = () => import('../components/dashboard/DashboardHome.vue');
const CalendarPage = () => import('../views/CalendarPage.vue');
const WeeklyReportPage = () => import('../views/WeeklyReportPage.vue');
const SalesDashboard = () => import('../components/sales/SalesDashboard.vue');
const SalesDataPage = () => import('../views/SalesDataPage.vue');
const DataImport = () => import('../components/sales/DataImport.vue');
const ImportHistory = () => import('../components/sales/ImportHistory.vue');
const OnSaleProductsPage = () => import('../views/OnSaleProductsPage.vue');
const ProductManagement = () => import('../components/admin/ProductManagement.vue');
const OperationsCenter = () => import('../views/OperationsCenter.vue');
const AdvertisingDataManagement = () => import('../components/operations/AdvertisingDataManagement.vue');
const TrafficDataManagement = () => import('../components/operations/TrafficDataManagement.vue');
const FinancePage = () => import('../views/FinancePage.vue');
const LogisticsPage = () => import('../views/LogisticsPage.vue');
const CommonLinks = () => import('../components/dashboard/CommonLinks.vue');
const StoreManagement = () => import('../components/admin/StoreManagement.vue');
const CountryManagement = () => import('../components/admin/CountryManagement.vue');
const UserManagement = () => import('../components/admin/UserManagement.vue');
const ProfileManagement = () => import('../components/admin/ProfileManagement.vue');
const MetricManagement = () => import('../components/admin/MetricManagement.vue');

// Performance Module
const PerformanceDashboard = () => import('../views/performance/PerformanceDashboard.vue');
const PerformanceTemplateList = () => import('../views/performance/PerformanceTemplateList.vue');
const PerformanceDetail = () => import('../views/performance/PerformanceDetail.vue');

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', component: DashboardHome, meta: { permission: 'DASHBOARD:VIEW' } },
            { path: 'calendar', component: CalendarPage, meta: { permission: 'CALENDAR:VIEW' } },
            { path: 'reports', component: WeeklyReportPage, meta: { permission: 'REPORTS:FILL' } },

            // Sales
            { path: 'sales/dashboard', component: SalesDashboard, meta: { permission: 'SALES:VIEW' } },
            { path: 'sales/data', component: SalesDataPage, meta: { permission: 'SALES:VIEW' } },
            { path: 'sales/import', component: DataImport, meta: { permission: 'SALES:IMPORT' } },
            { path: 'sales/history', component: ImportHistory, meta: { permission: 'SALES:IMPORT' } },

            // Operations
            { path: 'products/on-sale', component: OnSaleProductsPage, meta: { permission: 'STORE_LISTINGS:VIEW' } },
            { path: 'products/catalog', component: ProductManagement, meta: { permission: 'PRODUCTS:VIEW' } },
            { path: 'operations', component: OperationsCenter },
            { path: 'operations/advertising', component: AdvertisingDataManagement, meta: { permission: 'ADVERTISING:VIEW' } },
            { path: 'operations/traffic', component: TrafficDataManagement, meta: { permission: 'TRAFFIC:VIEW' } },
            { path: 'finance', component: FinancePage, meta: { permission: 'FINANCE:VIEW' } },
            { path: 'logistics', component: LogisticsPage, meta: { permission: 'LOGISTICS:VIEW' } },

            // Resources
            { path: 'links', component: CommonLinks, meta: { permission: 'LINKS:VIEW' } },

            // Management
            { path: 'admin/countries', component: CountryManagement, meta: { permission: 'ADMIN_COUNTRIES:VIEW' } },
            { path: 'admin/stores', component: StoreManagement, meta: { permission: 'ADMIN_STORES:VIEW' } },
            { path: 'admin/users', component: UserManagement, meta: { permission: 'ADMIN_USERS:VIEW' } },
            { path: 'admin/metrics', component: MetricManagement, meta: { permission: 'ADMIN_METRICS:VIEW' } },

            // Profile (no permission needed - personal page)
            { path: 'profile', component: ProfileManagement },

            // Performance Module
            { path: 'performance', component: PerformanceDashboard, meta: { permission: 'PERFORMANCE:VIEW' } },
            { path: 'performance/templates', component: PerformanceTemplateList, meta: { permission: 'PERFORMANCE:MANAGE' } },
            { path: 'performance/reviews/:id', component: PerformanceDetail, meta: { permission: 'PERFORMANCE:VIEW' } }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // 未登录 → 跳转 login
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        return next('/login');
    }

    // 权限检查：如果路由有 permission 要求
    const requiredPermission = to.meta.permission as string | undefined;
    if (requiredPermission && authStore.isLoggedIn) {
        const userRole = authStore.role;
        const userPerms = authStore.permissions || [];

        // admin 角色自动通过
        if (userRole !== 'admin' && !userPerms.includes(requiredPermission)) {
            // 权限不足 → 跳转首页
            return next('/');
        }
    }

    next();
});

export default router;

