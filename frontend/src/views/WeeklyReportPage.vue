<template>
  <div class="weekly-report-page">
    <!-- Hero Header -->
    <div class="report-hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1>周报中心</h1>
          <p>回顾本周成果，制定下周计划，保持团队节奏</p>
        </div>
        <div class="hero-stats">
          <div class="stat-card">
            <div class="stat-icon stat-icon--blue">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">本周周期</span>
              <span class="stat-value">{{ currentWeekRange }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--green">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">建议提交</span>
              <span class="stat-value">{{ reminderDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        v-for="option in tabOptions"
        :key="option.value"
        class="tab-btn"
        :class="{ 'tab-btn--active': currentTab === option.value }"
        @click="currentTab = option.value"
      >
        <i :class="option.value === 'entry' ? 'pi pi-pencil' : 'pi pi-list'"></i>
        {{ option.label }}
      </button>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <Transition name="fade" mode="out-in">
        <div v-if="currentTab === 'entry'" key="entry">
          <WeeklyReportForm />
        </div>
        <div v-else key="management">
          <ViewReports />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import WeeklyReportForm from '@/components/reports/WeeklyReportForm.vue';
import ViewReports from '@/components/reports/ViewReports.vue';

const authStore = useAuthStore();

const canFillReports = computed(() => authStore.permissions.includes('WEEKLY_REPORT'));
const canViewReports = computed(() => authStore.permissions.includes('VIEW_REPORTS'));

const tabOptions = computed(() => {
  const options = [];
  if (canFillReports.value) options.push({ label: '填写周报', value: 'entry' });
  if (canViewReports.value) options.push({ label: '查看周报', value: 'management' });
  return options;
});

const getDefaultTab = (): 'entry' | 'management' => {
  if (canFillReports.value) return 'entry';
  if (canViewReports.value) return 'management';
  return 'entry';
};

const currentTab = ref<'entry' | 'management'>(getDefaultTab());

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });

const getWeekBoundaries = (baseDate: Date) => {
  const workingDate = new Date(baseDate);
  const day = workingDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  workingDate.setDate(workingDate.getDate() + diff);
  workingDate.setHours(0, 0, 0, 0);
  const end = new Date(workingDate);
  end.setDate(workingDate.getDate() + 6);
  return { start: workingDate, end };
};

const activeWeek = computed(() => getWeekBoundaries(new Date()));

const currentWeekRange = computed(
  () => `${formatDisplayDate(activeWeek.value.start)} - ${formatDisplayDate(activeWeek.value.end)}`
);

const reminderDate = computed(() => {
  const friday = new Date(activeWeek.value.start);
  friday.setDate(activeWeek.value.start.getDate() + 4);
  return formatDisplayDate(friday);
});
</script>

<style scoped>
.weekly-report-page {
  min-height: 100%;
  background: var(--color-bg-page);
}

/* ========================================
   页面头部 (Clean White Theme)
   ======================================== */
.report-hero {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-sm);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-text h1 {
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--color-text-primary);
}

.hero-text p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.hero-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.stat-icon--blue {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.stat-icon--green {
  background: #d1fae5;
  color: #10b981;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* ========================================
   Tab Navigation
   ======================================== */
.tab-nav {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1rem;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn--active {
  background: var(--color-bg-card);
  color: var(--color-accent);
  box-shadow: var(--shadow-xs);
}

/* ========================================
   Content Area
   ======================================== */
.content-area {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .report-hero {
    padding: 1.5rem;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-stats {
    width: 100%;
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
  }
}
</style>
