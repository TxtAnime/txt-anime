# 音频合成工具使用文档

## 功能概述

`audiosync` 工具是步骤四的实现，用于根据步骤一生成的剧本JSON文件，为每个对话生成语音文件（TTS）。

## 核心特性

✅ **智能音色匹配**: 根据角色描述自动选择合适的音色  
✅ **批量生成**: 自动为所有对话生成语音文件  
✅ **角色一致性**: 每个角色使用固定的音色  
✅ **中文语音**: 支持七牛云TTS API的所有中文音色  
✅ **Fallback机制**: AI匹配失败时使用规则匹配

## 编译

```bash
go build -o audiosync ./cmd/audiosync
```

## 使用方法

### 基本用法

```bash
./audiosync -input script.json -output audio
```

### 参数说明

| 参数 | 说明 | 必需 | 默认值 |
|------|------|------|--------|
| `-input` | 输入的剧本JSON文件路径 | 是 | - |
| `-output` | 输出音频文件的目录 | 否 | `audio` |

### 完整示例

```bash
# 1. 编译程序
go build -o audiosync ./cmd/audiosync

# 2. 生成音频（使用demo文件）
./audiosync -input demo-script.json -output demo-audio

# 3. 查看结果
ls -lh demo-audio/
```

## 工作流程

```
1. 读取剧本JSON
   ↓
2. 获取可用音色列表
   ↓
3. 为每个角色匹配音色
   - 优先尝试使用AI匹配（LLM）
   - 失败则使用规则匹配
   ↓
4. 遍历所有场景的对话
   ↓
5. 调用TTS API生成语音
   ↓
6. 保存MP3文件
```

## 音色匹配逻辑

### AI匹配（首选）

程序会调用LLM，结合以下信息为角色选择最合适的音色：
- 角色的详细描述
- 角色在对话中的语气和情感
- 前3个场景的对话样本
- 可用音色列表及其特点

### 规则匹配（Fallback）

如果AI匹配失败，使用以下规则：

| 角色类型 | 匹配音色 |
|---------|---------|
| 机器人 | 磁性课件男声 (qiniu_zh_male_cxkjns) |
| 小女孩/儿童 | 动漫樱桃丸子 (qiniu_zh_female_dmytwz) |
| 少年 | 火力少年凯凯 (qiniu_zh_male_hlsnkk) |
| 成年女性 | 温婉学科讲师 (qiniu_zh_female_wwxkjx) |
| 成年男性 | 邻家辅导学长 (qiniu_zh_male_ljfdxz) |

## 可用音色列表

### 传统音色 - 女性

| 音色ID | 名称 | 适合角色 |
|--------|------|----------|
| qiniu_zh_female_wwxkjx | 温婉学科讲师 | 成熟、知性女性 |
| qiniu_zh_female_tmjxxy | 甜美教学小源 | 年轻、活泼女性 |
| qiniu_zh_female_xyqxxj | 校园清新学姐 | 学生、少女 |
| qiniu_zh_female_ljfdxx | 邻家辅导学姐 | 邻家女孩 |
| qiniu_zh_female_glktss | 干练课堂思思 | 职业女性 |
| qiniu_zh_female_kljxdd | 开朗教学督导 | 开朗女性 |
| qiniu_zh_female_zxjxnjs | 知性教学女教师 | 教师、专业人士 |

### 传统音色 - 男性

| 音色ID | 名称 | 适合角色 |
|--------|------|----------|
| qiniu_zh_male_ljfdxz | 邻家辅导学长 | 年轻男性、学生 |
| qiniu_zh_male_szxyxd | 率真校园向导 | 活泼男性 |
| qiniu_zh_male_whxkxg | 温和学科小哥 | 温和男性 |
| qiniu_zh_male_wncwxz | 温暖沉稳学长 | 沉稳男性 |
| qiniu_zh_male_ybxknjs | 渊博学科男教师 | 教师、长者 |
| qiniu_zh_male_tyygjs | 通用阳光讲师 | 阳光男性 |

### 特殊音色 - 儿童/青少年

| 音色ID | 名称 | 适合角色 |
|--------|------|----------|
| qiniu_zh_female_dmytwz | 动漫樱桃丸子 | 小女孩、动漫角色 |
| qiniu_zh_female_segsby | 少儿故事配音 | 儿童故事角色 |
| qiniu_zh_female_yyqmpq | 英语启蒙佩奇 | 卡通角色 |
| qiniu_zh_male_hlsnkk | 火力少年凯凯 | 少年、男孩 |
| qiniu_zh_male_hllzmz | 活力率真萌仔 | 活泼男孩 |
| qiniu_zh_male_etgsxe | 儿童故事熊二 | 儿童故事角色 |
| qiniu_zh_male_tcsnsf | 天才少年示范 | 聪明少年 |

### 特殊音色 - 其他

| 音色ID | 名称 | 适合角色 |
|--------|------|----------|
| qiniu_zh_male_cxkjns | 磁性课件男声 | 机器人、旁白 |
| qiniu_zh_male_qslymb | 轻松懒音绵宝 | 慵懒角色 |
| qiniu_zh_female_cxjxgw | 慈祥教学顾问 | 长者、母亲 |

## 输出格式

### 文件命名

```
scene_{场景ID}_dialogue_{对话序号}.mp3
```

示例：
```
scene_001_dialogue_001.mp3  # 场景1的第1句对话
scene_001_dialogue_002.mp3  # 场景1的第2句对话
scene_002_dialogue_001.mp3  # 场景2的第1句对话
```

