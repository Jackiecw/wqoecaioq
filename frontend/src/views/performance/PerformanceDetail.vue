<template>
  <div class="page-shell">
    <!-- Header -->
    <PageHeader 
      :title="review?.template?.name || 'Loading...'" 
      :subtitle="review ? formatMonth(review.month) : ''"
    >
      <template #meta>
        <button @click="router.back()" class="flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm mr-4">
          <i class="pi pi-arrow-left mr-1"></i>
          返回
        </button>
        <span v-if="review" :class="getStatusBadgeClass(review.status)" class="px-2 py-0.5 rounded-md text-xs font-medium">
          {{ getStatusLabel(review.status) }}
        </span>
      </template>
      <template #actions>
        <button @click="printReview" class="btn-secondary flex items-center gap-2">
          <i class="pi pi-print"></i>
          打印 / 导出PDF
        </button>
        <button
          v-if="canReject"
          @click="rejectReview"
          class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium border border-red-200"
        >
          驳回 / 退回修订
        </button>
        <button
          v-if="canSubmit"
          @click="submitReview"
          class="btn-primary shadow-sm"
        >
          提交 / 确认
        </button>
      </template>
    </PageHeader>

    <div v-if="review" class="max-w-5xl mx-auto w-full mt-6 space-y-6 print:mt-0 print:w-full print:max-w-none">
      
      <!-- Stepper (Hidden on Print) -->
      <div class="print:hidden">
        <div class="flex items-center justify-between relative px-4">
          <div class="absolute left-0 top-1/2 w-full h-[1px] bg-[var(--color-border)] -z-10"></div>
          <div v-for="(step, index) in steps" :key="step.key" class="flex flex-col items-center bg-[var(--color-bg-page)] px-4">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300"
              :class="getStepClass(step.key)"
            >
              {{ index + 1 }}
            </div>
            <span class="text-xs mt-2 font-medium text-[var(--color-text-secondary)]">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <!-- Print Only Header -->
      <div class="hidden print:block text-center mb-8 pt-8">
        <h1 class="text-2xl font-bold text-black mb-2">{{ review.template.name }}</h1>
        <div class="flex justify-center gap-8 text-sm text-gray-600">
          <span>被考核人 {{ review.employee.nickname }}</span>
          <span>部门: {{ review.employee.department || '无' }}</span>
          <span>考核月份: {{ formatMonth(review.month) }}</span>
        </div>
      </div>

      <!-- Info Card -->
      <ContentCard class="print:shadow-none print:border-black">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span class="text-[var(--color-text-secondary)] block mb-1">被考核人</span>
            <span class="font-medium text-[var(--color-text-primary)]">{{ review.employee.nickname }} ({{ review.employee.username }})</span>
          </div>
          <div>
            <span class="text-[var(--color-text-secondary)] block mb-1">直属主管</span>
            <span class="font-medium text-[var(--color-text-primary)]">{{ review.manager.nickname }}</span>
          </div>
          <div>
            <span class="text-[var(--color-text-secondary)] block mb-1">上级主管</span>
            <span class="font-medium text-[var(--color-text-primary)]">{{ review.director?.nickname || '-' }}</span>
          </div>
        </div>
      </ContentCard>

      <!-- Evaluation Table -->
      <ContentCard class="p-0 overflow-hidden print:shadow-none print:border-black">
        <table class="w-full text-sm text-left">
          <thead class="bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] font-semibold border-b border-[var(--color-border)] print:bg-gray-100 print:text-black print:border-black">
            <tr>
              <th class="px-4 py-3 w-24 border-r border-[var(--color-border)] print:border-black font-medium">维度</th>
              <th class="px-4 py-3 w-48 border-r border-[var(--color-border)] print:border-black font-medium">指标名称</th>
              <th class="px-4 py-3 border-r border-[var(--color-border)] print:border-black font-medium">评分标准</th>
              <th class="px-4 py-3 w-16 text-center border-r border-[var(--color-border)] print:border-black font-medium">权重</th>
              <th class="px-4 py-3 w-24 text-center border-r border-[var(--color-border)] print:border-black bg-blue-50/50 print:bg-transparent font-medium text-blue-700">自评</th>
              <th class="px-4 py-3 w-32 text-center border-r border-[var(--color-border)] print:border-black bg-yellow-50/50 print:bg-transparent font-medium text-yellow-700">主管评</th>
              <th v-if="review.directorId" class="px-4 py-3 w-32 text-center bg-purple-50/50 print:bg-transparent font-medium text-purple-700">终评</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)] print:divide-black">
            <tr v-for="item in review.items" :key="item.id" class="hover:bg-[var(--color-bg-page)] transition-colors">
              <td class="px-4 py-3 font-medium text-[var(--color-text-primary)] border-r border-[var(--color-border)] print:border-black">{{ item.category }}</td>
              <td class="px-4 py-3 border-r border-[var(--color-border)] print:border-black">
                <div class="font-medium text-[var(--color-text-primary)]">{{ item.kpiName }}</div>
              </td>
              <td class="px-4 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] print:border-black whitespace-pre-wrap">{{ item.description }}</td>
              <td class="px-4 py-3 text-center text-[var(--color-text-secondary)] border-r border-[var(--color-border)] print:border-black">{{ item.weight }}%</td>

              <!-- Self Score -->
              <td class="px-2 py-2 border-r border-[var(--color-border)] print:border-black bg-blue-50/20 print:bg-transparent align-top text-center">
                <div v-if="canEditSelf">
                  <input v-model.number="item.selfScore" type="number" min="0" max="100" class="score-input focus:ring-blue-500" placeholder="分数">
                </div>
                <div v-else class="font-bold text-blue-700 py-1">
                  {{ item.selfScore }}
                </div>
              </td>

              <!-- Manager Score -->
              <td class="px-2 py-2 border-r border-[var(--color-border)] print:border-black bg-yellow-50/20 print:bg-transparent align-top">
                <div v-if="canEditManager">
                  <input v-model.number="item.managerScore" type="number" min="0" max="100" class="score-input focus:ring-yellow-500 mb-1" placeholder="分数">
                  <textarea v-model="item.managerComment" rows="2" class="comment-input focus:ring-yellow-500" placeholder="评语"></textarea>
                </div>
                <div v-else class="text-center">
                  <div class="font-bold text-yellow-700">{{ item.managerScore }}</div>
                  <div class="text-xs text-[var(--color-text-secondary)] text-left mt-1 bg-white/50 p-1 rounded">{{ item.managerComment }}</div>
                </div>
              </td>

              <!-- Director Score -->
              <td v-if="review.directorId" class="px-2 py-2 bg-purple-50/20 print:bg-transparent align-top">
                <div v-if="canEditDirector">
                  <input v-model.number="item.directorScore" type="number" min="0" max="100" class="score-input focus:ring-purple-500 mb-1" placeholder="分数">
                  <textarea v-model="item.directorComment" rows="2" class="comment-input focus:ring-purple-500" placeholder="评语"></textarea>
                </div>
                <div v-else class="text-center">
                  <div class="font-bold text-purple-700">{{ item.directorScore }}</div>
                  <div class="text-xs text-[var(--color-text-secondary)] text-left mt-1 bg-white/50 p-1 rounded">{{ item.directorComment }}</div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-[var(--color-bg-page)] font-bold text-[var(--color-text-primary)] border-t border-[var(--color-border)] print:border-black print:bg-white">
            <tr>
              <td colspan="4" class="px-4 py-3 text-right border-r border-[var(--color-border)] print:border-black">加权总分:</td>
              <td class="px-4 py-3 text-center border-r border-[var(--color-border)] print:border-black text-blue-700">{{ calculatedTotals.self }}</td>
              <td class="px-4 py-3 text-center border-r border-[var(--color-border)] print:border-black text-yellow-700">{{ calculatedTotals.manager }}</td>
              <td v-if="review.directorId" class="px-4 py-3 text-center text-purple-700">{{ calculatedTotals.director }}</td>
            </tr>
          </tfoot>
        </table>
      </ContentCard>

      <!-- Text Areas -->
      <ContentCard class="print:shadow-none print:border-black print:p-0">
        <h3 class="font-bold text-[var(--color-text-primary)] mb-3 print:text-black">本月工作总结（存在的问题、计划改进方法）</h3>
        <textarea
          v-if="canEditSelf"
          v-model="review.summaryThisMonth"
          rows="4"
          class="text-area-input"
          placeholder="请填写..."
        ></textarea>
        <div v-else class="read-only-text">{{ review.summaryThisMonth || '无' }}</div>
      </ContentCard>

      <ContentCard class="print:shadow-none print:border-black print:p-0">
        <h3 class="font-bold text-[var(--color-text-primary)] mb-3 print:text-black">下月工作重点计划 (*)</h3>
        <textarea
          v-if="canEditSelf"
          v-model="review.planNextMonth"
          rows="4"
          class="text-area-input"
          placeholder="请填写..."
        ></textarea>
        <div v-else class="read-only-text">{{ review.planNextMonth || '无' }}</div>
      </ContentCard>

      <ContentCard class="print:shadow-none print:border-black print:p-0">
        <h3 class="font-bold text-[var(--color-text-primary)] mb-3 print:text-black">公司或部门存在的问题和建议</h3>
        <textarea
          v-if="canEditSelf"
          v-model="review.companySuggestions"
          rows="4"
          class="text-area-input"
          placeholder="请填写..."
        ></textarea>
        <div v-else class="read-only-text">{{ review.companySuggestions || '无' }}</div>
      </ContentCard>

      <!-- Print Signatures -->
      <div class="hidden print:flex mt-12 justify-between px-12 text-black">
        <div class="text-center">
          <div class="mb-8">员工签字: __________________</div>
          <div>日期: __________________</div>
        </div>
        <div class="text-center">
          <div class="mb-8">主管签字: __________________</div>
          <div>日期: __________________</div>
        </div>
        <div v-if="review.directorId" class="text-center">
          <div class="mb-8">终评签字: __________________</div>
          <div>日期: __________________</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
