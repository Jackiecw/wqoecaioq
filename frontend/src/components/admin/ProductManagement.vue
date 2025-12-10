<template>
  <div class="page-shell product-page">
    <PageHeader
      title="产品目录"
      subtitle="管理所有标准产品资料，建立 SKU 与基本属性库"
    >
      <template #actions>
        <button class="btn-subtle btn-primary" @click="openModal">
          <i class="pi pi-plus"></i>
          新建产品
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
              placeholder="搜索产品名称 / SKU"
            />
          </div>
          <div class="surface-input category-select">
            <span class="label">分类</span>
            <select v-model="selectedCategory">
              <option value="ALL">全部</option>
              <option
                v-for="cat in categoryOptions"
                :key="cat"
                :value="cat"
              >
                {{ cat }}
              </option>
            </select>
          </div>
        </template>
        <template #end>
          <button class="btn-subtle" @click="resetFilters">
            <i class="pi pi-refresh"></i>
            重置
          </button>
        </template>
      </FilterBar>

      <div v-if="isLoading" class="state-text">正在加载产品列表...</div>
      <div v-else>
        <p v-if="errorMessage" class="state-text error">{{ errorMessage }}</p>

        <EmptyState
          v-if="filteredProducts.length === 0 && products.length === 0 && !errorMessage"
          icon="pi pi-box"
          title="暂无产品"
          description="点击右上角「新建产品」即可快速创建。"
        />
        <EmptyState
          v-else-if="filteredProducts.length === 0"
          icon="pi pi-filter"
          title="无匹配结果"
          description="没有符合筛选条件的产品，尝试调整搜索或筛选条件。"
        />

        <div v-else class="listing-grid">
          <aside class="listing-panel">
            <div class="panel-header">产品列表 ({{ filteredProducts.length }})</div>
            <div class="listing-scroll">
              <button
                v-for="product in paginatedProducts"
                :key="product.id"
                class="listing-item"
                :class="{ active: selectedProduct?.id === product.id }"
                @click="selectProduct(product)"
              >
                <div class="listing-item__media">
                  <img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    alt="product cover"
                  />
                  <i v-else class="pi pi-image"></i>
                </div>
                <div class="listing-item__info">
                  <p class="title line-clamp-2">{{ product.name }}</p>
                  <p class="meta">SKU: {{ product.sku }}</p>
                  <p class="meta subtle">{{ product.category || '未分类' }}</p>
                  <p class="price" v-if="product.cost !== null && product.cost !== undefined">
                    成本 ¥{{ formatNumber(product.cost) }}
                  </p>
                </div>
              </button>
            </div>
            <div class="panel-footer">
              <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1">
                ← 上一页
              </button>
              <span>{{ currentPage }} / {{ totalPages }}</span>
              <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages">
                下一页 →
              </button>
            </div>
          </aside>

          <ContentCard v-if="selectedProduct" :customClass="'detail-card'">
            <!-- 右上角操作按钮 -->
            <div class="detail-actions">
              <button class="action-btn action-btn--edit" @click="handleEdit(selectedProduct)">
                <i class="pi pi-pencil"></i>
                编辑
              </button>
              <button class="action-btn action-btn--delete" @click="handleDelete(selectedProduct)">
                <i class="pi pi-trash"></i>
                删除
              </button>
            </div>

            <div class="detail">
              <div class="detail__media">
                <img
                  v-if="selectedProduct.imageUrl"
                  :src="selectedProduct.imageUrl"
                  alt="product main"
                />
                <div v-else class="detail__placeholder">
                  <i class="pi pi-image"></i>
                  <span>暂无图片</span>
                </div>
              </div>
              <div class="detail__info">
                <div class="badge-row">
                  <span v-if="selectedProduct.category" class="category-pill">
                    {{ selectedProduct.category }}
                  </span>
                  <span class="sku-badge">{{ selectedProduct.sku }}</span>
                </div>
                <h3 class="detail__title">{{ selectedProduct.name }}</h3>
                <p v-if="selectedProduct.publicName" class="muted">
                  外部名称：{{ selectedProduct.publicName }}
                </p>
                <div>
                  <p class="label">成本价</p>
                  <p class="price-lg">
                    {{ selectedProduct.cost !== null && selectedProduct.cost !== undefined ? `¥${formatNumber(selectedProduct.cost)}` : '--' }}
                  </p>
                </div>
                <div class="specs-quick">
                  <div class="spec-item" v-if="selectedProduct.weightKg">
                    <span class="spec-label">重量</span>
                    <span class="spec-value">{{ selectedProduct.weightKg }} kg</span>
                  </div>
                  <div class="spec-item" v-if="formatDimensions(selectedProduct)">
                    <span class="spec-label">尺寸</span>
                    <span class="spec-value">{{ formatDimensions(selectedProduct) }} mm</span>
                  </div>
                  <div class="spec-item" v-if="selectedProduct.resolution">
                    <span class="spec-label">分辨率</span>
                    <span class="spec-value">{{ selectedProduct.resolution }}</span>
                  </div>
                  <div class="spec-item" v-if="selectedProduct.brightnessAnsi">
                    <span class="spec-label">亮度</span>
                    <span class="spec-value">{{ selectedProduct.brightnessAnsi }} ANSI</span>
                  </div>
                </div>
                <div class="tags-row">
                  <span v-if="selectedProduct.wifiVersion" class="tag-item">
                    {{ selectedProduct.wifiVersion }}
                  </span>
                  <span v-if="selectedProduct.bluetoothVersion" class="tag-item">
                    {{ selectedProduct.bluetoothVersion }}
                  </span>
                  <span v-if="selectedProduct.os" class="tag-item">
                    {{ selectedProduct.os }}
                  </span>
                  <span v-if="selectedProduct.hasGimbal" class="tag-item tag-item--active">
                    <i class="pi pi-check"></i> 云台
                  </span>
                  <span v-if="selectedProduct.autoObstacle" class="tag-item tag-item--active">
                    <i class="pi pi-check"></i> 避障
                  </span>
                  <span v-if="selectedProduct.autoScreenFit" class="tag-item tag-item--active">
                    <i class="pi pi-check"></i> 入幕
                  </span>
                </div>
              </div>
            </div>

            <!-- Additional Specs Accordion -->
            <div class="specs-section" v-if="selectedProduct">
              <div class="specs-section__header" @click="toggleSpecs">
                <span>查看完整规格参数</span>
                <i :class="showFullSpecs ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </div>
              <div v-if="showFullSpecs" class="specs-section__content">
                <div class="specs-grid">
                  <div class="spec-card">
                    <div class="spec-card__title">
                      <i class="pi pi-desktop"></i>
                      显示与光学
                    </div>
                    <div class="spec-card__body">
                      <div class="spec-row">
                        <span>分辨率</span>
                        <span>{{ selectedProduct.resolution || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>亮度 (ANSI)</span>
                        <span>{{ selectedProduct.brightnessAnsi || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>均匀度</span>
                        <span>{{ selectedProduct.brightnessUniformity ? `${selectedProduct.brightnessUniformity}%` : '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>对比度</span>
                        <span>{{ selectedProduct.contrastRatio || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>投射比</span>
                        <span>{{ selectedProduct.throwRatio || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>投影尺寸</span>
                        <span>{{ selectedProduct.projectionSize || '--' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="spec-card">
                    <div class="spec-card__title">
                      <i class="pi pi-microchip"></i>
                      硬件配置
                    </div>
                    <div class="spec-card__body">
                      <div class="spec-row">
                        <span>芯片方案</span>
                        <span>{{ selectedProduct.chipset || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>内存/存储</span>
                        <span>{{ selectedProduct.ramRom || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>操作系统</span>
                        <span>{{ selectedProduct.os || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>对焦方式</span>
                        <span>{{ selectedProduct.focusMethod || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>梯形校正</span>
                        <span>{{ selectedProduct.keystone || '--' }}</span>
                      </div>
                      <div class="spec-row">
                        <span>运行噪声</span>
                        <span>{{ selectedProduct.noiseDb ? `${selectedProduct.noiseDb} dB` : '--' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="note-section" v-if="selectedProduct.description">
                  <div class="note-title">备注说明</div>
                  <div class="note-content">{{ selectedProduct.description }}</div>
                </div>
              </div>
            </div>
          </ContentCard>
          <EmptyState
            v-else
            icon="pi pi-box"
            title="请选择产品"
            description="点击列表查看产品详情。"
          />
        </div>
      </div>
    </ContentCard>

    <ProductFormModal
      :is-open="isModalOpen"
      :product-id="currentProductToEditId"
      :category-options="categoryOptions"
      @close="closeModal"
      @product-created="handleProductCreated"
      @product-updated="handleProductUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import apiClient from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ProductFormModal from './ProductFormModal.vue';

type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  cost?: number | null;
  weightKg?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  publicName?: string | null;
  resolution?: string | null;
  brightnessAnsi?: number | null;
  brightnessUniformity?: number | null;
  lightSourceBrightness?: number | null;
  noiseDb?: number | null;
  contrastRatio?: string | null;
  throwRatio?: string | null;
  projectionSize?: string | null;
  projectionDistance?: string | null;
  chipset?: string | null;
  ramRom?: string | null;
  os?: string | null;
  focusMethod?: string | null;
  keystone?: string | null;
  hasGimbal: boolean;
  wifiVersion?: string | null;
  bluetoothVersion?: string | null;
  autoObstacle: boolean;
  autoScreenFit: boolean;
};

const products = ref<Product[]>([]);
const categoryOptions = ref<string[]>([]);
const selectedProduct = ref<Product | null>(null);
const currentProductToEditId = ref<string | null>(null);
const isModalOpen = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const searchKeyword = ref('');
const selectedCategory = ref<string>('ALL');
const showFullSpecs = ref(false);

const currentPage = ref(1);
const pageSize = ref(15);

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / pageSize.value) || 1);

const filteredProducts = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return products.value.filter((product) => {
    const matchKeyword =
      !keyword ||
      product.name?.toLowerCase().includes(keyword) ||
      product.sku?.toLowerCase().includes(keyword) ||
      product.publicName?.toLowerCase().includes(keyword);
    const matchCategory =
      selectedCategory.value === 'ALL' ||
      product.category === selectedCategory.value;
    return matchKeyword && matchCategory;
  });
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredProducts.value.slice(start, start + pageSize.value);
});

const fetchProducts = async (focusId: string | null = null) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/admin/products');
    products.value = response.data || [];
    categoryOptions.value = Array.from(
      new Set(products.value.map((p) => p.category).filter(Boolean)),
    ) as string[];

    if (!products.value.length) {
      selectedProduct.value = null;
    } else if (focusId && products.value.some((item) => item.id === focusId)) {
      selectedProduct.value = products.value.find((item) => item.id === focusId) || null;
    } else if (!selectedProduct.value || !products.value.some((item) => item.id === selectedProduct.value?.id)) {
      selectedProduct.value = products.value[0];
    }
  } catch (error: any) {
    console.error('获取产品列表失败', error);
    errorMessage.value = error.response?.data?.error || '获取产品列表失败';
  } finally {
    isLoading.value = false;
  }
};

const openModal = () => {
  currentProductToEditId.value = null;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  currentProductToEditId.value = null;
};

const selectProduct = (product: Product) => {
  selectedProduct.value = product;
  showFullSpecs.value = false;
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const resetFilters = () => {
  searchKeyword.value = '';
  selectedCategory.value = 'ALL';
  currentPage.value = 1;
};

const toggleSpecs = () => {
  showFullSpecs.value = !showFullSpecs.value;
};

const handleProductCreated = (newProduct: Product | undefined) => {
  fetchProducts(newProduct?.id || null);
};

const handleEdit = (product: Product) => {
  currentProductToEditId.value = product.id;
  isModalOpen.value = true;
};

const handleProductUpdated = (updatedProduct: Product | undefined) => {
  fetchProducts(updatedProduct?.id || selectedProduct.value?.id || null);
};

const handleDelete = async (product: Product) => {
  if (!confirm(`确认要删除产品「${product.name}」吗？此操作无法撤销。`)) return;
  try {
    await apiClient.delete(`/admin/products/${product.id}`);
    fetchProducts();
  } catch (error: any) {
    alert('删除失败');
  }
};

const formatNumber = (value?: number | null) => value || value === 0 ? value : null;

const formatDimensions = (product?: Product | null) => {
  if (!product) return null;
  if (product.lengthMm && product.widthMm && product.heightMm) {
    return `${product.lengthMm} x ${product.widthMm} x ${product.heightMm}`;
  }
  return null;
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.product-page {
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
.category-select {
  min-width: 200px;
}

.category-select select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.5rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.category-select .label {
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
  max-height: calc(100vh - 380px);
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
  cursor: pointer;
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
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--color-text-muted);
}

.listing-item__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.listing-item__info {
  flex: 1;
  min-width: 0;
}

.listing-item__info .title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.listing-item__info .meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.listing-item__info .meta.subtle {
  color: var(--color-text-muted);
}

.listing-item__info .price {
  margin-top: 0.25rem;
  font-weight: 700;
  font-size: 0.875rem;
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
  position: relative;
}

.detail-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-page);
  border-color: var(--color-text-muted);
  color: var(--color-text-primary);
}

.action-btn--edit:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.action-btn--delete:hover {
  border-color: #fecaca;
  color: #dc2626;
  background: #fef2f2;
}

.action-btn i {
  font-size: 0.875rem;
}

.detail {
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
  flex-wrap: wrap;
}

.detail__media {
  width: 180px;
  height: 180px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.detail__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.detail__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.detail__placeholder i {
  font-size: 2rem;
}

.detail__info {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.8rem;
}

.sku-badge {
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-family: 'SF Mono', monospace;
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
  font-size: 0.9375rem;
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

.specs-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.spec-item {
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.spec-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.spec-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-pill);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.tag-item--active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0.5rem;
}

.btn-subtle.danger {
  border-color: #fecdd3;
  color: #dc2626;
  background: #fff1f2;
}

/* Specs Section */
.specs-section {
  margin-top: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.specs-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: var(--color-bg-page);
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  transition: background var(--transition-fast);
}

.specs-section__header:hover {
  background: #f1f5f9;
}

.specs-section__content {
  padding: 1rem;
  background: var(--color-bg-card);
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.spec-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.spec-card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-page);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.spec-card__title i {
  color: var(--color-accent);
}

.spec-card__body {
  padding: 0.75rem 1rem;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row span:first-child {
  color: var(--color-text-secondary);
}

.spec-row span:last-child {
  color: var(--color-text-primary);
  font-weight: 500;
}

.note-section {
  margin-top: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.note-title {
  padding: 0.75rem 1rem;
  background: var(--color-bg-page);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.note-content {
  padding: 1rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
}

@media (max-width: 1024px) {
  .listing-grid {
    flex-direction: column;
  }

  .listing-panel {
    width: 100%;
  }

  .listing-scroll {
    max-height: 300px;
  }

  .detail {
    flex-direction: column;
  }

  .specs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
