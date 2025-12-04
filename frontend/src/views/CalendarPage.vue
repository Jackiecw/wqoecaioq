<template>
  <div class="flex flex-column gap-4">
    <!-- Page Header -->
    <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-900 m-0">工作日历</h1>
        <p class="text-500 mt-1 mb-0">集中安排会议、项目节点与团队计划</p>
      </div>
      <div class="flex flex-wrap gap-2 align-items-center">
        <div class="flex align-items-center gap-2 bg-white border-1 border-300 border-round-3xl px-2 py-1">
           <Button icon="pi pi-chevron-left" text rounded size="small" @click="onClickNav('prev')" />
           <span class="font-bold text-900 min-w-8rem text-center">{{ currentMonthDisplay }}</span>
           <Button icon="pi pi-chevron-right" text rounded size="small" @click="onClickNav('next')" />
        </div>
        <Button label="回到今日" outlined size="small" @click="onClickNav('today')" />
        <SelectButton
          v-model="currentView"
          :options="viewOptions"
          option-label="label"
          option-value="value"
          @change="(e) => setView(e.value)"
        />
        <Button label="新建日程" icon="pi pi-plus" @click="handleNewEventClick" />
      </div>
    </div>

    <!-- Admin Filters -->
    <Card v-if="isAdmin" class="shadow-sm border-round-xl">
      <template #content>
        <div class="flex align-items-center gap-3">
          <i class="pi pi-filter text-primary text-xl"></i>
          <div class="flex align-items-center gap-2 flex-1">
            <span class="text-sm font-semibold text-700">筛选视图：</span>
            <Dropdown
              v-model="adminFilterMode"
              :options="adminFilterOptions"
              option-label="label"
              option-value="value"
              class="w-10rem"
            />
            <Dropdown
              v-if="adminFilterMode === 'USER'"
              v-model="selectedUserId"
              :options="userList"
              option-label="nickname"
              option-value="id"
              placeholder="选择成员"
              class="w-12rem"
              filter
            />
          </div>
        </div>
      </template>
    </Card>

    <div class="grid">
      <!-- Left Column: Main Content -->
      <div class="col-12 lg:col-9">
        <div class="flex flex-column gap-4">
          <!-- Weekly Focus -->
          <Card class="shadow-sm border-round-2xl" style="border-left: 4px solid #8b5cf6">
            <template #title>
              <div class="flex align-items-center justify-content-between">
                <span class="text-lg font-bold text-900">本周聚焦</span>
                <Button
                  v-if="isAdmin"
                  :label="isSavingFocus ? '保存中...' : '同步所有人'"
                  :loading="isSavingFocus"
                  size="small"
                  outlined
                  @click="saveWeeklyFocus"
                />
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div class="col-12 md:col-6">
                  <label class="block text-sm font-semibold text-700 mb-2">团队重点 <span v-if="!weeklyFocusEntry" class="font-normal text-500 ml-2">(尚未发布)</span></label>
                  <Textarea
                    v-model="teamFocusContent"
                    rows="4"
                    class="w-full"
                    :readonly="!isAdmin"
                    :class="{'opacity-60': !isAdmin}"
                    placeholder="记录本周团队最重要的聚焦事项..."
                  />
                  <small class="text-red-500" v-if="weeklyFocusError">{{ weeklyFocusError }}</small>
                </div>
                <div class="col-12 md:col-6">
                  <label class="block text-sm font-semibold text-700 mb-2">我的周计划</label>
                  <div class="surface-ground p-3 border-round-xl text-sm text-700 h-8rem overflow-auto white-space-pre-wrap border-1 border-200">
                    {{ userPlanPreview || "暂无内容，请在周报中填写\"下周计划\"。" }}
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Calendar -->
          <Card class="shadow-sm border-round-2xl flex-1 min-h-0">
            <template #content>
              <div class="h-full" style="min-height: 600px">
                <FullCalendar
                  ref="calendarRef"
                  class="h-full"
                  :options="calendarOptions"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Right Column: Quick Panel -->
      <div class="col-12 lg:col-3">
        <div class="flex flex-column gap-4 sticky" style="top: 1rem">
          <!-- This Week Stats -->
          <Card class="shadow-sm border-round-xl" style="border-left: 4px solid #3b82f6">
            <template #title>
              <span class="text-base font-bold text-900">本周日程</span>
            </template>
            <template #content>
              <div class="flex flex-column gap-3">
                <div class="flex align-items-center justify-content-between">
                  <span class="text-sm text-600">总计</span>
                  <span class="text-xl font-bold text-900">{{ weekStats.total }}</span>
                </div>
                <div class="flex align-items-center justify-content-between">
                  <span class="text-sm text-600">进行中</span>
                  <span class="text-lg font-semibold" style="color: #3b82f6">{{ weekStats.ongoing }}</span>
                </div>
                <div class="flex align-items-center justify-content-between">
                  <span class="text-sm text-600">已完成</span>
                  <span class="text-lg font-semibold" style="color: #10b981">{{ weekStats.completed }}</span>
                </div>
              </div>
            </template>
          </Card>

          <!-- Upcoming Events -->
          <Card class="shadow-sm border-round-xl" style="border-left: 4px solid #f59e0b">
            <template #title>
              <span class="text-base font-bold text-900">即将到期</span>
            </template>
            <template #content>
              <div v-if="upcomingEvents.length === 0" class="text-sm text-500 text-center py-3">
                暂无即将到期的日程
              </div>
              <div v-else class="flex flex-column gap-2">
                <div 
                  v-for="event in upcomingEvents.slice(0, 5)" 
                  :key="event.id"
                  class="p-2 border-round bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors transition-duration-200"
                  @click="onClickEventById(event.id)"
                >
                  <div class="text-sm font-semibold text-900 mb-1">{{ event.title }}</div>
                  <div class="text-xs text-600">
                    <i class="pi pi-clock mr-1"></i>
                    {{ formatEventTime(event.start) }}
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Quick Actions -->
          <Card class="shadow-sm border-round-xl" style="border-left: 4px solid #10b981">
            <template #title>
              <span class="text-base font-bold text-900">快捷操作</span>
            </template>
            <template #content>
              <div class="flex flex-column gap-2">
                <Button 
                  label="跳转至今天" 
                  icon="pi pi-calendar" 
                  outlined 
                  size="small"
                  class="w-full"
                  @click="onClickNav('today')"
                />
                <Button 
                  label="新建日程" 
                  icon="pi pi-plus" 
                  severity="success"
                  size="small"
                  class="w-full"
                  @click="handleNewEventClick"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <div class="text-sm text-500">
      <p v-if="isLoadingEvents">正在拉取日程...</p>
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
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Dropdown from 'primevue/dropdown';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';

