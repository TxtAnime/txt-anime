# finalassembly - 最终视频合成工具

## 🎞️ 概述

`finalassembly` 是 txt-anime 项目的**步骤五：最终合成 (Final Assembly)**工具，负责将前四步生成的所有素材（剧本JSON、场景图片、角色语音）合成为一个完整的视频文件。

## ✨ 核心功能

1. **音频合并** - 将每个场景的多个对话音频按顺序合并
2. **字幕生成** - 根据剧本自动生成 SRT 格式字幕
3. **场景视频生成** - 为每个场景生成带字幕的视频片段
4. **视频拼接** - 将所有场景按顺序拼接成完整视频

## 🔧 依赖要求

### FFmpeg

本工具依赖 FFmpeg 进行视频处理，请确保已安装：

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# 验证安装
ffmpeg -version
ffprobe -version
```

## 📥 输入要求

### 1. 剧本 JSON 文件

由 `novel2comicli` 生成的剧本文件，包含场景和角色信息：

```json
{
  "script": [
    {
      "scene_id": 1,
      "location": "昏暗的酒馆",
      "characters_present": ["主角A", "角色B"],
      "narration": "夜深了，酒馆里只剩下寥寥几人。",
      "dialogue": [
        {"character": "主角A", "line": "你好。"},
        {"character": "角色B", "line": "你来了。"}
      ],
      "action_description": "主角坐在吧台前，神情疲惫。"
    }
  ],
  "characters": {
    "主角A": "20岁男性，黑色短发，皮夹克...",
    "角色B": "老人，白胡子，围裙..."
  }
}
```

### 2. 场景图片目录

由 `storyboard` 生成的场景图片，命名格式：

```
images/
  scene_001.png
  scene_002.png
  scene_003.png
  ...
```

### 3. 音频文件目录

由 `audiosync` 生成的对话音频，命名格式：

```
audio/
  scene_001_dialogue_001.mp3
  scene_001_dialogue_002.mp3
  scene_002_dialogue_001.mp3
  ...
```

## 📤 输出

生成一个完整的 MP4 视频文件，特点：

- **视频编码**: H.264 (yuv420p)
- **音频编码**: AAC
- **字幕**: 烧录到视频中（不可关闭）
- **帧率**: 24 FPS（默认，可调整）
- **时长**: 根据音频自动调整，无音频时使用基础显示时间

## 🚀 使用方法

### 基本用法

```bash
./finalassembly \
  -input script.json \
  -images storyboard \
  -audio audio \
  -output final_anime.mp4
```

### 完整参数

```bash
./finalassembly \
  -input script.json \           # 输入剧本JSON文件
  -images storyboard \            # 场景图片目录
  -audio audio \                  # 音频文件目录
  -output final.mp4 \             # 输出视频文件
  -image-time 3.0 \               # 无音频场景的基础显示时间（秒）
  -fps 24                         # 视频帧率
```

### 参数说明

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `-input` | ✅ | - | 剧本 JSON 文件路径 |
| `-images` | ✅ | - | 场景图片目录路径 |
| `-audio` | ✅ | - | 音频文件目录路径 |
| `-output` | ❌ | `final_anime.mp4` | 输出视频文件路径 |
| `-image-time` | ❌ | `3.0` | 无音频场景的显示时间（秒） |
| `-fps` | ❌ | `24` | 视频帧率 |

## 🎬 工作流程

### 1. 场景处理

对每个场景：

```
场景 N
  ├─ 查找图片: scene_00N.png
  ├─ 查找音频: scene_00N_dialogue_*.mp3
  ├─ 合并音频: 将多个对话音频按顺序合并
  ├─ 计算时长: 根据音频总时长或使用基础时长
  ├─ 生成字幕: 创建 SRT 字幕文件
  └─ 生成视频: 图片 + 音频 + 字幕 → 场景视频片段
```

### 2. 音频合并

- 如果场景有多个对话，按文件名顺序合并
- 使用 `ffmpeg concat` 协议无损拼接
- 自动计算总时长

### 3. 字幕生成

生成 SRT 格式字幕：

```srt
1
00:00:00,000 --> 00:00:02,500
夜深了，酒馆里只剩下寥寥几人。

2
00:00:02,500 --> 00:00:05,000
主角A: 你好。

