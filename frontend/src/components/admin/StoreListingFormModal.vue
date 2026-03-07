<template>
  <Dialog
    :visible="isOpen"
    modal
    :showHeader="false"
    :style="{ width: '680px' }"
    :breakpoints="{ '960px': '85vw', '640px': '95vw' }"
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'listing-form-dialog' },
      content: { class: 'listing-form-content' },
    }"
    @update:visible="onDialogToggle"
  >
    <div class="modal-wrapper">
      <!-- Custom Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">
            <i :class="isEditMode ? 'pi pi-pencil' : 'pi pi-plus-circle'"></i>
          </div>
          <div>
            <h3 class="modal-title">{{ isEditMode ? '编辑在售商品' : '上架新商品' }}</h3>
            <p class="modal-subtitle">{{ isEditMode ? '修改商品链接信息' : '选择产品并配置上架信息' }}</p>
          </div>
        </div>
        <button class="close-btn" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>{{ isLoadingMessage }}</span>
      </div>

      <!-- Form -->
      <div v-else class="modal-body">
        <!-- Section 1: 产品选择 -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-box"></i>
            <span>选择产品</span>
          </div>
          <div class="uni-form-field">
            <label class="uni-form-label">产品（产品目录）<span class="required">*</span></label>
            <Dropdown
              v-model="formData.productId"
              :options="allProducts"
              option-label="displayLabel"
              option-value="id"
              placeholder="请选择产品..."
              :disabled="isEditMode"
              class="w-full"
              filter
            />
          </div>
        </div>

        <!-- Section 2: 上架位置 -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-map-marker"></i>
            <span>上架位置</span>
          </div>
          <div class="uni-form-grid uni-form-grid--2col">
            <div class="uni-form-field">
              <label class="uni-form-label">国家<span class="required">*</span></label>
              <Dropdown
                v-model="selectedCountryCode"
                :options="countryOptions"
                option-label="displayLabel"
                option-value="code"
                placeholder="请选择..."
                :disabled="isEditMode"
                class="w-full"
                filter
              />
            </div>
            <div class="uni-form-field">
              <label class="uni-form-label">店铺<span class="required">*</span></label>
              <Dropdown
                v-model="formData.storeId"
                :options="filteredStores"
                option-label="name"
                option-value="id"
                placeholder="请选择..."
                :disabled="isEditMode || filteredStores.length === 0"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: 商品信息 -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-tag"></i>
            <span>商品信息</span>
          </div>
          <div class="uni-form-grid uni-form-grid--2col">
            <div class="uni-form-field uni-form-field--full">
              <label class="uni-form-label">商品标题<span class="required">*</span></label>
              <InputText
                v-model="formData.storeTitle"
                class="w-full"
                placeholder="例如：Vega Pro 官方旗舰店"
              />
            </div>
            <div class="uni-form-field">
              <label class="uni-form-label">商品代码<span class="required">*</span></label>
              <InputText
                v-model="formData.productCode"
                class="w-full"
                placeholder="例如：VP-01"
              />
            </div>
            <div class="uni-form-field">
              <label class="uni-form-label">
                售价
                <span class="optional">({{ currentCurrencyLabel }})</span>
              </label>
              <InputNumber
                v-model="formData.currentPrice"
                :min="0"
                :max-fraction-digits="2"
                mode="decimal"
                class="w-full"
                input-class="w-full"
                placeholder="0.00"
              />
            </div>
            <div class="uni-form-field">
              <label class="uni-form-label">商品链接 ID<span class="optional">(选填)</span></label>
              <InputText
                v-model="formData.platformProductId"
                class="w-full"
                placeholder="例如：123456789"
              />
            </div>
            <div class="uni-form-field">
              <label class="uni-form-label">商品链接<span class="optional">(选填)</span></label>
              <InputText
                v-model="formData.platformUrl"
                class="w-full"
                placeholder="https://shopee.co.id/..."
              />
            </div>
          </div>
        </div>

        <!-- Section 4: 商品图片 -->
        <div class="uni-form-section">
          <div class="uni-section-title">
            <i class="pi pi-image"></i>
            <span>商品主图</span>
            <span class="optional">{{ isEditMode ? '(可替换)' : '(可选)' }}</span>
          </div>
          <div class="image-upload-row">
            <div
              class="image-uploader"
              :class="{ 'has-image': previewUrl }"
              @click="triggerFileInput"
            >
              <img v-if="previewUrl" :src="previewUrl" alt="商品图片" />
              <div v-else class="upload-placeholder">
                <i class="pi pi-cloud-upload"></i>
                <span>点击上传图片</span>
                <span class="upload-hint">JPG, PNG</span>
              </div>
              <input
                ref="fileInputRef"
                type="file"
                @change="onFileSelected"
                accept="image/png, image/jpeg"
                class="hidden-input"
              />
            </div>
            <Button
              v-if="previewUrl"
              icon="pi pi-trash"
              label="移除图片"
              severity="danger"
              text
              size="small"
              @click="removeImage"
            />
          </div>
        </div>

        <!-- Section 5: 历史标题与别名映射 -->
        <div class="uni-form-section" v-if="isEditMode">
          <div class="uni-section-title">
            <i class="pi pi-link"></i>
            <span>匹配别名 / 历史标题映射</span>
            <span class="optional">(自动保存)</span>
          </div>

          <div class="mapping-list" v-if="mappings.length > 0">
            <div v-for="mapping in mappings" :key="mapping.id" class="mapping-item">
              <div class="mapping-info">
                <span v-if="mapping.externalTitle" class="m-title">{{ mapping.externalTitle }}</span>
                <div class="m-meta">
                  <span v-if="mapping.externalSku" class="m-sku">SKU: {{ mapping.externalSku }}</span>
                  <span v-if="mapping.variationName" class="m-var">变体: {{ mapping.variationName }}</span>
                </div>
              </div>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click="confirmDeleteMapping(mapping.id)"
              />
            </div>
          </div>
          <div v-else class="mapping-empty">
            暂无历史别名记录
          </div>

          <div class="mapping-add-form">
            <InputText v-model="newMapping.externalTitle" class="w-full" placeholder="输入历史标题 (原样复制)" />
            <div class="mapping-add-row">
              <InputText v-model="newMapping.externalSku" class="w-full" placeholder="外部 SKU (选填)" />
              <InputText v-model="newMapping.variationName" class="w-full" placeholder="变体名 (选填)" />
              <Button
                label="添加"
                severity="secondary"
                outlined
                size="small"
                @click="addMapping"
                :disabled="isAddingMapping || (!newMapping.externalTitle && !newMapping.externalSku)"
              />
            </div>
          </div>
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
      </div>

      <!-- Footer -->
      <div class="uni-modal-footer" style="padding: 1rem 1.5rem; margin-top: 0;">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button
          :label="isEditMode ? '保存修改' : '确认上架'"
          :icon="isEditMode ? 'pi pi-check' : 'pi pi-upload'"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </div>
  </Dialog>

  <ConfirmDialog />
  <Toast />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import apiClient from '@/services/apiClient';
