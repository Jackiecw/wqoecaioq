<template>
  <div class="flex flex-col gap-6">
    <!-- Page Header -->
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-900">周报查看</h1>
        <p class="mt-1 text-500">查看团队成员提交的周报记录与历史归档。</p>
      </div>
      <div class="flex gap-2">
        <Button 
          icon="pi pi-refresh" 
          label="刷新" 
          severity="secondary" 
          text 
          @click="fetchReports" 
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- Content Card -->
    <div class="card border-0 shadow-sm rounded-2xl bg-white">
      <DataTable
        :value="reports"
        :loading="isLoading"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        tableStyle="min-width: 50rem"
        class="p-datatable-lg"
      >
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-folder-open text-4xl text-400 mb-3"></i>
            <p class="text-500">暂无周报记录</p>
          </div>
        </template>

        <Column field="weekStartDate" header="开始日期" sortable style="width: 15%">
          <template #body="{ data }">
            <span class="font-medium text-900">{{ formatDate(data.weekStartDate) }}</span>
          </template>
        </Column>
        
        <Column field="author.nickname" header="提交人" sortable style="width: 15%">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Avatar 
                icon="pi pi-user" 
                shape="circle" 
                class="bg-primary-50 text-primary"
                style="width: 2rem; height: 2rem"
              />
              <span class="text-700">{{ data.author?.nickname ?? '未知用户' }}</span>
            </div>
          </template>
        </Column>

        <Column field="createdAt" header="提交时间" sortable style="width: 20%">
          <template #body="{ data }">
            <span class="text-500">{{ formatDateTime(data.createdAt) }}</span>
          </template>
        </Column>

        <Column header="摘要" style="width: 30%">
          <template #body="{ data }">
            <p class="truncate max-w-xs text-500" :title="data.summaryThisWeek">
              {{ data.summaryThisWeek || '无摘要' }}
            </p>
          </template>
        </Column>

        <Column header="操作" style="width: 20%; text-align: right" bodyClass="text-right">
          <template #body="{ data }">
            <div class="flex justify-end gap-2">
              <Button 
                icon="pi pi-eye" 
                label="详情" 
                size="small" 
                severity="secondary" 
                outlined
                @click="openReportModal(data)" 
              />
              <Button
                v-if="isSuperAdmin"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                @click="handleDeleteReport(data.id)"
                aria-label="删除"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <ReportDetailModal
      :is-open="isModalOpen"
      :report="selectedReport"
      @close="closeReportModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import reportService, { WeeklyReport } from '@/services/reportService';
import ReportDetailModal from './ReportDetailModal.vue';
import { useAuthStore } from '@/stores/auth';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { useToast } from 'primevue/usetoast';

const reports = ref<WeeklyReport[]>([]);
const isLoading = ref(true);
const authStore = useAuthStore();
const toast = useToast();
const isSuperAdmin = computed(() => authStore.role === 'admin');

const isModalOpen = ref(false);
const selectedReport = ref<WeeklyReport | null>(null);

const fetchReports = async () => {
  isLoading.value = true;
  try {
    const response = await reportService.list();
    reports.value = response;
  } catch (error: any) {
    console.error('获取周报列表失败', error);
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取周报列表', life: 3000 });
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchReports();
});

const openReportModal = (report: WeeklyReport) => {
  selectedReport.value = report;
  isModalOpen.value = true;
};

const closeReportModal = () => {
  isModalOpen.value = false;
};

const handleDeleteReport = async (reportId: string) => {
  if (!isSuperAdmin.value) return;
  if (!confirm('确定要删除这份周报吗？该操作不可恢复。')) return;

  try {
    await reportService.remove(reportId);
    reports.value = reports.value.filter((report) => report.id !== reportId);
    toast.add({ severity: 'success', summary: '删除成功', detail: '周报已删除', life: 3000 });
  } catch (error: any) {
    console.error('删除周报失败', error);
    toast.add({ severity: 'error', summary: '删除失败', detail: error.response?.data?.error || '请稍后再试', life: 3000 });
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
</script>
