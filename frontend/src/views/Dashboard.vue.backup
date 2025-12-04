<template>
  <div class="layout-shell">
    <!-- Mobile Sidebar -->
    <Sidebar
      v-model:visible="mobileMenuOpen"
      position="left"
      class="mobile-sidebar"
      :modal="true"
      :block-scroll="true"
    >
      <div class="sidebar-content">
        <div class="brand px-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-globe text-2xl text-primary"></i>
            <h1 class="brand-title text-xl text-900">Overseas Ops</h1>
          </div>
          <p class="brand-sub text-sm text-500 mt-1">海外电商控制中心</p>
        </div>
        <div class="nav-scroll mt-4">
          <nav class="flex flex-column gap-4">
            <section v-for="group in visibleMenuGroups" :key="group.key" class="nav-group px-3">
              <div class="nav-group-header mb-2 px-2">
                <p class="text-xs font-semibold text-500 uppercase">{{ group.title }}</p>
              </div>
              <div class="flex flex-column gap-1">
                <Button
                  v-for="item in group.items"
                  :key="item.key"
                  :label="itemLabel(item)"
                  :icon="getItemIcon(item.key)"
                  class="w-full text-left justify-content-start px-3 py-2 text-sm"
                  :class="{ 'bg-primary-50 text-primary font-medium': isActive(item), 'text-700 hover:bg-gray-50': !isActive(item) }"
                  text
                  @click="() => { handleNav(item); mobileMenuOpen = false; }"
                />
              </div>
            </section>
          </nav>
        </div>
        <div class="sidebar-footer mt-auto px-3 pb-3">
          <Button label="个人中心" icon="pi pi-user" severity="secondary" text class="w-full justify-content-start text-sm" @click="goProfile" />
          <Button label="退出登录" icon="pi pi-sign-out" severity="danger" text class="w-full justify-content-start text-sm" @click="handleLogout" />
        </div>
      </div>
    </Sidebar>

    <!-- Desktop Sidebar -->
    <aside class="sidebar desktop-sidebar surface-card border-right-1 border-gray-200 h-screen sticky top-0 flex-shrink-0" style="width: 260px">
      <div class="flex flex-column h-full">
        <div class="brand p-4">
          <div class="flex align-items-center gap-2">
            <div class="bg-primary-50 text-primary border-round p-2 flex align-items-center justify-content-center">
               <i class="pi pi-globe text-xl"></i>
            </div>
            <div>
              <h1 class="text-lg font-bold text-900 m-0">Overseas Ops</h1>
              <p class="text-xs text-500 m-0">控制中心</p>
            </div>
          </div>
        </div>
        
        <div class="nav-scroll flex-1 overflow-y-auto custom-scrollbar">
          <nav class="flex flex-column gap-4 px-3 pb-4">
            <section v-for="group in visibleMenuGroups" :key="group.key" class="nav-group">
              <div class="nav-group-header px-3 mb-2">
                <p class="text-xs font-semibold text-500 uppercase m-0">{{ group.title }}</p>
              </div>
              <div class="flex flex-column gap-1">
                <Button
                  v-for="item in group.items"
                  :key="item.key"
                  :label="itemLabel(item)"
                  :icon="getItemIcon(item.key)"
                  class="w-full text-left justify-content-start px-3 py-2 text-sm border-round-lg transition-colors transition-duration-150"
                  :class="{ 'bg-primary-50 text-primary font-semibold': isActive(item), 'text-600 hover:bg-gray-50 hover:text-900': !isActive(item) }"
                  text
                  @click="() => handleNav(item)"
                />
              </div>
            </section>
          </nav>
        </div>

        <div class="sidebar-footer p-3 border-top-1 border-gray-200">
          <Button label="个人中心" icon="pi pi-user" severity="secondary" text class="w-full justify-content-start text-sm mb-1" @click="goProfile" />
          <Button label="退出登录" icon="pi pi-sign-out" severity="danger" text class="w-full justify-content-start text-sm" @click="handleLogout" />
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main flex-1 min-w-0 flex flex-column bg-gray-50">
      <Toolbar class="surface-white border-none border-bottom-1 border-gray-200 px-4 py-3 sticky top-0 z-5 shadow-sm">
        <template #start>
          <div class="flex align-items-center gap-3">
            <Button
              icon="pi pi-bars"
              text
              rounded
              class="lg:hidden text-500"
              aria-label="打开导航"
              @click="mobileMenuOpen = true"
            />
            <div>
              <p class="text-xs text-500 mb-1">当前视图</p>
              <h2 class="text-lg font-bold text-900 m-0">{{ currentViewName }}</h2>
            </div>
          </div>
        </template>
        <template #end>
          <div class="flex align-items-center gap-3">
            <div class="flex align-items-center gap-2 px-3 py-1 border-round-2xl hover:bg-gray-50 cursor-pointer transition-colors" @click="toggleUserMenu">
              <Avatar
                v-if="userAvatar"
                :image="userAvatar"
                shape="circle"
                class="w-2rem h-2rem"
              />
              <Avatar v-else icon="pi pi-user" shape="circle" class="w-2rem h-2rem bg-primary-100 text-primary" />
              <div class="hidden md:flex flex-column">
                <span class="text-sm font-semibold text-900">{{ authStore.nickname }}</span>
                <span class="text-xs text-500">在线</span>
              </div>
              <i class="pi pi-angle-down text-500 text-xs ml-1"></i>
            </div>
            <Menu ref="userMenu" :model="userMenuItems" popup />
          </div>
        </template>
      </Toolbar>

      <main class="content flex-1 p-4 md:p-6 overflow-y-auto">
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
import Sidebar from 'primevue/sidebar';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';

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
const userMenu = ref();

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

