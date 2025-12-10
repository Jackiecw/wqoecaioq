<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitle"
    :style="{ width: '960px' }" 
    :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    :dismissableMask="true"
    :draggable="false"
    class="product-form-modal"
    @hide="closeModal"
  >
    <div class="form-content">
      <Toast />
      
      <!-- Section 1: 基本信息 + 图片上传 -->
      <div class="form-section">
        <div class="section-title">
          <i class="pi pi-info-circle"></i>
          基本信息
        </div>
        <div class="section-body section-body--with-image">
          <!-- 左侧表单 -->
          <div class="form-fields">
            <div class="form-row">
              <div class="field-group">
                <label>内部型号 (SKU) <span class="required">*</span></label>
                <InputText v-model="formData.sku" placeholder="P-2024-001" />
              </div>
              <div class="field-group">
                <label>产品名称 <span class="required">*</span></label>
                <InputText v-model="formData.name" placeholder="内部管理名称" />
              </div>
            </div>
            <div class="form-row">
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
            <div class="field-group">
              <label>备注 / 产品简介</label>
              <Textarea v-model="formData.description" rows="2" auto-resize class="w-full" placeholder="简要描述..." />
            </div>
          </div>
          
          <!-- 右侧图片上传 -->
          <div class="image-upload-area">
            <label class="upload-label">产品图片</label>
            <div 
              class="image-uploader"
              :class="{ 'has-image': formData.imageUrl || previewImageUrl, 'is-dragging': isDraggingImage }"
              @click="triggerImageUpload"
              @dragover.prevent="isDraggingImage = true"
              @dragleave="isDraggingImage = false"
              @drop.prevent="handleImageDrop"
            >
              <img v-if="formData.imageUrl || previewImageUrl" :src="previewImageUrl || formData.imageUrl" alt="产品图片" />
              <div v-else class="upload-placeholder">
                <i class="pi pi-image"></i>
                <span>点击或拖拽上传</span>
                <span class="upload-hint">支持 JPG, PNG</span>
              </div>
              <input 
                ref="imageInput"
                type="file" 
                accept="image/*" 
                class="hidden-input"
                @change="handleImageSelect"
              />
              <button 
                v-if="formData.imageUrl || previewImageUrl" 
                class="remove-image-btn"
                @click.stop="removeImage"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: 物理规格 -->
      <div class="form-section">
        <div class="section-title">
          <i class="pi pi-box"></i>
          物理规格
        </div>
        <div class="section-body">
          <div class="form-row form-row--4col">
            <div class="field-group">
              <label>重量 (kg)</label>
              <InputNumber v-model="formData.weightKg" :min="0" :max-fraction-digits="2" placeholder="0.00" />
            </div>
            <div class="field-group">
              <label>长度 (mm)</label>
              <InputNumber v-model="formData.lengthMm" :min="0" placeholder="L" />
            </div>
            <div class="field-group">
              <label>宽度 (mm)</label>
              <InputNumber v-model="formData.widthMm" :min="0" placeholder="W" />
            </div>
            <div class="field-group">
              <label>高度 (mm)</label>
              <InputNumber v-model="formData.heightMm" :min="0" placeholder="H" />
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: 显示与光学 -->
      <div class="form-section">
        <div class="section-title">
          <i class="pi pi-desktop"></i>
          显示与光学
        </div>
        <div class="section-body">
          <div class="form-row form-row--4col">
            <div class="field-group">
              <label>分辨率</label>
              <Dropdown v-model="formData.resolution" :options="opts.resolutions" placeholder="选择分辨率" class="w-full" />
            </div>
            <div class="field-group">
              <label>亮度 (ANSI)</label>
              <InputNumber v-model="formData.brightnessAnsi" :min="0" placeholder="0" />
            </div>
            <div class="field-group">
              <label>均匀度 (%)</label>
              <InputNumber v-model="formData.brightnessUniformity" :min="0" :max="100" placeholder="0" />
            </div>
            <div class="field-group">
              <label>光源亮度 (LM)</label>
              <InputNumber v-model="formData.lightSourceBrightness" :min="0" placeholder="0" />
            </div>
          </div>
          <div class="form-row form-row--4col">
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
              <Dropdown v-model="formData.focusMethod" :options="opts.focusMethods" placeholder="选择对焦方式" class="w-full" />
            </div>
            <div class="field-group">
              <label>梯形校正</label>
              <Dropdown v-model="formData.keystone" :options="opts.keystoneModes" placeholder="选择梯形校正" class="w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: 系统配置 -->
      <div class="form-section">
        <div class="section-title">
          <i class="pi pi-microchip"></i>
          系统配置
        </div>
        <div class="section-body">
          <div class="form-row form-row--4col">
            <div class="field-group">
              <label>芯片 (Chipset)</label>
              <InputText v-model="formData.chipset" placeholder="MT9632" />
            </div>
            <div class="field-group">
              <label>内存 (RAM+ROM)</label>
              <InputText v-model="formData.ramRom" placeholder="1G+8G" />
            </div>
            <div class="field-group">
              <label>操作系统</label>
              <Dropdown v-model="formData.os" :options="opts.osTypes" placeholder="选择操作系统" class="w-full" />
            </div>
            <div class="field-group">
              <label>噪声 (dB)</label>
              <InputNumber v-model="formData.noiseDb" placeholder="0" />
            </div>
          </div>
          <div class="form-row form-row--4col">
            <div class="field-group">
              <label>WiFi</label>
              <Dropdown v-model="formData.wifiVersion" :options="opts.wifiVersions" placeholder="选择WiFi版本" class="w-full" />
            </div>
            <div class="field-group">
              <label>蓝牙</label>
              <Dropdown v-model="formData.bluetoothVersion" :options="opts.bluetoothVersions" placeholder="选择蓝牙版本" class="w-full" />
            </div>
          </div>
          
          <div class="feature-toggles">
            <label class="toggle-item">
              <InputSwitch v-model="formData.hasGimbal" />
              <span>自配云台</span>
            </label>
            <label class="toggle-item">
              <InputSwitch v-model="formData.autoObstacle" />
              <span>自动避障</span>
            </label>
            <label class="toggle-item">
              <InputSwitch v-model="formData.autoScreenFit" />
              <span>自动入幕</span>
            </label>
          </div>
        </div>
      </div>
      
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="取消" severity="secondary" @click="closeModal" />
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
  imageUrl: string;
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

