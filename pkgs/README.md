# pkgs/ - 可复用核心包

## 📦 Package 说明

本目录包含 txt-anime 项目的可复用核心包，便于在其他 Go 程序或服务端中调用。

## ✅ 已完全实现的 Package

### novel2script - 剧本生成

**功能**: 将小说文本转换为结构化剧本和角色描述

**文件**: `pkgs/novel2script/novel2script.go`

**使用示例**:
```go
import "github.com/TxtAnime/txt-anime/pkgs/novel2script"

cfg := novel2script.Config{
    BaseURL: "https://openai.qiniu.com/v1",
    APIKey:  "your-api-key",
    Model:   "deepseek-v3",
}

response, err := novel2script.Process(novelText, cfg)
// response.Script - 场景列表
// response.Characters - 角色描述
```

**核心函数**:
- `Process(novelText string, cfg Config) (*Response, error)` - 处理小说文本

### storyboard - 分镜生成

**功能**: 为场景生成动漫风格图片

**文件**: `pkgs/storyboard/storyboard.go`

**使用示例**:
```go
import "github.com/TxtAnime/txt-anime/pkgs/storyboard"

cfg := storyboard.Config{
    BaseURL:   "https://openai.qiniu.com/v1",
    APIKey:    "your-api-key",
    Model:     "gemini-2.5-flash-image",
    ImageSize: "1792x1024",
}

imageData, err := storyboard.GenerateImage(scene, characters, cfg)
// imageData - PNG 图片字节数据

// 保存图片
err = storyboard.SaveImage(imageData, "scene_001.png")
```

**核心函数**:
- `GenerateImage(scene Scene, characters map[string]string, cfg Config) ([]byte, error)` - 生成图片
- `SaveImage(imageData []byte, filename string) error` - 保存图片

### audiosync - 语音合成

**功能**: 为角色对话生成语音并自动匹配音色

**文件**: `pkgs/audiosync/audiosync.go`

**使用示例**:
```go
import "github.com/TxtAnime/txt-anime/pkgs/audiosync"

cfg := audiosync.Config{
    BaseURL:    "https://openai.qiniu.com/v1",
    APIKey:     "your-api-key",
    LLMModel:   "deepseek-v3",
    VoiceModel: "qiniu_zh_female_tmjxxy",
}

err := audiosync.Process(scriptData, "audio", cfg)
// 生成音频文件到指定目录
```

**核心函数**:
- `Process(scriptData ScriptData, outputDir string, cfg Config) error` - 处理完整流程

**核心特性**:
- AI智能音色匹配
- 规则fallback匹配
- 支持23种内置音色
- 自动生成 voice_matches.json

### finalassembly - 视频合成

**功能**: 将图片、音频、字幕合成为完整视频

**文件**: `pkgs/finalassembly/finalassembly.go`

**使用示例**:
```go
import "github.com/TxtAnime/txt-anime/pkgs/finalassembly"

cfg := finalassembly.Config{
    ImageDisplayTime: 3.0,
    FPS:              24,
}

err := finalassembly.Process(scriptData, "images", "audio", "final.mp4", cfg)
// 生成最终视频文件
```

**核心函数**:
- `Process(scriptData ScriptData, imageDir, audioDir, outputVideo string, cfg Config) error` - 处理完整流程

**核心特性**:
- 音频合并（多个对话音频）
- SRT字幕生成
- 场景视频生成
- 视频拼接
- 音画同步

## 📊 Package 对比

| Package | 代码行数 | 复杂度 | 外部依赖 | 状态 |
|---------|---------|--------|----------|------|
| `novel2script` | ~200 | 中 | OpenAI SDK | ✅ 完整 |
| `storyboard` | ~180 | 中 | HTTP Client | ✅ 完整 |
| `audiosync` | ~550 | 高 | OpenAI SDK | ✅ 完整 |
| `finalassembly` | ~480 | 高 | FFmpeg | ✅ 完整 |

## 🎯 设计原则

### 1. 完全封装

所有核心逻辑都在 `pkgs/` 中实现：
- ✅ 数据结构定义
- ✅ 业务逻辑实现
- ✅ API调用处理
- ✅ 文件I/O操作

### 2. 清晰接口

每个 package 都提供简单的入口函数：
- `novel2script.Process()` - 一步完成剧本生成
- `storyboard.GenerateImage()` - 生成单个场景图片
- `audiosync.Process()` - 一步完成所有音频生成
- `finalassembly.Process()` - 一步完成视频合成

### 3. 配置分离

通过 `Config` 结构体传递配置：
```go
type Config struct {
    BaseURL string
    APIKey  string
    Model   string
    // ... 其他配置
}
```

### 4. 错误处理

统一的错误处理模式：
```go
if err := pkg.Process(...); err != nil {
    return fmt.Errorf("处理失败: %v", err)
}
```

