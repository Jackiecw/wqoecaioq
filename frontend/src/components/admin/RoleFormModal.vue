<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '680px' }"
    :breakpoints="{ '960px': '80vw', '640px': '95vw' }"
    :header="dialogTitle"
    :dismissableMask="true"
    :draggable="false"
    class="p-dialog-custom"
    @hide="closeModal"
  >
    <div class="flex flex-col gap-5 pt-1">
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

      <!-- Basic Info -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="uni-form-label">角色描述 <span class="text-red-500">*</span></label>
          <InputText v-model="formData.description" class="w-full" placeholder="如：运营主管" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="uni-form-label">角色 Key <span class="text-red-500">*</span></label>
          <InputText
            v-model="formData.name"
            class="w-full"
            placeholder="如：ops_manager"
            :disabled="isSystemRole"
          />
          <small v-if="isSystemRole" class="text-[var(--color-text-muted)]">系统角色不允许修改 Key</small>
        </div>
      </div>

      <!-- Permission Matrix -->
      <div class="perm-matrix" v-if="!isLoadingPermissions">
        <div class="perm-matrix__header">
          <i class="pi pi-shield"></i>
          <span>权限配置</span>
          <span class="perm-count">{{ selectedPermissionIds.length }} / {{ allPermissions.length }}</span>
        </div>

        <div v-if="isSystemRole && props.roleToEditId" class="perm-system-notice">
          <i class="pi pi-lock"></i>
          系统角色默认拥有全部权限，无需手动配置
        </div>

        <div v-else class="perm-matrix__body">
          <div class="perm-actions">
            <button class="perm-action-btn" @click="selectAll">
              <i class="pi pi-check-square"></i> 全选
            </button>
            <button class="perm-action-btn" @click="clearAll">
              <i class="pi pi-stop"></i> 清空
            </button>
          </div>

          <div
            v-for="(perms, scope) in groupedPermissions"
            :key="scope"
            class="perm-group"
          >
            <div class="perm-group__header" @click="toggleScope(scope as string)">
              <div class="perm-group__title">
                <i :class="getScopeIcon(scope as string)"></i>
                <span>{{ scope }}</span>
                <span class="perm-group__count">{{ getSelectedCountForScope(scope as string) }}/{{ perms.length }}</span>
              </div>
              <div @click.stop>
                <Checkbox
                  :modelValue="isScopeFullySelected(scope as string)"
                  :binary="true"
                  @update:modelValue="toggleScope(scope as string)"
                />
              </div>
            </div>
            <div class="perm-group__items">
              <label
                v-for="perm in perms"
                :key="perm.id"
                class="perm-item"
                :class="{ 'perm-item--active': selectedPermissionIds.includes(perm.id) }"
              >
                <Checkbox
                  :modelValue="selectedPermissionIds.includes(perm.id)"
                  :binary="true"
                  @update:modelValue="togglePermission(perm.id)"
                />
                <div class="perm-item__info">
                  <span class="perm-item__label">{{ perm.label }}</span>
                  <span class="perm-item__key">{{ perm.scope }}:{{ perm.action }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-6">
        <i class="pi pi-spin pi-spinner text-2xl" style="color: var(--color-text-muted)"></i>
        <p class="text-sm mt-2" style="color: var(--color-text-secondary)">加载权限列表中...</p>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

type Permission = {
  id: string;
  scope: string;
  action: string;
  label: string;
};

type RolePayload = {
  name: string;
  description: string;
  permissionIds: string[];
};

type RoleResponse = {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissions?: Permission[];
};

const props = defineProps<{
  isOpen: boolean;
  roleToEditId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'role-created', payload: RoleResponse): void;
  (e: 'role-updated', payload: RoleResponse): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const dialogTitle = computed(() => (props.roleToEditId ? '编辑角色' : '新建角色'));
const isSubmitting = ref(false);
const isLoadingPermissions = ref(false);
const errorMessage = ref('');
const isSystemRole = ref(false);

const formData = ref<{ name: string; description: string }>({
  name: '',
  description: '',
});

const allPermissions = ref<Permission[]>([]);
const selectedPermissionIds = ref<string[]>([]);

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};
  allPermissions.value.forEach((perm) => {
    if (!groups[perm.scope]) {
      groups[perm.scope] = [];
    }
    groups[perm.scope].push(perm);
  });
  return groups;
});

