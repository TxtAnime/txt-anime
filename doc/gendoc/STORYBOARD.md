# 分镜生成工具使用说明

## 功能概述

`storyboard` 工具是步骤三的实现，用于根据步骤一生成的剧本JSON文件，为每个场景生成匹配的动漫风格图片。

## 核心特性

✅ **动漫风格**: 所有图片使用anime visual novel风格  
✅ **纯场景图片**: 专注于场景和角色的视觉表现，无文字对话  
✅ **角色一致性**: 使用步骤二生成的"黄金描述"确保角色视觉一致  
✅ **批量生成**: 自动为所有场景生成图片  
✅ **高质量输出**: 清晰的场景构图，无文字干扰  

## 编译

```bash
go build -o storyboard ./cmd/storyboard
```

## 使用方法

### 基础用法

```bash
# 使用默认参数
./storyboard -input script.json

# 指定输出目录
./storyboard -input script.json -output my-storyboard
```

### 参数说明

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `-input` | 输入JSON文件(步骤一生成) | 必填 | `script.json` |
| `-output` | 输出图片目录 | `storyboard` | `output` |
| `-size` | 图片尺寸 | `1536x1024` | `1024x1024` |
| `-layout` | 分镜布局 | `auto` | `single`, `2-panel`, `3-panel`, `4-panel` |

### 支持的图片尺寸

