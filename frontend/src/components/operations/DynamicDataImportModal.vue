<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :modal="true"
    :header="modalTitle"
    :style="{ width: '80vw', minWidth: '600px' }"
    class="import-modal"
    @hide="resetForm"
  >
    <div class="import-container">
      
      <!-- Step 1: Upload -->
      <div v-if="!previewData.length" class="upload-section">
        <div class="field mb-4">
          <label class="uni-form-label">选择提取店铺 <span class="text-red-500">*</span></label>
          <Dropdown 
            v-model="selectedStoreId" 
            :options="storeOptions" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="请选择要导入数据的店铺" 
            class="w-full sm:w-80"
          />
        </div>

        <div class="field mb-4">
          <label class="uni-form-label">上传 Excel 报表</label>
          <div 
            class="file-upload-zone"
            :class="{ 'has-file': selectedFile, 'is-disabled': !selectedStoreId }"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <input 
              ref="fileInputRef"
              type="file" 
              class="hidden-input" 
              accept=".xlsx, .xls"
              @change="handleFileSelect"
              :disabled="!selectedStoreId"
            />
            
            <div v-if="selectedFile" class="file-preview">
              <i class="pi pi-file-excel text-green-500 text-4xl"></i>
              <div class="file-info">
                <span class="font-bold">{{ selectedFile.name }}</span>
                <span class="text-500 text-sm">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
              <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-danger" @click.stop="clearFile" />
            </div>
            
            <div v-else class="upload-placeholder">
              <i class="pi pi-cloud-upload text-4xl text-blue-500 mb-2"></i>
              <p class="font-bold m-0">点击或拖拽文件到此处</p>
              <p class="text-500 text-sm m-0">支持 .xlsx, .xls 格式</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <Button 
            label="生成预览" 
            icon="pi pi-eye" 
            @click="generatePreview" 
            :loading="isLoading" 
            :disabled="!selectedFile || !selectedStoreId"
            class="w-auto"
          />
        </div>
      </div>

      <!-- Step 2: Preview & Confirm -->
      <div v-else class="preview-section">
        <div class="preview-header mb-3 flex justify-between items-center bg-blue-50 p-3 rounded">
          <div>
            <span class="font-bold text-lg text-blue-800">预览数据</span>
            <span class="ml-3 text-500 text-sm">共识别出 {{ previewData.length }} 条记录，其中异常 <span class="text-red-500 font-bold">{{ errorCount }}</span> 条</span>
          </div>
          <Button label="重新上传" icon="pi pi-refresh" class="p-button-sm p-button-secondary p-button-text" @click="resetForm" />
        </div>

        <DataTable 
          :value="previewData" 
          scrollable 
          scrollHeight="400px"
          class="p-datatable-sm border rounded"
        >
          <Column field="recordDate" header="日期" style="min-width: 100px">
            <template #body="{ data }">
              <span :class="{'text-red-500 font-bold': !data.recordDate}">
                {{ data.recordDate ? new Date(data.recordDate).toLocaleDateString() : '缺失' }}
              </span>
            </template>
          </Column>

          <Column header="异常状态" style="min-width: 120px" v-if="errorCount > 0">
             <template #body="{ data }">
               <span v-if="data.hasError" class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded max-w-[150px] inline-block truncate" :title="data.errorMessage">
                 {{ data.errorMessage }}
               </span>
               <span v-else class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">正常</span>
             </template>
          </Column>

          <Column field="currency" header="币种" style="min-width: 80px" v-if="type === 'ADVERTISING'">
             <template #body="{ data }">
               <span v-if="data.currency">{{ data.currency }}</span>
               <span v-else class="text-500 italic">自动匹配</span>
             </template>
          </Column>

          <Column v-for="metric in activeMetrics" :key="metric.id" :header="metric.label" style="min-width: 100px">
             <template #body="{ data }">
               {{ Number(data.metrics?.[metric.name] || 0).toLocaleString() }}
             </template>
          </Column>

          <Column field="notes" header="备注" style="min-width: 150px" />
        </DataTable>

        <div class="flex justify-end mt-4 gap-2">
          <Button label="取消" icon="pi pi-times" class="p-button-text p-button-secondary w-auto" @click="$emit('update:visible', false)" />
          <Button 
            label="确认导入无异常数据" 
            icon="pi pi-check" 
            @click="confirmImport" 
            :loading="isSubmitting" 
            :disabled="validCount === 0"
            class="w-auto p-button-success"
          />
        </div>
      </div>
      
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '@/services/apiClient';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{
  visible: boolean;
  type: 'ADVERTISING' | 'TRAFFIC';
}>();

