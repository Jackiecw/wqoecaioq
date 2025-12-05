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
}

/* Hero Header */
.report-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1.5rem;
  padding: 2rem 2.5rem;
  margin-bottom: 1.5rem;
  color: white;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.hero-text h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.hero-text p {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.hero-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 0.875rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.stat-icon--blue {
  background: rgba(59, 130, 246, 0.3);
}

.stat-icon--green {
  background: rgba(16, 185, 129, 0.3);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--surface-100);
  padding: 0.375rem;
  border-radius: 0.75rem;
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-color);
}

.tab-btn--active {
  background: white;
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Content Area */
.content-area {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.04);
  padding: 1.5rem;
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