import performanceService from '@/services/performanceService';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';


interface ReviewItem {
  id: string;
  category: string;
  kpiName: string;
  description: string;
  weight: number;
  selfScore?: number;
  managerScore?: number;
  directorScore?: number;
  managerComment?: string;
  directorComment?: string;
}

interface ReviewDetail {
  id: string;
  month: string;
  status: string;
  template: { name: string };
  employee: { nickname: string; username: string; department?: string };
  manager: { nickname: string };
  director?: { nickname: string } | null;
  directorId?: string | null;
  employeeId: string;
  managerId: string;
  items: ReviewItem[];
  summaryThisMonth?: string;
  planNextMonth?: string;
  companySuggestions?: string;
}

interface CurrentUser {
  userId: string;
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();
const review = ref<ReviewDetail | null>(null);
const currentUser = ref<CurrentUser | null>(null);

const canEditSelf = computed(() => {
  if (!review.value || !currentUser.value) return false;
  return review.value.status === 'SELF_REVIEW' && review.value.employeeId === currentUser.value.userId;
});

const canEditManager = computed(() => {
  if (!review.value || !currentUser.value) return false;
  return review.value.status === 'MANAGER_REVIEW' && review.value.managerId === currentUser.value.userId;
});

const canEditDirector = computed(() => {
  if (!review.value || !currentUser.value) return false;
  return review.value.status === 'DIRECTOR_REVIEW' && review.value.directorId === currentUser.value.userId;
});

const canSubmit = computed(() => {
  return canEditSelf.value || canEditManager.value || canEditDirector.value;
});

const canReject = computed(() => {
  if (!review.value || !currentUser.value) return false;
  if (review.value.status === 'MANAGER_REVIEW' && review.value.managerId === currentUser.value.userId) return true;
  if (review.value.status === 'DIRECTOR_REVIEW' && review.value.directorId === currentUser.value.userId) return true;
  return false;
});

const statusOrder = ['DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'DIRECTOR_REVIEW', 'COMPLETED'];

const getStepClass = (stepKey: string) => {
  if (!review.value) return 'border-[var(--color-border)] text-[var(--color-text-muted)]';
  const currentIndex = statusOrder.indexOf(review.value.status);
  const stepIndex = statusOrder.indexOf(stepKey);

  if (review.value.status === stepKey) {
    return 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-md';
  }
  if (stepIndex < currentIndex) {
    return 'border-[var(--color-accent)] bg-[var(--color-bg-page)] text-[var(--color-accent)]';
  }
  return 'border-[var(--color-border)] bg-[var(--color-bg-page)] text-[var(--color-text-muted)]';
};

const calculatedTotals = computed(() => {
  if (!review.value) return { self: 0, manager: 0, director: 0 };
  let self = 0; let manager = 0; let director = 0;
  review.value.items.forEach((item) => {
    const w = item.weight / 100;
    if (item.selfScore) self += item.selfScore * w;
    if (item.managerScore) manager += item.managerScore * w;
    if (item.directorScore) director += item.directorScore * w;
  });
  return {
    self: self.toFixed(2),
    manager: manager.toFixed(2),
    director: director.toFixed(2),
  };
});

const fetchReview = async () => {
  try {
    const res = await performanceService.getReview(String(route.params.id));
    review.value = res || null;
  } catch (error) {
    console.error('无法加载考核详情', error);
    alert('无法加载考核详情');
  }
};

const saveReview = async (newStatus?: string) => {
  if (!review.value) return;
  try {
    const payload: any = {
      items: review.value.items.map((item) => ({
        id: item.id,
        selfScore: item.selfScore,
        managerScore: item.managerScore,
        managerComment: item.managerComment,
        directorScore: item.directorScore,
        directorComment: item.directorComment,
      })),
      summaryThisMonth: review.value.summaryThisMonth,
      planNextMonth: review.value.planNextMonth,
      companySuggestions: review.value.companySuggestions,
    };
    if (newStatus) {
      payload.status = newStatus;
    }
    await performanceService.updateReview(review.value.id, payload);
    await fetchReview();
  } catch (error) {
    console.error('保存失败', error);
    alert('保存失败');
  }
};

const submitReview = async () => {
  if (!confirm('确定要提交吗？提交后将进入下一环节。')) return;
  if (!review.value) return;
  let nextStatus = '';
  if (review.value.status === 'SELF_REVIEW') nextStatus = 'MANAGER_REVIEW';
  else if (review.value.status === 'MANAGER_REVIEW') {
    nextStatus = review.value.directorId ? 'DIRECTOR_REVIEW' : 'COMPLETED';
  } else if (review.value.status === 'DIRECTOR_REVIEW') nextStatus = 'COMPLETED';
  await saveReview(nextStatus);
};

const rejectReview = async () => {
  if (!confirm('确定要驳回吗？')) return;
  if (!review.value) return;
  let prevStatus = '';
  if (review.value.status === 'MANAGER_REVIEW') prevStatus = 'SELF_REVIEW';
  else if (review.value.status === 'DIRECTOR_REVIEW') prevStatus = 'MANAGER_REVIEW';
  await saveReview(prevStatus);
};

const printReview = () => {
  window.print();
};

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

const steps = [
  { key: 'DRAFT', label: '草稿' },
  { key: 'SELF_REVIEW', label: '自评' },
  { key: 'MANAGER_REVIEW', label: '主管评' },
  { key: 'DIRECTOR_REVIEW', label: '终评' },
  { key: 'COMPLETED', label: '完成' },
];

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    currentUser.value = jwtDecode(token) as CurrentUser;
  }
  fetchReview();
});
</script>

<style scoped>
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

.score-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
  text-align: center;
  outline: none;
  font-size: 0.875rem;
}

.comment-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  resize: none;
  outline: none;
}

.text-area-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  outline: none;
  resize: none;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.text-area-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.read-only-text {
  white-space: pre-wrap;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  min-height: 3rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  color: var(--color-text-primary);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  font-size: 0.875rem;
}
.btn-secondary:hover {
  background: var(--color-bg-page);
  border-color: var(--color-text-muted);
}

.btn-primary {
  padding: 0.5rem 1.5rem;
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  font-size: 0.875rem;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}
</style>
