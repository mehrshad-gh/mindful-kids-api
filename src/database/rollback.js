const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function getAppliedMigrations() {
  const result = await pool.query(
    `SELECT name FROM schema_migrations ORDER BY applied_at DESC`
  );
  return result.rows.map((r) => r.name);
}

async function rollback() {
  const client = await pool.connect();
  try {
    const applied = await getAppliedMigrations();
    const last = applied[0];
    if (!last) {
      console.log('No migrations to rollback.');
      return;
    }
    const rollbackFile = path.join(MIGRATIONS_DIR, `${last}.rollback.sql`);
    if (!fs.existsSync(rollbackFile)) {
      console.log(`No rollback file for: ${last}. Create ${last}.rollback.sql to enable rollback.`);
      return;
    }
    const sql = fs.readFileSync(rollbackFile, 'utf8');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [last]);
    console.log(`Rolled back: ${last}`);
  } finally {
    client.release();
    await pool.end();
  }
}

rollback().catch((err) => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
