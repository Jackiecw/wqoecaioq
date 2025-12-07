<template>
  <div class="admin-page">
    <header class="page-header">
      <div class="header-text">
        <h1 class="page-title">产品管理</h1>
        <p class="page-subtitle">共 {{ filteredProducts.length }} 条产品记录</p>
      </div>
      <div class="header-actions">
        <InputText v-model="searchKeyword" placeholder="搜索产品名称 / SKU" class="w-12rem" />
        <Dropdown
          v-model="selectedCategory"
          :options="['ALL', ...categoryOptions]"
          placeholder="全部分类"
          class="w-8rem"
        />
        <Button label="新建产品" icon="pi pi-plus" @click="openModal" />
      </div>
    </header>

    <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="col-12 lg:col-4">
        <DataTable
          :value="filteredProducts"
          data-key="id"
          selection-mode="single"
          v-model:selection="selectedProduct"
          scrollable
          scroll-height="65vh"
          class="shadow-1 border-round-2xl"
          @row-select="onSelectProduct"
        >
          <Column field="sku" header="SKU" style="min-width: 8rem" />
          <Column field="name" header="名称" style="min-width: 10rem" />
          <Column header="分类" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag :value="data.category || '未分类'" severity="info" />
            </template>
          </Column>
        </DataTable>
      </div>

      <div class="col-12 lg:col-8">
        <Card v-if="selectedProduct" class="shadow-1 border-round-2xl">
          <template #title>{{ selectedProduct.name || '未命名产品' }}</template>
          <template #subtitle>{{ selectedProduct.sku || '未命名 SKU' }}</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex gap-2 flex-wrap">
                <Button label="编辑" icon="pi pi-pencil" size="small" text @click="handleEdit(selectedProduct)" />
                <Button label="删除" icon="pi pi-trash" size="small" text severity="danger" @click="handleDelete(selectedProduct)" />
              </div>
              <div class="grid formgrid p-fluid">
                <InfoRow label="对外型号" :value="selectedProduct.publicName || '未填写'" />
                <InfoRow label="分类" :value="selectedProduct.category || '未分类'" />
                <InfoRow label="成本价(¥)" :value="formatNumber(selectedProduct.cost)" />
                <InfoRow label="重量(kg)" :value="formatNumber(selectedProduct.weightKg)" />
                <InfoRow label="尺寸(mm)" :value="formatDimensions(selectedProduct)" />
                <InfoRow label="分辨率" :value="selectedProduct.resolution || '未填写'" />
                <InfoRow label="亮度(ANSI)" :value="formatNumber(selectedProduct.brightnessAnsi)" />
                <InfoRow label="光源亮度(LM)" :value="formatNumber(selectedProduct.lightSourceBrightness)" />
                <InfoRow label="亮度均匀度(%)" :value="formatNumber(selectedProduct.brightnessUniformity)" />
                <InfoRow label="噪声(dB)" :value="formatNumber(selectedProduct.noiseDb)" />
                <InfoRow label="接口" :value="selectedProduct.interfaces || '未填写'" />
                <InfoRow label="芯片" :value="selectedProduct.chipset || '未填写'" />
                <InfoRow label="光源" :value="selectedProduct.lightSource || '未填写'" />
                <InfoRow label="备注" :value="selectedProduct.description || '未填写'" />
              </div>
            </div>
          </template>
        </Card>
        <Card v-else class="shadow-1 border-round-2xl">
          <template #content>
            <p class="text-color-secondary m-0">请选择左侧产品以查看详情。</p>
          </template>
        </Card>
      </div>
    </div>

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
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import apiClient from '@/services/apiClient';
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
  },
  setup(props) {
    return () =>
      h('div', { class: 'flex justify-between text-sm text-color-secondary' }, [
        h('span', { class: 'font-medium text-color-secondary' }, props.label),
        h('span', { class: 'font-semibold text-color' }, props.value === 0 ? '0' : props.value || '未填写'),
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

const onSelectProduct = (event: any) => {
  selectedProduct.value = event.data || null;
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

const formatNumber = (value?: number | null) => (value || value === 0 ? value : '未填写');

const formatDimensions = (product?: Product | null) => {
  if (!product) return '未填写';
  if (product.lengthMm && product.widthMm && product.heightMm) {
    return `${product.lengthMm} × ${product.widthMm} × ${product.heightMm}`;
  }
  return '未填写';
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
/* Admin Page - Clean Premium White Theme */
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
