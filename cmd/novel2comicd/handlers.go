package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Handler HTTP 处理器
type Handler struct {
	db *DB
}

// NewHandler 创建处理器
func NewHandler(db *DB) *Handler {
	return &Handler{db: db}
}

// CreateTask 创建任务 POST /v1/tasks/
func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 解析请求体
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("读取请求体失败: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req CreateTaskRequest
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("解析 JSON 失败: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// 验证必填字段
	if req.Name == "" || req.Novel == "" {
		http.Error(w, "name and novel are required", http.StatusBadRequest)
		return
	}

	// 生成任务 ID
	taskID := uuid.New().String()

	// 创建任务
	task := &Task{
		ID:        taskID,
		Name:      req.Name,
		Novel:     req.Novel,
		Status:    "doing",
		Scenes:    make([]Scene, 0), // 确保初始化为空数组而不是nil
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.CreateTask(task); err != nil {
		log.Printf("创建任务失败: %v", err)
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	// 返回响应
	resp := CreateTaskResponse{ID: taskID}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)

	log.Printf("创建任务成功: %s (%s)", taskID, req.Name)
}

// GetTask 获取任务 GET /v1/tasks/:id
func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 提取任务 ID
	taskID := extractTaskID(r.URL.Path, "/v1/tasks/")
	if taskID == "" {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// 查询任务
	task, err := h.db.GetTask(taskID)
	if err != nil {
		log.Printf("查询任务失败: %v", err)
		http.Error(w, "Failed to get task", http.StatusInternalServerError)
		return
	}

	if task == nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	// 返回响应
	resp := GetTaskResponse{
		ID:     task.ID,
		Name:   task.Name,
		Status: task.Status,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GetArtifacts 获取任务产物 GET /v1/tasks/:id/artifacts
func (h *Handler) GetArtifacts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 提取任务 ID
	taskID := extractTaskID(r.URL.Path, "/v1/tasks/")
	if taskID == "" {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// 查询任务
	task, err := h.db.GetTask(taskID)
	if err != nil {
		log.Printf("查询任务失败: %v", err)
		http.Error(w, "Failed to get task", http.StatusInternalServerError)
		return
	}

	if task == nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	// 返回产物
	scenes := task.Scenes
	if scenes == nil {
		scenes = make([]Scene, 0) // 确保返回空数组而不是null
	}
	resp := GetArtifactsResponse{
		Scenes: scenes,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GetTasks 获取任务列表 GET /v1/tasks/
func (h *Handler) GetTasks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 查询所有任务
	tasks, err := h.db.GetTasks()
	if err != nil {
		log.Printf("查询任务列表失败: %v", err)
		http.Error(w, "Failed to get tasks", http.StatusInternalServerError)
		return
	}

	// 构建响应
	var taskList []GetTaskResponse
	for _, task := range tasks {
		taskList = append(taskList, GetTaskResponse{
			ID:     task.ID,
			Name:   task.Name,
			Status: task.Status,
		})
	}

	resp := GetTasksResponse{Tasks: taskList}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// extractTaskID 从 URL 路径提取任务 ID
// 例如: /v1/tasks/abc123 -> abc123
// 例如: /v1/tasks/abc123/artifacts -> abc123
func extractTaskID(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}

	// 移除前缀
	remaining := strings.TrimPrefix(path, prefix)

	// 提取第一个路径段作为 ID
	parts := strings.Split(remaining, "/")
	if len(parts) > 0 && parts[0] != "" {
		return parts[0]
	}

	return ""
}
