#!/bin/bash

# 部署脚本 - 支持本地和 Kubernetes 部署
# 用法：
#   本地部署：./deploy.sh
#   Kubernetes 部署：./deploy.sh k8s

set -e

DEPLOYMENT_MODE=${1:-local}
NAMESPACE="txt-anime"
REGISTRY="aslan-spock-register.qiniu.io/qmatrix"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"

echo "🚀 开始部署 txt-anime 项目..."
echo "部署模式: $DEPLOYMENT_MODE"
echo "镜像标签: $IMAGE_TAG"
echo ""

if [ "$DEPLOYMENT_MODE" = "k8s" ]; then
    echo "📦 Kubernetes 部署模式"
    
    # 检查必要工具
    echo "📋 检查必要工具..."
    for tool in docker go kubectl; do
        if ! command -v $tool &> /dev/null; then
            echo "❌ $tool 未安装，请先安装 $tool"
            exit 1
        fi
    done
    echo "✅ 所有必要工具已就绪"
    
    # 构建后端
    echo ""
    echo "🔨 构建后端..."
    echo "  编译 Go 二进制文件..."
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o novel2comicd-linux ./cmd/novel2comicd
    if [ $? -ne 0 ]; then
        echo "❌ 后端编译失败"
        exit 1
    fi
    echo "  构建 Docker 镜像..."
    docker build -f Dockerfile.simple2 -t $REGISTRY/novel2comicd-backend:$IMAGE_TAG . > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ 后端镜像构建失败"
        exit 1
    fi
    # 同时打上 latest 标签
    docker tag $REGISTRY/novel2comicd-backend:$IMAGE_TAG $REGISTRY/novel2comicd-backend:latest
    echo "  推送镜像到仓库..."
    docker push $REGISTRY/novel2comicd-backend:$IMAGE_TAG > /dev/null 2>&1
    docker push $REGISTRY/novel2comicd-backend:latest > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ 后端镜像推送失败"
        exit 1
    fi
    echo "✅ 后端镜像构建并推送成功"
    
    # 构建前端
    echo ""
    echo "🔨 构建前端..."
    cd novel-to-anime-frontend
    
    # 检查是否已构建
    if [ ! -d "dist" ]; then
        echo "  安装依赖..."
        npm install > /dev/null 2>&1
        echo "  构建前端..."
        npm run build > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "❌ 前端构建失败"
            cd ..
            exit 1
        fi
    fi
    
    echo "  构建 Docker 镜像..."
    # 先确保有 amd64 的 nginx:alpine 镜像
    docker pull --platform linux/amd64 nginx:alpine > /dev/null 2>&1 || true
    # 使用 buildx 构建 amd64 镜像
    docker buildx build --platform linux/amd64 --pull=false -f Dockerfile.simple -t $REGISTRY/novel2comicd-frontend:$IMAGE_TAG --load . > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ 前端镜像构建失败"
        cd ..
        exit 1
    fi
    # 同时打上 latest 标签
    docker tag $REGISTRY/novel2comicd-frontend:$IMAGE_TAG $REGISTRY/novel2comicd-frontend:latest
    echo "  推送镜像到仓库..."
    docker push $REGISTRY/novel2comicd-frontend:$IMAGE_TAG > /dev/null 2>&1
    docker push $REGISTRY/novel2comicd-frontend:latest > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ 前端镜像推送失败"
        cd ..
        exit 1
    fi
    cd ..
    echo "✅ 前端镜像构建并推送成功"
    
    # 部署到 Kubernetes
    echo ""
    echo "☸️  部署到 Kubernetes..."
    
    # 创建命名空间
    echo "  创建命名空间..."
    kubectl apply -f k8s/namespace.yaml > /dev/null 2>&1
    
    # 部署 MongoDB
    echo "  部署 MongoDB..."
    kubectl apply -f k8s/mongodb.yaml > /dev/null 2>&1
    
    # 等待 MongoDB 就绪
    echo "  等待 MongoDB 启动..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=60s > /dev/null 2>&1 || true
    sleep 5
    
    # 创建后端持久化存储
    echo "  创建后端持久化存储..."
    kubectl apply -f k8s/backend-pvc.yaml > /dev/null 2>&1
    
    # 部署后端
    echo "  部署后端服务..."
    kubectl apply -f k8s/backend.yaml > /dev/null 2>&1
    
    # 部署前端
    echo "  部署前端服务..."
    kubectl apply -f k8s/frontend.yaml > /dev/null 2>&1
    
    # 强制重启部署以拉取新镜像
    echo "  重启部署以应用新镜像..."
    kubectl rollout restart deployment/backend -n $NAMESPACE > /dev/null 2>&1
    kubectl rollout restart deployment/frontend -n $NAMESPACE > /dev/null 2>&1
    
    # 等待部署完成
    echo "  等待服务就绪..."
    kubectl rollout status deployment/backend -n $NAMESPACE --timeout=120s > /dev/null 2>&1
    kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=120s > /dev/null 2>&1
    
    # 显示部署状态
    echo ""
    echo "📊 部署状态："
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    kubectl get svc -n $NAMESPACE
    
    echo ""
    echo "✅ Kubernetes 部署完成！"
    echo ""
    echo "📝 使用以下命令查看详细状态："
    echo "  kubectl get all -n $NAMESPACE"
    echo "  kubectl get pods -n $NAMESPACE -w"
    echo ""
    echo "🔍 查看日志："
    echo "  kubectl logs -f -n $NAMESPACE -l app=backend"
    echo "  kubectl logs -f -n $NAMESPACE -l app=mongodb"
    echo "  kubectl logs -f -n $NAMESPACE -l app=frontend"
    echo ""
    echo "🌐 端口转发以访问服务："
    echo "  kubectl port-forward -n $NAMESPACE svc/frontend 3000:80"
    echo "  kubectl port-forward -n $NAMESPACE svc/backend 8080:8080"
    echo ""
    echo "🧹 清理部署："
    echo "  kubectl delete namespace $NAMESPACE"
    
