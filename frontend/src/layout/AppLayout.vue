<template>
  <div class="app-layout">
    <!-- 移动端侧边栏 -->
    <Drawer
      v-model:visible="mobileMenuOpen"
      position="left"
      class="mobile-sidebar"
      :modal="true"
      :block-scroll="true"
    >
      <div class="sidebar-mobile-content">
        <!-- Logo -->
        <div class="brand-mobile">
          <div class="brand-icon">
            <i class="pi pi-globe"></i>
          </div>
          <div>
            <h1 class="brand-title">Overseas Ops</h1>
            <p class="brand-subtitle">海外电商控制中心</p>
          </div>
        </div>

        <!-- 移动端导航菜单 -->
        <nav class="mobile-nav">
          <section v-for="group in visibleMenuGroups" :key="group.key" class="nav-group">
            <div class="nav-group-title">
              <p>{{ group.title }}</p>
            </div>
            <div class="nav-items">
              <Button
                v-for="item in group.items"
                :key="item.key"
                :label="item.name"
                :icon="item.icon"
                class="nav-item"
                :class="{ 'nav-item--active': isActive(item) }"
                text
                @click="() => { handleNav(item); mobileMenuOpen = false; }"
              />
            </div>
          </section>
        </nav>

        <!-- 移动端底部按钮 -->
        <div class="mobile-footer">
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
    <div class="main-content">
      <!-- 移动端菜单按钮 -->
      <button 
        class="mobile-menu-btn lg:hidden"
        aria-label="打开导航"
        @click="mobileMenuOpen = true"
      >
        <i class="pi pi-bars"></i>
      </button>

      <!-- 主要内容区域 -->
      <main class="content-area">
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

<style scoped>
/* ========================================
   App Layout - Clean Premium White Theme
   ======================================== */
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-page);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  min-width: 0;
}

/* ========================================
   Mobile Menu Button
   ======================================== */
.mobile-menu-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 40;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.mobile-menu-btn:hover {
  color: var(--color-text-primary);
  box-shadow: var(--shadow-md);
}

@media (min-width: 1024px) {
  .mobile-menu-btn {
    display: none;
  }
}

/* ========================================
   Mobile Sidebar
   ======================================== */
.sidebar-mobile-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.brand-mobile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0.125rem 0 0;
}

.mobile-nav {
  flex: 1;
  overflow-y: auto;
  margin-top: 1rem;
  padding: 0 0.75rem;
}

.nav-group {
  margin-bottom: 1rem;
}

.nav-group-title {
  padding: 0 0.5rem;
  margin-bottom: 0.5rem;
}

.nav-group-title p {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  margin: 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  width: 100%;
  text-align: left;
  justify-content: flex-start;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
}

.nav-item:hover {
  background: var(--color-bg-page);
}

.nav-item--active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 500;
}

.mobile-footer {
  margin-top: auto;
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
}
</style>
