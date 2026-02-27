/**
 * Set a user as admin by email.
 * Usage: npm run set-admin -- your@email.com
 *
 * Requires:
 * - DATABASE_URL in .env (or run with Railway: railway run node scripts/set-admin.js <email>)
 * - ALLOW_ADMIN_PROMOTION=true in .env for production safety (prevents accidental run)
 *
 * Logs the promotion to admin_promotions_log for audit.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query, pool } = require('../src/database/connection');

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run set-admin -- your@email.com');
  process.exit(1);
}

const allowPromotion = process.env.ALLOW_ADMIN_PROMOTION === 'true';

async function main() {
  if (!allowPromotion) {
    console.error('Admin promotion is disabled. Set ALLOW_ADMIN_PROMOTION=true in .env to allow.');
    console.error('This prevents accidental admin creation in production.');
    process.exit(1);
  }

  const result = await query(
    `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role`,
    [email.trim()]
  );

  if (result.rowCount === 0) {
    console.error('No user found with email:', email);
    console.error('Register that email in the app first, then run this again.');
    await pool.end();
    process.exit(1);
  }

  const row = result.rows[0];
  try {
    await query(
      `INSERT INTO admin_promotions_log (promoted_user_id, promoted_email, promoted_by) VALUES ($1, $2, $3)`,
      [row.id, row.email, 'script']
    );
  } catch (logErr) {
    console.warn('Warning: could not write to admin_promotions_log:', logErr.message);
    console.warn('Run migrations (npm run migrate) if the table is missing.');
  }

  await pool.end();
  console.log('Done. Admin set:', row.email);
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err.message || err);
  try {
    await pool.end();
  } catch (_) {}
  process.exit(1);
});
