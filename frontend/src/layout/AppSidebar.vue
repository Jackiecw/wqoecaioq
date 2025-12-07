<template>
  <aside class="sidebar">
    <!-- Logo 区域 -->
    <div class="brand">
      <div class="brand-icon">
        <i class="pi pi-globe"></i>
      </div>
      <div>
        <h1 class="brand-title">Overseas Ops</h1>
        <p class="brand-subtitle">控制中心</p>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="nav-menu custom-scrollbar">
      <div class="nav-groups">
        <section v-for="group in visibleMenuGroups" :key="group.key" class="nav-group">
          <!-- 分组标题 -->
          <div class="nav-group-title">
            <p>{{ group.title }}</p>
          </div>
          
          <!-- 菜单项 -->
          <div class="nav-items">
            <template v-for="item in group.items" :key="item.key">
              <!-- 父级菜单项 -->
              <router-link
                :to="item.path"
                class="nav-item"
                :class="{ 'nav-item--active': isActive(item) }"
              >
                <i :class="item.icon" class="nav-item-icon"></i>
                <span class="nav-item-label">{{ item.name }}</span>
                <span v-if="item.badge" class="nav-item-badge">
                  {{ item.badge }}
                </span>
                <i v-if="item.children" class="pi pi-angle-down text-xs ml-2 opacity-50"></i>
              </router-link>

              <!-- 子菜单项 (如果存在) -->
              <div v-if="item.children" class="nav-children">
                 <router-link
                  v-for="child in item.children"
                  :key="child.key"
                  :to="child.path"
                  class="nav-item nav-item-child"
                  :class="{ 'nav-item--active': isActive(child) }"
                >
                  <i :class="child.icon" class="nav-item-icon child-icon"></i>
                  <span class="nav-item-label">{{ child.name }}</span>
                </router-link>
              </div>
            </template>
          </div>
        </section>
      </div>
    </nav>
    
    <!-- 底部用户区域 (Refactored User Card) -->
    <div class="sidebar-footer">
      <div class="user-profile-card">
        <div class="user-info-area" @click="goProfile">
           <Avatar 
            :image="userAvatar" 
            :label="!userAvatar ? userInitials : undefined"
            shape="circle" 
            class="user-avatar"
            style="background-color: var(--color-accent); color: #ffffff"
          />
          <div class="user-details">
            <span class="user-nickname text-ellipsis">{{ authStore.nickname || 'User' }}</span>
            <span class="user-role">{{ authStore.role === 'admin' ? '管理员' : '运营人员' }}</span>
          </div>
        </div>
        <Button
          icon="pi pi-sign-out"
          severity="secondary"
          text
          rounded
          v-tooltip.top="'退出登录'"
          @click="handleLogout"
          class="logout-btn"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { MENU_GROUPS, type NavItem, type NavGroup } from './menuConfig';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

const userAvatar = computed(() => {
  if (!authStore.avatarUrl) return undefined;
  return authStore.avatarUrl.startsWith('http') ? authStore.avatarUrl : `${apiBaseUrl}${authStore.avatarUrl}`;
});

const userInitials = computed(() => {
  return (authStore.nickname || 'U').substring(0, 1).toUpperCase();
});

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
      // 过滤子菜单项权限
      filteredItems.forEach(item => {
        if (item.children) {
             item.children = item.children.filter(child => {
                if (authStore.role === 'admin') return true;
                return perms.includes(child.key);
             });
        }
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
  // 如果是父菜单，检查路径是否匹配且不等于根路径，或者检查是否有激活的子菜单
  if (item.children) {
      // 父菜单本身匹配，或者有子菜单匹配
      return (route.path.startsWith(item.path) && item.path !== '/') || 
             item.children.some(child => isActive(child));
  }
  return route.path === item.path || (route.path.startsWith(item.path) && item.path !== '/');
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
/* ========================================
   Sidebar - Clean Premium White Theme
   ======================================== */
.sidebar {
  width: 260px;
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: none;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .sidebar {
    display: flex;
  }
}

/* Brand / Logo */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.brand-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  border-radius: var(--radius-md);
  font-size: 1.125rem;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
}

.brand-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Navigation */
.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
}

.nav-groups {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.nav-group-title {
  padding: 0 0.75rem;
  margin-bottom: 0.5rem;
}

.nav-group-title p {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.nav-item--active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 600;
}

.nav-item-icon {
  font-size: 1.125rem;
  transition: transform 0.2s;
}

.nav-item:hover .nav-item-icon {
  transform: scale(1.1);
}

.nav-item-label {
  flex: 1;
}

.nav-item-badge {
  font-size: 0.7rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-accent);
  color: white;
  border-radius: 9999px;
  font-weight: 600;
}

/* Submenu Styles */
.nav-children {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-left: 0.75rem; /* Indentation for children */
  margin-top: 0.25rem;
  position: relative;
}

.nav-children::before {
  content: '';
  position: absolute;
  left: 1.25rem; /* Align line with parent icon center */
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--color-border);
  opacity: 0.5;
}

.nav-item-child {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem; /* Slightly smaller text for children */
}

.nav-item-child .child-icon {
  font-size: 0.9rem; /* Smaller icon for children */
}

/* Footer (User Card) */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.user-profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  padding-left: 0.5rem;
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.user-profile-card:hover {
  background-color: var(--color-bg-page);
  border-color: var(--color-border);
}

.user-info-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  cursor: pointer;
  min-width: 0; /* for text ellipsis */
}

.user-avatar {
  width: 2.25rem; /* 36px */
  height: 2.25rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-nickname {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.logout-btn {
  color: var(--color-text-muted) !important;
  width: 2rem !important;
  height: 2rem !important;
  transition: all 0.2s;
}

.logout-btn:hover {
  color: #ef4444 !important; /* Red-500 */
  background: #fef2f2 !important; /* Red-50 */
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 4px;
}

.nav-menu:hover .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
}
</style>
