# 快速开始

## 10分钟完整流程指南

### 步骤一+二: 生成剧本和角色

#### 1. 编译程序

```bash
cd /Users/shijiayun/qbox/txt-anime
go build -o novel2comicli ./cmd/novel2comicli
```

#### 2. 运行示例

```bash
# 处理流浪地球小说
./novel2comicli -input the-wandering-earth.txt -output script.json
```

#### 3. 查看结果

```bash
# 查看生成的JSON文件
cat script.json | jq '.'

# 或者在编辑器中打开
code script.json
```

### 步骤三: 生成分镜图片

#### 4. 编译分镜工具

```bash
go build -o storyboard ./cmd/storyboard
```

#### 5. 生成图片

```bash
# 使用步骤一生成的JSON文件
./storyboard -input script.json -output storyboard
```

#### 6. 查看图片

```bash
# 查看生成的图片
ls -lh storyboard/

# 在Finder中打开
open storyboard/
```

### 使用自己的小说

```bash
# 准备你的小说文本文件(UTF-8编码)
echo "你的小说内容..." > my-novel.txt

# 步骤一+二: 生成剧本
./novel2comicli -input my-novel.txt -output my-script.json

# 步骤三: 生成分镜
./storyboard -input my-script.json -output my-storyboard
```

## 输出示例

### 步骤一+二输出 (JSON格式)

查看 `example-output.json` 文件可以看到输出格式:

```json
{
  "script": [
    {
      "scene_id": 1,
      "location": "场景地点",
      "characters_present": ["角色A", "角色B"],
      "narration": "旁白描述",
      "dialogue": [
        {"character": "角色A", "line": "对话内容"}
      ],
      "action_description": "动作描述"
    }
  ],
  "characters": {
    "角色A": "完整的角色视觉描述"
  }
}
```

### 步骤三输出 (图片文件)

```
storyboard/
├── scene_001.png  # 场景1的动漫风格图片
├── scene_002.png  # 场景2的动漫风格图片
├── scene_003.png  # 场景3的动漫风格图片
...
```

每张图片:
- 格式: PNG
- 尺寸: 1536x1024 (默认，可调整)
- 风格: 动漫视觉小说风格
- 大小: 约1-2MB

## 常见问题

### 步骤一+二

**Q: 处理时间多长?**
A: 短篇(几百字): 3-5秒; 中长篇(几万字): 10-20秒

**Q: 支持的小说长度?**
A: 理论上支持任意长度,但建议单次处理不超过10万字

**Q: 输出场景太少或太多?**
A: 可以修改prompt中的场景数量范围(目前是10-30个)

### 步骤三

**Q: 生成一张图片要多久?**
A: 约10-15秒/张图片

**Q: 图片是什么风格?**
A: 强制使用动漫视觉小说(Anime visual novel)和漫画(manga)风格

**Q: 可以调整图片尺寸吗?**
A: 可以,使用 `-size` 参数,支持多种尺寸(如1024x1024, 1536x1024等)

**Q: 如何实现多格分镜?**
A: 使用 `-layout` 参数,可选: single, 2-panel, 3-panel, 4-panel 或 auto(自动)

### 通用问题

**Q: 网络问题怎么办?**
A: 确保能访问 https://openai.qiniu.com ,如有代理需求请配置系统代理

**Q: 如何自定义API配置?**
A: 编辑对应程序的 `main.go` 文件中的常量定义

## 完整流程示例

### 方法1: 使用demo.sh脚本（推荐）✨

`demo.sh` 脚本会自动完成所有步骤：
- 步骤1: 编译所有工具
- 步骤2: 准备小说文件
- 步骤3: 生成剧本和角色（AI）
- 步骤4: 生成分镜图片（AI）
- 步骤5: 生成角色语音（AI + TTS）

```bash
cd /Users/shijiayun/qbox/txt-anime

# 使用内置示例（机器人与小女孩的故事）
./demo.sh

# 或使用你自己的小说
./demo.sh my-story.txt

# 或使用绝对路径
./demo.sh /path/to/your/novel.txt

# 查看帮助
./demo.sh -h
```

**输出结果**:
- ✅ 剧本JSON文件（`demo-script.json`）
- ✅ 分镜图片目录（`demo-storyboard/`）
- ✅ 角色语音目录（`demo-audio/`）

### 方法2: 手动执行（适合自定义）

```bash
# 一条龙处理流程
cd /Users/shijiayun/qbox/txt-anime

# 1. 编译所有工具
go build -o novel2comicli ./cmd/novel2comicli
go build -o storyboard ./cmd/storyboard
go build -o audiosync ./cmd/audiosync
go build -o finalassembly ./cmd/finalassembly

# 2. 准备小说
cat > my-story.txt << 'EOF'
《小红帽》
从前有个可爱的小女孩...
EOF

# 3. 生成剧本和角色
./novel2comicli -input my-story.txt -output story.json

# 4. 生成分镜图片
./storyboard -input story.json -output images

# 5. 生成角色语音
./audiosync -input story.json -output audio

# 6. 合成最终视频
./finalassembly -input story.json -images images -audio audio -output final.mp4

# 7. 查看结果
ls -lh images/
ls -lh audio/
open images/
afplay audio/scene_001_dialogue_001.mp3
open final.mp4
```

## 下一步

查看完整文档:
- `USAGE.md` - 步骤一+二详细说明
- `STORYBOARD.md` - 步骤三详细说明
- `AUDIO.md` - 步骤四详细说明
- `FINALASSEMBLY.md` - 步骤五详细说明
- `IMPLEMENTATION.md` - 实现细节和优化建议
- `design.md` - 整体项目设计

## 🎉 完整流程已实现

所有五个步骤都已完成：
- ✅ 步骤一+二: 剧本改编和角色设计
- ✅ 步骤三: 分镜生成
- ✅ 步骤四: 音频合成
- ✅ 步骤五: 最终视频合成

现在可以从小说文本一键生成完整动漫视频！

