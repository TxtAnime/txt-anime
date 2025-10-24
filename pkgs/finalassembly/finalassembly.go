package finalassembly

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

// ScriptData 剧本数据
type ScriptData struct {
	Script     []Scene           `json:"script"`
	Characters map[string]string `json:"characters"`
}

// Scene 场景结构
type Scene struct {
	SceneID            int            `json:"scene_id"`
	Location           string         `json:"location"`
	TimeOfDay          string         `json:"time_of_day"`
	Characters         []string       `json:"characters"`
	ActionDescription  string         `json:"action_description"`
	Dialogue           []DialogueLine `json:"dialogue"`
	VisualDescription  string         `json:"visual_description"`
	EmotionalTone      string         `json:"emotional_tone"`
	CameraShot         string         `json:"camera_shot"`
	BackgroundElements []string       `json:"background_elements"`
}

// DialogueLine 对话行
type DialogueLine struct {
	Character string `json:"character"`
	Line      string `json:"line"`
	Emotion   string `json:"emotion,omitempty"`
}

// Config 配置
type Config struct {
	ImageDisplayTime float64
	FPS              int
}

// SubtitleEntry 字幕条目
type SubtitleEntry struct {
	Index     int
	StartTime time.Duration
	EndTime   time.Duration
	Text      string
}

