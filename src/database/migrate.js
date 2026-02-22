const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function getAppliedMigrations() {
  const result = await pool.query(
    `SELECT name FROM schema_migrations ORDER BY applied_at ASC`
  );
  return result.rows.map((r) => r.name);
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const applied = await getAppliedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const name = path.basename(file, '.sql');
      if (applied.includes(name)) {
        console.log(`Skip (already applied): ${name}`);
        continue;
      }
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      console.log(`Applied: ${name}`);
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
