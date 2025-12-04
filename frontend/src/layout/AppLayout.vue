<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- 移动端侧边栏 -->
    <Sidebar
      v-model:visible="mobileMenuOpen"
      position="left"
      class="mobile-sidebar"
      :modal="true"
      :block-scroll="true"
    >
      <div class="sidebar-mobile-content flex flex-col h-full">
        <!-- Logo -->
        <div class="brand px-3 pb-4 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <i class="pi pi-globe text-2xl text-indigo-600"></i>
            <h1 class="text-xl text-slate-900 font-bold">Overseas Ops</h1>
          </div>
          <p class="text-sm text-slate-500 mt-1">海外电商控制中心</p>
        </div>

        <!-- 移动端导航菜单 -->
        <nav class="flex-1 overflow-y-auto mt-4 px-3">
          <div class="flex flex-col gap-4">
            <section v-for="group in visibleMenuGroups" :key="group.key" class="nav-group">
              <div class="px-2 mb-2">
                <p class="text-xs font-semibold text-slate-500 uppercase">{{ group.title }}</p>
              </div>
              <div class="flex flex-col gap-1">
                <Button
                  v-for="item in group.items"
                  :key="item.key"
                  :label="item.name"
                  :icon="getItemIcon(item.key)"
                  class="w-full text-left justify-start px-3 py-2 text-sm"
                  :class="{ 
                    'bg-indigo-50 text-indigo-600 font-medium': isActive(item), 
                    'text-slate-700 hover:bg-slate-50': !isActive(item) 
                  }"
                  text
                  @click="() => { handleNav(item); mobileMenuOpen = false; }"
                />
              </div>
            </section>
          </div>
        </nav>

        <!-- 移动端底部按钮 -->
        <div class="mt-auto px-3 pb-3 border-t border-slate-200 pt-3">
          <Button 
            label="个人中心" 
            icon="pi pi-user" 
            severity="secondary" 
            text 
            class="w-full justify-start text-sm" 
            @click="goProfile" 
          />
          <Button 
            label="退出登录" 
            icon="pi pi-sign-out" 
            severity="danger" 
            text 
            class="w-full justify-start text-sm" 
            @click="handleLogout" 
          />
        </div>
      </div>
    </Sidebar>

    <!-- 桌面端左侧侧边栏 -->
    <AppSidebar />

    <!-- 右侧主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部导航栏 -->
      <AppTopbar @toggle-mobile-menu="mobileMenuOpen = true" />

      <!-- 主要内容区域 -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <router-view v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
import Sidebar from 'primevue/sidebar';
import Button from 'primevue/button';

type NavItem = { key: string; name: string; path: string; badge?: string };
type NavGroup = {
  key: string;
  title: string;
  description: string;
  items: NavItem[];
};

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const mobileMenuOpen = ref(false);

/**
 * 菜单配置 (与 AppSidebar 保持一致)
 */
const menuGroups: NavGroup[] = [
  {
    key: 'workspace',
    title: '工作区',
    description: '概览 · 节奏',
    items: [
      { key: 'DASHBOARD', name: '仪表盘', badge: 'live', path: '/' },
      { key: 'CALENDAR', name: '工作日历', badge: 'team', path: '/calendar' },
      { key: 'REPORTS', name: '周报中心', path: '/reports' },
    ],
  },
  {
    key: 'sales',
    title: '销售数据',
    description: '明细 · 导入',
    items: [
      { key: 'SALES_VISUALIZATION', name: '数据看板', badge: 'new', path: '/sales/dashboard' },
      { key: 'SALES_DATA', name: '销售明细', path: '/sales/data' },
      { key: 'SALES_IMPORT', name: '数据导入', path: '/sales/import' },
      { key: 'SALES_IMPORT_HISTORY', name: '导入记录', path: '/sales/history' },
    ],
  },
  {
    key: 'operations',
    title: '业务运营',
    description: '销售 · 运营 · 财务',
    items: [
      { key: 'ON_SALE_PRODUCTS', name: '店铺在售', path: '/products/on-sale' },
      { key: 'PRODUCT_CATALOG', name: '产品目录', path: '/products/catalog' },
      { key: 'OPERATION_CENTER', name: '运营中心', path: '/operations' },
      { key: 'FINANCE_ADMIN', name: '财务管理', path: '/finance' },
      { key: 'LOGISTICS_MGMT', name: '生产与物流', path: '/logistics' },
      { key: 'PERFORMANCE_MGMT', name: '绩效管理', badge: 'beta', path: '/performance' },
    ],
  },
  {
    key: 'resources',
    title: '协作资源',
    description: '常用资料 · 链接',
    items: [{ key: 'LINKS', name: '常用链接', path: '/links' }],
  },
  {
    key: 'management',
    title: '组织配置',
    description: '门店 · 人员',
    items: [
      { key: 'ADMIN_STORES', name: '店铺管理', path: '/admin/stores' },
      { key: 'ADMIN_USERS', name: '员工配置与管理', path: '/admin/users' },
    ],
  },
  {
    key: 'admin',
    title: '系统管理',
    description: '国家 · 角色',
    items: [
      { key: 'ADMIN_COUNTRIES', name: '国家管理', path: '/admin/countries' },
    ],
  }
];

/**
 * 图标映射
 */
const getItemIcon = (key: string): string => {
  const icons: Record<string, string> = {
    'DASHBOARD': 'pi pi-home',
    'CALENDAR': 'pi pi-calendar',
    'REPORTS': 'pi pi-book',
    'SALES_VISUALIZATION': 'pi pi-chart-bar',
    'SALES_DATA': 'pi pi-list',
    'SALES_IMPORT': 'pi pi-upload',
    'SALES_IMPORT_HISTORY': 'pi pi-history',
    'ON_SALE_PRODUCTS': 'pi pi-shopping-bag',
    'PRODUCT_CATALOG': 'pi pi-tags',
    'OPERATION_CENTER': 'pi pi-cog',
    'FINANCE_ADMIN': 'pi pi-wallet',
    'LOGISTICS_MGMT': 'pi pi-box',
    'PERFORMANCE_MGMT': 'pi pi-chart-line',
    'LINKS': 'pi pi-link',
    'ADMIN_STORES': 'pi pi-shop',
    'ADMIN_USERS': 'pi pi-users',
    'ADMIN_COUNTRIES': 'pi pi-globe',
  };
  return icons[key] || 'pi pi-circle';
};

/**
 * 根据权限过滤可见菜单组
 */
const visibleMenuGroups = computed<NavGroup[]>(() => {
  const perms = authStore.permissions || [];
  return menuGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (item.key === 'PERFORMANCE_MGMT') return true;
        if (authStore.role === 'admin') return true;
        return perms.includes(item.key);
      });
      if (filteredItems.length === 0) return null as unknown as NavGroup;
      return { ...group, items: filteredItems };
    })
    .filter(Boolean) as NavGroup[];
});

/**
 * 判断菜单项是否激活
 */
const isActive = (item: NavItem): boolean => {
  return route.path.startsWith(item.path) && (item.path !== '/' || route.path === '/');
};

/**
 * 处理导航
 */
const handleNav = (item: NavItem) => {
  router.push(item.path);
};

/**
 * 跳转到个人中心
 */
const goProfile = () => {
  router.push('/profile');
  mobileMenuOpen.value = false;
};

/**
 * 退出登录
 */
const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
