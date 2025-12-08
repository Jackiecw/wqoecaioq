<template>
  <div class="page-shell product-page">
    <PageHeader
      title="产品目录"
      subtitle="管理所有标准产品资料，建立SKU与基本属性库"
    >
      <template #actions>
        <button class="btn-subtle btn-primary" @click="openModal">
          <i class="pi pi-plus"></i>
          新建产品
        </button>
      </template>
    </PageHeader>

    <ContentCard class="main-card">
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
      </FilterBar>

      <div class="split-view-container">
        <!-- Left Sidebar: Product List -->
        <aside class="listing-panel">
          <div class="panel-header">产品列表 ({{ filteredProducts.length }})</div>
          <div class="listing-scroll custom-scrollbar">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="listing-item"
              :class="{ active: selectedProduct?.id === product.id }"
              @click="onSelectProduct(product)"
            >
              <div class="listing-item__media">
                 <img v-if="product.imageUrl" :src="product.imageUrl" alt="product cover" />
                 <div v-else class="placeholder-icon"><i class="pi pi-image"></i></div>
              </div>
              <div class="listing-item__info">
                 <p class="title line-clamp-1">{{ product.name }}</p>
                 <div class="flex items-center gap-2 mt-1">
                    <span class="meta font-mono bg-gray-100 px-1.5 rounded text-gray-600 text-xs">{{ product.sku }}</span>
                    <span v-if="product.category" class="text-xs text-blue-600 bg-blue-50 px-1.5 rounded font-medium">{{ product.category }}</span>
                 </div>
                 <p class="meta subtle mt-1" v-if="product.cost">¥{{ formatNumber(product.cost) }}</p>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right Content: Detail View -->
        <main class="detail-panel custom-scrollbar" v-if="selectedProduct">
          <div class="detail-container">
             
             <!-- Hero Card -->
             <div class="content-card hero-card">
                <div class="hero-layout">
                    <div class="hero-image">
                         <img v-if="selectedProduct.imageUrl" :src="selectedProduct.imageUrl" alt="product main" />
                         <div v-else class="hero-placeholder"><i class="pi pi-image text-4xl text-gray-300"></i></div>
                    </div>
                    <div class="hero-info">
                        <div class="flex items-center justify-between mb-1">
                             <span v-if="selectedProduct.category" class="notion-tag blue">{{ selectedProduct.category }}</span> 
                             <div class="action-buttons">
                                <button class="btn-sm" @click="handleEdit(selectedProduct)">编辑参数</button>
                                <button class="btn-sm text-red-500 hover:bg-red-50" @click="handleDelete(selectedProduct)">删除</button>
                             </div>
                        </div>
                        
                        <h1 class="product-title">{{ selectedProduct.name }}</h1>
                        <div class="text-sm text-gray-500 mb-6 flex items-center gap-2">
                            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">Public Model</span>
                            <span>{{ selectedProduct.publicName || '—' }}</span>
                        </div>
                        
                        <!-- Core Metrics -->
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <div class="label">内部编号 (SKU)</div>
                                <div class="value font-mono">{{ selectedProduct.sku }}</div>
                            </div>
                            <div class="metric-item">
                                <div class="label">成本 (¥)</div>
                                <div class="value font-mono text-gray-900">{{ formatNumber(selectedProduct.cost) || '—' }}</div>
                            </div>
                            <div class="metric-item">
                                <div class="label">重量 (kg)</div>
                                <div class="value font-mono">{{ formatNumber(selectedProduct.weightKg) || '—' }}</div>
                            </div>
                            <div class="metric-item">
                                <div class="label">尺寸 (mm)</div>
                                <div class="value font-mono">{{ formatDimensions(selectedProduct) || '—' }}</div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <!-- 2-Column Grid for All Specs -->
             <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                 <!-- Specs Card 1: Display & Optics -->
                 <div class="content-card h-full flex flex-col min-h-[24rem]">
                      <h3 class="card-title">显示与光学</h3>
                      <div class="specs-grid">
                            <SpecItem label="分辨率" :value="selectedProduct.resolution" />
                            <SpecItem label="亮度 (ANSI)" :value="formatNumber(selectedProduct.brightnessAnsi)" />
                            <SpecItem label="均匀度 (%)" :value="formatNumber(selectedProduct.brightnessUniformity)" />
                            <SpecItem label="光源亮度 (LM)" :value="formatNumber(selectedProduct.lightSourceBrightness)" />
                            <SpecItem label="对比度" :value="selectedProduct.contrastRatio" />
                            <SpecItem label="投射比" :value="selectedProduct.throwRatio" />
                            <SpecItem label="投影尺寸" :value="selectedProduct.projectionSize" />
                            <SpecItem label="投影距离" :value="selectedProduct.projectionDistance" />
                      </div>
                 </div>

                 <!-- Specs Card 2: Hardware -->
                 <div class="content-card h-full flex flex-col min-h-[24rem]">
                      <h3 class="card-title">硬件配置</h3>
                      <div class="specs-grid">
                             <SpecItem label="芯片" :value="selectedProduct.chipset" />
                             <SpecItem label="内存/存储" :value="selectedProduct.ramRom" />
                             <SpecItem label="操作系统" :value="selectedProduct.os" />
                             <SpecItem label="对焦方式" :value="selectedProduct.focusMethod" />
                             <SpecItem label="梯形校正" :value="selectedProduct.keystone" />
                             <SpecItem label="WiFi 版本" :value="selectedProduct.wifiVersion" />
                             <SpecItem label="蓝牙版本" :value="selectedProduct.bluetoothVersion" />
                             <SpecItem label="运行噪声" :value="formatNumber(selectedProduct.noiseDb)" suffix="dB" />
                      </div>
                 </div>

                 <!-- Specs Card 3: Features -->
                 <div class="content-card h-full flex flex-col min-h-[24rem]">
                      <h3 class="card-title">功能特性</h3>
                      <div class="features-grid">
                          <FeatureItem label="云台" :isActive="selectedProduct.hasGimbal" />
                          <FeatureItem label="自动避障" :isActive="selectedProduct.autoObstacle" />
                          <FeatureItem label="自动入幕" :isActive="selectedProduct.autoScreenFit" />
                      </div>
                 </div>

                 <!-- Notes Card -->
                 <div class="content-card h-full flex flex-col min-h-[24rem]">
                      <h3 class="card-title">备注说明</h3>
                      <div class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 flex-1">
                          {{ selectedProduct.description || '无备注信息' }}
                      </div>
                 </div>
             </div>

          </div>
        </main>
        
        <EmptyState
          v-else
          icon="pi pi-box"
          title="No Product Selected"
          description="Select a product from the list to view details."
          class="flex-1 bg-gray-50 m-4 rounded-lg border border-dashed border-gray-300"
        />
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
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import apiClient from '@/services/apiClient';
import PageHeader from '@/components/common/PageHeader.vue';
import ContentCard from '@/components/common/ContentCard.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ProductFormModal from './ProductFormModal.vue';

