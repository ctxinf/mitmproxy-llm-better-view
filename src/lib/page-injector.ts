import { createApp, type App as VueApp, type Component } from 'vue';
import Dashboard from '../pages/Dashboard.vue';
import { logger } from './logtape';

const CONTAINER_ID = 'mitmproxy-llm-better-view-dash-container';
let mountedApp: VueApp<Element> | null = null;

export type PageInjectorOptions = {
  component?: Component;
  props?: Record<string, any>;
};

/**
 * 初始化页面注入器，将Vue组件挂载到目标容器
 */
export function initPageInjector(options?: PageInjectorOptions) {
  const component = options?.component || Dashboard;
  const props = options?.props || {};

  // Step 1: ensure host container exists in mitmweb page.
  ensureContainer();
  // Step 2: remount dashboard app with latest props/data context.
  mountVueApp(component, props);
}

/**
 * 确保容器元素存在，不存在则创建
 */
function ensureContainer() {
  if (document.getElementById(CONTAINER_ID)) return;

  const contentview = document.querySelector('.contentview');
  if (!contentview) {
    logger.warn("no `.contentview` element found");
    return;
  }
  
  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  const firstChild = contentview.childNodes[0];
  contentview.insertBefore(container, firstChild);
}

/**
 * 挂载Vue应用到容器
 */
function mountVueApp(component: Component, props: Record<string, any>) {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;

  // Step 1: fully unmount previous Vue app to release effects/watchers.
  unmountCurrentApp();
  // Step 2: clear stale DOM left by previous mount.
  container.replaceChildren();
  // Step 3: mount a fresh app instance for current flow.
  const app = createApp(component, props);
  app.mount(container);
  mountedApp = app;
}

function unmountCurrentApp() {
  if (!mountedApp) return;
  mountedApp.unmount();
  mountedApp = null;
}

/**
 * 销毁页面注入器，清理资源
 */
export function destroyPageInjector() {
  // Step 1: unmount Vue app instance first.
  unmountCurrentApp();

  // Step 2: remove container node from host page.
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  container.replaceChildren();
  container.remove();
}

export const initDashboardInjector = initPageInjector;
export const destroyDashboardInjector = destroyPageInjector;
