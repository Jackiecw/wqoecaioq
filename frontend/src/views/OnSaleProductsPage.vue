<template>
  <div class="page-shell on-sale-page">
    <PageHeader
      title="店铺在售"
      subtitle="集中管理全渠道在售商品、售价、链接与销量数据"
    >
      <template #actions>
        <button class="btn-subtle btn-primary" @click="openCreateModal">
          <i class="pi pi-plus"></i>
          上新商品
        </button>
      </template>
    </PageHeader>

    <ContentCard>
      <FilterBar>
        <template #start>
          <div class="surface-input search-input">
            <i class="pi pi-search"></i>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索商品名称 / SKU / 店铺"
            />
          </div>
          <div class="surface-input country-select">
            <span class="label">国家 / 区域</span>
            <select v-model="selectedCountry">
              <option value="ALL">全部</option>
              <option
                v-for="country in countryOptions"
                :key="country.code"
                :value="country.code"
              >
                {{ country.name }}
              </option>
            </select>
          </div>
        </template>
        <template #end>
          <div class="pill-tab-group">
            <button
              class="pill-tab"
              :class="{ 'is-active': sortMode === 'recent' }"
              @click="sortMode = 'recent'"
            >
              最新
            </button>
            <button
              class="pill-tab"
              :class="{ 'is-active': sortMode === 'priceDesc' }"
              @click="sortMode = 'priceDesc'"
            >
              价格高到低
            </button>
            <button
              class="pill-tab"
              :class="{ 'is-active': sortMode === 'priceAsc' }"
              @click="sortMode = 'priceAsc'"
            >
              价格低到高
            </button>
          </div>
        </template>
      </FilterBar>

      <div v-if="isLoading" class="state-text">正在加载在售列表...</div>
      <div v-else>
        <p v-if="errorMessage" class="state-text error">{{ errorMessage }}</p>

        <EmptyState
          v-if="filteredListings.length === 0 && listings.length === 0 && !errorMessage"
          icon="pi pi-inbox"
          title="暂无在售商品"
          description="点击右上角「上新商品」即可快速创建。"
        />
        <EmptyState
          v-else-if="filteredListings.length === 0"
          icon="pi pi-filter"
          title="无匹配结果"
          description="没有符合筛选条件的在售商品，尝试调整搜索或筛选条件。"
        />

        <div v-else class="listing-grid">
          <aside class="listing-panel">
            <div class="panel-header">在售清单 (筛选后)</div>
            <div class="listing-scroll">
              <button
                v-for="listing in filteredListings"
                :key="listing.id"
                class="listing-item"
                :class="{ active: selectedListingId === listing.id }"
                @click="selectListing(listing.id)"
              >
                <div class="listing-item__media">
                  <img
                    :src="getListingImageUrl(listing.storeImageUrl)"
                    alt="listing cover"
                  />
                </div>
                <div class="listing-item__info">
                  <p class="title line-clamp-2">
                    {{ listing.storeTitle || '未命名商品' }}
                  </p>
                  <p class="meta">代码：{{ listing.productCode || '未设置' }}</p>
                  <p class="meta subtle">
                    {{ listing.store?.country?.name }} · {{ listing.store?.name }}
                  </p>
                  <p class="price">
                    {{ formatLocalPrice(listing.currentPrice, getCurrencyCode(listing)) }}
                  </p>
                </div>
              </button>
            </div>
            <div class="panel-footer">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage <= 1"
              >
                ← 上一
              </button>
              <span>{{ currentPage }} / {{ totalPages }}</span>
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
              >
                下一 →
              </button>
            </div>
          </aside>

          <ContentCard v-if="selectedListing" :customClass="'detail-card'">
            <div class="detail">
              <div class="detail__media">
                <img
                  :src="getListingImageUrl(selectedListing.storeImageUrl)"
                  alt="listing main"
                />
              </div>
              <div class="detail__info">
                <div class="badge-row">
                  <span class="country-pill">
                    {{ selectedListing.store?.country?.code }}
                  </span>
                  <span class="muted">{{ selectedListing.store?.name }}</span>
                </div>
                <h3 class="detail__title">
                  {{ selectedListing.storeTitle || '未命名商品' }}
                </h3>
                <p class="muted">
                  对应产品：{{ selectedListing.product.publicName || selectedListing.product.name }}
                  (SKU: {{ selectedListing.product.sku }})
                </p>
                <p class="muted">
                  商品代码：
                  <span class="strong">
                    {{ selectedListing.productCode || '未设置' }}
                  </span>
                </p>
                <div>
                  <p class="label">售价</p>
                  <p class="price-lg">
                    {{ formatLocalPrice(selectedListing.currentPrice, getCurrencyCode(selectedListing)) }}
                    <span class="price-cny">≈¥ {{ formatCnyPrice(selectedListing).toFixed(2) }}</span>
                  </p>
                </div>
                <div class="stats-row">
                  <span>上销量：<strong class="strong">{{ selectedListing.lastWeekSales }}</strong></span>
                  <span>本月销量：<strong class="strong">{{ selectedListing.thisMonthSales }}</strong></span>
                  <span>总销量：<strong class="strong">{{ selectedListing.totalSales }}</strong></span>
                </div>
                <div class="action-row">
                  <button class="btn-subtle btn-primary" @click="openEditModal(selectedListing)">
                    编辑
                  </button>
                  <button
                    v-if="isAdmin"
                    class="btn-subtle danger"
                    @click="handleDelete(selectedListing)"
                  >
                    删除
                  </button>
                  <a
                    v-if="selectedListing.platformUrl"
                    :href="selectedListing.platformUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link"
                  >
                    查看商品链接
                  </a>
                  <span v-else class="muted">暂无商品链接</span>
                </div>
              </div>
            </div>
          </ContentCard>
          <EmptyState
            v-else
            icon="pi pi-list"
            title="请选择左侧商品"
            description="点击列表查看在售详情。"
          />
        </div>
      </div>
    </ContentCard>

    <StoreListingFormModal
      :is-open="isModalOpen"
      :listing-to-edit-id="listingToEditId"
      @close="closeModal"
      @listing-created="handleListingCreated"
      @listing-updated="handleListingUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import StoreListingFormModal from '../components/admin/StoreListingFormModal.vue';

