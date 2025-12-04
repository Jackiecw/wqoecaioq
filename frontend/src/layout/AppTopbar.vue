<template>
  <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
    <div class="h-full px-4 md:px-6 flex items-center justify-between">
      <!-- 左侧：移动端菜单按钮 + 当前视图名称 -->
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-bars"
          text
          rounded
          class="lg:hidden text-slate-500"
          aria-label="打开导航"
          @click="emit('toggle-mobile-menu')"
        />
        <div>
          <p class="text-xs text-slate-500 mb-1">当前视图</p>
          <h2 class="text-lg font-bold text-slate-900 m-0">{{ currentViewName }}</h2>
        </div>
      </div>

      <!-- 右侧：搜索框、通知、用户头像 -->
      <div class="flex items-center gap-3">
        <!-- 全局搜索框 (桌面端) -->
        <div class="relative hidden md:block">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <InputText
            v-model="searchQuery"
            placeholder="搜索..."
            class="
              pl-10 pr-4 py-2 w-64
              bg-slate-100 border-0 rounded-full
              text-sm text-slate-700 placeholder-slate-400
              focus:ring-2 focus:ring-indigo-500 focus:bg-white
              transition-all duration-200
            "
          />
        </div>

        <!-- 通知铃铛 (桌面端) -->
        <Button
          icon="pi pi-bell"
          severity="secondary"
          text
          rounded
          class="hidden md:flex relative text-slate-600 hover:text-slate-900"
          @click="toggleNotifications"
        >
          <!-- 未读通知标记 -->
          <span 
            v-if="unreadCount > 0"
            class="
              absolute top-1 right-1 w-2 h-2 
              bg-red-500 rounded-full
              ring-2 ring-white
            "
          ></span>
        </Button>

        <!-- 用户头像和菜单 -->
        <div 
          class="flex items-center gap-2 px-3 py-1 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
          @click="toggleUserMenu"
        >
          <Avatar
            v-if="userAvatar"
            :image="userAvatar"
            shape="circle"
            class="w-8 h-8"
          />
          <Avatar 
            v-else 
            icon="pi pi-user" 
            shape="circle" 
            class="w-8 h-8 bg-indigo-100 text-indigo-600" 
          />
          <div class="hidden md:flex flex-col">
            <span class="text-sm font-semibold text-slate-900">{{ authStore.nickname }}</span>
            <span class="text-xs text-slate-500">在线</span>
          </div>
          <i class="pi pi-angle-down text-slate-500 text-xs ml-1 hidden md:block"></i>
        </div>
        <Menu ref="userMenuRef" :model="userMenuItems" popup />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';

type NavItem = { key: string; name: string; path: string; badge?: string };
type NavGroup = {
  key: string;
  title: string;
  items: NavItem[];
};

const emit = defineEmits<{
  'toggle-mobile-menu': [];
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const searchQuery = ref('');
const unreadCount = ref(3);
const userMenuRef = ref();

/**
 * API 基础 URL (用于拼接头像)
 */
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

/**
 * 用户头像 URL
 */
const userAvatar = computed(() => {
  if (!authStore.avatarUrl) return null;
  return authStore.avatarUrl.startsWith('http')
    ? authStore.avatarUrl
    : `${apiBaseUrl}${authStore.avatarUrl}`;
});

/**
 * 菜单配置 (用于计算当前视图名称)
 */
const menuGroups: NavGroup[] = [
  {
    key: 'workspace',
    title: '工作区',
    items: [
      { key: 'DASHBOARD', name: '仪表盘', path: '/' },
      { key: 'CALENDAR', name: '工作日历', path: '/calendar' },
      { key: 'REPORTS', name: '周报中心', path: '/reports' },
    ],
  },
  {
    key: 'sales',
    title: '销售数据',
    items: [
      { key: 'SALES_VISUALIZATION', name: '数据看板', path: '/sales/dashboard' },
      { key: 'SALES_DATA', name: '销售明细', path: '/sales/data' },
      { key: 'SALES_IMPORT', name: '数据导入', path: '/sales/import' },
      { key: 'SALES_IMPORT_HISTORY', name: '导入记录', path: '/sales/history' },
    ],
  },
  {
    key: 'operations',
    title: '业务运营',
    items: [
      { key: 'ON_SALE_PRODUCTS', name: '店铺在售', path: '/products/on-sale' },
      { key: 'PRODUCT_CATALOG', name: '产品目录', path: '/products/catalog' },
      { key: 'OPERATION_CENTER', name: '运营中心', path: '/operations' },
      { key: 'FINANCE_ADMIN', name: '财务管理', path: '/finance' },
      { key: 'LOGISTICS_MGMT', name: '生产与物流', path: '/logistics' },
      { key: 'PERFORMANCE_MGMT', name: '绩效管理', path: '/performance' },
    ],
  },
  {
    key: 'resources',
    title: '协作资源',
    items: [{ key: 'LINKS', name: '常用链接', path: '/links' }],
  },
  {
    key: 'management',
    title: '组织配置',
    items: [
      { key: 'ADMIN_STORES', name: '店铺管理', path: '/admin/stores' },
      { key: 'ADMIN_USERS', name: '员工配置与管理', path: '/admin/users' },
    ],
  },
  {
    key: 'admin',
    title: '系统管理',
    items: [
      { key: 'ADMIN_COUNTRIES', name: '国家管理', path: '/admin/countries' },
    ],
  }
];

/**
 * 判断菜单项是否激活
 */
const isActive = (item: NavItem): boolean => {
  return route.path.startsWith(item.path) && (item.path !== '/' || route.path === '/');
};

/**
 * 计算当前视图名称
 */
const currentViewName = computed(() => {
  const path = route.path;
  for (const group of menuGroups) {
    const item = group.items.find(i => isActive(i));
    if (item) return item.name;
  }
  if (path === '/profile') return '个人中心';
  return 'Dashboard';
});

/**
 * 用户菜单项
 */
const userMenuItems = [
  { 
    label: '个人中心', 
    icon: 'pi pi-user', 
    command: () => router.push('/profile') 
  },
  { 
    label: '退出登录', 
    icon: 'pi pi-sign-out', 
    command: () => {
      authStore.logout();
      router.push('/login');
    }
  },
];

/**
 * 切换通知面板
 */
const toggleNotifications = () => {
  // TODO: 实现通知面板逻辑
  console.log('Toggle notifications');
};

/**
 * 切换用户菜单
 */
const toggleUserMenu = (event: Event) => {
  userMenuRef.value?.toggle(event);
};
</script>
