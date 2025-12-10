<template>
  <div class="batch-import">
    <!-- Step 1: Store Selection & File Upload in one row -->
    <div class="upload-section">
      <div class="upload-header">
        <div class="step-indicator">
          <span class="step-number">1</span>
          <span class="step-label">选择店铺并上传文件</span>
        </div>
        <p class="upload-hint">请先选择要导入数据的店铺，然后上传平台导出的 Excel 文件</p>
      </div>

      <div class="upload-grid">
        <!-- Country & Store Selection (Combined) -->
        <div class="store-select-card">
          <div class="field-group">
            <label class="field-label">
              <i class="pi pi-globe"></i>
              国家
            </label>
            <select v-model="localSelectedCountry" class="store-select">
              <option value="" disabled>请选择国家</option>
              <option v-for="country in availableCountries" :key="country.code" :value="country.code">
                {{ country.name }}
              </option>
            </select>
          </div>

          <div class="field-group">
            <label class="field-label">
              <i class="pi pi-shop"></i>
              所属店铺
            </label>
            <select v-model="selectedStoreId" class="store-select" :disabled="!localSelectedCountry">
              <option value="" disabled>请选择店铺</option>
              <option v-for="store in filteredStores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
            <p v-if="!localSelectedCountry" class="field-error">
              <i class="pi pi-info-circle"></i>
              请先选择国家
            </p>
            <p v-else-if="selectedStoreId" class="field-success">
              <i class="pi pi-check-circle"></i>
              已选择店铺
            </p>
          </div>
        </div>

        <!-- File Upload -->
        <div 
          class="file-upload-card"
          :class="{ 
            'is-dragging': isDragging, 
            'has-file': selectedFile,
            'is-disabled': !selectedStoreId 
          }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @dragenter="isDragging = true"
          @dragleave="isDragging = false"
        >
          <div class="upload-content">
            <div v-if="selectedFile" class="file-info">
              <i class="pi pi-file-excel file-icon"></i>
              <div class="file-details">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
              <button class="remove-file-btn" @click.stop="selectedFile = null">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div v-else class="upload-placeholder">
              <div class="upload-icon-wrapper">
                <i class="pi pi-cloud-upload"></i>
              </div>
              <div class="upload-text">
                <label for="file-upload" class="upload-link">
                  点击上传
                  <input 
                    id="file-upload" 
                    type="file" 
                    class="sr-only" 
                    @change="handleFileSelect" 
                    accept=".xlsx, .xls" 
                    :disabled="!selectedStoreId"
                  />
                </label>
                <span>或拖拽文件到这里</span>
              </div>
              <span class="upload-format">支持 .xlsx, .xls 格式</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="upload-actions">
        <button type="button" class="btn-reset" @click="reset">
          <i class="pi pi-refresh"></i>
          重置
        </button>
        <button 
          type="button" 
          class="btn-preview"
          @click="uploadAndPreview"
          :disabled="!selectedFile || !selectedStoreId || loading"
        >
          <i class="pi pi-eye" v-if="!loading"></i>
          <i class="pi pi-spin pi-spinner" v-else></i>
          {{ loading ? '解析中...' : '生成预览' }}
        </button>
      </div>
    </div>


    <div v-if="previewData.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-4 py-5 sm:px-6 border-b border-stone-200 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-stone-900">预览数据</h3>
            <div class="text-sm text-stone-500">
                已选 {{ selectedCount }} 条 (共 {{ previewData.length }} 条)
                其中未匹配 <span class="text-red-600 font-bold">{{ selectedUnmatchedCount }}</span> 条
            </div>
        </div>
        
        <!-- Pagination Controls (Top) -->
        <div class="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between sm:px-6">
            <div class="flex items-center">
                <span class="mr-2 text-sm text-stone-700">每显示:</span>
                <select v-model="pageSize" class="form-select rounded-md border-stone-300 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                </select>
            </div>
            <div class="flex items-center space-x-2">
                <button 
                    @click="currentPage--" 
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                    上一
                </button>
                <span class="text-sm text-stone-700">
                    第 {{ currentPage }} / {{ totalPages }} 
                </span>
                <button 
                    @click="currentPage++" 
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                    下一
                </button>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-stone-200">
                <thead class="bg-stone-50">
                    <tr>
                        <th scope="col" class="relative px-7 sm:w-12 sm:px-6">
                            <input type="checkbox" class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-600" :checked="isAllSelected" @change="toggleSelectAll" />
                        </th>
                        <th scope="col" class="table-th">订单号</th>
                        <th scope="col" class="table-th">日期</th>
                        <th scope="col" class="table-th">状态</th>
                        <th scope="col" class="table-th">取消/退货原因</th>
                        <th scope="col" class="table-th">商品标题</th>
                        <th scope="col" class="table-th">SKU</th>
                        <th scope="col" class="table-th">数量</th>
                        <th scope="col" class="table-th">金额</th>
                        <th scope="col" class="table-th">匹配状态</th>
                        <th scope="col" class="table-th text-right">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-stone-200 bg-white">
                    <tr v-for="(item, index) in paginatedPreviewData" :key="item.platformOrderId" :class="getRowClass(item)">
                        <td class="relative px-7 sm:w-12 sm:px-6">
                            <input type="checkbox" class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-600" v-model="item.selected" />
                        </td>
                        <td class="table-td font-medium">
                            {{ item.platformOrderId }}
                            <span v-if="item.isUpdate" class="ml-2 inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">更新</span>
                        </td>
                        <td class="table-td text-stone-500 whitespace-nowrap">{{ formatDate(item.orderDate) }}</td>
                        <td class="table-td text-stone-500">
                            <div v-if="item.isUpdate && item.existingData && item.existingData.orderStatus !== item.orderStatus" class="flex flex-col">
                                <span class="line-through text-xs text-stone-400">{{ item.existingData.orderStatus }}</span>
                                <span class="font-bold text-indigo-600">{{ item.orderStatus }}</span>
                            </div>
                            <span v-else>{{ item.orderStatus }}</span>
                        </td>
                        <td class="table-td text-stone-500 max-w-[150px] truncate" :title="item.cancelReason || ''">{{ item.cancelReason || '-' }}</td>
                        <td class="table-td text-stone-500 max-w-xs truncate" :title="item.title">{{ item.title }}</td>
                        <td class="table-td text-stone-500">{{ item.sku }}</td>
                        <td class="table-td text-stone-500">{{ item.quantity }}</td>
                        <td class="table-td text-stone-500">
                            <div v-if="item.isUpdate && item.existingData && item.existingData.revenue !== item.revenue" class="flex flex-col">
                                <span class="line-through text-xs text-stone-400">{{ item.existingData.revenue }}</span>
                                <span class="font-bold text-indigo-600">{{ item.revenue }}</span>
                            </div>
                            <span v-else>{{ item.revenue }}</span>
                        </td>
                        <td class="table-td">
                            <span v-if="item.listingId" class="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">已匹配({{ item.matchType }})</span>
                            <span v-else class="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">未匹配</span>
                        </td>
                        <td class="table-td text-right">
                            <button v-if="!item.listingId" @click="openMappingModal(item)" class="text-indigo-600 hover:text-indigo-900 font-medium">关联</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="bg-stone-50 px-4 py-3 sm:px-6 flex items-center justify-end border-t border-stone-200">
            <button 
                type="button" 
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="confirmImport"
                :disabled="selectedCount === 0 || selectedUnmatchedCount > 0 || submitting"
            >
                <span v-if="submitting">提交中...</span>
                <span v-else>确认导入已选</span>
            </button>
        </div>
    </div>

    <MappingModal 
        v-model="showMappingModal" 
        :item="currentMappingItem" 
        :storeId="selectedStoreId"
        @confirm="handleMappingConfirm" 
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import MappingModal from './MappingModal.vue';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '../../stores/auth';

