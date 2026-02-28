const app = require('./app');
const config = require('./config');
const { pool } = require('./database/connection');

async function connectDatabase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      const code = err.code || '';
      const msg = err.message || String(err);
      if (i < retries - 1) {
        console.warn(`Database connection attempt ${i + 1}/${retries} failed (${code || msg}). Retrying in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.error('Database connection failed. Ensure PostgreSQL is running and DATABASE_URL is correct.');
        console.error('Error:', code || msg);
        if (code === 'ECONNREFUSED') {
          console.error('Tip: Start PostgreSQL (e.g. brew services start postgresql) and ensure the database exists.');
        }
        process.exit(1);
      }
    }
  }
}

async function start() {
  const port = config.port;
  const host = process.env.HOST || '0.0.0.0';

  // Bind to port first so Railway/proxy gets a response quickly (avoids 502 on slow DB connect)
  app.listen(port, host, async () => {
    console.log(`Mindful Kids API listening on ${host}:${port} (${config.env})`);
    await connectDatabase();
    console.log('Database connected.');
  });
}

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
