# Storyboard 工具更新总结

## 🎨 主要变更（2025-10-24）

### 核心改变
- ✅ **纯场景图片** - 移除所有文字对话和气泡
- ✅ **简化参数** - 移除 `-layout` 参数
- ✅ **优化提示词** - 专注于视觉质量

### 为什么这样改？
1. **文字渲染问题** - 图像模型对中文/英文文字都容易出错
2. **质量优先** - 纯视觉场景质量更高、更可靠
3. **配合语音** - 对话由步骤四（TTS）处理，效果更好

## 📊 对比

| 特性 | 旧版本 | 新版本 |
|------|--------|--------|
| 对话显示 | ❌ 文字气泡（易出错） | ✅ 无文字（纯视觉） |
| 布局参数 | 多种分镜布局 | 单张完整场景 |
| 图片质量 | 中等 | 高 |
| 对话处理 | 图片中（不可靠） | TTS语音（准确） |

## 🚀 新用法

```bash
# 基本用法（推荐）
./storyboard -input script.json -output images

# 高清横向（默认）
./storyboard -input script.json -output images -size 1792x1024

# 高清竖向
./storyboard -input script.json -output images -size 1024x1792
```

## 🎬 完整工作流

```bash
# 1. 生成剧本
./novel2comicli -input novel.txt -output script.json

# 2. 生成图片（纯视觉）✨
./storyboard -input script.json -output images

# 3. 生成语音（对话）✨  
./audiosync -input script.json -output audio

# 结果：
# - images/scene_001.png （场景图片）
# - audio/scene_001_dialogue_001.mp3 （对话语音）
```

## ✨ 优势

1. **图片质量高** - 无文字错误，构图清晰
2. **对话准确** - TTS语音准确传达对话
3. **更像动画** - 视觉+语音分离，更接近真实动画效果
4. **易于后期** - 可以自由添加字幕或文字图层

---

查看完整文档：[STORYBOARD.md](STORYBOARD.md) | [STORYBOARD-UPDATE.md](STORYBOARD-UPDATE.md)
