# txt-anime - 小说动漫生成器

自动根据小说生成动漫的智能工具

## 项目简介

这是一个Hackathon项目,目标是将文本小说自动转换成动漫形式。通过AI大模型的能力,将小说的理解、场景拆分、角色视觉化、语音合成等环节自动化,最终生成"图配文+声音"的动漫作品。

## 核心特性

✅ **角色一致性**: 同一角色在整个动漫中保持视觉一致性  
✅ **场景化改编**: 自动将小说拆分成适合展示的场景  
✅ **结构化输出**: 生成标准JSON格式,便于后续处理  
✅ **一键生成**: 单次API调用完成剧本改编和角色设计  

## 当前进度

- [x] 步骤一: 剧本改编 (Script Adaptation) ✅
- [x] 步骤二: 角色设计 (Character Design) ✅
- [x] 步骤三: 分镜生成 (Storyboard Generation) ✅

## 快速部署

### 本地部署

使用一键部署脚本启动前端和后端服务：

```bash
# 本地部署 (默认)
./deploy.sh

# Kubernetes部署
./deploy.sh k8s
```

部署完成后访问：
- 前端界面: http://localhost:3000
- 后端API: http://localhost:8080
- API文档: http://localhost:8080/swagger/index.html
- 健康检查: http://localhost:8080/health

### 服务管理

```bash
# 停止所有服务
./cleanup.sh

# 运行完整验证测试
node test-full-deployment.js

# 运行基础集成测试
node test-integration.js
```

### 构建说明

- **后端服务**: `go build -o novel2comicd ./cmd/novel2comicd`
- **启动命令**: `./novel2comicd -config config.json`
- **前端服务**: 基于 React + Vite + TypeScript
- **数据库**: MongoDB (需要预先启动)
- [x] 步骤四: 音频合成 (Audio Synthesis) ✅
- [x] 步骤五: 最终合成 (Final Assembly) ✅

## 快速开始

### 一键演示（推荐）

```bash
# 使用内置示例
./demo.sh

# 使用你的小说文件
./demo.sh your-novel.txt
```

### 手动运行

```bash
# 步骤一+二: 生成剧本和角色
go build -o novel2script ./cmd/novel2script
./novel2script -input the-wandering-earth.txt -output script.json

# 步骤三: 生成分镜图片
go build -o storyboard ./cmd/storyboard
./storyboard -input script.json -output storyboard

# 步骤四: 生成语音
go build -o audiosync ./cmd/audiosync
./audiosync -input script.json -output audio

# 步骤五: 合成最终视频
go build -o finalassembly ./cmd/finalassembly
./finalassembly -input script.json -images storyboard -audio audio -output final.mp4
```

详细说明请查看 [快速开始指南](QUICKSTART.md)

## 项目工具

| 工具 | 功能 | 文档 |
|------|------|------|
| `novel2script` | 步骤一+二：剧本改编和角色设计 | [USAGE.md](USAGE.md) |
| `storyboard` | 步骤三：分镜图片生成 | [STORYBOARD.md](STORYBOARD.md) |
| `audiosync` | 步骤四：角色语音合成 | [AUDIO.md](AUDIO.md) |
| `finalassembly` | 步骤五：视频最终合成 | [FINALASSEMBLY.md](FINALASSEMBLY.md) |

## 示例

### 输入: 小说文本
```
《流浪地球》

上篇 刹车时代
----
我没见过黑夜，我没见过星星...
```

### 输出: 结构化JSON
```json
{
  "script": [
    {
      "scene_id": 1,
      "location": "北半球黄昏下的平原",
      "characters_present": ["叙述者", "妈妈"],
      "narration": "刹车时代结束，地球停止自转...",
      "dialogue": [
        {"character": "妈妈", "line": "孩子，我给你讲讲..."}
      ],
      "action_description": "地平线上巨大的地球发动机..."
    }
  ],
  "characters": {
    "叙述者": "20-30岁亚洲男性，瘦削面容，常穿灰色冷却服..."
  }
}
```

## 文档

### 快速开始
- [QUICKSTART.md](QUICKSTART.md) - 10分钟完整流程
- [demo.sh](demo.sh) - 一键演示脚本

### 使用说明
- [USAGE.md](USAGE.md) - 步骤一+二使用说明
- [STORYBOARD.md](STORYBOARD.md) - 步骤三分镜生成说明
- [AUDIO.md](AUDIO.md) - 步骤四语音合成说明
- [FINALASSEMBLY.md](FINALASSEMBLY.md) - 步骤五视频合成说明

### 项目文档
- [PROJECT-STATUS.md](PROJECT-STATUS.md) - 📊 项目进度总览
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - 实现细节
- [design.md](design.md) - 整体设计方案

## 技术栈

- **语言**: Go 1.24.1
- **文本模型**: DeepSeek-V3 (via 七牛云API)
- **图像模型**: Gemini 2.5 Flash Image / Nano Banana (via 七牛云API)
- **语音模型**: 七牛云 TTS API (多音色支持)
- **视频处理**: FFmpeg
- **依赖**: go-openai客户端库

## 项目结构

```
txt-anime/
├── cmd/
│   ├── novel2script/           # 步骤一+二: 剧本改编和角色设计
│   │   └── main.go
│   ├── storyboard/             # 步骤三: 分镜生成
│   │   └── main.go
│   ├── audiosync/              # 步骤四: 语音合成
│   │   └── main.go
│   └── finalassembly/          # 步骤五: 视频合成
│       └── main.go
├── pkgs/                       # 可复用的核心包
│   ├── novel2script/
│   ├── storyboard/
│   ├── audiosync/
│   └── finalassembly/
├── design.md                   # 设计文档  
├── QUICKSTART.md               # 快速开始
├── USAGE.md                    # 步骤一+二使用说明
├── STORYBOARD.md               # 步骤三使用说明
├── IMPLEMENTATION.md           # 实现说明
├── the-wandering-earth.txt     # 示例小说
└── example-output.json         # 输出格式示例
```

## 测试结果

**步骤一+二 (剧本生成)**:
- ✅ 短篇童话(600字) → 5个场景, 5个角色, 约5秒  
- ✅ 中长篇科幻(3万字) → 7个场景, 5个角色, 约15秒

**步骤三 (分镜生成)**:
- ✅ 单场景测试 → 1.3MB PNG图片, 约12秒
- ✅ 动漫风格确认 → 纯场景视觉，无文字对话

**步骤四 (语音合成)**:
- ✅ 智能音色匹配 → 根据角色自动选择合适音色
- ✅ 批量生成 → 所有对话自动生成MP3文件

**步骤五 (视频合成)**:
- ✅ 自动合成 → 图片+音频+字幕完整合成
- ✅ 场景拼接 → 多场景自动拼接成完整视频

## License

MIT
