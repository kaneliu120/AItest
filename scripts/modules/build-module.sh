#!/bin/bash

# 模块构建脚本
# 用法: ./scripts/modules/build-module.sh <module-name> [--production]

set -e

MODULE_NAME="$1"
BUILD_MODE="${2:-development}"
MODULE_DIR="src/modules/$MODULE_NAME"
BUILD_DIR="dist/modules/$MODULE_NAME"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ -z "$MODULE_NAME" ]; then
    log_error "请指定模块名称"
    echo "用法: $0 <module-name> [--production]"
    echo "可用模块:"
    ls -d src/modules/*/ | xargs basename
    exit 1
fi

# 检查模块目录是否存在
if [ ! -d "$MODULE_DIR" ]; then
    log_error "模块目录不存在: $MODULE_DIR"
    exit 1
fi

log_info "开始构建模块: $MODULE_NAME"
log_info "构建模式: $BUILD_MODE"
log_info "模块目录: $MODULE_DIR"
log_info "输出目录: $BUILD_DIR"

# 清理旧构建
log_info "1. 清理旧构建..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 2. 运行测试
log_info "2. 运行模块测试..."
if ! ./scripts/modules/test-module.sh "$MODULE_NAME" > /dev/null 2>&1; then
    log_error "模块测试失败，构建中止"
    exit 1
fi
log_success "✓ 测试通过"

# 3. 构建TypeScript
log_info "3. 构建TypeScript..."

# 创建临时tsconfig
TEMP_TSCONFIG=".module-build/$MODULE_NAME/tsconfig.json"
mkdir -p "$(dirname "$TEMP_TSCONFIG")"

cat > "$TEMP_TSCONFIG" << EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../$BUILD_DIR",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": $([ "$BUILD_MODE" = "production" ] && echo "false" || echo "true"),
    "removeComments": $([ "$BUILD_MODE" = "production" ] && echo "true" || echo "false"),
    "noEmitOnError": true
  },
  "include": [
    "../../$MODULE_DIR/**/*"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
EOF

# 编译TypeScript
if npx tsc --project "$TEMP_TSCONFIG" 2>&1 | tee ".module-build/$MODULE_NAME/tsc-output.log"; then
    log_success "✓ TypeScript编译成功"
else
    log_error "TypeScript编译失败"
    exit 1
fi

# 4. 复制非TypeScript文件
log_info "4. 复制资源文件..."

# 复制CSS文件
if [ -d "$MODULE_DIR/styles" ]; then
    cp -r "$MODULE_DIR/styles" "$BUILD_DIR/"
    log_success "✓ 复制CSS文件"
fi

# 复制静态资源
if [ -d "$MODULE_DIR/assets" ]; then
    cp -r "$MODULE_DIR/assets" "$BUILD_DIR/"
    log_success "✓ 复制静态资源"
fi

# 复制配置文件
if [ -f "$MODULE_DIR/package.json" ]; then
    cp "$MODULE_DIR/package.json" "$BUILD_DIR/"
    log_success "✓ 复制package.json"
fi

if [ -f "$MODULE_DIR/README.md" ]; then
    cp "$MODULE_DIR/README.md" "$BUILD_DIR/"
    log_success "✓ 复制README.md"
fi

# 5. 优化生产构建
if [ "$BUILD_MODE" = "production" ]; then
    log_info "5. 生产环境优化..."
    
    # 压缩JavaScript文件
    if command -v terser > /dev/null 2>&1; then
        find "$BUILD_DIR" -name "*.js" ! -name "*.min.js" -exec terser {} -o {} -c passes=3 -m \;
        log_success "✓ JavaScript压缩完成"
    else
        log_warning "⚠ terser未安装，跳过JavaScript压缩"
    fi
    
    # 生成sourcemap（如果需要）
    # find "$BUILD_DIR" -name "*.js.map" -delete
fi

# 6. 生成构建报告
log_info "6. 生成构建报告..."

