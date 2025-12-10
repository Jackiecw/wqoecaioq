<template>
  <div class="view-reports">
    <!-- Header -->
    <div class="reports-header">
      <div class="header-info">
        <h2 class="header-title">
          <i class="pi pi-file-edit"></i>
          周报查看
        </h2>
        <p class="header-desc">查看团队成员提交的周报记录与历史归档</p>
      </div>
      <Button
        icon="pi pi-refresh"
        severity="secondary"
        text
        rounded
        @click="fetchReports"
        :loading="isLoading"
        v-tooltip.left="'刷新列表'"
      />
    </div>

    <!-- Filters -->
    <div class="filter-section">
      <div class="filter-group">
        <div class="filter-field">
          <label class="filter-label">
            <i class="pi pi-user"></i>
            提交人
          </label>
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
        <div class="filter-field">
          <label class="filter-label">
            <i class="pi pi-calendar"></i>
            日期范围
          </label>
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
      </div>
      <Button
        v-if="hasActiveFilters"
        icon="pi pi-filter-slash"
        label="重置筛选"
        severity="secondary"
        text
        size="small"
        @click="clearFilters"
      />
    </div>

    <!-- Stats Summary -->
    <div class="stats-bar" v-if="reports.length > 0">
      <div class="stat-item">
        <i class="pi pi-file stat-icon"></i>
        <span class="stat-value">{{ reports.length }}</span>
        <span class="stat-label">总周报</span>
      </div>
      <div class="stat-item">
        <i class="pi pi-users stat-icon"></i>
        <span class="stat-value">{{ authorOptions.length }}</span>
        <span class="stat-label">贡献者</span>
      </div>
      <div class="stat-item">
        <i class="pi pi-filter stat-icon"></i>
        <span class="stat-value">{{ filteredReports.length }}</span>
        <span class="stat-label">筛选结果</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <DataTable
        :value="filteredReports"
        :loading="isLoading"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        tableStyle="min-width: 50rem"
        class="reports-table"
        :pt="{
          table: { class: 'reports-data-table' },
          headerRow: { class: 'table-header-row' },
          bodyRow: { class: 'table-body-row' }
        }"
      >
        <template #empty>
          <div class="empty-state">
            <div class="empty-icon-wrapper">
              <i class="pi pi-inbox"></i>
            </div>
            <p class="empty-title">暂无周报记录</p>
            <p class="empty-desc">提交的周报将显示在这里</p>
          </div>
        </template>

        <Column field="weekStartDate" header="周期" sortable style="width: 15%">
          <template #body="{ data }">
            <div class="date-badge">
              <i class="pi pi-calendar"></i>
              <span>{{ formatDate(data.weekStartDate) }}</span>
            </div>
          </template>
        </Column>

        <Column field="author.nickname" header="提交人" sortable style="width: 18%">
          <template #body="{ data }">
            <div class="author-info">
              <Avatar
                :label="getInitial(data.author?.nickname)"
                shape="circle"
                class="author-avatar"
              />
              <span class="author-name">{{ data.author?.nickname ?? '未知用户' }}</span>
            </div>
          </template>
        </Column>

        <Column field="createdAt" header="提交时间" sortable style="width: 18%">
          <template #body="{ data }">
            <span class="time-text">{{ formatDateTime(data.createdAt) }}</span>
          </template>
        </Column>

        <Column header="本周摘要" style="width: 34%">
          <template #body="{ data }">
            <p class="summary-text" :title="data.summaryThisWeek">
              {{ data.summaryThisWeek || '未填写摘要' }}
            </p>
          </template>
        </Column>

        <Column header="" style="width: 15%" bodyClass="actions-column">
          <template #body="{ data }">
            <div class="row-actions">
              <Button
                icon="pi pi-eye"
                size="small"
                severity="secondary"
                text
                rounded
                v-tooltip.top="'查看详情'"
                @click="openReportModal(data)"
              />
              <Button
                v-if="isSuperAdmin"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                v-tooltip.top="'删除'"
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
import Tooltip from 'primevue/tooltip';

const vTooltip = Tooltip;

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

const getInitial = (name?: string) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('zh-CN', {
    hour12: false,
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
  gap: 1.5rem;
}

/* Header */
.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.header-title i {
  color: var(--color-accent);
  font-size: 1.25rem;
}

.header-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0.375rem 0 0 0;
}

/* Filter Section */
.filter-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.filter-group {
  display: flex;
  gap: 1.25rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.filter-label i {
  font-size: 0.75rem;
  color: var(--color-accent);
}

.filter-select,
.filter-calendar {
  min-width: 180px;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 2rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, var(--color-accent-soft) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-radius: var(--radius-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 0.875rem;
  color: var(--color-accent);
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Table */
.table-wrapper {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.reports-table :deep(.p-datatable-header-cell) {
  background: var(--color-bg-page);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.reports-table :deep(.p-datatable-row-cell) {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.reports-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-bg-page);
}

.reports-table :deep(.p-datatable-tbody > tr:last-child td) {
  border-bottom: none;
}

/* Date Badge */
.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
}

.date-badge i {
  font-size: 0.75rem;
}

/* Author Info */
.author-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.author-avatar {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-accent) 0%, #8b5cf6 100%);
  color: white;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Time Text */
.time-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

/* Summary Text */
.summary-text {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Row Actions */
.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.reports-table :deep(tr:hover) .row-actions {
  opacity: 1;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon-wrapper {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon-wrapper i {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.empty-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.empty-desc {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Actions Column */
:deep(.actions-column) {
  text-align: right;
}
</style>
