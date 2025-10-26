# 本地机器部署指南

本文档介绍如何在本地机器上直接部署和运行 txt-anime 项目，无需 Docker。

## 🚀 快速开始

### 1. 环境准备

确保你的系统已安装以下工具：

- **Go**: 1.24.1+
- **Node.js**: 16+
- **npm**: 7+
- **MongoDB**: 5.0+ (可选，也可使用云数据库)

### 2. 配置文件准备

```bash
# 复制配置文件模板
cp config.json.example cmd/novel2comicd/config.json

# 编辑配置文件，填入你的 API 密钥
vim cmd/novel2comicd/config.json
```

必需配置项：
- `ai.api_key`: AI 服务 API 密钥
- `qiniu.access_key`: 七牛云 Access Key
- `qiniu.secret_key`: 七牛云 Secret Key
- `qiniu.domain`: 七牛云 CDN 域名
- `tencent_tts.secret_id`: 腾讯云 Secret ID
- `tencent_tts.secret_key`: 腾讯云 Secret Key

### 3. 启动 MongoDB (如果使用本地数据库)

```bash
# 创建数据目录
mkdir -p ./data/db

# 启动 MongoDB
mongod --dbpath ./data/db
```

### 4. 一键部署

```bash
# 构建并启动所有服务
./deploy.sh
```

部署脚本会自动：
1. 检查必要工具是否安装
2. 构建后端 Go 程序
3. 安装前端依赖并构建
4. 启动后端服务 (端口 8080)
5. 启动前端服务 (端口 3000)

### 5. 访问服务

- **前端界面**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **API 文档**: http://localhost:8080/swagger/index.html

## 🛠️ 管理服务

### 停止服务

```bash
./stop.sh
```

### 查看服务状态

```bash
./health-check-local.sh
```

### 查看日志

```bash
# 后端日志
tail -f backend.log

# 前端日志
tail -f frontend.log
```

### 重启服务

```bash
# 停止并重新启动
./stop.sh && ./deploy.sh
```

## 🔧 手动操作

如果需要手动控制服务：

### 手动启动后端

```bash
# 构建后端
go build -o novel2comicd ./cmd/novel2comicd

# 启动后端
cd cmd/novel2comicd
../../novel2comicd
```

### 手动启动前端

```bash
cd novel-to-anime-frontend

# 安装依赖 (首次)
npm install

# 构建前端
npm run build

# 启动前端服务
npx serve -s dist -l 3000
```

## 🐛 故障排查

### 后端启动失败

1. **检查配置文件**:
   ```bash
   cat cmd/novel2comicd/config.json
   ```

2. **检查 MongoDB 连接**:
   ```bash
   mongosh mongodb://localhost:27017
   ```

3. **查看后端日志**:
   ```bash
   tail -f backend.log
   ```

### 前端无法访问

1. **检查前端构建**:
   ```bash
   ls -la novel-to-anime-frontend/dist/
   ```

2. **检查端口占用**:
   ```bash
   lsof -i :3000
   ```

3. **查看前端日志**:
   ```bash
   tail -f frontend.log
   ```

### 进程管理

```bash
# 查看相关进程
ps aux | grep -E "(novel2comicd|serve.*dist)"

# 强制停止进程
pkill -f "./novel2comicd"
pkill -f "serve.*dist"
```

## 📁 文件结构

部署后会生成以下文件：

```
txt-anime/
├── novel2comicd              # 后端可执行文件
├── backend.log               # 后端日志
├── frontend.log              # 前端日志
├── cmd/novel2comicd/config.json  # 后端配置
├── novel-to-anime-frontend/
│   ├── dist/                 # 前端构建产物
│   └── .env                  # 前端环境配置
└── outputs/                  # 任务输出目录
```

## 🔄 开发模式

如果需要开发调试：

### 后端开发模式

```bash
cd cmd/novel2comicd
go run main.go
```

### 前端开发模式

```bash
cd novel-to-anime-frontend
npm run dev
```

前端开发服务器会运行在 http://localhost:5173

## 📝 注意事项

1. **端口冲突**: 确保 3000 和 8080 端口未被占用
2. **权限问题**: 确保有写入 `outputs/` 目录的权限
3. **网络访问**: 确保能访问 AI API 和七牛云服务
4. **磁盘空间**: 确保有足够空间存储生成的图片和音频文件

## 🆘 获取帮助

如果遇到问题：

1. 运行健康检查: `./health-check-local.sh`
2. 查看日志文件: `tail -f backend.log frontend.log`
3. 检查进程状态: `ps aux | grep -E "(novel2comicd|serve)"`
4. 重启服务: `./stop.sh && ./deploy.sh`