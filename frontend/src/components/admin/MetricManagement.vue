<template>
  <div class="page-container metrics-management">
    <div class="header-section">
      <div class="title-area">
        <h1 class="page-title">动态指标管理</h1>
        <p class="page-subtitle">配置广告与流量数据录入时需要填报的动态指标字段</p>
      </div>
      <div class="actions-area">
        <Button
          label="新增指标"
          icon="pi pi-plus"
          class="p-button-primary"
          @click="openAddModal"
        />
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-section card">
      <div class="filter-group">
        <h3 class="filter-label">指标类型</h3>
        <Dropdown
          v-model="selectedType"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section card">
      <DataTable
        :value="filteredMetrics"
        :loading="isLoading"
        class="p-datatable-sm"
        stripedRows
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox text-4xl mb-3 text-500"></i>
            <p>暂无配置任何指标</p>
            <Button
              label="立即新增"
              icon="pi pi-plus"
              class="p-button-text p-button-sm mt-2"
              @click="openAddModal"
            />
          </div>
        </template>
        <Column field="order" header="排序" headerStyle="width: 80px">
          <template #body="{ data }">
             <div class="font-semibold">{{ data.order }}</div>
          </template>
        </Column>
        <Column field="name" header="字段键名 (Key)">
           <template #body="{ data }">
            <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{{ data.name }}</span>
           </template>
        </Column>
        <Column field="label" header="展示名称 (Label)" />
        <Column field="isActive" header="状态" headerStyle="width: 120px">
          <template #body="{ data }">
            <div @click="!isUpdatingStatus ? toggleStatus(data) : null" style="display: inline-block; cursor: pointer;">
              <InputSwitch
                :modelValue="data.isActive"
                style="pointer-events: none;"
              />
            </div>
          </template>
        </Column>
        <Column header="操作" :exportable="false" style="min-width:8rem" headerStyle="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-info" @click="openEditModal(data)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 新增/编辑弹窗 -->
    <Dialog
      v-model:visible="isModalOpen"
      :header="editingMetric ? '编辑指标' : '新增指标'"
      :modal="true"
      :style="{ width: '450px' }"
      class="p-fluid"
    >
      <div class="field mt-3">
        <label for="type" class="block font-bold mb-2">类型 <span class="text-red-500">*</span></label>
        <Dropdown
          inputId="type"
          v-model="form.type"
          :options="typeDropdownOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="请选择"
          :disabled="!!editingMetric"
          class="w-full"
        />
      </div>

      <div class="field mt-4">
        <label for="name" class="block font-bold mb-2">字段键名 (Key) <span class="text-red-500">*</span></label>
        <InputText
          id="name"
          v-model="form.name"
          placeholder="如：spend, clicks, pageViews"
          :disabled="!!editingMetric"
          :class="{'p-invalid': errorFields.name}"
        />
        <small class="p-error" v-if="errorFields.name">仅限英文字母、数字和下划线开头不可为数字</small>
        <small class="text-500 block mt-1">创建后不可修改。此值为导入 Excel 时的默认匹配列之一。</small>
      </div>

      <div class="field mt-4">
        <label for="label" class="block font-bold mb-2">展示名称 (Label) <span class="text-red-500">*</span></label>
        <InputText
          id="label"
          v-model="form.label"
          placeholder="如：广告花费"
          :class="{'p-invalid': errorFields.label}"
        />
        <small class="p-error" v-if="errorFields.label">展示名称为必填项</small>
      </div>

      <div class="field mt-4">
        <label for="order" class="block font-bold mb-2">排序优先级</label>
        <InputNumber
          inputId="order"
          v-model="form.order"
          showButtons
          :min="0"
          :max="999"
          class="w-full"
        />
        <small class="text-500 block mt-1">数字越小，在前端表单和表格中越靠前。</small>
      </div>

      <div class="field mt-4 flex items-center gap-2">
        <InputSwitch inputId="isActive" v-model="form.isActive" />
        <label for="isActive" class="font-bold mb-0">是否立即启用</label>
      </div>

      <Message v-if="modalError" severity="error" :closable="false" class="mt-4">{{ modalError }}</Message>

      <template #footer>
        <Button label="取消" icon="pi pi-times" class="p-button-text" @click="closeModal" />
        <Button label="保存" icon="pi pi-check" @click="saveMetric" :loading="isSaving" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/services/apiClient';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputSwitch from 'primevue/inputswitch';
import Message from 'primevue/message';

