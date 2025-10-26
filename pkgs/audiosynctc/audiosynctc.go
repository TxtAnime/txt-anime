package audiosynctc

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	openai "github.com/sashabaranov/go-openai"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	tts "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/tts/v20190823"
)

// 数据结构
type ScriptData struct {
	Script     []Scene           `json:"script"`
	Characters map[string]string `json:"characters"`
}

type Scene struct {
	SceneID          int            `json:"scene_id"`
	Location         string         `json:"location"`
	TimeOfDay        string         `json:"time_of_day"`
	Characters       []string       `json:"characters"`
	SceneDescription string         `json:"scene_description"`
	Dialogue         []DialogueLine `json:"dialogue"`
	NarrationVO      string         `json:"narration_vo"`
}

type DialogueLine struct {
	Character string `json:"character"`
	Line      string `json:"line"`
	Emotion   string `json:"emotion,omitempty"`
}

// 音色信息
type VoiceInfo struct {
	VoiceType string   `json:"voice_type"`
	VoiceName string   `json:"voice_name"`
	Gender    string   `json:"gender,omitempty"`
	Emotions  []string `json:"emotions,omitempty"` // 支持的情感列表
}

// AI匹配响应
type VoiceMatchResponse struct {
	VoiceMatches map[string]int64 `json:"voice_matches"` // 角色名 -> VoiceType (腾讯云使用int64)
	Reasoning    string           `json:"reasoning,omitempty"`
}

// Config 配置
type Config struct {
	SecretID  string
	SecretKey string
	Region    string
	LLMConfig LLMConfig
}

type LLMConfig struct {
	BaseURL string
	APIKey  string
	Model   string
}

