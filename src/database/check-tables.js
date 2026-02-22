const fs = require('fs');
const path = require('path');

// Load .env from project root (where package.json is)
const pathToRoot = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(pathToRoot, '.env') });

const { pool } = require('./connection');

async function check() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected.\n');

    const migrations = await pool.query(
      'SELECT name, applied_at FROM schema_migrations ORDER BY applied_at ASC'
    );
    console.log('Applied migrations:');
    if (migrations.rows.length === 0) {
      console.log('  (none)');
    } else {
      migrations.rows.forEach((r) => console.log(`  - ${r.name} (${r.applied_at})`));
    }

    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    console.log('\nTables in public schema:');
    if (tables.rows.length === 0) {
      console.log('  (none)');
    } else {
      tables.rows.forEach((r) => console.log(`  - ${r.table_name}`));
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

check();
