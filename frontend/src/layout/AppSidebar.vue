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
            <span class="nav-group-line"></span>
            <p>{{ group.title }}</p>
            <span class="nav-group-line"></span>
          </div>
          
          <!-- 菜单项 -->
          <div class="nav-items">
            <template v-for="item in group.items" :key="item.key">
              <!-- 有子菜单的父级菜单项 -->
              <template v-if="item.children && item.children.length > 0">
                <div
                  class="nav-item nav-item--parent"
                  :class="{ 'nav-item--active': isActive(item), 'nav-item--expanded': isExpanded(item.key) }"
                  @click="toggleExpand(item.key)"
                >
                  <i :class="item.icon" class="nav-item-icon"></i>
                  <span class="nav-item-label">{{ item.name }}</span>
                  <i class="pi pi-chevron-right nav-item-chevron"></i>
                </div>

                <!-- 子菜单项 (折叠/展开) -->
                <Transition name="submenu">
                  <div v-if="isExpanded(item.key)" class="nav-children">
                    <router-link
                      v-for="child in item.children"
                      :key="child.key"
                      :to="child.path"
                      class="nav-item nav-item-child"
                      :class="{ 'nav-item--active': isActive(child) }"
                    >
                      <span class="child-dot"></span>
                      <span class="nav-item-label">{{ child.name }}</span>
                    </router-link>
                  </div>
                </Transition>
              </template>

              <!-- 无子菜单的普通菜单项 -->
              <router-link
                v-else
                :to="item.path"
                class="nav-item"
                :class="{ 'nav-item--active': isActive(item) }"
              >
                <i :class="item.icon" class="nav-item-icon"></i>
                <span class="nav-item-label">{{ item.name }}</span>
                <span v-if="item.badge" class="nav-item-badge" :class="`badge-${item.badge}`">
                  {{ item.badge }}
                </span>
              </router-link>
            </template>
          </div>
        </section>
      </div>
    </nav>
    
    <!-- 底部用户区域 -->
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
            <span class="user-role">{{ isAdmin ? '管理员' : '运营人员' }}</span>
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
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { usePermission } from '../composables/usePermission';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { MENU_GROUPS, type NavItem, type NavGroup } from './menuConfig';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { hasPermission, isAdmin } = usePermission();

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

const userAvatar = computed(() => {
  if (!authStore.avatarUrl) return undefined;
  return authStore.avatarUrl.startsWith('http') ? authStore.avatarUrl : `${apiBaseUrl}${authStore.avatarUrl}`;
});

const userInitials = computed(() => {
  return (authStore.nickname || 'U').substring(0, 1).toUpperCase();
});

/**
 * 展开状态管理
 */
const expandedKeys = ref<Set<string>>(new Set());

const isExpanded = (key: string): boolean => expandedKeys.value.has(key);

const toggleExpand = (key: string) => {
  const next = new Set(expandedKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  expandedKeys.value = next;
};

/**
 * 根据权限过滤可见菜单组
 * 使用 deep clone 避免 mutate 原始 MENU_GROUPS
 */
const visibleMenuGroups = computed<NavGroup[]>(() => {
  return MENU_GROUPS
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          // 先检查父级权限
          if (item.permission && !hasPermission(item.permission)) return null;

          // 如果有子菜单，过滤子菜单权限（clone children）
          if (item.children) {
            const filteredChildren = item.children.filter((child) => {
              if (child.permission) return hasPermission(child.permission);
              return true;
            });
            // 如果所有子菜单都被过滤掉，隐藏父级
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }

          return item;
        })
        .filter(Boolean) as NavItem[];

      if (filteredItems.length === 0) return null;
      return { ...group, items: filteredItems };
    })
    .filter(Boolean) as NavGroup[];
});

/**
 * 计算当前激活的菜单项 key，采用最长路径匹配
 */
