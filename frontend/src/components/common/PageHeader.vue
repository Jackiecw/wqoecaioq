<template>
  <header class="page-header-compact">
    <div class="title-wrap">
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      <slot name="meta"></slot>
    </div>
    <div class="header-actions" v-if="$slots.actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>
