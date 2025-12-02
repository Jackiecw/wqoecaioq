<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-3xl font-bold tracking-tight text-stone-900">销售数据管理</h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>筛选条件</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="space-y-2">
            <Label for="startDate">开始日期</Label>
            <Input type="date" id="startDate" v-model="filters.startDate" />
          </div>
          <div class="space-y-2">
            <Label for="endDate">结束日期</Label>
            <Input type="date" id="endDate" v-model="filters.endDate" />
          </div>
          
          <div class="space-y-2">
            <Label>国家</Label>
            <Select v-model="filters.countryCode">
              <SelectTrigger>
                <SelectValue placeholder="所有国家" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有国家</SelectItem>
                <SelectItem v-for="country in countryOptions" :key="country.code" :value="country.code">
                  {{ country.name }} ({{ country.code }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>平台</Label>
            <Select v-model="filters.platform">
              <SelectTrigger>
                <SelectValue placeholder="所有平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有平台</SelectItem>
                <SelectItem v-for="platform in platformOptions" :key="platform" :value="platform">
                  {{ platform }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>店铺</Label>
            <Select v-model="filters.storeId" :disabled="!filters.countryCode && !filters.platform">
              <SelectTrigger>
                <SelectValue placeholder="所有店铺" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有店铺</SelectItem>
                <SelectItem v-for="store in storeOptions" :key="store.id" :value="store.id">
                  {{ store.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>订单状态</Label>
            <Select v-model="filters.orderStatus">
              <SelectTrigger>
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem v-for="(label, value) in ORDER_STATUS_MAP" :key="value" :value="value">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex justify-end space-x-4">
        <Button variant="outline" @click="resetFilters">
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          重置
        </Button>
        <Button @click="fetchData(true)">
          <FunnelIcon class="h-4 w-4 mr-2" />
          查询
        </Button>
      </CardFooter>
    </Card>

    <div v-if="isLoading" class="text-center py-10 text-muted-foreground">正在加载数据...</div>
    <div v-if="errorMessage" class="text-red-600 font-medium">{{ errorMessage }}</div>
    
    <div v-if="!isLoading && salesData.length > 0" class="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead @click="setSort('recordDate')" class="cursor-pointer hover:bg-muted/50">
              <div class="flex items-center space-x-1">
                <span>日期</span>
                <span class="inline-block w-4">
                  <ChevronUpIcon v-if="sorting.by === 'recordDate' && sorting.order === 'asc'" class="h-4 w-4" />
                  <ChevronDownIcon v-if="sorting.by === 'recordDate' && sorting.order === 'desc'" class="h-4 w-4" />
                </span>
              </div>
            </TableHead>
            <TableHead>国家</TableHead>
            <TableHead>店铺</TableHead>
            <TableHead>商品链接 / SKU</TableHead>
            <TableHead>状态</TableHead>
            <TableHead @click="setSort('salesVolume')" class="cursor-pointer hover:bg-muted/50">
              <div class="flex items-center space-x-1">
                <span>销量</span>
                <span class="inline-block w-4">
                  <ChevronUpIcon v-if="sorting.by === 'salesVolume' && sorting.order === 'asc'" class="h-4 w-4" />
                  <ChevronDownIcon v-if="sorting.by === 'salesVolume' && sorting.order === 'desc'" class="h-4 w-4" />
                </span>
              </div>
            </TableHead>
            <TableHead @click="setSort('revenue')" class="cursor-pointer hover:bg-muted/50">
              <div class="flex items-center space-x-1">
                <span>销售额</span>
                <span class="inline-block w-4">
                  <ChevronUpIcon v-if="sorting.by === 'revenue' && sorting.order === 'asc'" class="h-4 w-4" />
                  <ChevronDownIcon v-if="sorting.by === 'revenue' && sorting.order === 'desc'" class="h-4 w-4" />
                </span>
              </div>
            </TableHead>
            <TableHead>备注</TableHead>
            <TableHead>录入人</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in salesData" :key="row.id">
            <TableCell>{{ formatDate(row.recordDate) }}</TableCell>
            <TableCell>{{ row.store.country.name }}</TableCell>
            <TableCell>{{ row.store.name }}</TableCell>
            <TableCell>
              <div v-if="row.listing && row.listing.productCode" class="flex flex-col">
                <span class="font-semibold text-primary">{{ row.listing.productCode }}</span>
                <span class="text-xs text-muted-foreground">{{ row.product.sku }}</span>
              </div>
              <div v-else class="text-muted-foreground">
                {{ row.product.sku }} <span class="text-xs text-stone-400">(旧数据)</span>
              </div>
            </TableCell>
            <TableCell>
              <span v-if="row.orderStatus" :class="getStatusClass(row.orderStatus)" class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                {{ ORDER_STATUS_MAP[row.orderStatus] || row.orderStatus }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </TableCell>
            <TableCell>{{ row.salesVolume }}</TableCell>
            <TableCell>{{ row.revenue.toFixed(2) }}</TableCell>
            <TableCell class="max-w-xs truncate" :title="row.notes || ''">{{ row.notes || 'N/A' }}</TableCell>
            <TableCell>{{ row.enteredBy.nickname }}</TableCell>
            <TableCell>
              <div v-if="row.canManage" class="flex space-x-2">
                <Button variant="ghost" size="sm" @click="openEditModal(row)">修改</Button>
                <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="handleDelete(row.id)">删除</Button>
              </div>
              <span v-else class="text-muted-foreground text-xs">无权限</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div class="flex items-center justify-between px-4 py-4 border-t">
        <div class="text-sm text-muted-foreground">
          显示 {{ (page - 1) * pageSize + 1 }} 到 {{ Math.min(page * pageSize, total) }} 条，共 {{ total }} 条
        </div>
        <div class="flex items-center space-x-2">
          <Button variant="outline" size="sm" @click="changePage(page - 1)" :disabled="page <= 1">
            <ChevronLeftIcon class="h-4 w-4" />
          </Button>
          <span class="text-sm font-medium">{{ page }} / {{ totalPages }}</span>
          <Button variant="outline" size="sm" @click="changePage(page + 1)" :disabled="page >= totalPages">
            <ChevronRightIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
    
    <div v-if="!isLoading && salesData.length === 0 && !errorMessage" class="p-8 text-center text-muted-foreground bg-white rounded-lg border">
      <p>未找到符合条件的数据。</p>
    </div>
  </div>

  <SalesDataEditModal
    :is-open="isModalOpen"
    :sale-data-to-edit="selectedSaleData"
    @close="closeModal"
    @sale-updated="handleSaleUpdated"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import useStoreListings from '../../composables/useStoreListings';
import SalesDataEditModal from './SalesDataEditModal.vue';
import { salesService } from '../../services/salesService';
import { FunnelIcon, ArrowPathIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid';

// Shadcn Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- 常量 (Constants) ---
const ORDER_STATUS_MAP: Record<string, string> = {
  'PENDING': '待付款',
  'READY_TO_SHIP': '待发货',
  'SHIPPED': '已发货',
  'DELIVERED': '已送达',
  'COMPLETED': '已完成',
  'CANCELLED': '已取消',
  'RETURNED': '已退货'
};

// --- 状态(State) ---
const salesData = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const authStore = useAuthStore();

// 分页状态
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);

// 筛选器状态
const {
  stores,
  fetchStores,
  storesError,
} = useStoreListings();

const defaultFilters = () => ({
  startDate: '',
  endDate: '',
  countryCode: '',
  platform: '',
  storeId: '',
  orderStatus: '',
});
const filters = ref(defaultFilters());
const sorting = ref({ by: 'recordDate', order: 'desc' });

// 弹窗状态
const isModalOpen = ref(false);
const selectedSaleData = ref(null);

// --- 帮助组件：排序图标---
// SortIcon logic inlined in template

// --- 核心方法 (Methods) ---

async function fetchData(resetPage = false) {
  if (resetPage) {
    page.value = 1;
  }
  isLoading.value = true;
  errorMessage.value = '';
  
  const params: any = {
    sortBy: sorting.value.by,
    sortOrder: sorting.value.order,
    page: page.value,
    pageSize: pageSize.value,
  };
  
  for (const key in filters.value) {
    if ((filters.value as any)[key]) {
      params[key] = (filters.value as any)[key];
    }
  }

  try {
    const data = await salesService.getSalesData(params);
    
    if (Array.isArray(data)) {
      // 兼容旧接口
      salesData.value = data;
      total.value = data.length;
    } else {
      // 新分页接口
      salesData.value = data.data;
      total.value = data.total;
      page.value = data.page;
    }
  } catch (error) {
    console.error('获取销售数据失败', error);
    errorMessage.value = '获取数据失败，请重试。';
  } finally {
    isLoading.value = false;
  }
}

function changePage(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  fetchData(false);
}

onMounted(() => {
  fetchData();
  fetchStores();
});

const countryOptions = computed(() => {
  const uniqueCountriesMap = new Map<string, any>();
  stores.value.forEach((store: any) => {
    if (store.country) {
      uniqueCountriesMap.set(store.country.code, store.country);
    }
  });
  const allUniqueCountries = Array.from(uniqueCountriesMap.values())
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  if (authStore.role === 'admin') {
    return allUniqueCountries; 
  }
  const userCountryCodes = authStore.operatedCountries || []; 
  return allUniqueCountries.filter((country: any) => 
    userCountryCodes.includes(country.code)
  );
});

const platformOptions = computed(() => {
  let storesToFilter = stores.value;
  if (filters.value.countryCode) {
    storesToFilter = storesToFilter.filter((store: any) => store.countryCode === filters.value.countryCode);
  }
  const platforms = storesToFilter.map((store: any) => store.platform);
  return [...new Set(platforms)].sort();
});

const storeOptions = computed(() => {
  let storesToFilter = stores.value;
  
  if (filters.value.countryCode) {
    storesToFilter = storesToFilter.filter((store: any) => 
      store.countryCode === filters.value.countryCode
    );
  }
  if (filters.value.platform) {
    storesToFilter = storesToFilter.filter((store: any) =>
      store.platform === filters.value.platform
    );
  }
  
  return storesToFilter.sort((a: any, b: any) => a.name.localeCompare(b.name));
});

watch(() => storesError.value, (val) => {
  if (val) {
    errorMessage.value = val;
  }
  filters.value.storeId = '';
});

function resetFilters() {
  filters.value = defaultFilters();
  sorting.value = { by: 'recordDate', order: 'desc' };
  fetchData(true); // 重置筛选时也重置页码
}

function setSort(field: string) {
  if (sorting.value.by === field) {
    sorting.value.order = sorting.value.order === 'asc' ? 'desc' : 'asc';
  } else {
    sorting.value.by = field;
    sorting.value.order = 'desc';
  }
  fetchData(false); // 排序时保持在当前页
}

async function handleDelete(id: string) {
  if (confirm('确定要删除这条销售数据吗？此操作不可逆。')) {
    try {
      await salesService.delete(id);
      salesData.value = salesData.value.filter(row => row.id !== id);
    } catch (error: any) {
      console.error('删除失败:', error);
      errorMessage.value = error.response?.data?.error || '删除失败，请重试。';
    }
  }
}

function openEditModal(row: any) {
  selectedSaleData.value = row;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedSaleData.value = null;
}

function handleSaleUpdated(updatedRow: any) {
  const index = salesData.value.findIndex(row => row.id === updatedRow.id);
  if (index !== -1) {
    salesData.value[index] = updatedRow;
  }
  closeModal();
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'PENDING': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    'READY_TO_SHIP': 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'SHIPPED': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    'DELIVERED': 'bg-purple-50 text-purple-700 ring-purple-600/20',
    'COMPLETED': 'bg-green-50 text-green-700 ring-green-600/20',
    'CANCELLED': 'bg-red-50 text-red-700 ring-red-600/20',
    'RETURNED': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  };
  return classes[status] || 'bg-gray-50 text-gray-600 ring-gray-500/10';
}
</script>

<style scoped>
/* Removed custom styles in favor of Tailwind/Shadcn */
</style>
