# 小说转动漫前端

基于 React 的 Web 应用程序，将小说转换为动漫风格的视觉体验，包含图像、旁白和角色语音。

## 功能特性

- ✅ **小说上传**：提交文本内容转换为动漫格式
- ✅ **任务管理**：实时监控转换进度和状态更新
- ✅ **动漫播放器**：查看生成的场景，包含图像、旁白和对话
- ✅ **音频播放**：播放角色对话的语音音频
- ✅ **场景导航**：通过键盘快捷键和缩略图导航场景
- ✅ **响应式设计**：支持桌面、平板和移动设备

## 技术栈

- **前端框架**：React 18 + TypeScript
- **样式**：Tailwind CSS
- **状态管理**：React Context API + useReducer
- **路由**：React Router DOM
- **HTTP 客户端**：Axios
- **构建工具**：Vite

## 快速开始

### 环境要求

- Node.js 16+ 和 npm
- 后端 API 服务器运行中（参见后端文档）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd novel-to-anime-frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   编辑 `.env` 文件，更新 `VITE_API_BASE_URL` 指向你的后端 API 服务器地址。

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   在浏览器中打开 http://localhost:5173

### 生产环境构建

```bash
npm run build
```

构建文件将输出到 `dist` 目录。

## 完整运行指南

### 1. 启动后端服务

首先需要启动后端 API 服务：

```bash
# 在项目根目录
cd /path/to/txt-anime

# 构建后端服务
go build -o novel2comicd ./cmd/novel2comicd

# 启动后端服务（确保已配置 config.json）
./novel2comicd -config config.json
```

后端服务默认运行在 `http://localhost:8080`

### 2. 启动前端服务

```bash
# 进入前端目录
cd novel-to-anime-frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

前端服务运行在 `http://localhost:5173`

### 3. 环境配置

确保 `.env` 文件中的 API 地址正确：

```env
VITE_API_BASE_URL=http://localhost:8080
```

## API 接口配置

应用程序需要后端 API 提供以下接口：

- `POST /v1/tasks/` - 创建转换任务
- `GET /v1/tasks/` - 获取所有任务
- `GET /v1/tasks/:id` - 获取任务详情
- `GET /v1/tasks/:id/artifacts` - 获取动漫内容

详细的请求/响应格式请参见 API 文档。

## 使用说明

1. **上传小说**：在上传表单中粘贴小说文本，点击"生成动漫"
2. **监控进度**：在侧边栏查看任务状态 - 处理中的任务显示"doing"
3. **观看动漫**：任务完成后（状态为"done"），点击任务查看生成的动漫
4. **场景导航**：使用方向键、导航按钮或缩略图网格在场景间切换
5. **播放音频**：点击角色对话播放生成的语音

## 键盘快捷键

- `←` / `→` - 在场景间导航
- `Home` - 跳转到第一个场景
- `End` - 跳转到最后一个场景

## 项目结构

```
src/
├── components/          # 可复用的 UI 组件
│   ├── common/         # 通用组件
│   ├── novel/          # 小说上传组件
│   ├── task/           # 任务管理组件
│   └── anime/          # 动漫播放组件
├── pages/              # 主要应用页面
├── hooks/              # 自定义 React Hooks
├── services/           # API 服务层
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── context/            # React Context 提供者
```

## 开发

### 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行 ESLint

### 代码规范

项目使用：
- TypeScript 提供类型安全
- ESLint 进行代码检查
- Tailwind CSS 进行样式设计
- 函数式组件和 Hooks

## 故障排查

### 前端启动失败

- 检查 Node.js 版本是否为 16+
- 确保已运行 `npm install`
- 检查端口 5173 是否被占用

### 无法连接后端

- 确认后端服务是否运行在 `http://localhost:8080`
- 检查 `.env` 文件中的 `VITE_API_BASE_URL` 配置
- 检查网络连接和防火墙设置

### 任务创建失败

- 确认后端服务正常运行
- 检查后端配置（MongoDB、AI API 密钥等）
- 查看浏览器开发者工具的网络请求

## 贡献指南

1. 遵循现有的代码风格和模式
2. 为新功能添加 TypeScript 类型
3. 充分测试你的更改
4. 根据需要更新文档

## 许可证

MIT