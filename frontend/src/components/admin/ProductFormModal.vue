<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitle"
    :style="{ width: '900px' }" 
    :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    :dismissableMask="true"
    :draggable="false"
    class="product-form-modal"
    @hide="closeModal"
  >
    <div class="form-content py-2">
      <Toast />
      
      <!-- Section 1: Core Identifier -->
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
           <div class="field-group">
             <label>内部型号 (SKU) <span class="required">*</span></label>
             <InputText v-model="formData.sku" placeholder="P-2024-001" />
           </div>
           <div class="field-group">
             <label>产品名称 <span class="required">*</span></label>
             <InputText v-model="formData.name" placeholder="内部管理名称" />
           </div>
           <div class="field-group">
             <label>对外型号</label>
             <InputText v-model="formData.publicName" placeholder="ProView X1" />
           </div>
           <div class="field-group">
             <label>产品分类 <span class="required">*</span></label>
             <Dropdown
               v-model="formData.category"
               :options="categoryOptions"
               placeholder="选择分类"
               class="w-full"
             />
           </div>
           <div class="field-group">
              <label>成本价 (CNY)</label>
              <InputNumber 
                v-model="formData.cost" 
                mode="currency" 
                currency="CNY" 
                locale="zh-CN" 
                placeholder="¥ 0.00"
                class="w-full" 
              />
           </div>
        </div>
        <div class="mt-4 field-group">
            <label>备注 / 产品简介</label>
            <Textarea v-model="formData.description" rows="2" auto-resize class="w-full bg-gray-50 border-gray-200" placeholder="简要描述..." />
        </div>
      </div>

      <!-- Section 2: Physical Specs -->
      <div class="form-section">
        <div class="section-title">物理规格</div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
           <div class="field-group">
             <label>重量 (kg)</label>
             <InputNumber v-model="formData.weightKg" :min="0" :max-fraction-digits="2" suffix=" kg" />
           </div>
           <div class="field-group col-span-3">
              <label>尺寸 (长 x 宽 x 高 mm)</label>
              <div class="flex items-center gap-2">
                 <InputNumber v-model="formData.lengthMm" placeholder="L" :min="0" class="w-full" />
                 <span class="text-gray-300">×</span>
                 <InputNumber v-model="formData.widthMm" placeholder="W" :min="0" class="w-full" />
                 <span class="text-gray-300">×</span>
                 <InputNumber v-model="formData.heightMm" placeholder="H" :min="0" class="w-full" />
              </div>
           </div>
        </div>
      </div>

      <!-- Section 3: Optics & Display -->
      <div class="form-section">
        <div class="section-title">显示与光学</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
           <div class="field-group">
             <label>分辨率</label>
             <Dropdown v-model="formData.resolution" :options="opts.resolutions" editable placeholder="选择或输入" />
           </div>
           <div class="field-group">
             <label>亮度 (ANSI)</label>
             <InputNumber v-model="formData.brightnessAnsi" :min="0" />
           </div>
           <div class="field-group">
             <label>均匀度 (%)</label>
             <InputNumber v-model="formData.brightnessUniformity" :min="0" :max="100" suffix="%" />
           </div>
           <div class="field-group">
             <label>光源亮度 (LM)</label>
             <InputNumber v-model="formData.lightSourceBrightness" :min="0" />
           </div>
           <div class="field-group">
             <label>对比度</label>
             <InputText v-model="formData.contrastRatio" placeholder="1000:1" />
           </div>
           <div class="field-group">
             <label>投射比</label>
             <InputText v-model="formData.throwRatio" placeholder="1.25:1" />
           </div>
           <div class="field-group">
             <label>对焦方式</label>
             <Dropdown v-model="formData.focusMethod" :options="opts.focusMethods" />
           </div>
           <div class="field-group">
             <label>梯形校正</label>
             <Dropdown v-model="formData.keystone" :options="opts.keystoneModes" />
           </div>
        </div>
      </div>

      <!-- Section 4: System & Connectivity -->
      <div class="form-section">
         <div class="section-title">系统配置</div>
         <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div class="field-group">
              <label>芯片 (Chipset)</label>
              <InputText v-model="formData.chipset" />
            </div>
            <div class="field-group">
              <label>内存 (RAM+ROM)</label>
              <InputText v-model="formData.ramRom" placeholder="1G+8G" />
            </div>
            <div class="field-group">
              <label>操作系统</label>
              <Dropdown v-model="formData.os" :options="opts.osTypes" editable placeholder="选择或输入" />
            </div>
            <div class="field-group">
              <label>噪声 (dB)</label>
              <InputNumber v-model="formData.noiseDb" suffix=" dB" />
            </div>
            <div class="field-group">
              <label>WiFi</label>
              <Dropdown v-model="formData.wifiVersion" :options="opts.wifiVersions" editable placeholder="选择或输入" />
            </div>
            <div class="field-group">
              <label>蓝牙</label>
              <Dropdown v-model="formData.bluetoothVersion" :options="opts.bluetoothVersions" editable placeholder="选择或输入" />
            </div>
         </div>
         
         <div class="feature-toggles mt-6">
             <div class="toggle-item">
                 <InputSwitch v-model="formData.hasGimbal" inputId="gimbal" />
                 <label for="gimbal">自配云台</label>
             </div>
             <div class="toggle-item">
                 <InputSwitch v-model="formData.autoObstacle" inputId="obstacle" />
                 <label for="obstacle">自动避障</label>
             </div>
             <div class="toggle-item">
                 <InputSwitch v-model="formData.autoScreenFit" inputId="screenfit" />
                 <label for="screenfit">自动入幕</label>
             </div>
         </div>
      </div>
      
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button label="取消" severity="secondary" text @click="closeModal" />
          <Button label="保存产品" icon="pi pi-check" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import InputSwitch from 'primevue/inputswitch';
