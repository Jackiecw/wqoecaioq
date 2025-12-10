<template>
  <div class="page-shell calendar-page">
    <PageHeader
      title="工作日历"
      subtitle="集中安排会议、项目节点与团队计划"
    >
      <template #actions>
        <div class="header-actions">
          <!-- Admin Filter (inline) -->
          <div v-if="isAdmin" class="admin-filter-group">
            <Dropdown
              v-model="adminFilterMode"
              :options="adminFilterOptions"
              option-label="label"
              option-value="value"
              class="filter-dropdown-compact"
            />
            <Dropdown
              v-if="adminFilterMode === 'USER'"
              v-model="selectedUserId"
              :options="userList"
              option-label="nickname"
              option-value="id"
              placeholder="选择成员"
              class="filter-dropdown-compact"
              filter
            />
          </div>

          <div class="nav-pill">
            <button class="nav-btn" @click="onClickNav('prev')"><i class="pi pi-chevron-left"></i></button>
            <span class="nav-label">{{ currentMonthDisplay }}</span>
            <button class="nav-btn" @click="onClickNav('next')"><i class="pi pi-chevron-right"></i></button>
          </div>
          <button class="btn-subtle" @click="onClickNav('today')">今天</button>
          <div class="pill-tab-group">
            <button
              v-for="option in viewOptions"
              :key="option.value"
              class="pill-tab"
              :class="{ 'is-active': currentView === option.value }"
              @click="setView(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <button class="btn-subtle btn-primary" @click="handleNewEventClick">
            <i class="pi pi-plus"></i>
            新建日程
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="content-grid">
      <div class="main-column">
        <ContentCard class="focus-card">
          <div class="focus-header">
            <div class="focus-left">
              <div class="focus-icon">
                <i class="pi pi-star-fill"></i>
              </div>
              <div>
                <h3>本周聚焦</h3>
                <small v-if="!weeklyFocusEntry">尚未发布</small>
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
          <div class="focus-body">
            <div class="focus-column">
              <label>团队重点</label>
              <Textarea
                v-model="teamFocusContent"
                rows="4"
                class="focus-textarea w-full"
                :readonly="!isAdmin"
                :class="{ 'opacity-60': !isAdmin }"
                placeholder="记录本周团队最重要的聚焦事项..."
              />
              <small class="text-red-500 text-xs mt-1 block" v-if="weeklyFocusError">{{ weeklyFocusError }}</small>
            </div>
            <div class="focus-column">
              <label>我的周计划</label>
              <div class="plan-preview">
                {{ userPlanPreview || '暂无内容，请在周报中填写“下周计划”。' }}
              </div>
            </div>
          </div>
        </ContentCard>

        <ContentCard class="calendar-card">
          <FullCalendar
            ref="calendarRef"
            class="modern-calendar"
            :options="calendarOptions"
          />
        </ContentCard>
      </div>

      <div class="sidebar-column">
        <ContentCard class="stats-card">
          <div class="card-title">
            <i class="pi pi-chart-bar"></i>
            <span>本周日程</span>
          </div>
          <div class="stat-row">
            <span>总计</span>
            <strong>{{ weekStats.total }}</strong>
          </div>
          <div class="stat-row">
            <div class="stat-dot dot-blue"></div>
            <span>进行中</span>
            <strong class="text-blue">{{ weekStats.ongoing }}</strong>
          </div>
          <div class="stat-row">
            <div class="stat-dot dot-green"></div>
            <span>已完成</span>
            <strong class="text-green">{{ weekStats.completed }}</strong>
          </div>
        </ContentCard>

        <ContentCard class="list-card">
          <div class="card-title">
            <i class="pi pi-clock"></i>
            <span>即将到期</span>
          </div>
          <div v-if="upcomingEvents.length === 0" class="empty-small">
            <i class="pi pi-check"></i>
            <p>暂无即将到期的日程</p>
          </div>
          <div v-else class="list-body">
            <button
              v-for="event in upcomingEvents.slice(0, 5)"
              :key="event.id"
              class="list-item"
              @click="onClickEventById(event.id)"
            >
              <span class="title">{{ event.title }}</span>
              <span class="meta"><i class="pi pi-clock"></i>{{ formatEventTime(event.start) }}</span>
            </button>
          </div>
        </ContentCard>

        <ContentCard class="actions-card">
          <div class="card-title">
            <i class="pi pi-bolt"></i>
            <span>快捷操作</span>
          </div>
          <div class="actions">
            <button class="btn-subtle w-full justify-center" @click="onClickNav('today')">
              <i class="pi pi-calendar"></i>
              跳转至今天
            </button>
            <button class="btn-subtle btn-primary w-full justify-center" @click="handleNewEventClick">
              <i class="pi pi-plus"></i>
              新建日程
            </button>
          </div>
        </ContentCard>
      </div>
    </div>

    <div class="status-bar" v-if="isLoadingEvents || apiError">
      <p v-if="isLoadingEvents" class="muted">
        <i class="pi pi-spin pi-spinner"></i>
        正在拉取日程...
      </p>
      <p v-if="apiError" class="error">
        <i class="pi pi-exclamation-circle"></i>
        {{ apiError }}
      </p>
    </div>

    <EventModal
      :is-open="isModalOpen"
      :event-to-edit="selectedEvent"
      :selected-date-range="selectedDateRange"
      @save="handleEventSave"
      @delete="handleEventDelete"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { useAuthStore } from '@/stores/auth';
