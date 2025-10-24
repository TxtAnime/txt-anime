package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/TxtAnime/txt-anime/pkgs/storyboard"
)

const (
	baseURL = "https://openai.qiniu.com/v1"
	apiKey  = "sk-e44bb568586c50374d8b3f313fca6caab52f334eefa632039cae206d9d11a6fc"
	model   = "gemini-2.5-flash-image"
)

func main() {
	inputFile := flag.String("input", "", "输入JSON文件路径(步骤一生成的)")
	outputDir := flag.String("output", "storyboard", "输出图片目录")
	imageSize := flag.String("size", "1792x1024", "图片尺寸 (推荐: 1792x1024 横向, 1024x1792 竖向)")
	flag.Parse()

	if *inputFile == "" {
		log.Fatal("请使用 -input 参数指定输入JSON文件")
	}

	content, err := os.ReadFile(*inputFile)
	if err != nil {
		log.Fatalf("读取文件失败: %v", err)
	}

	var scriptData storyboard.ScriptData
	err = json.Unmarshal(content, &scriptData)
	if err != nil {
		log.Fatalf("解析JSON失败: %v", err)
	}

	// 创建输出目录
	err = os.MkdirAll(*outputDir, 0o755)
	if err != nil {
		log.Fatalf("创建输出目录失败: %v", err)
	}

	fmt.Println("开始生成分镜图片，共", len(scriptData.Script), "个场景...")
	fmt.Println()

	cfg := storyboard.Config{
		BaseURL:   baseURL,
		APIKey:    apiKey,
		Model:     model,
		ImageSize: *imageSize,
	}

	// 为每个场景生成图片
	for i, scene := range scriptData.Script {
		fmt.Printf("[%d/%d] 生成场景 %d: %s\n", i+1, len(scriptData.Script), scene.SceneID, scene.Location)
		fmt.Printf("  场景: %s\n", truncateForDisplay(scene.ActionDescription, 60))

		// 生成图片
		imageData, err := storyboard.GenerateImage(scene, scriptData.Characters, cfg)
		if err != nil {
			fmt.Printf("  ⚠️  生成失败: %v\n", err)
			continue
		}

		// 保存图片
		filename := fmt.Sprintf("scene_%03d.png", scene.SceneID)
		outputPath := filepath.Join(*outputDir, filename)

		err = os.WriteFile(outputPath, imageData, 0o644)
		if err != nil {
			fmt.Printf("  ⚠️  保存失败: %v\n", err)
			continue
		}

		fmt.Printf("  ✅ 已保存: %s\n", filename)
	}

	fmt.Printf("\n🎉 完成！所有图片已保存到: %s\n", *outputDir)
}

// 截断文本用于显示
func truncateForDisplay(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}
