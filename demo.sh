#!/bin/bash

# txt-anime 完整流程演示脚本
# 该脚本演示从小说文本到动漫素材（剧本+图片+语音）的完整流程

set -e  # 遇到错误立即退出

# 显示使用说明
function show_usage() {
    echo "用法: $0 [小说文件路径]"
    echo ""
    echo "参数:"
    echo "  小说文件路径    可选，指定要处理的小说文本文件"
    echo "                  如果不指定，将使用内置的示例小说"
    echo ""
    echo "示例:"
    echo "  $0                          # 使用内置示例"
    echo "  $0 my-story.txt             # 使用指定文件"
    echo "  $0 /path/to/novel.txt       # 使用绝对路径"
    echo ""
    exit 1
}

# 处理帮助参数
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    show_usage
fi

echo "=========================================="
echo "  txt-anime 完整流程演示"
echo "=========================================="
echo ""

# 步骤0: 检查环境
echo "📋 检查环境..."
if [ ! -f "go.mod" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 创建 bin 和 outputs 目录
mkdir -p bin
mkdir -p outputs

# 步骤1: 编译程序
echo ""
echo "🔨 步骤1: 编译程序..."
echo "  - 编译 novel2script (步骤一+二)"
go build -o bin/novel2script ./cmd/novel2script

echo "  - 编译 storyboard (步骤三)"
go build -o bin/storyboard ./cmd/storyboard

echo "  - 编译 audiosync (步骤四)"
go build -o bin/audiosync ./cmd/audiosync

echo "✅ 编译完成"

# 步骤2: 准备小说文件
echo ""
echo "📚 步骤2: 准备小说文件..."

# 检查是否提供了小说文件参数
if [ -n "$1" ]; then
    # 使用用户提供的文件
    INPUT_FILE="$1"
    
    # 检查文件是否存在
    if [ ! -f "$INPUT_FILE" ]; then
        echo "❌ 错误: 文件不存在: $INPUT_FILE"
        exit 1
    fi
    
    # 检查文件是否可读
    if [ ! -r "$INPUT_FILE" ]; then
        echo "❌ 错误: 文件无法读取: $INPUT_FILE"
        exit 1
    fi
    
    # 检查文件是否为空
    if [ ! -s "$INPUT_FILE" ]; then
        echo "❌ 错误: 文件为空: $INPUT_FILE"
        exit 1
    fi
    
    echo "✅ 使用用户指定的小说: $INPUT_FILE"
    DEMO_FILE="$INPUT_FILE"
    # 提取文件名（不含扩展名）作为小说名
    NOVEL_NAME=$(basename "$INPUT_FILE" .txt)
    USE_CUSTOM_FILE=true
else
    # 使用内置示例
    DEMO_FILE="demo-story.txt"
    NOVEL_NAME="demo-story"
    cat > "$DEMO_FILE" << 'EOF'
《机器人与小女孩》

在2050年的东京，一个小女孩名叫美月，她住在高层公寓的顶楼。

一天，她在阳台上发现了一个破损的机器人。

"你是谁？"美月好奇地问。

"我叫阿尔法，是一个护理型机器人。"机器人用沙哑的声音回答，"我的电池快用完了。"

美月决定帮助阿尔法。她把机器人带进房间，用充电器为它充电。

充好电后，阿尔法站了起来。"谢谢你，小女孩。作为回报，我可以讲故事给你听。"

"好啊！"美月高兴地说。

于是，在霓虹灯闪烁的东京夜空下，机器人开始讲述遥远星球的奇幻故事。
EOF
    
    echo "✅ 使用内置示例小说: $DEMO_FILE"
    USE_CUSTOM_FILE=false
fi

# 创建输出目录（小说名-随机字符串）
RANDOM_STR=$(openssl rand -hex 4)
OUTPUT_DIR="outputs/${NOVEL_NAME}-${RANDOM_STR}"
mkdir -p "$OUTPUT_DIR"
echo "📁 输出目录: $OUTPUT_DIR"

# 步骤3: 生成剧本和角色
echo ""
echo "🎬 步骤3: 生成剧本和角色 (步骤一+二)..."
SCRIPT_FILE="$OUTPUT_DIR/script.json"
echo "  输入: $DEMO_FILE"
echo "  输出: $SCRIPT_FILE"
./bin/novel2script -input "$DEMO_FILE" -output "$SCRIPT_FILE"

# 统计场景和角色
SCENE_COUNT=$(jq '.script | length' "$SCRIPT_FILE")
CHAR_COUNT=$(jq '.characters | length' "$SCRIPT_FILE")
echo "✅ 已生成 $SCENE_COUNT 个场景, $CHAR_COUNT 个角色"

# 步骤4: 生成分镜图片
echo ""
echo "🎨 步骤4: 生成分镜图片 (步骤三)..."
STORYBOARD_DIR="$OUTPUT_DIR/images"
echo "  输入: $SCRIPT_FILE"
echo "  输出: $STORYBOARD_DIR/"
./bin/storyboard -input "$SCRIPT_FILE" -output "$STORYBOARD_DIR"

# 统计图片
IMAGE_COUNT=$(ls "$STORYBOARD_DIR"/*.png 2>/dev/null | wc -l)
echo "✅ 已生成 $IMAGE_COUNT 张图片"

# 步骤5: 生成语音
echo ""
echo "🎤 步骤5: 生成角色语音 (步骤四)..."
AUDIO_DIR="$OUTPUT_DIR/audios"
echo "  输入: $SCRIPT_FILE"
echo "  输出: $AUDIO_DIR/"
./bin/audiosync -input "$SCRIPT_FILE" -output "$AUDIO_DIR"

# 统计音频
AUDIO_COUNT=$(ls "$AUDIO_DIR"/*.mp3 2>/dev/null | wc -l)
echo "✅ 已生成 $AUDIO_COUNT 个语音文件"

# 步骤6: 展示结果
echo ""
echo "=========================================="
echo "  🎉 演示完成！"
echo "=========================================="
echo ""
echo "📊 结果统计:"
echo "  - 场景数: $SCENE_COUNT"
echo "  - 角色数: $CHAR_COUNT"
echo "  - 图片数: $IMAGE_COUNT"
echo "  - 音频数: $AUDIO_COUNT"
echo ""
echo "📁 输出目录:"
echo "  - 主目录: $OUTPUT_DIR/"
echo "  - 剧本JSON: $SCRIPT_FILE"
echo "  - 分镜图片: $STORYBOARD_DIR/"
echo "  - 角色语音: $AUDIO_DIR/"
echo ""
echo "💡 查看结果:"
echo "  - 查看JSON: cat $SCRIPT_FILE | jq '.'"
echo "  - 查看图片: open $STORYBOARD_DIR/"
echo "  - 播放音频: afplay $AUDIO_DIR/scene_001_dialogue_001.mp3 (如果有对话)"
echo ""

# 询问是否清理
echo "🧹 是否清理生成的文件？(y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "清理中..."
    
    # 只有使用内置示例时才删除小说文件
    if [ "$USE_CUSTOM_FILE" = false ]; then
        rm -f "$DEMO_FILE"
        echo "  - 已删除示例小说"
    else
        echo "  - 保留用户小说文件: $DEMO_FILE"
    fi
    
    rm -rf "$OUTPUT_DIR"
    echo "  - 已删除输出目录: $OUTPUT_DIR"
    
    echo "✅ 清理完成"
else
    echo "保留所有文件"
fi

echo ""
echo "感谢使用 txt-anime! 🚀"