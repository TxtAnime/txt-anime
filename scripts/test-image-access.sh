#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🖼️  测试图片访问${NC}"
echo "=================================="

# 获取最新任务
LATEST_TASK=$(ls -1t outputs/ | head -1)
if [ -z "$LATEST_TASK" ]; then
    echo -e "${RED}❌ 没有找到任务${NC}"
    exit 1
fi

echo "测试任务: $LATEST_TASK"

# 测试后端直接访问
echo -e "\n${YELLOW}🔍 测试后端直接访问:${NC}"
BACKEND_URL="http://localhost:8080/artifacts/$LATEST_TASK/images/scene_001.png"
if curl -s -I "$BACKEND_URL" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ 后端图片访问正常${NC}"
    echo "   URL: $BACKEND_URL"
else
    echo -e "${RED}❌ 后端图片访问失败${NC}"
fi

# 测试前端代理访问
echo -e "\n${YELLOW}🔍 测试前端代理访问:${NC}"
FRONTEND_URL="http://localhost:3000/artifacts/$LATEST_TASK/images/scene_001.png"
RESPONSE=$(curl -s -I "$FRONTEND_URL")
if echo "$RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ 前端代理访问正常${NC}"
    echo "   URL: $FRONTEND_URL"
    
    # 检查内容类型
    CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "content-type" | cut -d' ' -f2- | tr -d '\r')
    if echo "$CONTENT_TYPE" | grep -q "image/png"; then
        echo -e "${GREEN}✅ 内容类型正确: $CONTENT_TYPE${NC}"
    else
        echo -e "${RED}❌ 内容类型错误: $CONTENT_TYPE${NC}"
    fi
else
    echo -e "${RED}❌ 前端代理访问失败${NC}"
    echo "响应:"
    echo "$RESPONSE" | head -5
fi

# 测试 API 获取任务产物
echo -e "\n${YELLOW}🔍 测试 API 产物获取:${NC}"
API_RESPONSE=$(curl -s "http://localhost:8080/v1/tasks/$LATEST_TASK/artifacts")
if echo "$API_RESPONSE" | grep -q "imageURL"; then
    echo -e "${GREEN}✅ API 产物获取正常${NC}"
    
    # 提取第一个图片 URL
    IMAGE_URL=$(echo "$API_RESPONSE" | grep -o '"/artifacts/[^"]*\.png"' | head -1 | tr -d '"')
    if [ -n "$IMAGE_URL" ]; then
        echo "   第一个图片 URL: $IMAGE_URL"
        
        # 测试这个 URL 通过前端访问
        FULL_URL="http://localhost:3000$IMAGE_URL"
        if curl -s -I "$FULL_URL" | grep -q "200 OK"; then
            echo -e "${GREEN}✅ API 返回的图片 URL 可通过前端访问${NC}"
        else
            echo -e "${RED}❌ API 返回的图片 URL 无法通过前端访问${NC}"
        fi
    fi
else
    echo -e "${RED}❌ API 产物获取失败${NC}"
fi

echo -e "\n${GREEN}🎉 测试完成${NC}"