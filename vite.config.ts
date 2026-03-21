import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
   resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    vue(),
    
    monkey({
      // entry: 'src/old/index.ts',
      entry: 'src/main.ts',
      userscript: {
        name: {
          '': 'mitmproxy-llm-better-view',
          'zh-CN': 'mitmproxy-llm-better-view'
        },
        icon: 'https://s3.api2o.com/mitm-better-view.png',
        description: {
          '': 'LLM(openai, gemini, claude) API Request/Response Visualization in mitmweb.',
          'zh-CN': 'mitmweb中 可视化大模型(openai, gemini, claude)请求/响应内容 '
        },
        homepage: 'https://github.com/ctxinf/mitmproxy-llm-better-view',
        updateURL: 'https://github.com/ctxinf/mitmproxy-llm-better-view/releases/latest/download/dist-latest.js',
        downloadURL: 'https://github.com/ctxinf/mitmproxy-llm-better-view/releases/latest/download/dist-latest.js',
        namespace: 'npm/vite-plugin-monkey',
        match: [
          'http://localhost:8081/*',
          'http://127.0.0.1:8081/*',
          'http://127.0.0.1:9090/*',
          'http://127.0.0.1:8888/or_add_match_pattern_for_your_specific_mitmweb_endpoint/*'
        ],
      },
      build: {
        fileName: 'mtimweb-llm-better-view.js',
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
        },
      },
    }),
  ],
});