根据[七牛云API文档](https://developer.qiniu.com/aitokenapi/13166/text-to-image-api):

**正方形**:
- `1024x1024`

**横向** (推荐用于动漫场景):
- `1536x1024` (默认)
- `1792x1024`
- `1344x768`
- `1248x832`
- `1184x864`
- `1152x896`
- `1536x672`

**纵向**:
- `1024x1536`
- `1024x1792`
- `768x1344`
- `832x1248`
- `864x1184`
- `896x1152`

### 分镜布局模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `auto` | 自动选择(推荐) | 根据对话数量智能决定 |
| `single` | 单格场景 | 环境描写、动作场面 |
| `2-panel` | 双格漫画 | 简单对话 |
| `3-panel` | 三格漫画 | 多人对话 |
| `4-panel` | 四格漫画 | 复杂对话场景 |

## 使用示例

### 示例1: 基础使用

```bash
# 先生成剧本
./novel2comicli -input story.txt -output story.json

# 生成分镜
./storyboard -input story.json
```

生成的图片将保存在 `storyboard/` 目录:
```
storyboard/
├── scene_001.png
├── scene_002.png
├── scene_003.png
...
```

### 示例2: 自定义参数

```bash
# 使用正方形尺寸，强制单格布局
./storyboard -input story.json -output images -size 1024x1024 -layout single
```

### 示例3: 完整流程

```bash
# 步骤1: 生成剧本和角色
./novel2comicli -input the-wandering-earth.txt -output earth.json

# 步骤2: 生成分镜图片
./storyboard -input earth.json -output earth-storyboard -size 1536x1024

# 查看结果
ls -lh earth-storyboard/
```

## 提示词构建逻辑

程序会自动构建高质量的图像生成提示词，包含:

1. **基础风格**: `Anime visual novel style, detailed anime art, cinematic composition`
2. **场景类型**: `single full scene illustration, NO text, NO dialogue bubbles`
3. **场景地点**: 来自`location`字段
4. **时间设定**: 来自`time_of_day`字段（如有）
5. **角色描述**: 注入"黄金描述"确保一致性
6. **动作描述**: 来自`action_description`字段（核心内容）
7. **视觉细节**: 来自`visual_description`字段
8. **情感氛围**: 来自`emotional_tone`字段
9. **镜头角度**: 来自`camera_shot`字段
10. **背景元素**: 来自`background_elements`数组
11. **质量强化**: `High quality anime art, professional illustration, clean visual storytelling`

### 关于图片内容

**为什么不包含文字对话？**

由于图像生成模型在文字渲染方面存在技术限制（中文、英文都容易出现错误或乱码），我们采用了**纯视觉场景**的方案：

✅ **优点**：
- 图片质量更高，无文字错误
- 专注于视觉表现和场景美感
- 角色表情和动作更突出
- 配合步骤四的语音效果更佳

💡 **对话处理**：
- 对话内容由步骤四（音频合成）生成语音文件
- 可以在后期添加字幕或文字图层
- 纯视觉+语音的方式更接近动画效果

### 提示词示例（英文版）

```
Anime visual novel style, manga artwork, detailed anime art, cinematic composition, 
with English text in dialogue bubbles and subtitles, 
manga panel layout with 2 panels showing dialogue exchange, 
Location: 拜克努尔航天基地发射架旁. 
Characters: 50岁左右的苏联男性，戴着厚重的眼镜，穿着灰色工程师制服..., 
and 外星人伪装成人类，30岁左右的模糊性别人形，穿着简洁的黑色西装.... 
Action: 科罗廖夫看着刚刚升空的火箭留下的尾迹，身旁一个神秘的陌生人向他走来. 
Scene dialogue: G says: "总设计师同志，请接受一个普通人的祝贺！", 
then 谢尔盖·科罗廖夫 says: "谢谢，你的笑话？". 
Show these dialogues in speech bubbles with clear English text. 
High quality anime art, professional manga illustration, detailed backgrounds, 
expressive characters, dramatic lighting. 
All dialogue bubbles must show clear, readable English text. 
Use standard English language for all text elements.
```

**说明**: 虽然对话内容是中文，但提示词明确要求模型在图片中使用英文文字。模型会理解对话含义并生成相应的英文文字显示。

## 性能和成本

- **生成时间**: 约10-15秒/张图片
- **Token消耗**: 约5000 tokens/张图片
- **图片大小**: 约1-2MB/张(PNG格式)

### 批量生成估算

| 场景数 | 预计时间 | Token消耗 |
|--------|----------|-----------|
| 5个 | 1分钟 | 25K tokens |
| 10个 | 2分钟 | 50K tokens |
| 20个 | 4分钟 | 100K tokens |

## 技术细节

### API使用

- **模型**: `gemini-2.5-flash-image` (Nano Banana)
- **接入点**: `https://openai.qiniu.com/v1`
- **接口**: `/v1/images/generations`
- **格式**: Base64编码的PNG图片

### 角色一致性实现

程序通过以下方式确保角色视觉一致性:

1. 读取步骤二生成的`characters`字典
2. 为场景中的每个角色注入完整的"黄金描述"
3. 每次图像生成都重复这个描述
4. 避免依赖模型"记忆"角色

## 常见问题

**Q: 为什么图片中的文字是英文而不是中文？**  
A: 图像生成模型在生成准确的中文文字方面有技术限制，容易出现字符错误、变形或乱码。使用英文可以确保文字清晰可读。这是当前AI图像生成技术的限制。

**Q: 能否生成中文文字的图片？**  
A: 目前Gemini 2.5 Flash Image模型对中文支持有限。如果需要中文，建议在后期使用图片编辑工具手动添加中文字幕，或等待支持中文的图像生成模型。

**Q: 图片不是动漫风格怎么办?**  
A: 提示词已强制使用`Anime visual novel style`和`manga artwork`，应该能确保风格。如果仍有问题，可能需要在`action_description`中也强调"动漫风格"。

**Q: 角色外观不一致怎么办?**  
A: 检查步骤一生成的JSON中`characters`字段的描述是否足够详细。可以手动编辑JSON文件增强角色描述。

**Q: 生成失败怎么办?**  
A: 程序会跳过失败的场景继续处理其他场景。检查网络连接和API配额。

**Q: 能否生成更大的图片?**  
A: 受API限制，目前最大支持`1792x1024`。

**Q: 如何加快生成速度?**  
A: 可以并行运行多个实例处理不同的场景(需要手动拆分JSON文件)。

**Q: 图片质量不满意怎么办?**  
A: 可以:
1. 优化步骤一中的`action_description`使其更具画面感
2. 增强步骤二中的角色视觉描述
3. 手动编辑JSON后重新生成
4. 后期使用Photoshop等工具编辑

## 输出格式

生成的图片按场景ID命名:

```
storyboard/
├── scene_001.png  # 场景1
├── scene_002.png  # 场景2
├── scene_003.png  # 场景3
...
```

图片格式: PNG  
颜色模式: RGB  
编码: 标准PNG

## 后续步骤

生成的图片可以用于:

1. **步骤四**: 配合对话生成音频
2. **步骤五**: 合成最终视频
3. **预览**: 创建Web页面展示图文结合效果
4. **编辑**: 使用Photoshop等工具进一步编辑

## 最佳实践

### 1. 优化输入JSON

在运行分镜生成前，建议检查和优化JSON:

```bash
# 查看角色描述是否详细
jq '.characters' script.json

# 查看场景动作描述
jq '.script[] | {scene_id, action_description}' script.json
```

### 2. 分批处理

对于大量场景，建议分批处理:

```bash
# 生成前5个场景
jq '{script: .script[0:5], characters}' full.json > batch1.json
./storyboard -input batch1.json -output batch1

# 生成后续场景
jq '{script: .script[5:10], characters}' full.json > batch2.json
./storyboard -input batch2.json -output batch2
```

### 3. 验证结果

```bash
# 检查所有图片
ls -lh storyboard/*.png

# 统计生成数量
ls storyboard/*.png | wc -l
```

## 故障排除

### 图片无法保存

```bash
# 检查目录权限
ls -ld storyboard/

# 创建目录
mkdir -p storyboard
chmod 755 storyboard
```

### API限流

如果遇到限流，添加延迟:

```bash
# 修改代码添加sleep
# 或分多次运行
```

### 网络问题

```bash
# 测试API连通性
curl -I https://openai.qiniu.com/v1/models

# 检查代理设置
echo $HTTP_PROXY
```

## 参考文档

- [七牛云文生图API文档](https://developer.qiniu.com/aitokenapi/13166/text-to-image-api)
- [Gemini 2.5 Flash Image 模型介绍](https://developer.qiniu.com/aitokenapi/13166/text-to-image-api)

