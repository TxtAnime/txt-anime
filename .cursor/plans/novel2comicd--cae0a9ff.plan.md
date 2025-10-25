<!-- cae0a9ff-e797-4e7f-9872-4dfbd73cf16b dd39a5c7-65af-432a-a05c-690d349c09e6 -->
# novel2comicd 服务端实现

## 核心功能

实现一个 HTTP 服务端，将现有的命令行工具（novel2script、storyboard、audiosync）集成为 API 服务，支持异步任务处理。

## 技术栈

- Web 框架：标准库 `net/http`
- 数据库：MongoDB（使用 `go.mongodb.org/mongo-driver`）
- 对象存储：七牛云 Kodo（使用 `github.com/qiniu/go-sdk`）
- 配置：JSON 文件

## 实现步骤

### 1. 项目结构和依赖管理

在 `cmd/novel2comicd/` 下创建完整的服务端实现：

- 更新 `go.mod`，添加依赖：
  - `go.mongodb.org/mongo-driver`
  - `github.com/qiniu/go-sdk/v7`

### 2. 配置管理

创建配置文件 `config.json` 和配置加载逻辑：

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
    "api_key": "your-api-key",
    "text_model": "deepseek-v3",
    "image_model": "gemini-2.5-flash-image"
  },
  "qiniu": {
    "access_key": "your-ak",
    "secret_key": "your-sk",
    "bucket": "your-bucket",
    "domain": "https://your-cdn-domain.com"
  },
  "storage": {
    "output_dir": "./outputs"
  }
}
```

注意：`voice_type` 不需要在配置中指定，audiosync 包会通过大模型自动为每个角色选择合适的音色。

### 3. 数据模型定义

定义 Task 结构，对应 MongoDB 文档：

```go
type Task struct {
    ID     string  `bson:"_id" json:"id"`
    Name   string  `bson:"name" json:"name"`
    Novel  string  `bson:"novel" json:"novel"`
    Status string  `bson:"status" json:"status"` // "doing" 或 "done"
    Scenes []Scene `bson:"scenes" json:"scenes"`
    CreatedAt time.Time `bson:"created_at" json:"created_at"`
    UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type Scene struct {
    ImageURL   string     `bson:"image_url" json:"imageURL"`
    Narration  string     `bson:"narration" json:"narration"`
    Dialogues  []Dialogue `bson:"dialogues" json:"dialogues"`
}

type Dialogue struct {
    Character string `bson:"character" json:"character"`
    Line      string `bson:"line" json:"line"`
    VoiceURL  string `bson:"voice_url" json:"voiceURL"`
}
```

### 4. MongoDB 数据库层

实现数据库操作：

- 初始化 MongoDB 连接
- `CreateTask(task *Task)` - 插入新任务
- `GetTask(id string)` - 查询任务
- `GetTasks()` - 查询所有任务
- `UpdateTask(task *Task)` - 更新任务
- `GetDoingTasks()` - 查询所有 doing 状态的任务

### 5. HTTP API 处理器

实现 4 个 API 端点：

1. **POST /v1/tasks/** - 创建任务

   - 解析请求体 `{name, novel}`
   - 生成唯一 ID（使用 UUID）
   - 创建 Task 对象，状态为 "doing"
   - 写入数据库
   - 返回 `{id}`

2. **GET /v1/tasks/:id** - 获取任务

   - 从路径提取 ID
   - 查询数据库
   - 返回 `{id, name, status}`

3. **GET /v1/tasks/:id/artifacts** - 获取任务产物

   - 从路径提取 ID
   - 查询数据库
   - 返回 `{scenes: [{imageURL, narration, dialogues}]}`

4. **GET /v1/tasks/** - 获取任务列表

   - 查询所有任务
   - 返回 `{tasks: [{id, name, status}]}`

### 6. 任务处理逻辑

实现异步任务处理器：

- 启动后台 goroutine，每 1 秒执行一次
- 查询所有 `status="doing"` 的任务
- 对每个任务依次执行：

  1. **novel2script**：调用 `pkgs/novel2script.Process()` 生成剧本
  2. **storyboard**：调用 `pkgs/storyboard.GenerateImage()` 生成每个场景的图片
  3. **audiosync**：调用 `pkgs/audiosync` 相关函数生成音频
  4. 保存产物到 `./outputs/{taskID}/images/` 和 `./outputs/{taskID}/audios/`
  5. 上传产物到七牛云
  6. 更新数据库中的 scenes 字段（填充 imageURL 和 voiceURL）
  7. 更新任务状态为 "done"

### 7. 七牛云存储集成

实现文件上传功能：

- 初始化七牛云客户端（使用 AK/SK）
- `uploadFile(localPath, key)` - 上传文件到七牛云
- 返回公开访问 URL（`domain + "/" + key`）
- 为每个场景生成唯一的 key（如 `tasks/{taskID}/scene_{sceneID}.png`）

### 8. 主函数和服务启动

在 `cmd/novel2comicd/main.go` 实现：

- 加载配置文件
- 初始化 MongoDB 连接
- 初始化七牛云客户端
- 启动后台任务处理 goroutine
- 注册 HTTP 路由
- 启动 HTTP 服务器

## 关键文件

- `cmd/novel2comicd/main.go` - 主入口
- `cmd/novel2comicd/config.go` - 配置加载
- `cmd/novel2comicd/models.go` - 数据模型
- `cmd/novel2comicd/db.go` - 数据库操作
- `cmd/novel2comicd/handlers.go` - HTTP 处理器
- `cmd/novel2comicd/processor.go` - 任务处理逻辑
- `cmd/novel2comicd/qiniu.go` - 七牛云上传
- `cmd/novel2comicd/config.json.example` - 配置文件示例

## 注意事项

1. 错误处理：所有 API 需要返回合适的 HTTP 状态码和错误信息
2. 并发安全：后台只有一个 goroutine 处理任务，无并发问题
3. 资源清理：处理完任务后可选择保留或删除本地产物
4. 日志输出：关键步骤需要打印日志便于调试
5. 产物命名：图片使用 `scene_{sceneID}.png`，音频使用 `scene_{sceneID}_dialogue_{idx}.mp3`

### To-dos

- [ ] 更新 go.mod 添加 MongoDB 和七牛云 SDK 依赖
- [ ] 实现配置管理（config.go）和示例配置文件
- [ ] 定义数据模型（models.go）包括 Task、Scene、Dialogue 结构
- [ ] 实现 MongoDB 数据库层（db.go）包括 CRUD 操作
- [ ] 实现七牛云上传功能（qiniu.go）
- [ ] 实现任务处理逻辑（processor.go）集成 novel2script + storyboard + audiosync
- [ ] 实现 HTTP API 处理器（handlers.go）包括 4 个端点
- [ ] 完成主函数（main.go）启动服务和后台任务处理器