type CurrencyCode = 'IDR' | 'VND' | 'THB' | 'MYR' | 'PHP' | 'SGD' | string;

interface CountryInfo {
  code?: string;
  name?: string;
}

interface StoreInfo {
  id?: string;
  name?: string;
  country?: CountryInfo;
  countryCode?: string;
}

interface Listing {
  id: string;
  storeTitle?: string;
  product?: { name?: string; publicName?: string; sku?: string };
  productCode?: string;
  store?: StoreInfo;
  platformUrl?: string;
  currentPrice?: number;
  currentPriceRmb?: number;
  lastWeekSales?: number;
  thisMonthSales?: number;
  totalSales?: number;
  storeImageUrl?: string;
  currencyCode?: CurrencyCode;
  createdAt?: string;
  updatedAt?: string;
}

const authStore = useAuthStore();

const listings = ref<Listing[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isModalOpen = ref(false);
const listingToEditId = ref<string | null>(null);
const selectedListingId = ref<string | null>(null);
const ratesData = ref<Record<string, number>>({});
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
const placeholderImage = 'https://via.placeholder.com/320x320?text=Listing';

const searchKeyword = ref('');
const selectedCountry = ref('ALL');
const sortMode = ref<'recent' | 'priceDesc' | 'priceAsc'>('recent');

const currentPage = ref(1);
const pageSize = ref(20);
const totalItems = ref(0);

const isAdmin = computed(() => authStore.role === 'admin');
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value) || 1);

