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
	TimeOfDay         string         `json:"time_of_day"`
	CharactersPresent []string       `json:"characters_present"`
	SceneDescription  string         `json:"scene_description"`
	Dialogue          []DialogueLine `json:"dialogue"`
	NarrationVO       string         `json:"narration_vo"`
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
	return fmt.Sprintf(`请将以下小说改编成结构化的视觉剧本格式,并设计主要角色的视觉描述。

要求:
1. 将小说按照故事情节的起承转合,改编成一系列关键场景(scene),每个场景包含:
   - scene_id: 场景序号(从1开始)
   - location: 场景地点的简短描述
   - time_of_day: 场景发生的时间 (例如: "白天", "夜晚", "黄昏", "清晨")
   - characters_present: 此场景出现的角色名称列表
   - scene_description: 对场景的**视觉描述**。这包括环境、氛围、以及角色的**关键动作和表情**。这是**改编的核心**,需要将小说的描述性文字(包括心理活动)转换成**可被看见**的画面。此字段将用于后续图像生成,必须具体、生动且富有画面感。
   - dialogue: 对话数组,每个对话包含character(角色名)和line(台词)
   - narration_vo: (可选) 仅包含那些需要作为**画外音**被朗读出来的旁白或内心独白。如果此场景没有旁白,则为空字符串 ""。

2. 提取并设计所有主要角色的视觉描述:
   - 必须包含: 年龄、性别、发型、发色、眼睛、身材、典型服装、气质或显著特征。
   - **重要**: 如果小说中缺乏具体的视觉描述,请你作为"角色设计师",根据角色的性格、背景和行为**合理推断**并**创造**其视觉形象。
   - 将这些信息整合成一个**单一的、连贯的字符串**,作为视觉提示词(适合图像生成使用)。

请以JSON格式返回,包含两个字段:
- script: 场景数组
- characters: 角色名到视觉描述字符串的映射(对象),格式如: {"角色名": "完整的视觉描述字符串"}

注意:
- 根据故事情节改编成合适数量的关键场景,不要受限于固定数量。
- 只设计主要角色(出场较多或重要的角色)。
- characters的每个值必须是单个字符串,包含完整的视觉描述。
- 示例: {"小红帽": "8岁女孩，天真无邪，金色及肩卷发，蓝色大眼睛，穿着一件标志性的红色天鹅绒兜帽斗篷，内搭棕色连衣裙和白色围裙，提着一个柳条篮子。"}

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