import useStoreListings from '../../composables/useStoreListings';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  listingToEditId: { type: String, default: null },
});

const emit = defineEmits(['close', 'listing-created', 'listing-updated']);
const toast = useToast();
const confirm = useConfirm();

type ListingProduct = {
  id: string;
  sku?: string;
  name?: string;
  displayLabel?: string;
};

type CountryOption = { code: string; name: string; displayLabel?: string };

type ListingFormState = {
  productId: string;
  storeId: string;
  storeTitle: string;
  productCode: string;
  currentPrice: number | null;
  platformUrl: string;
  platformProductId: string;
};

type OptionPayload = {
  products?: ListingProduct[];
  currencyMap?: Record<string, string>;
};

type ListingMapping = {
  id: string;
  externalTitle?: string;
  externalSku?: string;
  variationName?: string;
};

const defaultFormData = (): ListingFormState => ({
  productId: '',
  storeId: '',
  storeTitle: '',
  productCode: '',
  currentPrice: null,
  platformUrl: '',
  platformProductId: '',
});

const formData = ref<ListingFormState>(defaultFormData());
const allProducts = ref<ListingProduct[]>([]);
const currencyMap = ref<Record<string, string>>({});
const selectedCountryCode = ref<string>('');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isLoadingMessage = ref('');

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const errorMessage = ref<string>('');
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

const mappings = ref<ListingMapping[]>([]);
const newMapping = ref({ externalTitle: '', externalSku: '', variationName: '' });
const isAddingMapping = ref(false);

const isEditMode = computed(() => !!props.listingToEditId);
const {
  stores,
  fetchStores,
  storesError,
  getStoresByCountry,
} = useStoreListings();

