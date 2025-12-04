<template>
  <Dialog
    :visible="isOpen"
    modal
    header="日程"
    :style="{ width: '720px' }"
    @update:visible="onDialogToggle"
  >
    <TabView v-model:activeIndex="activeTab" class="mb-3">
      <TabPanel header="本周焦点" value="weekly">
        <div class="grid gap-3 md:grid-cols-2">
          <div class="surface-ground border-1 surface-border border-round-lg p-3">
            <h4 class="m-0 font-semibold text-color">团队聚焦</h4>
            <p class="text-xs text-color-secondary mb-2">由管理员统一发布</p>
            <div class="p-3 bg-white border-1 surface-border border-round-md text-sm text-color">
              {{ teamFocusDisplay }}
            </div>
          </div>
          <div class="surface-ground border-1 surface-border border-round-lg p-3">
            <h4 class="m-0 font-semibold text-color">我的行动计划</h4>
            <p class="text-xs text-color-secondary mb-2">周报中的“下周计划”</p>
            <div class="p-3 bg-white border-1 surface-border border-round-md text-sm text-color">
              {{ personalPlanDisplay }}
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="今日" value="today">
        <DailySchedule
          :is-loading="isLoadingDaily"
          :error="dailyError"
          :summary="dailySummaries.today"
        />
      </TabPanel>

      <TabPanel header="明日" value="tomorrow">
        <DailySchedule
          :is-loading="isLoadingDaily"
          :error="dailyError"
          :summary="dailySummaries.tomorrow"
        />
      </TabPanel>
    </TabView>

    <div class="flex justify-content-end pt-2">
      <Button label="关闭" icon="pi pi-times" @click="closeModal" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
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

const activeTab = ref(0);
const dailyError = ref('');
const isLoadingDaily = ref(false);
const dailySummaries = ref<{ today: DailySummary; tomorrow: DailySummary }>({
  today: createEmptyDailySummary(0),
  tomorrow: createEmptyDailySummary(1),
});

const teamFocusDisplay = computed(() => props.teamFocus?.trim() || '暂无团队聚焦内容');
const personalPlanDisplay = computed(() => props.planNextWeek?.trim() || '暂无个人计划');

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      activeTab.value = 0;
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
const DailySchedule = defineComponent({
  name: 'DailySchedule',
  props: {
    isLoading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    summary: {
      type: Object,
      required: true,
    },
  },
  components: { Message },
  setup(props) {
    return () => {
      const summary = props.summary as any;
      if (props.isLoading) {
        return h('div', { class: 'text-color-secondary text-center py-4 text-sm' }, '正在整理日程...');
      }
      if (props.error) {
        return h('div', { class: 'py-3' }, [
          h(
            Message,
            { severity: 'error', closable: false },
            { default: () => props.error },
          ),
        ]);
      }

      const items = summary.items?.length
        ? h(
            'ul',
            { class: 'flex flex-column gap-3' },
            summary.items.map((item: any) =>
              h('li', { key: item.id, class: 'flex gap-3 text-sm' }, [
                h('span', { class: 'text-primary font-semibold min-w-6rem' }, item.timeLabel),
                h('div', null, [
                  h('p', { class: 'text-color font-medium m-0' }, item.title),
                  h('p', { class: 'text-xs text-color-secondary m-0' }, item.meta),
                ]),
              ]),
            ),
          )
        : h('p', { class: 'text-sm text-color-secondary' }, '暂无日程安排');

      return h('div', { class: 'flex flex-column gap-2' }, [
        h('p', { class: 'text-xs uppercase text-color-secondary' }, summary.dateLabel),
        h('p', { class: 'text-sm text-color-secondary mb-2' }, summary.summary),
        items,
        summary.moreCount
          ? h('p', { class: 'text-xs text-color-secondary mt-1' }, `还有 ${summary.moreCount} 条日程`)
          : null,
      ]);
    };
  },
});
</script>
