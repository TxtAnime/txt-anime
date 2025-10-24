package novel2script

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"

	openai "github.com/sashabaranov/go-openai"
)

const (
	DefaultBaseURL = "https://openai.qiniu.com/v1"
	DefaultModel   = "deepseek-v3"
)

// Scene 场景结构
type Scene struct {
	SceneID           int            `json:"scene_id"`
	Location          string         `json:"location"`
	CharactersPresent []string       `json:"characters_present"`
	Narration         string         `json:"narration"`
	Dialogue          []DialogueLine `json:"dialogue"`
	ActionDescription string         `json:"action_description"`
}

// DialogueLine 对话行
type DialogueLine struct {
	Character string `json:"character"`
	Line      string `json:"line"`
}

// Response 响应结构
type Response struct {
	Script     []Scene           `json:"script"`
	Characters map[string]string `json:"characters"`
}

// Config 配置
type Config struct {
	BaseURL string
	APIKey  string
	Model   string
}

// Process 处理小说文本，生成剧本和角色描述
func Process(novelText string, cfg Config) (*Response, error) {
	config := openai.DefaultConfig(cfg.APIKey)
	config.BaseURL = cfg.BaseURL

	// 创建自定义HTTP客户端以处理TLS证书验证问题
	httpClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}
	config.HTTPClient = httpClient

	client := openai.NewClientWithConfig(config)

	prompt := buildPrompt(novelText)

	req := openai.ChatCompletionRequest{
		Model: cfg.Model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "你是一个专业的剧本改编师和角色设计师。你擅长将小说改编成结构化的剧本格式,并提取角色的视觉描述。",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
	}

	resp, err := client.CreateChatCompletion(context.Background(), req)
	if err != nil {
		return nil, fmt.Errorf("API调用失败: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("API返回空响应")
	}

	content := resp.Choices[0].Message.Content

	// 尝试提取JSON(如果响应包含代码块)
	content = extractJSON(content)

	var response Response
	err = json.Unmarshal([]byte(content), &response)
	if err != nil {
		return nil, fmt.Errorf("解析JSON失败: %w\n原始响应: %s", err, content)
	}

	return &response, nil
}

func buildPrompt(novelText string) string {
	return fmt.Sprintf(`请将以下小说改编成结构化的剧本格式,并提取主要角色的视觉描述。

要求:
1. 将小说拆分成多个场景(scene),每个场景包含:
   - scene_id: 场景序号(从1开始)
   - location: 场景地点的简短描述
   - characters_present: 此场景出现的角色名称列表
   - narration: 旁白描述(用于背景介绍或角色心理活动)
   - dialogue: 对话数组,每个对话包含character(角色名)和line(台词)
   - action_description: 场景中关键动作或氛围的描述(用于后续图像生成)

2. 提取所有主要角色的视觉描述,包括:
   - 年龄、性别
   - 外貌特征(发型、发色、眼睛、身材等)
   - 典型服装
   - 其他显著特征
   
   将这些信息整合成一个简洁的视觉提示词(适合图像生成使用),用一段连贯的文本描述

请以JSON格式返回,包含两个字段:
- script: 场景数组
- characters: 角色名到视觉描述字符串的映射(对象),格式如: {"角色名": "完整的视觉描述字符串"}

注意:
- 场景数量控制在10-30个之间(根据小说长度)
- 只提取主要角色(出场较多或重要的角色)
- action_description要具体且富有画面感
- characters的每个值必须是单个字符串,包含完整的视觉描述(适合直接用于图像生成提示词)
- characters示例: {"小红帽": "8岁女孩，金色长发，蓝色大眼睛，红色天鹅绒帽子，白色围裙，棕色连衣裙，提着篮子，天真无邪"}

小说内容:
%s

请直接返回JSON,不要添加其他说明文字。确保characters字段的值是字符串而不是对象。`, novelText)
}

func extractJSON(content string) string {
	// 移除可能的markdown代码块标记
	if len(content) > 7 && content[:3] == "```" {
		start := 0
		// 跳过```json或```
		for i := 3; i < len(content); i++ {
			if content[i] == '\n' {
				start = i + 1
				break
			}
		}
		// 找到结束的```
		end := len(content)
		for i := len(content) - 1; i >= 0; i-- {
			if i >= 2 && content[i-2:i+1] == "```" {
				end = i - 2
				break
			}
		}
		if start < end {
			content = content[start:end]
		}
	}
	return content
}
