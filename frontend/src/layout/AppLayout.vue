<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- 移动端侧边栏 -->
    <Drawer
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
                  :icon="item.icon"
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
    </Drawer>

    <!-- 桌面端左侧侧边栏 -->
    <AppSidebar />

    <!-- 右侧主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- 顶部导航栏 -->
      <AppTopbar @toggle-mobile-menu="mobileMenuOpen = true" />

      <!-- 主要内容区域 -->
      <main class="flex-1 overflow-y-auto w-full min-w-0">
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
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { MENU_GROUPS, type NavItem, type NavGroup } from './menuConfig';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const mobileMenuOpen = ref(false);

/**
 * 根据权限过滤可见菜单组
 */
const visibleMenuGroups = computed<NavGroup[]>(() => {
  const perms = authStore.permissions || [];
  return MENU_GROUPS
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
