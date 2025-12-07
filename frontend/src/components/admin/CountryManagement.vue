<template>
  <div class="page-shell">
    <PageHeader 
      title="国家管理" 
      subtitle="维护国家列表，供店铺/权限分配引用。"
    >
      <template #actions>
        <button 
          @click="openModal"
          class="bg-[#2463EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <i class="pi pi-plus text-xs"></i>
          <span>新建国家</span>
        </button>
      </template>
    </PageHeader>

    <ContentCard>
      <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
        {{ errorMessage }}
      </Message>

      <DataTable
        :value="countries"
        data-key="id"
        :loading="isLoading"
        class="p-datatable-sm"
        scrollable
      >
        <Column field="name" header="国家名称" style="min-width: 10rem" />
        <Column field="code" header="国家代码" style="min-width: 8rem" />
        <Column header="设立日期" style="min-width: 8rem">
          <template #body="{ data }">
            {{ formatDate(data.establishedAt) }}
          </template>
        </Column>
        <Column header="操作" style="min-width: 8rem">
          <template #body="{ data }">
            <Button label="编辑" size="small" text @click="handleEdit(data)" />
          </template>
        </Column>
      </DataTable>
    </ContentCard>

    <CountryFormModal
      :is-open="isModalOpen"
      :country-to-edit-id="currentCountryToEditId"
      @close="closeModal"
      @country-created="handleCountryCreated"
      @country-updated="handleCountryUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';
import CountryFormModal from './CountryFormModal.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';

type Country = {
  id: string;
  name: string;
  code: string;
  establishedAt?: string;
};

const countries = ref<Country[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isModalOpen = ref(false);
const currentCountryToEditId = ref<string | null>(null);

const formatDate = (val?: string) => {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
};

const fetchCountries = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/admin/countries');
    countries.value = response.data || [];
  } catch (error: any) {
    console.error('获取国家列表失败:', error);
    errorMessage.value = '获取国家列表失败';
  } finally {
    isLoading.value = false;
  }
};

const openModal = () => {
  currentCountryToEditId.value = null;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  currentCountryToEditId.value = null;
};

const handleEdit = (country: Country) => {
  currentCountryToEditId.value = country.id;
  isModalOpen.value = true;
};

const handleCountryCreated = () => fetchCountries();
const handleCountryUpdated = () => fetchCountries();

onMounted(() => {
  fetchCountries();
});
</script>

<style scoped>
/* Scoped styles removed */
</style>
