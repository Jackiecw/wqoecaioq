<template>
  <div class="page-shell">
    <PageHeader 
      title="店铺管理" 
      subtitle="管理跨平台店铺的基础信息与状态。"
    >
      <template #actions>
        <button 
          @click="openModal"
          class="bg-[#2463EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <i class="pi pi-plus text-xs"></i>
          <span>新建店铺</span>
        </button>
      </template>
    </PageHeader>

    <ContentCard>
      <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
        {{ errorMessage }}
      </Message>

      <DataTable
        :value="stores"
        data-key="id"
        :loading="isLoading"
        class="p-datatable-sm"
        scrollable
      >
        <Column field="name" header="店铺名称" style="min-width: 10rem" />
        <Column field="platform" header="平台" style="min-width: 6rem" />
        <Column header="国家 (Code)" style="min-width: 8rem">
          <template #body="{ data }">
            {{ data.country?.name }} ({{ data.countryCode }})
          </template>
        </Column>
        <Column field="status" header="状态" style="min-width: 6rem">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="注册日期" style="min-width: 8rem">
          <template #body="{ data }">
            {{ formatDate(data.registeredAt) }}
          </template>
        </Column>
        <Column header="操作" style="min-width: 10rem">
          <template #body="{ data }">
            <div class="flex gap-2 flex-wrap">
              <Button label="编辑" size="small" text @click="handleEdit(data)" />
              <Button
                v-if="isAdmin"
                label="删除"
                size="small"
                text
                severity="danger"
                @click="handleDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </ContentCard>

    <StoreFormModal
      :is-open="isModalOpen"
      :store-to-edit="currentStoreToEdit"
      @close="closeModal"
      @store-created="handleStoreCreated"
      @store-updated="handleStoreUpdated"
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
import StoreFormModal from './StoreFormModal.vue';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';

type CountryOption = { code: string; name: string };
type StoreResponse = {
  id: string;
  name: string;
  platform: string;
  countryCode: string;
  country?: CountryOption;
  status: string;
  registeredAt?: string;
};

const stores = ref<StoreResponse[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isModalOpen = ref(false);
const currentStoreToEdit = ref<StoreResponse | null>(null);

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');

const statusSeverity = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'secondary';
    case 'suspended':
      return 'danger';
    default:
      return 'info';
  }
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
};

const fetchStores = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/admin/stores');
    stores.value = response.data || [];
  } catch (error: any) {
    console.error('获取店铺列表失败:', error);
    errorMessage.value = '获取店铺列表失败';
  } finally {
    isLoading.value = false;
  }
};

const openModal = () => {
  currentStoreToEdit.value = null;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  currentStoreToEdit.value = null;
};

const handleEdit = (store: StoreResponse) => {
  currentStoreToEdit.value = store;
  isModalOpen.value = true;
};

const handleStoreCreated = (newStore: StoreResponse) => {
  fetchStores();
};

const handleStoreUpdated = (updatedStore: StoreResponse) => {
  fetchStores();
};

const handleDelete = async (store: StoreResponse) => {
  if (!confirm(`确定要删除店铺 "${store.name}" 吗？`)) return;
  try {
    await apiClient.delete(`/admin/stores/${store.id}`);
    fetchStores();
  } catch (error: any) {
    console.error('删除失败:', error);
    alert(error?.response?.data?.error || '删除失败，请稍后再试');
  }
};

onMounted(() => {
  fetchStores();
});
</script>

<style scoped>
/* Scoped styles removed in favor of PageHeader, ContentCard, and standard styling */
</style>