import { useToast } from 'primevue/usetoast';
import apiClient from '@/services/apiClient';

// --- Type Definitions ---
type ProductPayload = {
  sku: string;
  name: string;
  publicName: string;
  category: string;
  cost: number | null;
  description: string;
  weightKg: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  resolution: string;
  brightnessAnsi: number | null;
  lightSourceBrightness: number | null;
  brightnessUniformity: number | null;
  noiseDb: number | null;
  contrastRatio: string;
  throwRatio: string;
  projectionSize: string;
  projectionDistance: string;
  chipset: string;
  ramRom: string;
  os: string;
  focusMethod: string;
  keystone: string;
  hasGimbal: boolean;
  wifiVersion: string;
  bluetoothVersion: string;
  autoObstacle: boolean;
  autoScreenFit: boolean;
};

type ProductResponse = ProductPayload & { id: string };

const props = defineProps<{
  isOpen: boolean;
  productId: string | null;
  categoryOptions: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'product-created', payload: ProductResponse): void;
  (e: 'product-updated', payload: ProductResponse): void;
}>();

const toast = useToast();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => { if (!val) emit('close'); },
});

const dialogTitle = computed(() => (props.productId ? '编辑产品' : '新建产品'));
const isSubmitting = ref(false);

// --- Standard Options ---
const opts = {
    resolutions: ['720P (1280x720)', '1080P (1920x1080)', '1080P+ (supported 4K)', '4K (3840x2160)'],
    focusMethods: ['MANUAL', 'ELECTRIC', 'AUTO'],
    keystoneModes: ['MANUAL', 'VERTICAL', '4-POINT', 'AUTO', 'NONE'],
    osTypes: [
        'LINUX', 
        'ANDROID_9', 
        'ANDROID_10', 
        'ANDROID_11', 
        'ANDROID_12', 
        'ANDROID_13', 
        'GOOGLE_TV', 
        'WHALE_OS', 
        'OTHER'
    ],
    wifiVersions: ['WiFi 6', 'WiFi 5 (Dual Band)', '2.4G Only', 'None'],
    bluetoothVersions: ['BT 5.2', 'BT 5.1', 'BT 5.0', 'BT 4.2', 'None']
};