const currencyFallbackMap: Record<string, CurrencyCode> = {
  ID: 'IDR',
  VN: 'VND',
  TH: 'THB',
  MY: 'MYR',
  PH: 'PHP',
  SG: 'SGD',
};

const countryOptions = computed(() => {
  const map = new Map<string, string>();
  listings.value.forEach((item) => {
    const code = item.store?.country?.code;
    const name = item.store?.country?.name;
    if (code && !map.has(code)) {
      map.set(code, name || code);
    }
  });
  return Array.from(map, ([code, name]) => ({ code, name }));
});

const filteredListings = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  let result = [...listings.value];

  if (keyword) {
    result = result.filter((item) => {
      const candidates = [
        item.storeTitle,
        item.product?.name,
        item.product?.publicName,
        item.product?.sku,
        item.store?.name,
      ]
        .filter(Boolean)
        .map((txt) => (txt as string).toLowerCase());
      return candidates.some((text) => text.includes(keyword));
    });
  }

  if (selectedCountry.value !== 'ALL') {
    result = result.filter((item) => item.store?.country?.code === selectedCountry.value);
  }

  if (sortMode.value === 'priceDesc') {
    result.sort((a, b) => Number(b.currentPrice || 0) - Number(a.currentPrice || 0));
  } else if (sortMode.value === 'priceAsc') {
    result.sort((a, b) => Number(a.currentPrice || 0) - Number(b.currentPrice || 0));
  } else {
    result.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime(),
    );
  }

  return result;
});

const selectedListing = computed(
  () => filteredListings.value.find((item) => item.id === selectedListingId.value) || null,
);

watch(filteredListings, (items) => {
  if (!items.length) {
    selectedListingId.value = null;
    return;
  }
  if (!selectedListingId.value || !items.some((item) => item.id === selectedListingId.value)) {
    selectedListingId.value = items[0].id;
  }
});

async function fetchListings(focusId: string | null = null) {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/admin/store-listings', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    });
    
    if (Array.isArray(response.data)) {
      listings.value = response.data as Listing[];
      totalItems.value = response.data.length;
    } else {
      listings.value = (response.data.data || []) as Listing[];
      totalItems.value = response.data.total || 0;
    }

    if (listings.value.length === 0) {
      selectedListingId.value = null;
    } else if (focusId && listings.value.some((item) => item.id === focusId)) {
      selectedListingId.value = focusId;
    } else if (!selectedListingId.value || !listings.value.some((item) => item.id === selectedListingId.value)) {
      selectedListingId.value = listings.value[0]?.id || null;
    }
  } catch (error: any) {
    console.error('获取店铺在售列表失败:', error);
    errorMessage.value = error.response?.data?.error || '获取店铺在售列表失败';
  } finally {
    isLoading.value = false;
  }
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchListings();
}

async function fetchRates() {
  try {
    const response = await apiClient.get('/rates');
    ratesData.value = response.data?.rates || {};
  } catch (error) {
    console.error('获取汇率失败:', error);
  }
}

onMounted(() => {
  fetchListings();
  fetchRates();
});

function openCreateModal() {
  listingToEditId.value = null;
  isModalOpen.value = true;
}

function openEditModal(listing: Listing) {
  listingToEditId.value = listing.id;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  listingToEditId.value = null;
}

function selectListing(id: string) {
  selectedListingId.value = id;
}

async function handleListingCreated(newListing: Listing) {
  currentPage.value = 1;
  await fetchListings(newListing.id);
  closeModal();
}

async function handleListingUpdated(updatedListing: Listing) {
  await fetchListings(updatedListing.id);
  closeModal();
}

async function handleDelete(listing: Listing) {
  if (!isAdmin.value) {
    errorMessage.value = '仅超级管理员可以删除上架商品';
    return;
  }
  if (!confirm(`确定要删除「${listing.storeTitle || listing.product.publicName || listing.product.name}」吗？`)) {
    return;
  }

  errorMessage.value = '';
  try {
    await apiClient.delete(`/admin/store-listings/${listing.id}`);
    await fetchListings();
  } catch (error: any) {
    console.error('删除失败:', error);
    errorMessage.value = error.response?.data?.error || '删除失败，请重试';
  }
}

