package main

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DB 数据库封装
type DB struct {
	client     *mongo.Client
	collection *mongo.Collection
}

// NewDB 创建数据库连接
func NewDB(cfg MongoDBConfig) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.URI))
	if err != nil {
		return nil, fmt.Errorf("连接 MongoDB 失败: %w", err)
	}

	// 测试连接
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("ping MongoDB 失败: %w", err)
	}

	collection := client.Database(cfg.Database).Collection(cfg.Collection)

	return &DB{
		client:     client,
		collection: collection,
	}, nil
}

// Close 关闭数据库连接
func (db *DB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return db.client.Disconnect(ctx)
}

// CreateTask 创建任务
func (db *DB) CreateTask(task *Task) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.collection.InsertOne(ctx, task)
	if err != nil {
		return fmt.Errorf("插入任务失败: %w", err)
	}
	return nil
}

// GetTask 获取任务
func (db *DB) GetTask(id string) (*Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var task Task
	err := db.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&task)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("查询任务失败: %w", err)
	}
	return &task, nil
}

// GetTasks 获取所有任务
func (db *DB) GetTasks() ([]Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := db.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("查询任务列表失败: %w", err)
	}
	defer cursor.Close(ctx)

	var tasks []Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, fmt.Errorf("解析任务列表失败: %w", err)
	}

	return tasks, nil
}

// UpdateTask 更新任务
func (db *DB) UpdateTask(task *Task) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	task.UpdatedAt = time.Now()

	_, err := db.collection.ReplaceOne(
		ctx,
		bson.M{"_id": task.ID},
		task,
	)
	if err != nil {
		return fmt.Errorf("更新任务失败: %w", err)
	}
	return nil
}

// GetDoingTasks 获取所有 doing 状态的任务
func (db *DB) GetDoingTasks() ([]Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := db.collection.Find(ctx, bson.M{"status": "doing"})
	if err != nil {
		return nil, fmt.Errorf("查询 doing 任务失败: %w", err)
	}
	defer cursor.Close(ctx)

	var tasks []Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, fmt.Errorf("解析 doing 任务列表失败: %w", err)
	}

	return tasks, nil
}

// UpdateTaskStatusDesc 更新任务的状态描述
func (db *DB) UpdateTaskStatusDesc(taskID, statusDesc string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.collection.UpdateOne(
		ctx,
		bson.M{"_id": taskID},
		bson.M{
			"$set": bson.M{
				"status_desc": statusDesc,
				"updated_at":  time.Now(),
			},
		},
	)
	if err != nil {
		return fmt.Errorf("更新任务状态描述失败: %w", err)
	}
	return nil
}

// DeleteTask 删除任务
func (db *DB) DeleteTask(taskID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.collection.DeleteOne(ctx, bson.M{"_id": taskID})
	if err != nil {
		return fmt.Errorf("删除任务失败: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("任务不存在")
	}

	return nil
}
