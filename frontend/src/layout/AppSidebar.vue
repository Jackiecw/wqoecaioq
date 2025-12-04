<template>
  <aside class="sidebar h-screen sticky top-0 flex-shrink-0 bg-white border-r border-slate-200 hidden lg:flex flex-col" style="width: 260px">
    <!-- Logo 区域 -->
    <div class="brand p-4 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-50 text-indigo-600 rounded-lg p-2 flex items-center justify-center">
          <i class="pi pi-globe text-xl"></i>
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 m-0">Overseas Ops</h1>
          <p class="text-xs text-slate-500 m-0">控制中心</p>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
      <div class="flex flex-col gap-4">
        <section v-for="group in visibleMenuGroups" :key="group.key" class="nav-group">
          <!-- 分组标题 -->
          <div class="px-3 mb-2">
            <p class="text-xs font-semibold text-slate-500 uppercase m-0">{{ group.title }}</p>
          </div>
          
          <!-- 菜单项 -->
          <div class="flex flex-col gap-1">
            <router-link
              v-for="item in group.items"
              :key="item.key"
              :to="item.path"
              class="
                flex items-center gap-3 px-3 py-2 rounded-lg
                text-sm font-medium
                transition-all duration-200
              "
              :class="[
                isActive(item)
                  ? 'bg-indigo-50 text-indigo-600 font-semibold border-l-4 border-indigo-600 -ml-3 pl-3'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              ]"
            >
              <i :class="getItemIcon(item.key)" class="text-lg"></i>
              <span class="flex-1">{{ item.name }}</span>
              <span v-if="item.badge" class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                {{ item.badge }}
              </span>
            </router-link>
          </div>
        </section>
      </div>
    </nav>

    <!-- 底部用户区域 -->
    <div class="p-3 border-t border-slate-100">
      <Button
        label="个人中心"
        icon="pi pi-user"
        severity="secondary"
        text
        class="w-full justify-start text-sm mb-1"
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
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
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

/**
 * 完整的菜单配置（与原 Dashboard.vue 保持一致）
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
 * 跳转到个人中心
 */
const goProfile = () => {
  router.push('/profile');
};

/**
 * 退出登录
 */
const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgb(203 213 225);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgb(148 163 184);
}
</style>