## 💡 使用场景

### 命令行工具

`cmd/` 目录下的工具直接调用这些 packages：

```go
// cmd/novel2script/main.go
func main() {
    cfg := novel2script.Config{...}
    result, err := novel2script.Process(text, cfg)
    // ...
}
```

### Web服务

可以在 Web 服务中直接使用：

```go
// server/handler.go
func handleNovelToAnime(w http.ResponseWriter, r *http.Request) {
    // 1. 生成剧本
    script, err := novel2script.Process(novelText, cfg1)
    
    // 2. 生成图片
    for _, scene := range script.Script {
        img, _ := storyboard.GenerateImage(scene, script.Characters, cfg2)
        storyboard.SaveImage(img, fmt.Sprintf("scene_%03d.png", scene.SceneID))
    }
    
    // 3. 生成音频
    audiosync.Process(script, "audio", cfg3)
    
    // 4. 合成视频
    finalassembly.Process(script, "images", "audio", "final.mp4", cfg4)
    
    // 返回视频文件
    http.ServeFile(w, r, "final.mp4")
}
```

### 批处理脚本

```go
// batch/process.go
func processNovelsBatch(novels []string) error {
    for _, novel := range novels {
        // 使用 packages 处理每个小说
        script, _ := novel2script.Process(novel, cfg)
        // ...
    }
    return nil
}
```

## 📝 代码风格

### 导出规则

- **大写开头**: 导出的类型、函数（public）
  ```go
  type Config struct { ... }
  func Process(...) error { ... }
  ```

- **小写开头**: 内部函数（private）
  ```go
  func extractJSON(content string) string { ... }
  func buildPrompt(...) string { ... }
  ```

### 命名规范

- **类型**: PascalCase（`ScriptData`, `DialogueLine`）
- **函数**: camelCase（`generateImage`, `mergeAudioFiles`）
- **常量**: UPPER_CASE（`DEFAULT_MODEL`, `BASE_URL`）
- **变量**: camelCase（`scriptData`, `audioFiles`）

### 注释规范

```go
// Process 处理整个音频生成流程
// 
// 参数:
//   - scriptData: 剧本数据
//   - outputDir: 输出目录
//   - cfg: 配置信息
// 
// 返回:
//   - error: 处理过程中的错误
func Process(scriptData ScriptData, outputDir string, cfg Config) error {
    // ...
}
```

## 🔧 扩展指南

### 添加新功能

1. 在相应的 package 中添加新函数
2. 更新 `Config` 结构体（如需要）
3. 在 `cmd/` 中添加命令行参数支持

### 修改现有功能

1. 直接修改 `pkgs/` 中的实现
2. `cmd/` 中的代码通常不需要修改
3. 确保向后兼容性

### 性能优化

可以优化的地方：
- [ ] `audiosync`: 并行生成多个音频
- [ ] `finalassembly`: 并行生成场景视频
- [ ] `storyboard`: 批量图片生成
- [ ] 所有: 添加进度回调

## 🐛 调试技巧

### 启用详细日志

在 package 函数中添加 `verbose` 参数：

```go
type Config struct {
    // ... 其他配置
    Verbose bool
}

func Process(..., cfg Config) error {
    if cfg.Verbose {
        fmt.Println("详细日志: ...")
    }
}
```

### 保存中间文件

不删除临时文件便于调试：

```go
// defer os.RemoveAll(tempDir)  // 注释掉自动清理
fmt.Printf("临时文件保存在: %s\n", tempDir)
```

### 单独测试模块

```go
// 只测试音色匹配
voices := audiosync.GetBuiltinVoiceList()
matches := audiosync.MatchVoices(characters, voices, cfg)
fmt.Printf("匹配结果: %+v\n", matches)
```

## 📚 相关文档

- [REFACTORING.md](../REFACTORING.md) - 重构总体说明
- [MIGRATION-GUIDE.md](../MIGRATION-GUIDE.md) - 迁移指南
- [README.md](../README.md) - 项目总览

## ✨ 总结

现在所有 4 个工具都已完成重构：

| 工具 | 状态 | Package 代码 | CMD 代码 | 说明 |
|------|------|-------------|----------|------|
| `novel2script` | ✅ | 完整实现 | 简单调用 | 完全重构 |
| `storyboard` | ✅ | 完整实现 | 简单调用 | 完全重构 |
| `audiosync` | ✅ | 完整实现 | 简单调用 | 完全重构 |
| `finalassembly` | ✅ | 完整实现 | 简单调用 | 完全重构 |

**所有工具都遵循相同的模式**:
- 核心逻辑在 `pkgs/` 中
- `cmd/` 只负责参数解析和函数调用
- 便于在服务端程序中直接使用

---

**维护建议**: 所有新功能都应该在 `pkgs/` 中实现，`cmd/` 保持简洁。

**更新时间**: 2025-10-24
