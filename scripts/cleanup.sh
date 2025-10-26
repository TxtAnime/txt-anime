#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧹 清理运行时文件${NC}"
echo "=================================="

# 停止服务
echo "停止服务..."
../stop.sh

# 清理日志文件
echo "清理日志文件..."
rm -f ../backend.log ../frontend.log
rm -f ../novel-to-anime-frontend/dist/*.log

# 清理构建产物（可选）
read -p "是否清理前端构建产物? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "清理前端构建产物..."
    rm -rf ../novel-to-anime-frontend/dist/
fi

# 清理 Go 二进制文件（可选）
read -p "是否清理 Go 二进制文件? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "清理 Go 二进制文件..."
    rm -f ../novel2comicd ../novel2comicd-linux
fi

echo -e "${GREEN}✅ 清理完成${NC}"