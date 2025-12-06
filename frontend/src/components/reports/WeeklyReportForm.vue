<template>
  <div class="report-form">
    <!-- Form Header -->
    <div class="form-header">
      <div class="header-left">
        <span class="form-badge">WEEKLY ENTRY</span>
        <h2>填写周报</h2>
        <p>用统一的结构记录本周成果、下周计划以及遇到的阻碍</p>
      </div>
      <div class="week-badge">
        <div class="week-number">第 {{ currentWeekIndex }} 周</div>
        <div class="week-date">{{ formattedWeekStart }}</div>
      </div>
    </div>

    <!-- Date Picker Row -->
    <div class="date-row">
      <div class="date-field">
        <label for="weekStartDate">开始日期</label>
        <Calendar
          input-id="weekStartDate"
          v-model="formData.weekStartDate"
          date-format="yy-mm-dd"
          show-icon
          class="w-full"
          :manual-input="true"
        />
        <small>系统默认选本周一，建议保持一致便于统计</small>
      </div>
      <div class="tips-card">
        <div class="tips-header">
          <i class="pi pi-lightbulb"></i>
          <span>书写提示</span>
        </div>
        <ul>
          <li>总结突出成就、关键数字和学习</li>
          <li>计划拆分为 3-5 个可执行事项</li>
          <li>遇到问题请写清阻碍与所需支持</li>
        </ul>
      </div>
    </div>

    <!-- Form Grid -->
    <div class="form-grid">
      <!-- 左列 -->
      <div class="form-column">
        <div class="field-card field-card--green">
          <label>
            <i class="pi pi-check-circle"></i>
            本周总结 <span class="required">*</span>
          </label>
          <Textarea
            v-model="formData.summaryThisWeek"
            rows="8"
            auto-resize
            placeholder="本周完成了哪些工作？有什么成果或亮点？"
          />
          <div class="field-footer">
            <span class="char-count">{{ summaryLength }} 字</span>
          </div>
        </div>

        <div class="field-card field-card--orange">
          <label>
            <i class="pi pi-exclamation-triangle"></i>
            遇到的问题
          </label>
          <Textarea
            v-model="formData.problemsEncountered"
            rows="5"
            auto-resize
            placeholder="遇到了什么困难？需要什么支持？"
          />
        </div>
      </div>

      <!-- 右列 -->
      <div class="form-column">
        <div class="field-card field-card--blue">
          <label>
            <i class="pi pi-flag"></i>
            下周计划 <span class="required">*</span>
          </label>
          <Textarea
            v-model="formData.planNextWeek"
            rows="8"
            auto-resize
            placeholder="下周准备做什么？有哪些重点任务？"
          />
          <div class="field-footer">
            <span class="char-count">{{ planLength }} 字</span>
          </div>
        </div>

        <div class="field-card field-card--gray">
          <label>
            <i class="pi pi-comment"></i>
            其他
          </label>
          <Textarea
            v-model="formData.other"
            rows="5"
            auto-resize
            placeholder="其他想说的..."
          />
        </div>
      </div>
    </div>

    <!-- Submit Footer -->
    <div class="form-footer">
      <p>提交后可在"周报查看"中回顾与导出记录</p>
      <Button
        label="提交周报"
        icon="pi pi-send"
        class="submit-btn"
        @click="handleSubmit"
      />
    </div>
  </div>
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
    const detail = error?.response?.data?.error || '提交失败，请检查网络或联系管理员。';
    toast.add({ severity: 'error', summary: '提交失败', detail, life: 3500 });
  }
};
</script>

<style scoped>
.report-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.5rem 0 0.25rem 0;
  color: var(--surface-900);
}

.header-left p {
  font-size: 0.875rem;
  color: var(--surface-500);
  margin: 0;
}

.form-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--primary-color);
  background: var(--primary-50);
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
}

.week-badge {
  background: var(--color-accent);
  color: white;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  text-align: center;
  min-width: 120px;
}

.week-number {
  font-size: 1.25rem;
  font-weight: 700;
}

.week-date {
  font-size: 0.75rem;
  opacity: 0.85;
  margin-top: 0.25rem;
}

/* Date Row */
.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.date-field small {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.tips-card {
  background: #fef3c7;
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  border-left: 4px solid #f59e0b;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
}

.tips-card ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.6;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Field Cards */
.field-card {
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  border-left: 4px solid transparent;
}

.field-card--green {
  border-left-color: #10b981;
}

.field-card--blue {
  border-left-color: var(--color-accent);
}

.field-card--orange {
  border-left-color: #f59e0b;
}

.field-card--gray {
  border-left-color: var(--color-text-muted);
}

.field-card label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.field-card label i {
  font-size: 1rem;
}

.field-card--green label i { color: #10b981; }
.field-card--blue label i { color: var(--color-accent); }
.field-card--orange label i { color: #f59e0b; }
.field-card--gray label i { color: var(--color-text-muted); }

.required {
  color: #ef4444;
}

.field-card :deep(.p-inputtextarea) {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.field-card :deep(.p-inputtextarea:focus) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.field-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Footer */
.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.form-footer p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.submit-btn {
  background: var(--color-accent);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.submit-btn:hover {
  filter: brightness(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .date-row,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-footer {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