const countryOptions = computed<CountryOption[]>(() => {
  const uniqueCountriesMap = new Map<string, CountryOption>();
  stores.value.forEach((store) => {
    if (store.country) {
      uniqueCountriesMap.set(store.country.code, {
        ...store.country,
        displayLabel: `[${store.country.code}] ${store.country.name}`,
      });
    } else if (store.countryCode) {
      uniqueCountriesMap.set(store.countryCode, {
        code: store.countryCode,
        name: store.country?.name || store.countryCode,
        displayLabel: `[${store.countryCode}] ${store.country?.name || store.countryCode}`,
      });
    }
  });
  return Array.from(uniqueCountriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const filteredStores = computed(() => {
  if (!selectedCountryCode.value) return [];
  return getStoresByCountry(selectedCountryCode.value);
});

const currentCurrencyLabel = computed(() => {
  if (!selectedCountryCode.value) return '请选择国家';
  return currencyMap.value[selectedCountryCode.value] || '当地货币';
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const removeImage = () => {
  selectedFile.value = null;
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = null;
};

async function fetchCreateOptions() {
  isLoading.value = true;
  isLoadingMessage.value = '正在加载产品与店铺列表...';
  errorMessage.value = '';
  try {
    await fetchStores();
    const response = await apiClient.get('/admin/store-listings/options');
    applyOptionPayload(response.data);
    if (!selectedCountryCode.value && countryOptions.value.length > 0) {
      selectedCountryCode.value = countryOptions.value[0].code;
    }
    if (!formData.value.productId && allProducts.value.length > 0) {
      formData.value.productId = allProducts.value[0].id;
    }
  } catch (error) {
    console.error('加载选项失败:', error);
    errorMessage.value = '无法加载产品或店铺列表，请重试。';
  } finally {
    isLoading.value = false;
  }
}

async function fetchListingDetails() {
  if (!isEditMode.value) return;
  isLoading.value = true;
  isLoadingMessage.value = '正在加载商品详情...';
  errorMessage.value = '';
  try {
    await fetchStores();
    const [listingRes, optionsRes] = await Promise.all([
      apiClient.get(`/admin/store-listings/${props.listingToEditId}`),
      apiClient.get('/admin/store-listings/options'),
    ]);
    applyOptionPayload(optionsRes.data);

    const listing = listingRes.data;
    selectedCountryCode.value =
      listing.store?.countryCode || listing.store?.country?.code || selectedCountryCode.value || '';

    formData.value = {
      productId: listing.productId,
      storeId: listing.storeId,
      storeTitle: listing.storeTitle || '',
      productCode: listing.productCode || '',
      currentPrice: listing.currentPrice != null ? Number(listing.currentPrice) : null,
      platformUrl: listing.platformUrl || '',
      platformProductId: listing.platformProductId || '',
    };

    if (listing.storeImageUrl) {
      previewUrl.value = `${apiBaseUrl}${listing.storeImageUrl}`;
    }

    await fetchMappings();
  } catch (error) {
    console.error('加载详情失败:', error);
    errorMessage.value = '加载此商品详情失败，请关闭后重试。';
  } finally {
    isLoading.value = false;
  }
}

function applyOptionPayload(payload: OptionPayload = {}) {
  allProducts.value = (payload.products || []).map((p) => ({
    ...p,
    displayLabel: `${p.sku} · ${p.name}`,
  }));
  currencyMap.value = payload.currencyMap || {};
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (file) {
    selectedFile.value = file;
    if (previewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);
  }
}

const onDialogToggle = (visible: boolean) => {
  if (!visible) closeModal();
};

async function fetchMappings() {
  if (!isEditMode.value) return;
  try {
    const res = await apiClient.get(`/admin/store-listings/${props.listingToEditId}/mappings`);
    mappings.value = res.data;
  } catch (err) {
    console.error('获取映射失败', err);
  }
}

async function addMapping() {
  if (!newMapping.value.externalTitle && !newMapping.value.externalSku) return;
  isAddingMapping.value = true;
  try {
    await apiClient.post(`/admin/store-listings/${props.listingToEditId}/mappings`, newMapping.value);
    newMapping.value = { externalTitle: '', externalSku: '', variationName: '' };
    await fetchMappings();
    toast.add({ severity: 'success', summary: '成功', detail: '别名已添加', life: 3000 });
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: '添加失败',
      detail: err.response?.data?.error || '请重试',
      life: 3000,
    });
  } finally {
    isAddingMapping.value = false;
  }
}

function confirmDeleteMapping(id: string) {
  confirm.require({
    message: '确认删除该别名映射吗？',
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => deleteMapping(id),
  });
}

async function deleteMapping(id: string) {
  try {
    await apiClient.delete(`/admin/store-listings/mappings/${id}`);
    await fetchMappings();
    toast.add({ severity: 'success', summary: '已删除', life: 2000 });
  } catch (err) {
    toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
  }
}

async function handleSubmit() {
  errorMessage.value = '';
  isSubmitting.value = true;
  isLoadingMessage.value = isEditMode.value ? '正在保存修改...' : '正在上架商品...';

  const payload = new FormData();
  payload.append('storeTitle', formData.value.storeTitle || '');
  payload.append('productCode', formData.value.productCode || '');
  const price = formData.value.currentPrice == null ? '' : String(formData.value.currentPrice);
  payload.append('currentPrice', price);
  payload.append('platformUrl', formData.value.platformUrl || '');
  payload.append('platformProductId', formData.value.platformProductId || '');

  if (selectedFile.value) {
    payload.append('storeImageUrl', selectedFile.value);
  }

  try {
    if (isEditMode.value) {
      const response = await apiClient.put(`/admin/store-listings/${props.listingToEditId}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      emit('listing-updated', response.data);
    } else {
      payload.append('productId', formData.value.productId);
      payload.append('storeId', formData.value.storeId);
      const response = await apiClient.post('/admin/store-listings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      emit('listing-created', response.data);
    }
    closeModal();
    toast.add({ severity: 'success', summary: '成功', detail: isEditMode.value ? '已保存' : '已上架', life: 3000 });
  } catch (error: any) {
    console.error('操作失败:', error);
    if (error.response?.data?.details) {
      errorMessage.value = error.response.data.details.map((d: any) => d.message).join('; ');
    } else {
      errorMessage.value = error.response?.data?.error || '操作失败，请稍后重试。';
    }
  } finally {
    isSubmitting.value = false;
  }
}

watch(countryOptions, (options) => {
  if (!selectedCountryCode.value && options.length > 0) {
    selectedCountryCode.value = options[0].code;
  }
});

watch(() => storesError.value, (val) => {
  if (val) {
    errorMessage.value = val;
  }
});

watch(selectedCountryCode, () => {
  if (!filteredStores.value.some((store) => store.id === formData.value.storeId)) {
    formData.value.storeId = filteredStores.value[0]?.id || '';
  }
});

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      resetForm();
      if (isEditMode.value) {
        await fetchListingDetails();
      } else {
        await fetchCreateOptions();
      }
    } else {
      if (previewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
      }
    }
  }
);

function closeModal() {
  emit('close');
}

function resetForm() {
  formData.value = defaultFormData();
  selectedFile.value = null;
  previewUrl.value = null;
  errorMessage.value = '';
  isLoadingMessage.value = '';
  selectedCountryCode.value = '';
  mappings.value = [];
  newMapping.value = { externalTitle: '', externalSku: '', variationName: '' };
}
</script>

<style scoped>
/* Modal Layout */
.modal-wrapper {
  display: flex;
  flex-direction: column;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
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
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.125rem;
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

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.loading-state i {
  font-size: 1.5rem;
  color: var(--color-accent);
}

/* Form Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Section title optional hint */
.uni-section-title .optional {
  font-weight: 400;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

/* Image Upload */
.image-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.image-uploader {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-fast);
  background: var(--color-bg-page);
}

.image-uploader:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.image-uploader.has-image {
  border-style: solid;
  border-color: var(--color-border);
}

.image-uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-muted);
  text-align: center;
}

.upload-placeholder i {
  font-size: 1.5rem;
}

.upload-placeholder span {
  font-size: 0.75rem;
}

.upload-hint {
  font-size: 0.625rem !important;
  color: var(--color-text-muted) !important;
}

.hidden-input {
  display: none;
}

/* Mapping Styles */
.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mapping-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-page);
}

.mapping-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.m-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.m-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.mapping-empty {
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
}

.mapping-add-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-bg-page);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.mapping-add-row {
  display: flex;
  gap: 0.5rem;
}
</style>

<style>
/* Global Dialog Styles */
.listing-form-dialog .p-dialog-content {
  padding: 1.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}
</style>
