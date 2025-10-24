# 音画同步问题修复记录

## 🐛 问题描述

在步骤五（最终合成）中发现的音画不同步问题：

### 症状
- 某些场景没有对话（没有音频文件）
- 这些场景在视频中只显示图片一段时间（默认3秒）
- 但音频会一段接一段播放，导致音画不同步
- 表现为：视频时长 ~22秒，但音频时长 ~41秒

### 根本原因

问题出在音频参数不统一：

1. **有对话的场景**（使用 TTS 生成的音频）
   - 采样率：24000 Hz
   - 声道数：1（单声道）

2. **无对话的场景**（使用 anullsrc 生成的静音）
   - 采样率：44100 Hz
   - 声道数：2（立体声）

当使用 `ffmpeg concat` 协议拼接这些音频参数不一致的视频片段时，FFmpeg 会错误计算音频时长，导致严重的音画不同步。

## ✅ 解决方案

### 核心修改

在 `generateVideoWithFFmpeg` 函数中，统一所有场景视频的音频参数：

```go
// 有音频的场景
args = []string{
    "-loop", "1",
    "-i", imagePath,
    "-i", audioPath,
    "-vf", fmt.Sprintf("subtitles=%s:...", ...),
    "-t", fmt.Sprintf("%.2f", duration),
    "-r", fmt.Sprintf("%d", fps),
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-ar", "44100",  // ← 新增：统一采样率为 44100 Hz
    "-ac", "2",      // ← 新增：统一为立体声
    "-shortest",
    "-y",
    outputPath,
}

// 无音频的场景（生成静音）
args = []string{
    "-loop", "1",
    "-i", imagePath,
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-vf", fmt.Sprintf("subtitles=%s:...", ...),
    "-t", fmt.Sprintf("%.2f", duration),
    "-r", fmt.Sprintf("%d", fps),
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-ar", "44100",  // ← 统一采样率
    "-ac", "2",      // ← 统一声道数
    "-shortest",
    "-y",
    outputPath,
}
```

### 关键参数说明

| 参数 | 作用 | 值 |
|------|------|-----|
| `-ar` | 音频采样率（Audio Rate） | `44100` Hz |
| `-ac` | 音频声道数（Audio Channels） | `2`（立体声） |
| `-c:v` | 视频编码器 | `libx264` |
| `-c:a` | 音频编码器 | `aac` |

## 📊 修复效果

### 修复前

```bash
$ ffprobe demo-final.mp4
codec_type=video
duration=22.420003
codec_type=audio
duration=41.239417  # ❌ 音频时长异常
```

各场景音频参数不一致：
```
segment_001: 24000 Hz, 单声道
segment_002: 44100 Hz, 立体声
segment_003: 44100 Hz, 立体声
segment_004: 24000 Hz, 单声道
segment_005: 44100 Hz, 立体声
```

### 修复后

```bash
$ ffprobe demo-final.mp4
codec_type=video
duration=22.420003
codec_type=audio
duration=22.443220  # ✅ 音画同步
```

所有场景音频参数统一：
```
segment_001: 44100 Hz, 立体声
segment_002: 44100 Hz, 立体声
segment_003: 44100 Hz, 立体声
segment_004: 44100 Hz, 立体声
segment_005: 44100 Hz, 立体声
```

## 🎯 技术要点

### 1. FFmpeg Concat 协议的要求

使用 `ffmpeg concat` 协议拼接视频时：
- 所有片段的视频编码参数应一致（分辨率、帧率、编码格式）
- **所有片段的音频编码参数应一致**（采样率、声道数、编码格式）
- 参数不一致会导致时长计算错误或拼接失败

### 2. 为什么选择 44100 Hz

- **标准采样率**：44.1 kHz 是 CD 音质标准
- **兼容性好**：所有播放器都支持
- **质量足够**：对于语音来说完全够用
- **比 48000 Hz 更常见**：网络视频通常使用 44.1 kHz

### 3. 为什么选择立体声

- **兼容性**：所有设备都支持立体声
- **可降级**：立体声可以轻松降级为单声道
- **TTS 转换**：单声道 TTS 音频会被转换为立体声（左右声道相同）
- **文件大小**：对于语音，立体声和单声道的文件大小差异很小

## 🔍 调试方法

如果遇到类似问题，可以使用以下命令检查：

### 1. 检查单个片段

```bash
ffprobe -v error -show_entries stream=sample_rate,channels,duration \
  -of default=noprint_wrappers=1 segment_001.mp4
```

### 2. 批量检查所有片段

```bash
for f in temp_video_segments/segment_*.mp4; do
  echo "=== $(basename $f) ==="
  ffprobe -v error -select_streams a:0 \
    -show_entries stream=sample_rate,channels,duration \
    -of default=noprint_wrappers=1 "$f"
done
```

### 3. 检查最终视频

```bash
# 查看流信息
ffprobe -v error -show_entries stream=codec_type,sample_rate,channels,duration \
  -of default=noprint_wrappers=1 final.mp4

# 查看格式时长
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 final.mp4
```

### 4. 手动测试 Concat

```bash
# 创建测试列表
cat > test.list << EOF
file '/path/to/segment_001.mp4'
file '/path/to/segment_002.mp4'
EOF

# 执行拼接并查看详细信息
ffmpeg -f concat -safe 0 -i test.list -c copy test-output.mp4
```

## 💡 最佳实践

### 1. 音频参数标准化

在生成任何视频片段时，都应该：
- 使用一致的采样率（推荐 44100 Hz 或 48000 Hz）
- 使用一致的声道数（推荐立体声）
- 使用一致的编码格式（推荐 AAC）

### 2. 为无音频场景生成静音轨道

不要生成完全没有音频轨道的视频，而是生成带静音轨道的视频：

```bash
# ✅ 正确：带静音音频轨道
ffmpeg -loop 1 -i image.png \
  -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
  -t 3 -c:v libx264 -c:a aac -ar 44100 -ac 2 output.mp4

# ❌ 错误：没有音频轨道
ffmpeg -loop 1 -i image.png -t 3 -c:v libx264 output.mp4
```

### 3. 使用 Concat Demuxer

对于多个视频片段拼接，使用 concat demuxer 而不是 filter：

```bash
# ✅ 正确：使用 concat demuxer + copy 编码（快速、无损）
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4

# ❌ 不推荐：使用 concat filter（慢、需要重新编码）
ffmpeg -i input1.mp4 -i input2.mp4 \
  -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" output.mp4
```

### 4. 测试验证

生成视频后，始终验证：
```bash
# 检查音视频时长是否一致
ffprobe -v error -show_entries stream=duration \
  -of default=noprint_wrappers=1 output.mp4
```

## 📝 相关文档

- [FINALASSEMBLY.md](FINALASSEMBLY.md) - 步骤五使用文档
- [STEP5-SUMMARY.md](STEP5-SUMMARY.md) - 步骤五技术总结
- [FFmpeg 官方文档 - Concat](https://ffmpeg.org/ffmpeg-formats.html#concat-1)
- [FFmpeg 官方文档 - Audio Options](https://ffmpeg.org/ffmpeg.html#Audio-Options)

## ✅ 结论

通过统一所有视频片段的音频参数（采样率、声道数），成功解决了音画不同步问题。这个修复确保了：

1. ✅ 所有场景（有音频和无音频）都有音频轨道
2. ✅ 所有音频参数完全一致
3. ✅ FFmpeg concat 能正确计算和拼接音频
4. ✅ 最终视频音画完美同步

---

**修复日期**: 2025-10-24  
**影响版本**: v1.0  
**修复提交**: 统一音频参数修复音画同步

