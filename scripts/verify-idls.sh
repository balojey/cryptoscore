#!/bin/bash

# IDL Verification Script
# Verifies that all IDL files are in sync between build output and frontend

set -e

echo "🔍 CryptoScore IDL Verification"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
BUILD_DIR="target/idl"
FRONTEND_DIR="app/src/idl"

# Programs to check
PROGRAMS=("cryptoscore_factory" "cryptoscore_market" "cryptoscore_dashboard")

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build directory not found: $BUILD_DIR${NC}"
    echo "   Run 'anchor build' first"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend IDL directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

echo "📁 Checking IDL files..."
echo ""

ALL_SYNCED=true

for program in "${PROGRAMS[@]}"; do
    BUILD_FILE="$BUILD_DIR/${program}.json"
    FRONTEND_FILE="$FRONTEND_DIR/${program}.json"
    
    echo "🔹 $program"
    
    # Check if build file exists
    if [ ! -f "$BUILD_FILE" ]; then
        echo -e "   ${RED}❌ Build IDL not found${NC}"
        ALL_SYNCED=false
        continue
    fi
    
    # Check if frontend file exists
    if [ ! -f "$FRONTEND_FILE" ]; then
        echo -e "   ${RED}❌ Frontend IDL not found${NC}"
        ALL_SYNCED=false
        continue
    fi
    
    # Check if files are identical
    if diff -q "$BUILD_FILE" "$FRONTEND_FILE" > /dev/null 2>&1; then
        BUILD_CHECKSUM=$(md5sum "$BUILD_FILE" | awk '{print $1}')
        BUILD_LINES=$(wc -l < "$BUILD_FILE")
        echo -e "   ${GREEN}✅ Synced${NC}"
        echo "   Checksum: $BUILD_CHECKSUM"
        echo "   Lines: $BUILD_LINES"
    else
        echo -e "   ${RED}❌ Out of sync${NC}"
        echo "   Build:    $(md5sum "$BUILD_FILE" | awk '{print $1}')"
        echo "   Frontend: $(md5sum "$FRONTEND_FILE" | awk '{print $1}')"
        ALL_SYNCED=false
    fi
    
    # Validate JSON
    if python3 -m json.tool "$BUILD_FILE" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Valid JSON${NC}"
    else
        echo -e "   ${RED}❌ Invalid JSON${NC}"
        ALL_SYNCED=false
    fi
    
    echo ""
done

echo "================================"

if [ "$ALL_SYNCED" = true ]; then
    echo -e "${GREEN}✅ All IDL files are in sync!${NC}"
    echo ""
    echo "📝 Summary:"
    echo "   - All 3 programs verified"
    echo "   - Build and frontend IDLs match"
    echo "   - All JSON files are valid"
    exit 0
else
    echo -e "${RED}❌ Some IDL files are out of sync${NC}"
    echo ""
    echo "🔧 To fix:"
    echo "   1. Rebuild programs: anchor build"
    echo "   2. Copy IDLs: cp target/idl/*.json app/src/idl/"
    echo "   3. Or run: npm run idl:export"
    exit 1
fi