const props = defineProps(['selectedCountry']);

const authStore = useAuthStore();
const localSelectedCountry = ref('');
const selectedStoreId = ref('');
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const loading = ref(false);
const submitting = ref(false);
const previewData = ref<any[]>([]);
const stores = ref<any[]>([]); 

// Pagination State
const currentPage = ref(1);
const pageSize = ref(10);

const showMappingModal = ref(false);
const currentMappingItem = ref<any>(null);

const selectedCount = computed(() => previewData.value.filter(i => i.selected).length);
const selectedUnmatchedCount = computed(() => previewData.value.filter(i => i.selected && !i.listingId).length);
const isAllSelected = computed(() => previewData.value.length > 0 && previewData.value.every(i => i.selected));

// Pagination Computed
const totalPages = computed(() => Math.ceil(previewData.value.length / pageSize.value) || 1);
const paginatedPreviewData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return previewData.value.slice(start, end);
});

// Reset page when data changes
watch(previewData, () => {
    currentPage.value = 1;
});

// Available countries from stores
const availableCountries = computed(() => {
    const uniqueCountriesMap = new Map();
    stores.value.forEach((store: any) => {
        if (store.country) {
            uniqueCountriesMap.set(store.country.code, store.country);
        }
    });
    
    const allUniqueCountries = Array.from(uniqueCountriesMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

    if (authStore.role === 'admin') {
        return allUniqueCountries;
    }
    
    const userCountryCodes = authStore.operatedCountries || [];
    return allUniqueCountries.filter((country: any) => 
        userCountryCodes.includes(country.code)
    );
});

// Computed: Filtered Stores based on selected country
const filteredStores = computed(() => {
    if (!localSelectedCountry.value) return [];
    return stores.value.filter((store: any) => store.countryCode === localSelectedCountry.value);
});

// Watch: Reset store when country changes
watch(localSelectedCountry, () => {
    selectedStoreId.value = '';
});

// Sync with prop if provided
watch(() => props.selectedCountry, (newVal) => {
    if (newVal) {
        localSelectedCountry.value = newVal;
    }
}, { immediate: true });

// Fetch stores and batches on mount
onMounted(async () => {
    try {
        const response = await apiClient.get('/admin/stores');
        stores.value = response.data;
        // Auto-select if only one country
        if (availableCountries.value.length === 1) {
            localSelectedCountry.value = availableCountries.value[0].code;
        }
    } catch (e) {
        console.error("Failed to fetch stores", e);
    }
});

const handleFileSelect = (event) => {
    selectedFile.value = event.target.files[0];
};

const handleDrop = (event) => {
    isDragging.value = false;
    selectedFile.value = event.dataTransfer.files[0];
};

const reset = () => {
    selectedFile.value = null;
    previewData.value = [];
    // selectedCountry.value = ''; // Do not reset prop
    selectedStoreId.value = '';
};

const toggleSelectAll = () => {
    const newValue = !isAllSelected.value;
    previewData.value.forEach(item => item.selected = newValue);
};

const uploadAndPreview = async () => {
    if (!selectedFile.value) return;
    
    // Find selected store to get expected platform
    const selectedStore = stores.value.find(s => s.id === selectedStoreId.value);
    if (!selectedStore) {
        alert("请选择有效的店铺");
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('storeId', selectedStoreId.value); // Append storeId

    try {
        const response = await apiClient.post('/sales-import/preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Validation: Check if detected platform matches store platform
        const detectedPlatform = response.data.platform;
        if (detectedPlatform !== selectedStore.platform) {
            alert(`平台不匹配！\n检测到的文件格式: ${detectedPlatform}\n所选店铺平台: ${selectedStore.platform}\n请检查文件或店铺选择。`);
            loading.value = false;
            return;
        }

        // Add selected property to each item
        previewData.value = response.data.data.map(item => ({ ...item, selected: true }));
        
    } catch (e) {
        console.error("Preview failed", e);
        alert("解析失败: " + (e.response?.data?.error || e.message));
    } finally {
        loading.value = false;
    }
};

const openMappingModal = (item) => {
    currentMappingItem.value = item;
    showMappingModal.value = true;
};

const handleMappingConfirm = (mappingResult) => {
    // mappingResult: { originalItem, listingId, listing }
    // Update the item in previewData
    const index = previewData.value.indexOf(mappingResult.originalItem);
    if (index !== -1) {
        previewData.value[index].listingId = mappingResult.listingId;
        previewData.value[index].matchType = 'MANUAL';
        // previewData.value[index].createMapping = true; // REMOVED: Do not create automatic mapping
    }
};

const confirmImport = async () => {
    if (selectedCount.value === 0) {
        alert("请至少选择一条数据");
        return;
    }
    if (selectedUnmatchedCount.value > 0) {
        alert("请先处理已选数据中的未匹配订单");
        return;
    }

    submitting.value = true;
    try {
        const selectedStore = stores.value.find(s => s.id === selectedStoreId.value);
        const itemsToImport = previewData.value.filter(i => i.selected);
        const payload = {
            platform: selectedStore.platform, // Use store platform
            storeId: selectedStoreId.value,
            items: itemsToImport
        };
        
        const response = await apiClient.post('/sales-import/confirm', payload);
        alert(`导入成功! 成功: ${response.data.success}, 失败: ${response.data.failed}`);
        reset();
    } catch (e) {
        console.error("Import failed", e);
        alert("导入失败: " + (e.response?.data?.error || e.message));
    } finally {
        submitting.value = false;
    }
};

const getRowClass = (item) => {
    if (!item.listingId) return 'bg-red-50/50';
    if (item.isUpdate) return 'bg-yellow-50/50';
    return 'bg-green-50/50';
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
}
.input-group label {
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.8rem; 
}
.form-input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--color-bg-card);
  transition: all var(--transition-fast);
}
.form-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}
.table-th {
  padding: 0.75rem 1.5rem; 
  text-align: left;
  font-size: 0.7rem; 
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.table-td {
  padding: 0.75rem 1.5rem; 
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--color-text-primary);
}

