<template>
  <div class="page-shell weekly-report-page">
    <PageHeader
      title="周报中心"
      subtitle="回顾本周成果，制定下周计划，保持团队节奏"
    >
      <template #actions>
        <span class="date-badge">{{ currentWeekRange }}</span>
      </template>
    </PageHeader>

    <ContentCard>
      <div class="pill-tab-group">
        <button
          v-for="option in tabOptions"
          :key="option.value"
          class="pill-tab"
          :class="{ 'is-active': currentTab === option.value }"
          @click="currentTab = option.value"
        >
          <i :class="option.value === 'entry' ? 'pi pi-pencil' : 'pi pi-list'"></i>
          {{ option.label }}
        </button>
      </div>

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
    </ContentCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
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
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.date-badge {
  font-size: 0.9rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-xs);
}

.content-area {
  margin-top: var(--space-3);
}

.pill-tab-group {
  margin-bottom: var(--space-2);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