// Add Admin Countries if missing in original but good to have for completeness if permissions allow
// Actually I should stick to original items but just add icons.

const getItemIcon = (key: string) => {
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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
const userAvatar = computed(() => {
  if (!authStore.avatarUrl) return null;
  return authStore.avatarUrl.startsWith('http')
    ? authStore.avatarUrl
    : `${apiBaseUrl}${authStore.avatarUrl}`;
});

const visibleMenuGroups = computed<NavGroup[]>(() => {
  const perms = authStore.permissions || [];
  return menuGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (item.key === 'PERFORMANCE_MGMT') return true;
        // Basic permission check - assuming 'admin' role has all or specific perms are set
        // If perms is empty and not admin, might hide everything.
        // For safety, if role is admin, show all?
        if (authStore.role === 'admin') return true;
        return perms.includes(item.key);
      });
      if (filteredItems.length === 0) return null as unknown as NavGroup;
      return { ...group, items: filteredItems };
    })
    .filter(Boolean) as NavGroup[];
});

const userMenuItems = [
  { label: '个人中心', icon: 'pi pi-user', command: () => goProfile() },
  { label: '退出登录', icon: 'pi pi-sign-out', command: () => handleLogout() },
];

const isActive = (item: NavItem) =>
  route.path.startsWith(item.path) && (item.path !== '/' || route.path === '/');

const itemLabel = (item: NavItem) => (item.badge ? `${item.name}` : item.name); // Badge moved to separate UI element if needed, or just append text. For now simple text.

const currentViewName = computed(() => {
  const path = route.path;
  for (const group of visibleMenuGroups.value) {
    const item = group.items.find((i) => isActive(i));
    if (item) return item.name;
  }
  if (path === '/profile') return '个人中心';
  return 'Dashboard';
});

const handleNav = (item: NavItem) => {
  router.push(item.path);
};

const goProfile = () => {
  router.push('/profile');
};

const toggleUserMenu = (event: Event) => {
  (userMenu.value as any)?.toggle(event);
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.layout-shell {
  display: flex;
  min-height: 100vh;
  background: var(--surface-ground);
  color: var(--text-color);
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--surface-border);
  background: var(--surface-card);
  position: sticky;
  top: 0;
  height: 100vh;
}

.desktop-sidebar {
  display: none;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

@media (min-width: 960px) {
  .desktop-sidebar {
    display: block;
  }
  .mobile-sidebar {
    display: none;
  }
}

/* Custom Scrollbar for Sidebar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--surface-300);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--surface-400);
}
</style>