// --- Form Data ---
const getEmptyForm = (): ProductPayload => ({
  sku: '', name: '', publicName: '', category: '', cost: null, description: '',
  weightKg: null, lengthMm: null, widthMm: null, heightMm: null,
  resolution: '', brightnessAnsi: null, lightSourceBrightness: null,
  brightnessUniformity: null, noiseDb: null,
  contrastRatio: '', throwRatio: '', projectionSize: '', projectionDistance: '',
  chipset: '', ramRom: '', os: '', focusMethod: '', keystone: '',
  hasGimbal: false, wifiVersion: '', bluetoothVersion: '',
  autoObstacle: false, autoScreenFit: false
});

const formData = ref<ProductPayload>(getEmptyForm());

// --- Methods ---
const closeModal = () => {
  formData.value = getEmptyForm();
  emit('close');
};

const hydrateForm = async () => {
  if (!props.productId) return;
  try {
    const response = await apiClient.get(`/admin/products/${props.productId}`);
    const data = response.data;
    formData.value = { ...getEmptyForm(), ...data }; // Merge with defaults to ensure all keys exist
  } catch (error: any) {
    console.error('加载产品详情失败:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: '加载失败', life: 3000 });
  }
};

const handleSubmit = async () => {
  if (!formData.value.sku || !formData.value.name || !formData.value.category) {
      toast.add({ severity: 'warn', summary: '提示', detail: '请填写必要信息 (SKU / 名称 / 分类)', life: 3000 });
      return;
  }

  isSubmitting.value = true;
  try {
    const payload = { ...formData.value };
    // Cleanup simple string fields if strictly needed, mostly handled by backend loose typing or frontend defaults
    
    if (props.productId) {
      const response = await apiClient.put<ProductResponse>(`/admin/products/${props.productId}`, payload);
      emit('product-updated', response.data);
      toast.add({ severity: 'success', summary: '成功', detail: '已更新', life: 3000 });
    } else {
      const response = await apiClient.post<ProductResponse>('/admin/products', payload);
      emit('product-created', response.data);
      toast.add({ severity: 'success', summary: '成功', detail: '已创建', life: 3000 });
    }
    closeModal();
  } catch (error: any) {
    console.error('保存失败:', error);
    toast.add({ severity: 'error', summary: '保存失败', detail: error?.response?.data?.error || '操作失败', life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
};

watch(() => props.productId, (val) => {
    val ? hydrateForm() : (formData.value = getEmptyForm());
}, { immediate: true });
</script>

<style scoped>
/* layout styles */
.form-content { display: flex; flex-direction: column; gap: 2rem; }
.form-section { display: flex; flex-direction: column; gap: 1rem; }
.section-title { font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-group label { font-size: 0.85rem; font-weight: 500; color: #475569; }
.required { color: #ef4444; }

.feature-toggles { display: flex; gap: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
.toggle-item { display: flex; align-items: center; gap: 0.5rem; }
.toggle-item label { font-size: 0.9rem; cursor: pointer; font-weight: 500; }

/* 
   Global Input Unification 
   Force all PrimeVue inputs (Text, Number, Dropdown) to share exact same visual metrics 
*/
:deep(.p-inputtext), 
:deep(.p-dropdown), 
:deep(.p-inputnumber-input) {
    font-size: 0.9rem;
    height: 38px; /* Fixed height for consistency */
    border-radius: 6px;
    border-color: #cbd5e1;
    box-shadow: none !important; /* Remove PrimeVue default heavy shadows */
    width: 100%;
}

:deep(.p-dropdown) {
    align-items: center;
    padding: 0; /* Let internal label handle padding */
}
:deep(.p-dropdown-label) {
    padding: 0 0.75rem; /* Match InputText padding */
    display: flex;
    align-items: center;
}
:deep(.p-inputtext:hover), :deep(.p-dropdown:hover) {
    border-color: #94a3b8;
}
:deep(.p-inputtext:focus), :deep(.p-dropdown.p-focus) {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

/* Fix InputNumber wrapper to fit width */
:deep(.p-inputnumber) {
    width: 100%;
}
</style>
