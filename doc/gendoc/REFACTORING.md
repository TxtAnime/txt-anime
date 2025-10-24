# 代码重构说明

## 🎯 重构目标

将命令行工具的核心逻辑抽取为可复用的 package，便于后续编写服务端程序调用。

## 📦 新增结构

### pkgs/ 目录

创建了 `pkgs/` 目录，包含可复用的核心包：

```
pkgs/
├── novel2script/      # 剧本生成核心逻辑
│   └── novel2script.go
├── storyboard/        # 分镜生成核心逻辑
│   └── storyboard.go
├── audiosync/         # 语音合成（待完善）
└── finalassembly/     # 视频合成（待完善）
```

### cmd/ 目录更新

- ✅ 将 `cmd/novel2comicli/` 重命名为 `cmd/novel2script/`
- ✅ 简化 `cmd/novel2script/main.go` - 仅负责命令行参数解析和文件I/O
- ✅ 简化 `cmd/storyboard/main.go` - 仅负责命令行参数解析和文件I/O
- ⏸️ `cmd/audiosync/` 和 `cmd/finalassembly/` 暂时保持原有实现（可后续优化）

## 🔄 重命名

### novel2comicli → novel2script

**原因**：`novel2comic` 容易让人误解为生成漫画，实际是生成剧本（script），因此改名为 `novel2script` 更准确。

**影响的文件**：
- `cmd/novel2comicli/` → `cmd/novel2script/`
- `demo.sh` - 所有 `novel2comicli` 引用改为 `novel2script`
- `README.md` - 更新工具名称和命令
- `QUICKSTART.md` - 更新快速开始指南

## 📚 Package API 设计

### novel2script

```go
package novel2script

// Config 配置
type Config struct {
    BaseURL string
    APIKey  string
    Model   string
}

// Process 处理小说文本，生成剧本和角色描述
func Process(novelText string, cfg Config) (*Response, error)

// Response 响应结构
type Response struct {
    Script     []Scene           `json:"script"`
    Characters map[string]string `json:"characters"`
}
```

**使用示例**：
```go
import "github.com/TxtAnime/txt-anime/pkgs/novel2script"

cfg := novel2script.Config{
    BaseURL: "https://openai.qiniu.com/v1",
    APIKey:  "your-api-key",
    Model:   "deepseek-v3",
}

response, err := novel2script.Process(novelText, cfg)
if err != nil {
    log.Fatal(err)
}
```

### storyboard

```go
package storyboard

// Config 配置
type Config struct {
    BaseURL   string
    APIKey    string
    Model     string
    ImageSize string
}

// GenerateImage 生成场景图片
func GenerateImage(scene Scene, characters map[string]string, cfg Config) ([]byte, error)

// ScriptData 剧本数据
type ScriptData struct {
    Script     []Scene           `json:"script"`
    Characters map[string]string `json:"characters"`
}
```

**使用示例**：
```go
import "github.com/TxtAnime/txt-anime/pkgs/storyboard"

cfg := storyboard.Config{
    BaseURL:   "https://openai.qiniu.com/v1",
    APIKey:    "your-api-key",
    Model:     "gemini-2.5-flash-image",
    ImageSize: "1792x1024",
}

imageData, err := storyboard.GenerateImage(scene, characters, cfg)
if err != nil {
    log.Fatal(err)
}

os.WriteFile("scene.png", imageData, 0644)
```

## 🚀 使用方式

### 方式一：命令行工具（保持不变）

```bash
# 编译
go build -o novel2script ./cmd/novel2script
go build -o storyboard ./cmd/storyboard
go build -o audiosync ./cmd/audiosync
go build -o finalassembly ./cmd/finalassembly

# 使用
./novel2script -input novel.txt -output script.json
./storyboard -input script.json -output images
./audiosync -input script.json -output audio
./finalassembly -input script.json -images images -audio audio -output final.mp4
```

### 方式二：作为 Package 使用（新增）

