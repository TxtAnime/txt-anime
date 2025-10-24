# Demo 脚本使用指南

## 概述

`demo.sh` 是一个自动化脚本，用于演示从小说文本到完整动漫素材（图片+语音）的全流程。

## 功能特点

✅ **一键运行** - 无需手动执行多个命令  
✅ **自动编译** - 自动编译所有必需的工具  
✅ **灵活输入** - 支持内置示例或自定义小说文件  
✅ **完整流程** - 包含剧本生成、图片生成、语音生成  
✅ **智能清理** - 可选择性保留或清理生成文件  

## 使用方法

### 基本用法

```bash
# 进入项目目录
cd /Users/shijiayun/qbox/txt-anime

# 使用内置示例
./demo.sh

# 使用自定义小说
./demo.sh my-story.txt

# 使用绝对路径
./demo.sh /path/to/novel.txt

# 查看帮助
./demo.sh -h
```

## 执行流程

### 步骤1: 编译程序

自动编译三个核心工具：
- `novel2comicli` - 步骤一+二：剧本改编和角色设计
- `storyboard` - 步骤三：分镜图片生成
- `audiosync` - 步骤四：角色语音合成

### 步骤2: 准备小说文件

**使用内置示例**：
- 自动创建 `demo-story.txt`
- 内容：《机器人与小女孩》的故事

**使用自定义文件**：
- 验证文件存在性
- 检查文件可读性
- 确认文件非空

### 步骤3: 生成剧本和角色

调用 `novel2comicli`：
```bash
./novel2comicli -input <小说文件> -output demo-script.json
```

**使用 DeepSeek-V3 模型**生成：
- 场景化剧本（JSON格式）
- 角色视觉描述
- 对话和动作描述

### 步骤4: 生成分镜图片

调用 `storyboard`：
```bash
./storyboard -input demo-script.json -output demo-storyboard
```

**使用 Gemini 2.5 Flash Image 模型**生成：
- 动漫风格的场景图片
- 多格分镜布局
- 英文对话气泡

### 步骤5: 生成角色语音 🆕

调用 `audiosync`：
```bash
./audiosync -input demo-script.json -output demo-audio
```

**使用 DeepSeek-V3 + 七牛TTS**生成：
- 智能音色匹配
- 角色语音文件（MP3）
- 音色配置记录

### 步骤6: 展示结果

显示生成的所有文件和统计信息：
```
📊 结果统计:
  - 场景数: 5
  - 角色数: 2
  - 图片数: 5
  - 音频数: 4

📁 生成的文件:
  - 剧本JSON: demo-script.json
  - 分镜图片: demo-storyboard/
  - 角色语音: demo-audio/
```

## 输出文件结构

```
txt-anime/
├── demo-story.txt           # 示例小说（如使用内置示例）
├── demo-script.json         # 生成的剧本JSON
├── demo-storyboard/         # 分镜图片目录
│   ├── scene_001.png
│   ├── scene_002.png
│   └── ...
└── demo-audio/              # 语音文件目录
    ├── scene_001_dialogue_001.mp3
    ├── scene_001_dialogue_002.mp3
    ├── ...
    └── voice_matches.json
```

## 查看结果

### 查看剧本JSON

```bash
# 格式化显示
cat demo-script.json | jq '.'

# 查看场景数
jq '.script | length' demo-script.json

# 查看角色列表
jq '.characters | keys' demo-script.json
```

### 查看图片

```bash
# macOS
open demo-storyboard/

# Linux
xdg-open demo-storyboard/

# 或手动浏览
ls -lh demo-storyboard/
```

### 播放音频

```bash
# macOS
afplay demo-audio/scene_001_dialogue_001.mp3

# Linux
mpg123 demo-audio/scene_001_dialogue_001.mp3

# 查看所有音频
ls -lh demo-audio/*.mp3
```

### 查看音色匹配

```bash
cat demo-audio/voice_matches.json | jq '.'
```

## 清理文件

脚本执行完成后会询问是否清理：

```
🧹 是否清理生成的文件？(y/N)
```

**选择 y/Y**：
- ✅ 删除示例小说（如使用内置示例）
- ✅ 删除剧本JSON
- ✅ 删除分镜图片目录
- ✅ 删除语音文件目录
- ⚠️  保留用户提供的小说文件

**选择 N（默认）**：
- 保留所有生成的文件

## 性能指标

