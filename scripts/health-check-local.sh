#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🏥 本地部署健康检查${NC}"
echo "=================================="

# 检查后端进程
echo -e "\n${YELLOW}🔍 检查后端进程:${NC}"
BACKEND_PID=$(pgrep -f "./novel2comicd")
if [ -n "$BACKEND_PID" ]; then
    echo -e "${GREEN}✅ 后端进程运行中 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ 后端进程未运行${NC}"
fi

# 检查前端进程
echo -e "\n${YELLOW}🔍 检查前端进程:${NC}"
FRONTEND_PID=$(pgrep -f "serve.*dist")
if [ -n "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✅ 前端进程运行中 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ 前端进程未运行${NC}"
fi

# 检查端口占用
echo -e "\n${YELLOW}🌐 检查端口占用:${NC}"
if lsof -i :8080 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 端口 8080 (后端) 已占用${NC}"
else
    echo -e "${RED}❌ 端口 8080 (后端) 未占用${NC}"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 端口 3000 (前端) 已占用${NC}"
else
    echo -e "${RED}❌ 端口 3000 (前端) 未占用${NC}"
fi

# 测试后端健康检查接口
echo -e "\n${YELLOW}🏥 测试后端健康检查:${NC}"
if curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端健康检查通过${NC}"
    # 获取健康检查详情
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/health)
    echo "   响应: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ 后端健康检查失败${NC}"
fi

# 测试前端访问
echo -e "\n${YELLOW}🌐 测试前端访问:${NC}"
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端页面可访问${NC}"
else
    echo -e "${RED}❌ 前端页面无法访问${NC}"
fi

# 检查日志文件
echo -e "\n${YELLOW}📋 检查日志文件:${NC}"
if [ -f "backend.log" ]; then
    BACKEND_LOG_SIZE=$(wc -l < backend.log)
    echo -e "${GREEN}✅ 后端日志存在 ($BACKEND_LOG_SIZE 行)${NC}"
    echo "   最新日志:"
    tail -3 backend.log | sed 's/^/   /'
else
    echo -e "${RED}❌ 后端日志文件不存在${NC}"
fi

if [ -f "frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(wc -l < frontend.log)
    echo -e "${GREEN}✅ 前端日志存在 ($FRONTEND_LOG_SIZE 行)${NC}"
else
    echo -e "${RED}❌ 前端日志文件不存在${NC}"
fi

# 检查配置文件
echo -e "\n${YELLOW}⚙️  检查配置文件:${NC}"
if [ -f "cmd/novel2comicd/config.json" ]; then
    echo -e "${GREEN}✅ 后端配置文件存在${NC}"
else
    echo -e "${RED}❌ 后端配置文件不存在${NC}"
fi

if [ -f "novel-to-anime-frontend/.env" ]; then
    echo -e "${GREEN}✅ 前端环境配置存在${NC}"
else
    echo -e "${YELLOW}⚠️  前端环境配置不存在 (使用默认配置)${NC}"
fi

echo -e "\n${GREEN}🎉 健康检查完成${NC}"
echo ""
echo "如果发现问题，可以："
echo "  - 查看日志: tail -f backend.log 或 tail -f frontend.log"
echo "  - 重启服务: ./stop.sh && ./deploy.sh"
echo "  - 检查配置: cat cmd/novel2comicd/config.json"