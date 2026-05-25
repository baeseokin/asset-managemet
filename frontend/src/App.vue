<template>
  <div id="app" class="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/20 selection:text-indigo-300">
    <router-view />
    <GlobalModal />
  </div>
</template>

<script setup>
import GlobalModal from '@/components/GlobalModal.vue'
</script>

<style>
/* Global configurations */
body {
  margin: 0;
  padding: 0;
}
</style>
