<template>
  <div class="flex flex-column gap-6">
    <!-- Header Section -->
    <div class="flex flex-column gap-4 md:flex-row md:align-items-center md:justify-content-between">
      <div>
        <h1 class="text-3xl font-bold text-900 m-0">周报中心</h1>
        <p class="text-500 mt-1 mb-0">回顾本周成果，制定下周计划，保持团队节奏。</p>
      </div>
      <div class="flex gap-3">
        <Card class="shadow-sm border-round-xl p-0" style="border-left: 4px solid #3b82f6">
          <template #content>
            <div class="px-4 py-3">
              <p class="text-xs font-semibold text-500 uppercase m-0 mb-1">本周周期</p>
              <p class="text-lg font-bold text-900 m-0">{{ currentWeekRange }}</p>
            </div>
          </template>
        </Card>
        <Card class="shadow-sm border-round-xl p-0" style="border-left: 4px solid #10b981">
          <template #content>
            <div class="px-4 py-3">
              <p class="text-xs font-semibold text-500 uppercase m-0 mb-1">建议提交日</p>
              <p class="text-lg font-bold text-primary m-0">{{ reminderDate }}</p>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Main Content -->
    <Card class="shadow-sm border-round-2xl">
      <template #content>
        <div class="border-bottom-1 surface-border pb-4 mb-4">
          <SelectButton
            v-model="currentTab"
            :options="tabOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
          />
        </div>

        <Transition name="fade" mode="out-in">
          <div v-if="currentTab === 'entry'" key="entry">
            <WeeklyReportForm />
          </div>
          <div v-else key="management">
            <ViewReports />
          </div>
        </Transition>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import WeeklyReportForm from '@/components/reports/WeeklyReportForm.vue';
import ViewReports from '@/components/reports/ViewReports.vue';
import SelectButton from 'primevue/selectbutton';
import Card from 'primevue/card';

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
  return {
    start: workingDate,
    end,
  };
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