const emit = defineEmits(['update:visible', 'success']);

const toast = useToast();

const modalTitle = computed(() => props.type === 'ADVERTISING' ? '导入广告数据' : '导入流量数据');
const uploadUrl = computed(() => props.type === 'ADVERTISING' ? '/advertising/import/preview' : '/traffic/import/preview');
const confirmUrl = computed(() => props.type === 'ADVERTISING' ? '/advertising/import/confirm' : '/traffic/import/confirm');

// State
const rawStores = ref<any[]>([]);
const activeMetrics = ref<any[]>([]);
const selectedStoreId = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

const isLoading = ref(false);
const isSubmitting = ref(false);
const previewData = ref<any[]>([]);

// Computed
const storeOptions = computed(() => {
  return rawStores.value.map(s => ({ label: s.name, value: s.id }));
});

const errorCount = computed(() => previewData.value.filter(d => d.hasError).length);
const validCount = computed(() => previewData.value.length - errorCount.value);

// APIs
const fetchStores = async () => {
   try {
     const res = await apiClient.get('/admin/stores');
     rawStores.value = res.data;
   } catch(e) {}
};

const fetchActiveMetrics = async () => {
  try {
    const res = await apiClient.get(`/admin/metrics/active?type=${props.type}`);
    activeMetrics.value = res.data;
  } catch(e) {}
};

onMounted(() => {
  fetchStores();
});

watch(() => props.visible, (val) => {
  if (val) {
    fetchActiveMetrics();
  }
});

// Actions
const triggerFileInput = () => {
  if (!selectedStoreId.value) return;
  fileInputRef.value?.click();
};

const handleFileSelect = (event: any) => {
  const file = event.target.files?.[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleDrop = (event: any) => {
  if (!selectedStoreId.value) return;
  const file = event.dataTransfer.files?.[0];
  if (file) {
    selectedFile.value = file;
  }
};

const clearFile = () => {
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const resetForm = () => {
  selectedFile.value = null;
  previewData.value = [];
  isSubmitting.value = false;
  isLoading.value = false;
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const generatePreview = async () => {
  if (!selectedFile.value || !selectedStoreId.value) return;
  
  isLoading.value = true;
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('storeId', selectedStoreId.value);

  try {
    const res = await apiClient.post(uploadUrl.value, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Fill missing currencies for Advertising
    if (props.type === 'ADVERTISING') {
       const store = rawStores.value.find(s => s.id === selectedStoreId.value);
       const defaultCurrency = store?.countryCode ? getCurrency(store.countryCode) : 'CNY';
       res.data.data.forEach((item: any) => {
          if (!item.currency) item.currency = defaultCurrency;
       });
    }

    previewData.value = res.data.data;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: '解析失败', detail: e.response?.data?.error || e.message, life: 5000 });
  } finally {
    isLoading.value = false;
  }
};

const confirmImport = async () => {
  if (validCount.value === 0) return;

  isSubmitting.value = true;
  try {
    const payload = {
      items: previewData.value
    };
    const res = await apiClient.post(confirmUrl.value, payload);
    toast.add({ severity: 'success', summary: '导入成功', detail: `成功导入 ${res.data.success} 条，失败 ${res.data.failed} 条`, life: 5000 });
    emit('success');
    emit('update:visible', false);
    resetForm();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: '导入失败', detail: e.response?.data?.error || e.message, life: 5000 });
  } finally {
    isSubmitting.value = false;
  }
};

const getCurrency = (countryCode: string) => {
    const map: Record<string, string> = {
        'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP', 'SG': 'SGD',
        'TH': 'THB', 'VN': 'VND', 'TW': 'TWD', 'BR': 'BRL',
        'US': 'USD', 'UK': 'GBP', 'CN': 'CNY'
    };
    return map[countryCode] || 'CNY';
};
</script>

<style scoped>
.file-upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: #f9fafb;
  transition: all 0.2s;
}
.file-upload-zone:hover:not(.is-disabled) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}
.file-upload-zone.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.file-upload-zone.has-file {
  border-color: #10b981;
  background-color: #ecfdf5;
  padding: 1.5rem;
}
.hidden-input {
  display: none;
}
.file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.file-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
