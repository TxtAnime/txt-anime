# 语言设置说明

## 为什么图片中使用英文而不是中文？

### 技术限制

当前使用的图像生成模型 **Gemini 2.5 Flash Image (Nano Banana)** 在生成准确的中文文字方面存在技术限制：

**中文生成的问题**：
- ❌ 字符错误或变形
- ❌ 使用日文汉字代替简体中文
- ❌ 繁体字和简体字混用
- ❌ 文字不清晰或乱码
- ❌ 笔画错误

**英文生成的优势**：
- ✅ 文字清晰可读
- ✅ 拼写准确
- ✅ 符合视觉小说标准
- ✅ 专业外观

### 解决方案

**当前方案（英文）**：
```go
// 提示词设置
"with English text in dialogue bubbles and subtitles"
"Show these dialogues in speech bubbles with clear English text"
"All dialogue bubbles must show clear, readable English text"
"Use standard English language for all text elements"
```

虽然输入的JSON文件中对话是中文，但提示词明确要求模型在图片中生成英文文字。模型会理解中文对话的含义，并生成相应的英文文字。

## 替代方案

### 方案1: 后期添加中文字幕（推荐）

生成英文图片后，使用图片编辑工具添加中文字幕：

**工具选择**：
- **Photoshop**: 专业级编辑
- **GIMP**: 免费开源
- **Python PIL**: 自动化批量处理
- **FFmpeg**: 视频字幕

**优势**：
- 完全控制字体、大小、位置
- 字幕质量高
- 可以使用任何中文字体

**示例代码（Python）**：
```python
from PIL import Image, ImageDraw, ImageFont

# 打开图片
img = Image.open('scene_001.png')
draw = ImageDraw.Draw(img)

# 加载中文字体
font = ImageFont.truetype('SimHei.ttf', 24)

# 添加中文字幕
draw.text((100, 100), "你好，世界！", font=font, fill='white')

# 保存
img.save('scene_001_chinese.png')
```

### 方案2: 等待更好的模型

未来可能出现对中文支持更好的图像生成模型：
- Midjourney（部分支持中文）
- DALL-E 4（未来版本可能改进）
- 国内图像生成模型（如文心一格、通义万相）

### 方案3: 无文字图片 + 外部字幕

生成不包含对话气泡的纯场景图片，然后：
- 在视频合成时添加字幕
- 在Web应用中显示文字
- 在PDF/电子书中配文字

**修改提示词**：
```go
// 去掉对话气泡
"no dialogue bubbles, no text, pure scene illustration"
```

## 当前实现

### 提示词结构

```
1. 动漫风格标签
   "Anime visual novel style, manga artwork"

2. 语言设置（关键）
   "with English text in dialogue bubbles and subtitles"

3. 场景内容
   Location, Characters, Action

4. 对话内容（中文）
   Scene dialogue: 角色 says: "中文对话"

5. 文字要求
   "Show these dialogues in speech bubbles with clear English text"
   "All dialogue bubbles must show clear, readable English text"
```

### 工作流程

```
中文小说 
   ↓
步骤一: 生成中文剧本JSON
   ↓
步骤三: 提示词包含中文对话 + 要求英文显示
   ↓
图像模型: 理解中文含义 + 生成英文文字
   ↓
输出: 英文对话气泡的动漫图片
```

## 未来改进

### 短期（如需要中文）

1. **手动后期处理**
   - 使用Photoshop批量添加中文字幕
   - 制作字幕模板提高效率

2. **自动化脚本**
   - 编写Python脚本自动添加中文字幕
   - 读取JSON中的对话内容
   - 在图片上叠加中文文字

### 中期

1. **尝试其他模型**
   - 测试国内图像生成模型
   - 评估中文支持质量

2. **混合方案**
   - 英文图片 + 中文字幕层
   - 视频合成时添加中文

### 长期

1. **等待技术进步**
   - 多语言图像生成模型
   - 更好的文字渲染能力

2. **自建模型**
   - Fine-tune支持中文的模型
   - 专门针对视觉小说优化

## 总结

**当前选择**：使用英文文字
- ✅ 可行性高
- ✅ 质量稳定
- ✅ 立即可用

**如需中文**：建议后期添加
- 使用图片编辑工具
- 或在视频/Web中添加字幕

**技术原因**：模型限制，非程序bug

---

**最后更新**: 2025-10-24  
**当前版本**: v0.3.1 (英文版)

