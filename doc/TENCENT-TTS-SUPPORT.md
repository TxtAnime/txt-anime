# 腾讯云TTS支持和Emotion功能

## 概述

本次更新为 txt-anime 项目添加了以下功能：

1. **支持腾讯云TTS服务**：除了现有的七牛云TTS，现在可以选择使用腾讯云的语音合成服务
2. **Emotion情感支持**：对话可以带有情感标签，在语音合成时应用对应的情感表达
3. **多情感音色**：腾讯云TTS提供了19种支持多情感的精品音色

## 主要改动

### 1. 配置文件变更

#### `config.json` 新增字段

```json
{
  "tts_provider": "qiniu",  // 可选值: "qiniu" 或 "tencent"
  "tencent_tts": {
    "secret_id": "YOUR_TENCENT_SECRET_ID",
    "secret_key": "YOUR_TENCENT_SECRET_KEY",
    "region": "ap-guangzhou"  // 腾讯云地域
  }
}
```

### 2. 剧本生成支持Emotion

`novel2script` 包现在会在生成剧本时为对话添加 `emotion` 字段：

```json
{
  "dialogue": [
    {
      "character": "小红帽",
      "line": "外婆，你的耳朵怎么这么大？",
      "emotion": "fear"
    }
  ]
}
```

**支持的情感值**：
- `neutral` - 中性（默认）
- `sad` - 悲伤
- `happy` - 高兴
- `angry` - 生气
- `fear` - 恐惧
- `sajiao` - 撒娇
- `amaze` - 震惊
- `disgusted` - 厌恶
- `peaceful` - 平静
- `news` - 新闻播报
- `story` - 故事叙述
- `radio` - 广播
- `poetry` - 诗歌朗诵
- `call` - 客服

### 3. 新增 audiosynctc 包

创建了 `pkgs/audiosynctc/` 包，专门对接腾讯云TTS服务：

**核心功能**：
- 使用腾讯云官方SDK (`tencentcloud-sdk-go`)
- 内置19种支持多情感的音色
- AI智能匹配角色与音色
- 自动应用对话情感到语音合成

**支持的腾讯云音色（大模型音色）**：

| VoiceType | 名称 | 性别 | 支持的情感 |
|-----------|------|------|------------|
| 601000 | 爱小溪 | 女 | 聊天女声（支持9种情感） |
| 601001 | 爱小洛 | 女 | 阅读女声（支持9种情感） |
| 601002 | 爱小辰 | 男 | 聊天男声（支持9种情感） |
| 601003 | 爱小荷 | 女 | 阅读女声（支持10种情感） |
| 601004 | 爱小树 | 男 | 资讯男声（支持9种情感） |
| 601005 | 爱小静 | 女 | 聊天女声（支持9种情感） |
| 601006 | 爱小耀 | 男 | 阅读男声（支持9种情感） |
| 601007 | 爱小叶 | 女 | 聊天女声（支持9种情感） |
| 601008 | 爱小豪 | 男 | 聊天男声（支持9种情感） |
| 601009 | 爱小芊 | 女 | 聊天女声（支持9种情感） |
| 601010 | 爱小娇 | 女 | 聊天女声（支持9种情感） |
| 601015 | 爱小童 | 男童 | 男童声（支持9种情感） |
| 101016 | 智甜 | 女童 | 女童声（仅中性） |

**说明**：大模型音色（601xxx）支持更丰富的情感表达，包括：中性、悲伤、高兴、生气、恐惧、撒娇、震惊、厌恶、平静等9种情感。部分音色还支持新闻、故事、广播、诗歌、客服等特定场景。

## 使用方法

### 使用七牛云TTS（默认）

配置文件保持默认即可：

```json
{
  "tts_provider": "qiniu"
}
```

### 使用腾讯云TTS

1. **获取腾讯云凭证**：
   - 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
   - 进入"访问管理" > "API密钥管理"
   - 创建或查看 SecretId 和 SecretKey

2. **修改配置文件**：

```json
{
  "tts_provider": "tencent",
  "tencent_tts": {
    "secret_id": "你的SecretId",
    "secret_key": "你的SecretKey",
    "region": "ap-guangzhou"
  }
}
```

3. **运行服务**：

```bash
./novel2comicd -config config.json
```

## 工作流程

### 1. 小说转剧本（带Emotion）

```bash
# novel2script 会自动为对话添加emotion字段
POST /v1/tasks/
{
  "novel": "你的小说内容"
}
```

生成的剧本JSON：
```json
{
  "script": [
    {
      "scene_id": 1,
      "dialogue": [
        {
          "character": "角色A",
          "line": "你好！",
          "emotion": "happy"
        }
      ]
    }
  ]
}
```

### 2. AI匹配音色

系统会根据角色描述、对话内容和性格，自动为每个角色选择最合适的音色。

例如：
- 旁白 → 智芸（知性女声）
- 男主角 → 智云（通用男声）
- 女主角 → 智瑜（情感女声）
- 儿童角色 → 智萌/智甜（童声）

### 3. 生成带情感的语音

在语音合成时，如果对话包含 `emotion` 字段，会自动应用到语音合成：

```
[1/10] 场景1 - 小红帽 [fear]: 外婆，你的耳朵怎么这么大？
  ✅ 已保存: scene_001_dialogue_001.mp3 (45.2 KB)
```

## 技术细节

### 向后兼容

- 七牛云TTS继续正常工作
- 现有的 `audiosync` 包会忽略 `emotion` 字段
- 不影响现有功能

### 依赖管理

项目已添加腾讯云SDK依赖：
```
github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/tts v1.1.27
github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common v1.1.27
```

### 音色选择策略

1. **旁白**：优先选择知性、适合叙事的音色（如智芸101009）
2. **儿童角色**：自动选择童声（智萌101015、智甜101016）
3. **成人角色**：根据性别和性格选择
4. **情感丰富角色**：优先选择支持多种情感的音色

## 参考文档

- [腾讯云TTS API文档](https://cloud.tencent.com/document/api/1073/37995)
- [腾讯云音色列表](https://cloud.tencent.com/document/product/1073/92668)
- [腾讯云SDK Go版本](https://github.com/TencentCloud/tencentcloud-sdk-go)

## 示例对比

### 不带Emotion（普通）

```json
{
  "character": "小红帽",
  "line": "外婆，你好！"
}
```
→ 生成普通中性语音

### 带Emotion（情感丰富）

```json
{
  "character": "小红帽",
  "line": "外婆，你好！",
  "emotion": "happy"
}
```
→ 生成带有高兴情感的语音

## 故障排除

### Q: 腾讯云TTS报错 "鉴权失败"

A: 检查 `secret_id` 和 `secret_key` 是否正确，确保账号已开通语音合成服务。

### Q: 生成的语音没有情感效果

A: 确保：
1. 使用的是腾讯云TTS（`tts_provider: "tencent"`）
2. 选择的音色支持对应的情感
3. 剧本JSON中包含 `emotion` 字段

### Q: 如何让AI生成更多的emotion标签？

A: 在小说中加入更多情感描写，AI会自动识别并添加对应的emotion字段。

## 未来改进

- [ ] 支持自定义音色参数（语速、音量等）
- [ ] 支持更多TTS服务商（阿里云、百度云等）
- [ ] 提供音色预览功能
- [ ] 支持情感强度控制（EmotionIntensity）

