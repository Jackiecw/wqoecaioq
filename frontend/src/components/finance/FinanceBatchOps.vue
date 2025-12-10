<template>
  <div class="batch-ops">
    <div class="ops-grid">
      <!-- Import Card -->
      <div v-if="isAdmin" class="ops-card">
        <div class="ops-header">
          <div class="ops-icon ops-icon--import">
            <i class="pi pi-download"></i>
          </div>
          <div>
            <h3 class="ops-title">批量导入支出</h3>
            <p class="ops-desc">请下载模板，按格式填入后上传（仅限管理员）。</p>
          </div>
        </div>

        <div class="ops-content">
          <div class="template-section">
            <button class="btn-template" @click="handleDownloadTemplate">
              <i class="pi pi-file-excel"></i>
              下载 Excel 模板
            </button>
          </div>

          <div class="upload-section">
            <label class="field-label">上传已填写的 Excel 文件 *</label>
            <div 
              class="upload-zone"
              :class="{ 'is-dragging': isDragging, 'has-file': selectedFile }"
              @dragover.prevent
              @drop.prevent="handleDrop"
              @dragenter="isDragging = true"
              @dragleave="isDragging = false"
            >
              <div v-if="selectedFile" class="file-info">
                <i class="pi pi-file-excel file-icon"></i>
                <div class="file-details">
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                </div>
                <button class="btn-remove" @click.stop="clearFile">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <i class="pi pi-cloud-upload"></i>
                <label class="upload-text">
                  <input 
                    type="file" 
                    class="sr-only" 
                    accept=".xlsx,.xls"
                    @change="handleFileSelect"
                  />
                  <span class="upload-link">点击选择文件</span>
                  <span>或拖拽到此处</span>
                </label>
                <span class="upload-hint">支持 .xls / .xlsx，最大 5MB</span>
              </div>
            </div>

            <div class="upload-actions">
              <button 
                class="btn-upload" 
                :disabled="!selectedFile || isLoading.import"
                @click="handleUpload"
              >
                <i v-if="!isLoading.import" class="pi pi-upload"></i>
                <i v-else class="pi pi-spin pi-spinner"></i>
                {{ isLoading.import ? '导入中...' : '开始导入' }}
              </button>
            </div>
          </div>

          <!-- Import Result -->
          <div v-if="importResult" class="import-result" :class="importResult.failedCount > 0 ? 'result--warn' : 'result--success'">
            <div class="result-header">
              <i :class="importResult.failedCount > 0 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
              <span>{{ importResult.message }}</span>
            </div>
            <div class="result-stats">
              <span class="stat stat--success">成功：{{ importResult.importedCount }}</span>
              <span v-if="importResult.failedCount > 0" class="stat stat--error">失败：{{ importResult.failedCount }}</span>
            </div>
            <div v-if="importResult.failedRows?.length" class="result-details">
              <p class="details-title">失败详情</p>
              <ul class="details-list">
                <li v-for="fail in importResult.failedRows" :key="fail.row">
                  Excel 行 {{ fail.row }}：{{ fail.error }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Card -->
      <div v-if="canExport" class="ops-card">
        <div class="ops-header">
          <div class="ops-icon ops-icon--export">
            <i class="pi pi-upload"></i>
          </div>
          <div>
            <h3 class="ops-title">批量导出支出</h3>
            <p class="ops-desc">按日期范围导出支出数据到 Excel。</p>
          </div>
        </div>

        <div class="ops-content">
          <div class="export-form">
            <div class="field-group">
              <label class="field-label">开始日期 *</label>
              <input 
                type="date" 
                v-model="exportStartDateStr" 
                class="field-input"
              />
            </div>
            <div class="field-group">
              <label class="field-label">结束日期 *</label>
              <input 
                type="date" 
                v-model="exportEndDateStr" 
                class="field-input"
              />
            </div>
          </div>

          <div class="export-actions">
            <button 
              class="btn-export" 
              :disabled="!exportStartDateStr || !exportEndDateStr || isLoading.export"
              @click="handleExport"
            >
              <i v-if="!isLoading.export" class="pi pi-download"></i>
              <i v-else class="pi pi-spin pi-spinner"></i>
              {{ isLoading.export ? '导出中...' : '导出数据' }}
            </button>
          </div>

          <div v-if="exportError" class="export-error">
            <i class="pi pi-times-circle"></i>
            {{ exportError }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/stores/auth';
import financeService from '@/services/financeService';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');
const canExport = computed(() => authStore.permissions.includes('FINANCE_EXPORT'));

const isLoading = ref({ import: false, export: false });
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);

type ImportResult = {
  message: string;
  importedCount: number;
  failedCount: number;
  failedRows?: Array<{ row: number | string; error: string }>;
};

const importResult = ref<ImportResult | null>(null);

// Export dates as strings for native date input
const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const exportStartDateStr = ref(startOfMonth.toISOString().slice(0, 10));
const exportEndDateStr = ref(today.toISOString().slice(0, 10));
const exportError = ref('');

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
  importResult.value = null;
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file;
    importResult.value = null;
  }
};

