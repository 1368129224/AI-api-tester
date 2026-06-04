# AI API 测试工具

一个简单、自托管的 Web UI，用于测试和调试任何兼容 OpenAI 接口的 API 端点。

**[在线体验地址](https://ai-api-tester-wve8.onrender.com/)**

此工具可让您通过简洁的界面快速检查 API 的模型可用性、测试聊天补全功能并检查原始响应。它非常适合使用不同 LLM 提供商或自托管模型的开发人员。

![屏幕截图](./screenshot.png)
*(您可以将上面的 URL 替换为应用程序的真实屏幕截图)*

## 功能特点

- **多语言支持**: 支持英文和中文切换（可根据需要添加更多语言）。
- **提供商无关**: 适用于任何遵循 OpenAI `v1/chat/completions` 和 `v1/models` 格式的 API，以及原生的 Anthropic 和 Gemini API。
- **模型发现**: 获取并显示您的端点可用的模型列表。
- **请求测试**: 向任何模型发送测试消息并查看响应。
- **详细响应视图**: 检查原始 JSON 响应、提取的消息内容和 HTTP 头部信息。
- **配置管理**:
    - **保存**: 将多个 API 端点和密钥配置存储在浏览器的本地存储中。
    - **加载**: 使用下拉菜单快速切换已保存的配置。
    - **删除**: 删除不再需要的配置。
    - **导入/导出**: 轻松备份和恢复您的配置。
- **无需数据库**: 所有配置都存储在客户端浏览器中。
- **易于运行**: 一个简单的 Node.js Express 服务器托管静态前端。

## 快速开始

### 前提条件

- [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (可选，用于容器化部署)

### 安装与运行 (本地)

1.  **克隆仓库:**
    ```bash
    git clone https://github.com/your-username/api-cheak.git
    cd api-cheak
    ```

2.  **安装依赖:**
    ```bash
    npm install
    ```

3.  **启动服务器:**
    ```bash
    npm start
    # 或者使用热重载进行开发：
    npm run dev
    ```

4.  **打开应用程序:**
    在您的 Web 浏览器中打开 `http://localhost:55443`。

### 生产环境构建

构建用于生产环境的前端（将文件复制到 `dist` 目录）：

```bash
npm run build
```
当设置了 `NODE_ENV=production` 时，服务器将自动从 `dist` 目录而不是 `public` 目录提供文件。

### Docker 部署

您可以使用 Docker 轻松部署该应用程序。提供的 Dockerfile 使用多阶段构建来保持最终镜像的小巧和安全。

#### 使用 Docker CLI

1.  **构建 Docker 镜像:**
    ```bash
    docker build -t api-tester .
    ```

2.  **运行容器:**
    ```bash
    docker run -d -p 55443:55443 --name api-tester api-tester
    ```
    您还可以传递环境变量来配置超时或端口：
    ```bash
    docker run -d -p 8080:8080 -e PORT=8080 -e TIMEOUT_MS=120000 --name api-tester api-tester
    ```

#### 使用 Docker Compose

为了更简单的部署，您可以使用 Docker Compose：

1.  **在后台启动服务:**
    ```bash
    docker-compose up -d
    ```

2.  **停止服务:**
    ```bash
    docker-compose down
    ```

您可以根据需要修改 `docker-compose.yml` 文件来调整端口或环境变量。

## 配置

您可以使用 `.env` 文件配置服务器。将 `.env.example` 复制为 `.env` 并修改其中的值：

```env
HOST=0.0.0.0
PORT=55443
TIMEOUT_MS=60000
```

## 如何使用

1.  **输入 API 详情**: 填写您的 API 端点 `Base URL` (例如：`https://api.openai.com/v1`) 和您的 `API Key`。
2.  **保存配置 (可选)**: 为您的配置命名 (例如："我的 OpenAI 密钥")，然后点击 `Save Config`。它将显示在“Saved Configurations”下拉菜单中，以便将来使用。
3.  **获取模型**: 点击 `Fetch Models` 查看您的 API 密钥可用的模型列表。您可以点击列表中的任何模型来选择它。
4.  **发送请求**: 输入测试消息 (或使用默认的 "Hi")，然后点击 `Send Request`。
5.  **查看响应**: 响应状态、持续时间和主体将显示在下方。您可以在 `Raw JSON`、`Content` 和 `Headers` 选项卡之间切换以检查详细信息。

## 许可证

本项目依据 [AGPL-3.0 License](LICENSE) 开源。