// Image upload state
const imageInput = ref<HTMLInputElement | null>(null);
const isDraggingImage = ref(false);
const previewImageUrl = ref<string | null>(null);
const selectedImageFile = ref<File | null>(null);

// --- Standard Options ---
const opts = {
    resolutions: ['720P (1280x720)', '1080P (1920x1080)', '1080P+ (supported 4K)', '4K (3840x2160)'],
    focusMethods: ['手动对焦', '电动对焦', '自动对焦'],
    keystoneModes: ['自动梯形', '上下梯形', '无'],
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
    wifiVersions: ['WiFi 6', 'WiFi 5 (双频)', '单频 2.4G', '无'],
    bluetoothVersions: ['BT 5.2', 'BT 5.1', 'BT 5.0', 'BT 4.2', '无']
};

// --- Form Data ---
const getEmptyForm = (): ProductPayload => ({
  sku: '', name: '', publicName: '', category: '', cost: null, description: '', imageUrl: '',
  weightKg: null, lengthMm: null, widthMm: null, heightMm: null,
  resolution: '', brightnessAnsi: null, lightSourceBrightness: null,
  brightnessUniformity: null, noiseDb: null,
  contrastRatio: '', throwRatio: '', projectionSize: '', projectionDistance: '',
  chipset: '', ramRom: '', os: '', focusMethod: '', keystone: '',
  hasGimbal: false, wifiVersion: '', bluetoothVersion: '',
  autoObstacle: false, autoScreenFit: false
});

const formData = ref<ProductPayload>(getEmptyForm());

// --- Image Upload Methods ---
const triggerImageUpload = () => {
  imageInput.value?.click();
};

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    processImageFile(target.files[0]);
  }
};

