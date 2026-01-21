#!/bin/bash

echo "==================================="
echo "LOTC Intake Form - Environment Check"
echo "==================================="
echo ""

# Check .env file
echo "✓ Checking .env file..."
if [ -f .env ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env; then
        echo "  ✅ Environment variables configured"
        SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env | cut -d'=' -f2)
        echo "  📍 Supabase Project: ${SUPABASE_URL}"
    else
        echo "  ❌ Missing required environment variables"
        exit 1
    fi
else
    echo "  ❌ .env file not found"
    exit 1
fi

echo ""

# Check dev server
echo "✓ Checking dev server..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  ✅ Dev server running on port 3000"
    echo "  🌐 URL: http://localhost:3000"
elif lsof -i :3001 > /dev/null 2>&1; then
    echo "  ✅ Dev server running on port 3001"
    echo "  🌐 URL: http://localhost:3001"
else
    echo "  ⚠️  Dev server not running"
    echo "  💡 Run: npm run dev"
fi

echo ""

# Check migration files
echo "✓ Checking migration files..."
if [ -f "supabase/migrations/004_fix_rls_policies.sql" ]; then
    echo "  ✅ RLS fix migration file exists"
else
    echo "  ⚠️  RLS fix migration file not found"
fi

if [ -f "apply-intake-fix.sql" ]; then
    echo "  ✅ Quick fix SQL file exists"
else
    echo "  ❌ Quick fix SQL file not found"
fi

echo ""

# Check if Supabase CLI is installed
echo "✓ Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "  ✅ Supabase CLI installed"
    echo "  📦 Version: $(supabase --version)"
else
    echo "  ⚠️  Supabase CLI not installed"
fi

echo ""
echo "==================================="
echo "NEXT STEPS:"
echo "==================================="
echo ""
echo "1. 🔧 Apply the SQL fix:"
echo "   - Open: https://supabase.com/dashboard/project/yzomcvqfdrqhmcuribhv/sql"
echo "   - Copy contents of: apply-intake-fix.sql"
echo "   - Paste and run in SQL Editor"
echo ""
echo "2. 🧪 Test the intake form:"
echo "   - Navigate to: http://localhost:3000/intake"
echo "   - Follow test cases in: TEST_PLAN.md"
echo ""
echo "3. ✅ Verify in dashboard:"
echo "   - Check: http://localhost:3000"
echo "   - Look for updated inventory levels"
echo ""
