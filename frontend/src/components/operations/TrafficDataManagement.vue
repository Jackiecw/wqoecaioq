<template>
  <div class="page-container traffic-management">
    <div class="header-section">
      <div class="title-area">
        <h1 class="page-title">流量数据管理</h1>
        <p class="page-subtitle">录入和管理各店铺的日常流量表现指标</p>
      </div>
      <div class="actions-area gap-2 flex">
        <Button
          label="导入数据"
          icon="pi pi-upload"
          class="p-button-secondary p-button-outlined"
          @click="openImportModal"
        />
        <Button
          label="手动录入"
          icon="pi pi-plus"
          class="p-button-primary"
          @click="openAddModal"
        />
      </div>
    </div>

    <!-- Global Context Teleport: Country Filter -->
    <div class="mb-4">
      <Dropdown
        v-model="opsStore.countryCode"
        :options="countryOptions"
        option-label="name"
        option-value="code"
        placeholder="选择国家"
        class="w-[10rem]"
        show-clear
      />
    </div>

    <!-- 过滤器 -->
    <div class="filter-section card mb-4">
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
        <!-- 第一个部分：基于选定国家的店铺 Pill Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide flex-1">
          <button 
            class="flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border"
            :class="!opsStore.storeId ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
            @click="opsStore.storeId = null"
          >
            全部店铺
          </button>
          <button 
            v-for="store in filteredStores" 
            :key="store.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border"
            :class="opsStore.storeId === store.id ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
            @click="opsStore.storeId = store.id"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            {{ store.name }}
          </button>
        </div>

        <div class="field-group flex items-center gap-2">
           <span class="font-bold text-sm text-gray-700">日期范围:</span>
           <Calendar v-model="filters.dates" selectionMode="range" :manualInput="false" placeholder="选择记录日期" class="w-64" />
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section card">
      <DataTable
        :value="dataList"
        :loading="isLoading"
        class="p-datatable-sm"
        stripedRows
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox text-4xl mb-3 text-500"></i>
            <p>未找到符合条件的流量数据</p>
          </div>
        </template>
        <Column field="recordDate" header="归属日期" :sortable="true">
           <template #body="{ data }">
            {{ new Date(data.recordDate).toLocaleDateString() }}
           </template>
        </Column>
        <Column field="store.name" header="店铺" />
        
        <!-- 动态指标列 -->
        <Column v-for="metric in activeMetrics" :key="metric.id" :header="metric.label">
           <template #body="{ data }">
             <span class="font-semibold">{{ Number(data.metrics?.[metric.name] || 0).toLocaleString() }}</span>
           </template>
        </Column>

        <Column field="enteredBy.nickname" header="录入人" />
        
        <Column header="操作" :exportable="false" style="min-width:8rem" headerStyle="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-info" @click="openEditModal(data)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDelete(data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
      <div class="mt-4">
         <Paginator :rows="pageSize" :totalRecords="totalRecords" @page="onPage($event)" />
      </div>
    </div>

    <!-- 表单弹窗 -->
    <Dialog
      v-model:visible="isModalOpen"
      :header="editingData ? '编辑流量数据' : '录入流量数据'"
      :modal="true"
      :style="{ width: '500px' }"

    >
      <div v-if="!activeMetrics.length" class="text-center p-4">
         <Message severity="warn" :closable="false">尚未配置任何可用的流量指标，请联系管理员在后台配置。</Message>
      </div>

      <div v-else class="form-wrapper mt-3">
         <div class="field mb-4">
            <label class="uni-form-label">归属日期 <span class="text-red-500">*</span></label>
            <Calendar v-model="form.recordDate" dateFormat="yy-mm-dd" placeholder="选择日期" class="w-full" />
         </div>

         <div class="field mb-4">
            <label class="uni-form-label">选择店铺 <span class="text-red-500">*</span></label>
            <Dropdown v-model="form.storeId" :options="rawStores" optionLabel="name" optionValue="id" placeholder="必须选择店铺" class="w-full" />
         </div>

         <Divider align="left"><b>各项指标数据</b></Divider>

         <div v-for="metric in activeMetrics" :key="metric.id" class="field mb-4">
            <label class="uni-form-label">{{ metric.label }} <span class="text-gray-500 text-xs font-normal">({{ metric.name }})</span></label>
            <InputNumber v-model="form.metrics[metric.name]" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" placeholder="0" />
         </div>

         <div class="field mb-4">
            <label class="uni-form-label">备注 <span class="text-gray-500 font-normal">(选填)</span></label>
            <Textarea v-model="form.notes" rows="2" class="w-full" />
         </div>
      </div>

      <div class="uni-modal-footer">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" @click="saveData" :loading="isSaving" :disabled="!activeMetrics.length" />
      </div>
    </Dialog>

    <ConfirmDialog />

    <DynamicDataImportModal 
      v-model:visible="isImportModalOpen"
      type="TRAFFIC"
      @success="fetchData(1)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import apiClient from '@/services/apiClient';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Paginator from 'primevue/paginator';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Divider from 'primevue/divider';
import Message from 'primevue/message';
import DynamicDataImportModal from './DynamicDataImportModal.vue';
import { useOperationsStore } from '@/stores/operations';
import { useAuthStore } from '@/stores/auth';
import { usePermission } from '@/composables/usePermission';

// Types
interface MetricDefinition {
  id: string;
  name: string;
  label: string;
  order: number;
}

// State
const activeMetrics = ref<MetricDefinition[]>([]);
const dataList = ref<any[]>([]);
const rawStores = ref<any[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);