import calendarService, { CalendarEventDto } from '@/services/calendarService';
import EventModal from '@/components/calendar/EventModal.vue';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';

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

const upcomingEvents = computed(() => {
  const now = new Date();
  const threshold = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return events.value
    .filter((event: any) => {
      const eventStart = new Date(event.start);
      return eventStart > now && eventStart <= threshold;
    })
    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
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
  nextTick(() => getCalendarApi()?.updateSize());
  resizeHandler.value = () => getCalendarApi()?.updateSize();
  window.addEventListener('resize', resizeHandler.value);
});

onActivated(() => {
  const cal = getCalendarApi();
  cal?.render();
  cal?.updateSize();
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
  visibleRange.value = { start: new Date(arg.start), end: new Date(arg.end) };
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
      if (adminFilterMode.value === 'USER' && selectedUserId.value) params.userId = selectedUserId.value;
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
  nextTick(() => getCalendarApi()?.changeView(viewNameMap[view]));
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
  if (!eventApi.end) return eventApi.start?.toISOString();
  if (!eventApi.allDay) return eventApi.end.toISOString();
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

function getWeekStartDate(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

<style scoped>
.calendar-page {
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-xs);
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.nav-btn:hover { background: var(--color-bg-page); color: var(--color-text-primary); }
.nav-label { font-weight: 600; color: var(--color-text-primary); font-size: 0.9rem; }

.filter-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.admin-filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--color-accent-soft);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
}

.filter-dropdown-compact {
  min-width: 100px;
}

.filter-dropdown-compact :deep(.p-select) {
  background: transparent;
  border: none;
  box-shadow: none;
  font-size: 0.8125rem;
}

.filter-dropdown-compact :deep(.p-select-label) {
  padding: 0.375rem 0.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 320px;
  gap: var(--space-4);
}

.main-column { display: flex; flex-direction: column; gap: var(--space-4); }
.sidebar-column { display: flex; flex-direction: column; gap: var(--space-4); }

.focus-card h3 { margin: 0; font-size: 1rem; color: var(--color-text-primary); }
.focus-header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.focus-left { display: flex; align-items: center; gap: var(--space-3); }
.focus-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-lg);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  display: flex; align-items: center; justify-content: center;
}
.focus-body { display: flex; flex-direction: column; gap: var(--space-3); }
.focus-column { display: flex; flex-direction: column; gap: 0.5rem; }
.focus-column label { font-size: 0.85rem; color: var(--color-text-secondary); font-weight: 600; }
.focus-textarea :deep(.p-inputtextarea) {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  padding: 0.75rem;
}
.plan-preview {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.85rem;
  min-height: 140px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.calendar-card { padding: var(--space-4); min-height: 640px; }
.modern-calendar { min-height: 560px; }

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}
.card-title i { color: var(--color-accent); }

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}
.stat-row:last-child { border-bottom: none; }
.stat-row strong { color: var(--color-text-primary); }
.stat-dot { width: 8px; height: 8px; border-radius: 999px; margin-right: 6px; }
.dot-blue { background: #3b82f6; }
.dot-green { background: #10b981; }
.text-blue { color: #2563eb; }
.text-green { color: #059669; }

.list-body { display: flex; flex-direction: column; gap: 0.5rem; }
.list-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  background: var(--color-bg-card);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.list-item:hover { border-color: var(--color-accent); box-shadow: var(--shadow-sm); }
.list-item .title { display: block; font-weight: 600; color: var(--color-text-primary); }
.list-item .meta { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-muted); font-size: 0.85rem; }

.empty-small {
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: var(--space-3);
}

.actions { display: flex; flex-direction: column; gap: 0.5rem; }

.status-bar { margin-top: var(--space-3); }
.status-bar .muted { color: var(--color-text-muted); font-size: 0.9rem; }
.status-bar .error { color: #dc2626; font-size: 0.9rem; }

/* FullCalendar overrides (kept minimal) */
.modern-calendar .fc-col-header-cell-cushion {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  padding: 0.75rem 0;
}
.modern-calendar .fc-daygrid-day-number {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
  padding: 0.5rem;
}
.modern-calendar .fc-day-today {
  background: rgba(59, 130, 246, 0.08) !important;
}
.modern-calendar .fc-daygrid-day-number.fc-today {
  background: var(--color-accent);
  color: white !important;
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.5rem;
}
.modern-calendar .fc-scrollgrid td,
.modern-calendar .fc-scrollgrid th {
  border-color: #e2e8f0 !important;
}
.modern-calendar .fc-event {
  border: none !important;
  border-radius: var(--radius-sm) !important;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  box-shadow: var(--shadow-sm);
}

@media (max-width: 1024px) {
  .content-grid { grid-template-columns: 1fr; }
  .header-actions { gap: var(--space-2); }
}
</style>
