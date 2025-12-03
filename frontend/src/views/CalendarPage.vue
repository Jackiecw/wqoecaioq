<template>
  <div class="space-y-6">
    <section class="rounded-3xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] p-6 text-white shadow-xl shadow-blue-900/20">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Operation Rhythm</p>
          <h2 class="mt-2 text-3xl font-semibold">工作日历</h2>
          <p class="text-sm text-white/80">集中安排会议、项目节点与团队计划。</p>
          <p class="mt-4 text-lg font-semibold text-white">{{ currentMonthDisplay }}</p>
        </div>
        <div class="flex w-full flex-col gap-3 lg:w-auto">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button @click="onClickNav('prev')" class="rounded-full border border-white/20 bg-white/10 p-2 transition hover:bg-white/20">
              <ChevronLeftIcon class="h-5 w-5 text-white" />
            </button>
            <button @click="onClickNav('next')" class="rounded-full border border-white/20 bg-white/10 p-2 transition hover:bg-white/20">
              <ChevronRightIcon class="h-5 w-5 text-white" />
            </button>
            <button @click="onClickNav('today')" class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3B82F6] shadow-sm hover:bg-[#E0F2FE]">
              回到今日
            </button>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div class="inline-flex rounded-full border border-white/30 bg-white/10 p-1 text-sm font-semibold">
              <button
                v-for="view in viewOptions"
                :key="view"
                @click="setView(view)"
                :class="[
                  'px-3 py-1 rounded-full transition',
                  currentView === view ? 'bg-white text-[#3B82F6]' : 'text-white/80'
                ]"
              >
                {{ view === 'month' ? '月' : view === 'week' ? '周' : '日' }}
              </button>
            </div>
            <div v-if="isAdmin" class="flex flex-1 items-center gap-2">
              <select v-model="adminFilterMode" class="flex-1 rounded-2xl border border-white/40 bg-white/90 px-3 py-2 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:border-white focus:outline-none appearance-none">
                <option value="ME">仅自己</option>
                <option value="ALL_ASSIGNED">全部指派</option>
                <option value="USER">指定成员</option>
              </select>
              <select
                v-if="adminFilterMode === 'USER'"
                v-model="selectedUserId"
                class="flex-1 rounded-2xl border border-white/40 bg-white/90 px-3 py-2 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:border-white focus:outline-none appearance-none"
              >
                <option value="" disabled>选择成员</option>
                <option v-for="u in userList" :key="u.id" :value="u.id">{{ u.nickname }}</option>
              </select>
            </div>
            <button
              @click="handleNewEventClick"
              class="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#3B82F6] shadow-lg shadow-blue-500/30 transition hover:bg-[#E0F2FE]"
            >
              <PlusIcon class="mr-1 h-5 w-5" />
              新建日程
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#94A3B8]">Weekly Focus</p>
          <h4 class="text-xl font-semibold text-[#1F2937]">本周聚焦</h4>
          <p class="text-xs text-[#6B7280]">左侧为管理员同步的团队重点，右侧展示你在周报中填写的“下周计划”。</p>
        </div>
        <div class="flex items-center gap-2">
          <p v-if="!isAdmin" class="text-xs text-[#94A3B8]">由管理员统一管理</p>
          <button
            v-if="isAdmin"
            class="rounded-full border border-[#E5E7EB] px-4 py-1.5 text-sm font-medium text-[#1F2937] transition hover:bg-[#F3F4F6] disabled:opacity-60"
            :disabled="isSavingFocus"
            @click="saveWeeklyFocus"
          >
            {{ isSavingFocus ? '保存中...' : '同步所有人' }}
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <label class="flex items-center justify-between text-sm font-semibold text-[#1F2937]">
            <span>团队重点</span>
            <span v-if="!weeklyFocusEntry" class="text-xs text-[#94A3B8]">尚未发布</span>
          </label>
          <textarea
            v-model="teamFocusContent"
            rows="4"
            class="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm text-[#374151] shadow-inner"
            :readonly="!isAdmin"
            :class="{'bg-[#F3F4F6] text-[#94A3B8] cursor-not-allowed': !isAdmin}"
            placeholder="记录本周团队最重要的聚焦事项..."
          ></textarea>
          <p class="text-xs text-red-500" v-if="weeklyFocusError">{{ weeklyFocusError }}</p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-[#1F2937]">我的周计划</label>
          <div class="min-h-[140px] rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm text-[#374151] shadow-inner whitespace-pre-wrap">
            {{ userPlanPreview || "暂无内容，请在周报中填写“下周计划”。" }}
          </div>
        </div>
      </div>
    </section>

    <section class="calendar-shell rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex-1 min-h-0">
      <FullCalendar
        ref="calendarRef"
        class="h-full"
        :options="calendarOptions"
      />
    </section>

    <div class="text-sm">
      <p v-if="isLoadingEvents" class="text-[#6B7280]">正在拉取日程...</p>
      <p v-if="apiError" class="text-red-600">{{ apiError }}</p>
    </div>
  </div>

  <EventModal
    :is-open="isModalOpen"
    :event-to-edit="selectedEvent"
    :selected-date-range="selectedDateRange"
    @save="handleEventSave"
    @delete="handleEventDelete"
    @close="closeModal"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid';
import { useAuthStore } from '@/stores/auth';
import calendarService, { CalendarEventDto } from '@/services/calendarService';
import EventModal from '@/components/common/EventModal.vue';

type CalendarView = 'month' | 'week' | 'day';
type AdminFilterMode = 'ME' | 'ALL_ASSIGNED' | 'USER';

const viewNameMap: Record<CalendarView, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
};
const viewOptions: CalendarView[] = ['month', 'week', 'day'];

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');
const apiError = ref('');
const isLoadingEvents = ref(false);
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const events = ref<any[]>([]);
const currentMonthDisplay = ref('');
const isModalOpen = ref(false);
const selectedEvent = ref<any>(null);
const selectedDateRange = ref<any>(null);
const weeklyFocusEntry = ref<any>(null);
const teamFocusContent = ref('');
const userPlanPreview = ref('');
const weeklyFocusError = ref('');
const isSavingFocus = ref(false);

