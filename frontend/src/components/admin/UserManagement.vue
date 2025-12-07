<template>
  <div class="page-shell">
    <PageHeader 
      title="员工配置与管理" 
      subtitle="统一配置账号、角色与国家分配，保持权限一致。"
    />

    <!-- Tabs -->
    <div class="pill-tab-group mb-6">
      <button
        class="pill-tab"
        :class="{ 'is-active': activeTab === 0 }"
        @click="activeTab = 0"
      >
        用户管理
      </button>
      <button
        class="pill-tab"
        :class="{ 'is-active': activeTab === 1 }"
        @click="activeTab = 1"
      >
        角色与权限
      </button>
      <button
        class="pill-tab"
        :class="{ 'is-active': activeTab === 2 }"
        @click="activeTab = 2"
      >
        国家管理
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
        {{ errorMessage }}
      </Message>

      <!-- Users Tab -->
      <ContentCard v-if="activeTab === 0">
        <div class="flex justify-end mb-4">
          <button 
            @click="openModal"
            class="bg-[#2463EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <i class="pi pi-plus text-xs"></i>
            <span>新建用户</span>
          </button>
        </div>
        
        <DataTable
          :value="users"
          data-key="id"
          class="p-datatable-sm"
          scrollable
        >
          <Column field="nickname" header="昵称" style="min-width: 8rem" />
          <Column field="username" header="用户名" style="min-width: 8rem" />
          <Column header="角色" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag :value="data.role?.description || data.role?.name || '-'" :severity="data.role?.name === 'admin' ? 'danger' : 'info'" />
            </template>
          </Column>
          <Column header="运营国家" style="min-width: 10rem">
            <template #body="{ data }">
              <span v-if="data.operatedCountries?.length">
                {{ data.operatedCountries.map((c: any) => c.code).join(', ') }}
              </span>
              <span v-else class="text-[var(--color-text-muted)]">--</span>
            </template>
          </Column>
          <Column header="操作" style="min-width: 12rem">
            <template #body="{ data }">
              <div class="flex gap-2 flex-wrap">
                <Button label="编辑" size="small" text @click="handleEdit(data)" />
                <Button
                  label="重置"
                  size="small"
                  text
                  severity="warning"
                  :disabled="data.username === 'admin'"
                  @click="handleResetPassword(data)"
                />
                <Button
                  v-if="isSuperAdmin"
                  label="删除"
                  size="small"
                  text
                  severity="danger"
                  :disabled="data.username === 'admin' || data.id === currentUserId"
                  @click="handleDeleteUser(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </ContentCard>

      <!-- Roles Tab -->
      <ContentCard v-if="activeTab === 1">
        <div class="flex justify-end mb-4">
          <button 
            @click="openRoleModal"
            class="bg-[#2463EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <i class="pi pi-plus text-xs"></i>
            <span>新建角色</span>
          </button>
        </div>
        <DataTable
          :value="rolesList"
          data-key="id"
          class="p-datatable-sm"
          scrollable
        >
          <Column field="description" header="角色描述" />
          <Column field="name" header="角色 Key" />
          <Column header="操作" style="min-width: 8rem">
            <template #body="{ data }">
              <Button
                label="编辑权限"
                size="small"
                text
                :disabled="data.name === 'admin'"
                @click="handleEditRole(data)"
              />
            </template>
          </Column>
        </DataTable>
      </ContentCard>

      <!-- Countries Tab -->
      <div v-if="activeTab === 2">
        <CountryManagement />
      </div>
    </div>

    <UserFormModal
      :is-open="isModalOpen"
      :roles="rolesList"
      :user-to-edit="currentUserToEdit"
      @close="closeModal"
      @user-created="handleUserCreated"
      @user-updated="handleUserUpdated"
    />

    <RoleFormModal
      :is-open="isRoleModalOpen"
      :role-to-edit-id="currentRoleToEditId"
      @close="closeRoleModal"
      @role-created="handleRoleCreated"
      @role-updated="handleRoleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import apiClient from '@/services/apiClient';
