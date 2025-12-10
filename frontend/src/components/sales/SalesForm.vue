<template>
  <div class="sales-form">
    <!-- Step 1: Select Product -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">1</span>
          <span class="step-label">选择商品</span>
        </div>
        <p class="section-hint">依次选择国家、平台、店铺，然后选择要录入销售数据的商品链接</p>
      </div>

      <div class="fields-grid fields-grid--4col">
        <!-- Country Selector - Now in form -->
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-globe"></i>
            国家 <span class="required">*</span>
          </label>
          <select v-model="localSelectedCountry" class="field-select">
            <option disabled value="">请选择国家...</option>
            <option v-for="country in availableCountries" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-desktop"></i>
            平台 <span class="required">*</span>
          </label>
          <select v-model="selectedPlatform" class="field-select" :disabled="!localSelectedCountry">
            <option disabled value="">请选择平台...</option>
            <option v-for="platform in platformOptions" :key="platform" :value="platform">
              {{ platform }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-shop"></i>
            店铺 <span class="required">*</span>
          </label>
          <select v-model="selectedStoreId" class="field-select" :disabled="!selectedPlatform">
            <option disabled value="">请选择店铺...</option>
            <option v-for="store in storeOptions" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>

        <div class="field-group field-group--full">
          <label class="field-label">
            <i class="pi pi-link"></i>
            商品链接 (Listing) <span class="required">*</span>
            <span class="field-hint">格式: [商品代码] 标题 (SKU)</span>
          </label>
          <select 
            v-model="selectedListingId" 
            class="field-select" 
            :disabled="!selectedStoreId || isLoadingListings"
          >
            <option disabled value="">
              {{ isLoadingListings ? '加载链接中...' : '请选择具体链接...' }}
            </option>
            <option v-for="listing in storeListings" :key="listing.id" :value="listing.id">
              <template v-if="listing.productCode">[{{ listing.productCode }}]</template>
              {{ listing.storeTitle || '未命名链接' }} ({{ listing.product.sku }})
            </option>
          </select>
          <p v-if="storeListings.length === 0 && selectedStoreId && !isLoadingListings" class="field-error">
            <i class="pi pi-exclamation-triangle"></i>
            该店铺下暂无上架商品，请先去「店铺在售」板块上架。
          </p>
        </div>
      </div>
    </div>

    <!-- Step 2: Order Details -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">2</span>
          <span class="step-label">订单信息</span>
        </div>
        <p class="section-hint">填写订单的基本信息</p>
      </div>

      <div class="fields-grid fields-grid--4col">
        <div class="field-group field-group--span2">
          <label class="field-label">
            <i class="pi pi-calendar"></i>
            下单时间 <span class="required">*</span>
          </label>
          <input 
            type="datetime-local" 
            v-model="formOtherData.recordDate" 
            class="field-input" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-hashtag"></i>
            平台订单号 <span class="required">*</span>
          </label>
          <input 
            type="text" 
            v-model="formOtherData.platformOrderId" 
            class="field-input" 
            placeholder="例: 230101ABC..." 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-box"></i>
            销量 <span class="required">*</span>
          </label>
          <input 
            type="number" 
            v-model="formOtherData.salesVolume" 
            class="field-input" 
            placeholder="0" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-dollar"></i>
            销售额 <span class="required">*</span>
          </label>
          <div class="input-with-suffix">
            <input 
              type="number" 
              step="0.01" 
              v-model="formOtherData.revenue" 
              class="field-input field-input--currency" 
              placeholder="0.00" 
              required 
            />
            <span class="input-suffix">{{ currencyDisplay }}</span>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-tag"></i>
            订单状态 <span class="required">*</span>
          </label>
          <select v-model="formOtherData.orderStatus" class="field-select" required>
            <option value="" disabled>请选择状态...</option>
            <option v-for="status in orderStatusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>

        <!-- Cancel Reason - Only show when status is CANCELLED or RETURNED -->
        <div v-if="showCancelReasonField" class="field-group field-group--span2">
          <label class="field-label">
            <i class="pi pi-exclamation-circle"></i>
            取消/退货原因
          </label>
          <div class="combobox-wrapper">
            <input 
              type="text" 
              v-model="formOtherData.cancelReason" 
              class="field-input combobox-input" 
              :placeholder="cancelReasonPlaceholder"
              list="cancel-reason-datalist"
            />
            <datalist id="cancel-reason-datalist">
              <option v-for="reason in cancelReasonOptions" :key="reason" :value="reason">
                {{ reason }}
              </option>
            </datalist>
          </div>
        </div>

        <!-- Notes - Adjust span based on cancel reason visibility -->
        <div :class="['field-group', showCancelReasonField ? 'field-group--full' : 'field-group--span3']">
          <label class="field-label">
            <i class="pi pi-pencil"></i>
            备注 (可选)
          </label>
          <textarea 
            v-model="formOtherData.notes" 
            class="field-textarea" 
            rows="2" 
            placeholder="添加备注信息..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Step 3: Settlement Info (Optional) -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">3</span>
          <span class="step-label">结算信息 (可选)</span>
        </div>
        <p class="section-hint">填写结算相关信息</p>
      </div>

      <div class="fields-grid fields-grid--2col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-calendar-plus"></i>
            结算时间
          </label>
          <input 
            type="date" 
            v-model="formOtherData.settlementDate" 
            class="field-input"
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-wallet"></i>
            结算金额
          </label>
          <div class="input-with-suffix">
            <input 
              type="number" 
              step="0.01" 
              v-model="formOtherData.settlementAmount" 
              class="field-input field-input--currency" 
              placeholder="0.00"
            />
            <span class="input-suffix">{{ currencyDisplay }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Section -->
    <div class="form-actions">
      <div class="form-messages">
        <p v-if="successMessage" class="message message--success">
          <i class="pi pi-check-circle"></i>
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="message message--error">
          <i class="pi pi-times-circle"></i>
          {{ errorMessage }}
        </p>
      </div>
      <button type="button" class="btn-submit" @click="handleSubmit">
        <i class="pi pi-check"></i>
        提交录入
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import useStoreListings from '../../composables/useStoreListings';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  selectedCountry: String
});

