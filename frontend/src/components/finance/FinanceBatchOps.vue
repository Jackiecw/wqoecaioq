<template>
  <div class="grid gap-4 md:grid-cols-2">
    <Card v-if="isAdmin" class="shadow-1 border-round-2xl">
      <template #title>批量导入支出</template>
      <template #content>
        <p class="text-sm text-color-secondary mb-3">
          请下载模板，按格式填入后上传（仅限管理员）。
        </p>
        <div class="flex gap-2 mb-4">
          <Button label="下载 Excel 模板" icon="pi pi-download" outlined @click="handleDownloadTemplate" />
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">上传已填写的 Excel 文件 *</label>
          <FileUpload
            ref="uploadRef"
            name="expenseFile"
            :auto="false"
            :custom-upload="true"
            choose-label="选择文件"
            upload-label="开始导入"
            cancel-label="清除"
            accept=".xlsx,.xls"
            :max-file-size="5000000"
            :disabled="isLoading.import"
            @select="onFileSelect"
            @clear="onFileClear"
            @uploader="handleUpload"
          />
          <small class="text-color-secondary">支持 .xls / .xlsx，最大 5MB。</small>
        </div>

        <div v-if="importResult" class="mt-4 space-y-2">
          <Message :severity="importResult.failedCount > 0 ? 'warn' : 'success'" :closable="false">
            {{ importResult.message }}
          </Message>
          <p class="m-0 text-sm text-color">成功导入：{{ importResult.importedCount }}</p>
          <p v-if="importResult.failedCount > 0" class="m-0 text-sm text-red-600">
            失败：{{ importResult.failedCount }}
          </p>
          <div
            v-if="importResult.failedRows && importResult.failedRows.length"
            class="p-3 bg-red-50 border-round border-1 border-red-200 max-h-12rem overflow-auto"
          >
            <p class="text-sm font-semibold text-red-700 m-0 mb-2">失败详情</p>
            <ul class="list-none p-0 m-0 text-sm text-red-700">
              <li v-for="fail in importResult.failedRows" :key="fail.row" class="mb-1">
                Excel 行 {{ fail.row }}：{{ fail.error }}
              </li>
            </ul>
          </div>
        </div>
      </template>
    </Card>

    <Card v-if="canExport" class="shadow-1 border-round-2xl">
      <template #title>批量导出支出</template>
      <template #content>
        <p class="text-sm text-color-secondary mb-3">按日期范围导出支出数据到 Excel。</p>
        <div class="grid formgrid p-fluid">
          <div class="field col-12 md:col-6">
            <label class="font-semibold text-sm mb-2 block">开始日期</label>
            <Calendar v-model="exportDates.startDate" show-icon date-format="yy-mm-dd" class="w-full" />
          </div>
          <div class="field col-12 md:col-6">
            <label class="font-semibold text-sm mb-2 block">结束日期 *</label>
            <Calendar v-model="exportDates.endDate" show-icon date-format="yy-mm-dd" class="w-full" />
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <Button
            label="导出数据"
            icon="pi pi-upload"
            :disabled="!exportDates.startDate || !exportDates.endDate || isLoading.export"
            :loading="isLoading.export"
            @click="handleExport"
          />
        </div>
        <Message v-if="exportError" severity="error" :closable="false" class="mt-3">
          {{ exportError }}
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Calendar from 'primevue/calendar';
import FileUpload, { type FileUploadSelectEvent, type FileUploadUploadEvent } from 'primevue/fileupload';
import Message from 'primevue/message';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/stores/auth';
import financeService from '@/services/financeService';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');
const canExport = computed(() => authStore.permissions.includes('FINANCE_EXPORT'));

type FileUploadInstance = InstanceType<typeof FileUpload> & { clear: () => void };

const isLoading = ref({ import: false, export: false });
const uploadRef = ref<FileUploadInstance | null>(null);
const selectedFile = ref<File | null>(null);

type ImportResult = {
  message: string;
  importedCount: number;
  failedCount: number;
  failedRows?: Array<{ row: number | string; error: string }>;
};

const importResult = ref<ImportResult | null>(null);

const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const exportDates = ref<{ startDate: Date | null; endDate: Date | null }>({
  startDate: startOfMonth,
  endDate: today,
});
const exportError = ref('');

const onFileSelect = (event: FileUploadSelectEvent) => {
  selectedFile.value = event.files?.[0] ?? null;
  importResult.value = null;
};

const onFileClear = () => {
  selectedFile.value = null;
  importResult.value = null;
};

const handleUpload = async (event: FileUploadUploadEvent) => {
  const file = selectedFile.value || event.files?.[0];
  if (!file) {
    importResult.value = {
      message: '请先选择文件后再上传。',
      importedCount: 0,
      failedCount: 0,
    };
    return;
  }

  isLoading.value.import = true;
  importResult.value = null;

  const payload = new FormData();
  payload.append('expenseFile', file);

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
    uploadRef.value?.clear();
  }
};

const handleDownloadTemplate = () => {
  const headers = [
    '支出日期',
    '项目描述',
    '金额',
    '付款方式',
    '付款人',
    '收款人',
    '票据状态',
    '是否垫付(Y/N)',
    '报销日期',
    '归属店铺名称',
    '备注',
  ];

  const exampleData = [
    ['2025-11-10', 'Facebook 广告费', 1500.5, '信用卡', '公司招商卡', 'Facebook', '无票', 'N', '', 'Shopee 印尼 Mall 店', '11 月第一个投放'],
    ['2025-11-11', 'Tiktok 达人营销', 500, '银行转账', '运营A', 'Tiktok Agency', '普票', 'Y', '2025-11-30', 'Tiktok 越南', 'KOL 合作'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 30 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '支出模板');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), '支出批量导入模板.xlsx');
};

const formatDateInput = (date: Date | null) => {
  if (!date) return '';
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const handleExport = async () => {
  exportError.value = '';
  if (!exportDates.value.startDate || !exportDates.value.endDate) {
    exportError.value = '请选择导出日期范围。';
    return;
  }
  isLoading.value.export = true;

  try {
    const blob = await financeService.exportExpenses({
      startDate: formatDateInput(exportDates.value.startDate),
      endDate: formatDateInput(exportDates.value.endDate),
    });
    const fileBlob = new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(
      fileBlob,
      `支出报表_${formatDateInput(exportDates.value.startDate)}_至_${formatDateInput(exportDates.value.endDate)}.xlsx`,
    );
  } catch (error) {
    console.error('导出失败:', error);
    exportError.value = '导出失败，请重试';
  } finally {
    isLoading.value.export = false;
  }
};
</script>
