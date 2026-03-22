<template>
  <div class="text-block">
    <!-- 1. 头部区域 (不变) -->
    <div v-if="canToggle" class="text-block-header">
      <FormatSelector :current-format="displayFormat" @select="handleFormatChange" />

      <div class="header-actions">
        <button v-if="showViewRawBtn" class="view-raw-btn" @click="showRaw = !showRaw">
          {{ showRaw ? '▼' : '▶' }} View Raw
        </button>
      </div>
    </div>

    <!-- 2. 相对定位的外部容器 (主要修改点) -->
    <!-- 这个容器负责 hover 事件和作为按钮绝对定位的锚点 -->
    <div 
      class="text-block-body"
      @mouseenter="showButtons = true" 
      @mouseleave="showButtons = false"
    >
      
      <!-- A. 悬浮按钮组 (移出了滚动容器，放在了外面) -->
      <!-- position: absolute; top: 0; right: 0; -->
      <div v-if="showFloatingButtons" class="floating-buttons" :class="{ visible: showButtons }">
        <ExpandButton 
          v-if="needsExpansion"
          :expanded="isExpanded"
          :title="isExpanded ? 'Collapse view' : 'Expand full height'"
          @click="toggleExpand"
        />
        <WrapLineButton 
          v-if="showWrapLineBtn"
          :active="!wrapLines" 
          title="Toggle word wrap" 
          @click="wrapLines = !wrapLines" 
        />
        <CopyButton :content="text" success-message="Copied" />
      </div>

      <!-- B. 内容滚动区域 -->
      <!-- 负责 max-height 和 overflow -->
      <div
        ref="scrollContainerRef"
        class="scroll-content"
        :class="{ 'scroll-mode': !isExpanded && needsExpansion }"
      >
        <template v-if="visible">
          <RawViewer
            v-if="showRaw"
            :content="text"
            :wrap-lines="wrapLines"
          />
          <ProseContent
            v-else-if="displayFormat === 'markdown'"
            v-model:content="textModel"
            :wrap-lines="wrapLines"
          />
          <XMLViewer
            v-else-if="displayFormat === 'xml'"
            v-model:content="textModel"
            :wrap-lines="wrapLines"
          />
          <JsonViewer
            v-else-if="displayFormat === 'json'"
            v-model:content="textModel"
            :wrap-lines="wrapLines"
          />
          <div
            v-else
            class="text-content"
            :style="{ whiteSpace: wrapLines ? 'pre-wrap' : 'pre' }"
          >
            {{ text }}
          </div>
        </template>
        <div v-else class="deferred-placeholder">
          Rendering content...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useResizeObserver, useSessionStorage } from '@vueuse/core';
// 组件引入保持不变...
import ProseContent from '@/components/content/ProseContent.vue';
import XMLViewer from '@/components/content/XMLViewer.vue';
import JsonViewer from '@/components/content/JsonViewer.vue';
import RawViewer from '@/components/content/RawViewer.vue';
import FormatSelector from '@/components/common/FormatSelector.vue';
import CopyButton from '@/components/common/CopyButton.vue';
import WrapLineButton from '@/components/common/WrapLineButton.vue';
import ExpandButton from '@/components/common/ExpandButton.vue';
import { detectContentFormat, type ContentFormat } from '@/utils/format/formatContent';
import { hashId } from '@/utils/id/hashId';

interface Props {
  id?: string;
  text: string;
}

const props = defineProps<Props>();

// ========== 状态管理 ==========
// 延迟挂载重内容，降低首屏同步渲染压力。
const visible = ref(false);
const showRaw = ref(false);
const wrapLines = ref(true);
const showButtons = ref(false);

const contentFormats: ContentFormat[] = ['markdown', 'json', 'xml', 'text'];
const isContentFormat = (value: unknown): value is ContentFormat =>
  typeof value === 'string' && contentFormats.includes(value as ContentFormat);

const formatStorageKey = computed(() => {
  const keyId = props.id?.trim() ? props.id.trim() : `hash-${hashId(props.text)}`;
  return `llm-better-view-smart-format-${keyId}`;
});

// 内容块维度记忆格式切换：同一会话下回到该块时恢复用户手动选择。
const manualFormatStorage = useSessionStorage<ContentFormat | null>(formatStorageKey, null);
const manualFormat = computed<ContentFormat | null>({
  get: () => (isContentFormat(manualFormatStorage.value) ? manualFormatStorage.value : null),
  set: (value) => {
    manualFormatStorage.value = value;
  }
});

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

let cancelDeferredMount: (() => void) | null = null;

