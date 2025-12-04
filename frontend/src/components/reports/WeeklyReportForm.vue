<template>
  <section class="surface-card border-1 border-round-xl shadow-1 p-4 md:p-5">
    <header class="flex flex-column gap-3 md:flex-row md:align-items-center md:justify-content-between">
      <div class="flex flex-column gap-1">
        <p class="text-xs text-primary font-semibold uppercase letter-spacing-3">Weekly Entry</p>
        <h3 class="text-2xl font-bold m-0">填写周报</h3>
        <p class="text-sm text-color-secondary m-0">用统一的结构记录本周成果、下周计划以及阻碍。</p>
      </div>
      <div class="border-1 border-primary-100 bg-primary-50 text-primary border-round-xl p-3 w-full md:w-auto">
        <p class="text-xs font-semibold uppercase text-primary-400 mb-1">当前</p>
        <p class="text-lg font-semibold m-0">第 {{ currentWeekIndex }} 周</p>
        <p class="text-xs text-primary-600 m-0">{{ formattedWeekStart }}</p>
      </div>
    </header>

    <div class="grid mt-4 gap-3">
      <div class="col-12 md:col-8">
        <div class="field">
          <label class="font-semibold text-sm mb-2 block" for="weekStartDate">开始日期</label>
          <Calendar
            input-id="weekStartDate"
            v-model="formData.weekStartDate"
            date-format="yy-mm-dd"
            show-icon
            class="w-full"
            :manual-input="true"
          />
          <small class="text-color-secondary">系统默认选本周一，建议保持一致便于统计。</small>
        </div>
      </div>
      <div class="col-12 md:col-4">
        <div class="border-1 border-dashed surface-border border-round-lg p-3">
          <p class="font-semibold text-sm mb-2">书写提示</p>
          <ul class="pl-3 text-sm text-color-secondary m-0">
            <li>总结突出成就、关键数字和学习</li>
            <li>计划拆分为 3-5 个可执行事项</li>
            <li>遇到问题请写清阻碍与所需支持</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="grid mt-3 gap-4">
      <div class="col-12 md:col-6">
        <div class="surface-50 border-round-xl p-4 h-full">
          <div class="field flex flex-column gap-2 mb-4">
            <label class="font-semibold text-sm" for="summaryThisWeek">本周总结 *</label>
            <Textarea
              id="summaryThisWeek"
              v-model="formData.summaryThisWeek"
              rows="7"
              auto-resize
              class="w-full"
              required
            />
            <small class="text-color-secondary">已输入 {{ summaryLength }} 字</small>
          </div>

          <div class="field flex flex-column gap-2 m-0">
            <label class="font-semibold text-sm" for="problemsEncountered">遇到的问题</label>
            <Textarea
              id="problemsEncountered"
              v-model="formData.problemsEncountered"
              rows="5"
              auto-resize
              class="w-full"
            />
          </div>
        </div>
      </div>

      <div class="col-12 md:col-6">
        <div class="surface-50 border-round-xl p-4 h-full">
          <div class="field flex flex-column gap-2 mb-4">
            <label class="font-semibold text-sm" for="planNextWeek">下周计划 *</label>
            <Textarea
              id="planNextWeek"
              v-model="formData.planNextWeek"
              rows="7"
              auto-resize
              class="w-full"
              required
            />
            <small class="text-color-secondary">已输入 {{ planLength }} 字</small>
          </div>

          <div class="field flex flex-column gap-2 m-0">
            <label class="font-semibold text-sm" for="other">其他</label>
            <Textarea
              id="other"
              v-model="formData.other"
              rows="5"
              auto-resize
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-column gap-3 border-top-1 surface-border pt-4 md:flex-row md:align-items-center md:justify-content-between mt-4">
      <p class="text-sm text-color-secondary m-0">提交后可在“周报查看”中回顾与导出记录。</p>
      <Button
        type="button"
        label="提交周报"
        icon="pi pi-check"
        raised
        @click="handleSubmit"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import reportService, { WeeklyReportPayload } from '@/services/reportService';

type FormState = {
  weekStartDate: Date | null;
  summaryThisWeek: string;
  planNextWeek: string;
  problemsEncountered: string;
  other: string;
};

const toast = useToast();

const formatISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const buildInitialForm = (): FormState => ({
  weekStartDate: getCurrentWeekStart(),
  summaryThisWeek: '',
  planNextWeek: '',
  problemsEncountered: '',
  other: '',
});

const formData = ref<FormState>(buildInitialForm());

const formattedWeekStart = computed(() => {
  if (!formData.value.weekStartDate) return '--';
  return formData.value.weekStartDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
});

const currentWeekIndex = computed(() => {
  if (!formData.value.weekStartDate) return '--';
  const date = formData.value.weekStartDate;
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
  return Math.max(1, Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7));
});

const summaryLength = computed(() => formData.value.summaryThisWeek.trim().length);
const planLength = computed(() => formData.value.planNextWeek.trim().length);

const resetForm = () => {
  formData.value = buildInitialForm();
};

const toPayload = (state: FormState): WeeklyReportPayload => ({
  weekStartDate: formatISODate(state.weekStartDate || getCurrentWeekStart()),
  summaryThisWeek: state.summaryThisWeek,
  planNextWeek: state.planNextWeek,
  problemsEncountered: state.problemsEncountered,
  other: state.other,
});

const handleSubmit = async () => {
  if (!formData.value.summaryThisWeek.trim() || !formData.value.planNextWeek.trim()) {
    toast.add({ severity: 'warn', summary: '请填写必填项', detail: '本周总结与下周计划不能为空', life: 2500 });
    return;
  }

  try {
    const payload = toPayload(formData.value);
    const result = await reportService.create(payload);
    toast.add({ severity: 'success', summary: '周报提交成功', detail: `ID: ${result.id}`, life: 3000 });
    resetForm();
  } catch (error: any) {
    console.error('提交失败:', error);
    const detail =
      error?.response?.data?.error ||
      '提交失败，请检查网络或联系管理员。';
    toast.add({ severity: 'error', summary: '提交失败', detail, life: 3500 });
  }
};
</script>

<style scoped>
.letter-spacing-3 {
  letter-spacing: 0.3em;
}

.field :deep(.p-inputtextarea) {
  width: 100%;
}

.border-round-xl {
  border-radius: 1rem;
}

.shadow-1 {
  box-shadow: var(--shadow-2, 0 8px 30px -12px rgba(0, 0, 0, 0.18));
}
</style>
