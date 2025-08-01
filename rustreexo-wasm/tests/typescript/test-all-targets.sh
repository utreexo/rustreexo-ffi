#!/bin/bash

# Test all WASM targets with TypeScript reference tests
set -e

echo "🧪 Running TypeScript Reference Tests for all WASM targets"
echo "============================================================"

cd "$(dirname "$0")"
PROJECT_ROOT="../.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m' 
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests for a specific target
test_target() {
    local target=$1
    local pkg_dir=""
    
    case $target in
        "nodejs")
            pkg_dir="pkg-node"
            ;;
        "web"|"bundler")
            pkg_dir="pkg-$target"
            ;;
        *)
            echo -e "${RED}❌ Unknown target: $target${NC}"
            return 1
            ;;
    esac
    
    echo -e "${BLUE}🔧 Building WASM package for $target...${NC}"
    cd "$PROJECT_ROOT"
    wasm-pack build --target "$target" --out-dir "$pkg_dir" --release
    
    echo -e "${BLUE}🧪 Running tests for $target target...${NC}"
    cd tests/typescript
    WASM_TARGET="$target" npm test
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tests passed for $target target${NC}"
        return 0
    else
        echo -e "${RED}❌ Tests failed for $target target${NC}"
        return 1
    fi
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Test targets
TARGETS=("nodejs" "web" "bundler")
FAILED_TARGETS=()

for target in "${TARGETS[@]}"; do
    echo ""
    echo -e "${YELLOW}===============================================${NC}"
    echo -e "${YELLOW}Testing WASM target: $target${NC}"
    echo -e "${YELLOW}===============================================${NC}"
    
    if ! test_target "$target"; then
        FAILED_TARGETS+=("$target")
    fi
done

# Summary
echo ""
echo -e "${YELLOW}===============================================${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}===============================================${NC}"

if [ ${#FAILED_TARGETS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All WASM targets passed tests!${NC}"
    exit 0
else
    echo -e "${RED}❌ Failed targets: ${FAILED_TARGETS[*]}${NC}"
    exit 1
fi