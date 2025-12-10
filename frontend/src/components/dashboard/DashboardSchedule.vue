<template>
  <Dialog
    :visible="isOpen"
    modal
    :showHeader="false"
    :style="{ width: '48rem' }"
    :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    :pt="{
      root: { class: 'schedule-dialog' },
      content: { class: 'schedule-dialog-content' },
      mask: { class: 'schedule-dialog-mask' }
    }"
    @update:visible="onDialogToggle"
  >
    <div class="schedule-modal">
      <!-- Custom Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div>
            <h3 class="modal-title">日程总览</h3>
            <p class="modal-subtitle">{{ currentDateDisplay }}</p>
          </div>
        </div>
        <button class="close-btn" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Custom Tabs -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ 'is-active': activeTab === tab.value }"
          @click="activeTab = tab.value as typeof activeTab"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="modal-body">
        <!-- 本周焦点 -->
        <div v-if="activeTab === 'weekly'" class="weekly-focus-grid">
          <div class="focus-card focus-card--team">
            <div class="focus-card-header">
              <div class="focus-icon focus-icon--purple">
                <i class="pi pi-users"></i>
              </div>
              <div>
                <h4 class="focus-title">团队聚焦</h4>
                <p class="focus-subtitle">由管理员统一发布</p>
              </div>
            </div>
            <div class="focus-content">
              {{ teamFocusDisplay }}
            </div>
          </div>
          <div class="focus-card focus-card--personal">
            <div class="focus-card-header">
              <div class="focus-icon focus-icon--blue">
                <i class="pi pi-user"></i>
              </div>
              <div>
                <h4 class="focus-title">我的行动计划</h4>
                <p class="focus-subtitle">周报中的"下周计划"</p>
              </div>
            </div>
            <div class="focus-content">
              {{ personalPlanDisplay }}
            </div>
          </div>
        </div>

        <!-- 今日/明日 -->
        <div v-else class="daily-section">
          <DailyScheduleView
            :is-loading="isLoadingDaily"
            :error="dailyError"
            :summary="activeTab === 'today' ? dailySummaries.today : dailySummaries.tomorrow"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <Button 
          label="关闭" 
          icon="pi pi-times" 
          severity="secondary" 
          outlined
          @click="closeModal" 
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';

type CalendarEvent = {
  id: string | number;
  title: string;
  startAt: string;
  endAt?: string | null;
  isAllDay?: boolean;
  createdByAdmin?: boolean;
};

type DailyItem = {
  id: string | number;
  title: string;
  timeLabel: string;
  meta: string;
  isAdmin: boolean;
};

type DailySummary = {
  dateLabel: string;
  summary: string;
  items: DailyItem[];
  moreCount: number;
};

const props = defineProps<{
  isOpen: boolean;
  planNextWeek?: string;
  teamFocus?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const tabs = [
  { label: '本周焦点', value: 'weekly', icon: 'pi pi-star' },
  { label: '今日', value: 'today', icon: 'pi pi-calendar' },
  { label: '明日', value: 'tomorrow', icon: 'pi pi-calendar-plus' },
];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'long' });

const createEmptyDailySummary = (offset: number): DailySummary => {
  const base = addDays(startOfDay(new Date()), offset);
  return {
    dateLabel: formatDayLabel(base),
    summary: '暂无日程安排',
    items: [],
    moreCount: 0,
  };
};

const activeTab = ref<'weekly' | 'today' | 'tomorrow'>('weekly');
const dailyError = ref('');
const isLoadingDaily = ref(false);
const dailySummaries = ref<{ today: DailySummary; tomorrow: DailySummary }>({
  today: createEmptyDailySummary(0),
  tomorrow: createEmptyDailySummary(1),
});

const currentDateDisplay = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
});

const teamFocusDisplay = computed(() => props.teamFocus?.trim() || '暂无团队聚焦内容');
const personalPlanDisplay = computed(() => props.planNextWeek?.trim() || '暂无个人计划');

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      activeTab.value = 'weekly';
      loadDailySummaries();
    }
  },
);

const loadDailySummaries = async () => {
  try {
    isLoadingDaily.value = true;
    dailyError.value = '';
    const todayStart = startOfDay(new Date());
    const dayAfterTomorrow = addDays(todayStart, 2);
    const response = await apiClient.get('/calendar/events', {
      params: {
        start: todayStart.toISOString(),
        end: dayAfterTomorrow.toISOString(),
      },
    });
    const events = Array.isArray(response.data) ? (response.data as CalendarEvent[]) : [];
    dailySummaries.value.today = summarizeDay(events, todayStart, addDays(todayStart, 1));
    dailySummaries.value.tomorrow = summarizeDay(events, addDays(todayStart, 1), dayAfterTomorrow);
  } catch (error: any) {
    console.error('获取日程摘要失败:', error);
    dailyError.value = error.response?.data?.error || error.message || '无法加载日程摘要';
    dailySummaries.value.today = createEmptyDailySummary(0);
    dailySummaries.value.tomorrow = createEmptyDailySummary(1);
  } finally {
    isLoadingDaily.value = false;
  }
};