REPORT_FILE="$BUILD_DIR/build-report.json"

# 收集构建信息
BUILD_INFO=$(cat << EOF
{
  "module": "$MODULE_NAME",
  "buildMode": "$BUILD_MODE",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sourceDir": "$MODULE_DIR",
  "outputDir": "$BUILD_DIR",
  "files": {
    "typescript": $(find "$MODULE_DIR" -name "*.ts" -o -name "*.tsx" | wc -l),
    "javascript": $(find "$BUILD_DIR" -name "*.js" | wc -l),
    "declarations": $(find "$BUILD_DIR" -name "*.d.ts" | wc -l),
    "resources": $(find "$MODULE_DIR" \( -name "*.css" -o -name "*.json" -o -name "*.md" \) | wc -l)
  },
  "sizes": {
    "total": $(du -sb "$BUILD_DIR" | cut -f1),
    "javascript": $(find "$BUILD_DIR" -name "*.js" -exec du -sb {} + | awk '{sum+=$1} END {print sum}'),
    "types": $(find "$BUILD_DIR" -name "*.d.ts" -exec du -sb {} + | awk '{sum+=$1} END {print sum}')
  },
  "exports": {
    "default": $(grep -q "export default" "$MODULE_DIR/index.ts" && echo "true" || echo "false"),
    "named": $(grep -c "^export " "$MODULE_DIR/index.ts" || echo "0")
  }
}
EOF
)

echo "$BUILD_INFO" | jq . > "$REPORT_FILE"
log_success "✓ 构建报告已生成: $REPORT_FILE"

# 7. 生成package.json（如果需要）
if [ ! -f "$BUILD_DIR/package.json" ]; then
    log_info "7. 生成package.json..."
    
    MODULE_PACKAGE=$(cat << EOF
{
  "name": "@mission-control/$MODULE_NAME",
  "version": "1.0.0",
  "description": "Mission Control $MODULE_NAME module",
  "main": "index.js",
  "types": "index.d.ts",
  "files": [
    "**/*.js",
    "**/*.d.ts",
    "**/*.css",
    "**/*.json"
  ],
  "scripts": {
    "test": "jest",
    "build": "tsc",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "keywords": [
    "mission-control",
    "module",
    "$MODULE_NAME"
  ],
  "author": "Mission Control Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/mission-control.git"
  }
}
EOF
)
    
    echo "$MODULE_PACKAGE" | jq . > "$BUILD_DIR/package.json"
    log_success "✓ package.json已生成"
fi

# 8. 验证构建
log_info "8. 验证构建..."

# 检查主要文件是否存在
ESSENTIAL_FILES=(
    "index.js"
    "index.d.ts"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$BUILD_DIR/$file" ]; then
        log_success "✓ $file 存在"
    else
        log_error "❌ $file 不存在"
        exit 1
    fi
done

# 检查TypeScript声明
if npx tsc --noEmit --project "$TEMP_TSCONFIG" 2>&1 | grep -q "error"; then
    log_error "❌ TypeScript声明验证失败"
    exit 1
else
    log_success "✓ TypeScript声明验证通过"
fi

# 9. 清理临时文件
log_info "9. 清理临时文件..."
rm -rf ".module-build/$MODULE_NAME"

# 10. 输出摘要
log_success "模块构建完成: $MODULE_NAME"
echo ""
echo "📦 构建摘要:"
echo "  模式: $BUILD_MODE"
echo "  输出: $BUILD_DIR"
echo "  文件:"
echo "    - $(find "$BUILD_DIR" -name "*.js" | wc -l) 个JavaScript文件"
echo "    - $(find "$BUILD_DIR" -name "*.d.ts" | wc -l) 个类型声明文件"
echo "    - $(find "$BUILD_DIR" -name "*.css" | wc -l) 个CSS文件"
echo "  大小: $(du -sh "$BUILD_DIR" | cut -f1)"
echo ""
echo "🚀 模块已准备好发布或集成"

exit 0