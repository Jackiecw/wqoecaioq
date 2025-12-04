<template>
  <div class="calendar-page min-h-screen">
    <!-- Page Header - Refined with Apple-like minimalism -->
    <header class="mb-6">
      <div class="flex flex-column lg:flex-row lg:align-items-center lg:justify-content-between gap-4">
        <!-- Title Section -->
        <div>
          <h1 class="text-3xl font-semibold text-slate-800 m-0 tracking-tight">工作日历</h1>
          <p class="text-slate-500 mt-1 mb-0 text-sm">集中安排会议、项目节点与团队计划</p>
        </div>
        
        <!-- Controls Section -->
        <div class="flex flex-wrap gap-3 align-items-center">
          <!-- Navigation Pill -->
          <div class="nav-pill flex align-items-center gap-1 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-full px-1 py-1 shadow-sm">
            <button 
              class="nav-btn w-8 h-8 flex align-items-center justify-content-center rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-all duration-200"
              @click="onClickNav('prev')"
            >
              <i class="pi pi-chevron-left text-sm"></i>
            </button>
            <span class="font-semibold text-slate-700 text-center text-sm px-3 whitespace-nowrap">{{ currentMonthDisplay }}</span>
            <button 
              class="nav-btn w-8 h-8 flex align-items-center justify-content-center rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-all duration-200"
              @click="onClickNav('next')"
            >
              <i class="pi pi-chevron-right text-sm"></i>
            </button>
          </div>
          
          <!-- Today Button -->
          <button 
            class="today-btn px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
            @click="onClickNav('today')"
          >
            今天
          </button>
          
          <!-- View Switcher - Minimal Segment Control -->
          <div class="view-switcher flex bg-slate-100/80 backdrop-blur-sm rounded-lg p-0.5 shadow-inner">
            <button
              v-for="option in viewOptions"
              :key="option.value"
              class="view-btn px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
              :class="currentView === option.value 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'"
              @click="setView(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          
          <!-- New Event Button - Primary CTA -->
          <button 
            class="new-event-btn flex align-items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 shadow-md"
            @click="handleNewEventClick"
          >
            <i class="pi pi-plus text-xs"></i>
            新建日程
          </button>
        </div>
      </div>
      
      <!-- Admin Filters - Floating Toolbar Style -->
      <div 
        v-if="isAdmin" 
        class="admin-toolbar mt-4 flex align-items-center gap-3 px-4 py-2.5 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-sm"
      >
        <div class="flex align-items-center gap-2 text-slate-400">
          <i class="pi pi-filter-fill text-xs"></i>
          <span class="text-xs font-medium uppercase tracking-wider">筛选</span>
        </div>
        <div class="w-px h-4 bg-slate-200"></div>
        <div class="flex align-items-center gap-3 flex-1">
          <Dropdown
            v-model="adminFilterMode"
            :options="adminFilterOptions"
            option-label="label"
            option-value="value"
            class="filter-dropdown w-8rem"
          />
          <Dropdown
            v-if="adminFilterMode === 'USER'"
            v-model="selectedUserId"
            :options="userList"
            option-label="nickname"
            option-value="id"
            placeholder="选择成员"
            class="filter-dropdown w-10rem"
            filter
          />
        </div>
      </div>
    </header>

    <!-- Main Content Grid - Using Flexbox for reliable layout -->
    <div class="content-layout flex flex-column xl:flex-row gap-5">
      <!-- Left Column: Main Content -->
      <div class="main-column flex-1 min-w-0">
        <div class="flex flex-column gap-5">
          
          <!-- Weekly Focus - Featured Insight Card -->
          <div class="focus-card relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <!-- Gradient Border Accent -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>
            
            <div class="p-5">
              <div class="flex align-items-center justify-content-between mb-4">
                <div class="flex align-items-center gap-3">
                  <div class="focus-icon w-10 h-10 flex align-items-center justify-content-center bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                    <i class="pi pi-star-fill text-violet-600"></i>
                  </div>
                  <div>
                    <h3 class="text-base font-semibold text-slate-800 m-0">本周聚焦</h3>
                    <span v-if="!weeklyFocusEntry" class="text-xs text-slate-400">尚未发布</span>
                  </div>
                </div>
                <Button
                  v-if="isAdmin"
                  :label="isSavingFocus ? '保存中...' : '同步所有人'"
                  :loading="isSavingFocus"
                  size="small"
                  class="sync-btn"
                  @click="saveWeeklyFocus"
                />
              </div>
              
              <div class="flex flex-column md:flex-row gap-4">
                <!-- Team Focus -->
                <div class="flex-1">
                  <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    团队重点
                  </label>
                  <div class="focus-textarea-wrapper">
                    <Textarea
                      v-model="teamFocusContent"
                      rows="4"
                      class="focus-textarea w-full"
                      :readonly="!isAdmin"
                      :class="{'opacity-60': !isAdmin}"
                      placeholder="记录本周团队最重要的聚焦事项..."
                    />
                  </div>
                  <small class="text-red-500 text-xs mt-1 block" v-if="weeklyFocusError">{{ weeklyFocusError }}</small>
                </div>
                
                <!-- My Weekly Plan -->
                <div class="flex-1">
                  <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    我的周计划
                  </label>
                  <div class="plan-preview p-4 bg-slate-50/80 border border-slate-100 rounded-xl text-sm text-slate-600 min-h-8rem overflow-auto whitespace-pre-wrap">
                    {{ userPlanPreview || "暂无内容，请在周报中填写\"下周计划\"。" }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Calendar Card -->
          <div class="calendar-card bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex-1">
            <div class="calendar-wrapper p-4">
              <FullCalendar
                ref="calendarRef"
                class="modern-calendar"
                :options="calendarOptions"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Dashboard Widgets -->
      <div class="sidebar-column w-full xl:w-20rem flex-shrink-0">
        <div class="flex flex-column gap-4 xl:sticky" style="top: 1rem">
          
          <!-- This Week Stats - Mini Dashboard Widget -->
          <div class="stats-widget bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
            <div class="flex align-items-center gap-3 mb-4">
              <div class="w-9 h-9 flex align-items-center justify-content-center bg-blue-50 rounded-xl">
                <i class="pi pi-chart-bar text-blue-600"></i>
              </div>
              <h4 class="text-sm font-semibold text-slate-800 m-0 whitespace-nowrap">本周日程</h4>
            </div>
            
            <div class="flex flex-column gap-3">
              <!-- Total -->
              <div class="stat-row flex align-items-center justify-content-between p-3 bg-slate-50/80 rounded-xl">
                <span class="text-sm text-slate-500">总计</span>
                <span class="text-2xl font-bold text-slate-800">{{ weekStats.total }}</span>
              </div>
              
              <!-- Ongoing -->
              <div class="stat-row flex align-items-center justify-content-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div class="flex align-items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span class="text-sm text-slate-600 whitespace-nowrap">进行中</span>
                </div>
                <span class="text-lg font-semibold text-blue-600">{{ weekStats.ongoing }}</span>
              </div>
              
              <!-- Completed -->
              <div class="stat-row flex align-items-center justify-content-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div class="flex align-items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="text-sm text-slate-600 whitespace-nowrap">已完成</span>
                </div>
                <span class="text-lg font-semibold text-emerald-600">{{ weekStats.completed }}</span>
              </div>
            </div>
          </div>

          <!-- Upcoming Events - Sleek List Widget -->
          <div class="upcoming-widget bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
            <div class="flex align-items-center gap-3 mb-4">
              <div class="w-9 h-9 flex align-items-center justify-content-center bg-amber-50 rounded-xl">
                <i class="pi pi-clock text-amber-600"></i>
              </div>
              <h4 class="text-sm font-semibold text-slate-800 m-0 whitespace-nowrap">即将到期</h4>
            </div>
            
            <div v-if="upcomingEvents.length === 0" class="text-center py-6">
              <div class="w-12 h-12 mx-auto mb-3 flex align-items-center justify-content-center bg-slate-100 rounded-full">
                <i class="pi pi-check text-slate-400 text-xl"></i>
              </div>
              <p class="text-sm text-slate-400 m-0">暂无即将到期的日程</p>
            </div>
            
            <div v-else class="flex flex-column gap-1">
              <div 
                v-for="event in upcomingEvents.slice(0, 5)" 
                :key="event.id"
                class="event-row flex flex-column gap-1 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all duration-200 group"
                @click="onClickEventById(event.id)"
              >
                <div class="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                  {{ event.title }}
                </div>
                <div class="flex align-items-center gap-1.5 text-xs text-slate-400">
                  <i class="pi pi-clock text-xs"></i>
                  <span>{{ formatEventTime(event.start) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Widget -->
          <div class="actions-widget bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
            <div class="flex align-items-center gap-3 mb-4">
              <div class="w-9 h-9 flex align-items-center justify-content-center bg-emerald-50 rounded-xl">
                <i class="pi pi-bolt text-emerald-600"></i>
              </div>
              <h4 class="text-sm font-semibold text-slate-800 m-0">快捷操作</h4>
            </div>
            
            <div class="flex flex-column gap-2">
              <button 
                class="action-btn flex align-items-center justify-content-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                @click="onClickNav('today')"
              >
                <i class="pi pi-calendar text-sm"></i>
                跳转至今天
              </button>
              
              <button 
                class="action-btn-primary flex align-items-center justify-content-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                @click="handleNewEventClick"
              >
                <i class="pi pi-plus text-sm"></i>
                新建日程
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div class="mt-4" v-if="isLoadingEvents || apiError">
      <p v-if="isLoadingEvents" class="text-sm text-slate-400 flex align-items-center gap-2">
        <i class="pi pi-spin pi-spinner"></i>
        正在拉取日程...
      </p>
      <p v-if="apiError" class="text-sm text-red-500 flex align-items-center gap-2">
        <i class="pi pi-exclamation-circle"></i>
        {{ apiError }}
      </p>
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

const viewOptions: { label: string; value: CalendarView }[] = [
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
/* ===== Calendar Page Base Styles ===== */
.calendar-page {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* ===== Sync Button Override ===== */
.sync-btn.p-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border: none;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
  transition: all 0.2s ease;
}
.sync-btn.p-button:hover {
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
  transform: translateY(-1px);
}

/* ===== Filter Dropdown Overrides ===== */
.filter-dropdown.p-dropdown {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
}
.filter-dropdown.p-dropdown:not(.p-disabled):hover {
  border-color: #cbd5e1;
}
.filter-dropdown.p-dropdown:not(.p-disabled).p-focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

/* ===== Focus Textarea Overrides ===== */
.focus-textarea.p-inputtextarea {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  padding: 0.875rem;
  resize: none;
  transition: all 0.2s ease;
}
.focus-textarea.p-inputtextarea:enabled:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
  background: white;
}
.focus-textarea.p-inputtextarea::placeholder {
  color: #9ca3af;
}

/* ===== Plan Preview ===== */
.plan-preview {
  line-height: 1.6;
}

/* ===== Calendar Container ===== */
.calendar-wrapper {
  min-height: 600px;
  height: calc(100vh - 400px);
  max-height: 800px;
}

/* ===== Sidebar Width for XL screens ===== */
@media (min-width: 1280px) {
  .sidebar-column {
    width: 300px;
    flex-shrink: 0;
  }
  .main-column {
    flex: 1;
    min-width: 0;
  }
}

/* ===== FullCalendar Modern Overrides ===== */
.modern-calendar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  height: 100%;
}

/* Header Row (Days of Week) */
.modern-calendar .fc-col-header-cell-cushion {
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #64748b;
  padding: 0.75rem 0;
}

/* Day Numbers */
.modern-calendar .fc-daygrid-day-number {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  padding: 0.5rem;
}

/* Today Highlight */
.modern-calendar .fc-day-today {
  background: rgba(99, 102, 241, 0.04) !important;
}
.modern-calendar .fc-day-today .fc-daygrid-day-number {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white !important;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  margin: 4px;
  padding: 0 !important;
  line-height: 1;
}

/* Grid Lines - Ultra Subtle */
.modern-calendar .fc-scrollgrid {
  border: none !important;
}
.modern-calendar .fc-scrollgrid td,
.modern-calendar .fc-scrollgrid th {
  border-color: #f1f5f9 !important;
}
.modern-calendar .fc-scrollgrid-section > td {
  border: none !important;
}

/* Event Bars */
.modern-calendar .fc-event {
  border: none !important;
  border-radius: 0.375rem !important;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.15s ease;
}
.modern-calendar .fc-event:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* More Events Link */
.modern-calendar .fc-daygrid-more-link {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6366f1;
}
.modern-calendar .fc-daygrid-more-link:hover {
  color: #4f46e5;
}

/* Time Grid */
.modern-calendar .fc-timegrid-slot-label-cushion {
  font-size: 0.7rem;
  color: #94a3b8;
}

.modern-calendar .fc-timegrid-slot {
  height: 3rem;
}

/* Now Indicator */
.modern-calendar .fc-timegrid-now-indicator-line {
  border-color: #ef4444 !important;
  border-width: 2px;
}
.modern-calendar .fc-timegrid-now-indicator-arrow {
  border-color: #ef4444 !important;
}

/* Popover */
.modern-calendar .fc-popover {
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.modern-calendar .fc-popover-header {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #334155;
}

/* Week View All Day Section */
.modern-calendar .fc-daygrid-body {
  border-bottom: 1px solid #f1f5f9;
}

/* ===== Widget Styles ===== */
.stats-widget,
.upcoming-widget,
.actions-widget {
  transition: box-shadow 0.2s ease;
}
.stats-widget:hover,
.upcoming-widget:hover,
.actions-widget:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ===== Utility Classes for Tailwind Gaps ===== */
.gap-0\.5 { gap: 0.125rem; }
.gap-1\.5 { gap: 0.375rem; }
.py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
.px-0\.5 { padding-left: 0.125rem; padding-right: 0.125rem; }

/* Backdrop blur for older browsers */
@supports not (backdrop-filter: blur(8px)) {
  .backdrop-blur-sm { background-color: rgba(255, 255, 255, 0.95); }
  .backdrop-blur-md { background-color: rgba(255, 255, 255, 0.98); }
}
</style>
