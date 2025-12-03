<template>
  <div class="space-y-6">
    <h2 class="text-3xl font-bold text-stone-900">周报查看</h2>

    <p v-if="isLoading" class="text-stone-500">正在加载周报列表...</p>
    <p v-if="errorMessage" class="text-red-600 mb-4">{{ errorMessage }}</p>

    <div v-if="!isLoading && reports.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-stone-200">
        <thead class="bg-stone-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">开始日</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">提交人</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">提交时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-stone-200">
          <tr v-for="report in reports" :key="report.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{{ formatDate(report.weekStartDate) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">{{ report.author?.nickname ?? '--' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{{ formatDateTime(report.createdAt) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="openReportModal(report)" class="text-[#3B82F6] hover:text-[#1D4ED8]">
                查看详情
              </button>
              <button
                v-if="isSuperAdmin"
                @click="handleDeleteReport(report.id)"
                class="ml-4 text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!isLoading && reports.length === 0 && !errorMessage" class="p-6 bg-white rounded-lg shadow text-center text-stone-500">
      <p>目前还没有人提交周报。</p>
    </div>
  </div>

  <ReportDetailModal
    :is-open="isModalOpen"
    :report="selectedReport"
    @close="closeReportModal"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import reportService, { WeeklyReport } from '@/services/reportService';
import ReportDetailModal from './ReportDetailModal.vue';
import { useAuthStore } from '@/stores/auth';

const reports = ref<WeeklyReport[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const authStore = useAuthStore();
const isSuperAdmin = computed(() => authStore.role === 'admin');

const isModalOpen = ref(false);
const selectedReport = ref<WeeklyReport | null>(null);

const fetchReports = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await reportService.list();
    reports.value = response;
  } catch (error: any) {
    console.error('获取周报列表失败', error);
    if (error.response?.status === 403) {
      errorMessage.value = '您没有权限查看此内容。';
    } else {
      errorMessage.value = '获取周报列表失败，请稍后重试。';
    }
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

  errorMessage.value = '';
  try {
    await reportService.remove(reportId);
    reports.value = reports.value.filter((report) => report.id !== reportId);
  } catch (error: any) {
    console.error('删除周报失败', error);
    errorMessage.value = error.response?.data?.error || '删除周报失败，请稍后再试。';
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