/* ========================================
   Batch Import - New Design
   ======================================== */
.batch-import {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.upload-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.step-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  padding-left: 2.5rem;
}

.upload-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .upload-grid {
    grid-template-columns: 1fr;
  }
}

.store-select-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-label i {
  color: var(--color-accent);
}

.store-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  background: var(--color-bg-card);
  transition: all var(--transition-fast);
}

.store-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.store-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #ef4444;
  margin: 0;
}

.field-success {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #10b981;
  margin: 0;
}

.file-upload-card {
  background: var(--color-bg-page);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.file-upload-card:hover:not(.is-disabled) {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.file-upload-card.is-dragging {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.file-upload-card.has-file {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}

.file-upload-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-content {
  width: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.upload-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  background: var(--color-accent-soft);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon-wrapper i {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.upload-text {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.upload-link {
  color: var(--color-accent);
  font-weight: 600;
  cursor: pointer;
}

.upload-link:hover {
  text-decoration: underline;
}

.upload-format {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.file-icon {
  font-size: 2.5rem;
  color: #10b981;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.file-size {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.remove-file-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.remove-file-btn:hover {
  background: #ef4444;
  color: white;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-reset:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.btn-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-preview:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-preview:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Override Tailwind hardcoded colors */
.bg-indigo-600 { background: var(--color-accent); }
.text-indigo-600 { color: var(--color-accent); }
.hover\:bg-indigo-700:hover { background: var(--color-accent); filter: brightness(0.95); }
.focus\:ring-indigo-600:focus { --tw-ring-color: var(--color-accent-soft); }
.bg-stone-50 { background: var(--color-bg-page); }
.border-stone-300, .border-stone-200, .border-stone-100 { border-color: var(--color-border); }
.text-stone-700, .text-stone-600 { color: var(--color-text-primary); }
.text-stone-500, .text-stone-400 { color: var(--color-text-secondary); }
.rounded-lg, .rounded-md { border-radius: var(--radius-sm); }
.shadow { box-shadow: var(--shadow-sm); }
</style>

