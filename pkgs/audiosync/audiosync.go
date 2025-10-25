package audiosync

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// 数据结构
type ScriptData struct {
	Script     []Scene           `json:"script"`
	Characters map[string]string `json:"characters"`
}

type Scene struct {
	SceneID            int            `json:"scene_id"`
	Location           string         `json:"location"`
	TimeOfDay          string         `json:"time_of_day"`
	Characters         []string       `json:"characters"`
	Narration          string         `json:"narration"`
	ActionDescription  string         `json:"action_description"`
	Dialogue           []DialogueLine `json:"dialogue"`
	VisualDescription  string         `json:"visual_description"`
	EmotionalTone      string         `json:"emotional_tone"`
	CameraShot         string         `json:"camera_shot"`
	BackgroundElements []string       `json:"background_elements"`
}

type DialogueLine struct {
	Character string `json:"character"`
	Line      string `json:"line"`
	Emotion   string `json:"emotion,omitempty"`
}

// 音色信息
type VoiceInfo struct {
	VoiceType string `json:"voice_type"`
	VoiceName string `json:"voice_name"`
	Gender    string `json:"gender,omitempty"`
	Category  string `json:"category,omitempty"`
}

// TTS API 请求和响应结构
type TTSRequest struct {
	Audio   Audio   `json:"audio"`
	Request Request `json:"request"`
}

type Audio struct {
	VoiceType  string  `json:"voice_type"`
	Encoding   string  `json:"encoding"`
	SpeedRatio float64 `json:"speed_ratio"`
}

type Request struct {
	Text string `json:"text"`
}

type RelayTTSResponse struct {
	Reqid     string   `json:"reqid"`
	Operation string   `json:"operation"`
	Sequence  int      `json:"sequence"`
	Data      string   `json:"data"`
	Addition  Addition `json:"addition"`
}

type Addition struct {
	Duration string `json:"duration"`
}

// AI匹配响应
type VoiceMatchResponse struct {
	VoiceMatches map[string]string `json:"voice_matches"`
	Reasoning    string            `json:"reasoning,omitempty"`
}

// Config 配置
type Config struct {
	BaseURL    string
	APIKey     string
	LLMModel   string
	VoiceModel string
}

