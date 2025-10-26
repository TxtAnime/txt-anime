# txt-anime - 小说动漫生成器

自动根据小说生成动漫的智能工具

## 📖 项目简介

这是一个Hackathon项目,目标是将文本小说自动转换成动漫形式。通过AI大模型的能力,将小说的理解、场景拆分、角色视觉化、语音合成等环节自动化,最终生成"图配文+声音"的动漫作品。

## ✨ 核心特性

- ✅ **角色一致性**: 同一角色在整个动漫中保持视觉一致性  
- ✅ **场景化改编**: 自动将小说拆分成适合展示的场景  
- ✅ **结构化输出**: 生成标准JSON格式,便于后续处理  
- ✅ **一键生成**: 单次API调用完成剧本改编和角色设计  
- ✅ **Web界面**: 提供友好的前端界面进行任务管理和动漫播放
- ✅ **异步处理**: 后台异步任务处理,支持长时间运行
- ✅ **云存储**: 自动上传产物到七牛云OSS

## 🌐 在线演示

**公司内网测试环境**: http://10.213.246.130/

> 📌 注意: 此地址仅限公司内网访问

**演示视频**: http://saxphp720.hb-bkt.clouddn.com/001.mov

> 🎥 查看完整功能演示和使用流程

## 🏗️ 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Web 前端界面    │ ◄────► │   命令行工具      │          │
│  │  (React + TS)    │         │   (Go CLI)       │          │
│  └──────────────────┘         └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         │                  │
                         ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      应用服务层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          novel2comicd 后端服务 (HTTP API)            │   │
│  │  - RESTful API 接口                                  │   │
│  │  - 异步任务调度器                                     │   │
│  │  - 产物上传管理                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心业务层 (pkgs)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ novel2script │  │  storyboard  │  │  audiosync   │      │
│  │  剧本生成     │  │  分镜生成     │  │  语音合成     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              finalassembly (视频合成)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    基础设施层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │   七牛云OSS   │  │  AI API服务  │      │
│  │  数据持久化   │  │  文件存储     │  │  (LLM/图像)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 工作流程

```
小说文本
   │
   ▼
1. novel2script (剧本生成)
   │ ├─ AI理解小说内容
   │ ├─ 场景拆分和对话提取
   │ └─ 角色描述生成
   │
   ▼
2. storyboard (分镜生成)
   │ ├─ 为每个场景生成图片
   │ └─ 保持角色视觉一致性
   │
   ▼
3. audiosync (语音合成)
   │ ├─ AI智能音色匹配
   │ └─ 为每句对话生成语音
   │
   ▼
4. finalassembly (视频合成) [可选]
   │ ├─ 合并音频和图片
   │ ├─ 生成字幕文件
   │ └─ 输出完整视频
   │
   ▼
动漫作品 (图片 + 音频 + 视频)
```

## 📦 模块规格

### 前端模块 (novel-to-anime-frontend)

**技术栈**: React 18 + TypeScript + Vite + Tailwind CSS

**主要功能**:
- 小说上传和任务创建
- 实时任务状态监控
- 动漫场景播放器
- 音频播放控制
- 响应式UI设计

**详细文档**: [novel-to-anime-frontend/README.md](novel-to-anime-frontend/README.md)

### 后端服务 (cmd/novel2comicd)

**技术栈**: Go 1.24.1 + MongoDB + 七牛云SDK

**主要功能**:
- RESTful API接口
- 异步任务处理
- 数据持久化
- 产物上传管理
- 健康检查端点

**详细文档**: [cmd/novel2comicd/README.md](cmd/novel2comicd/README.md)

### 核心包 (pkgs/)

#### 1. novel2script - 剧本生成

**功能**: 将小说文本转换为结构化剧本和角色描述

**输入**: 小说文本
**输出**: JSON格式的场景列表和角色描述

**核心函数**: `Process(novelText string, cfg Config) (*Response, error)`

#### 2. storyboard - 分镜生成

**功能**: 为场景生成动漫风格图片

**输入**: 场景描述 + 角色信息
**输出**: PNG格式图片

**核心函数**: 
- `GenerateImage(scene Scene, characters map[string]string, cfg Config) ([]byte, error)`
- `SaveImage(imageData []byte, filename string) error`

#### 3. audiosync - 语音合成

**功能**: 为角色对话生成语音并自动匹配音色