### 音色匹配信息

程序会在输出目录中生成 `voice_matches.json` 文件，记录每个角色使用的音色：

```json
{
  "美月": "qiniu_zh_female_dmytwz",
  "阿尔法": "qiniu_zh_male_cxkjns"
}
```

## 完整示例

```bash
# 准备工作目录
cd /Users/shijiayun/qbox/txt-anime

# 步骤1: 生成剧本（如果还没有）
./novel2comicli -input my-story.txt -output my-script.json

# 步骤2: 生成音频
./audiosync -input my-script.json -output my-audio

# 步骤3: 查看结果
ls -lh my-audio/

# 步骤4: 播放测试（macOS）
afplay my-audio/scene_001_dialogue_001.mp3

# 或在Linux上
# mpg123 my-audio/scene_001_dialogue_001.mp3
```

## 输出示例

```
🎤 步骤四: 音频合成
=====================================

📖 读取剧本文件...
✅ 已加载 5 个场景，2 个角色

🎵 获取可用音色列表...
✅ 共有 23 种音色可用

🤖 为角色匹配音色...
✅ 音色匹配完成:
  - 美月: 动漫樱桃丸子 (qiniu_zh_female_dmytwz)
  - 阿尔法: 磁性课件男声 (qiniu_zh_male_cxkjns)

🎙️  生成语音文件...
[1/4] 场景1 - 美月: 你是谁？
  ✅ 已保存: scene_001_dialogue_001.mp3
[2/4] 场景1 - 阿尔法: 我叫阿尔法，是一个护理型机器人...
  ✅ 已保存: scene_001_dialogue_002.mp3
[3/4] 场景4 - 阿尔法: 谢谢你，小女孩。作为回报...
  ✅ 已保存: scene_004_dialogue_001.mp3
[4/4] 场景4 - 美月: 好啊！
  ✅ 已保存: scene_004_dialogue_002.mp3

🎉 完成！所有音频文件已保存到: my-audio
   音色匹配信息: my-audio/voice_matches.json
```

## 性能和成本

- **生成速度**: 约1-2秒/段对话
- **文件大小**: 约10-50KB/MP3文件（取决于文字长度）
- **API调用**: 每段对话1次TTS API调用

## 技术实现

### API配置

```go
const (
    APIKey  = "your-api-key"
    BaseURL = "https://openai.qiniu.com/v1"
)
```

### TTS请求格式

```json
{
  "audio": {
    "voice_type": "qiniu_zh_female_tmjxxy",
    "encoding": "mp3",
    "speed_ratio": 1.0
  },
  "request": {
    "text": "你好，世界！"
  }
}
```

### 响应处理

API返回Base64编码的MP3数据，程序会自动解码并保存为文件。

## 常见问题

**Q: 如何手动指定角色的音色？**  
A: 编辑生成的 `voice_matches.json` 文件，修改对应角色的音色ID，然后重新运行程序。

**Q: 生成的语音质量如何？**  
A: 七牛云TTS质量较高，接近真人语音。不同音色适合不同角色类型。

**Q: 能否调整语速？**  
A: 目前使用默认语速(1.0)。可以修改代码中的 `speed_ratio` 参数（范围：0.5-2.0）。

**Q: 支持其他语言吗？**  
A: 当前仅支持中文。音色列表中有部分双语音色，但主要针对教学场景。

**Q: 如何处理生成失败的对话？**  
A: 程序会跳过失败的对话并继续处理其他对话，同时输出错误信息。

**Q: 音色匹配不满意怎么办？**  
A: 可以：
1. 修改 `voice_matches.json` 手动指定音色
2. 优化角色描述，让AI更准确匹配
3. 直接修改代码中的规则匹配逻辑

**Q: 能否批量处理多个剧本？**  
A: 可以写shell脚本循环调用：
```bash
for script in *.json; do
    ./audiosync -input "$script" -output "${script%.json}-audio"
done
```

## 后续步骤

生成音频后，可以进行：
1. **步骤五**: 最终合成 - 将图片、音频、字幕合成为视频
2. **音频编辑**: 使用Audacity等工具调整音量、添加音效
3. **字幕同步**: 根据音频时长调整视频字幕时间轴

## 文件结构

```
demo-audio/
├── scene_001_dialogue_001.mp3    # 场景1对话1
├── scene_001_dialogue_002.mp3    # 场景1对话2
├── scene_004_dialogue_001.mp3    # 场景4对话1
├── scene_004_dialogue_002.mp3    # 场景4对话2
└── voice_matches.json            # 音色匹配信息
```

## 最佳实践

1. **角色描述要详细**: 在步骤一生成剧本时，确保角色描述包含年龄、性别、性格等信息
2. **对话要自然**: 对话内容影响语音效果，避免过长的单句
3. **音色预听**: 使用七牛云提供的音色样例预听，选择最合适的音色
4. **批量生成**: 如果剧本较长，建议分批处理，避免一次性生成太多文件
5. **备份配置**: 保存 `voice_matches.json`，方便后续重新生成时使用相同配置

## 相关文档

- [快速开始](QUICKSTART.md) - 完整流程指南
- [剧本生成](USAGE.md) - 步骤一+二详细说明
- [分镜生成](STORYBOARD.md) - 步骤三详细说明
- [TTS API文档](https://developer.qiniu.com/aitokenapi/12981/asr-tts-ocr-api) - 七牛云官方文档

---

**版本**: v0.1.0  
**更新时间**: 2025-10-24

