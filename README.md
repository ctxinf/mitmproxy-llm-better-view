<div align="center">
<img src="src/assets/icon.png" height="20" alt="icon" />
<h1>Mitmproxy LLM Better View</h1>
</div>




**A Tampermonkey script for LLM API Request/Response Visualization in mitmweb.**

<a href="docs/README_CN.md">简体中文README</a>



<details>
  <summary>Screenshots</summary>
  
  *1:*
  ![1](./docs/screenshot1.png)
  *2:*
  ![2](./docs/screenshot2.png)
  *3:*
  ![3](./docs/screenshot3.png)
</details>

## Why Do You Need This?

When using AI applications like `Claude Code` or `OpenCode`, if you can see what context these tools aggregate and input to the LLM, and what the LLM outputs in return, you will better understand how these tools work. You will also gain a clearer idea of what to provide to the LLM to get the results you want.

## Usage

### Step 1. Install mitmproxy

Make sure you have mitmproxy installed.

> mitmweb is the web-based GUI of mitmproxy.

---

### Step 2. Configure the Traffic Flow

Set up your request flow like this:

```
Your Application  →  mitmproxy  →  Target API
```

---

<details>
<summary>1) Reverse Proxy (opencode / cline / claude code / codex / cherrystudio / vercel ai sdk / others)</summary>

Use this mode when your client supports replacing API endpoint/base URL (for example: `baseURL`, `endpoint`, `api_base`).



#### 1️⃣ Configure a Reverse Proxy in mitmweb

Set up a reverse proxy in mitmweb:

![mitmweb-reverse-proxy](./docs/mitmweb-reverse-proxy.png)

#### 2️⃣ Replace Your Client Endpoint

Point your client endpoint to your mitmproxy reverse proxy address.

Generic example:

```json
{
  "baseURL": "http://localhost:9091/v1/"
}
```

> ⚠️ Note: Reverse proxy endpoint is usually **http** in local setup.

</details>

---

<details>
<summary>2) Forward Proxy</summary>

For `gemini-cli`, `codex`, or `claude code` under official subscription plans, the API baseURL endpoint is often fixed; in that case, use **Forward Proxy**.


#### 1️⃣ Follow mitmproxy certificate setup guide

Generate/install certificates by following mitmproxy docs:  
https://docs.mitmproxy.org/stable/concepts-certificates/

#### 2️⃣ Add the mitmproxy CA certificate to host trust store

Trust the mitmproxy CA on your OS (and runtime if needed), otherwise HTTPS requests may fail TLS verification.

#### 3️⃣ Export proxy env vars and run your client

```bash
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080
# optional for local loopback/no-proxy targets
export NO_PROXY=localhost,127.0.0.1
```

Then start your client in the same shell session.

</details>

---

### Step 3. Install the Tampermonkey Script



#### From GreasyFork (Recommended)

Install directly from:  
https://greasyfork.org/scripts/540917-mitmproxy-llm-better-view

#### Manual Installation

Download from the release page and install it manually.

> If mitmweb is not running on ports `8081` or `9090`, you **must** update the matching URL inside the Tampermonkey script.

1. Install the Tampermonkey script  
2. Open mitmweb in your browser  

#### Add user match rules (if needed)
If your mitmweb is **not** running on `localhost:8081` or `localhost:9091`, you must manually add a user matching rule in the Tampermonkey script, for example:

<img height="695" alt="add user matching rule" src="https://github.com/user-attachments/assets/2cd441cd-1218-4389-9951-48006f81fa89" />



---

### Step 4. Use and View

Once everything is configured:

1. mitmproxy should capture the requests.
2. Click any captured request.
3. You will see the enhanced panel on the right side.

![view](./docs/view.png)



## Features

- **Request/Response Visualization**: Formatted display of messages, tools, and metadata
- **Multi-Platform Support**: OpenAI Chat Completion, Claude, and Gemini
- **SSE Support**: Handles streaming responses
- **Collapsible Sections**: Fold/unfold messages and tool calls


## Support
- openai
  - /chat/completion api
- gemini
  - /v1beta api
- claude
  - /v1/messages api

### TODO
- Ollama API
- OpenAI Response API


## Notes

This is developed and tested based on the author's usage patterns. It may not cover all API usage scenarios. Please submit an ISSUE to add support for uncovered parameters/types.



## Related Projects

- [mitmproxy](https://mitmproxy.org/) - An interactive TLS-capable intercepting HTTP proxy
- [Tampermonkey](https://www.tampermonkey.net/) - The world's most popular userscript manager
- If you do not want to install the tampermonkey script, you can also use this to visualize req/res online: [ai-api-visualizer](https://github.com/slow-groovin/ai-api-visualizer)