**输入**: 剧本数据
**输出**: MP3格式音频文件 + 音色匹配配置

**核心函数**: `Process(scriptData ScriptData, outputDir string, cfg Config) error`

**特性**:
- AI智能音色匹配
- 支持23种内置音色
- 规则fallback匹配

#### 4. finalassembly - 视频合成

**功能**: 将图片、音频、字幕合成为完整视频

**输入**: 图片目录 + 音频目录 + 剧本数据
**输出**: MP4格式视频文件

**核心函数**: `Process(scriptData ScriptData, imageDir, audioDir, outputVideo string, cfg Config) error`

**详细文档**: [pkgs/README.md](pkgs/README.md)

## 🚀 如何运行程序

### 方式一: 本地机器部署 (推荐)

适用于快速启动完整的 Web 服务（前端 + 后端），直接在本地机器运行，无需 Docker

```bash
# 1. 准备配置文件
cp config.json.example cmd/novel2comicd/config.json
# 编辑 cmd/novel2comicd/config.json，填入你的 API 密钥等配置

# 2. 启动 MongoDB (如果使用本地 MongoDB)
mongod --dbpath ./data/db

# 3. 一键部署 (构建并启动后端和前端)
./deploy.sh

# 部署完成后访问
# - 前端界面: http://localhost:3000
# - 后端API: http://localhost:8080
# - API文档: http://localhost:8080/swagger/index.html
# - 内网测试环境: http://10.213.246.130/ (仅限公司内网)
```

**停止服务**:
```bash
./stop.sh
```

**查看日志**:
```bash
# 后端日志
tail -f backend.log

# 前端日志  
tail -f frontend.log
```

**验证部署**:
```bash
# 验证输出路径和 API 访问
./scripts/verify-output-path.sh

# 测试图片访问
./scripts/test-image-access.sh

# 测试两种部署模式
./scripts/test-deployment-modes.sh

# 完整健康检查
./scripts/health-check-local.sh
```

### 方式二: 手动启动服务

#### 步骤1: 启动后端服务

```bash
# 构建后端
go build -o novel2comicd ./cmd/novel2comicd

# 启动后端 (确保 MongoDB 已运行)
./novel2comicd -config config.json
```

后端服务将运行在 `http://localhost:8080`

#### 步骤2: 启动前端服务

```bash
# 进入前端目录
cd novel-to-anime-frontend

# 安装依赖 (首次运行)
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，确保 VITE_API_BASE_URL=http://localhost:8080

# 启动前端开发服务器
npm run dev
```

前端服务将运行在 `http://localhost:5173`

### 方式三: 使用命令行工具

适用于批处理或自动化场景

#### 完整流程示例

```bash
# 1. 生成剧本
go run ./cmd/novel2script/main.go \
  -input demo-story.txt \
  -output script.json

# 2. 生成图片
go run ./cmd/storyboard/main.go \
  -script script.json \
  -output images/

# 3. 生成语音
go run ./cmd/audiosync/main.go \
  -script script.json \
  -output audio/

# 4. 合成视频 (可选)
go run ./cmd/finalassembly/main.go \
  -script script.json \
  -images images/ \
  -audio audio/ \
  -output final.mp4
```

#### 快速测试

```bash
# 使用演示脚本
./demo.sh

# 查看生成的产物
ls -la outputs/
```

### 方式四: Kubernetes 部署

适用于生产环境

```bash
# 部署到 Kubernetes
./deploy.sh k8s

# 查看服务状态
kubectl get pods -n txt-anime
kubectl get svc -n txt-anime
```

## ⚙️ 配置说明

### 必需配置项

编辑 `config.json`:

```json
{
  "server": {
    "port": 8080
  },
  "mongodb": {
    "uri": "mongodb://localhost:27017",
    "database": "novel2comic",
    "collection": "tasks"
  },
  "ai": {
    "base_url": "https://openai.qiniu.com/v1",
    "api_key": "YOUR_API_KEY_HERE",          // 必填
    "text_model": "deepseek-v3",
    "image_model": "gemini-2.5-flash-image"
  },
  "qiniu": {
    "access_key": "YOUR_QINIU_AK",           // 必填
    "secret_key": "YOUR_QINIU_SK",           // 必填
    "bucket": "novel2comic",
    "domain": "http://your-cdn-domain.com"   // 必填
  },
  "tts_provider": "tencent",
  "tencent_tts": {
    "secret_id": "YOUR_TENCENT_ID",          // 必填
    "secret_key": "YOUR_TENCENT_KEY",        // 必填
    "region": "ap-guangzhou"
  },
  "storage": {
    "output_dir": "./outputs"
  }
}
```

