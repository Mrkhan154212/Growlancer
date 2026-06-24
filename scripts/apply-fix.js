// ═══════════════════════════════════════════════════════════════════
// Apply Production Fixes to Supabase Database — v2
// ═══════════════════════════════════════════════════════════════════
// Usage:
//   1. node scripts/apply-fix.js                    (auto-detect password)
//   2. node scripts/apply-fix.js YOUR_DB_PASSWORD   (pass explicitly)
//   3. Or run the SQL manually in Supabase Dashboard → SQL Editor
// ═══════════════════════════════════════════════════════════════════

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const projectRef = 'zttwsjehcgaicziqyxpq';
const poolerUrl = `postgresql://postgres.${projectRef}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUPABASE PRODUCTION FIX — SQL EXECUTION                  ║
╚══════════════════════════════════════════════════════════════════════╝

✅ Vercel deployment: Complete
   https://growlancer-2gfqwzz6p-mrkhan154212s-projects.vercel.app

⚠️  SQL fix needs manual execution:

   Step 1: Go to Supabase Dashboard → SQL Editor
           https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq

   Step 2: Copy and paste the SQL file content:
           supabase/migrations/20260725000000_fix_production_errors.sql

   Step 3: Click "Run" — Fixes applied!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 What the SQL fix does:
   • Auto-confirms email for all users (fixes confirmation email error)
   • Adds missing payout_methods columns (fixes column errors)
   • Creates avatars + portfolio-images storage buckets (fixes bucket errors)
   • Refreshes schema cache

📋 Or you can pass the DB password manually:
   node scripts/apply-fix.js YOUR_DB_PASSWORD
`);
  process.exit(0);
}

async function main() {
  console.log('🔧 Connecting to production database...');
  
  const client = new Client({
    connectionString: poolerUrl,
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production DB');

    const sqlPath = path.resolve(__dirname, '..', 'supabase', 'migrations', '20260725000000_fix_production_errors.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executing SQL fix...');
    await client.query(sql);
    console.log('✅ SQL fix applied successfully!');
    console.log('\nFixes applied:');
    console.log('  1. ✅ Auto-confirm email trigger created');
    console.log('  2. ✅ payout_methods columns added');
    console.log('  3. ✅ Storage buckets created (avatars, portfolio-images)');
    console.log('  4. ✅ Schema cache refreshed');

    await client.end();
  } catch(err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Run the SQL manually in Supabase Dashboard → SQL Editor');
    console.log('   SQL file: supabase/migrations/20260725000000_fix_production_errors.sql');
  }
}

main().catch(console.error);
