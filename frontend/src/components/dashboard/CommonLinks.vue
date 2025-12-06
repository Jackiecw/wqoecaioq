<template>

  <div class="common-links-page">

    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="page-badge">QUICK ACCESS</span>
          <h1 class="page-title">常用链接</h1>
          <p class="page-subtitle">收藏常用的后台、文档与协作工具，快速跳转</p>
        </div>
        <button
          v-if="isAdmin"
          @click="handleCreate"
          class="create-btn"
        >
          <PlusIcon class="h-5 w-5 inline-block -mt-1 mr-1" />
          新建链接
        </button>
      </div>
    </header>

    <p v-if="isLoading" class="loading-text">正在加载链接列表...</p>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div v-if="!isLoading && links.length === 0 && !errorMessage" class="empty-state">
      <p>
        目前还没有常用链接
        <span v-if="isAdmin">点击右上角按钮添加一个吧</span>
      </p>
    </div>

    <div v-if="!isLoading && links.length > 0" class="links-grid">
      <div
        v-for="link in links"
        :key="link.id"
        class="link-card"
      >
        <a :href="link.url" target="_blank" rel="noopener noreferrer" class="link-content">
          <p class="link-title">{{ link.title }}</p>
          <p class="link-desc">{{ link.description || '点击跳转' }}</p>
        </a>

        <div v-if="isAdmin" class="link-actions">
          <button @click="handleEdit(link)" title="编辑" class="action-btn">
            <PencilIcon class="h-4 w-4" />
          </button>
          <button @click="handleDelete(link)" title="删除" class="action-btn action-btn--danger">
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <LinkModal
      :is-open="isModalOpen"
      :link-to-edit="currentLinkToEdit"
      @close="closeModal"
      @link-created="handleLinkChange"
      @link-updated="handleLinkChange"
    />
  </div>
</template>

<style scoped>
.common-links-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Page Header */
.page-header {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  color: var(--color-accent);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.create-btn {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.create-btn:hover {
  filter: brightness(0.95);
  box-shadow: var(--shadow-md);
}

/* States */
.loading-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.empty-state {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-secondary);
}

/* Links Grid */
.links-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.link-card {
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.link-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  text-decoration: none;
}

.link-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  word-break: break-word;
}

.link-desc {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  word-break: break-word;
}

.link-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.link-card:hover .link-actions {
  opacity: 1;
}

.action-btn {
  background: var(--color-bg-card);
  border: none;
  border-radius: 50%;
  padding: 0.375rem;
  color: var(--color-text-muted);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  color: var(--color-accent);
}

.action-btn--danger:hover {
  color: #dc2626;
}
</style>





<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/apiClient';
import LinkModal from './LinkModal.vue';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/20/solid';

const isLoading = ref(true);
const errorMessage = ref('');
const links = ref([]); // Added missing links ref



// 权限

const authStore = useAuthStore();

const isAdmin = computed(() => authStore.role === 'admin');



// 弹窗状
const isModalOpen = ref(false);

const currentLinkToEdit = ref(null);



// 1. 获取所有链(使用 data.js 中的公共 API)

async function fetchLinks() {

  isLoading.value = true;

  errorMessage.value = '';

  try {

    const response = await apiClient.get('/links');

    links.value = response.data;

  } catch (error) {

    console.error('获取链接失败:', error);

    errorMessage.value = '获取链接列表失败';

  } finally {

    isLoading.value = false;

  }

}



onMounted(() => {

  fetchLinks();

});



// 2. 控制弹窗

function closeModal() {

  isModalOpen.value = false;

  currentLinkToEdit.value = null;

}



// 3. Admin: 创建

function handleCreate() {

  currentLinkToEdit.value = null;

  isModalOpen.value = true;

}



// 4. Admin: 编辑

function handleEdit(link) {

  currentLinkToEdit.value = link;

  isModalOpen.value = true;

}



// 5. Admin: 删除

async function handleDelete(link) {

  if (confirm(`确定要删"${link.title}" 吗？`)) {

    try {

      await apiClient.delete(`/admin/links/${link.id}`);

      fetchLinks(); // 删除后重新加
    } catch (error) {

      console.error('删除失败:', error);

      errorMessage.value = error.response?.data?.error || '删除失败';

    }

  }

}



// 6. 弹窗提交成功后的回调

function handleLinkChange() {

  fetchLinks();

  closeModal();

}

</script>