function getListingImageUrl(imageUrl?: string) {
  if (!imageUrl) return placeholderImage;
  // If imageUrl starts with 'http', return as is.
  if (imageUrl.startsWith('http')) return imageUrl;
  // If imageUrl starts with '/', return as is (relative path, proxied by Vite).
  if (imageUrl.startsWith('/')) return imageUrl;
  // Fallback for other cases (though mostly covered above)
  return `${apiBaseUrl}${imageUrl}`;
}

function getCurrencyCode(listing?: Listing | null) {
  if (!listing) return null;
  return listing.currencyCode || currencyFallbackMap[listing.store?.country?.code || ''] || null;
}

function getRateForCurrency(currencyCode: CurrencyCode | null) {
  if (!currencyCode) return null;
  return ratesData.value[`CNY_${currencyCode}`] ?? ratesData.value[currencyCode] ?? null;
}

function formatLocalPrice(value?: number, currencyCode?: CurrencyCode | null) {
  const amount = Number(value) || 0;
  if (!currencyCode) {
    return amount.toFixed(2);
  }
  try {
    const noDecimal = currencyCode === 'IDR' || currencyCode === 'VND';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: noDecimal ? 0 : 2,
      maximumFractionDigits: noDecimal ? 0 : 2,
    }).format(amount);
  } catch (error) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function formatCnyPrice(listing?: Listing | null) {
  if (!listing) return 0;
  const direct = Number(listing.currentPriceRmb);
  if (!Number.isNaN(direct) && direct > 0) {
    return direct;
  }
  const currencyCode = getCurrencyCode(listing);
  const rate = getRateForCurrency(currencyCode);
  if (!rate) return 0;
  const amount = Number(listing.currentPrice) || 0;
  return amount / rate;
}
</script>

<style scoped>
.on-sale-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-bg-page);
}

.state-text {
  padding: var(--space-4);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.state-text.error {
  color: #dc2626;
}

.search-input,
.country-select {
  min-width: 220px;
}

.country-select select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.5rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.country-select .label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.listing-grid {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.listing-panel {
  width: 32%;
  min-width: 280px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
}

.panel-header {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding: 0 var(--space-1);
}

.listing-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.listing-item {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  width: 100%;
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-xs);
  text-align: left;
  transition: all var(--transition-fast);
}

.listing-item:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-sm);
}

.listing-item.active {
  border-color: var(--color-accent);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
}

.listing-item__media {
  flex-shrink: 0;
}

.listing-item__media img {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  object-fit: cover;
}

.listing-item__info .title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.listing-item__info .meta {
  margin: 0.15rem 0;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.listing-item__info .meta.subtle {
  color: var(--color-text-muted);
}

.listing-item__info .price {
  margin-top: 0.25rem;
  font-weight: 700;
  color: var(--color-accent);
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-2);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.panel-footer button {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color var(--transition-fast);
}

.panel-footer button:hover:not(:disabled) {
  color: var(--color-accent);
}

.panel-footer button:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.detail-card {
  flex: 1;
}

.detail {
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
  flex-wrap: wrap;
}

.detail__media img {
  width: 180px;
  height: 180px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  object-fit: cover;
}

.detail__info {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
}

.country-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.85rem;
}

.detail__title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.muted {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.strong {
  color: var(--color-text-primary);
}

.label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.price-lg {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.price-cny {
  margin-left: 0.5rem;
  font-size: 1rem;
  color: #059669;
  font-weight: 600;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.btn-subtle.danger {
  border-color: #fecdd3;
  color: #dc2626;
  background: #fff1f2;
}

.link {
  color: var(--color-accent);
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .listing-grid {
    flex-direction: column;
  }

  .listing-panel {
    width: 100%;
  }

  .detail {
    flex-direction: column;
  }
}
</style>