// Process 处理整个音频生成流程
func Process(scriptData ScriptData, outputDir string, cfg Config) error {
	fmt.Println("🎤 步骤四: 音频合成 (腾讯云TTS)")
	fmt.Println("=====================================")
	fmt.Println()

	fmt.Printf("✅ 已加载 %d 个场景，%d 个角色\n\n", len(scriptData.Script), len(scriptData.Characters))

	// 创建输出目录
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return fmt.Errorf("创建输出目录失败: %v", err)
	}

	// 获取支持多情感的音色列表
	voices := getMultiEmotionVoices()
	fmt.Printf("✅ 共有 %d 种多情感音色可用\n\n", len(voices))

	// 为角色（包括旁白）匹配音色
	fmt.Println("🤖 为角色和旁白匹配音色...")
	voiceMatches, err := matchVoicesForCharacters(scriptData, voices, cfg.LLMConfig)
	if err != nil {
		fmt.Printf("⚠️  AI匹配失败: %v，使用规则匹配\n", err)
		voiceMatches = simpleVoiceMatch(scriptData.Characters)
	}

	fmt.Println("✅ 音色匹配完成:")
	for char, voiceType := range voiceMatches {
		voiceName := "未知音色"
		for _, v := range voices {
			voiceID := parseVoiceType(v.VoiceType)
			if voiceID == voiceType {
				voiceName = v.VoiceName
				break
			}
		}
		fmt.Printf("  - %s: %s (VoiceType=%d)\n", char, voiceName, voiceType)
	}
	fmt.Println()

	// 保存音色匹配信息
	matchesJSON, _ := json.MarshalIndent(voiceMatches, "", "  ")
	matchesFile := filepath.Join(outputDir, "voice_matches.json")
	if err := os.WriteFile(matchesFile, matchesJSON, 0o644); err != nil {
		fmt.Printf("⚠️  保存音色匹配信息失败: %v\n", err)
	}

	// 统计总对话数和旁白数
	totalDialogues := 0
	totalNarrations := 0
	for _, scene := range scriptData.Script {
		totalDialogues += len(scene.Dialogue)
		if scene.NarrationVO != "" {
			totalNarrations++
		}
	}

	if totalDialogues == 0 && totalNarrations == 0 {
		fmt.Println("⚠️  没有找到对话和旁白，无需生成音频")
		return nil
	}

	fmt.Printf("📊 需要生成 %d 个对话音频和 %d 个旁白音频\n\n", totalDialogues, totalNarrations)

	// 创建腾讯云TTS客户端
	credential := common.NewCredential(cfg.SecretID, cfg.SecretKey)
	cpf := profile.NewClientProfile()
	client, err := tts.NewClient(credential, cfg.Region, cpf)
	if err != nil {
		return fmt.Errorf("创建腾讯云TTS客户端失败: %v", err)
	}

	// 生成语音文件
	fmt.Printf("🎙️  生成语音文件...\n")
	currentIdx := 0
	totalItems := totalDialogues + totalNarrations

	for _, scene := range scriptData.Script {
		// 1. 先生成旁白音频（如果有）
		if scene.NarrationVO != "" {
			currentIdx++

			// 获取旁白音色
			voiceType, ok := voiceMatches["旁白"]
			if !ok {
				// 如果没有匹配到旁白音色，使用默认音色
				voiceType = 601001 // 爱小洛，阅读女声
			}

			// 显示进度
			narrationPreview := scene.NarrationVO
			if len(narrationPreview) > 40 {
				narrationPreview = narrationPreview[:40] + "..."
			}
			fmt.Printf("[%d/%d] 场景%d - 旁白: %s\n",
				currentIdx, totalItems, scene.SceneID, narrationPreview)

			// 生成音频
			audioData, err := generateAudio(client, scene.NarrationVO, voiceType, "")
			if err != nil {
				fmt.Printf("  ❌ 生成失败: %v\n", err)
			} else {
				// 保存文件
				filename := fmt.Sprintf("scene_%03d_narration.mp3", scene.SceneID)
				filepath := filepath.Join(outputDir, filename)
				if err := os.WriteFile(filepath, audioData, 0o644); err != nil {
					fmt.Printf("  ❌ 保存失败: %v\n", err)
				} else {
					fmt.Printf("  ✅ 已保存: %s (%.1f KB)\n", filename, float64(len(audioData))/1024)
				}
			}
		}

		// 2. 再生成对话音频
		for dialogueIdx, dialogue := range scene.Dialogue {
			currentIdx++

			// 获取角色对应的音色
			voiceType, ok := voiceMatches[dialogue.Character]
			if !ok {
				voiceType = 601000 // 使用默认音色（爱小溪，聊天女声）
			}

			// 显示进度
			linePreview := dialogue.Line
			if len(linePreview) > 30 {
				linePreview = linePreview[:30] + "..."
			}
			emotionInfo := ""
			if dialogue.Emotion != "" {
				emotionInfo = fmt.Sprintf(" [%s]", dialogue.Emotion)
			}
			fmt.Printf("[%d/%d] 场景%d - %s%s: %s\n",
				currentIdx, totalItems, scene.SceneID, dialogue.Character, emotionInfo, linePreview)

			// 生成音频
			audioData, err := generateAudio(client, dialogue.Line, voiceType, dialogue.Emotion)
			if err != nil {
				fmt.Printf("  ❌ 生成失败: %v\n", err)
				continue
			}

			// 保存文件
			filename := fmt.Sprintf("scene_%03d_dialogue_%03d.mp3", scene.SceneID, dialogueIdx+1)
			filepath := filepath.Join(outputDir, filename)
			if err := os.WriteFile(filepath, audioData, 0o644); err != nil {
				fmt.Printf("  ❌ 保存失败: %v\n", err)
				continue
			}

			fmt.Printf("  ✅ 已保存: %s (%.1f KB)\n", filename, float64(len(audioData))/1024)
		}
	}

	fmt.Println()
	fmt.Printf("🎉 完成！所有音频文件已保存到: %s\n", outputDir)
	fmt.Printf("   音色匹配信息: %s\n", matchesFile)

	return nil
}

// getMultiEmotionVoices 返回支持多情感的腾讯云音色列表
// 根据腾讯云文档：https://cloud.tencent.com/document/product/1073/92668
// 只选择"音色情感"列中支持多种情感的大模型音色
func getMultiEmotionVoices() []VoiceInfo {
	// 腾讯云大模型音色 - 支持多情感
	return []VoiceInfo{
		// 大模型音色 - 女声
		{
			VoiceType: "601000",
			VoiceName: "爱小溪，聊天女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601001",
			VoiceName: "爱小洛，阅读女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601003",
			VoiceName: "爱小荷，阅读女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "news", "story", "radio", "poetry", "call"},
		},
		{
			VoiceType: "601005",
			VoiceName: "爱小静，聊天女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601007",
			VoiceName: "爱小叶，聊天女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601009",
			VoiceName: "爱小芊，聊天女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601010",
			VoiceName: "爱小娇，聊天女声",
			Gender:    "female",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},

		// 大模型音色 - 男声
		{
			VoiceType: "601002",
			VoiceName: "爱小辰，聊天男声",
			Gender:    "male",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601004",
			VoiceName: "爱小树，资讯男声",
			Gender:    "male",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601006",
			VoiceName: "爱小耀，阅读男声",
			Gender:    "male",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},
		{
			VoiceType: "601008",
			VoiceName: "爱小豪，聊天男声",
			Gender:    "male",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},

		// 大模型音色 - 童声
		{
			VoiceType: "601015",
			VoiceName: "爱小童，男童声",
			Gender:    "child",
			Emotions:  []string{"neutral", "sad", "happy", "angry", "fear", "sajiao", "amaze", "disgusted", "peaceful"},
		},

		// 精品音色 - 女童声（仅中性）
		{
			VoiceType: "101016",
			VoiceName: "智甜，女童声",
			Gender:    "child",
			Emotions:  []string{"neutral"},
		},
	}
}

