<template>
  <Dialog :open="isOpen" @update:open="(val) => !val && closeModal()">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>修改销售数据</DialogTitle>
      </DialogHeader>

      <div v-if="isLoading" class="py-6 text-center text-muted-foreground">
        正在加载表单选项...
      </div>

      <form v-else @submit.prevent="handleSubmit" class="grid gap-4 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="edit_recordDate">记录日期 *</Label>
            <Input type="date" id="edit_recordDate" v-model="formData.recordDate" required />
          </div>

          <div class="grid gap-2">
            <Label>国家 *</Label>
            <Select v-model="selectedCountry" required>
              <SelectTrigger>
                <SelectValue placeholder="请选择国家..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="country in countryOptions" :key="country.code" :value="country.code">
                  {{ country.name }} ({{ country.code }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label>平台 *</Label>
            <Select v-model="selectedPlatform" :disabled="!selectedCountry" required>
              <SelectTrigger>
                <SelectValue placeholder="请选择平台..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="platform in platformOptions" :key="platform" :value="platform">
                  {{ platform }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label>店铺名称 *</Label>
            <Select v-model="formData.storeId" :disabled="!selectedPlatform" required>
              <SelectTrigger>
                <SelectValue placeholder="请选择店铺..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="store in storeOptions" :key="store.id" :value="store.id">
                  {{ store.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label>
              选择商品链接 (Listing) *
              <span class="text-xs font-normal text-muted-foreground ml-1">格式: [商品代码] 标题 (SKU)</span>
            </Label>
            <Select v-model="formData.listingId" :disabled="!formData.storeId || isLoadingListings" required>
              <SelectTrigger>
                <SelectValue :placeholder="isLoadingListings ? '加载链接..' : '请选择具体链接...'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="listing in storeListings" :key="listing.id" :value="listing.id">
                  <span v-if="listing.productCode">[{{ listing.productCode }}] </span>
                  {{ listing.storeTitle || '未命名链接' }} ({{ listing.product.sku }})
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="!saleDataToEdit?.listingId && !formData.listingId" class="text-[0.8rem] text-amber-600">
              提示：这是一条旧数据，请重新关联到一个具体的商品链接
            </p>
          </div>

          <div class="grid gap-2">
            <Label for="edit_salesVolume">销量 *</Label>
            <Input type="number" id="edit_salesVolume" v-model="formData.salesVolume" required />
          </div>

          <div class="grid gap-2">
            <Label for="edit_revenue">销售额 *</Label>
            <Input type="number" step="0.01" id="edit_revenue" v-model="formData.revenue" required />
          </div>

          <div class="grid gap-2">
            <Label>订单状态</Label>
            <Select v-model="formData.orderStatus">
              <SelectTrigger>
                <SelectValue placeholder="未设置" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, value) in ORDER_STATUS_MAP" :key="value" :value="value">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="edit_notes">备注 (可选)</Label>
            <Textarea id="edit_notes" v-model="formData.notes" rows="3" />
          </div>
        </div>

        <p v-if="errorMessage" class="text-destructive text-sm mt-2">
          {{ errorMessage }}
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" @click="closeModal">取消</Button>
          <Button type="submit">保存更改</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>



<script setup lang="ts">

import { ref, watch, computed } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '../../stores/auth';
import useStoreListings from '../../composables/useStoreListings';



// --- 常量 (Constants) ---

const ORDER_STATUS_MAP = {

  'PENDING': '待付款',

  'READY_TO_SHIP': '待发货',

  'SHIPPED': '已发货',

  'DELIVERED': '已送达',

  'COMPLETED': '已完成',

  'CANCELLED': '已取消',

  'RETURNED': '已退货'

};



const props = defineProps({

  isOpen: { type: Boolean, default: false },

  saleDataToEdit: { type: Object, default: null }

});

const emit = defineEmits(['close', 'sale-updated']);



const authStore = useAuthStore();

const {

  stores,

  fetchStores,

  storesError,

  getStoresByCountry,

  getStoresByCountryAndPlatform,

  fetchListings,

} = useStoreListings();

const formData = ref({});

const isLoading = ref(false);

const errorMessage = ref('');



// --- 级联菜单状---

const storeListings = ref([]); // ⬅️ 【修改】改Listings

const isLoadingListings = ref(false);

const selectedCountry = ref('');

const selectedPlatform = ref('');



// --- 级联菜单逻辑 ---



const countryOptions = computed(() => {

  const uniqueCountriesMap = new Map();

  stores.value.forEach(store => {

    if (store.country) {

      uniqueCountriesMap.set(store.country.code, store.country);

    }

  });

  const allUniqueCountries = Array.from(uniqueCountriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  

  if (authStore.role === 'admin') return allUniqueCountries; 

  const userCountryCodes = authStore.operatedCountries; 

  return allUniqueCountries.filter(country => userCountryCodes.includes(country.code));

});



const platformOptions = computed(() => {

  if (!selectedCountry.value) return [];

  const platforms = getStoresByCountry(selectedCountry.value)

    .map(store => store.platform);

  return [...new Set(platforms)].sort();

});



const storeOptions = computed(() => {

  if (!selectedCountry.value || !selectedPlatform.value) return [];

  return getStoresByCountryAndPlatform(selectedCountry.value, selectedPlatform.value)

    .sort((a, b) => a.name.localeCompare(b.name));

});



watch(() => storesError.value, (val) => {

  if (val) {

    errorMessage.value = val;

  }

});



// (级联) 重置

watch(selectedCountry, (newVal) => {

  if (newVal !== formData.value.store?.countryCode) {

    selectedPlatform.value = '';

    formData.value.storeId = '';

    formData.value.listingId = '';

  }

});

watch(selectedPlatform, (newVal) => {

  if (newVal !== formData.value.store?.platform) {

    formData.value.storeId = '';

    formData.value.listingId = '';

  }

});



// (级联) 获取 Listings

watch(() => formData.value.storeId, async (newStoreId, oldStoreId) => {

  // 如果是初次加载（oldStoreId undefined）且 storeId 没变，则不清
  if (newStoreId && newStoreId === props.saleDataToEdit?.storeId && !oldStoreId) {

     // 保留 listingId，不做操
  } else if (newStoreId !== oldStoreId) {

     formData.value.listingId = ''; // 切换店铺时清
  }

  

  storeListings.value = [];

  

  if (!newStoreId) return;

  

  isLoadingListings.value = true;

  try {

    storeListings.value = await fetchListings(newStoreId);

  } catch (error) {

    errorMessage.value = error.message || '无法加载店铺链接列表';

  } finally {

    isLoadingListings.value = false;

  }

});



// --- 弹窗核心逻辑 ---

watch(() => props.isOpen, async (newVal) => {

  if (newVal && props.saleDataToEdit) {

    isLoading.value = true;

    errorMessage.value = '';

    

    // 1. 复制数据到表
    formData.value = {

      ...props.saleDataToEdit,

      recordDate: new Date(props.saleDataToEdit.recordDate).toISOString().split('T')[0],

      notes: props.saleDataToEdit.notes || '',

      // ⬇️ 【新增】绑listingId

      listingId: props.saleDataToEdit.listingId || '',

      orderStatus: props.saleDataToEdit.orderStatus || ''

    };



    // 2. 加载所有店铺选项

    await fetchStores();



    // 3. 触发级联菜单

    selectedCountry.value = props.saleDataToEdit.store.countryCode;

    selectedPlatform.value = props.saleDataToEdit.store.platform;

    

    // 4. 手动触发一Listings 加载

    if (props.saleDataToEdit.storeId) {

       isLoadingListings.value = true;

       try {

         storeListings.value = await fetchListings(props.saleDataToEdit.storeId);

       } finally {

         isLoadingListings.value = false;

       }

    }

    

    isLoading.value = false;

  }

});



// --- 提交 ---

async function handleSubmit() {

  errorMessage.value = '';



  if (!formData.value.listingId) {

    errorMessage.value = '请选择一个商品链接';

    return;

  }

  

  // ⬇️ 【新增】查listing 对应productId

  const targetListing = storeListings.value.find(l => l.id === formData.value.listingId);

  if (!targetListing) {

    errorMessage.value = '链接数据无效，请刷新重试';

    return;

  }

  

  const payload = {

    recordDate: formData.value.recordDate,

    storeId: formData.value.storeId,

    listingId: formData.value.listingId, // ⬇️ 提交 listingId

    productId: targetListing.product.id, // ⬇️ 提交对应productId

    salesVolume: parseInt(formData.value.salesVolume) || 0,

    revenue: parseFloat(formData.value.revenue) || 0,

    notes: formData.value.notes || null,

    orderStatus: formData.value.orderStatus || null

  };



  try {

    const response = await apiClient.put(

      `/sales-data/${props.saleDataToEdit.id}`, 

      payload

    );

    emit('sale-updated', response.data);

  } catch (error) {

    console.error('更新失败:', error);

    errorMessage.value = error.response?.data?.error || '更新失败，请重试';

  }

}



function closeModal() {

  emit('close');

}



</script>



<style scoped>
/* Custom styles removed in favor of Shadcn/Tailwind */
</style>