3
00:00:05,000 --> 00:00:07,500
角色B: 你来了。
```

字幕时间分配逻辑：
- **旁白**: 根据文字长度估算（约10字/秒）
- **对话**: 平均分配剩余时间

### 4. 场景视频生成

使用 FFmpeg 将图片、音频、字幕合成：

```bash
ffmpeg \
  -loop 1 -i scene.png \          # 循环显示图片
  -i audio.mp3 \                   # 音频
  -vf "subtitles=subtitle.srt" \   # 烧录字幕
  -t <duration> \                  # 视频时长
  -r 24 \                          # 帧率
  -pix_fmt yuv420p \               # 像素格式
  -c:a aac \                       # 音频编码
  output.mp4
```

字幕样式：
- 字体: Arial
- 字号: 24
- 颜色: 白色
- 描边: 黑色
- 样式: 底部居中

### 5. 视频拼接

将所有场景视频按 `scene_id` 顺序拼接：

```bash
# 创建文件列表
file 'segment_001.mp4'
file 'segment_002.mp4'
file 'segment_003.mp4'

# 使用 concat 拼接
ffmpeg -f concat -safe 0 -i list.txt -c copy final.mp4
```

## 📊 示例输出

### 控制台输出

```
📖 读取剧本文件: demo-script.json
✅ 加载了 5 个场景

🎬 处理场景 1/5 (Scene 1)
  🖼️  图片: scene_001.png
  🎵 找到 2 个音频文件
  ⏱️  音频总时长: 8.50 秒
  ✅ 生成视频片段: segment_001.mp4

🎬 处理场景 2/5 (Scene 2)
  🖼️  图片: scene_002.png
  🎵 找到 1 个音频文件
  ⏱️  音频总时长: 5.20 秒
  ✅ 生成视频片段: segment_002.mp4

...

🎞️  合并所有场景视频...

✅ 视频生成完成: demo-final.mp4
📦 文件大小: 12.34 MB
```

### 生成的文件

```
demo-final.mp4           # 最终视频（保留）
temp_video_segments/     # 临时目录（自动清理）
  segment_001.mp4
  segment_002.mp4
  ...
```

## ⚙️ 高级配置

### 调整视频质量

修改 `generateVideoWithFFmpeg` 函数中的 FFmpeg 参数：

```go
// 高质量
"-crf", "18",
"-preset", "slow",

// 标准质量（默认）
// 使用 -c copy

// 快速编码
"-preset", "ultrafast",
```

### 调整字幕样式

修改 `generateVideoWithFFmpeg` 中的 `subtitles` 滤镜参数：

```go
-vf "subtitles=file.srt:force_style='FontName=Microsoft YaHei,FontSize=28,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=1'"
```

样式参数：
- `FontName`: 字体名称（如 "Arial", "Microsoft YaHei"）
- `FontSize`: 字体大小
- `PrimaryColour`: 主颜色（&HAABBGGRR& 格式）
- `OutlineColour`: 描边颜色
- `Outline`: 描边宽度
- `Shadow`: 阴影深度

### 调整时间分配

修改 `generateSubtitle` 函数中的时间分配逻辑：

```go
// 旁白时长（当前：10字/秒）
duration := time.Duration(float64(len(scene.Narration)) / 10.0 * float64(time.Second))

// 可改为：15字/秒（更快）
duration := time.Duration(float64(len(scene.Narration)) / 15.0 * float64(time.Second))

// 或：8字/秒（更慢）
duration := time.Duration(float64(len(scene.Narration)) / 8.0 * float64(time.Second))
```

## 🔍 故障排查

### 问题1: 未找到 ffmpeg

**错误信息**:
```
❌ 未找到 ffmpeg，请确保已安装 ffmpeg 并添加到 PATH
```

**解决方案**:
```bash
# 安装 ffmpeg
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Ubuntu

# 验证
which ffmpeg
ffmpeg -version
```

### 问题2: 场景图片不存在

**错误信息**:
```
❌ 生成场景 1 视频失败: 场景图片不存在: storyboard/scene_001.png
```

**解决方案**:
- 确保先运行 `storyboard` 生成图片
- 检查 `-images` 参数路径是否正确
- 检查图片文件命名格式

### 问题3: 音频文件找不到

**现象**: 场景显示 "无音频，使用基础时长"

**解决方案**:
- 确保先运行 `audiosync` 生成音频
- 检查 `-audio` 参数路径是否正确
- 检查音频文件命名格式：`scene_XXX_dialogue_YYY.mp3`
- 注意：没有对话的场景是正常的，会使用 `-image-time` 指定的时长

### 问题4: 字幕乱码

**现象**: 视频中的中文字幕显示为方块或乱码

**解决方案**:
```bash
# 方案1: 使用系统中文字体
-vf "subtitles=file.srt:force_style='FontName=Microsoft YaHei'"