// matchVoicesForCharacters 使用AI为角色匹配音色
func matchVoicesForCharacters(scriptData ScriptData, voices []VoiceInfo, llmCfg LLMConfig) (map[string]int64, error) {
	config := openai.DefaultConfig(llmCfg.APIKey)
	config.BaseURL = llmCfg.BaseURL
	config.HTTPClient = &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	client := openai.NewClientWithConfig(config)

	prompt := buildVoiceMatchPrompt(scriptData, voices)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: llmCfg.Model,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "你是一个专业的配音导演，擅长根据角色特征选择最合适的声音。",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.3,
		},
	)
	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("LLM返回空响应")
	}

	content := resp.Choices[0].Message.Content

	// 尝试提取JSON
	content = extractJSON(content)

	var matchResp VoiceMatchResponse
	if err := json.Unmarshal([]byte(content), &matchResp); err != nil {
		return nil, fmt.Errorf("解析AI响应失败: %v", err)
	}

	return matchResp.VoiceMatches, nil
}

// buildVoiceMatchPrompt 构建音色匹配提示词
func buildVoiceMatchPrompt(scriptData ScriptData, voices []VoiceInfo) string {
	var sb strings.Builder

	sb.WriteString("请根据角色描述、旁白内容和对话样本，为每个角色和旁白选择最合适的音色。\n\n")

	// 角色列表（包括旁白）
	sb.WriteString("## 角色列表\n\n")

	// 添加旁白角色
	sb.WriteString("**旁白**: 故事的叙述者，负责讲述场景和氛围\n\n")

	// 其他角色
	for char, desc := range scriptData.Characters {
		sb.WriteString(fmt.Sprintf("**%s**: %s\n\n", char, desc))
	}

	// 场景和对话样本（前3个场景）
	sb.WriteString("## 场景和对话样本\n\n")
	sampleCount := 0
	for _, scene := range scriptData.Script {
		if sampleCount >= 3 {
			break
		}
		sampleCount++
		sb.WriteString(fmt.Sprintf("场景%d (%s):\n", scene.SceneID, scene.Location))

		// 显示旁白（画外音）
		if scene.NarrationVO != "" {
			sb.WriteString(fmt.Sprintf("- [旁白]: \"%s\"\n", truncateText(scene.NarrationVO, 60)))
		}

		// 显示对话
		for _, dialogue := range scene.Dialogue {
			emotion := ""
			if dialogue.Emotion != "" {
				emotion = fmt.Sprintf(" [%s]", dialogue.Emotion)
			}
			sb.WriteString(fmt.Sprintf("- %s%s: \"%s\"\n", dialogue.Character, emotion, truncateText(dialogue.Line, 50)))
		}
		sb.WriteString("\n")
	}

	// 可用音色列表
	sb.WriteString("## 可用音色列表\n\n")
	sb.WriteString("| VoiceType | 性别 | 名称 | 支持的情感 |\n")
	sb.WriteString("|-----------|------|------|------------|\n")
	for _, v := range voices {
		emotionsStr := strings.Join(v.Emotions, ", ")
		sb.WriteString(fmt.Sprintf("| %s | %s | %s | %s |\n",
			v.VoiceType, v.Gender, v.VoiceName, emotionsStr))
	}

	sb.WriteString("\n## 选择标准\n\n")
	sb.WriteString("1. **旁白**：优先选择阅读类声音，如\"爱小洛，阅读女声\"(601001)或\"爱小荷，阅读女声\"(601003)\n")
	sb.WriteString("2. 根据角色的年龄、性别、性格选择音色\n")
	sb.WriteString("3. 儿童角色优先选择child类别的音色（爱小童601015、智甜101016）\n")
	sb.WriteString("4. 聊天类对话优先选择聊天女声/男声（如爱小溪601000、爱小辰601002）\n")
	sb.WriteString("5. 考虑角色的情感表达需求，大模型音色(601xxx)支持更丰富的情感\n")
	sb.WriteString("6. 确保每个角色使用不同的音色（如果可能）\n\n")

	sb.WriteString("## 输出格式\n\n")
	sb.WriteString("严格按照以下JSON格式输出，**必须包含\"旁白\"作为key**，VoiceType必须是整数：\n")
	sb.WriteString("```json\n")
	sb.WriteString("{\n")
	sb.WriteString("  \"voice_matches\": {\n")
	sb.WriteString("    \"旁白\": 601001,\n")
	sb.WriteString("    \"角色名1\": 601000,\n")
	sb.WriteString("    \"角色名2\": 601002\n")
	sb.WriteString("  },\n")
	sb.WriteString("  \"reasoning\": \"选择理由的简短说明\"\n")
	sb.WriteString("}\n")
	sb.WriteString("```\n")
	sb.WriteString("\n注意：voice_matches 中的值必须是整数类型的VoiceType，必须包含\"旁白\"作为第一个键值对。\n")

	return sb.String()
}

