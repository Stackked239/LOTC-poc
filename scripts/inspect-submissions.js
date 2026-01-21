#!/usr/bin/env node

/**
 * Script to inspect the submissions table schema and data
 * Run with: node scripts/inspect-submissions.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('URL:', supabaseUrl ? '✓' : '✗')
  console.error('Key:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSubmissions() {
  console.log('🔍 Inspecting submissions table...\n')

  // First, get the schema using a SQL query
  const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'submissions'
      ORDER BY
        ordinal_position;
    `
  })

  // Try direct query if RPC doesn't work
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Error fetching submissions:', error)
    console.log('\n💡 If the table exists, check RLS policies in Supabase dashboard')
    console.log('   Table Editor → submissions → Policies')
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No submissions found in table (table is empty or RLS is blocking)')
    console.log('\n💡 To get the schema, run this SQL in Supabase SQL Editor:')
    console.log('─'.repeat(80))
    console.log(`
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name = 'submissions'
ORDER BY
  ordinal_position;
    `)
    console.log('─'.repeat(80))
    return
  }

  console.log(`✅ Found ${data.length} submission(s)\n`)

  // Show the schema from the first row
  const firstRow = data[0]
  console.log('📋 TABLE SCHEMA (from first row):')
  console.log('═'.repeat(80))

  Object.keys(firstRow).forEach(key => {
    const value = firstRow[key]
    const type = value === null ? 'null' : typeof value
    const sample = value === null ? 'null' : JSON.stringify(value).substring(0, 50)

    console.log(`${key.padEnd(30)} | ${type.padEnd(10)} | ${sample}`)
  })

  console.log('═'.repeat(80))
  console.log('\n📝 COLUMN NAMES (comma-separated):')
  console.log(Object.keys(firstRow).join(', '))

  console.log('\n\n📄 SAMPLE DATA (first row):')
  console.log(JSON.stringify(firstRow, null, 2))

  console.log('\n\n📊 ALL SUBMISSIONS:')
  data.forEach((row, index) => {
    console.log(`\n[${index + 1}] ${row.child_first_name || row.first_name || row.name || 'No name'} - Status: ${row.status || 'unknown'}`)
  })

  // Get total count
  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  if (!countError) {
    console.log(`\n📈 TOTAL SUBMISSIONS IN TABLE: ${count}`)
  }
}

inspectSubmissions()
  .then(() => {
    console.log('\n✅ Inspection complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
