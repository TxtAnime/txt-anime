# 部署和测试脚本

本目录包含用于部署和测试的实用脚本。

## 🚀 部署脚本

- `../deploy.sh` - 主部署脚本（本地/K8s）
- `../stop.sh` - 停止本地服务
- `cleanup.sh` - 清理运行时文件

## 🔍 测试和验证脚本

- `../health-check-local.sh` - 本地部署健康检查
- `../verify-output-path.sh` - 验证输出路径修复
- `../test-image-access.sh` - 测试图片访问
- `../test-deployment-modes.sh` - 测试两种部署模式

## 📖 文档

- `../LOCAL_DEPLOYMENT.md` - 本地部署详细指南

## 使用方法

```bash
# 本地部署
./deploy.sh

# 停止服务
./stop.sh

# 清理文件
./scripts/cleanup.sh

# 健康检查
./scripts/health-check-local.sh

# 验证部署
./scripts/verify-output-path.sh
./scripts/test-image-access.sh
./scripts/test-deployment-modes.sh
```