// Define the full Product interface based on Prisma schema
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
const searchKeyword = ref('');
const selectedCategory = ref('ALL');
const errorMessage = ref('');

// Helper Component for Specs Grid Item
const SpecItem = defineComponent({
  props: { label: String, value: [String, Number], suffix: String },
  setup(props) {
      return () => h('div', { class: 'flex flex-col gap-0.5' }, [
          h('span', { class: 'text-[11px] uppercase tracking-wider text-gray-500 font-medium' }, props.label),
          h('span', { class: 'text-[13px] text-gray-900 font-medium border-b border-transparent hover:border-gray-200 inline-block truncate' }, props.value ? `${props.value}${props.suffix || ''}`: '—')
      ])
  }
})

// Helper for Feature Item (Minimalist Notion Style)
const FeatureItem = defineComponent({
    props: { label: String, isActive: Boolean },
    setup(props) {
        return () => h('div', { 
            class: [
                'flex items-center gap-2.5 py-1.5 px-2 rounded transition-colors',
                props.isActive 
                    ? 'text-gray-900' 
                    : 'text-gray-400 opacity-60'
            ] 
        }, [
            h('div', {
                class: [
                    'w-5 h-5 flex items-center justify-center rounded text-[10px]',
                    props.isActive ? 'bg-black text-white' : 'bg-gray-200'
                ]
            }, h('i', { class: props.isActive ? 'pi pi-check' : 'pi pi-minus', style: 'font-size: 0.6rem' })),
            
            h('span', { 
                class: 'text-sm font-medium leading-none mt-0.5' 
            }, props.label)
        ])
    }
})

const filteredProducts = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return products.value.filter((product) => {
    const matchKeyword =
      !keyword ||
      product.name?.toLowerCase().includes(keyword) ||
      product.sku?.toLowerCase().includes(keyword) ||
      product.publicName?.toLowerCase().includes(keyword);
    const matchCategory = selectedCategory.value === 'ALL' || product.category === selectedCategory.value;
    return matchKeyword && matchCategory;
  });
});

