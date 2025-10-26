#!/bin/bash

# novel2comicd API Demo Script
# 演示如何使用 API 创建任务并获取产物

set -e

API_BASE="http://localhost:8080"
NOVEL_FILE="${1:-../../demo-story.txt}"

echo "========================================"
echo "  novel2comicd API Demo"
echo "========================================"
echo ""

# 检查服务是否运行
echo "🔍 检查服务状态..."
if ! curl -s "${API_BASE}/health" > /dev/null 2>&1; then
    echo "❌ 服务未运行！请先启动服务："
    echo "   ./novel2comicd -config config.json"
    exit 1
fi
echo "✅ 服务正常运行"
echo ""

# 检查小说文件
if [ ! -f "$NOVEL_FILE" ]; then
    echo "❌ 小说文件不存在: $NOVEL_FILE"
    exit 1
fi

# 读取小说内容
echo "📖 读取小说文件: $NOVEL_FILE"
NOVEL_CONTENT=$(cat "$NOVEL_FILE")
NOVEL_NAME=$(basename "$NOVEL_FILE" .txt)
echo "   小说名称: $NOVEL_NAME"
echo "   内容长度: ${#NOVEL_CONTENT} 字符"
echo ""

# 创建任务
echo "🚀 创建任务..."
RESPONSE=$(curl -s -X POST "${API_BASE}/v1/tasks/" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
        --arg name "$NOVEL_NAME" \
        --arg novel "$NOVEL_CONTENT" \
        '{name: $name, novel: $novel}')")

TASK_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ -z "$TASK_ID" ] || [ "$TASK_ID" = "null" ]; then
    echo "❌ 创建任务失败！"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ 任务创建成功！"
echo "   任务 ID: $TASK_ID"
echo ""

# 轮询任务状态
echo "⏳ 等待任务完成..."
POLL_COUNT=0
MAX_POLLS=120  # 最多轮询 120 次（10 分钟）
POLL_INTERVAL=5  # 每 5 秒轮询一次

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
    POLL_COUNT=$((POLL_COUNT + 1))
    
    # 获取任务状态
    STATUS_RESPONSE=$(curl -s "${API_BASE}/v1/tasks/${TASK_ID}")
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    STATUS_DESC=$(echo "$STATUS_RESPONSE" | jq -r '.statusDesc // ""')
    
    if [ "$STATUS" = "done" ]; then
        echo "✅ 任务完成！(轮询 $POLL_COUNT 次，耗时 $((POLL_COUNT * POLL_INTERVAL)) 秒)"
        echo ""
        break
    elif [ "$STATUS" = "doing" ]; then
        if [ -n "$STATUS_DESC" ] && [ "$STATUS_DESC" != "" ]; then
            printf "\r   [%3d/%3d] %s... (已等待 %d 秒)" $POLL_COUNT $MAX_POLLS "$STATUS_DESC" $((POLL_COUNT * POLL_INTERVAL))
        else
            printf "\r   [%3d/%3d] 任务处理中... (已等待 %d 秒)" $POLL_COUNT $MAX_POLLS $((POLL_COUNT * POLL_INTERVAL))
        fi
        sleep $POLL_INTERVAL
    else
        echo ""
        echo "❌ 任务状态异常: $STATUS"
        exit 1
    fi
done

if [ $POLL_COUNT -ge $MAX_POLLS ]; then
    echo ""
    echo "❌ 任务超时！"
    exit 1
fi

echo ""

# 获取任务产物
echo "📦 获取任务产物..."
ARTIFACTS=$(curl -s "${API_BASE}/v1/tasks/${TASK_ID}/artifacts")

# 统计信息
SCENE_COUNT=$(echo "$ARTIFACTS" | jq '.scenes | length')
TOTAL_DIALOGUES=0

echo "✅ 产物获取成功！"
echo ""
echo "========================================"
echo "  任务产物统计"
echo "========================================"
echo "场景总数: $SCENE_COUNT"
echo ""

# 遍历每个场景
for i in $(seq 0 $((SCENE_COUNT - 1))); do
    SCENE=$(echo "$ARTIFACTS" | jq ".scenes[$i]")
    NARRATION=$(echo "$SCENE" | jq -r '.narration' | head -c 40)
    DIALOGUE_COUNT=$(echo "$SCENE" | jq '.dialogues | length')
    TOTAL_DIALOGUES=$((TOTAL_DIALOGUES + DIALOGUE_COUNT))
    
    echo "场景 $((i + 1)):"
    echo "  旁白: ${NARRATION}..."
    echo "  对话数: $DIALOGUE_COUNT"
done

echo ""
echo "对话总数: $TOTAL_DIALOGUES"
echo ""

# 输出完整 JSON
echo "========================================"
echo "  完整产物数据 (JSON)"
echo "========================================"
echo "$ARTIFACTS" | jq .

echo ""
echo "========================================"
echo "  Demo 完成！"
echo "========================================"
echo ""
echo "📝 任务信息:"
echo "   任务 ID: $TASK_ID"
echo "   任务名称: $NOVEL_NAME"
echo "   场景数: $SCENE_COUNT"
echo "   对话数: $TOTAL_DIALOGUES"
echo ""
echo "🔗 相关链接:"
echo "   查看任务: ${API_BASE}/v1/tasks/${TASK_ID}"
echo "   查看产物: ${API_BASE}/v1/tasks/${TASK_ID}/artifacts"
echo ""

