# novel2comicli 使用说明

## 简介

这是一个将小说文本转换为结构化剧本和角色描述的命令行工具。它通过调用七牛云AI大模型推理API,将小说改编成适合动漫制作的JSON格式。

## 功能

- **步骤一**: 剧本改编 - 将小说拆分成多个场景,每个场景包含:
  - 场景ID
  - 地点描述
  - 出场角色
  - 旁白
  - 对话
  - 动作描述

- **步骤二**: 角色设计 - 提取主要角色的视觉描述,包含:
  - 年龄性别
  - 外貌特征
  - 典型服装
  - 其他显著特征

## 编译

```bash
go build -o novel2comicli ./cmd/novel2comicli
```

## 使用方法

```bash
./novel2comicli -input <输入文件路径> -output <输出文件路径>
```

### 参数说明

- `-input`: 必选,输入的小说文本文件路径
- `-output`: 可选,输出的JSON文件路径(默认为output.json)

### 示例

```bash
# 使用默认输出文件
./novel2comicli -input the-wandering-earth.txt

# 指定输出文件
./novel2comicli -input the-wandering-earth.txt -output result.json
```

## 输出格式

输出的JSON文件包含两个字段:

```json
{
  "script": [
    {
      "scene_id": 1,
      "location": "场景地点",
      "characters_present": ["角色1", "角色2"],
      "narration": "旁白描述",
      "dialogue": [
        {
          "character": "角色名",
          "line": "台词内容"
        }
      ],
      "action_description": "动作和氛围描述"
    }
  ],
  "characters": {
    "角色名": "完整的视觉描述字符串"
  }
}
```

## API配置

当前使用的是七牛云AI大模型推理API:
- 接入点: https://openai.qiniu.com/v1
- 模型: deepseek-v3
- API密钥已内置在代码中

如需修改配置,请编辑 `cmd/novel2comicli/main.go` 文件中的常量定义。

## 注意事项

1. 输入文件应为UTF-8编码的文本文件
2. 程序会根据小说长度自动生成5-15个场景
3. 只提取主要角色的描述
4. 处理长篇小说可能需要较长时间
5. 确保有网络连接以访问API

## 技术栈

- Go 1.24.1
- github.com/sashabaranov/go-openai v1.35.7
- 七牛云AI大模型推理API

## 后续步骤

生成的JSON文件可用于:
- 步骤三: 根据场景描述生成图像
- 步骤四: 根据对话生成语音
- 步骤五: 合成最终的动漫视频