### 执行时间（参考）

| 步骤 | 时间 | 说明 |
|------|------|------|
| 编译 | 5-10秒 | 首次编译较慢 |
| 剧本生成 | 10-30秒 | 取决于小说长度 |
| 图片生成 | 50-150秒 | 5张图片约60秒 |
| 语音生成 | 8-20秒 | 4段对话约10秒 |
| **总计** | **2-4分钟** | 使用内置示例 |

### 资源消耗

- **磁盘空间**: 约8-12MB（5场景示例）
  - 剧本JSON: ~5KB
  - 图片: 5-8MB（5张）
  - 音频: 200-400KB（4段）
  
- **网络请求**: 
  - LLM API: 2次（剧本生成、音色匹配）
  - 图像API: 5次（每个场景1次）
  - TTS API: 4次（每段对话1次）

## 常见问题

**Q: demo.sh 提示 "command not found"**  
A: 确保脚本有执行权限：
```bash
chmod +x demo.sh
```

**Q: 生成失败，如何调试？**  
A: 查看错误信息，或手动执行各步骤：
```bash
./novel2comicli -input demo-story.txt -output test.json
```

**Q: 能否跳过某些步骤？**  
A: 可以手动执行单个工具，不使用 demo.sh。参考 [QUICKSTART.md](QUICKSTART.md)

**Q: 生成的文件在哪里？**  
A: 所有文件生成在当前目录：
- `demo-script.json`
- `demo-storyboard/`
- `demo-audio/`

**Q: 如何使用更长的小说？**  
A: 
1. 准备好小说文本文件
2. 运行: `./demo.sh your-long-novel.txt`
3. 注意：长小说会生成更多场景，耗时更长

**Q: 生成的图片/语音质量不满意？**  
A: 
1. 图片：修改 `storyboard` 的 `-layout` 参数
2. 语音：编辑 `voice_matches.json` 手动选择音色
3. 重新运行对应工具

**Q: 如何保存配置供以后使用？**  
A: 复制生成的文件到其他目录：
```bash
mkdir my-project
cp demo-script.json my-project/
cp -r demo-storyboard my-project/
cp -r demo-audio my-project/
```

## 自定义修改

### 修改默认示例

编辑 `demo.sh` 中的 EOF 部分：

```bash
cat > "$DEMO_FILE" << 'EOF'
你的自定义故事内容...
EOF
```

### 修改输出目录

编辑 `demo.sh` 中的变量：

```bash
SCRIPT_FILE="my-script.json"
STORYBOARD_DIR="my-images"
AUDIO_DIR="my-audio"
```

### 添加自定义参数

修改工具调用命令：

```bash
# 自定义图片布局
./storyboard -input "$SCRIPT_FILE" -output "$STORYBOARD_DIR" -layout single

# 可以添加更多自定义选项
```

## 与其他工具集成

### 批量处理多个小说

```bash
for novel in novels/*.txt; do
    echo "处理: $novel"
    ./demo.sh "$novel"
    # 重命名输出文件
    mv demo-script.json "outputs/$(basename $novel .txt).json"
    mv demo-storyboard "outputs/$(basename $novel .txt)-images"
    mv demo-audio "outputs/$(basename $novel .txt)-audio"
done
```

### 制作视频

使用 FFmpeg 将图片和音频合成视频：

```bash
# 安装 FFmpeg
# brew install ffmpeg  # macOS
# apt install ffmpeg   # Ubuntu

# 基本合成（示例）
ffmpeg -loop 1 -i demo-storyboard/scene_001.png \
       -i demo-audio/scene_001_dialogue_001.mp3 \
       -shortest -y scene_001.mp4
```

## 最佳实践

1. **首次运行使用内置示例** - 熟悉流程和输出
2. **准备好小说文件** - 确保格式正确，编码为UTF-8
3. **保留生成文件** - 第一次运行选择 N（不清理）
4. **检查结果质量** - 查看图片和音频是否符合预期
5. **迭代优化** - 根据结果调整小说或参数

## 相关文档

- [README.md](README.md) - 项目总览
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [USAGE.md](USAGE.md) - 剧本生成文档
- [STORYBOARD.md](STORYBOARD.md) - 图片生成文档
- [AUDIO.md](AUDIO.md) - 语音生成文档

---

**最后更新**: 2025-10-24  
**支持的步骤**: 步骤一~四（共5步）

