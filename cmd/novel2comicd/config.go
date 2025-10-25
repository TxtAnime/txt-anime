package main

import (
	"encoding/json"
	"fmt"
	"os"
)

// Config 应用配置
type Config struct {
	Server  ServerConfig  `json:"server"`
	MongoDB MongoDBConfig `json:"mongodb"`
	AI      AIConfig      `json:"ai"`
	Qiniu   QiniuConfig   `json:"qiniu"`
	Storage StorageConfig `json:"storage"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int `json:"port"`
}

// MongoDBConfig MongoDB 配置
type MongoDBConfig struct {
	URI        string `json:"uri"`
	Database   string `json:"database"`
	Collection string `json:"collection"`
}

// AIConfig AI 服务配置
type AIConfig struct {
	BaseURL    string `json:"base_url"`
	APIKey     string `json:"api_key"`
	TextModel  string `json:"text_model"`
	ImageModel string `json:"image_model"`
}

// QiniuConfig 七牛云配置
type QiniuConfig struct {
	AccessKey string `json:"access_key"`
	SecretKey string `json:"secret_key"`
	Bucket    string `json:"bucket"`
	Domain    string `json:"domain"`
}

// StorageConfig 存储配置
type StorageConfig struct {
	OutputDir string `json:"output_dir"`
}

// LoadConfig 加载配置文件
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	return &config, nil
}
