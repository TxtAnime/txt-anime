#!/bin/bash

# 测试腾讯云TTS配置

echo "🔍 检查配置文件..."

# 检查config.json是否存在
if [ ! -f "config.json" ]; then
    echo "❌ config.json 不存在"
    exit 1
fi

# 检查tts_provider字段
TTS_PROVIDER=$(grep -o '"tts_provider"[^,]*' config.json | cut -d'"' -f4)
echo "✅ TTS Provider: $TTS_PROVIDER"

# 检查tencent_tts配置
if grep -q '"tencent_tts"' config.json; then
    echo "✅ 腾讯云TTS配置已添加"
else
    echo "❌ 腾讯云TTS配置缺失"
    exit 1
fi

echo ""
echo "📦 检查代码包..."

# 检查audiosynctc包
if [ -d "pkgs/audiosynctc" ]; then
    echo "✅ audiosynctc 包已创建"
else
    echo "❌ audiosynctc 包不存在"
    exit 1
fi

# 检查audiosynctc.go文件
if [ -f "pkgs/audiosynctc/audiosynctc.go" ]; then
    echo "✅ audiosynctc.go 文件存在"
    
    # 检查关键函数
    if grep -q "func Process" pkgs/audiosynctc/audiosynctc.go; then
        echo "  ✓ Process 函数已实现"
    fi
    
    if grep -q "getMultiEmotionVoices" pkgs/audiosynctc/audiosynctc.go; then
        echo "  ✓ 多情感音色列表已定义"
    fi
    
    if grep -q "EmotionCategory" pkgs/audiosynctc/audiosynctc.go; then
        echo "  ✓ 情感参数支持已添加"
    fi
else
    echo "❌ audiosynctc.go 文件不存在"
    exit 1
fi

echo ""
echo "📝 检查novel2script..."

# 检查Emotion字段支持
if grep -q 'Emotion.*string.*json:"emotion,omitempty"' pkgs/novel2script/novel2script.go; then
    echo "✅ novel2script 已支持 Emotion 字段"
else
    echo "❌ novel2script 未支持 Emotion 字段"
    exit 1
fi

echo ""
echo "🔧 检查processor集成..."

# 检查processor.go的改动
if grep -q "generateAudiosTencent" cmd/novel2comicd/processor.go; then
    echo "✅ processor 已集成腾讯云TTS"
else
    echo "❌ processor 未集成腾讯云TTS"
    exit 1
fi

if grep -q 'TTSProvider' cmd/novel2comicd/processor.go; then
    echo "✅ processor 支持TTS提供商选择"
else
    echo "❌ processor 不支持TTS提供商选择"
    exit 1
fi

echo ""
echo "🏗️  尝试编译..."

# 编译检查
if go build -o /tmp/novel2comicd_test ./cmd/novel2comicd; then
    echo "✅ 编译成功"
    rm -f /tmp/novel2comicd_test
else
    echo "❌ 编译失败"
    exit 1
fi

echo ""
echo "🎉 所有检查通过！"
echo ""
echo "📋 下一步："
echo "1. 配置腾讯云凭证："
echo "   - 修改 config.json 中的 secret_id 和 secret_key"
echo "   - 设置 tts_provider 为 \"tencent\""
echo ""
echo "2. 启动服务："
echo "   ./novel2comicd -config config.json"
echo ""
echo "3. 创建任务并测试情感语音生成"

