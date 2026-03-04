<template>
  <Dialog v-model:visible="isVisible" modal header="关联产品映射" :style="{ width: '80rem', maxWidth: '90vw' }" @update:visible="handleDialogClose" :pt="{ content: { class: '!p-0' } }">
    <div class="flex h-[600px]">
      <!-- Left Side: Unmatched Item Details -->
      <div class="w-1/3 bg-gray-50 p-6 border-r border-gray-200">
        <h4 class="text-sm font-medium text-gray-500 uppercase mb-4">待匹配条目</h4>
        <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col gap-4">
          <div>
            <span class="text-xs text-gray-500 block mb-1">平台</span>
            <span class="text-sm font-medium text-gray-900">{{ item?.platform }}</span>
          </div>
          <div>
            <span class="text-xs text-gray-500 block mb-1">商品标题</span>
            <p class="text-sm text-gray-900 m-0 leading-relaxed">{{ item?.title }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500 block mb-1">SKU / 变体</span>
            <div class="flex flex-wrap gap-2 mt-1">
              <Tag :value="item?.sku || '未填'" severity="info" />
              <Tag v-if="item?.variationName" :value="item.variationName" severity="secondary" />
            </div>
          </div>
          <div v-if="item?.platformSkuId">
            <span class="text-xs text-gray-500 block mb-1">平台 SKU ID</span>
            <span class="text-sm text-gray-900 break-all">{{ item?.platformSkuId }}</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs text-gray-500 block mb-1">数量</span>
              <span class="text-sm text-gray-900">{{ item?.quantity }}</span>
            </div>
            <div>
              <span class="text-xs text-gray-500 block mb-1">金额</span>
              <span class="text-sm text-gray-900">{{ item?.revenue }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Store Listings Grid -->
      <div class="w-2/3 flex flex-col bg-white">
        <!-- Search Bar -->
        <div class="p-4 border-b border-gray-200">
          <IconField iconPosition="left" class="w-full">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="搜索店铺在售商品 (标题 / SKU / Code)..." @input="handleSearch" class="w-full" />
          </IconField>
        </div>

        <!-- Listings Grid -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div v-if="loading" class="flex justify-center items-center h-full">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          </div>

          <div v-else-if="filteredListings.length === 0" class="flex flex-col justify-center items-center h-full text-gray-500">
            <i class="pi pi-inbox text-6xl text-gray-300 mb-3"></i>
            <p class="m-0">未找到匹配的商品</p>
          </div>

          <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div
              v-for="listing in filteredListings"
              :key="listing.id"
            >
              <div
                class="relative flex flex-row items-center rounded-lg border bg-white p-3 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md h-full"
                :class="selectedListing?.id === listing.id ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50' : 'border-gray-200 hover:border-blue-300'"
                @click="selectListing(listing)"
              >
                <!-- Thumbnail -->
                <div class="w-16 h-16 shrink-0 overflow-hidden rounded-md bg-gray-100 mr-4 border border-gray-100 flex items-center justify-center">
                  <img v-if="listing.storeImageUrl" :src="listing.storeImageUrl" class="w-full h-full object-cover" />
                  <i v-else class="pi pi-image text-2xl text-gray-400"></i>
                </div>
                
                <!-- Details -->
                <div class="flex flex-col flex-1 min-w-0 pr-8">
                  <h3 class="text-sm font-medium text-gray-900 m-0 mb-1 leading-tight line-clamp-2" :title="listing.storeTitle">
                    {{ listing.storeTitle }}
                  </h3>
                  <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <p class="m-0 truncate" :title="listing.product?.sku">SKU: <span class="text-gray-700 font-medium">{{ listing.product?.sku }}</span></p>
                    <p class="m-0 truncate" :title="listing.productCode">Code: <span class="text-gray-700 font-medium">{{ listing.productCode }}</span></p>
                  </div>
                </div>
                
                <!-- Checkmark for selected -->
                <div v-if="selectedListing?.id === listing.id" class="absolute" style="top: 50%; right: 0.75rem; transform: translateY(-50%)">
                  <i class="pi pi-check-circle text-primary-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-200 bg-white flex justify-end gap-2">
          <Button label="取消" severity="secondary" outlined @click="closeModal" />
          <Button label="确认关联" :disabled="!selectedListing" @click="confirm" />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import apiClient from '@/services/apiClient';

const props = defineProps({
  modelValue: Boolean,
  item: Object,
  storeId: String,
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const searchQuery = ref('');
const allListings = ref([]);
const filteredListings = ref([]);
const selectedListing = ref(null);
const loading = ref(false);
const isVisible = ref(false);

watch(
  () => props.modelValue,
  async (newVal) => {
    isVisible.value = newVal;
    if (newVal && props.storeId) {
      loading.value = true;
      searchQuery.value = '';
      selectedListing.value = null;
      filteredListings.value = [];
      try {
        const response = await apiClient.get(`/admin/store-listings/by-store/${props.storeId}`);
        allListings.value = response.data;
        filteredListings.value = allListings.value;
        
        // --- 智能推荐：基于指纹预搜索 ---
        const queryTerms = [];
        if (props.item?.sku) queryTerms.push(props.item.sku);
        if (props.item?.variationName) queryTerms.push(props.item.variationName);
        if (queryTerms.length > 0) {
            searchQuery.value = queryTerms.join(' ');
            handleSearch();
        }
      } catch (e) {
        console.error('Failed to fetch store listings', e);
        allListings.value = [];
      } finally {
        loading.value = false;
      }
    }
  },
);

const handleSearch = () => {
  if (!searchQuery.value) {
    filteredListings.value = allListings.value;
    return;
  }

  const terms = searchQuery.value.toLowerCase().split(' ').filter(t => t.trim());
  
  filteredListings.value = allListings.value.filter((l) => {
    const targetString = [
        l.storeTitle, 
        l.product?.sku, 
        l.productCode
    ].filter(Boolean).join(' ').toLowerCase();

    // 必须包含所有的关键词 (AND 逻辑)
    return terms.every(term => targetString.includes(term));
  });
};

const selectListing = (listing) => {
  selectedListing.value = listing;
};

const handleDialogClose = (val: boolean) => {
  if (!val) {
    closeModal();
  }
};

const closeModal = () => {
  isVisible.value = false;
  emit('update:modelValue', false);
};

const confirm = () => {
  if (selectedListing.value) {
    emit('confirm', {
      originalItem: props.item,
      listingId: selectedListing.value.id,
      listing: selectedListing.value,
    });
    closeModal();
  }
};
</script>
