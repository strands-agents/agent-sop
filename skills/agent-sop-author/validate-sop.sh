#!/bin/bash
set -euo pipefail

# Validate Agent SOP structure
# Usage: validate-sop.sh <path-to-sop.md>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-sop.md>"
    exit 1
fi

SOP_FILE="$1"
ERRORS=0
WARNINGS=0

if [ ! -f "$SOP_FILE" ]; then
    echo "❌ File not found: $SOP_FILE"
    exit 1
fi

echo "Validating: $SOP_FILE"
echo ""

# Check file extension
if [[ ! "$SOP_FILE" =~ \.sop\.md$ ]]; then
    echo "❌ File must use .sop.md extension"
    ((ERRORS++))
fi

# Check required sections
check_section() {
    local section="$1"
    local pattern="$2"
    if ! grep -q "$pattern" "$SOP_FILE"; then
        echo "❌ Missing required section: $section"
        ((ERRORS++))
        return 1
    fi
    echo "✅ Section present: $section"
    return 0
}

check_section "Title (H1)" "^# "
check_section "Overview" "^## Overview"
check_section "Parameters" "^## Parameters"
check_section "Steps" "^## Steps"

# Check Parameters section has constraints
if grep -q "^## Parameters" "$SOP_FILE"; then
    if ! grep -A 20 "^## Parameters" "$SOP_FILE" | grep -q "Constraints for parameter acquisition"; then
        echo "❌ Parameters section missing 'Constraints for parameter acquisition'"
        ((ERRORS++))
    else
        echo "✅ Parameter constraints present"
    fi

    # Check for blank line after Parameters heading
    if ! grep -A 1 "^## Parameters$" "$SOP_FILE" | tail -1 | grep -q "^$"; then
        echo "❌ Parameters section must have blank line after heading"
        ((ERRORS++))
    else
        echo "✅ Blank line after Parameters heading"
    fi
fi

# Check for numbered steps
if ! grep -q "^### [0-9]\+\." "$SOP_FILE"; then
    echo "❌ No numbered steps found (format: ### 1. Step Name)"
    ((ERRORS++))
else
    echo "✅ Numbered steps present"
fi

# Check for Constraints sections in steps
if ! grep -q "^\*\*Constraints:\*\*" "$SOP_FILE"; then
    echo "❌ No Constraints sections found in steps"
    ((ERRORS++))
else
    echo "✅ Constraints sections present"
fi

# Check for RFC 2119 keywords
if ! grep -qE "You (MUST|SHOULD|MAY)" "$SOP_FILE"; then
    echo "⚠️  No RFC 2119 keywords found (MUST, SHOULD, MAY)"
    ((WARNINGS++))
else
    echo "✅ RFC 2119 keywords present"
fi

# Check for negative constraints without context
if grep -E "You (MUST NOT|SHOULD NOT)" "$SOP_FILE" | grep -v "because\|since\|as\|to avoid" > /dev/null 2>&1; then
    echo "⚠️  Negative constraints found without context (add 'because', 'since', etc.)"
    ((WARNINGS++))
fi

# Recommend Examples and Troubleshooting
if ! grep -q "^## Examples" "$SOP_FILE"; then
    echo "⚠️  Recommended section missing: Examples"
    ((WARNINGS++))
fi

if ! grep -q "^## Troubleshooting" "$SOP_FILE"; then
    echo "⚠️  Recommended section missing: Troubleshooting"
    ((WARNINGS++))
fi

echo ""
echo "Validation complete:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

[ $ERRORS -eq 0 ] && exit 0 || exit 1
