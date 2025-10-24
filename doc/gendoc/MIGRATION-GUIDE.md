# 迁移指南：从 novel2comicli 到 novel2script

## 🔄 为什么重命名？

`novel2comicli` 被重命名为 `novel2script`，原因是：
- 更准确：工具生成的是**剧本**（script），而不是漫画（comic）
- 更清晰：避免用户误解为直接生成漫画图片
- 更专业：符合影视制作流程的术语

## 📦 快速迁移

### 如果你使用命令行工具

**旧方式**：
```bash
go build -o novel2comicli ./cmd/novel2comicli
./novel2comicli -input novel.txt -output script.json
```

**新方式** （只需改名）：
```bash
go build -o novel2script ./cmd/novel2script
./novel2script -input novel.txt -output script.json
```

### 如果你使用 demo.sh

不需要任何改动，直接运行：
```bash
./demo.sh
```

### 如果你有自己的脚本

全局替换即可：
```bash
# 在你的脚本中替换
sed -i 's/novel2comicli/novel2script/g' your-script.sh
```

## 🆕 新增功能：Package 调用

现在可以在Go程序中直接调用核心逻辑：

```go
package main

import (
    "fmt"
    "log"
    "github.com/TxtAnime/txt-anime/pkgs/novel2script"
)

func main() {
    cfg := novel2script.Config{
        BaseURL: "https://openai.qiniu.com/v1",
        APIKey:  "your-api-key",
        Model:   "deepseek-v3",
    }
    
    novelText := `
    《小红帽》
    从前有个可爱的小女孩...
    `
    
    response, err := novel2script.Process(novelText, cfg)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("生成了 %d 个场景\n", len(response.Script))
    fmt.Printf("提取了 %d 个角色\n", len(response.Characters))
}
```

## 📋 完整对照表

| 项目 | 旧名称 | 新名称 | 说明 |
|------|--------|--------|------|
| 命令行工具 | `novel2comicli` | `novel2script` | 工具重命名 |
| cmd 目录 | `cmd/novel2comicli/` | `cmd/novel2script/` | 目录重命名 |
| 二进制文件 | `novel2comicli` | `novel2script` | 编译输出重命名 |
| package | 无 | `pkgs/novel2script/` | 新增可复用包 |

## 🔧 编译对照

**旧命令**：
```bash
go build -o novel2comicli ./cmd/novel2comicli
```

**新命令**：
```bash
go build -o novel2script ./cmd/novel2script
```

## 📝 文档更新

已更新的文档：
- ✅ [README.md](README.md) - 主文档
- ✅ [demo.sh](demo.sh) - 演示脚本
- ✅ [REFACTORING.md](REFACTORING.md) - 重构说明
- ⏸️ [USAGE.md](USAGE.md) - 使用指南（待更新）
- ⏸️ [QUICKSTART.md](QUICKSTART.md) - 快速开始（待更新）

## ⚠️ 注意事项

1. **输出格式不变**
   - JSON 输出格式完全一致
   - API 调用方式不变
   - 参数完全兼容

2. **功能完全相同**
   - 所有功能保持不变
   - 性能没有差异
   - 只是名称更改

3. **向后兼容**
   - 旧的 JSON 文件仍可使用
   - 不影响后续步骤（storyboard, audiosync等）

## 🚀 推荐升级步骤

1. **拉取最新代码**
   ```bash
   git pull
   ```

2. **清理旧的二进制文件**
   ```bash
   rm -f novel2comicli
   ```

3. **重新编译**
   ```bash
   go build -o novel2script ./cmd/novel2script
   ```

4. **测试新工具**
   ```bash
   ./novel2script -input your-novel.txt -output script.json
   ```

5. **更新你的脚本** （如果有）
   ```bash
   # 全局替换
   find . -name "*.sh" -type f -exec sed -i 's/novel2comicli/novel2script/g' {} \;
   ```

## 💡 获取帮助

如果遇到问题：

1. 查看 [REFACTORING.md](REFACTORING.md) 了解重构细节
2. 查看 [README.md](README.md) 了解新的项目结构
3. 运行 `./demo.sh` 测试完整流程
4. 查看 [QUICKSTART.md](QUICKSTART.md) 快速开始指南

## 📞 常见问题

**Q: 为什么找不到 novel2comicli？**  
A: 已重命名为 `novel2script`，请使用新名称。

**Q: 旧的 JSON 文件还能用吗？**  
A: 可以！JSON 格式完全不变，可继续使用。

**Q: 需要重新生成所有内容吗？**  
A: 不需要！只需重新编译工具即可。

**Q: 可以同时保留两个版本吗？**  
A: 不推荐。新版本完全兼容，无需保留旧版本。

**Q: 如何使用新的 package API？**  
A: 查看 [REFACTORING.md](REFACTORING.md) 的使用示例。

---

**迁移指南版本**: 1.0  
**更新日期**: 2025-10-24  
**适用版本**: v1.1+