else
    echo "💻 本地机器部署模式"
    
    # 检查必要工具
    echo "📋 检查必要工具..."
    for tool in go node npm; do
        if ! command -v $tool &> /dev/null; then
            echo "❌ $tool 未安装，请先安装 $tool"
            exit 1
        fi
    done
    echo "✅ 所有必要工具已就绪"
    
    # 1. 构建后端程序
    echo ""
    echo "🔨 步骤1: 构建后端程序..."
    echo "  编译 Go 二进制文件..."
    go build -o novel2comicd ./cmd/novel2comicd
    if [ $? -ne 0 ]; then
        echo "❌ 后端编译失败"
        exit 1
    fi
    echo "✅ 后端程序构建成功"
    
    # 构建前端
    echo ""
    echo "🔨 构建前端程序..."
    cd novel-to-anime-frontend
    
    # 检查是否需要安装依赖
    if [ ! -d "node_modules" ]; then
        echo "  安装前端依赖..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ 前端依赖安装失败"
            cd ..
            exit 1
        fi
    fi
    
    # 构建前端（本地部署使用特殊环境变量）
    echo "  构建前端..."
    VITE_API_BASE_URL=http://localhost:8080 VITE_ASSETS_BASE_URL=http://localhost:8080 npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 前端构建失败"
        cd ..
        exit 1
    fi
    cd ..
    echo "✅ 前端程序构建成功"
    
    # 检查配置文件
    echo ""
    echo "📋 检查配置文件..."
    if [ ! -f "cmd/novel2comicd/config.json" ]; then
        if [ -f "config.json.example" ]; then
            echo "  复制示例配置文件..."
            cp config.json.example cmd/novel2comicd/config.json
            echo "⚠️  请编辑 cmd/novel2comicd/config.json 配置文件"
        else
            echo "❌ 配置文件不存在，请创建 cmd/novel2comicd/config.json"
            exit 1
        fi
    fi
    echo "✅ 配置文件检查完成"
    
    # 2. 启动后端程序
    echo ""
    echo "🚀 步骤2: 启动后端程序..."
    echo "  后端将在后台运行，端口: 8080"
    
    # 杀死可能存在的旧进程
    pkill -f "./novel2comicd" || true
    sleep 2
    
    # 启动后端（在项目根目录运行，使用配置文件的相对路径）
    nohup ./novel2comicd -config cmd/novel2comicd/config.json > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # 等待后端启动
    echo "  等待后端启动..."
    sleep 3
    
    # 检查后端是否启动成功
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ 后端启动成功 (PID: $BACKEND_PID)"
    else
        echo "⚠️  后端可能启动失败，请检查日志: tail -f backend.log"
    fi
    
    # 3. 启动前端程序
    echo ""
    echo "🚀 步骤3: 启动前端程序..."
    echo "  前端将在后台运行，端口: 3000"
    
    cd novel-to-anime-frontend
    
    # 杀死可能存在的旧进程
    pkill -f "npm.*serve" || true
    pkill -f "serve.*dist" || true
    pkill -f "serve -s dist" || true
    sleep 2
    
    # 检查并杀死占用 3000 端口的进程
    PORT_PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        echo "  停止占用端口 3000 的进程 (PID: $PORT_PID)..."
        kill -9 $PORT_PID 2>/dev/null || true
        sleep 2
    fi
    
    # 使用 Vite 预览服务器（支持代理配置）
    nohup npm run preview -- --port 3000 --host 0.0.0.0 > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # 等待前端启动
    echo "  等待前端启动..."
    sleep 3
    
    # 检查前端是否启动成功
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 前端启动成功 (PID: $FRONTEND_PID)"
    else
        echo "⚠️  前端可能启动失败，请检查日志: tail -f frontend.log"
    fi
    
    echo ""
    echo "✅ 本地机器部署完成！"
    echo ""
    echo "🌐 访问地址："
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:8080"
    echo ""
    echo "📊 进程信息："
    echo "  后端 PID: $BACKEND_PID"
    echo "  前端 PID: $FRONTEND_PID"
    echo ""
    echo "📝 查看日志："
    echo "  后端日志: tail -f backend.log"
    echo "  前端日志: tail -f frontend.log"
    echo ""
    echo "🛑 停止服务："
    echo "  pkill -f './novel2comicd'"
    echo "  pkill -f 'serve.*dist'"
    echo ""
    echo "🔄 重启服务："
    echo "  ./deploy.sh"
fi