const scheduleDeferredMount = () => {
  cancelDeferredMount?.();

  const idleWindow = window as IdleWindow;
  if (typeof idleWindow.requestIdleCallback === 'function' && typeof idleWindow.cancelIdleCallback === 'function') {
    const handle = idleWindow.requestIdleCallback(
      () => {
        visible.value = true;
        cancelDeferredMount = null;
      },
      { timeout: 300 }
    );

    cancelDeferredMount = () => {
      idleWindow.cancelIdleCallback?.(handle);
      cancelDeferredMount = null;
    };
    return;
  }

  const timeoutHandle = window.setTimeout(() => {
    visible.value = true;
    cancelDeferredMount = null;
  }, 16);

  cancelDeferredMount = () => {
    window.clearTimeout(timeoutHandle);
    cancelDeferredMount = null;
  };
};

// ========== 高度检测逻辑 ==========
// 注意：Ref 现在绑定的是内部滚动容器
const scrollContainerRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const needsExpansion = ref(false);

const checkHeight = () => {
  if (!scrollContainerRef.value) return;
  
  const el = scrollContainerRef.value;
  // 计算阈值
  const vhLimit = window.innerHeight * 0.5;
  const pixelLimit = 400;
  const threshold = Math.min(vhLimit, pixelLimit);
  
  // 核心判断：内容实际高度是否超过阈值
  if (el.scrollHeight > (threshold + 10)) {
    needsExpansion.value = true;
  } else {
    needsExpansion.value = false;
    if (isExpanded.value) isExpanded.value = false;
  }
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 监听滚动容器尺寸变化
useResizeObserver(scrollContainerRef, () => {
  checkHeight();
});

watch([() => props.text, wrapLines, showRaw, () => manualFormat.value, visible], async () => {
  await nextTick();
  checkHeight();
});

// ========== 其他逻辑保持不变 ==========
const detectedFormat = computed(() => {
  if (!visible.value) return 'text';
  return detectContentFormat(props.text);
});
const displayFormat = computed(() => manualFormat.value ?? detectedFormat.value);
const canToggle = computed(() => visible.value);
const showWrapLineBtn = computed(() => displayFormat.value !== 'markdown');
const showViewRawBtn = computed(() => !['json', 'text'].includes(displayFormat.value));
const showFloatingButtons = computed(() => visible.value && !showRaw.value);
const textModel = computed({ get: () => props.text, set: () => { } });
const handleFormatChange = (format: ContentFormat) => {
  manualFormat.value = format === detectedFormat.value ? null : format;
};

watch(
  () => props.text,
  () => {
    visible.value = false;
    showRaw.value = false;
    scheduleDeferredMount();
  }
);

onMounted(() => {
  scheduleDeferredMount();
});

onBeforeUnmount(() => {
  cancelDeferredMount?.();
});
</script>

<style scoped>
.text-block {
  margin: 0;
  position: relative;
}

.text-block-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -2px;
  position: relative;
  z-index: 5;
}

/* 
   新的一层：.text-block-body 
   作为 定位锚点 (position: relative) 
*/
.text-block-body {
  position: relative; /* 关键 */
  border-radius: 6px;
  /* 可以在这里加 border，或者由内部组件负责 */
}
.text-block-body:hover {
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.6);
}

/* 
   .scroll-content
   只负责滚动和高度限制，不负责按钮定位 
*/
.scroll-content {
  position: relative;
  /* 给悬浮按钮预留最小高度，避免短文本块 hover 时按钮下沿溢出。 */
  min-height: 40px;
  height: auto;
  overflow: visible; /* 默认显示全部 */
  transition: box-shadow 0.2s;
  
  /* 
     为了防止右上角的文字被按钮完全遮死导致无法阅读，
     可以给内容加一点右内边距，或者不做处理（仅靠按钮的半透明背景）
     padding-right: 20px; 
  */
}

/* 滚动模式 */
.scroll-content.scroll-mode {
  max-height: min(50vh, 400px);
  overflow-y: auto; /* 超出滚动 */
  
  /* 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.scroll-content.scroll-mode::-webkit-scrollbar {
  width: 6px;
}
.scroll-content.scroll-mode::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

/* 
   悬浮按钮组
   现在相对于 .text-block-body 绝对定位
   无论 scroll-content 怎么滚，它都定在右上角不动
*/
.floating-buttons {
  position: absolute; /* 绝对定位，脱离文档流 */
  top: 6px;
  right: 6px;
  
  display: flex;
  gap: 4px;
  
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
  pointer-events: none;
  
  /* 半透明背景，确保按钮下方的文字不干扰按钮图标显示 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  padding: 2px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.floating-buttons.visible {
  opacity: 1;
  pointer-events: auto;
}

/* 
   通用 Header 样式 (保持不变) 
*/
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: auto;
}
.view-raw-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.view-raw-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
}

.text-content {
  font-size: 1.5rem;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 0;
}

.deferred-placeholder {
  padding: 10px 0;
  font-size: 1.2rem;
  color: #64748b;
  font-style: italic;
}
</style>