const authStore = useAuthStore();

const {
  stores,
  fetchStores,
  storesLoading,
  storesError,
  getStoresByCountry,
  getStoresByCountryAndPlatform,
  fetchListings,
} = useStoreListings();
const isLoadingStores = storesLoading;

// Local country state (can be synced with prop or independent)
const localSelectedCountry = ref('');
const selectedPlatform = ref('');
const selectedStoreId = ref('');
const selectedListingId = ref('');
const storeListings = ref<any[]>([]);
const isLoadingListings = ref(false);

const formOtherData = ref({
  recordDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM format for datetime-local
  salesVolume: null as number | null,
  revenue: null as number | null,
  currency: 'CNY',
  notes: '',
  platformOrderId: '',
  orderStatus: '',
  cancelReason: '',
  settlementDate: '',
  settlementAmount: null as number | null,
});

const successMessage = ref('');
const errorMessage = ref('');

// 订单状态选项（中文）
const orderStatusOptions = [
  { value: 'PENDING', label: '待付款' },
  { value: 'READY_TO_SHIP', label: '待发货' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'DELIVERED', label: '已送达' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'RETURNED', label: '已退货' },
];

// 虾皮取消原因选项
const shopeeCancelReasons = [
  '买家取消：其他/改变主意',
  '买家取消：修改现有订单',
  '买家取消：支付流程困难',
  '买家取消：需更改收货地址',
  '系统自动取消：卖家未及时安排发货',
  '系统自动取消：订单未付款',
  '买家取消：其他原因',
  '系统自动取消：配送失败',
  '买家取消：需修改订单',
  '买家取消：不想再购买',
];

// TikTok取消原因选项
const tiktokCancelReasons = [
  '其他渠道价格更优',
  '买家逾期未付款',
  '运费过高',
  '需更改颜色或尺寸',
  '需更改支付方式',
  '需更改收货地址',
  '不再需要',
  '缺货',
  '包裹配送失败',
  '支付方式不可用',
  '价格错误',
  '买家取消',
  '卖家取消',
  '系统取消',
];