const currentView = ref<CalendarView>('month');
const adminFilterMode = ref<AdminFilterMode>('ME');
const selectedUserId = ref('');
const userList = ref<any[]>([]);
const visibleRange = ref<{ start: Date | null; end: Date | null }>({ start: null, end: null });

watch(adminFilterMode, (mode) => {
  if (mode !== 'USER') {
    selectedUserId.value = '';
  }
});

watch([adminFilterMode, selectedUserId], ([mode, userId]) => {
  if (!isAdmin.value) return;
  if (mode === 'USER' && !userId) return;
  fetchEvents();
});

const calendarOptions = ref<any>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locales: [zhCnLocale],
  locale: 'zh-cn',
  initialView: viewNameMap.month,
  headerToolbar: false,
  selectable: true,
  selectMirror: true,
  editable: true,
  eventDurationEditable: true,
  eventStartEditable: true,
  height: '100%',
  expandRows: true,
  slotMinTime: '06:00:00',
  slotMaxTime: '24:00:00',
  scrollTime: '07:00:00',
  dayMaxEventRows: true,
  nowIndicator: true,
  selectOverlap: true,
  events: events.value,
  eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  select: onSelectDateTime,
  eventClick: onClickEvent,
  eventDrop: onEventMutate,
  eventResize: onEventMutate,
  datesSet: onDatesSet,
});

watch(events, (newEvents) => {
  const cal = getCalendarApi();
  if (cal) {
    cal.batchRendering(() => {
      cal.removeAllEventSources();
      cal.addEventSource(newEvents);
    });
  } else {
    calendarOptions.value.events = newEvents;
  }
}, { immediate: true });

const resizeHandler = ref<(() => void) | null>(null);

onMounted(() => {
  fetchWeeklyFocus();
  if (isAdmin.value) fetchUsers();
  nextTick(() => {
    const cal = getCalendarApi();
    cal?.updateSize();
  });
  resizeHandler.value = () => {
    const cal = getCalendarApi();
    cal?.updateSize();
  };
  window.addEventListener('resize', resizeHandler.value);
});

