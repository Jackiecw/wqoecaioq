<template>
  <div class="page-shell">
    <PageHeader title="绩效考核中心">
      <template #actions>
        <div class="flex gap-3">
          <router-link
            to="/performance/templates"
            class="btn-subtle"
          >
            管理模板
          </router-link>
          <button
            @click="openAssignModal"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <span>+ 发起考核</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="pill-tab-group mb-6">
      <button
        @click="activeTab = 'my'"
        :class="['pill-tab', activeTab === 'my' ? 'is-active' : '']"
      >
        我的绩效
      </button>
      <button
        @click="activeTab = 'pending'"
        :class="['pill-tab', activeTab === 'pending' ? 'is-active' : '']"
        class="flex items-center gap-2"
      >
        待办考核
        <span v-if="pendingReviews.length > 0" class="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{{ pendingReviews.length }}</span>
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-[var(--color-text-secondary)]">
      加载中...
    </div>

    <div v-else>
      <div v-if="activeTab === 'my'" class="space-y-4">
        <EmptyState
          v-if="myReviews.length === 0"
          title="暂无考核记录"
          description="你还没有参与过任何绩效考核"
          icon="pi pi-file"
        />
        <div
          v-for="review in myReviews"
          :key="review.id"
          class="cursor-pointer group"
          @click="router.push(`/performance/reviews/${review.id}`)"
        >
          <ContentCard class="flex items-center justify-between hover:shadow-md transition-shadow py-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-bold text-lg">
                {{ new Date(review.month).getMonth() + 1 }}月
              </div>
              <div>
                <h3 class="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{{ review.template.name }}</h3>
                <p class="text-sm text-[var(--color-text-secondary)]">
                  考核月份: {{ formatMonth(review.month) }} | 主管: {{ review.manager.nickname }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span :class="getStatusBadgeClass(review.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                {{ getStatusLabel(review.status) }}
              </span>
              <div class="text-right">
                <div class="text-sm text-[var(--color-text-secondary)]">最终得分</div>
                <div class="font-bold text-lg text-[var(--color-text-primary)]">{{ review.finalScore || '-' }}</div>
              </div>
              <i class="pi pi-chevron-right text-[var(--color-text-secondary)]"></i>
            </div>
          </ContentCard>
        </div>
      </div>

      <div v-if="activeTab === 'pending'" class="space-y-4">
        <EmptyState
          v-if="pendingReviews.length === 0"
          title="暂无待办考核"
          description="当前没有需要你处理的考核任务"
          icon="pi pi-check-circle"
        />
        <div
          v-for="review in pendingReviews"
          :key="review.id"
          class="cursor-pointer group"
          @click="router.push(`/performance/reviews/${review.id}`)"
        >
          <ContentCard class="flex items-center justify-between hover:shadow-md transition-shadow py-4 border-l-4 border-l-yellow-400">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                {{ review.employee.nickname[0] }}
              </div>
              <div>
                <h3 class="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{{ review.employee.nickname }} 的考核</h3>
                <p class="text-sm text-[var(--color-text-secondary)]">
                  {{ review.template.name }} | {{ formatMonth(review.month) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span :class="getStatusBadgeClass(review.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                {{ getStatusLabel(review.status) }}
              </span>
              <button class="bg-[var(--color-accent)] text-white px-4 py-1.5 rounded text-sm hover:opacity-90 transition-opacity">
                去处理
              </button>
            </div>
          </ContentCard>
        </div>
      </div>
    </div>

    <!-- Modal Layout Preserved but style tweaked via scoped css or kept as is if acceptable -->
    <div v-if="showAssignModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in-up">
        <h2 class="text-xl font-bold text-gray-800 mb-6">发起绩效考核</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">被考核人</label>
            <select v-model="assignForm.employeeId" class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled>请选择员工</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.nickname }} ({{ user.username }})</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">考核模板</label>
            <select v-model="assignForm.templateId" class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled>请选择模板</option>
              <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">考核月份</label>
            <input type="month" v-model="assignForm.month" class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">直属主管 (初评)</label>
            <select v-model="assignForm.managerId" class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled>请选择主管</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.nickname }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              上级主管 (终评)
              <span class="text-xs text-gray-400 font-normal ml-1">可选，留空则自动推进或无终评</span>
            </label>
            <select v-model="assignForm.directorId" class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">(自动推送 / 无)</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.nickname }}</option>
            </select>
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <button @click="showAssignModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
          <button @click="submitAssign" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">确认发起</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import performanceService, { PerformanceReview, PerformanceUser, PerformanceTemplate } from '@/services/performanceService';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';

type TabKey = 'my' | 'pending';

const router = useRouter();
const activeTab = ref<TabKey>('my');
const loading = ref(true);
const myReviews = ref<PerformanceReview[]>([]);
const pendingReviews = ref<PerformanceReview[]>([]);
const showAssignModal = ref(false);

const users = ref<PerformanceUser[]>([]);
const templates = ref<PerformanceTemplate[]>([]);

const assignForm = ref({
  employeeId: '',
  templateId: '',
  month: new Date().toISOString().slice(0, 7),
  managerId: '',
  directorId: '',
});

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    SELF_REVIEW: '待自评',
    MANAGER_REVIEW: '待主管评',
    DIRECTOR_REVIEW: '待终评',
    COMPLETED: '已完成',
    CANCELED: '已取消',
  };
  return map[status] || status;
};

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SELF_REVIEW: 'bg-blue-100 text-blue-700',
    MANAGER_REVIEW: 'bg-yellow-100 text-yellow-700',
    DIRECTOR_REVIEW: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELED: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [myRes, pendingRes] = await Promise.all([
      performanceService.getMyReviews(),
      performanceService.getPendingReviews(),
    ]);
    myReviews.value = myRes || [];
    pendingReviews.value = pendingRes || [];
  } catch (error) {
    console.error('获取考核列表失败', error);
  } finally {
    loading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    const [userList, templateList] = await Promise.all([
      performanceService.getUsers(),
      performanceService.getTemplates(),
    ]);
    users.value = userList || [];
    templates.value = templateList || [];
  } catch (error) {
    console.error('获取用户或模板失败', error);
  }
};

const openAssignModal = () => {
  fetchOptions();
  showAssignModal.value = true;
};

const submitAssign = async () => {
  if (!assignForm.value.employeeId || !assignForm.value.templateId || !assignForm.value.managerId) {
    alert('请选择被考核人、模板和主管');
    return;
  }
  try {
    await performanceService.assignReview({
      employeeId: assignForm.value.employeeId,
      templateId: assignForm.value.templateId,
      month: assignForm.value.month,
      managerId: assignForm.value.managerId,
      directorId: assignForm.value.directorId || undefined,
    });
    showAssignModal.value = false;
    alert('发起成功');
    fetchData();
  } catch (error: any) {
    console.error('发起考核失败', error);
    alert(error?.response?.data?.error || '发起失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Page transition animation */
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal specific overrides if needed, generic ones are fine */
.bg-white {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}
</style>