const totalRecords = ref(0);
const pageSize = ref(20);
const currentPage = ref(1);

const filters = ref({
  dates: null as Date[] | null
});

const isModalOpen = ref(false);
const isImportModalOpen = ref(false);
const editingData = ref<any>(null);

const opsStore = useOperationsStore();
const authStore = useAuthStore();
const { isAdmin } = usePermission();
const toast = useToast();
const confirmService = useConfirm();

const form = ref({
  recordDate: new Date(),
  storeId: '',
  metrics: {} as Record<string, number>,
  notes: ''
});

// Computed
const countryOptions = computed(() => {
  const unique = new Map<string, {code: string, name: string}>();
  rawStores.value.forEach(store => {
     if (store.countryCode) {
       unique.set(store.countryCode, { code: store.countryCode, name: store.country?.name || store.countryCode });
     } else if (store.country) {
       unique.set(store.country.code, store.country);
     }
  });
  const all = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  if (isAdmin.value) return all;
  const allowed = authStore.operatedCountries || [];
  return all.filter((country) => allowed.includes(country.code));
});

const filteredStores = computed(() => {
  if (!opsStore.countryCode) return [];
  return rawStores.value
    .filter(s => s.countryCode === opsStore.countryCode || (s.country && s.country.code === opsStore.countryCode))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Watch Global Store filters and auto-fetch
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(
  [() => opsStore.countryCode, () => opsStore.storeId, () => filters.value.dates],
  () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchData(1), 300);
  },
  { deep: true }
);

// APIs
const fetchStores = async () => {
   try {
     const res = await apiClient.get('/admin/stores');
     rawStores.value = res.data;
   } catch(e) { console.error('Error fetching stores', e); }
};

const fetchActiveMetrics = async () => {
  try {
    const res = await apiClient.get('/admin/metrics/active?type=TRAFFIC');
    activeMetrics.value = res.data;
  } catch(e) { console.error('Error fetching metrics', e); }
};

const fetchData = async (page = 1) => {
  isLoading.value = true;
  currentPage.value = page;
  
  let startDate = '';
  let endDate = '';
  if (filters.value.dates && filters.value.dates.length === 2 && filters.value.dates[0] && filters.value.dates[1]) {
    startDate = filters.value.dates[0].toISOString();
    endDate = filters.value.dates[1].toISOString();
  }

  try {
     const params = new URLSearchParams({
       page: page.toString(),
       pageSize: pageSize.value.toString()
     });
     if (startDate) params.append('startDate', startDate);
     if (endDate) params.append('endDate', endDate);
     if (opsStore.countryCode) params.append('countryCode', opsStore.countryCode);
     if (opsStore.storeId) params.append('storeId', opsStore.storeId);

     const res = await apiClient.get(`/traffic?${params.toString()}`);
     dataList.value = res.data.data;
     totalRecords.value = res.data.total;
  } catch (err) {
     console.error('Failed to fetch data', err);
  } finally {
     isLoading.value = false;
  }
};

const onPage = (event: any) => {
  fetchData(event.page + 1);
};

// Actions
const openAddModal = () => {
  editingData.value = null;
  form.value = {
    recordDate: new Date(),
    storeId: '',
    metrics: {},
    notes: ''
  };
  // Initialize metrics keys
  activeMetrics.value.forEach(m => {
    form.value.metrics[m.name] = 0;
  });
  isModalOpen.value = true;
};

const openEditModal = (data: any) => {
  editingData.value = data;
  form.value = {
    recordDate: new Date(data.recordDate),
    storeId: data.storeId,
    metrics: { ...data.metrics },
    notes: data.notes || ''
  };
  // Ensure all active metrics have at least a default value in the form
  activeMetrics.value.forEach(m => {
    if (form.value.metrics[m.name] === undefined) {
       form.value.metrics[m.name] = 0;
    }
  });
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingData.value = null;
};

const saveData = async () => {
  if (!form.value.recordDate || !form.value.storeId) {
     toast.add({ severity: 'warn', summary: '提示', detail: '请填写日期和选择店铺', life: 3000 });
     return;
  }

  isSaving.value = true;

  try {
     if (editingData.value) {
       await apiClient.put(`/traffic/${editingData.value.id}`, form.value);
     } else {
       await apiClient.post('/traffic', form.value);
     }
     closeModal();
     fetchData(currentPage.value);
  } catch(e: any) {
     toast.add({ severity: 'error', summary: '保存失败', detail: e.response?.data?.error || e.message, life: 5000 });
  } finally {
     isSaving.value = false;
  }
};

const confirmDelete = (id: string) => {
  confirmService.require({
    message: '确定要删除这条记录吗？',
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await apiClient.delete(`/traffic/${id}`);
        fetchData(currentPage.value);
      } catch(e) {
        toast.add({ severity: 'error', summary: '删除失败', detail: '请稍后重试', life: 3000 });
      }
    }
  });
};

const openImportModal = () => {
  isImportModalOpen.value = true;
};

onMounted(async () => {
  await Promise.all([fetchStores(), fetchActiveMetrics()]);
  fetchData();
});
</script>

<style scoped>
.traffic-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-area {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-border);
  padding: 1.5rem;
}

.filter-section {
  padding: 1rem 1.5rem;
}

.table-section {
  padding: 0;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
}

/* 覆盖 PrimeVue 样式以适应主题 */
:deep(.p-datatable-header) {
  background: transparent;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
}

:deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}
</style>