const getScopeIcon = (scope: string): string => {
  const iconMap: Record<string, string> = {
    DASHBOARD: 'pi pi-home',
    CALENDAR: 'pi pi-calendar',
    REPORTS: 'pi pi-file-edit',
    SALES: 'pi pi-shopping-cart',
    PRODUCTS: 'pi pi-box',
    STORE_LISTINGS: 'pi pi-list',
    ADVERTISING: 'pi pi-megaphone',
    TRAFFIC: 'pi pi-chart-line',
    FINANCE: 'pi pi-wallet',
    LOGISTICS: 'pi pi-truck',
    PERFORMANCE: 'pi pi-chart-bar',
    LINKS: 'pi pi-link',
    ADMIN_USERS: 'pi pi-users',
    ADMIN_STORES: 'pi pi-shop',
    ADMIN_COUNTRIES: 'pi pi-globe',
    ADMIN_METRICS: 'pi pi-sliders-h',
    ADMIN_ROLES: 'pi pi-shield',
    ADMIN_CATEGORIES: 'pi pi-tags',
  };
  return iconMap[scope] || 'pi pi-cog';
};

const isScopeFullySelected = (scope: string): boolean => {
  const perms = groupedPermissions.value[scope] || [];
  return perms.length > 0 && perms.every((p) => selectedPermissionIds.value.includes(p.id));
};

const getSelectedCountForScope = (scope: string): number => {
  const perms = groupedPermissions.value[scope] || [];
  return perms.filter((p) => selectedPermissionIds.value.includes(p.id)).length;
};

const toggleScope = (scope: string) => {
  const perms = groupedPermissions.value[scope] || [];
  const allSelected = isScopeFullySelected(scope);
  if (allSelected) {
    // Remove all perms of this scope
    const idsToRemove = new Set(perms.map((p) => p.id));
    selectedPermissionIds.value = selectedPermissionIds.value.filter((id) => !idsToRemove.has(id));
  } else {
    // Add all perms of this scope
    const current = new Set(selectedPermissionIds.value);
    perms.forEach((p) => current.add(p.id));
    selectedPermissionIds.value = [...current];
  }
};

const togglePermission = (permId: string) => {
  const idx = selectedPermissionIds.value.indexOf(permId);
  if (idx >= 0) {
    selectedPermissionIds.value.splice(idx, 1);
  } else {
    selectedPermissionIds.value.push(permId);
  }
};

const selectAll = () => {
  selectedPermissionIds.value = allPermissions.value.map((p) => p.id);
};

const clearAll = () => {
  selectedPermissionIds.value = [];
};

const fetchPermissions = async () => {
  isLoadingPermissions.value = true;
  try {
    const response = await apiClient.get<Permission[]>('/admin/permissions');
    allPermissions.value = response.data || [];
  } catch (error) {
    console.error('加载权限列表失败:', error);
    errorMessage.value = '无法加载权限列表';
  } finally {
    isLoadingPermissions.value = false;
  }
};

const hydrateForm = async () => {
  errorMessage.value = '';
  selectedPermissionIds.value = [];
  isSystemRole.value = false;

  if (!props.roleToEditId) {
    formData.value = { name: '', description: '' };
    return;
  }

  try {
    const response = await apiClient.get<RoleResponse>(`/admin/roles/${props.roleToEditId}`);
    const data = response.data;
    formData.value = { name: data.name, description: data.description };
    isSystemRole.value = !!data.isSystem;
    selectedPermissionIds.value = (data.permissions || []).map((p) => p.id);
  } catch (error: any) {
    console.error('加载角色详情失败:', error);
    errorMessage.value = error?.response?.data?.error || '加载角色详情失败';
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;

  const payload: RolePayload = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
    permissionIds: selectedPermissionIds.value,
  };

  try {
    if (props.roleToEditId) {
      const response = await apiClient.put<RoleResponse>(`/admin/roles/${props.roleToEditId}`, payload);
      emit('role-updated', response.data);
    } else {
      const response = await apiClient.post<RoleResponse>('/admin/roles', payload);
      emit('role-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('保存角色失败:', error);
    errorMessage.value = error?.response?.data?.error || '保存失败，请稍后再试。';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  emit('close');
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      fetchPermissions();
      hydrateForm();
    }
  },
);

watch(
  () => props.roleToEditId,
  () => {
    if (props.isOpen) hydrateForm();
  },
);
</script>

<style scoped>
/* Permission Matrix */
.perm-matrix {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.perm-matrix__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.perm-matrix__header i {
  color: var(--color-accent);
}

.perm-count {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg-page);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.perm-system-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.perm-system-notice i {
  color: var(--color-accent);
}

.perm-matrix__body {
  max-height: 420px;
  overflow-y: auto;
}

.perm-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.perm-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.perm-action-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.perm-group {
  border-bottom: 1px solid var(--color-border);
}

.perm-group:last-child {
  border-bottom: none;
}

.perm-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-card);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.perm-group__header:hover {
  background: var(--color-accent-soft);
}

.perm-group__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.perm-group__title i {
  font-size: 0.875rem;
  color: var(--color-accent);
}

.perm-group__count {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.perm-group__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.25rem;
  padding: 0.5rem 1.25rem 0.75rem;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.perm-item:hover {
  background: var(--color-bg-card);
}

.perm-item--active {
  background: var(--color-accent-soft);
}

.perm-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.perm-item__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.perm-item__key {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-family: 'SF Mono', monospace;
}
</style>