onActivated(() => {
  const cal = getCalendarApi();
  if (cal) {
    cal.render();
    cal.updateSize();
  }
});

onBeforeUnmount(() => {
  if (resizeHandler.value) {
    window.removeEventListener('resize', resizeHandler.value);
  }
});

function getCalendarApi() {
  return calendarRef.value?.getApi?.();
}

function onDatesSet(arg: any) {
  visibleRange.value = {
    start: new Date(arg.start),
    end: new Date(arg.end),
  };
  updateMonthDisplay(arg.start);
  fetchEvents();
}

function updateMonthDisplay(baseDate?: Date) {
  const target = baseDate ?? getCalendarApi()?.getDate();
  if (!(target instanceof Date)) return;
  currentMonthDisplay.value = `${target.getFullYear()} 年 ${target.getMonth() + 1} 月`;
}

async function fetchEvents() {
  if (!visibleRange.value?.start || !visibleRange.value?.end) {
    isLoadingEvents.value = false;
    return;
  }
  apiError.value = '';
  isLoadingEvents.value = true;
  try {
    const params: Record<string, any> = {
      start: visibleRange.value.start.toISOString(),
      end: visibleRange.value.end.toISOString(),
    };
    let data: CalendarEventDto[] = [];
    if (isAdmin.value && (adminFilterMode.value === 'ALL_ASSIGNED' || adminFilterMode.value === 'USER')) {
      if (adminFilterMode.value === 'USER' && selectedUserId.value) {
        params.userId = selectedUserId.value;
      }
      data = await calendarService.listAdminEvents(params);
    } else {
      data = await calendarService.listEvents(params);
    }
    events.value = (data || []).map(mapServerEvent);
  } catch (error: any) {
    console.error('获取日程失败:', error);
    const serverMsg = error?.response?.data?.error || error?.message || '未知错误';
    const status = error?.response?.status ? ` (HTTP ${error.response.status})` : '';
    apiError.value = `无法加载日程：${serverMsg}${status}`;
  } finally {
    isLoadingEvents.value = false;
  }
}

