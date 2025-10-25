package storyboard

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

const (
	DefaultBaseURL = "https://openai.qiniu.com/v1"
	DefaultModel   = "gemini-2.5-flash-image"
)

// Scene 场景结构
type Scene struct {
	SceneID           int            `json:"scene_id"`
	Location          string         `json:"location"`
	TimeOfDay         string         `json:"time_of_day"`
	CharactersPresent []string       `json:"characters_present"`
	Characters        []string       `json:"characters"` // 兼容旧格式
	SceneDescription  string         `json:"scene_description"`
	Dialogue          []DialogueLine `json:"dialogue"`
	NarrationVO       string         `json:"narration_vo"`
}

// DialogueLine 对话行
type DialogueLine struct {
	Character string `json:"character"`
	Line      string `json:"line"`
}

// ScriptData 剧本数据
type ScriptData struct {
	Script     []Scene           `json:"script"`
	Characters map[string]string `json:"characters"`
}

// Config 配置
type Config struct {
	BaseURL   string
	APIKey    string
	Model     string
	ImageSize string
}

// GenerateImage 生成场景图片
func GenerateImage(scene Scene, characters map[string]string, cfg Config) ([]byte, error) {
	config := openai.DefaultConfig(cfg.APIKey)
	config.BaseURL = cfg.BaseURL
	config.HTTPClient = &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	prompt := BuildPrompt(scene, characters)

	b64Data, err := generateImageInternal(config, prompt, cfg.ImageSize, cfg.Model)
	if err != nil {
		return nil, err
	}

	imageData, err := base64.StdEncoding.DecodeString(b64Data)
	if err != nil {
		return nil, fmt.Errorf("解码base64失败: %w", err)
	}

	return imageData, nil
}

// BuildPrompt 构建提示词 - 纯场景图片，无文字对话
func BuildPrompt(scene Scene, characters map[string]string) string {
	var sb strings.Builder

	// 基础动漫风格 - 纯场景图片，无文字
	sb.WriteString("Anime visual novel style, detailed anime art, cinematic composition, ")
	sb.WriteString("single full scene illustration, NO text, NO dialogue bubbles, NO subtitles, ")
	sb.WriteString("high quality scene artwork, professional anime background. ")

	// 场景设定
	sb.WriteString(fmt.Sprintf("Scene: %s", scene.Location))

	// 时间设定
	if scene.TimeOfDay != "" {
		sb.WriteString(fmt.Sprintf(" at %s", scene.TimeOfDay))
	}
	sb.WriteString(". ")

	// 获取角色列表（兼容两种格式）
	var charList []string
	if len(scene.CharactersPresent) > 0 {
		charList = scene.CharactersPresent
	} else if len(scene.Characters) > 0 {
		charList = scene.Characters
	}

	// 角色描述（注入"黄金描述"）
	if len(charList) > 0 {
		sb.WriteString("Characters: ")
		for i, charName := range charList {
			if desc, ok := characters[charName]; ok {
				sb.WriteString(desc)
			} else {
				sb.WriteString(charName)
			}
			if i < len(charList)-1 {
				sb.WriteString(", and ")
			}
		}
		sb.WriteString(". ")
	}

	// 场景视觉描述（核心内容）
	if scene.SceneDescription != "" {
		sb.WriteString(fmt.Sprintf("Scene: %s. ", scene.SceneDescription))
	}

	// 风格强化 - 强调纯视觉场景，无文字
	sb.WriteString("High quality anime art, professional illustration, detailed backgrounds, ")
	sb.WriteString("expressive characters, dramatic lighting, cinematic atmosphere. ")
	sb.WriteString("NO text, NO dialogue bubbles, NO subtitles. ")
	sb.WriteString("Clean visual storytelling, anime movie quality.")

	return sb.String()
}

func generateImageInternal(config openai.ClientConfig, prompt string, size string, model string) (string, error) {
	client := openai.NewClientWithConfig(config)

	req := openai.ImageRequest{
		Model:          model,
		Prompt:         prompt,
		Size:           size,
		N:              1,
		ResponseFormat: openai.CreateImageResponseFormatB64JSON,
	}

	resp, err := client.CreateImage(context.Background(), req)
	if err != nil {
		return "", fmt.Errorf("API调用失败: %w", err)
	}

	if len(resp.Data) == 0 {
		return "", fmt.Errorf("API返回空数据")
	}

	return resp.Data[0].B64JSON, nil
}
