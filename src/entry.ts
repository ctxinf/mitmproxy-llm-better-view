import { toast } from "vue-sonner";
import { logger } from "./lib/logtape";
import { destroyPageInjector, initPageInjector } from "./lib/page-injector";
import { HookFunc, initRouteListener } from "./lib/pipeline";
import { isAnthropicReq, isAnthropicRes, isGeminiReq, isGeminiRes, isOpenAIReq, isOpenAIRes, isOpenAIResponsesReq, isOpenAIResponsesRes, isSSE } from "./llm/judge";
import { useCurrentFlowStore } from "./store/llm";
import type { ApiStandard, DataType } from "./types/flow";

import DashboardGate from './pages/DashboardGate.vue';

type Dispose = () => void;

export function useEntry() {
  const { setLLMData, setUnknownLLMData } = useCurrentFlowStore();
  let activeDispose: Dispose | null = null;

  // Hook function for processing LLM requests/responses
  const handleLLMData: HookFunc = (type, flowData, flow) => {
    logger.debug`Detected request/response ${{ type, flowData, flow }}`;
    try {
      let standard: ApiStandard | null = null;
      let dataType: DataType | null = null;
      const dataAsText = flowData.text;

      // Detect platform and view type.
      // Responses API 优先识别，避免被 chat/completions 逻辑吞掉。
      if (isOpenAIResponsesReq(type, dataAsText, flow)) {
        standard = 'openai-response';
        dataType = 'request';
      } else if (isOpenAIResponsesRes(type, dataAsText, flow)) {
        standard = 'openai-response';
        // Responses API 支持 SSE 与 JSON 两种响应形式。
        dataType = isSSE(flow) ? 'sse' : 'response';
      } else if (isOpenAIReq(type, dataAsText, flow)) {
        standard = 'openai';
        dataType = 'request';
      } else if (isOpenAIRes(type, dataAsText, flow)) {
        standard = 'openai';
        if (isSSE(flow)) {
          dataType = 'sse';
        } else {
          dataType = 'response';
        }
      } else if (isAnthropicReq(type, dataAsText, flow)) {
        standard = 'claude';
        dataType = 'request';
        toast('Claude Request detected');
      } else if (isAnthropicRes(type, dataAsText, flow)) {
        standard = 'claude';
        if (isSSE(flow)) {
          dataType = 'sse';
        } else {
          dataType = 'response';
        }
      } else if (isGeminiReq(type, dataAsText, flow)) {
        standard = 'gemini';
        dataType = 'request';
      } else if (isGeminiRes(type, dataAsText, flow)) {
        standard = 'gemini';
        if (isSSE(flow)) {
          dataType = 'sse';
        } else {
          dataType = 'response';
        }
      }

      if (standard && dataAsText && dataType) {
        setLLMData(standard, dataType, dataAsText, flow);

        logger.info`Dashboard data updated  ${{ standard: standard, view: dataType }}`;

        initPageInjector({
          component: DashboardGate,
        });
      } else {
        // 未识别场景也挂载 dashboard，允许用户手动选择标准后强制渲染。
        const fallbackDataType: DataType = type === 'request'
          ? 'request'
          : (isSSE(flow) ? 'sse' : 'response');
        setUnknownLLMData(
          fallbackDataType,
          flow,
          typeof dataAsText === 'string' ? dataAsText : undefined
        );
        initPageInjector({
          component: DashboardGate,
        });
        logger.warn('Unknown type or no data', { type, hasData: !!dataAsText });
      }
    } catch (error) {
      logger.error(error as Error);
      toast('Error processing request');
    }

    // Keep original mitmweb response panel untouched.
    return null;
  };

  // Initialize route listener
  return {
    init: () => {
      // Step 1: cleanup previous runtime hooks before re-init.
      activeDispose?.();

      // Step 2: attach route listener.
      const disposeRouteListener = initRouteListener(handleLLMData);

      // Step 3: return one unified cleanup function for caller.
      activeDispose = () => {
        disposeRouteListener();
        destroyPageInjector();
        activeDispose = null;
      };
      return activeDispose;
    }
  };
}
