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
      </FilterBar>

      <div class="listing-grid">
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
              <div class="listing-item__info">
                <div class="flex justify-between items-start">
                   <p class="title line-clamp-1">{{ product.name }}</p>
                   <span v-if="product.category" class="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{{ product.category }}</span>
                </div>
                <p class="meta font-mono mt-1">{{ product.sku }}</p>
                <p class="meta subtle mt-1" v-if="product.publicName">型号: {{ product.publicName }}</p>
              </div>
            </div>
          </div>
        </aside>

        <ContentCard class="detail-card" v-if="selectedProduct">
          <div class="detail">
             <div class="detail__header flex justify-between items-start w-full mb-6 border-b border-gray-100 pb-4">
                <div>
                   <h2 class="detail__title">{{ selectedProduct.name }}</h2>
                   <div class="flex items-center gap-3 mt-2">
                      <span class="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">{{ selectedProduct.sku }}</span>
                      <span class="badge" v-if="selectedProduct.category">{{ selectedProduct.category }}</span>
                   </div>
                </div>
                <div class="action-row">
                   <button class="btn-subtle" @click="handleEdit(selectedProduct)">
                      <i class="pi pi-pencil mr-1"></i> 编辑
                   </button>
                   <button class="btn-subtle danger" @click="handleDelete(selectedProduct)">
                      <i class="pi pi-trash mr-1"></i> 删除
                   </button>
                </div>
             </div>

             <div class="detail__content w-full">
                <h3 class="section-title"><i class="pi pi-sliders-h mr-2"></i>基本规格</h3>
                <div class="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                   <InfoRow label="对外型号" :value="selectedProduct.publicName" />
                   <InfoRow label="成本价" :value="formatNumber(selectedProduct.cost)" suffix="¥" />
                   <InfoRow label="重量" :value="formatNumber(selectedProduct.weightKg)" suffix="kg" />
                   <InfoRow label="尺寸 (mm)" :value="formatDimensions(selectedProduct)" />
                </div>

                <h3 class="section-title"><i class="pi pi-desktop mr-2"></i>技术参数</h3>
                <div class="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                   <InfoRow label="分辨率" :value="selectedProduct.resolution" />
                   <InfoRow label="亮度 (ANSI)" :value="formatNumber(selectedProduct.brightnessAnsi)" />
                   <InfoRow label="光源亮度 (LM)" :value="formatNumber(selectedProduct.lightSourceBrightness)" />
                   <InfoRow label="亮度均匀度" :value="formatNumber(selectedProduct.brightnessUniformity)" suffix="%" />
                   <InfoRow label="噪声" :value="formatNumber(selectedProduct.noiseDb)" suffix="dB" />
                   <InfoRow label="接口" :value="selectedProduct.interfaces" />
                   <InfoRow label="芯片" :value="selectedProduct.chipset" />
                   <InfoRow label="光源" :value="selectedProduct.lightSource" />
                </div>

                <div v-if="selectedProduct.description" class="mt-6">
                   <h3 class="section-title"><i class="pi pi-align-left mr-2"></i>备注</h3>
                   <div class="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                      {{ selectedProduct.description }}
                   </div>
                </div>
             </div>
          </div>
        </ContentCard>
        
        <EmptyState
          v-else
          icon="pi pi-box"
          title="请选择左侧产品"
          description="点击列表查看产品详情。"
          class="flex-1 bg-white border border-[var(--color-border)] rounded-lg"
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

type Product = {
  id: string;
  sku: string;
  name: string;
  publicName?: string;
  category?: string;
  cost?: number | null;
  description?: string | null;
  weightKg?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  resolution?: string | null;
  brightnessAnsi?: number | null;
  lightSourceBrightness?: number | null;
  brightnessUniformity?: number | null;
  noiseDb?: number | null;
  interfaces?: string | null;
  chipset?: string | null;
  lightSource?: string | null;
};

const products = ref<Product[]>([]);
const categoryOptions = ref<string[]>([]);
const selectedProduct = ref<Product | null>(null);
const currentProductToEditId = ref<string | null>(null);
const isModalOpen = ref(false);
const searchKeyword = ref('');
const selectedCategory = ref('ALL');
const errorMessage = ref('');

const InfoRow = defineComponent({
  name: 'InfoRow',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '' },
    suffix: { type: String, default: '' }
  },
  setup(props) {
    return () =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h('span', { class: 'text-xs text-[var(--color-text-secondary)] uppercase tracking-wider' }, props.label),
        h('span', { class: 'text-sm font-medium text-[var(--color-text-primary)]' }, 
          (props.value === 0 || props.value) ? `${props.value} ${props.suffix}`.trim() : '—'
        ),
      ]);
  },
});

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
    errorMessage.value = '获取产品列表失败';
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
  if (!confirm(`确定要删除 “${product.sku || '未命名SKU'} / ${product.name || '未命名产品'}” 吗？`)) {
    return;
  }
  try {
    await apiClient.delete(`/admin/products/${product.id}`);
    fetchProducts();
  } catch (error: any) {
    alert(error?.response?.data?.error || '删除失败，请稍后重试');
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
  margin-right: 0.5rem;
}

.listing-grid {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-4);
  height: calc(100vh - 220px);
}

.listing-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.panel-header {
  padding: var(--space-3);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
}

.listing-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.listing-item {
  padding: var(--space-3);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.listing-item:hover {
  background: var(--color-bg-hover);
}

.listing-item.active {
  background: white;
  border-color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.detail-card {
  flex: 1;
  overflow-y: auto;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.detail {
  padding: var(--space-6);
}

.detail__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
}

.btn-subtle {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: white;
  color: var(--color-text-primary);
}

.btn-subtle:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-secondary);
}

.btn-subtle.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-subtle.btn-primary:hover {
  opacity: 0.9;
}

.btn-subtle.danger {
  color: #dc2626;
  border-color: #fecdd3;
  background: #fff1f2;
}

.btn-subtle.danger:hover {
  background: #fee2e2;
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

.surface-input input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  width: 100%;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: #f3f4f6;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
