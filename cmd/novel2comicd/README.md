# novel2comicd - 小说动漫生成服务

基于 HTTP API 的小说转动漫服务端，支持异步任务处理。

## 功能特性

- ✅ RESTful API 接口
- ✅ 异步任务处理
- ✅ MongoDB 数据持久化
- ✅ 七牛云 OSS 产物存储
- ✅ 自动集成 novel2script + storyboard + audiosync

## 快速开始

### 1. 准备环境

确保已安装：
- Go 1.24.1+
- MongoDB
- 七牛云账号（用于存储产物）

### 2. 配置服务

复制配置文件模板：

```bash
cp config.json.example config.json
```

编辑 `config.json`，填入你的配置：

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
    "api_key": "your-api-key-here",
    "text_model": "deepseek-v3",
    "image_model": "gemini-2.5-flash-image"
  },
  "qiniu": {
    "access_key": "your-qiniu-access-key",
    "secret_key": "your-qiniu-secret-key",
    "bucket": "your-bucket-name",
    "domain": "https://your-cdn-domain.com"
  },
  "storage": {
    "output_dir": "./outputs"
  }
}
```

### 3. 构建服务

```bash
cd /path/to/txt-anime
go build -o novel2comicd ./cmd/novel2comicd
```

### 4. 启动服务

```bash
./novel2comicd -config config.json
```

服务默认运行在 `http://localhost:8080`

## API 接口

### 创建任务

创建一个小说转动漫任务。

```bash
POST /v1/tasks/
Content-Type: application/json

{
  "name": "流浪地球",
  "novel": "我没见过黑夜，我没见过星星..."
}
```

**响应：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 获取任务状态

查询任务的执行状态。

```bash
GET /v1/tasks/:id
```

**响应：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "流浪地球",
  "status": "doing"  // 或 "done"
}
```

### 获取任务产物

获取任务生成的场景、图片和音频 URL。

```bash
GET /v1/tasks/:id/artifacts
```

**响应：**

```json
{
  "scenes": [
    {
      "imageURL": "https://cdn.example.com/tasks/xxx/scene_001.png",
      "narration": "刹车时代结束，地球停止自转...",
      "dialogues": [
        {
          "character": "妈妈",
          "line": "孩子，我给你讲讲...",
          "voiceURL": "https://cdn.example.com/tasks/xxx/scene_001_dialogue_001.mp3"
        }
      ]
    }
  ]
}
```

### 获取任务列表

获取所有任务的列表。

```bash
GET /v1/tasks/
```

**响应：**

```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "流浪地球",
      "status": "done"
    }
  ]
}
```

## 工作流程

1. **创建任务**：用户通过 API 提交小说文本
2. **后台处理**：服务每秒检查 `doing` 状态的任务
3. **生成剧本**：调用 `novel2script` 生成场景和角色
4. **生成图片**：调用 `storyboard` 为每个场景生成图片
5. **生成音频**：调用 `audiosync` 为对话生成语音
6. **上传产物**：将图片和音频上传到七牛云
7. **更新状态**：更新任务状态为 `done`，填充 URL

## 目录结构

```
cmd/novel2comicd/
├── config.go           # 配置管理
├── config.json         # 配置文件（需自行创建）
├── config.json.example # 配置文件模板
├── db.go              # MongoDB 数据库层
├── handlers.go        # HTTP API 处理器
├── main.go            # 主入口
├── models.go          # 数据模型
├── processor.go       # 任务处理逻辑
├── qiniu.go           # 七牛云上传
└── README.md          # 本文档
```

## 本地产物

每个任务的产物会临时保存在本地：

```
./outputs/{taskID}/
├── images/
│   ├── scene_001.png
│   ├── scene_002.png
│   └── ...
└── audios/
    ├── scene_001_dialogue_001.mp3
    ├── scene_001_dialogue_002.mp3
    └── ...
```

处理完成后，这些文件会上传到七牛云。

## 注意事项

1. **MongoDB 连接**：确保 MongoDB 正在运行并可访问
2. **七牛云配置**：确保 bucket 已创建且域名已绑定
3. **API 密钥**：AI API 密钥需要有足够的配额
4. **磁盘空间**：确保有足够的空间存储临时产物
5. **任务时长**：根据小说长度，任务可能需要几分钟到十几分钟

## 测试示例

使用 curl 测试接口：

```bash
# 1. 创建任务
TASK_ID=$(curl -X POST http://localhost:8080/v1/tasks/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试小说",
    "novel": "这是一个测试故事..."
  }' | jq -r '.id')

echo "任务 ID: $TASK_ID"

# 2. 查询任务状态
curl http://localhost:8080/v1/tasks/$TASK_ID

# 3. 等待任务完成后获取产物
curl http://localhost:8080/v1/tasks/$TASK_ID/artifacts
```

## 故障排查

### 服务启动失败

- 检查 MongoDB 是否运行：`mongosh`
- 检查配置文件是否正确
- 检查端口是否被占用

### 任务一直处于 doing 状态

- 查看服务日志输出
- 检查 AI API 密钥是否有效
- 检查网络连接

### 上传失败

- 检查七牛云 AK/SK 是否正确
- 检查 bucket 和域名配置
- 检查网络连接

## License

MIT

