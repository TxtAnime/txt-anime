package main

import (
	"context"
	"fmt"

	"github.com/qiniu/go-sdk/v7/auth/qbox"
	"github.com/qiniu/go-sdk/v7/storage"
)

// QiniuUploader 七牛云上传器
type QiniuUploader struct {
	mac    *qbox.Mac
	cfg    *storage.Config
	bucket string
	domain string
}

// NewQiniuUploader 创建七牛云上传器
func NewQiniuUploader(cfg QiniuConfig) *QiniuUploader {
	mac := qbox.NewMac(cfg.AccessKey, cfg.SecretKey)

	// 构建配置
	storageCfg := &storage.Config{
		UseHTTPS:      true,
		UseCdnDomains: false,
	}

	return &QiniuUploader{
		mac:    mac,
		cfg:    storageCfg,
		bucket: cfg.Bucket,
		domain: cfg.Domain,
	}
}

// UploadFile 上传文件到七牛云
// localPath: 本地文件路径
// key: 七牛云对象存储的 key（如 "tasks/{taskID}/scene_1.png"）
// 返回: 公开访问 URL
func (u *QiniuUploader) UploadFile(localPath, key string) (string, error) {
	putPolicy := storage.PutPolicy{
		Scope: u.bucket,
	}
	upToken := putPolicy.UploadToken(u.mac)

	formUploader := storage.NewFormUploader(u.cfg)
	ret := storage.PutRet{}

	err := formUploader.PutFile(context.Background(), &ret, upToken, key, localPath, nil)
	if err != nil {
		return "", fmt.Errorf("上传文件失败: %w", err)
	}

	// 构建公开访问 URL
	url := fmt.Sprintf("%s/%s", u.domain, key)
	return url, nil
}