// Process 处理整个音频生成流程
func Process(scriptData ScriptData, outputDir string, cfg Config) error {
	fmt.Println("🎤 步骤四: 音频合成")
	fmt.Println("=====================================")
	fmt.Println()

	fmt.Printf("✅ 已加载 %d 个场景，%d 个角色\n\n", len(scriptData.Script), len(scriptData.Characters))

	// 创建输出目录
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return fmt.Errorf("创建输出目录失败: %v", err)
	}

	// 获取音色列表
	fmt.Println("🎵 获取可用音色列表...")
	voices, err := getVoiceList(cfg)
	if err != nil {
		fmt.Printf("⚠️  获取音色列表失败: %v，使用内置列表\n", err)
		voices = getBuiltinVoiceList()
	}
	fmt.Printf("✅ 共有 %d 种音色可用\n\n", len(voices))

	// 为角色匹配音色
	fmt.Println("🤖 为角色匹配音色...")
	voiceMatches, err := matchVoicesForCharacters(scriptData, voices, cfg)
	if err != nil {
		fmt.Printf("⚠️  AI匹配失败: %v，使用规则匹配\n", err)
		voiceMatches = simpleVoiceMatch(scriptData.Characters)
	}

	fmt.Println("✅ 音色匹配完成:")
	for char, voiceType := range voiceMatches {
		voiceName := "未知音色"
		for _, v := range voices {
			if v.VoiceType == voiceType {
				voiceName = v.VoiceName
				break
			}
		}
		fmt.Printf("  - %s: %s (%s)\n", char, voiceName, voiceType)
	}
	
	// 旁白使用固定音色
	narrationVoice := "qiniu_zh_female_zxjxnjs" // 知性教学女教师
	narrationVoiceName := "知性教学女教师"
	fmt.Printf("  - 旁白: %s (%s)\n", narrationVoiceName, narrationVoice)
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
		if strings.TrimSpace(scene.Narration) != "" {
			totalNarrations++
		}
	}

	totalAudios := totalDialogues + totalNarrations
	if totalAudios == 0 {
		fmt.Println("⚠️  没有找到对话或旁白，无需生成音频")
		return nil
	}

	// 生成语音文件
	fmt.Printf("🎙️  生成语音文件 (对话: %d, 旁白: %d)...\n", totalDialogues, totalNarrations)
	currentIdx := 0
	
	for _, scene := range scriptData.Script {
		// 生成旁白音频
		if strings.TrimSpace(scene.Narration) != "" {
			currentIdx++
			
			// 显示进度
			narrationPreview := scene.Narration
			if len(narrationPreview) > 30 {
				narrationPreview = narrationPreview[:30] + "..."
			}
			fmt.Printf("[%d/%d] 场景%d - 旁白: %s\n",
				currentIdx, totalAudios, scene.SceneID, narrationPreview)

			// 生成旁白音频
			audioData, err := generateAudio(scene.Narration, narrationVoice, cfg)
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
		
		// 生成对话音频
		for dialogueIdx, dialogue := range scene.Dialogue {
			currentIdx++

			// 获取角色对应的音色
			voiceType, ok := voiceMatches[dialogue.Character]
			if !ok {
				voiceType = cfg.VoiceModel // 使用默认音色
			}

			// 显示进度
			linePreview := dialogue.Line
			if len(linePreview) > 30 {
				linePreview = linePreview[:30] + "..."
			}
			fmt.Printf("[%d/%d] 场景%d - %s: %s\n",
				currentIdx, totalAudios, scene.SceneID, dialogue.Character, linePreview)

			// 生成音频
			audioData, err := generateAudio(dialogue.Line, voiceType, cfg)
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

// getVoiceList 获取音色列表（尝试从API，失败则返回错误）
func getVoiceList(cfg Config) ([]VoiceInfo, error) {
	voices, err := getVoiceListFromAPI(cfg)
	if err != nil {
		return nil, err
	}
	return voices, nil
}

// getVoiceListFromAPI 从API获取音色列表
func getVoiceListFromAPI(cfg Config) ([]VoiceInfo, error) {
	url := cfg.BaseURL + "/voice/list"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API返回错误: %s - %s", resp.Status, string(body))
	}

	var apiVoices []struct {
		VoiceType string `json:"voice_type"`
		VoiceName string `json:"voice_name"`
		Category  string `json:"category"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiVoices); err != nil {
		return nil, err
	}

	voices := make([]VoiceInfo, len(apiVoices))
	for i, v := range apiVoices {
		voices[i] = VoiceInfo{
			VoiceType: v.VoiceType,
			VoiceName: v.VoiceName,
			Category:  v.Category,
		}
	}

	return voices, nil
}

// getBuiltinVoiceList 返回内置的23种音色列表
func getBuiltinVoiceList() []VoiceInfo {
	return []VoiceInfo{
		// 传统音色 - 女性
		{VoiceType: "qiniu_zh_female_wwxkjx", VoiceName: "温婉学科讲师", Gender: "female", Category: "传统音色"},
		{VoiceType: "qiniu_zh_female_tmjxxy", VoiceName: "甜美教学小源", Gender: "female", Category: "传统音色"},
		{VoiceType: "qiniu_zh_female_xyqxxj", VoiceName: "校园清新学姐", Gender: "female", Category: "传统音色"},
		{VoiceType: "qiniu_zh_female_ljfdxx", VoiceName: "邻家辅导学姐", Gender: "female", Category: "传统音色"},
		{VoiceType: "qiniu_zh_female_glktss", VoiceName: "干练课堂思思", Gender: "female", Category: "传统音色"},
		{VoiceType: "qiniu_zh_female_kljxdd", VoiceName: "开朗教学督导", Gender: "female", Category: "传统音色"},
		{VoiceType: "qiniu_zh_female_zxjxnjs", VoiceName: "知性教学女教师", Gender: "female", Category: "传统音色"},

		// 传统音色 - 男性
		{VoiceType: "qiniu_zh_male_ljfdxz", VoiceName: "邻家辅导学长", Gender: "male", Category: "传统音色"},
		{VoiceType: "qiniu_zh_male_szxyxd", VoiceName: "率真校园向导", Gender: "male", Category: "传统音色"},
		{VoiceType: "qiniu_zh_male_whxkxg", VoiceName: "温和学科小哥", Gender: "male", Category: "传统音色"},
		{VoiceType: "qiniu_zh_male_wncwxz", VoiceName: "温暖沉稳学长", Gender: "male", Category: "传统音色"},
		{VoiceType: "qiniu_zh_male_ybxknjs", VoiceName: "渊博学科男教师", Gender: "male", Category: "传统音色"},
		{VoiceType: "qiniu_zh_male_tyygjs", VoiceName: "通用阳光讲师", Gender: "male", Category: "传统音色"},
		{VoiceType: "qiniu_zh_male_hlsnkk", VoiceName: "火力少年凯凯", Gender: "male", Category: "传统音色"},

		// 特殊音色 - 儿童/青少年
		{VoiceType: "qiniu_zh_female_dmytwz", VoiceName: "动漫樱桃丸子", Gender: "child", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_female_segsby", VoiceName: "少儿故事配音", Gender: "child", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_female_yyqmpq", VoiceName: "英语启蒙佩奇", Gender: "child", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_male_hllzmz", VoiceName: "活力率真萌仔", Gender: "child", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_male_etgsxe", VoiceName: "儿童故事熊二", Gender: "child", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_male_tcsnsf", VoiceName: "天才少年示范", Gender: "child", Category: "特殊音色"},

		// 特殊音色 - 其他
		{VoiceType: "qiniu_zh_male_cxkjns", VoiceName: "磁性课件男声", Gender: "male", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_male_qslymb", VoiceName: "轻松懒音绵宝", Gender: "male", Category: "特殊音色"},
		{VoiceType: "qiniu_zh_female_cxjxgw", VoiceName: "慈祥教学顾问", Gender: "female", Category: "特殊音色"},
	}
}

// matchVoicesForCharacters 使用AI为角色匹配音色
func matchVoicesForCharacters(scriptData ScriptData, voices []VoiceInfo, cfg Config) (map[string]string, error) {
	config := openai.DefaultConfig(cfg.APIKey)
	config.BaseURL = cfg.BaseURL
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
			Model: cfg.LLMModel,
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

	sb.WriteString("请根据角色描述和对话样本，为每个角色选择最合适的音色。\n\n")

	// 角色列表
	sb.WriteString("## 角色列表\n\n")
	for char, desc := range scriptData.Characters {
		sb.WriteString(fmt.Sprintf("**%s**: %s\n\n", char, desc))
	}

	// 对话样本（前3个场景）
	sb.WriteString("## 对话样本\n\n")
	sampleCount := 0
	for _, scene := range scriptData.Script {
		if sampleCount >= 3 {
			break
		}
		if len(scene.Dialogue) > 0 {
			sampleCount++
			sb.WriteString(fmt.Sprintf("场景%d (%s, %s):\n", scene.SceneID, scene.Location, scene.EmotionalTone))
			for _, dialogue := range scene.Dialogue {
				emotion := ""
				if dialogue.Emotion != "" {
					emotion = fmt.Sprintf(" [%s]", dialogue.Emotion)
				}
				sb.WriteString(fmt.Sprintf("- %s%s: \"%s\"\n", dialogue.Character, emotion, truncateText(dialogue.Line, 50)))
			}
			sb.WriteString("\n")
		}
	}

	// 可用音色列表
	sb.WriteString("## 可用音色列表\n\n")
	sb.WriteString("| 音色ID | 性别 | 名称 | 类别 |\n")
	sb.WriteString("|--------|------|------|------|\n")
	for _, v := range voices {
		gender := v.Gender
		if gender == "" {
			if strings.Contains(v.VoiceType, "female") {
				gender = "female"
			} else if strings.Contains(v.VoiceType, "male") {
				gender = "male"
			} else {
				gender = "unknown"
			}
		}
		sb.WriteString(fmt.Sprintf("| %s | %s | %s | %s |\n",
			v.VoiceType, gender, v.VoiceName, v.Category))
	}

	sb.WriteString("\n## 选择标准\n\n")
	sb.WriteString("1. 根据角色的年龄、性别、性格选择音色\n")
	sb.WriteString("2. 儿童角色优先选择child类别的音色\n")
	sb.WriteString("3. 机器人/AI角色可以选择磁性男声\n")
	sb.WriteString("4. 确保每个角色使用不同的音色（如果可能）\n")
	sb.WriteString("5. 考虑角色在对话中的情感表达\n\n")

	sb.WriteString("## 输出格式\n\n")
	sb.WriteString("严格按照以下JSON格式输出：\n")
	sb.WriteString("```json\n")
	sb.WriteString("{\n")
	sb.WriteString("  \"voice_matches\": {\n")
	sb.WriteString("    \"角色名1\": \"音色ID1\",\n")
	sb.WriteString("    \"角色名2\": \"音色ID2\"\n")
	sb.WriteString("  },\n")
	sb.WriteString("  \"reasoning\": \"选择理由的简短说明\"\n")
	sb.WriteString("}\n")
	sb.WriteString("```\n")

	return sb.String()
}

// simpleVoiceMatch 简单规则匹配
func simpleVoiceMatch(characters map[string]string) map[string]string {
	matches := make(map[string]string)
	usedVoices := make(map[string]bool)

	for char, desc := range characters {
		descLower := strings.ToLower(desc)

		var voiceType string

		// 机器人
		if strings.Contains(descLower, "机器人") || strings.Contains(descLower, "robot") ||
			strings.Contains(descLower, "ai") || strings.Contains(descLower, "人工智能") {
			voiceType = "qiniu_zh_male_cxkjns" // 磁性课件男声
		} else if strings.Contains(descLower, "小女孩") || strings.Contains(descLower, "女童") ||
			(strings.Contains(descLower, "女") && (strings.Contains(descLower, "岁") || strings.Contains(descLower, "儿童"))) {
			voiceType = "qiniu_zh_female_dmytwz" // 动漫樱桃丸子
		} else if strings.Contains(descLower, "少年") || strings.Contains(descLower, "男孩") {
			voiceType = "qiniu_zh_male_hlsnkk" // 火力少年凯凯
		} else if strings.Contains(descLower, "女") || strings.Contains(descLower, "female") {
			voiceType = "qiniu_zh_female_wwxkjx" // 温婉学科讲师
		} else {
			voiceType = "qiniu_zh_male_ljfdxz" // 邻家辅导学长
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
func findAlternativeVoice(originalVoice string, usedVoices map[string]bool) string {
	// 根据原音色的类型选择备选
	alternatives := map[string][]string{
		"qiniu_zh_male_cxkjns":   {"qiniu_zh_male_qslymb", "qiniu_zh_male_tyygjs"},
		"qiniu_zh_female_dmytwz": {"qiniu_zh_female_segsby", "qiniu_zh_female_yyqmpq"},
		"qiniu_zh_male_hlsnkk":   {"qiniu_zh_male_hllzmz", "qiniu_zh_male_tcsnsf"},
		"qiniu_zh_female_wwxkjx": {"qiniu_zh_female_tmjxxy", "qiniu_zh_female_xyqxxj"},
		"qiniu_zh_male_ljfdxz":   {"qiniu_zh_male_szxyxd", "qiniu_zh_male_whxkxg"},
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
func generateAudio(text, voiceType string, cfg Config) ([]byte, error) {
	url := cfg.BaseURL + "/voice/tts"

	reqBody := TTSRequest{
		Audio: Audio{
			VoiceType:  voiceType,
			Encoding:   "mp3",
			SpeedRatio: 1.0,
		},
		Request: Request{
			Text: text,
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API返回错误: %s - %s", resp.Status, string(body))
	}

	var ttsResp RelayTTSResponse
	if err := json.Unmarshal(body, &ttsResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %v", err)
	}

	// 解码Base64音频数据
	audioData, err := base64.StdEncoding.DecodeString(ttsResp.Data)
	if err != nil {
		return nil, fmt.Errorf("解码音频数据失败: %v", err)
	}

	return audioData, nil
}

// extractJSON 提取JSON内容
func extractJSON(content string) string {
	content = strings.TrimSpace(content)

	// 移除markdown代码块标记
	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimPrefix(content, "```")
	}
	if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```")
	}
	if strings.HasSuffix(content, "```") {
		content = strings.TrimSuffix(content, "```")
	}

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
