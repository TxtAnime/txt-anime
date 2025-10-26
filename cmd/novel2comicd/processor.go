package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/TxtAnime/txt-anime/pkgs/audiosync"
	"github.com/TxtAnime/txt-anime/pkgs/audiosynctc"
	"github.com/TxtAnime/txt-anime/pkgs/novel2script"
	"github.com/TxtAnime/txt-anime/pkgs/storyboard"
)

// TaskProcessor 任务处理器
type TaskProcessor struct {
	db      *DB
	baseURL string
	config  *Config
}

// NewTaskProcessor 创建任务处理器
func NewTaskProcessor(db *DB, baseURL string, config *Config) *TaskProcessor {
	return &TaskProcessor{
		db:      db,
		baseURL: baseURL,
		config:  config,
	}
}

// Start 启动后台任务处理
func (p *TaskProcessor) Start() {
	ticker := time.NewTicker(1 * time.Second)
	go func() {
		for range ticker.C {
			p.processTasks()
		}
	}()
}

// processTasks 处理所有 doing 状态的任务
func (p *TaskProcessor) processTasks() {
	tasks, err := p.db.GetDoingTasks()
	if err != nil {
		log.Printf("获取 doing 任务失败: %v", err)
		return
	}

	for _, task := range tasks {
		log.Printf("开始处理任务: %s (%s)", task.ID, task.Name)
		if err := p.processTask(&task); err != nil {
			log.Printf("处理任务 %s 失败: %v", task.ID, err)
			// 失败后继续处理下一个任务
		}
	}
}

// processTask 处理单个任务
func (p *TaskProcessor) processTask(task *Task) error {
	// 1. 清理并创建输出目录
	taskDir := filepath.Join(p.config.Storage.OutputDir, task.ID)
	if err := os.RemoveAll(taskDir); err != nil {
		return fmt.Errorf("清理输出目录失败: %w", err)
	}

	imagesDir := filepath.Join(taskDir, "images")
	audiosDir := filepath.Join(taskDir, "audios")

	if err := os.MkdirAll(imagesDir, 0o755); err != nil {
		return fmt.Errorf("创建图片目录失败: %w", err)
	}
	if err := os.MkdirAll(audiosDir, 0o755); err != nil {
		return fmt.Errorf("创建音频目录失败: %w", err)
	}

	// 2. novel2script: 生成剧本
	log.Printf("  [1/3] 生成剧本...")
	p.updateStatusDesc(task.ID, "剧本生成中...")
	scriptData, err := p.generateScript(task.Novel)
	if err != nil {
		return fmt.Errorf("生成剧本失败: %w", err)
	}
	log.Printf("  生成了 %d 个场景, %d 个角色", len(scriptData.Script), len(scriptData.Characters))

	// 保存剧本到文件用于调试
	scriptFile := filepath.Join(taskDir, "script.json")
	if err := saveScriptToFile(scriptData, scriptFile); err != nil {
		log.Printf("  ⚠️  保存剧本文件失败: %v", err)
	} else {
		log.Printf("  已保存剧本到: %s", scriptFile)
	}

	// 3. storyboard: 生成场景图片
	log.Printf("  [2/3] 生成场景图片...")
	p.updateStatusDesc(task.ID, "场景图片生成中...")
	if err := p.generateImages(scriptData, imagesDir); err != nil {
		return fmt.Errorf("生成图片失败: %w", err)
	}

	// 4. audiosync: 生成音频
	log.Printf("  [3/3] 生成音频...")
	p.updateStatusDesc(task.ID, "场景对话生成中...")
	if err := p.generateAudios(scriptData, audiosDir); err != nil {
		return fmt.Errorf("生成音频失败: %w", err)
	}

	// 5. 构建 scenes 数据（使用本地文件服务器 URL）
	log.Printf("  构建产物 URL...")
	scenes, err := p.buildScenes(task.ID, scriptData, imagesDir, audiosDir)
	if err != nil {
		return fmt.Errorf("构建产物失败: %w", err)
	}

	// 6. 更新任务状态
	task.Scenes = scenes
	task.Status = "done"
	task.StatusDesc = "完成"
	task.UpdatedAt = time.Now()

	if err := p.db.UpdateTask(task); err != nil {
		return fmt.Errorf("更新任务失败: %w", err)
	}

	log.Printf("✅ 任务 %s 处理完成", task.ID)
	return nil
}