# 方案2: 指定字体文件
-vf "subtitles=file.srt:fontsdir=/System/Library/Fonts"

# 方案3: 使用 Arial Unicode MS
-vf "subtitles=file.srt:force_style='FontName=Arial Unicode MS'"
```

### 问题5: 视频无法播放

**现象**: 生成的视频文件某些播放器无法播放

**解决方案**:
```bash
# 确保使用兼容的编码格式
# 在代码中已使用 -pix_fmt yuv420p（兼容性最好）

# 如果还是有问题，尝试重新编码
ffmpeg -i final.mp4 -c:v libx264 -c:a aac -strict experimental final_fixed.mp4
```

## 📈 性能优化

### 并行处理（未实现）

当前是串行处理场景，可以优化为并行：

```go
// 使用 goroutine 并行生成场景视频
var wg sync.WaitGroup
semaphore := make(chan struct{}, 4)  // 限制并发数

for i, scene := range scriptData.Script {
    wg.Add(1)
    go func(i int, scene Scene) {
        defer wg.Done()
        semaphore <- struct{}{}
        defer func() { <-semaphore }()
        
        // 生成场景视频...
    }(i, scene)
}
wg.Wait()
```

### 减小输出文件大小

```bash
# 使用更高的压缩率（牺牲一些质量）
-crf 28           # 默认23，值越大文件越小

# 降低分辨率
-vf "scale=1280:720"  # 从原始尺寸降至720p

# 降低帧率
-fps 15           # 从24降至15

# 降低音频比特率
-b:a 96k          # 从默认128k降至96k
```

## 🎯 最佳实践

1. **确保输入完整**
   - 运行前确认所有场景都有对应的图片
   - 检查音频文件是否完整（可以接受没有音频的场景）

2. **选择合适的参数**
   - 短小说：使用默认参数
   - 长小说：考虑降低 FPS 或调整 `-image-time` 减小文件大小

3. **测试流程**
   - 先用少量场景测试（修改剧本JSON，只保留前几个场景）
   - 确认效果后再处理完整内容

4. **字幕优化**
   - 如需更精细的字幕时间控制，可手动编辑生成的 SRT 文件
   - 考虑根据音频实际长度调整字幕显示时间

5. **保存中间文件**
   - 如需反复调试，可注释掉 `defer os.RemoveAll(tempDir)`
   - 保留场景视频片段便于单独检查

## 📚 相关文档

- [USAGE.md](USAGE.md) - 步骤一+二：剧本生成
- [STORYBOARD.md](STORYBOARD.md) - 步骤三：分镜生成
- [AUDIO.md](AUDIO.md) - 步骤四：语音合成
- [QUICKSTART.md](QUICKSTART.md) - 完整流程快速开始
- [demo.sh](demo.sh) - 自动化演示脚本

## 🎓 技术细节

### SRT 字幕格式

```srt
序号
开始时间 --> 结束时间
字幕文本

序号
开始时间 --> 结束时间
字幕文本
```

时间格式：`HH:MM:SS,mmm`（时:分:秒,毫秒）

### FFmpeg Concat 协议

```
file '/absolute/path/to/file1.mp4'
file '/absolute/path/to/file2.mp4'
file '/absolute/path/to/file3.mp4'
```

- 必须使用绝对路径或正确的相对路径
- 使用 `-safe 0` 允许所有路径
- 使用 `-c copy` 避免重新编码（速度快）

### 视频时长计算

```
场景视频时长 = MAX(音频总时长, 基础显示时间)
```

- 有音频：使用音频时长
- 无音频：使用 `-image-time` 指定的时长
- 最终视频时长 = 所有场景时长之和

## 🚀 下一步

完成视频合成后，你可以：

1. **播放视频**: `open final_anime.mp4`
2. **分享作品**: 上传到视频平台
3. **优化参数**: 调整字幕样式、视频质量等
4. **批量处理**: 处理多个小说生成多个动漫

---

查看 [QUICKSTART.md](QUICKSTART.md) 了解完整的五步流程！