const summarizeDay = (events: CalendarEvent[], dayStart: Date, dayEnd: Date): DailySummary => {
  const dayEvents = events
    .filter((event) => {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt || event.startAt);
      return start < dayEnd && end > dayStart;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const items: DailyItem[] = dayEvents.slice(0, 5).map((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt || event.startAt);
    const timeLabel = event.isAllDay ? '全天' : `${formatTime(start)} - ${formatTime(end)}`;
    return {
      id: event.id,
      title: event.title,
      timeLabel,
      meta: event.createdByAdmin ? '管理员指派' : '个人日程',
      isAdmin: !!event.createdByAdmin,
    };
  });

  return {
    dateLabel: formatDayLabel(dayStart),
    summary: dayEvents.length ? `共有 ${dayEvents.length} 个日程` : '暂无日程安排',
    items,
    moreCount: Math.max(dayEvents.length - items.length, 0),
  };
};

const onDialogToggle = (visible: boolean) => {
  if (!visible) closeModal();
};

const closeModal = () => {
  emit('close');
};

// Daily Schedule View Component
const DailyScheduleView = defineComponent({
  name: 'DailyScheduleView',
  props: {
    isLoading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    summary: { type: Object, required: true },
  },
  components: { Message },
  setup(props) {
    return () => {
      const summary = props.summary as DailySummary;
      
      if (props.isLoading) {
        return h('div', { class: 'loading-state' }, [
          h('i', { class: 'pi pi-spin pi-spinner' }),
          h('span', null, '正在加载日程...'),
        ]);
      }
      
      if (props.error) {
        return h('div', { class: 'error-state' }, [
          h(Message, { severity: 'error', closable: false }, { default: () => props.error }),
        ]);
      }

      const dateHeader = h('div', { class: 'date-header' }, [
        h('span', { class: 'date-label' }, summary.dateLabel),
        h('span', { class: 'date-count' }, summary.summary),
      ]);

      const items = summary.items?.length
        ? h('div', { class: 'schedule-list' }, 
            summary.items.map((item: DailyItem) =>
              h('div', { key: String(item.id), class: 'schedule-item' }, [
                h('div', { class: 'item-time' }, [
                  h('i', { class: 'pi pi-clock' }),
                  h('span', null, item.timeLabel),
                ]),
                h('div', { class: 'item-content' }, [
                  h('p', { class: 'item-title' }, item.title),
                  h('span', { 
                    class: ['item-badge', item.isAdmin ? 'item-badge--admin' : 'item-badge--personal'] 
                  }, item.meta),
                ]),
              ])
            )
          )
        : h('div', { class: 'empty-state' }, [
            h('i', { class: 'pi pi-calendar' }),
            h('p', null, '暂无日程安排'),
          ]);

      const moreCount = summary.moreCount
        ? h('div', { class: 'more-count' }, `还有 ${summary.moreCount} 条日程`)
        : null;

      return h('div', { class: 'daily-content' }, [dateHeader, items, moreCount]);
    };
  },
});
</script>

<style scoped>
.schedule-modal {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.header-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* Tabs */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-item:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.tab-item.is-active {
  background: var(--color-bg-card);
  color: var(--color-accent);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.tab-item i {
  font-size: 0.875rem;
}

/* Weekly Focus Grid */
.weekly-focus-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.focus-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.focus-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
}

.focus-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.focus-icon--purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.focus-icon--blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.focus-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.focus-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0.125rem 0 0 0;
}

.focus-content {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  min-height: 80px;
  white-space: pre-wrap;
}

/* Daily Section */
.daily-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.date-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.date-count {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  gap: 1rem;
  padding: 0.875rem;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.schedule-item:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.item-time {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 120px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
}

.item-time i {
  font-size: 0.75rem;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.item-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: 0.6875rem;
  font-weight: 500;
}

.item-badge--admin {
  background: rgba(236, 72, 153, 0.1);
  color: #ec4899;
}

.item-badge--personal {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem;
  color: var(--color-text-muted);
  text-align: center;
}

.loading-state i,
.empty-state i {
  font-size: 1.5rem;
}

.more-count {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-align: center;
  padding-top: 0.5rem;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

/* Responsive */
@media (max-width: 640px) {
  .weekly-focus-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-item span {
    display: none;
  }
}
</style>

<style>
/* Global Dialog Styles */
.schedule-dialog .p-dialog-content {
  padding: 1.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.schedule-dialog-mask {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
</style>