// generateScript 生成剧本
func (p *TaskProcessor) generateScript(novelText string) (*novel2script.Response, error) {
	cfg := novel2script.Config{
		BaseURL: p.config.AI.BaseURL,
		APIKey:  p.config.AI.APIKey,
		Model:   p.config.AI.TextModel,
	}

	return novel2script.Process(novelText, cfg)
}

// generateImages 生成场景图片
func (p *TaskProcessor) generateImages(scriptData *novel2script.Response, imagesDir string) error {
	cfg := storyboard.Config{
		BaseURL:   p.config.AI.BaseURL,
		APIKey:    p.config.AI.APIKey,
		Model:     p.config.AI.ImageModel,
		ImageSize: "1024x1024",
	}

	for _, scene := range scriptData.Script {
		log.Printf("    生成场景 %d 图片...", scene.SceneID)

		// 转换为 storyboard.Scene 类型
		sbScene := convertToStoryboardScene(scene, scriptData.Characters)

		imageData, err := storyboard.GenerateImage(sbScene, scriptData.Characters, cfg)
		if err != nil {
			return fmt.Errorf("生成场景 %d 图片失败: %w", scene.SceneID, err)
		}

		// 保存图片
		filename := fmt.Sprintf("scene_%03d.png", scene.SceneID)
		filepath := filepath.Join(imagesDir, filename)
		if err := os.WriteFile(filepath, imageData, 0o644); err != nil {
			return fmt.Errorf("保存场景 %d 图片失败: %w", scene.SceneID, err)
		}

		log.Printf("    ✅ 场景 %d 图片已保存: %s", scene.SceneID, filename)
	}

	return nil
}

// generateAudios 生成音频
func (p *TaskProcessor) generateAudios(scriptData *novel2script.Response, audiosDir string) error {
	// 根据配置选择TTS提供商
	ttsProvider := p.config.TTSProvider
	if ttsProvider == "" {
		ttsProvider = "qiniu" // 默认使用七牛云
	}

	switch ttsProvider {
	case "tencent":
		// 使用腾讯云TTS
		return p.generateAudiosTencent(scriptData, audiosDir)
	case "qiniu":
		// 使用七牛云TTS
		return p.generateAudiosQiniu(scriptData, audiosDir)
	default:
		return fmt.Errorf("不支持的TTS提供商: %s", ttsProvider)
	}
}

// generateAudiosQiniu 使用七牛云生成音频
func (p *TaskProcessor) generateAudiosQiniu(scriptData *novel2script.Response, audiosDir string) error {
	// 转换数据结构为 audiosync 需要的格式
	asScriptData := audiosync.ScriptData{
		Script:     convertScenesForQiniu(scriptData.Script),
		Characters: scriptData.Characters,
	}

	cfg := audiosync.Config{
		BaseURL:  p.config.AI.BaseURL,
		APIKey:   p.config.AI.APIKey,
		LLMModel: p.config.AI.TextModel,
	}

	// 调用 audiosync 处理
	return audiosync.Process(asScriptData, audiosDir, cfg)
}

// generateAudiosTencent 使用腾讯云生成音频
func (p *TaskProcessor) generateAudiosTencent(scriptData *novel2script.Response, audiosDir string) error {
	// 转换数据结构为 audiosynctc 需要的格式
	tcScriptData := audiosynctc.ScriptData{
		Script:     convertScenesForTencent(scriptData.Script),
		Characters: scriptData.Characters,
	}

	cfg := audiosynctc.Config{
		SecretID:  p.config.TencentTTS.SecretID,
		SecretKey: p.config.TencentTTS.SecretKey,
		Region:    p.config.TencentTTS.Region,
		LLMConfig: audiosynctc.LLMConfig{
			BaseURL: p.config.AI.BaseURL,
			APIKey:  p.config.AI.APIKey,
			Model:   p.config.AI.TextModel,
		},
	}

	// 调用 audiosynctc 处理
	return audiosynctc.Process(tcScriptData, audiosDir, cfg)
}