const clearFile = () => {
  selectedFile.value = null;
  importResult.value = null;
};

const handleUpload = async () => {
  if (!selectedFile.value) return;

  isLoading.value.import = true;
  importResult.value = null;

  const payload = new FormData();
  payload.append('expenseFile', selectedFile.value);

  try {
    const response = await financeService.importExpenses(payload);
    importResult.value = {
      message: response?.message || '导入完成',
      importedCount: response?.importedCount ?? 0,
      failedCount: response?.failedCount ?? 0,
      failedRows: response?.failedRows ?? [],
    };
  } catch (error: any) {
    console.error('导入失败:', error);
    importResult.value = {
      message: error?.response?.data?.error || '导入失败，请重试',
      importedCount: 0,
      failedCount: 0,
      failedRows: [],
    };
  } finally {
    isLoading.value.import = false;
    selectedFile.value = null;
  }
};

const handleDownloadTemplate = () => {
  const headers = [
    '支出日期', '项目描述', '金额', '付款方式', '付款人', '收款人',
    '票据状态', '是否垫付(Y/N)', '报销日期', '归属店铺名称', '备注',
  ];

  const exampleData = [
    ['2025-11-10', 'Facebook 广告费', 1500.5, '信用卡', '公司招商卡', 'Facebook', '无票', 'N', '', 'Shopee 印尼 Mall 店', '11 月第一个投放'],
    ['2025-11-11', 'Tiktok 达人营销', 500, '银行转账', '运营A', 'Tiktok Agency', '普票', 'Y', '2025-11-30', 'Tiktok 越南', 'KOL 合作'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
  ws['!cols'] = [
    { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
    { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '支出模板');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), '支出批量导入模板.xlsx');
};

const handleExport = async () => {
  exportError.value = '';
  if (!exportStartDateStr.value || !exportEndDateStr.value) {
    exportError.value = '请选择导出日期范围。';
    return;
  }
  isLoading.value.export = true;

  try {
    const blob = await financeService.exportExpenses({
      startDate: exportStartDateStr.value,
      endDate: exportEndDateStr.value,
    });
    const fileBlob = new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(fileBlob, `支出报表_${exportStartDateStr.value}_至_${exportEndDateStr.value}.xlsx`);
  } catch (error) {
    console.error('导出失败:', error);
    exportError.value = '导出失败，请重试';
  } finally {
    isLoading.value.export = false;
  }
};
</script>

<style scoped>
/* ========================================
   Finance Batch Operations - Modern UI
   ======================================== */
.batch-ops {
  padding: 0;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .ops-grid {
    grid-template-columns: 1fr;
  }
}

/* Card */
.ops-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ops-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0;
}

.ops-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  font-size: 1.125rem;
  flex-shrink: 0;
}

.ops-icon--import {
  background: #dbeafe;
  color: #2563eb;
}

.ops-icon--export {
  background: #d1fae5;
  color: #059669;
}

.ops-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem;
}

.ops-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.ops-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Template Section */
.template-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.btn-template {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-template:hover {
  background: var(--color-bg-page);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-template i {
  color: #10b981;
}

/* Upload Section */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  text-align: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.upload-zone.is-dragging {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.upload-zone.has-file {
  border-style: solid;
  background: var(--color-bg-page);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-placeholder > i {
  font-size: 2rem;
  color: var(--color-text-muted);
}

.upload-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.upload-link {
  color: var(--color-accent);
  font-weight: 500;
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* File Info */
.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-icon {
  font-size: 1.5rem;
  color: #10b981;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  display: block;
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 0.875rem;
}

.file-size {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.btn-remove {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.btn-remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Upload Actions */
.upload-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-upload,
.btn-export {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-upload:hover:not(:disabled),
.btn-export:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-upload:disabled,
.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Import Result */
.import-result {
  border-radius: var(--radius-md);
  padding: 1rem;
}

.result--success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
}

.result--warn {
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
}

.result--success .result-header {
  color: #047857;
}

.result--warn .result-header {
  color: #b45309;
}

.result-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.stat--success {
  color: #059669;
}

.stat--error {
  color: #dc2626;
}

.result-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.details-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #b45309;
  margin: 0 0 0.5rem;
}

.details-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8125rem;
  color: #92400e;
  max-height: 120px;
  overflow-y: auto;
}

.details-list li {
  margin-bottom: 0.25rem;
}

/* Export Form */
.export-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .export-form {
    grid-template-columns: 1fr;
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.field-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.export-actions {
  padding-top: 0.5rem;
}

.export-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
