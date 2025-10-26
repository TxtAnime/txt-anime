package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	// 解析命令行参数
	configPath := flag.String("config", "config.json", "配置文件路径")
	flag.Parse()

	// 加载配置
	log.Println("加载配置文件:", *configPath)
	config, err := LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化 MongoDB
	log.Println("连接 MongoDB:", config.MongoDB.URI)
	db, err := NewDB(config.MongoDB)
	if err != nil {
		log.Fatalf("连接 MongoDB 失败: %v", err)
	}
	defer db.Close()
	log.Println("✅ MongoDB 连接成功")

	// 创建输出目录
	if err := os.MkdirAll(config.Storage.OutputDir, 0o755); err != nil {
		log.Fatalf("创建输出目录失败: %v", err)
	}

	// 构建服务器 base URL
	// 使用空字符串表示相对路径，让前端和 nginx 处理完整 URL
	baseURL := ""
	log.Printf("服务器 Base URL: %s (使用相对路径)", baseURL)

	// 启动任务处理器
	log.Println("启动后台任务处理器")
	processor := NewTaskProcessor(db, baseURL, config)
	processor.Start()
	log.Println("✅ 后台任务处理器已启动")

	// 创建 HTTP 处理器
	handler := NewHandler(db)

	// CORS 中间件
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// 设置 CORS 头
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// 处理预检请求
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			// 调用下一个处理器
			next(w, r)
		}
	}

	// 注册路由
	http.HandleFunc("/v1/tasks/", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		// 路由分发
		if r.URL.Path == "/v1/tasks/" {
			// GET /v1/tasks/ - 获取任务列表
			// POST /v1/tasks/ - 创建任务
			if r.Method == http.MethodGet {
				handler.GetTasks(w, r)
			} else if r.Method == http.MethodPost {
				handler.CreateTask(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		} else if len(r.URL.Path) > len("/v1/tasks/") {
			// GET /v1/tasks/:id - 获取任务
			// GET /v1/tasks/:id/artifacts - 获取任务产物
			if r.URL.Path[len(r.URL.Path)-10:] == "/artifacts" {
				handler.GetArtifacts(w, r)
			} else {
				handler.GetTask(w, r)
			}
		} else {
			http.Error(w, "Not found", http.StatusNotFound)
		}
	}))

	// 静态文件服务 - 提供生成的产物下载
	http.Handle("/artifacts/", http.StripPrefix("/artifacts/", http.FileServer(http.Dir(config.Storage.OutputDir))))

	// 健康检查端点
	http.HandleFunc("/health", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}))

	// 启动 HTTP 服务器
	addr := fmt.Sprintf(":%d", config.Server.Port)
	log.Printf("🚀 服务器启动在 http://localhost%s", addr)
	log.Println("API 端点:")
	log.Println("  POST   /v1/tasks/              - 创建任务")
	log.Println("  GET    /v1/tasks/              - 获取任务列表")
	log.Println("  GET    /v1/tasks/:id           - 获取任务")
	log.Println("  GET    /v1/tasks/:id/artifacts - 获取任务产物")
	log.Println("  GET    /artifacts/*            - 下载产物文件")
	log.Println("  GET    /health                 - 健康检查")

	// 设置信号处理
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("\n接收到终止信号，正在关闭服务...")
		db.Close()
		os.Exit(0)
	}()

	// 启动服务
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