type CalendarView = 'month' | 'week' | 'day';
type AdminFilterMode = 'ME' | 'ALL_ASSIGNED' | 'USER';

const viewNameMap: Record<CalendarView, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
};

const viewOptions = [
  { label: '月视图', value: 'month' },
  { label: '周视图', value: 'week' },
  { label: '日视图', value: 'day' }
];

const adminFilterOptions = [
  { label: '仅自己', value: 'ME' },
  { label: '全部指派', value: 'ALL_ASSIGNED' },
  { label: '指定成员', value: 'USER' }
];

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

// 本周日程统计
const weekStats = computed(() => {
  const now = new Date();
  const weekStart = getWeekStartDate(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const weekEvents = events.value.filter((event: any) => {
    const eventStart = new Date(event.start);
    return eventStart >= weekStart && eventStart < weekEnd;
  });
  
  const total = weekEvents.length;
  const completed = weekEvents.filter((e: any) => e.extendedProps?.raw?.isCompleted).length;
  const ongoing = total - completed;
  
  return { total, ongoing, completed };
});

// 即将到期的日程（48小时内）
const upcomingEvents = computed(() => {
  const now = new Date();
  const threshold = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48小时后
  
  return events.value
    .filter((event: any) => {
      const eventStart = new Date(event.start);
      return eventStart > now && eventStart <= threshold;
    })
    .sort((a: any, b: any) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      return aStart - bStart;
    });
});

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

// 获取本周开始日期（周一）
function getWeekStartDate(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 格式化事件时间
function formatEventTime(dateInput: any) {
  const date = new Date(dateInput);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (isToday) return `今天 ${timeStr}`;
  if (isTomorrow) return `明天 ${timeStr}`;
  
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ` ${timeStr}`;
}

// 通过ID点击事件
function onClickEventById(eventId: string) {
  const cal = getCalendarApi();
  if (!cal) return;
  
  const event = cal.getEventById(eventId);
  if (event) {
    selectedEvent.value = normalizeSelectedEvent(event);
    selectedDateRange.value = null;
    isModalOpen.value = true;
  }
}
</script>

<style>
/* 日历细节样式集中在全局 style.css 中 */
</style>