### 前端环境变量

编辑 `novel-to-anime-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 📋 环境要求

### 后端依赖

- **Go**: 1.24.1+
- **MongoDB**: 5.0+
- **FFmpeg**: 4.0+ (用于视频合成)
- **操作系统**: Linux / macOS / Windows

### 前端依赖

- **Node.js**: 16+
- **npm**: 7+

### 第三方服务

- **AI API**: 支持 OpenAI 兼容接口的服务
- **七牛云**: 用于存储产物文件
- **腾讯云TTS**: 语音合成服务

## 🧪 测试和验证

```bash
# 健康检查
./health-check.sh

# 集成测试
node test-integration.js

# 完整部署测试
node test-full-deployment.js
```

## 📁 项目结构

```
txt-anime/
├── cmd/                          # 命令行工具和服务
│   └── novel2comicd/            # 后端HTTP服务
├── pkgs/                        # 可复用核心包
│   ├── novel2script/           # 剧本生成
│   ├── storyboard/             # 分镜生成
│   ├── audiosync/              # 语音合成
│   └── audiosynctc/            # 腾讯云TTS版本
├── novel-to-anime-frontend/    # React前端应用
├── k8s/                        # Kubernetes配置
├── outputs/                    # 本地产物输出目录
├── config.json.example         # 配置文件模板
├── deploy.sh                   # 一键部署脚本
├── cleanup.sh                  # 清理脚本
├── demo.sh                     # 演示脚本
└── README.md                   # 本文档
```

## 🔍 API 接口

### 创建任务
```bash
POST /v1/tasks/
Content-Type: application/json

{
  "name": "流浪地球",
  "novel": "我没见过黑夜，我没见过星星..."
}
```

### 获取任务状态
```bash
GET /v1/tasks/:id
```

### 获取任务产物
```bash
GET /v1/tasks/:id/artifacts
```

### 获取任务列表
```bash
GET /v1/tasks/
```

详细 API 文档: http://localhost:8080/swagger/index.html

## 🛠️ 故障排查

### 后端启动失败

- 检查 MongoDB 是否运行: `mongosh`
- 检查配置文件是否正确
- 检查端口 8080 是否被占用

### 前端无法连接后端

- 确认后端服务运行在 `http://localhost:8080`
- 检查 `.env` 文件中的 `VITE_API_BASE_URL`
- 检查浏览器控制台网络请求

### 任务一直处于 doing 状态

- 查看后端日志输出
- 检查 AI API 密钥是否有效
- 检查网络连接
- 确认七牛云配置正确

### 视频合成失败

- 确认已安装 FFmpeg: `ffmpeg -version`
- 检查磁盘空间
- 查看日志中的具体错误信息

## 👥 模块分工

| 模块 | 责任 | 输入 | 输出 | 状态 |
|------|------|------|------|------|
| **novel2script** | 剧本改编 | 小说文本 | JSON格式剧本 | ✅ 完整 |
| **storyboard** | 图片生成 | 场景+角色 | PNG图片 | ✅ 完整 |
| **audiosync** | 语音合成 | 对话文本 | MP3音频 | ✅ 完整 |
| **finalassembly** | 视频合成 | 图片+音频 | MP4视频 | ✅ 完整 |
| **novel2comicd** | HTTP服务 | API请求 | 异步任务 | ✅ 完整 |
| **frontend** | Web界面 | 用户交互 | 可视化展示 | ✅ 完整 |

## 📚 相关文档

- [前端详细文档](novel-to-anime-frontend/README.md)
- [后端服务文档](cmd/novel2comicd/README.md)
- [核心包文档](pkgs/README.md)
- [本地部署文档](LOCAL_DEPLOYMENT.md)
- [部署文档](README_DEPLOY.md)
- [Kubernetes部署](k8s/README.md)

## 🤝 贡献指南

1. 遵循现有代码风格
2. 为新功能添加文档
3. 充分测试你的更改
4. 提交前运行测试

## 📄 License

MIT