const handleImageDrop = (event: DragEvent) => {
  isDraggingImage.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processImageFile(event.dataTransfer.files[0]);
  }
};

const processImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.add({ severity: 'warn', summary: '提示', detail: '请上传图片文件', life: 3000 });
    return;
  }
  selectedImageFile.value = file;
  previewImageUrl.value = URL.createObjectURL(file);
};

const removeImage = () => {
  selectedImageFile.value = null;
  previewImageUrl.value = null;
  formData.value.imageUrl = '';
  if (imageInput.value) {
    imageInput.value.value = '';
  }
};

// --- Methods ---
const closeModal = () => {
  formData.value = getEmptyForm();
  previewImageUrl.value = null;
  selectedImageFile.value = null;
  emit('close');
};

const hydrateForm = async () => {
  if (!props.productId) return;
  try {
    const response = await apiClient.get(`/admin/products/${props.productId}`);
    const data = response.data;
    formData.value = { ...getEmptyForm(), ...data };
    previewImageUrl.value = null;
    selectedImageFile.value = null;
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
    // Build FormData for multipart submission (supports file upload)
    const submitData = new FormData();
    
    // Append all form fields
    Object.entries(formData.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        submitData.append(key, String(value));
      }
    });
    
    // Append image file if selected
    if (selectedImageFile.value) {
      submitData.append('imageUrl', selectedImageFile.value);
    }
    
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' }
    };
    
    if (props.productId) {
      const response = await apiClient.put<ProductResponse>(`/admin/products/${props.productId}`, submitData, config);
      emit('product-updated', response.data);
      toast.add({ severity: 'success', summary: '成功', detail: '已更新', life: 3000 });
    } else {
      const response = await apiClient.post<ProductResponse>('/admin/products', submitData, config);
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
/* ========================================
   Product Form Modal - Unified Layout
   ======================================== */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.section-title i {
  font-size: 0.9rem;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-body--with-image {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 1.5rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-row--4col {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 768px) {
  .section-body--with-image {
    grid-template-columns: 1fr;
  }
  
  .form-row,
  .form-row--4col {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .form-row,
  .form-row--4col {
    grid-template-columns: 1fr;
  }
}

/* Field Group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-group label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required {
  color: #ef4444;
}

/* Image Upload */
.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.image-uploader {
  position: relative;
  width: 180px;
  height: 180px;
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

.image-uploader.is-dragging {
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
  object-fit: contain;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 1rem;
}

.upload-placeholder i {
  font-size: 2rem;
  color: var(--color-text-muted);
}

.upload-placeholder span {
  font-size: 0.8125rem;
}

.upload-hint {
  font-size: 0.75rem !important;
  color: var(--color-text-muted) !important;
}

.hidden-input {
  display: none;
}

.remove-image-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.image-uploader:hover .remove-image-btn {
  opacity: 1;
}

/* Feature Toggles */
.feature-toggles {
  display: flex;
  gap: 2rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin-top: 0.5rem;
}

.toggle-item {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
}

.toggle-item span {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  user-select: none;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

/* Input Overrides */
:deep(.p-inputtext), 
:deep(.p-dropdown), 
:deep(.p-inputnumber-input) {
  font-size: 0.875rem;
  height: 38px;
  border-radius: var(--radius-sm);
  border-color: var(--color-border);
  box-shadow: none !important;
  width: 100%;
}

:deep(.p-dropdown) {
  align-items: center;
  padding: 0;
}

:deep(.p-dropdown-label) {
  padding: 0 0.75rem;
  display: flex;
  align-items: center;
}

:deep(.p-inputtext:hover), :deep(.p-dropdown:hover) {
  border-color: var(--color-text-muted);
}

:deep(.p-inputtext:focus), :deep(.p-dropdown.p-focus) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft) !important;
}

:deep(.p-inputnumber) {
  width: 100%;
}

:deep(.p-textarea) {
  width: 100%;
  border-radius: var(--radius-sm);
  border-color: var(--color-border);
}
</style>
