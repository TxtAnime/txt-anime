package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/TxtAnime/txt-anime/pkgs/finalassembly"
)

func main() {
	// 命令行参数
	inputScript := flag.String("input", "", "输入的剧本JSON文件路径")
	imageDir := flag.String("images", "", "场景图片目录")
	audioDir := flag.String("audio", "", "音频文件目录")
	outputVideo := flag.String("output", "final_anime.mp4", "输出的视频文件路径")
	imageDisplayTime := flag.Float64("image-time", 3.0, "每个场景图片的基础显示时间（秒），实际时长会根据音频自动调整")
	fps := flag.Int("fps", 24, "视频帧率")

	flag.Parse()

	if *inputScript == "" || *imageDir == "" || *audioDir == "" {
		fmt.Println("用法: finalassembly -input <script.json> -images <image_dir> -audio <audio_dir> [-output <output.mp4>]")
		flag.PrintDefaults()
		os.Exit(1)
	}

	// 读取剧本
	fmt.Println("📖 读取剧本文件:", *inputScript)
	data, err := os.ReadFile(*inputScript)
	if err != nil {
		log.Fatalf("❌ 读取文件失败: %v", err)
	}

	var scriptData finalassembly.ScriptData
	if err := json.Unmarshal(data, &scriptData); err != nil {
		log.Fatalf("❌ 解析JSON失败: %v", err)
	}

	fmt.Printf("✅ 加载了 %d 个场景\n", len(scriptData.Script))

	// 配置
	cfg := finalassembly.Config{
		ImageDisplayTime: *imageDisplayTime,
		FPS:              *fps,
	}

	// 处理
	if err := finalassembly.Process(scriptData, *imageDir, *audioDir, *outputVideo, cfg); err != nil {
		log.Fatalf("❌ 处理失败: %v", err)
	}
}
