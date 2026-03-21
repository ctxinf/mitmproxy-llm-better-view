import { unsafeWindow } from '$';
import { CallAction, Flow } from '../types/flow';
// import { logger } from './logtape';

export type HookFunc = (type: 'request' | 'response', text: any, flow: Flow) => DocumentFragment | HTMLElement | null | void;
type Dispose = () => void;

const originalFetch = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).fetch;
// 统一使用 `location.origin`，避免把 schema 写死为 `http://`（mitmweb 也可能是 https）。
const flowApiBaseUrl = location.origin;
let activeListenerDispose: Dispose | null = null;

export function initRouteListener(hook: HookFunc): Dispose {
  // Step 1: prevent stacked listeners from repeated init calls.
  activeListenerDispose?.();

  // 处理单个 flow action 的逻辑
  const handleFlowAction = async ({ uuid, action }: CallAction) => {
    const flow = await getFlow(uuid);
    if (!flow) {
      return;
    }

    const dataUrl = `${flowApiBaseUrl}/flows/${uuid}/${action}/content/Auto.json`;
    const data = await getFlowData(dataUrl);
    hook(action, data, flow);
  };

  // 初始化时检查当前 URL
  const currentFlow = extractFlowInfo(location.href);
  if (currentFlow) {
    handleFlowAction(currentFlow);
  }

  // 监听 URL 变化
  // Step 2: attach URL listeners and keep a disposer.
  const stopListening = listenUrlChange(handleFlowAction);

  const dispose = () => {
    // Step 3: restore history methods and remove popstate listener.
    stopListening();
    if (activeListenerDispose === dispose) {
      activeListenerDispose = null;
    }
  };
  activeListenerDispose = dispose;
  return dispose;
}

function extractFlowInfo(url: string): CallAction | null {
  const regex = /#\/flows\/([0-9a-fA-F\-]{36})\/(request|response)/;
  const match = url.match(regex);

  if (match) {
    const [, uuid, action] = match;
    return { uuid, action: action as 'request' | 'response' };
  }
  return null;
}

function listenUrlChange(hook?: (flow: CallAction) => void): Dispose {
  let currentUrl = location.href;

  function onUrlChange() {
    if (location.href !== currentUrl) {
      const flow = extractFlowInfo(location.href);
      if (flow) {
        hook?.(flow);
      }
      currentUrl = location.href;
    }
  }

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onUrlChange();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onUrlChange();
  };

  window.addEventListener('popstate', onUrlChange);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', onUrlChange);
  };
}

function getFlow(uuid: string): Promise<Flow | null> {
  return originalFetch(`${flowApiBaseUrl}/flows`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch flow with uuid ${uuid}`);
      }
      return res.json();
    })
    .then((flowArray: Flow[]) => {
      return flowArray.find(flow => flow.id === uuid) || null;
    });
}

function getFlowData(dataUrl: string): Promise<any> {
  return originalFetch(new Request(dataUrl))
    .then(resp => resp.json());
}
