<template>
  <Dialog v-model:visible="isVisible" modal header="关联产品映射" :style="{ width: '80rem', maxWidth: '90vw' }" @update:visible="handleDialogClose" :contentClass="'p-0'">
    <div class="flex" style="height: 600px">
      <!-- Left Side: Unmatched Item Details -->
      <div class="w-4 bg-surface-50 p-5 border-right-1 border-200">
        <h4 class="text-sm font-medium text-500 uppercase mb-4">待匹配条目</h4>
        <div class="bg-white border-round-lg border-1 border-200 p-4 shadow-1 flex flex-column gap-4">
          <div>
            <span class="text-xs text-500 block mb-1">平台</span>
            <span class="text-sm font-medium text-900">{{ item?.platform }}</span>
          </div>
          <div>
            <span class="text-xs text-500 block mb-1">商品标题</span>
            <p class="text-sm text-900 m-0">{{ item?.title }}</p>
          </div>
          <div>
            <span class="text-xs text-500 block mb-1">SKU</span>
            <Tag :value="item?.sku" severity="info" />
          </div>
          <div class="grid">
            <div class="col-6">
              <span class="text-xs text-500 block mb-1">数量</span>
              <span class="text-sm text-900">{{ item?.quantity }}</span>
            </div>
            <div class="col-6">
              <span class="text-xs text-500 block mb-1">金额</span>
              <span class="text-sm text-900">{{ item?.revenue }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Store Listings Grid -->
      <div class="w-8 flex flex-column bg-white">
        <!-- Search Bar -->
        <div class="p-4 border-bottom-1 border-200">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="搜索店铺在售商品 (标题 / SKU / Code)..." @input="handleSearch" class="w-full" />
          </IconField>
        </div>

        <!-- Listings Grid -->
        <div class="flex-1 overflow-y-auto p-4 bg-surface-50">
          <div v-if="loading" class="flex justify-content-center align-items-center h-full">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          </div>

          <div v-else-if="filteredListings.length === 0" class="flex flex-column justify-content-center align-items-center h-full text-500">
            <i class="pi pi-inbox text-6xl text-300 mb-3"></i>
            <p class="m-0">未找到匹配的商品</p>
          </div>

          <div v-else class="grid">
            <div
              v-for="listing in filteredListings"
              :key="listing.id"
              class="col-6 p-2"
            >
              <div
                class="relative flex flex-column border-round-lg border-1 bg-white p-3 shadow-1 cursor-pointer transition-all transition-duration-200 hover:shadow-3"
                :class="selectedListing?.id === listing.id ? 'border-primary-500 surface-border' : 'border-200 hover:border-primary-300'"
                @click="selectListing(listing)"
              >
                <div class="w-full overflow-hidden border-round-md bg-surface-100 mb-3" style="aspect-ratio: 1 / 1">
                  <img v-if="listing.storeImageUrl" :src="listing.storeImageUrl" class="w-full h-full object-fit-cover" />
                  <div v-else class="flex h-full w-full align-items-center justify-content-center text-400">
                    <i class="pi pi-image text-4xl"></i>
                  </div>
                </div>
                <div class="flex flex-column flex-1">
                  <h3 class="text-sm font-medium text-900 m-0 mb-2 line-height-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden" :title="listing.storeTitle">
                    {{ listing.storeTitle }}
                  </h3>
                  <div class="flex flex-column gap-1 text-xs text-500">
                    <p class="m-0">SKU: <span class="text-700">{{ listing.product?.sku }}</span></p>
                    <p class="m-0">Code: {{ listing.productCode }}</p>
                  </div>
                </div>
                <!-- Checkmark for selected -->
                <div v-if="selectedListing?.id === listing.id" class="absolute" style="top: 0.5rem; right: 0.5rem">
                  <i class="pi pi-check-circle text-primary text-2xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-top-1 border-200 bg-white flex justify-content-end gap-2">
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

  const query = searchQuery.value.toLowerCase();
  filteredListings.value = allListings.value.filter(
    (l) =>
      l.storeTitle.toLowerCase().includes(query) ||
      (l.product?.sku && l.product.sku.toLowerCase().includes(query)) ||
      (l.productCode && l.productCode.toLowerCase().includes(query)),
  );
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
