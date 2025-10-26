#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 验证输出路径修复${NC}"
echo "=================================="

# 检查项目根目录的 outputs
echo -e "\n${YELLOW}📁 检查项目根目录 outputs:${NC}"
if [ -d "outputs" ]; then
    TASK_COUNT=$(ls -1 outputs/ | wc -l)
    echo -e "${GREEN}✅ 项目根目录 outputs 存在，包含 $TASK_COUNT 个任务${NC}"
    echo "   任务列表:"
    ls -1 outputs/ | sed 's/^/   - /'
else
    echo -e "${RED}❌ 项目根目录 outputs 不存在${NC}"
fi

# 检查 cmd/novel2comicd/outputs
echo -e "\n${YELLOW}📁 检查 cmd/novel2comicd/outputs:${NC}"
if [ -d "cmd/novel2comicd/outputs" ]; then
    OLD_TASK_COUNT=$(ls -1 cmd/novel2comicd/outputs/ 2>/dev/null | wc -l)
    if [ "$OLD_TASK_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ cmd/novel2comicd/outputs 为空（正确）${NC}"
    else
        echo -e "${YELLOW}⚠️  cmd/novel2comicd/outputs 包含 $OLD_TASK_COUNT 个旧任务${NC}"
        echo "   旧任务列表:"
        ls -1 cmd/novel2comicd/outputs/ | sed 's/^/   - /'
    fi
else
    echo -e "${GREEN}✅ cmd/novel2comicd/outputs 不存在（正确）${NC}"
fi

# 测试 API 访问
echo -e "\n${YELLOW}🌐 测试产物 API 访问:${NC}"
LATEST_TASK=$(ls -1t outputs/ | head -1)
if [ -n "$LATEST_TASK" ]; then
    echo "   测试任务: $LATEST_TASK"
    
    # 测试任务状态
    TASK_STATUS=$(curl -s http://localhost:8080/v1/tasks/$LATEST_TASK | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   任务状态: $TASK_STATUS"
    
    # 测试产物访问
    if curl -s http://localhost:8080/v1/tasks/$LATEST_TASK/artifacts >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 产物 API 可访问${NC}"
    else
        echo -e "${RED}❌ 产物 API 无法访问${NC}"
    fi
    
    # 测试静态文件访问
    if [ -f "outputs/$LATEST_TASK/script.json" ]; then
        if curl -s http://localhost:8080/artifacts/$LATEST_TASK/script.json >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 静态文件可访问${NC}"
        else
            echo -e "${RED}❌ 静态文件无法访问${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  没有找到任务进行测试${NC}"
fi

echo -e "\n${GREEN}🎉 验证完成${NC}"