// --- Types ---
type MetricType = 'ADVERTISING' | 'TRAFFIC';

interface MetricDefinition {
  id: string;
  type: MetricType;
  name: string;
  label: string;
  isActive: boolean;
  order: number;
}

// --- State ---
const metrics = ref<MetricDefinition[]>([]);
const isLoading = ref(true);
const selectedType = ref<MetricType | 'ALL'>('ADVERTISING');

const typeOptions = [
  { label: '全部', value: 'ALL' },
  { label: '广告指标', value: 'ADVERTISING' },
  { label: '流量指标', value: 'TRAFFIC' }
];

const typeDropdownOptions = [
  { label: '广告指标 (ADVERTISING)', value: 'ADVERTISING' },
  { label: '流量指标 (TRAFFIC)', value: 'TRAFFIC' }
];

// Modal State
const isModalOpen = ref(false);
const editingMetric = ref<MetricDefinition | null>(null);
const isSaving = ref(false);
const modalError = ref('');
const isUpdatingStatus = ref<string | null>(null);

const form = ref({
  type: 'ADVERTISING' as MetricType,
  name: '',
  label: '',
  order: 0,
  isActive: true
});

const errorFields = ref({
  name: false,
  label: false
});

// --- Computed ---
const filteredMetrics = computed(() => {
  let list = metrics.value;
  if (selectedType.value !== 'ALL') {
    list = list.filter(m => m.type === selectedType.value);
  }
  // 按类型分组排序，或者直接按 order 排序
  return list.sort((a, b) => a.order - b.order);
});

// --- Methods ---
const fetchMetrics = async () => {
  isLoading.value = true;
  try {
    const res = await apiClient.get('/admin/metrics');
    metrics.value = res.data;
  } catch (err) {
    console.error('Failed to fetch metrics:', err);
  } finally {
    isLoading.value = false;
  }
};

const openAddModal = () => {
  editingMetric.value = null;
  form.value = {
    type: selectedType.value === 'ALL' ? 'ADVERTISING' : selectedType.value as MetricType,
    name: '',
    label: '',
    order: metrics.value.length * 10,
    isActive: true
  };
  resetErrors();
  isModalOpen.value = true;
};

const openEditModal = (metric: MetricDefinition) => {
  editingMetric.value = metric;
  form.value = { ...metric };
  resetErrors();
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingMetric.value = null;
  modalError.value = '';
};

const resetErrors = () => {
  errorFields.value = { name: false, label: false };
  modalError.value = '';
};

const validateForm = () => {
  resetErrors();
  let isValid = true;

  if (!form.value.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.value.name)) {
    errorFields.value.name = true;
    isValid = false;
  }
  
  if (!form.value.label.trim()) {
    errorFields.value.label = true;
    isValid = false;
  }

  return isValid;
};

const saveMetric = async () => {
  if (!validateForm()) return;

  isSaving.value = true;
  modalError.value = '';
  
  try {
    if (editingMetric.value) {
      await apiClient.put(`/admin/metrics/${editingMetric.value.id}`, {
        label: form.value.label,
        order: form.value.order,
        isActive: form.value.isActive
      });
    } else {
      await apiClient.post('/admin/metrics', form.value);
    }
    await fetchMetrics();
    closeModal();
  } catch (err: any) {
    modalError.value = err.response?.data?.error || err.message || '保存失败';
  } finally {
    isSaving.value = false;
  }
};

const toggleStatus = async (metric: MetricDefinition) => {
  isUpdatingStatus.value = metric.id;
  try {
    await apiClient.put(`/admin/metrics/${metric.id}`, {
      label: metric.label,
      order: metric.order,
      isActive: !metric.isActive
    });
    metric.isActive = !metric.isActive;
  } catch (err: any) {
    alert('更新状态失败: ' + (err.response?.data?.error || err.message));
  } finally {
    isUpdatingStatus.value = null;
  }
};

const confirmDelete = async (metric: MetricDefinition) => {
  if (!confirm(`确定要删除指标 [${metric.label}] 吗？\n注意：这不会删除已录入的数据中该键名的 JSON 值，但可能会影响前端展示。`)) {
    return;
  }
  
  try {
    await apiClient.delete(`/admin/metrics/${metric.id}`);
    await fetchMetrics();
  } catch (err: any) {
    alert('删除失败: ' + (err.response?.data?.error || err.message));
  }
};

// --- Lifecycle ---
onMounted(() => {
  fetchMetrics();
});

</script>

<style scoped>
.metrics-management {
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

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-label {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
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

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
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
