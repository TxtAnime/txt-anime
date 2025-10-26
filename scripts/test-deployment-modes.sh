#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 测试两种部署模式${NC}"
echo "=================================="

# 测试本地部署构建
echo -e "\n${YELLOW}📦 测试本地部署构建...${NC}"
cd novel-to-anime-frontend

# 清理构建
rm -rf dist/

# 模拟本地部署构建（使用环境变量）
VITE_API_BASE_URL=http://localhost:8080 VITE_ASSETS_BASE_URL=http://localhost:8080 npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 本地部署构建成功${NC}"
    
    # 检查是否包含 localhost 引用
    LOCAL_REFS=$(grep -r "localhost:8080" dist/ 2>/dev/null | wc -l)
    if [ "$LOCAL_REFS" -gt 0 ]; then
        echo -e "${GREEN}✅ 本地构建包含 $LOCAL_REFS 个 localhost:8080 引用（正确）${NC}"
    else
        echo -e "${RED}❌ 本地构建缺少 localhost:8080 引用（错误）${NC}"
    fi
else
    echo -e "${RED}❌ 本地部署构建失败${NC}"
fi

# 测试 K8s 部署构建
echo -e "\n${YELLOW}📦 测试 K8s 部署构建...${NC}"

# 清理构建
rm -rf dist/

# 临时禁用本地环境文件
if [ -f ".env.local" ]; then
    mv .env.local .env.local.backup
fi

# 模拟 K8s 构建（生产环境，不使用本地环境变量）
NODE_ENV=production npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ K8s 部署构建成功${NC}"
    
    # 检查是否包含 localhost 引用
    K8S_REFS=$(grep -r "localhost:8080" dist/ 2>/dev/null | wc -l)
    if [ "$K8S_REFS" -eq 0 ]; then
        echo -e "${GREEN}✅ K8s 构建不包含 localhost:8080 引用（正确）${NC}"
    else
        echo -e "${RED}❌ K8s 构建包含 $K8S_REFS 个 localhost:8080 引用（错误）${NC}"
    fi
else
    echo -e "${RED}❌ K8s 部署构建失败${NC}"
fi

# 恢复本地环境文件
if [ -f ".env.local.backup" ]; then
    mv .env.local.backup .env.local
fi

cd ..

# 总结
echo -e "\n${YELLOW}📋 测试总结:${NC}"
echo "=================================="
echo -e "本地部署: 使用 localhost:8080 + Vite 代理"
echo -e "K8s 部署: 使用相对路径 + nginx 代理"
echo ""

if [ "$LOCAL_REFS" -gt 0 ] && [ "$K8S_REFS" -eq 0 ]; then
    echo -e "${GREEN}🎉 两种部署模式配置正确！${NC}"
    echo ""
    echo -e "${GREEN}✅ 本地部署会连接到 localhost:8080${NC}"
    echo -e "${GREEN}✅ K8s 部署会使用相对路径（由 nginx 代理）${NC}"
else
    echo -e "${RED}❌ 部署模式配置有问题${NC}"
    echo ""
    echo -e "本地构建 localhost 引用: $LOCAL_REFS (应该 > 0)"
    echo -e "K8s 构建 localhost 引用: $K8S_REFS (应该 = 0)"
fi

echo -e "\n${GREEN}🎉 测试完成${NC}"