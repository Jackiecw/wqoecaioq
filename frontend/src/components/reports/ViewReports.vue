<template>
  <div class="view-reports">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>周报查看</h2>
        <p>查看团队成员提交的周报记录与历史归档</p>
      </div>
      <Button
        icon="pi pi-refresh"
        label="刷新"
        severity="secondary"
        outlined
        @click="fetchReports"
        :loading="isLoading"
      />
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>提交人</label>
        <Select
          v-model="filterAuthor"
          :options="authorOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="全部用户"
          showClear
          class="filter-select"
        />
      </div>
      <div class="filter-item">
        <label>日期范围</label>
        <Calendar
          v-model="filterDateRange"
          selectionMode="range"
          dateFormat="yy-mm-dd"
          placeholder="选择日期范围"
          showIcon
          showButtonBar
          class="filter-calendar"
        />
      </div>
      <Button
        v-if="hasActiveFilters"
        icon="pi pi-filter-slash"
        label="清除"
        severity="secondary"
        text
        size="small"
        @click="clearFilters"
      />
    </div>

    <!-- Table -->
    <div class="table-container">
      <DataTable
        :value="filteredReports"
        :loading="isLoading"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        tableStyle="min-width: 50rem"
        stripedRows
      >
        <template #empty>
          <div class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-folder-open"></i>
            </div>
            <p class="empty-title">暂无周报记录</p>
            <p class="empty-desc">提交的周报将显示在这里</p>
          </div>
        </template>

        <Column field="weekStartDate" header="开始日期" sortable style="width: 15%">
          <template #body="{ data }">
            <span class="date-cell">{{ formatDate(data.weekStartDate) }}</span>
          </template>
        </Column>

        <Column field="author.nickname" header="提交人" sortable style="width: 15%">
          <template #body="{ data }">
            <div class="author-cell">
              <Avatar
                icon="pi pi-user"
                shape="circle"
                class="author-avatar"
              />
              <span>{{ data.author?.nickname ?? '未知用户' }}</span>
            </div>
          </template>
        </Column>

        <Column field="createdAt" header="提交时间" sortable style="width: 20%">
          <template #body="{ data }">
            <span class="time-cell">{{ formatDateTime(data.createdAt) }}</span>
          </template>
        </Column>

        <Column header="摘要" style="width: 30%">
          <template #body="{ data }">
            <p class="summary-cell" :title="data.summaryThisWeek">
              {{ data.summaryThisWeek || '无摘要' }}
            </p>
          </template>
        </Column>

        <Column header="操作" style="width: 20%; text-align: right" bodyClass="text-right">
          <template #body="{ data }">
            <div class="action-cell">
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
import Select from 'primevue/select';
import Calendar from 'primevue/calendar';
import { useToast } from 'primevue/usetoast';

const reports = ref<WeeklyReport[]>([]);
const isLoading = ref(true);
const authStore = useAuthStore();
const toast = useToast();
const isSuperAdmin = computed(() => authStore.role === 'admin');

const isModalOpen = ref(false);
const selectedReport = ref<WeeklyReport | null>(null);

const filterAuthor = ref<string | null>(null);
const filterDateRange = ref<Date[] | null>(null);

const authorOptions = computed(() => {
  const uniqueAuthors = new Map<string, string>();
  reports.value.forEach((report) => {
    if (report.author?.id && report.author?.nickname) {
      uniqueAuthors.set(report.author.id, report.author.nickname);
    }
  });
  return Array.from(uniqueAuthors.entries()).map(([value, label]) => ({ value, label }));
});

const hasActiveFilters = computed(() => {
  return filterAuthor.value !== null || (filterDateRange.value && filterDateRange.value.length > 0);
});

const filteredReports = computed(() => {
  let result = [...reports.value];

  if (filterAuthor.value) {
    result = result.filter((report) => report.author?.id === filterAuthor.value);
  }

  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [startDate, endDate] = filterDateRange.value;
    if (startDate && endDate) {
      result = result.filter((report) => {
        const reportDate = new Date(report.weekStartDate);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }
  }

  return result;
});

const clearFilters = () => {
  filterAuthor.value = null;
  filterDateRange.value = null;
};

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
  return new Date(dateString).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.view-reports {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--surface-900);
}

.page-header p {
  font-size: 0.8rem;
  color: var(--surface-500);
  margin: 0;
}

/* Filters */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 0.75rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--surface-600);
}

.filter-select,
.filter-calendar {
  min-width: 180px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon i {
  font-size: 1.5rem;
  color: white;
}

.empty-title {
  font-weight: 600;
  color: var(--surface-700);
  margin: 0 0 0.25rem 0;
}

.empty-desc {
  font-size: 0.875rem;
  color: var(--surface-500);
  margin: 0;
}

/* Cells */
.date-cell {
  font-weight: 600;
  color: var(--surface-900);
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 2rem;
  height: 2rem;
  background: var(--primary-50);
  color: var(--primary-color);
}

.time-cell {
  color: var(--surface-500);
  font-size: 0.875rem;
}

.summary-cell {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--surface-600);
  font-size: 0.875rem;
  margin: 0;
}

.action-cell {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
