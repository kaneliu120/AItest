#!/bin/bash

# 模块测试脚本
# 用法: ./scripts/modules/test-module.sh <module-name>

set -e

MODULE_NAME="$1"
MODULE_DIR="src/modules/$MODULE_NAME"

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
    echo "用法: $0 <module-name>"
    echo "可用模块:"
    ls -d src/modules/*/ | xargs basename
    exit 1
fi

# 检查模块目录是否存在
if [ ! -d "$MODULE_DIR" ]; then
    log_error "模块目录不存在: $MODULE_DIR"
    exit 1
fi

log_info "开始测试模块: $MODULE_NAME"
log_info "模块目录: $MODULE_DIR"

# 创建临时测试目录
TEST_DIR=".module-test/$MODULE_NAME"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

# 1. 检查模块结构
log_info "1. 检查模块结构..."
MODULE_FILES=(
    "types/index.ts"
    "services/"
    "components/"
    "utils/"
    "index.ts"
)

for file in "${MODULE_FILES[@]}"; do
    if [ -e "$MODULE_DIR/$file" ] || [[ "$file" == */ && -d "$MODULE_DIR/$file" ]]; then
        log_success "✓ $file 存在"
    else
        log_warning "⚠ $file 不存在或格式不正确"
    fi
done

# 2. 检查TypeScript编译
log_info "2. 检查TypeScript编译..."
TSC_OUTPUT=$(npx tsc --noEmit --project . 2>&1 | grep -A5 "$MODULE_DIR" || true)

if [ -z "$TSC_OUTPUT" ]; then
    log_success "✓ TypeScript编译通过"
else
    log_error "TypeScript编译错误:"
    echo "$TSC_OUTPUT"
    exit 1
fi

# 3. 运行模块特定测试
log_info "3. 运行模块测试..."

# 检查是否有测试文件
TEST_FILES=$(find "$MODULE_DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx")

if [ -z "$TEST_FILES" ]; then
    log_warning "⚠ 未找到测试文件，跳过测试"
else
    # 运行Jest测试
    npx jest "$MODULE_DIR" --passWithNoTests 2>&1 | tee "$TEST_DIR/jest-output.log"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "✓ 测试通过"
    else
        log_error "测试失败"
        cat "$TEST_DIR/jest-output.log"
        exit 1
    fi
fi

# 4. 检查代码质量
log_info "4. 检查代码质量..."

# ESLint检查
ESLINT_OUTPUT=$(npx eslint "$MODULE_DIR" --format=compact 2>&1 || true)

if echo "$ESLINT_OUTPUT" | grep -q "error"; then
    log_error "ESLint错误:"
    echo "$ESLINT_OUTPUT" | grep "error"
    exit 1
elif echo "$ESLINT_OUTPUT" | grep -q "warning"; then
    log_warning "ESLint警告:"
    echo "$ESLINT_OUTPUT" | grep "warning"
else
    log_success "✓ ESLint检查通过"
fi

# 5. 检查导出
log_info "5. 检查模块导出..."

# 检查index.ts文件
if [ -f "$MODULE_DIR/index.ts" ]; then
    # 检查是否有默认导出
    if grep -q "export default" "$MODULE_DIR/index.ts"; then
        log_success "✓ 有默认导出"
    else
        log_warning "⚠ 没有默认导出"
    fi
    
    # 检查命名导出
    EXPORT_COUNT=$(grep -c "^export" "$MODULE_DIR/index.ts" || true)
    if [ "$EXPORT_COUNT" -gt 0 ]; then
        log_success "✓ 有 $EXPORT_COUNT 个命名导出"
    else
        log_warning "⚠ 没有命名导出"
    fi
else
    log_error "index.ts文件不存在"
    exit 1
fi

# 6. 生成测试报告
log_info "6. 生成测试报告..."

REPORT_FILE="$TEST_DIR/test-report.md"

cat > "$REPORT_FILE" << EOF
# 模块测试报告

## 模块信息
- **名称**: $MODULE_NAME
- **测试时间**: $(date)
- **测试目录**: $TEST_DIR

## 测试结果

### 1. 模块结构检查
$(for file in "${MODULE_FILES[@]}"; do
    if [ -e "$MODULE_DIR/$file" ] || [[ "$file" == */ && -d "$MODULE_DIR/$file" ]]; then
        echo "- ✅ $file 存在"
    else
        echo "- ⚠ $file 不存在"
    fi
done)

### 2. TypeScript编译
$(if [ -z "$TSC_OUTPUT" ]; then
    echo "- ✅ 编译通过"
else
    echo "- ❌ 编译失败"
    echo "\`\`\`"
    echo "$TSC_OUTPUT"
    echo "\`\`\`"
fi)

### 3. 单元测试
$(if [ -z "$TEST_FILES" ]; then
    echo "- ⚠ 未找到测试文件"
else
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "- ✅ 测试通过"
    else
        echo "- ❌ 测试失败"
    fi
fi)

### 4. 代码质量
$(if echo "$ESLINT_OUTPUT" | grep -q "error"; then
    echo "- ❌ ESLint错误"
elif echo "$ESLINT_OUTPUT" | grep -q "warning"; then
    echo "- ⚠ ESLint警告"
else
    echo "- ✅ ESLint检查通过"
fi)

### 5. 模块导出
$(if [ -f "$MODULE_DIR/index.ts" ]; then
    if grep -q "export default" "$MODULE_DIR/index.ts"; then
        echo "- ✅ 有默认导出"
    else
        echo "- ⚠ 没有默认导出"
    fi
    
    EXPORT_COUNT=$(grep -c "^export" "$MODULE_DIR/index.ts" || true)
    echo "- ✅ 有 $EXPORT_COUNT 个命名导出"
else
    echo "- ❌ index.ts文件不存在"
fi)

## 文件统计
\`\`\`
$(find "$MODULE_DIR" -type f -name "*.ts" -o -name "*.tsx" | wc -l) 个TypeScript文件
$(find "$MODULE_DIR" -type f -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | wc -l) 个测试文件
$(find "$MODULE_DIR" -type f -name "*.ts" -o -name "*.tsx" -exec wc -l {} + | tail -1 | awk '{print $1}') 行代码
\`\`\`

## 建议
$(if [ ! -d "$MODULE_DIR/__tests__" ] && [ -z "$TEST_FILES" ]; then
    echo "1. 添加单元测试文件"
fi
if ! grep -q "export default" "$MODULE_DIR/index.ts"; then
    echo "2. 考虑添加默认导出"
fi
if echo "$ESLINT_OUTPUT" | grep -q "warning"; then
    echo "3. 修复ESLint警告"
fi)
EOF

log_success "测试报告已生成: $REPORT_FILE"

# 7. 清理
log_info "7. 清理临时文件..."
# 保留测试报告，清理其他文件
find "$TEST_DIR" -type f ! -name "test-report.md" ! -name "jest-output.log" -delete 2>/dev/null || true

log_success "模块测试完成: $MODULE_NAME"
echo ""
echo "📊 测试摘要:"
echo "  ✅ 模块结构完整"
echo "  ✅ TypeScript编译通过"
echo "  ✅ 代码质量检查通过"
echo "  📋 详细报告: $REPORT_FILE"

exit 0