// 货币映射
const currencyMap: Record<string, string> = {
  'ID': 'IDR',
  'TH': 'THB',
  'VN': 'VND',
  'MY': 'MYR',
  'PH': 'PHP',
  'SG': 'SGD',
  'TW': 'TWD',
  'BR': 'BRL',
  'US': 'USD',
  'UK': 'GBP',
  'CN': 'CNY',
};

// 显示取消原因字段的条件
const showCancelReasonField = computed(() => {
  return formOtherData.value.orderStatus === 'CANCELLED' || formOtherData.value.orderStatus === 'RETURNED';
});

// 根据当前平台选择取消原因选项
const cancelReasonOptions = computed(() => {
  if (selectedPlatform.value === 'SHOPEE') {
    return shopeeCancelReasons;
  } else if (selectedPlatform.value === 'TIKTOK_SHOP') {
    return tiktokCancelReasons;
  }
  return [...shopeeCancelReasons, ...tiktokCancelReasons];
});

const cancelReasonPlaceholder = computed(() => {
  if (selectedPlatform.value === 'SHOPEE') {
    return '选择或输入虾皮取消原因...';
  } else if (selectedPlatform.value === 'TIKTOK_SHOP') {
    return '选择或输入TikTok取消原因...';
  }
  return '选择或输入取消原因...';
});

// 货币显示
const currencyDisplay = computed(() => {
  return currencyMap[localSelectedCountry.value] || 'CNY';
});

// 可用国家列表
const availableCountries = computed(() => {
  const uniqueCountriesMap = new Map();
  stores.value.forEach((store: any) => {
    if (store.country) {
      uniqueCountriesMap.set(store.country.code, store.country);
    }
  });
  
  const allUniqueCountries = Array.from(uniqueCountriesMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));

  if (authStore.role === 'admin') {
    return allUniqueCountries;
  }
  
  const userCountryCodes = authStore.operatedCountries || [];
  return allUniqueCountries.filter((country: any) => 
    userCountryCodes.includes(country.code)
  );
});

onMounted(async () => {
  await fetchStores();
  // 如果只有一个国家，自动选中
  if (availableCountries.value.length === 1) {
    localSelectedCountry.value = availableCountries.value[0].code;
  }
  // 如果有外部传入的国家，使用它
  if (props.selectedCountry) {
    localSelectedCountry.value = props.selectedCountry;
  }
});

watch(() => storesError.value, (val) => {
  if (val) {
    errorMessage.value = val;
  }
});

// 同步外部传入的 selectedCountry
watch(() => props.selectedCountry, (newVal) => {
  if (newVal) {
    localSelectedCountry.value = newVal;
  }
});

const platformOptions = computed(() => {
  if (!localSelectedCountry.value) return [];
  const platforms = getStoresByCountry(localSelectedCountry.value).map((store: any) => store.platform);
  return [...new Set(platforms)].sort();
});

const storeOptions = computed(() => {
  if (!localSelectedCountry.value || !selectedPlatform.value) return [];
  return getStoresByCountryAndPlatform(localSelectedCountry.value, selectedPlatform.value).sort((a: any, b: any) =>
    a.name.localeCompare(b.name)
  );
});

watch(localSelectedCountry, (newVal) => {
  selectedPlatform.value = '';
  selectedStoreId.value = '';
  selectedListingId.value = '';
  storeListings.value = [];
  
  if (newVal && currencyMap[newVal]) {
    formOtherData.value.currency = currencyMap[newVal];
  } else {
    formOtherData.value.currency = 'USD';
  }
});

watch(selectedPlatform, () => {
  selectedStoreId.value = '';
  selectedListingId.value = '';
  storeListings.value = [];
  // 清空取消原因，因为平台切换了
  formOtherData.value.cancelReason = '';
});

watch(selectedStoreId, async (newStoreId) => {
  selectedListingId.value = '';
  storeListings.value = [];
  errorMessage.value = '';

  if (!newStoreId) return;

  isLoadingListings.value = true;
  try {
    storeListings.value = await fetchListings(newStoreId);
  } catch (error: any) {
    console.error('获取链接失败:', error);
    errorMessage.value = error.message || '获取链接失败，请稍后重试';
  } finally {
    isLoadingListings.value = false;
  }
});