// Process 处理整个视频合成流程
func Process(scriptData ScriptData, imageDir, audioDir, outputVideo string, cfg Config) error {
	fmt.Println("🎬 步骤五: 最终合成")
	fmt.Println("=====================================")
	fmt.Println()

	// 检查 ffmpeg
	if !commandExists("ffmpeg") || !commandExists("ffprobe") {
		return fmt.Errorf("未找到 ffmpeg 或 ffprobe，请确保已安装 ffmpeg 并添加到 PATH")
	}

	// 创建临时目录
	tempDir := "temp_video_segments"
	if err := os.MkdirAll(tempDir, 0o755); err != nil {
		return fmt.Errorf("创建临时目录失败: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 按场景ID排序
	sort.Slice(scriptData.Script, func(i, j int) bool {
		return scriptData.Script[i].SceneID < scriptData.Script[j].SceneID
	})

	// 为每个场景生成视频片段
	segmentFiles := make([]string, 0, len(scriptData.Script))

	for i, scene := range scriptData.Script {
		fmt.Printf("\n🎬 处理场景 %d/%d (Scene %d)\n", i+1, len(scriptData.Script), scene.SceneID)

		segmentFile := filepath.Join(tempDir, fmt.Sprintf("segment_%03d.mp4", scene.SceneID))

		if err := generateSceneVideo(scene, imageDir, audioDir, segmentFile, cfg); err != nil {
			return fmt.Errorf("生成场景 %d 视频失败: %v", scene.SceneID, err)
		}

		segmentFiles = append(segmentFiles, segmentFile)
	}

	// 合并所有场景视频
	fmt.Println("\n🎞️  合并所有场景视频...")
	if err := mergeVideoSegments(segmentFiles, outputVideo); err != nil {
		return fmt.Errorf("合并视频失败: %v", err)
	}

	// 检查输出文件
	if fileInfo, err := os.Stat(outputVideo); err == nil {
		fmt.Printf("\n✅ 视频生成完成: %s\n", outputVideo)
		fmt.Printf("📦 文件大小: %.2f MB\n", float64(fileInfo.Size())/(1024*1024))
	} else {
		return fmt.Errorf("生成的视频文件不存在: %v", err)
	}

	return nil
}

// generateSceneVideo 生成单个场景的视频片段
func generateSceneVideo(scene Scene, imageDir, audioDir, outputFile string, cfg Config) error {
	// 查找场景图片
	imagePath := filepath.Join(imageDir, fmt.Sprintf("scene_%03d.png", scene.SceneID))
	if !fileExists(imagePath) {
		return fmt.Errorf("场景图片不存在: %s", imagePath)
	}
	fmt.Printf("  🖼️  图片: %s\n", filepath.Base(imagePath))

	// 查找场景的音频文件
	audioFiles := findSceneAudioFiles(audioDir, scene.SceneID)
	fmt.Printf("  🎵 找到 %d 个音频文件\n", len(audioFiles))

	// 合并音频
	var mergedAudioPath string
	var audioDuration float64
	var hasAudio bool

	if len(audioFiles) > 0 {
		var err error
		mergedAudioPath = filepath.Join(filepath.Dir(outputFile), fmt.Sprintf("audio_%03d.mp3", scene.SceneID))
		audioDuration, err = mergeAudioFiles(audioFiles, mergedAudioPath)
		if err != nil {
			fmt.Printf("  ⚠️  音频合并失败: %v，使用基础时长\n", err)
			audioDuration = cfg.ImageDisplayTime
			hasAudio = false
		} else {
			hasAudio = true
			defer os.Remove(mergedAudioPath)
		}
	} else {
		fmt.Printf("  ⏱️  无音频，使用基础时长: %.2f 秒\n", cfg.ImageDisplayTime)
		audioDuration = cfg.ImageDisplayTime
		hasAudio = false
	}

	if hasAudio {
		fmt.Printf("  ⏱️  音频总时长: %.2f 秒\n", audioDuration)
	}

	// 生成字幕
	subtitlePath := filepath.Join(filepath.Dir(outputFile), fmt.Sprintf("subtitle_%03d.srt", scene.SceneID))
	if err := generateSubtitle(scene, subtitlePath, time.Duration(audioDuration*float64(time.Second))); err != nil {
		return fmt.Errorf("生成字幕失败: %v", err)
	}
	defer os.Remove(subtitlePath)

	// 生成视频
	if err := generateVideoWithFFmpeg(imagePath, mergedAudioPath, subtitlePath, outputFile, audioDuration, cfg.FPS, hasAudio); err != nil {
		return fmt.Errorf("FFmpeg生成视频失败: %v", err)
	}

	fmt.Printf("  ✅ 生成视频片段: %s\n", filepath.Base(outputFile))
	return nil
}

// findSceneAudioFiles 查找场景的所有音频文件
func findSceneAudioFiles(audioDir string, sceneID int) []string {
	pattern := fmt.Sprintf("scene_%03d_dialogue_*.mp3", sceneID)
	matches, err := filepath.Glob(filepath.Join(audioDir, pattern))
	if err != nil {
		return nil
	}

	// 排序确保顺序正确
	sort.Strings(matches)
	return matches
}

// mergeAudioFiles 合并多个音频文件
func mergeAudioFiles(audioFiles []string, outputPath string) (float64, error) {
	if len(audioFiles) == 0 {
		return 0, fmt.Errorf("没有音频文件")
	}

	// 如果只有一个文件，直接复制
	if len(audioFiles) == 1 {
		input, err := os.ReadFile(audioFiles[0])
		if err != nil {
			return 0, err
		}
		if err := os.WriteFile(outputPath, input, 0o644); err != nil {
			return 0, err
		}
		return getAudioDuration(audioFiles[0])
	}

	// 多个文件，使用 ffmpeg concat
	listFile := outputPath + ".list.txt"
	defer os.Remove(listFile)

	var sb strings.Builder
	for _, audioFile := range audioFiles {
		absPath, err := filepath.Abs(audioFile)
		if err != nil {
			return 0, err
		}
		// FFmpeg concat 需要转义单引号
		absPath = strings.ReplaceAll(absPath, "'", "'\\''")
		sb.WriteString(fmt.Sprintf("file '%s'\n", absPath))
	}

	if err := os.WriteFile(listFile, []byte(sb.String()), 0o644); err != nil {
		return 0, err
	}

	cmd := exec.Command("ffmpeg",
		"-f", "concat",
		"-safe", "0",
		"-i", listFile,
		"-c", "copy",
		"-y",
		outputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return 0, fmt.Errorf("ffmpeg concat 失败: %v, 输出: %s", err, string(output))
	}

	// 计算总时长
	var totalDuration float64
	for _, audioFile := range audioFiles {
		duration, err := getAudioDuration(audioFile)
		if err != nil {
			continue
		}
		totalDuration += duration
	}

	return totalDuration, nil
}

// getAudioDuration 获取音频时长
func getAudioDuration(audioPath string) (float64, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		audioPath,
	)

	output, err := cmd.Output()
	if err != nil {
		return 0, err
	}

	durationStr := strings.TrimSpace(string(output))
	duration, err := strconv.ParseFloat(durationStr, 64)
	if err != nil {
		return 0, err
	}

	return duration, nil
}

// generateSubtitle 生成字幕文件
func generateSubtitle(scene Scene, outputPath string, totalDuration time.Duration) error {
	var entries []SubtitleEntry
	currentTime := time.Duration(0)

	// 添加场景描述/旁白（如果有）
	if scene.ActionDescription != "" {
		// 根据文字长度估算时间（约10字/秒）
		duration := time.Duration(float64(len(scene.ActionDescription)) / 10.0 * float64(time.Second))
		if duration > totalDuration {
			duration = totalDuration
		}
		if duration < time.Second {
			duration = time.Second
		}

		entries = append(entries, SubtitleEntry{
			Index:     len(entries) + 1,
			StartTime: currentTime,
			EndTime:   currentTime + duration,
			Text:      scene.ActionDescription,
		})
		currentTime += duration
	}

	// 添加对话
	if len(scene.Dialogue) > 0 {
		// 剩余时间平均分配给对话
		remainingTime := totalDuration - currentTime
		if remainingTime < 0 {
			remainingTime = totalDuration
			currentTime = 0
		}

		timePerDialogue := remainingTime / time.Duration(len(scene.Dialogue))
		if timePerDialogue < time.Second {
			timePerDialogue = time.Second
		}

		for _, dialogue := range scene.Dialogue {
			endTime := currentTime + timePerDialogue
			if endTime > totalDuration {
				endTime = totalDuration
			}

			text := fmt.Sprintf("%s: %s", dialogue.Character, dialogue.Line)
			entries = append(entries, SubtitleEntry{
				Index:     len(entries) + 1,
				StartTime: currentTime,
				EndTime:   endTime,
				Text:      text,
			})

			currentTime = endTime
		}
	}

	// 如果没有字幕，至少添加一个空字幕
	if len(entries) == 0 {
		entries = append(entries, SubtitleEntry{
			Index:     1,
			StartTime: 0,
			EndTime:   totalDuration,
			Text:      " ",
		})
	}

	// 写入 SRT 文件
	var sb strings.Builder
	for _, entry := range entries {
		sb.WriteString(fmt.Sprintf("%d\n", entry.Index))
		sb.WriteString(fmt.Sprintf("%s --> %s\n", formatSRTTime(entry.StartTime), formatSRTTime(entry.EndTime)))
		sb.WriteString(entry.Text)
		sb.WriteString("\n\n")
	}

	return os.WriteFile(outputPath, []byte(sb.String()), 0o644)
}

// formatSRTTime 格式化时间为 SRT 格式
func formatSRTTime(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60
	millis := int(d.Milliseconds()) % 1000

	return fmt.Sprintf("%02d:%02d:%02d,%03d", hours, minutes, seconds, millis)
}

// generateVideoWithFFmpeg 使用 FFmpeg 生成视频
func generateVideoWithFFmpeg(imagePath, audioPath, subtitlePath, outputPath string, duration float64, fps int, hasAudio bool) error {
	args := []string{
		"-loop", "1",
		"-i", imagePath,
	}

	// 如果有音频则添加音频输入
	if hasAudio && audioPath != "" {
		args = append(args, "-i", audioPath)
	} else {
		// 无音频场景：生成静音音频轨道（必须在其他输入之后，在滤镜之前）
		args = append(args,
			"-f", "lavfi",
			"-i", "anullsrc=r=44100:cl=stereo",
		)
	}

	// 添加字幕滤镜
	subtitleFilter := fmt.Sprintf("subtitles=%s:force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3'",
		strings.ReplaceAll(subtitlePath, "\\", "/"))
	args = append(args, "-vf", subtitleFilter)

	// 设置时长
	args = append(args, "-t", fmt.Sprintf("%.2f", duration))

	// 视频参数
	args = append(args,
		"-r", fmt.Sprintf("%d", fps),
		"-pix_fmt", "yuv420p",
	)

	// 音频编码参数（对有音频和静音音频都适用）
	args = append(args,
		"-c:a", "aac",
		"-ar", "44100",
		"-ac", "2",
	)

	// 如果有真实音频，添加 shortest 选项
	if hasAudio && audioPath != "" {
		args = append(args, "-shortest")
	}

	args = append(args, "-y", outputPath)

	cmd := exec.Command("ffmpeg", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg 失败: %v, 输出: %s", err, string(output))
	}

	return nil
}

// mergeVideoSegments 合并视频片段
func mergeVideoSegments(segmentFiles []string, outputPath string) error {
	if len(segmentFiles) == 0 {
		return fmt.Errorf("没有视频片段")
	}

	if len(segmentFiles) == 1 {
		// 只有一个片段，直接复制
		input, err := os.ReadFile(segmentFiles[0])
		if err != nil {
			return err
		}
		return os.WriteFile(outputPath, input, 0o644)
	}

	// 创建文件列表
	listFile := outputPath + ".list.txt"
	defer os.Remove(listFile)

	var sb strings.Builder
	for _, segmentFile := range segmentFiles {
		absPath, err := filepath.Abs(segmentFile)
		if err != nil {
			return err
		}
		// FFmpeg concat 需要转义单引号
		absPath = strings.ReplaceAll(absPath, "'", "'\\''")
		sb.WriteString(fmt.Sprintf("file '%s'\n", absPath))
	}

	if err := os.WriteFile(listFile, []byte(sb.String()), 0o644); err != nil {
		return err
	}

	cmd := exec.Command("ffmpeg",
		"-f", "concat",
		"-safe", "0",
		"-i", listFile,
		"-c", "copy",
		"-y",
		outputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg concat 失败: %v, 输出: %s", err, string(output))
	}

	return nil
}

// fileExists 检查文件是否存在
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// commandExists 检查命令是否存在
func commandExists(cmd string) bool {
	_, err := exec.LookPath(cmd)
	return err == nil
}