import UserFormModal from './UserFormModal.vue';
import RoleFormModal from './RoleFormModal.vue';
import CountryManagement from './CountryManagement.vue';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';

type UserRow = {
  id: string;
  username: string;
  nickname: string;
  role: { id: string; name: string; description: string };
  supervisedCountries: Array<{ id: string; code: string; name: string }>;
  operatedCountries: Array<{ id: string; code: string; name: string }>;
};

type EditableUser = UserRow & {
  roleId: string;
  supervisedCountryIds?: string[];
  operatedCountryIds?: string[];
};

type RoleRow = { id: string; name: string; description: string };

const activeTab = ref(0);
const users = ref<UserRow[]>([]);
const rolesList = ref<RoleRow[]>([]);
const errorMessage = ref('');

const isModalOpen = ref(false);
const currentUserToEdit = ref<EditableUser | null>(null);

const isRoleModalOpen = ref(false);
const currentRoleToEditId = ref<string | null>(null);

const authStore = useAuthStore();
const isSuperAdmin = computed(() => authStore.role === 'admin');
const currentUserId = computed(() => authStore.user?.userId);

const fetchUsers = async () => {
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/admin/users');
    users.value = response.data;
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    if (error.response?.status === 403) {
      errorMessage.value = '您没有权限查看此内容。';
    } else {
      errorMessage.value = '获取用户列表失败，请稍后再试。';
    }
  }
};

const fetchRoles = async () => {
  try {
    const response = await apiClient.get('/admin/roles');
    rolesList.value = response.data;
  } catch (error) {
    console.error('获取角色列表失败:', error);
    errorMessage.value = '无法加载角色列表，新建/编辑功能将不可用。';
  }
};

onMounted(() => {
  fetchUsers();
  fetchRoles();
});

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  currentUserToEdit.value = null;
};

const handleEdit = (user: UserRow) => {
  currentUserToEdit.value = {
    ...user,
    roleId: user.role.id,
    supervisedCountryIds: user.supervisedCountries.map((c) => c.id),
    operatedCountryIds: user.operatedCountries.map((c) => c.id),
  };
  openModal();
};

const handleUserUpdated = (updatedUser: UserRow) => {
  const index = users.value.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users.value[index] = updatedUser;
  }
};

const handleUserCreated = (newUser: UserRow) => {
  users.value.push(newUser);
};

const handleDeleteUser = async (user: UserRow) => {
  if (!isSuperAdmin.value) return;
  if (user.username === 'admin') {
    alert('无法删除内置超级管理员账号');
    return;
  }
  if (user.id === currentUserId.value) {
    alert('无法删除当前登录账号');
    return;
  }
  if (!confirm(`确定要删除用户 ${user.nickname} (${user.username}) 吗？该操作不可恢复。`)) return;
  try {
    await apiClient.delete(`/admin/users/${user.id}`);
    users.value = users.value.filter((u) => u.id !== user.id);
  } catch (error: any) {
    console.error('删除用户失败:', error);
    alert(error.response?.data?.error || '删除用户失败，请稍后再试');
  }
};

const handleResetPassword = async (user: UserRow) => {
  if (!confirm(`确定要将用户 "${user.nickname}" (${user.username}) 的密码重置为 'q1234567' 吗？`)) return;
  try {
    const response = await apiClient.post(`/admin/users/${user.id}/reset-password`);
    alert(response.data.message || '重置成功');
  } catch (error: any) {
    console.error('重置密码失败:', error);
    alert(error.response?.data?.error || '操作失败');
  }
};

const openRoleModal = () => {
  isRoleModalOpen.value = true;
};

const closeRoleModal = () => {
  isRoleModalOpen.value = false;
  currentRoleToEditId.value = null;
};

const handleEditRole = (role: RoleRow) => {
  currentRoleToEditId.value = role.id;
  isRoleModalOpen.value = true;
};

const handleRoleCreated = () => {
  fetchRoles();
};

const handleRoleUpdated = () => {
  fetchRoles();
};
</script>

<style scoped>
/* No specific styles needed using standard primitives */
</style>
