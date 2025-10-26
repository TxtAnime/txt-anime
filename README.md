# txt-anime - 小说动漫生成器

自动根据小说生成动漫的智能工具

## 项目简介

这是一个Hackathon项目,目标是将文本小说自动转换成动漫形式。通过AI大模型的能力,将小说的理解、场景拆分、角色视觉化、语音合成等环节自动化,最终生成"图配文+声音"的动漫作品。

## 核心特性

✅ **角色一致性**: 同一角色在整个动漫中保持视觉一致性  
✅ **场景化改编**: 自动将小说拆分成适合展示的场景  
✅ **结构化输出**: 生成标准JSON格式,便于后续处理  
✅ **一键生成**: 单次API调用完成剧本改编和角色设计  

## 快速部署

### 本地部署

使用一键部署脚本启动前端和后端服务：

```bash
# 本地部署 (默认)
./deploy.sh

# Kubernetes部署
./deploy.sh k8s
```

部署完成后访问：
- 前端界面: http://localhost:3000
- 后端API: http://localhost:8080
- API文档: http://localhost:8080/swagger/index.html
- 健康检查: http://localhost:8080/health

### 服务管理

```bash
# 停止所有服务
./cleanup.sh

# 运行完整验证测试
node test-full-deployment.js

# 运行基础集成测试
node test-integration.js
```

### 构建说明

- **后端服务**: `go build -o novel2comicd ./cmd/novel2comicd`
- **启动命令**: `./novel2comicd -config config.json`
- **前端服务**: 基于 React + Vite + TypeScript
- **数据库**: MongoDB (需要预先启动)

## License

MIT
