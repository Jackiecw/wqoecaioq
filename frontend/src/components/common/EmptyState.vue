<template>
  <div class="empty-state-block">
    <div class="icon" v-if="icon">
      <i :class="icon"></i>
    </div>
    <p class="title">{{ title }}</p>
    <p v-if="description" class="desc">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
}>();
</script>
