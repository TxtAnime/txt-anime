# 更新日志

## [1.1.0] - 2025-10-24

### 🔄 重大变更

- **重命名**: `novel2comicli` → `novel2script`
  - 命令行工具重命名
  - cmd 目录重构
  - 更准确地反映工具功能（生成剧本而非漫画）

### ✨ 新增功能

- **Package API**: 创建 `pkgs/` 目录，提供可复用的核心包
  - `pkgs/novel2script/` - 剧本生成核心逻辑
  - `pkgs/storyboard/` - 分镜生成核心逻辑
- **服务端支持**: 核心逻辑可作为 package 调用，便于后续开发服务端程序

### 📦 项目结构

新增目录结构：
```
pkgs/
├── novel2script/
│   └── novel2script.go
└── storyboard/
    └── storyboard.go
```

### 🔧 改进

- 简化 cmd 程序，只负责命令行接口
- 核心逻辑抽取为 package，提高代码复用性
- 统一配置结构设计

### 📝 文档更新

- 新增 [REFACTORING.md](REFACTORING.md) - 重构说明文档
- 新增 [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) - 迁移指南
- 更新 [README.md](README.md) - 项目主文档
- 更新 [demo.sh](demo.sh) - 演示脚本

### 🐛 Bug 修复

- 修复音画不同步问题（步骤五）
  - 统一音频参数（44100 Hz 立体声）
  - 为无对话场景生成静音轨道
- 新增 [BUGFIX-AUDIO-SYNC.md](BUGFIX-AUDIO-SYNC.md) - 修复说明

### ⚙️ 技术细节

- Go模块路径保持为 `github.com/TxtAnime/txt-anime`
- 所有命令行工具保持向后兼容
- JSON 输出格式不变

### 📊 统计

- 重构模块: 2个（novel2script, storyboard）
- 新增代码: ~360 行
- 删除代码: 0 行（保持向后兼容）
- 文档更新: 5 个文件

---

## [1.0.0] - 2025-10-24

### 🎉 初始发布

#### ✅ 已完成功能

**步骤一+二: 剧本改编和角色设计**
- 工具: `novel2comicli`（现已重命名为 `novel2script`）
- 功能: 将小说转换为结构化剧本 + 角色视觉描述
- 模型: DeepSeek-V3

**步骤三: 分镜生成**
- 工具: `storyboard`
- 功能: 为每个场景生成动漫风格图片
- 模型: Gemini 2.5 Flash Image
- 特点: 纯场景视觉，无文字对话

**步骤四: 音频合成**
- 工具: `audiosync`
- 功能: 为角色对话生成语音
- 特点: 智能音色匹配，支持37种音色
- API: 七牛云 TTS

**步骤五: 最终合成**
- 工具: `finalassembly`
- 功能: 图片+音频+字幕合成视频
- 特点: 自动音画同步，SRT字幕
- 工具: FFmpeg

#### 📚 文档

- [README.md](README.md) - 项目主页
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [design.md](design.md) - 设计方案
- [USAGE.md](USAGE.md) - 步骤一+二使用
- [STORYBOARD.md](STORYBOARD.md) - 步骤三使用
- [AUDIO.md](AUDIO.md) - 步骤四使用
- [FINALASSEMBLY.md](FINALASSEMBLY.md) - 步骤五使用

#### 🚀 自动化

- `demo.sh` - 一键演示脚本
- 支持自定义小说输入
- 自动编译所有工具
- 完整的错误处理

#### 🎯 技术栈

- 语言: Go 1.24.1
- LLM: DeepSeek-V3
- 图像: Gemini 2.5 Flash Image  
- TTS: 七牛云 TTS API
- 视频: FFmpeg
- API: 七牛云 AI Token API (OpenAI 兼容)

---

## 版本说明

### 版本号规则

遵循语义化版本（Semantic Versioning）：
- 主版本号：不兼容的 API 更改
- 次版本号：向下兼容的功能新增
- 修订号：向下兼容的问题修复

### 标签说明

- 🔄 **重大变更**: 不兼容的改动
- ✨ **新增功能**: 新功能
- 🔧 **改进**: 优化和改进
- 🐛 **Bug修复**: 问题修复
- 📝 **文档**: 文档更新
- ⚙️ **技术细节**: 技术实现说明
- 📊 **统计**: 代码统计信息

---

**维护者**: txt-anime 团队  
**项目地址**: https://github.com/TxtAnime/txt-anime

