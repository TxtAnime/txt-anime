package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/TxtAnime/txt-anime/pkgs/audiosync"
)

const (
	baseURL    = "https://openai.qiniu.com/v1"
	apiKey     = "sk-e44bb568586c50374d8b3f313fca6caab52f334eefa632039cae206d9d11a6fc"
	llmModel   = "deepseek-v3"
	voiceModel = "qiniu_zh_female_tmjxxy"
)

func main() {
	inputFile := flag.String("input", "", "输入的剧本JSON文件路径")
	outputDir := flag.String("output", "audio", "输出音频文件目录")
	flag.Parse()

	if *inputFile == "" {
		log.Fatal("请使用 -input 参数指定输入JSON文件")
	}

	// 读取剧本JSON
	fmt.Println("📖 读取剧本文件:", *inputFile)
	data, err := os.ReadFile(*inputFile)
	if err != nil {
		log.Fatalf("❌ 读取文件失败: %v", err)
	}

	var scriptData audiosync.ScriptData
	if err := json.Unmarshal(data, &scriptData); err != nil {
		log.Fatalf("❌ 解析JSON失败: %v", err)
	}

	// 配置
	cfg := audiosync.Config{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		LLMModel:   llmModel,
		VoiceModel: voiceModel,
	}

	// 处理
	if err := audiosync.Process(scriptData, *outputDir, cfg); err != nil {
		log.Fatalf("❌ 处理失败: %v", err)
	}
}