function mapServerEvent(event: CalendarEventDto) {
  const startAt = event.startAt ? new Date(event.startAt) : new Date();
  const endAt = event.endAt ? new Date(event.endAt) : startAt;
  const isAllDay = Boolean(event.isAllDay);
  const color = event.color || (event.createdByAdmin ? '#db2777' : '#4f46e5');
  return {
    id: String(event.id),
    title: event.title,
    start: startAt,
    end: isAllDay ? addDays(endAt, 1) : endAt,
    allDay: isAllDay,
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: {
      raw: { ...event, color },
    },
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function onClickNav(type: 'prev' | 'next' | 'today') {
  const cal = getCalendarApi();
  if (!cal) return;
  if (type === 'prev') cal.prev();
  else if (type === 'next') cal.next();
  else cal.today();
}

function setView(view: CalendarView) {
  if (currentView.value === view) return;
  currentView.value = view;
  nextTick(() => {
    const cal = getCalendarApi();
    cal?.changeView(viewNameMap[view]);
  });
}

function onSelectDateTime(info: any) {
  info.view?.calendar?.unselect();
  const rawEnd = info.end || info.start;
  const end = info.allDay ? addDays(rawEnd, -1) : rawEnd;
  selectedDateRange.value = { start: info.start, end, isAllday: info.allDay };
  selectedEvent.value = null;
  isModalOpen.value = true;
}

function onClickEvent(info: any) {
  selectedEvent.value = normalizeSelectedEvent(info.event);
  selectedDateRange.value = null;
  isModalOpen.value = true;
}

function normalizeSelectedEvent(eventApi: any) {
  const raw = eventApi.extendedProps?.raw || {};
  const fallbackEnd = eventApi.allDay ? addDays(eventApi.end ?? eventApi.start, -1) : (eventApi.end || eventApi.start);
  return {
    id: eventApi.id,
    title: raw.title ?? eventApi.title,
    start: raw.startAt ? new Date(raw.startAt) : eventApi.start,
    end: raw.endAt ? new Date(raw.endAt) : fallbackEnd,
    isAllday: typeof raw.isAllDay === 'boolean' ? raw.isAllDay : eventApi.allDay,
    raw,
  };
}

async function onEventMutate(info: any) {
  const eventApi = info.event;
  const raw = eventApi.extendedProps?.raw || {};
  if (raw.createdByAdmin && authStore.role !== 'admin') {
    info.revert();
    alert('权限不足：无法修改管理员指派的日程');
    fetchEvents();
    return;
  }
  const payload = {
    title: eventApi.title,
    startAt: eventApi.start?.toISOString(),
    endAt: getMutationEnd(eventApi),
    isAllDay: eventApi.allDay,
  };
  try {
    await calendarService.updateEvent(eventApi.id, payload, isAdmin.value);
    fetchEvents();
  } catch (error: any) {
    console.error('拖拽更新失败:', error);
    apiError.value = `更新失败: ${error.response?.data?.error || error.message || '未知错误'}`;
    info.revert();
    fetchEvents();
  }
}

function getMutationEnd(eventApi: any) {
  if (!eventApi.end) {
    return eventApi.start?.toISOString();
  }
  if (!eventApi.allDay) {
    return eventApi.end.toISOString();
  }
  const inclusive = addDays(eventApi.end, -1);
  inclusive.setHours(0, 0, 0, 0);
  return inclusive.toISOString();
}

function handleNewEventClick() {
  const today = getCalendarApi()?.getDate() ?? new Date();
  selectedDateRange.value = { start: today, end: today, isAllday: false };
  selectedEvent.value = null;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedEvent.value = null;
  selectedDateRange.value = null;
}

async function handleEventSave(payload: any) {
  apiError.value = '';
  try {
    if (payload.id) {
      await calendarService.updateEvent(payload.id, payload, isAdmin.value);
    } else {
      await calendarService.createEvent(payload, isAdmin.value);
    }
    closeModal();
    fetchEvents();
  } catch (error: any) {
    console.error('保存日程失败:', error);
    apiError.value = `保存失败: ${error.response?.data?.error || error.message || '未知错误'}`;
  }
}

async function handleEventDelete(eventId: string) {
  apiError.value = '';
  try {
    await calendarService.deleteEvent(eventId, isAdmin.value);
    closeModal();
    fetchEvents();
  } catch (error: any) {
    console.error('删除日程失败:', error);
    apiError.value = `删除失败: ${error.response?.data?.error || error.message || '未知错误'}`;
  }
}

async function fetchUsers() {
  try {
    const list = await calendarService.listUsers();
    userList.value = list || [];
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
}

function getWeekStartString(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

async function fetchWeeklyFocus() {
  try {
    weeklyFocusError.value = '';
    const weekStartDate = getWeekStartString();
    const res = await calendarService.getWeeklyFocus(weekStartDate);
    weeklyFocusEntry.value = res.focus;
    teamFocusContent.value = res.focus?.content || '';
    userPlanPreview.value = res.userPlan || '';
  } catch (error: any) {
    console.error('获取本周聚焦失败:', error);
    weeklyFocusEntry.value = null;
    teamFocusContent.value = '';
    weeklyFocusError.value = error.response?.data?.error || '无法获取本周聚焦';
  }
}

async function saveWeeklyFocus() {
  if (!isAdmin.value) return;
  try {
    weeklyFocusError.value = '';
    if (!weeklyFocusEntry.value?.id) {
      weeklyFocusError.value = '尚未生成本周聚焦，请刷新后重试。';
      return;
    }
    isSavingFocus.value = true;
    const res = await calendarService.updateWeeklyFocus(weeklyFocusEntry.value.id, teamFocusContent.value);
    weeklyFocusEntry.value = res;
    teamFocusContent.value = res.content || '';
  } catch (error: any) {
    console.error('更新本周聚焦失败:', error);
    weeklyFocusError.value = error.response?.data?.error || '更新失败';
  } finally {
    isSavingFocus.value = false;
  }
}
</script>

<style>
/* 日历细节样式集中在全局 style.css 中 */
</style>