// 当订单状态不是取消或退货时，清空取消原因
watch(() => formOtherData.value.orderStatus, (newStatus) => {
  if (newStatus !== 'CANCELLED' && newStatus !== 'RETURNED') {
    formOtherData.value.cancelReason = '';
  }
});

const handleSubmit = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!selectedStoreId.value || !selectedListingId.value) {
    errorMessage.value = '请选择店铺和商品链接';
    return;
  }

  const targetListing = storeListings.value.find((l: any) => l.id === selectedListingId.value);
  if (!targetListing) {
    errorMessage.value = '未找到目标商品';
    return;
  }

  const payload = {
    ...formOtherData.value,
    storeId: selectedStoreId.value,
    listingId: selectedListingId.value,
    productId: targetListing.product.id,
    salesVolume: parseInt(String(formOtherData.value.salesVolume), 10) || 0,
    revenue: parseFloat(String(formOtherData.value.revenue)) || 0,
    currency: formOtherData.value.currency || 'CNY',
    notes: formOtherData.value.notes || null,
    platformOrderId: formOtherData.value.platformOrderId || null,
    orderStatus: formOtherData.value.orderStatus || null,
    cancelReason: formOtherData.value.cancelReason || null,
    settlementDate: formOtherData.value.settlementDate || null,
    settlementAmount: formOtherData.value.settlementAmount ? parseFloat(String(formOtherData.value.settlementAmount)) : null,
  };

  if (!payload.platformOrderId || !payload.orderStatus) {
      errorMessage.value = '请填写平台订单号和订单状态';
      return;
  }

  try {
    const response = await apiClient.post('/sales', payload);
    successMessage.value = `录入成功！ID: ${response.data.id}`;

    // Reset form partially
    formOtherData.value.salesVolume = null;
    formOtherData.value.revenue = null;
    formOtherData.value.cancelReason = '';
    formOtherData.value.settlementDate = '';
    formOtherData.value.settlementAmount = null;
  } catch (error: any) {
    console.error('录入失败:', error.response);
    if (error.response && error.response.data.error) {
      errorMessage.value = error.response.data.error;
    } else {
      errorMessage.value = '录入失败，请检查网络或联系管理员';
    }
  }
};
</script>

<style scoped>
/* ========================================
   Sales Form - Clean Modern Design
   ======================================== */
.sales-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.step-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  padding-left: 2.5rem;
}

/* Fields Grid */
.fields-grid {
  display: grid;
  gap: 1rem;
}

.fields-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.fields-grid--3col {
  grid-template-columns: repeat(3, 1fr);
}

.fields-grid--4col {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1024px) {
  .fields-grid--3col,
  .fields-grid--4col {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .fields-grid--2col,
  .fields-grid--3col,
  .fields-grid--4col {
    grid-template-columns: 1fr;
  }
}

/* Field Group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group--full {
  grid-column: 1 / -1;
}

.field-group--span2 {
  grid-column: span 2;
}

.field-group--span3 {
  grid-column: span 3;
}

@media (max-width: 640px) {
  .field-group--span2,
  .field-group--span3 {
    grid-column: span 1;
  }
}

.field-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-label i {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.field-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.required {
  color: #ef4444;
}

/* Inputs */
.field-input,
.field-select,
.field-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.field-input:disabled,
.field-select:disabled,
.field-textarea:disabled {
  background: var(--color-bg-page);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: var(--color-text-muted);
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

/* Combobox */
.combobox-wrapper {
  position: relative;
}

.combobox-input {
  width: 100%;
}

/* Input with suffix */
.input-with-suffix {
  position: relative;
}

.field-input--currency {
  padding-right: 3.5rem;
  text-align: right;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 1rem;
  font-weight: 600;
}

.input-suffix {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Field Error */
.field-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #ef4444;
  margin: 0;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.form-messages {
  flex: 1;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  margin: 0;
}

.message--success {
  color: #10b981;
}

.message--error {
  color: #ef4444;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-submit:hover {
  filter: brightness(0.95);
}

.btn-submit:active {
  transform: scale(0.98);
}
</style>