const fetchProducts = async (focusId: string | null = null) => {
  isModalOpen.value = false;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/admin/products');
    products.value = response.data || [];
    categoryOptions.value = Array.from(new Set(products.value.map((p) => p.category).filter(Boolean))) as string[];

    if (!products.value.length) {
      selectedProduct.value = null;
    } else if (focusId && products.value.some((item) => item.id === focusId)) {
      selectedProduct.value = products.value.find((item) => item.id === focusId) || null;
    } else if (!selectedProduct.value || !products.value.some((item) => item.id === selectedProduct.value?.id)) {
      selectedProduct.value = products.value[0];
    }
  } catch (error) {
    console.error('获取产品列表失败', error);
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

const onSelectProduct = (product: Product) => {
  selectedProduct.value = product;
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
  if (!confirm(`Delete ${product.name}?`)) return;
  try {
    await apiClient.delete(`/admin/products/${product.id}`);
    fetchProducts();
    selectedProduct.value = products.value[0] || null;
  } catch (error: any) {
    alert('Delete failed');
  }
};

const formatNumber = (value?: number | null) => (value || value === 0 ? value : null);

const formatDimensions = (product?: Product | null) => {
  if (!product) return null;
  if (product.lengthMm && product.widthMm && product.heightMm) {
    return `${product.lengthMm} × ${product.widthMm} × ${product.heightMm}`;
  }
  return null;
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-bg-page);
  padding: var(--space-4);
  height: 100vh;
  box-sizing: border-box;
}

.main-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

.search-input,
.category-select {
  min-width: 200px;
}
.surface-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}
.surface-input input, .surface-input select {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  width: 100%;
}

/* Split View Container */
.split-view-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    background: #f9fafb; /* Light gray background for contrast */
}

/* Left Sidebar */
.listing-panel {
    width: 320px;
    background: white;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}
.panel-header {
    padding: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #f3f4f6;
}
.listing-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.listing-item {
    display: flex;
    gap: 12px;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
}
.listing-item:hover {
    background: #f9fafb;
    border-color: #f3f4f6;
}
.listing-item.active {
    background: white;
    box-shadow: 0 0 0 2px #3b82f6; /* Focus ring style */
    border-color: transparent;
}
.listing-item__media img {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    object-fit: contain;
    background: white;
}
.listing-item__info {
    flex: 1;
    overflow: hidden;
}
.listing-item__info .title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1f2937;
}
.listing-item__info .meta {
    font-size: 0.75rem;
    color: #6b7280;
}

/* Right Detail Panel */
.detail-panel {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    justify-content: center; /* Center Content */
}
.detail-container {
    width: 100%;
    width: 100%;
    /* max-width removed to fill screen */
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Content Cards */
.content-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: none; /* Removed shadow for cleaner flat look */
}
.content-card.hero-card {
    border: none;
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
}
.card-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    margin-bottom: 1.25rem;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.card-title::before {
    content: '';
    display: block;
    width: 4px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 50%;
}

/* Hero Card Layout */
.hero-layout {
    display: flex;
    gap: 3rem;
    align-items: flex-start;
}
.hero-image {
    width: 140px;
    height: 140px;
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    padding: 4px;
    background: white;
}
.hero-image img { width: 100%; height: 100%; object-fit: contain; }
.hero-placeholder {
    width: 100%; height: 100%; background: #f9fafb;
    display: flex; alignItems: center; justifyContent: center;
}
.hero-info { flex: 1; }

.product-title {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #111827;
    margin-bottom: 0.5rem;
    line-height: 1.1;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    padding: 1rem 0;
    margin-top: 1.5rem;
    border-top: 1px solid #f3f4f6;
    /* Removed background and border-radius for cleaner look */
}
.metric-item .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 4px; }
.metric-item .value { font-size: 1.25rem; font-weight: 600; color: #111827; letter-spacing: -0.02em; }

/* Specs Grid */
.specs-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem 1rem;
}
/* Features Grid - Wider items */
.features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}

@media (max-width: 900px) {
    .specs-grid { grid-template-columns: repeat(2, 1fr); }
    .features-grid { grid-template-columns: repeat(2, 1fr); }
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
    .features-grid { grid-template-columns: 1fr; }
}

/* Tags */
.notion-tag { 
    font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; 
}
.notion-tag.blue { background: #e0f2fe; color: #0369a1; }

/* Buttons */
.btn-sm {
    padding: 4px 12px;
    font-size: 0.85rem;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #4b5563;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-sm:hover { border-color: #d1d5db; color: #1f2937; }

.btn-subtle {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
}
.btn-subtle.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.btn-subtle.btn-primary:hover { opacity: 0.9; }
</style>
