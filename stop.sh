#!/bin/bash

# 停止本地部署的服务

echo "🛑 停止本地服务..."

# 停止后端
echo "  停止后端服务..."
pkill -f "./novel2comicd" || true

# 停止前端
echo "  停止前端服务..."
pkill -f "serve.*dist" || true
pkill -f "npm.*serve" || true
pkill -f "serve -s dist" || true
pkill -f "vite preview" || true
pkill -f "npm.*preview" || true

# 停止占用 3000 端口的进程
PORT_PID=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "  停止占用端口 3000 的进程 (PID: $PORT_PID)..."
    kill -9 $PORT_PID 2>/dev/null || true
fi

# 等待进程完全停止
sleep 2

echo "✅ 所有服务已停止"

# 显示剩余相关进程（如果有）
REMAINING=$(ps aux | grep -E "(novel2comicd|serve.*dist)" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo ""
    echo "⚠️  发现残留进程："
    ps aux | grep -E "(novel2comicd|serve.*dist)" | grep -v grep
    echo ""
    echo "如需强制停止，请运行："
    echo "  pkill -9 -f 'novel2comicd'"
    echo "  pkill -9 -f 'serve.*dist'"
fi