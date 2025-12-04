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
              <i :class="item.icon" class="text-lg"></i>
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
import { MENU_GROUPS, type NavItem, type NavGroup } from './menuConfig';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

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
