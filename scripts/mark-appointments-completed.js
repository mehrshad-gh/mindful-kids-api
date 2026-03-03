/**
 * Mark appointments as "completed" when their end time has passed.
 * Run periodically (e.g. cron every 15 min): node scripts/mark-appointments-completed.js
 *
 * Updates: status = 'completed' where status = 'confirmed' AND ends_at_utc < NOW().
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query, pool } = require('../src/database/connection');

async function main() {
  const result = await query(
    `UPDATE appointments
     SET status = 'completed', updated_at = NOW()
     WHERE status = 'confirmed' AND ends_at_utc < NOW()
     RETURNING id`
  );
  const count = result.rowCount ?? 0;
  if (count > 0) {
    console.log(`Marked ${count} appointment(s) as completed.`);
  } else {
    console.log('No appointments to mark as completed.');
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
