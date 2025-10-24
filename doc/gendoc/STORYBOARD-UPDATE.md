# Storyboard 更新说明

## 更新日期
2025-10-24

## 更新原因

图像生成模型在文字渲染方面存在技术限制：
- ❌ 中文文字容易出现错误或乱码
- ❌ 英文文字也常出现拼写错误
- ❌ 对话气泡影响画面美感
- ❌ 文字质量难以保证

## 主要变更

### 1. 移除对话文字显示

**之前**：
- 尝试在图片中显示对话气泡
- 支持多格分镜布局（2-panel, 3-panel, 4-panel）
- 提示词包含对话内容

**现在**：
- ✅ 专注于纯场景视觉表现
- ✅ 每个场景生成一张高质量图片
- ✅ 无文字对话，无气泡干扰

### 2. 简化参数

**移除的参数**：
- `-layout` - 不再需要分镜布局选择

**保留的参数**：
- `-input` - 输入JSON文件
- `-output` - 输出目录
- `-size` - 图片尺寸（默认1792x1024）

### 3. 优化提示词

**新的提示词结构**：
```
1. 基础风格 - Anime visual novel style
2. 场景类型 - Single full scene, NO text
3. 场景地点 - Location + Time of day
4. 角色描述 - 完整的"黄金描述"
5. 动作描述 - Action description（核心）
6. 视觉细节 - Visual description
7. 情感氛围 - Mood/Emotional tone
8. 镜头角度 - Camera shot
9. 背景元素 - Background elements
10. 质量强化 - High quality, clean visual storytelling
```

**强调要素**：
- `NO text, NO dialogue bubbles, NO subtitles`
- `Clean visual storytelling, anime movie quality`

## 使用方式变更

### 旧用法
```bash
./storyboard -input script.json -output images -layout auto
./storyboard -input script.json -output images -layout 2-panel
```

### 新用法
```bash
# 默认横向高清
./storyboard -input script.json -output images

# 竖向高清
./storyboard -input script.json -output images -size 1024x1792

# 快速预览
./storyboard -input script.json -output images -size 1024x1024
```

## 输出变化

### 之前
- 多格分镜布局（可能包含对话文字）
- 文件名：`scene_001.png`, `scene_002.png`...

### 现在
- 单张完整场景图片（纯视觉）
- 文件名：`scene_001.png`, `scene_002.png`...（相同）
- 更高的视觉质量
- 更清晰的构图

## 配合其他工具

### 完整工作流

```bash
# 1. 生成剧本和角色
./novel2comicli -input novel.txt -output script.json

# 2. 生成场景图片（纯视觉）✨ 更新
./storyboard -input script.json -output images

# 3. 生成角色语音（对话）✨ 配合
./audiosync -input script.json -output audio

# 4. 后期合成（可选）
# - 使用FFmpeg合成视频
# - 添加字幕图层
# - 制作Web应用
```

### 视觉+语音的优势

**纯视觉图片**：
- ✅ 高质量场景表现
- ✅ 无文字错误
- ✅ 专业美术效果

**配合语音**：
- ✅ TTS生成的角色对话
- ✅ 准确的对话内容
- ✅ 自然的语音效果

**结合效果**：
- 🎬 图片展示场景和动作
- 🎤 语音传递对话和情感
- 💯 接近真正的动画效果

## 性能改进

| 指标 | 旧版本 | 新版本 | 改进 |
|------|--------|--------|------|
| 生成速度 | 10-15秒/张 | 10-15秒/张 | 相同 |
| 图片质量 | 中等（含文字错误） | 高（纯视觉） | ✅ 提升 |
| 提示词长度 | 较长 | 简洁 | ✅ 优化 |
| 可靠性 | 中等（文字问题） | 高（无文字） | ✅ 提升 |

## 兼容性

### JSON格式
完全兼容现有的剧本JSON格式，无需修改。

### 字段使用
支持以下字段（优先级从高到低）：
- `location` ✅ 必需
- `action_description` ✅ 核心
- `time_of_day` ✅ 推荐
- `visual_description` ⭐ 推荐
- `emotional_tone` ⭐ 可选
- `camera_shot` ⭐ 可选
- `background_elements` ⭐ 可选
- `dialogue` ❌ 不再使用（但不影响）

## 迁移指南

### 对于现有项目

1. **重新编译**
   ```bash
   go build -o storyboard ./cmd/storyboard
   ```

2. **更新命令**
   ```bash
   # 移除 -layout 参数
   ./storyboard -input script.json -output new-images
   ```

3. **对比效果**
   - 查看新旧图片的差异
   - 验证纯视觉效果

4. **配合语音**
   ```bash
   ./audiosync -input script.json -output audio
   ```

### 对于新项目

直接使用新版本，按照文档使用即可。

## 后续计划

### 短期
- ✅ 纯场景图片生成（已完成）
- 📝 配合语音文件
- 📝 更新所有文档和示例

### 中期
- 🎬 视频合成工具
- 📖 字幕生成工具
- 🌐 Web展示应用

### 长期
- 🎨 更多视觉风格选择
- 🎯 分镜构图优化
- 🔄 动态场景过渡

## 相关文档

- [STORYBOARD.md](STORYBOARD.md) - 完整使用文档（已更新）
- [AUDIO.md](AUDIO.md) - 语音合成文档
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [LANGUAGE-NOTES.md](LANGUAGE-NOTES.md) - 语言策略说明

## 反馈和建议

如有任何问题或建议，欢迎反馈！

---

**版本**: v2.0.0  
**更新时间**: 2025-10-24  
**兼容性**: 向后兼容，JSON格式无变化

