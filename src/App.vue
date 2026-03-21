<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, type Component } from 'vue';
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css';
import { useEntry } from './entry';

const showDebug = ref(false);
const isDev = computed(()=> import.meta.env.DEV && showDebug.value);

const DebugHome = shallowRef<Component>();
const {init}=useEntry();
let disposeEntry: (() => void) | null = null;
// 动态导入debug页面 - 生产构建时此代码不会执行, 因为isDev为false
// 使用动态import确保debug页面代码被正确分割
async function toggleDebug() {
  if (!DebugHome.value && false) {
    // 开发环境: 动态导入实际组件
    // 生产环境: 此分支不会被执行 (isDev为false)
    const module = await import('./pages/debug/DebugHome.vue');
    DebugHome.value = module.default as Component;
  }
  showDebug.value = !showDebug.value;
}



onMounted(() => {
  // Step 1: initialize URL listener + panel injection runtime.
  disposeEntry = init()
})

onUnmounted(() => {
  // Step 2: release listeners and injected Vue app lifecycle.
  disposeEntry?.();
  disposeEntry = null;
});

</script>

<template>
  <!-- <div class="floating-panel">
  </div> -->
  <Toaster position="top-center" :duration="1000" />
  <template v-if="isDev">
    <button class="debug-toggle-btn" @click="toggleDebug">
      {{ showDebug ? 'Hide Debug' : 'Show Debug' }}
    </button>
  </template>

  <component :is="DebugHome" v-if="showDebug && DebugHome" />
</template>

<style scoped>
.debug-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10001;
}

.debug-toggle-btn:hover {
  background: #5568d3;
}
</style>
