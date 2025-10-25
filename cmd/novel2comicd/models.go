package main

import "time"

// Task 任务结构
type Task struct {
	ID        string    `bson:"_id" json:"id"`
	Name      string    `bson:"name" json:"name"`
	Novel     string    `bson:"novel" json:"novel"`
	Status    string    `bson:"status" json:"status"` // "doing" 或 "done"
	Scenes    []Scene   `bson:"scenes" json:"scenes"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

// Scene 场景结构
type Scene struct {
	ImageURL  string     `bson:"image_url" json:"imageURL"`
	Narration string     `bson:"narration" json:"narration"`
	Dialogues []Dialogue `bson:"dialogues" json:"dialogues"`
}

// Dialogue 对话结构
type Dialogue struct {
	Character string `bson:"character" json:"character"`
	Line      string `bson:"line" json:"line"`
	VoiceURL  string `bson:"voice_url" json:"voiceURL"`
}

// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
	Name  string `json:"name"`
	Novel string `json:"novel"`
}

// CreateTaskResponse 创建任务响应
type CreateTaskResponse struct {
	ID string `json:"id"`
}

// GetTaskResponse 获取任务响应
type GetTaskResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

// GetArtifactsResponse 获取产物响应
type GetArtifactsResponse struct {
	Scenes []Scene `json:"scenes"`
}

// GetTasksResponse 获取任务列表响应
type GetTasksResponse struct {
	Tasks []GetTaskResponse `json:"tasks"`
}