// simpleVoiceMatch 简单规则匹配
func simpleVoiceMatch(characters map[string]string) map[string]int64 {
	matches := make(map[string]int64)
	usedVoices := make(map[int64]bool)

	// 首先为旁白选择音色
	matches["旁白"] = 601001 // 爱小洛，阅读女声 - 适合旁白
	usedVoices[601001] = true

	for char, desc := range characters {
		descLower := strings.ToLower(desc)

		var voiceType int64

		// 儿童
		if strings.Contains(descLower, "小女孩") || strings.Contains(descLower, "女童") ||
			(strings.Contains(descLower, "女") && (strings.Contains(descLower, "岁") || strings.Contains(descLower, "儿童"))) {
			voiceType = 101016 // 智甜，女童声
		} else if strings.Contains(descLower, "少年") || strings.Contains(descLower, "男孩") || strings.Contains(descLower, "男童") {
			voiceType = 601015 // 爱小童，男童声
		} else if strings.Contains(descLower, "女") || strings.Contains(descLower, "female") {
			voiceType = 601000 // 爱小溪，聊天女声
		} else {
			voiceType = 601002 // 爱小辰，聊天男声
		}

		// 如果音色已被使用，选择备选
		if usedVoices[voiceType] {
			voiceType = findAlternativeVoice(voiceType, usedVoices)
		}

		matches[char] = voiceType
		usedVoices[voiceType] = true
	}

	return matches
}

// findAlternativeVoice 找到备选音色
func findAlternativeVoice(originalVoice int64, usedVoices map[int64]bool) int64 {
	// 根据原音色的类型选择备选
	alternatives := map[int64][]int64{
		101016: {601000, 601005, 601007}, // 女童 -> 其他女声
		601015: {601002, 601008, 601004}, // 男童 -> 其他男声
		601000: {601005, 601007, 601009}, // 聊天女声 -> 其他女声
		601002: {601008, 601004, 601006}, // 聊天男声 -> 其他男声
		601001: {601003, 601000, 601005}, // 阅读女声 -> 其他女声
		601006: {601002, 601004, 601008}, // 阅读男声 -> 其他男声
	}

	if alts, ok := alternatives[originalVoice]; ok {
		for _, alt := range alts {
			if !usedVoices[alt] {
				return alt
			}
		}
	}

	// 如果没有找到，返回原音色
	return originalVoice
}

// generateAudio 生成音频
func generateAudio(client *tts.Client, text string, voiceType int64, emotion string) ([]byte, error) {
	request := tts.NewTextToVoiceRequest()

	// 生成UUID作为SessionId
	sessionID := uuid.New().String()

	request.Text = common.StringPtr(text)
	request.SessionId = common.StringPtr(sessionID)
	request.VoiceType = common.Int64Ptr(voiceType)
	request.Codec = common.StringPtr("mp3")
	request.SampleRate = common.Uint64Ptr(16000)

	// 如果指定了情感，则设置EmotionCategory
	if emotion != "" {
		request.EmotionCategory = common.StringPtr(emotion)
	}

	// 调用腾讯云API
	response, err := client.TextToVoice(request)
	if err != nil {
		return nil, fmt.Errorf("调用腾讯云TTS API失败: %v", err)
	}

	// 腾讯云返回的音频数据是Base64编码的
	if response.Response.Audio == nil {
		return nil, fmt.Errorf("API返回的音频数据为空")
	}

	audioData, err := base64.StdEncoding.DecodeString(*response.Response.Audio)
	if err != nil {
		return nil, fmt.Errorf("解码音频数据失败: %v", err)
	}

	return audioData, nil
}

// parseVoiceType 将字符串VoiceType转换为int64
func parseVoiceType(voiceType string) int64 {
	var result int64
	fmt.Sscanf(voiceType, "%d", &result)
	return result
}

// extractJSON 提取JSON内容
func extractJSON(content string) string {
	content = strings.TrimSpace(content)

	// 移除markdown代码块标记
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")

	content = strings.TrimSpace(content)

	// 尝试提取JSON对象
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start != -1 && end != -1 && end > start {
		content = content[start : end+1]
	}

	return content
}

// truncateText 截断文本
func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}
