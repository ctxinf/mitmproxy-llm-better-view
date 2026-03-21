<div align="center">
<img src="../src/assets/icon.png" height="20" alt="icon" />
<h1>Mitmproxy LLM Better View</h1>
</div>

**一个用于在 mitmweb 中可视化大模型 API 请求/响应的 Tampermonkey 脚本。**

<a href="../README.md">English README</a>

<details>
  <summary>截图</summary>

  *1:*
  ![1](./screenshot1.png)
  *2:*
  ![2](./screenshot2.png)
  *3:*
  ![3](./screenshot3.png)
</details>

## 为什么需要这个？

当使用 `Claude Code` 或 `OpenCode` 等 AI 应用时，如果你能看到这些工具聚合了什么上下文输入给 LLM，以及 LLM 输出了什么，你就能更好地理解这些工具的工作原理。你也会更清楚地知道该向 LLM 提供什么来获得想要的结果。

## 使用方法

### 步骤 1. 安装 mitmproxy

确保你已安装 mitmproxy。

> mitmweb 是 mitmproxy 的基于 Web 的 GUI。

---

### 步骤 2. 配置流量

按如下方式设置请求流：

```
你的应用  →  mitmproxy  →  目标 API
```

---

<details>
<summary>1) 反向代理（opencode / cline / claude code / codex / cherrystudio / vercel ai sdk / 其他）</summary>

当你的客户端支持替换 API endpoint/base URL（例如 `baseURL`、`endpoint`、`api_base`）时，使用这种方式。



#### 1️⃣ 在 mitmweb 中配置反向代理

在 mitmweb 中设置反向代理：

![mitmweb-reverse-proxy](./mitmweb-reverse-proxy.png)

#### 2️⃣ 替换你的客户端端点

将客户端端点改为 mitmproxy 的反向代理地址。

通用示例：

```json
{
  "baseURL": "http://localhost:9091/v1/"
}
```

> ⚠️ 注意：本地场景下反向代理端点通常是 **http**。

</details>

---

<details>
<summary>2) 正向代理</summary>

对于 `gemini-cli`、`codex`、`claude code` 使用官方会员订阅套餐的场景，API baseURL 端点通常不可改，这种情况下使用**正向代理**方案。


#### 1️⃣ 按 mitmproxy 文档完成证书配置

按 mitmproxy 文档生成/安装证书：  
https://docs.mitmproxy.org/stable/concepts-certificates/

#### 2️⃣ 将 mitmproxy CA 证书加入主机信任

在你的操作系统（必要时包括运行时环境）中信任 mitmproxy CA，否则 HTTPS 请求可能因 TLS 校验失败。

#### 3️⃣ 导出代理环境变量并启动客户端

```bash
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080
# 可选：本地回环地址不走代理
export NO_PROXY=localhost,127.0.0.1
```

然后在同一个 shell 会话里启动你的客户端。

</details>

---

### 步骤 3. 安装 Tampermonkey 脚本


#### 从 GreasyFork 安装（推荐）

直接从以下地址安装：  
https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view

#### 手动安装

从发布页面下载并手动安装。

> 如果 mitmweb 没有运行在 `8081` 或 `9090` 端口，你**必须**更新 Tampermonkey 脚本内的匹配 URL。

1. 安装 Tampermonkey 脚本  
2. 在浏览器中打开 mitmweb  

#### 添加url匹配规则
如果你的 mitmweb **没有** 运行在 `localhost:8081` 或 `localhost:9091`，你必须在 Tampermonkey 脚本的设置中手动添加用户匹配规则，例如：

<img height="695" alt="add user matching rule" src="https://github.com/user-attachments/assets/2cd441cd-1218-4389-9951-48006f81fa89" />


---


### 步骤 4. 使用和查看

一切配置完成后：

1. mitmproxy 应该会捕获请求。
2. 点击任何捕获的请求。
3. 你会在右侧看到增强面板。

![view](./view.png)

## 功能特性

- **请求/响应可视化**：格式化显示消息、工具和元数据
- **多平台支持**：OpenAI Chat Completion、Claude 和 Gemini
- **SSE 支持**：处理流式响应
- **可折叠区域**：折叠/展开消息和工具调用

## 支持

- openai
  - /chat/completion api
- gemini
  - /v1beta api
- claude
  - /v1/messages api

### TODO
- Ollama API
- OpenAI Response API

## 说明

本功能依靠作者使用方式进行测试开发，无法覆盖到所有 API 使用场景，欢迎提 ISSUE 增加对未覆盖的参数/类型的支持。

## 相关项目

- [mitmproxy](https://mitmproxy.org/) - 一个交互式的支持 TLS 拦截的 HTTP 代理
- [Tampermonkey](https://www.tampermonkey.net/) - 世界上最流行的用户脚本管理器
- 如果你不想安装 tampermonkey 脚本，你也可以使用这个在线可视化请求/响应：[ai-api-visualizer](https://github.com/ctxinf/ai-api-visualizer)
