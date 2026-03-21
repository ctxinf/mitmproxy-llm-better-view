<script setup lang="ts">
import ViewDashboardProxy from '@/components/llm/ViewDashboardProxy.vue';
import { useCurrentFlowStore } from '@/store/llm';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import icon from '@/assets/icon.png'
const currentFlowStore = useCurrentFlowStore();
// 使用 storeToRefs 保持解构后的响应式，保证手动切换能立即触发渲染。
const { standard, dataType, dataAsText, flow } = storeToRefs(currentFlowStore);

// 根据 API 标准获取对应的主题颜色
const subjectColor = computed(() => {
  switch (standard.value) {
    case 'openai':
      return '#08080866'; // OpenAI 绿色
    case 'openai-response':
      return '#21212166';
    case 'claude':
      return '#d97757'; // Claude 红色
    case 'gemini':
      return '#3185fe'; // Gemini 蓝色
    default:
      return '#e2e8f0'; // 默认灰色
  }
})

// 只要标准与数据类型存在，就允许渲染（data 可为空字符串）。
const canRenderDashboard = computed(() => Boolean(standard.value && dataType.value));
const dashboardData = computed(() => dataAsText.value ?? '');
</script>

<template>
  <details 
    id="mitmproxy-llm-better-view-dash-container" 
    class="llm-better-view" 
    open
    :style="`--llm-subject-color: ${subjectColor}`"
  >
    <summary class="summary">
      <span class="arrow">▸</span>
      <div style="flex:1"></div>
      <div class="title">
        <img :src="icon"  height="24px"/>
        <span style="width: 4px; height: 4px; display: inline-block;"></span>
        <span class="text">LLM Better View</span>

      </div>
      <div style="flex:1"></div>
      <a href="https://github.com/ctxinf/mitmproxy-llm-better-view" target="_blank" rel="noopener noreferrer" class="github-link"
        aria-label="View mitmproxy-llm-better-view on GitHub">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0116 8c0-4.42-3.58-8-8-8z">
          </path>
        </svg>
      </a>
    </summary>
    <div class="content">
      <view-dashboard-proxy
        v-if="canRenderDashboard"
        :standard="standard!"
        :data-type="dataType!"
        :data="dashboardData"
        :path="flow?.request.path"
      />
    </div>
  </details>
</template>

<style scoped>
.llm-better-view {
  margin: 2rem 0;
  border-radius: 0px 0px 6px 6px;
  /* overflow: hidden; */
  /* background-color: #ffffff; */
  /* 整体纯白，与页面背景一致 */

  /* 默认阴影：下 + 左 + 右 */
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.12),
    /* 向下 */
    -6px 0 12px rgba(0, 0, 0, 0.08),
    /* 向左 */
    6px 0 12px rgba(0, 0, 0, 0.08);
  /* 向右 */

  transition: box-shadow 0.25s ease;
  /* hover 过渡动画 */
}

.llm-better-view:hover {
  /* hover 时阴影加大、更明显 */
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.2),
    -12px 0 24px rgba(0, 0, 0, 0.15),
    12px 0 24px rgba(0, 0, 0, 0.15);
}



.summary {
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  padding: .5rem 4px;
  background: color-mix(in srgb, var(--llm-subject-color) 30%, white 70%);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  position: relative;
}

.summary:hover {
  background: color-mix(in srgb, var(--llm-subject-color) 35%, white 65%);
}

/* 隐藏默认三角 */
.summary::-webkit-details-marker {
  display: none;
}

.title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  white-space: nowrap;
  font-weight: 600;
  color: #1e293b;
}

.arrow {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
  color: #0284c7;
}

.llm-better-view[open] .arrow {
  transform: rotate(90deg);
}

.github-link {
  color: #24292f;
  margin: 0 .5rem;
  opacity: 0.66;
  transition: opacity 0.2s ease;
}

.github-link:hover {
  opacity: 1.0;
  outline: 1px solid rgba(0, 0, 0, 0.462);
  border-radius: 5px;
}

.content {
  padding: 0;
  margin: 0;
  padding-top: 1rem;
  /* background-color: #ffffff;
   */
  /* border-radius: 0px 0px 16px 16px; */


}
</style>