```go
package main

import (
    "github.com/TxtAnime/txt-anime/pkgs/novel2script"
    "github.com/TxtAnime/txt-anime/pkgs/storyboard"
)

func main() {
    // 1. 生成剧本
    scriptCfg := novel2script.Config{
        BaseURL: "https://openai.qiniu.com/v1",
        APIKey:  "your-api-key",
        Model:   "deepseek-v3",
    }
    
    novelText := "你的小说内容..."
    response, err := novel2script.Process(novelText, scriptCfg)
    if err != nil {
        panic(err)
    }
    
    // 2. 生成图片
    imageCfg := storyboard.Config{
        BaseURL:   "https://openai.qiniu.com/v1",
        APIKey:    "your-api-key",
        Model:     "gemini-2.5-flash-image",
        ImageSize: "1792x1024",
    }
    
    for _, scene := range response.Script {
        imageData, err := storyboard.GenerateImage(scene, response.Characters, imageCfg)
        if err != nil {
            continue
        }
        // 保存图片...
    }
}
```

## 🔧 编译和测试

### 编译所有工具

```bash
# 一键编译
go build -o novel2script ./cmd/novel2script
go build -o storyboard ./cmd/storyboard
go build -o audiosync ./cmd/audiosync
go build -o finalassembly ./cmd/finalassembly
```

### 运行测试

```bash
# 使用 demo.sh 测试完整流程
./demo.sh

# 或手动测试
./novel2script -input the-wandering-earth.txt -output script.json
./storyboard -input script.json -output images
```

## 📝 更新的文档

- ✅ `README.md` - 更新工具名称和项目结构
- ✅ `demo.sh` - 更新编译和执行命令
- ⏸️ `QUICKSTART.md` - 待更新示例代码
- ⏸️ `USAGE.md` - 待更新工具名称
- ⏸️ `STORYBOARD.md` - 待更新

## 🎯 后续优化计划

### 优先级：高

1. **完善 audiosync package**
   - 将音色匹配逻辑抽取为独立函数
   - 提供 `Process(scriptData, outputDir, cfg)` 接口

2. **完善 finalassembly package**
   - 将视频合成逻辑抽取为独立函数
   - 提供 `Process(scriptData, imagesDir, audioDir, outputFile, cfg)` 接口

### 优先级：中

3. **创建服务端程序**
   - 在 `cmd/server/` 创建 HTTP API 服务
   - 提供 REST API 调用各个步骤
   - 支持异步任务队列

4. **添加单元测试**
   - 为每个 package 添加测试
   - Mock API 调用
   - 测试覆盖率 >80%

### 优先级：低

5. **优化 package API**
   - 统一配置结构
   - 添加更多配置选项
   - 支持进度回调

6. **文档完善**
   - 添加 GoDoc 注释
   - 生成 API 文档
   - 添加更多使用示例

## 💡 设计原则

1. **职责分离**
   - cmd/: 命令行接口，负责参数解析和文件I/O
   - pkgs/: 核心逻辑，提供可复用的函数接口

2. **向后兼容**
   - 保持命令行工具的接口不变
   - 用户可以继续使用原有方式

3. **易于集成**
   - Package 提供清晰的公开API
   - 最小化外部依赖
   - 支持配置注入

4. **渐进式重构**
   - 先重构简单的模块（novel2script, storyboard）
   - 复杂模块（audiosync, finalassembly）可保持原状
   - 不影响现有功能

## 🔗 相关链接

- [design.md](design.md) - 项目整体设计
- [README.md](README.md) - 项目主页
- [QUICKSTART.md](QUICKSTART.md) - 快速开始

## 📊 重构统计

| 模块 | 状态 | 代码行数 (before) | 代码行数 (after) | 说明 |
|------|------|-------------------|------------------|------|
| novel2script | ✅ 已完成 | 194 行 | cmd: 60行 + pkg: 165行 | 已抽取package |
| storyboard | ✅ 已完成 | 242 行 | cmd: 88行 + pkg: 193行 | 已抽取package |
| audiosync | ⏸️ 待优化 | 577 行 | 577行 | 保持原实现 |
| finalassembly | ⏸️ 待优化 | 439 行 | 439行 | 保持原实现 |

**总计**：
- ✅ 已重构：2个模块（novel2script, storyboard）
- ⏸️ 待优化：2个模块（audiosync, finalassembly）
- 📦 新增：`pkgs/` 目录结构

---

**重构日期**: 2025-10-24  
**重构原因**: 为后续服务端程序开发做准备，提供可复用的核心逻辑包

