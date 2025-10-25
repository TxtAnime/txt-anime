package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/TxtAnime/txt-anime/pkgs/novel2script"
)

const (
	baseURL = "https://openai.qiniu.com/v1"
	apiKey  = "sk-e44bb568586c50374d8b3f313fca6caab52f334eefa632039cae206d9d11a6fc"
	model   = "deepseek/deepseek-v3.1-terminus"
)

func main() {
	inputFile := flag.String("input", "", "输入小说文件路径")
	outputFile := flag.String("output", "output.json", "输出JSON文件路径")
	flag.Parse()

	if *inputFile == "" {
		log.Fatal("请使用 -input 参数指定输入文件")
	}

	content, err := os.ReadFile(*inputFile)
	if err != nil {
		log.Fatalf("读取文件失败: %v", err)
	}

	fmt.Println("正在处理小说文本...")

	cfg := novel2script.Config{
		BaseURL: baseURL,
		APIKey:  apiKey,
		Model:   model,
	}

	fmt.Println("正在调用LLM API...")
	response, err := novel2script.Process(string(content), cfg)
	if err != nil {
		log.Fatalf("处理失败: %v", err)
	}

	output, err := json.MarshalIndent(response, "", "  ")
	if err != nil {
		log.Fatalf("序列化JSON失败: %v", err)
	}

	err = os.WriteFile(*outputFile, output, 0o644)
	if err != nil {
		log.Fatalf("写入文件失败: %v", err)
	}

	fmt.Printf("处理完成！结果已保存到: %s\n", *outputFile)
	fmt.Printf("生成了 %d 个场景和 %d 个角色\n", len(response.Script), len(response.Characters))
}