// buildScenes 构建 scenes 数据（使用本地文件服务器 URL）
func (p *TaskProcessor) buildScenes(taskID string, scriptData *novel2script.Response, imagesDir, audiosDir string) ([]Scene, error) {
	var scenes []Scene

	for _, scene := range scriptData.Script {
		// 构建场景图片 URL
		imageURL := fmt.Sprintf("%s/artifacts/%s/images/scene_%03d.png", p.baseURL, taskID, scene.SceneID)

		// 构建旁白音频 URL
		narrationVoiceURL := ""
		narrationPath := filepath.Join(audiosDir, fmt.Sprintf("scene_%03d_narration.mp3", scene.SceneID))
		if _, err := os.Stat(narrationPath); err == nil {
			narrationVoiceURL = fmt.Sprintf("%s/artifacts/%s/audios/scene_%03d_narration.mp3", p.baseURL, taskID, scene.SceneID)
		}

		// 处理对话音频
		var dialogues []Dialogue
		for idx, dialogue := range scene.Dialogue {
			voiceURL := ""
			// 检查音频文件是否存在（可能没有对话的场景）
			audioPath := filepath.Join(audiosDir, fmt.Sprintf("scene_%03d_dialogue_%03d.mp3", scene.SceneID, idx+1))
			if _, err := os.Stat(audioPath); err == nil {
				voiceURL = fmt.Sprintf("%s/artifacts/%s/audios/scene_%03d_dialogue_%03d.mp3", p.baseURL, taskID, scene.SceneID, idx+1)
			}

			dialogues = append(dialogues, Dialogue{
				Character: dialogue.Character,
				Line:      dialogue.Line,
				VoiceURL:  voiceURL,
			})
		}

		scenes = append(scenes, Scene{
			ImageURL:          imageURL,
			Narration:         scene.NarrationVO,
			NarrationVoiceURL: narrationVoiceURL,
			Dialogues:         dialogues,
		})
	}

	return scenes, nil
}

// convertToStoryboardScene 转换场景格式为 storyboard 需要的格式
func convertToStoryboardScene(scene novel2script.Scene, characters map[string]string) storyboard.Scene {
	var dialogues []storyboard.DialogueLine
	for _, d := range scene.Dialogue {
		dialogues = append(dialogues, storyboard.DialogueLine{
			Character: d.Character,
			Line:      d.Line,
		})
	}

	return storyboard.Scene{
		SceneID:           scene.SceneID,
		Location:          scene.Location,
		TimeOfDay:         scene.TimeOfDay,
		CharactersPresent: scene.CharactersPresent,
		SceneDescription:  scene.SceneDescription,
		Dialogue:          dialogues,
		NarrationVO:       scene.NarrationVO,
	}
}

// convertScenesForQiniu 转换场景格式为 audiosync 需要的格式（七牛云）
func convertScenesForQiniu(scenes []novel2script.Scene) []audiosync.Scene {
	result := make([]audiosync.Scene, len(scenes))
	for i, s := range scenes {
		var dialogues []audiosync.DialogueLine
		for _, d := range s.Dialogue {
			dialogues = append(dialogues, audiosync.DialogueLine{
				Character: d.Character,
				Line:      d.Line,
				Emotion:   d.Emotion, // 保留emotion字段（七牛云会忽略）
			})
		}

		result[i] = audiosync.Scene{
			SceneID:          s.SceneID,
			Location:         s.Location,
			TimeOfDay:        s.TimeOfDay,
			Characters:       s.CharactersPresent,
			SceneDescription: s.SceneDescription,
			Dialogue:         dialogues,
			NarrationVO:      s.NarrationVO,
		}
	}
	return result
}

// convertScenesForTencent 转换场景格式为 audiosynctc 需要的格式（腾讯云）
func convertScenesForTencent(scenes []novel2script.Scene) []audiosynctc.Scene {
	result := make([]audiosynctc.Scene, len(scenes))
	for i, s := range scenes {
		var dialogues []audiosynctc.DialogueLine
		for _, d := range s.Dialogue {
			dialogues = append(dialogues, audiosynctc.DialogueLine{
				Character: d.Character,
				Line:      d.Line,
				Emotion:   d.Emotion, // 保留emotion字段用于腾讯云TTS
			})
		}

		result[i] = audiosynctc.Scene{
			SceneID:          s.SceneID,
			Location:         s.Location,
			TimeOfDay:        s.TimeOfDay,
			Characters:       s.CharactersPresent,
			SceneDescription: s.SceneDescription,
			Dialogue:         dialogues,
			NarrationVO:      s.NarrationVO,
		}
	}
	return result
}

// saveScriptToFile 保存剧本到文件（用于调试）
func saveScriptToFile(scriptData *novel2script.Response, filepath string) error {
	data, err := json.MarshalIndent(scriptData, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath, data, 0o644)
}

// updateStatusDesc 更新任务的状态描述
func (p *TaskProcessor) updateStatusDesc(taskID, statusDesc string) {
	if err := p.db.UpdateTaskStatusDesc(taskID, statusDesc); err != nil {
		log.Printf("  ⚠️  更新状态描述失败: %v", err)
	}
}