const activeKey = computed(() => {
  let matchedKey = '';
  let maxLen = 0;
  visibleMenuGroups.value.forEach(group => {
    group.items.forEach(item => {
      const match = route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path + '/'));
      if (match && item.path.length > maxLen) {
        maxLen = item.path.length;
        matchedKey = item.key;
      } else if (route.path === '/' && item.path === '/') {
        if (item.path.length > maxLen) {
          maxLen = item.path.length;
          matchedKey = item.key;
        }
      }
      
      if (item.children) {
        item.children.forEach(child => {
          const childMatch = route.path === child.path || (child.path !== '/' && route.path.startsWith(child.path + '/'));
          if (childMatch && child.path.length > maxLen) {
            maxLen = child.path.length;
            matchedKey = child.key;
          }
        });
      }
    });
  });
  return matchedKey;
});

/**
 * 判断菜单项是否激活
 */
const isActive = (item: NavItem): boolean => {
  if (item.key === activeKey.value) return true;
  if (item.children && item.children.some(child => child.key === activeKey.value)) return true;
  return false;
};

/**
 * 自动展开含有活跃子菜单的父级
 */
watch(activeKey, (key) => {
  visibleMenuGroups.value.forEach(group => {
    group.items.forEach(item => {
      if (item.children && item.children.some(child => child.key === key)) {
        expandedKeys.value = new Set([...expandedKeys.value, item.key]);
      }
    });
  });
}, { immediate: true });

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
   Sidebar - Premium Clean Theme
   ======================================== */
.sidebar {
  width: 256px;
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
  padding: 1.125rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.brand-icon {
  width: 2.125rem;
  height: 2.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 75%, #7c3aed));
  color: #fff;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.brand-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Navigation */
.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.625rem;
}

.nav-groups {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Group Title */
.nav-group-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  margin-bottom: 0.125rem;
}

.nav-group-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
  opacity: 0.6;
}

.nav-group-title p {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  white-space: nowrap;
  user-select: none;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Nav Item */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;
  cursor: pointer;
  user-select: none;
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

.nav-item--active .nav-item-icon {
  color: var(--color-accent);
}

.nav-item-icon {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.nav-item-label {
  flex: 1;
  line-height: 1.3;
}

/* Badge */
.nav-item-badge {
  font-size: 0.5625rem;
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-live {
  background: #dcfce7;
  color: #15803d;
}

.badge-team {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-new {
  background: #fef3c7;
  color: #b45309;
}

.badge-beta {
  background: #f3e8ff;
  color: #7c3aed;
}

/* Parent with children - expand/collapse chevron */
.nav-item--parent {
  padding-right: 0.5rem;
}

.nav-item-chevron {
  font-size: 0.625rem;
  opacity: 0.4;
  transition: transform 0.2s ease, opacity 0.15s;
  flex-shrink: 0;
}

.nav-item--expanded .nav-item-chevron {
  transform: rotate(90deg);
  opacity: 0.7;
}

.nav-item--parent:hover .nav-item-chevron {
  opacity: 0.7;
}

/* Submenu Children */
.nav-children {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 1rem;
  margin-left: 0.625rem;
  border-left: 1.5px solid var(--color-border);
  overflow: hidden;
}

.nav-item-child {
  padding: 0.4375rem 0.625rem;
  font-size: 0.8125rem;
  gap: 0.5rem;
}

.child-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-text-muted);
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.15s ease;
}

.nav-item-child.nav-item--active .child-dot {
  background: var(--color-accent);
  opacity: 1;
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.nav-item-child:hover .child-dot {
  opacity: 0.8;
}

/* Submenu transition */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  max-height: 200px;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

/* Footer (User Card) */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.user-profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s, border-color 0.15s;
  border: 1px solid transparent;
}

.user-profile-card:hover {
  background-color: var(--color-bg-page);
  border-color: var(--color-border);
}

.user-info-area {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  font-size: 0.8125rem !important;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.0625rem;
}

.user-nickname {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.user-role {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  line-height: 1.2;
}

.logout-btn {
  color: var(--color-text-muted) !important;
  width: 1.75rem !important;
  height: 1.75rem !important;
  transition: all 0.15s;
}

.logout-btn:hover {
  color: #ef4444 !important;
  background: #fef2f2 !important;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
}
</style>
