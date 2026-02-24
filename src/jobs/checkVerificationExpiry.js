/**
 * Re-verification check: find expiring credentials and psychologist verification_expires_at.
 * Run via cron (e.g. daily): node src/jobs/checkVerificationExpiry.js
 * To auto-expire: node src/jobs/checkVerificationExpiry.js --apply
 */
require('dotenv').config();
const { query } = require('../database/connection');

const APPLY = process.argv.includes('--apply');
const WARN_DAYS = 30;

async function run() {
  const expiring = [];
  const expired = [];

  // Psychologists with verification_expires_at in the past (still verified)
  const psychologistsExpired = await query(
    `SELECT id, name, verification_expires_at, verification_status
     FROM psychologists
     WHERE verification_status = 'verified' AND verification_expires_at IS NOT NULL AND verification_expires_at < NOW()`
  );
  for (const row of psychologistsExpired.rows) {
    expired.push({ type: 'psychologist', id: row.id, name: row.name, at: row.verification_expires_at });
  }

  // Psychologists with verification_expires_at within WARN_DAYS
  const psychologistsExpiring = await query(
    `SELECT id, name, verification_expires_at
     FROM psychologists
     WHERE verification_status = 'verified' AND verification_expires_at IS NOT NULL
       AND verification_expires_at > NOW() AND verification_expires_at < NOW() + INTERVAL '1 day' * $1`,
    [WARN_DAYS]
  );
  for (const row of psychologistsExpiring.rows) {
    expiring.push({ type: 'psychologist', id: row.id, name: row.name, at: row.verification_expires_at });
  }

  // Credentials with expires_at in the past
  const credsExpired = await query(
    `SELECT pc.id, pc.psychologist_id, p.name as psychologist_name, pc.credential_type, pc.issuing_country, pc.expires_at
     FROM professional_credentials pc
     JOIN psychologists p ON p.id = pc.psychologist_id
     WHERE pc.expires_at IS NOT NULL AND pc.expires_at < NOW() AND pc.verification_status = 'verified'`
  );
  for (const row of credsExpired.rows) {
    expired.push({
      type: 'credential',
      id: row.id,
      psychologist_id: row.psychologist_id,
      psychologist_name: row.psychologist_name,
      credential_type: row.credential_type,
      issuing_country: row.issuing_country,
      at: row.expires_at,
    });
  }

  // Credentials expiring within WARN_DAYS
  const credsExpiring = await query(
    `SELECT pc.id, pc.psychologist_id, p.name as psychologist_name, pc.credential_type, pc.expires_at
     FROM professional_credentials pc
     JOIN psychologists p ON p.id = pc.psychologist_id
     WHERE pc.expires_at IS NOT NULL AND pc.expires_at > NOW()
       AND pc.expires_at < NOW() + INTERVAL '1 day' * $1 AND pc.verification_status = 'verified'`,
    [WARN_DAYS]
  );
  for (const row of credsExpiring.rows) {
    expiring.push({
      type: 'credential',
      id: row.id,
      psychologist_id: row.psychologist_id,
      psychologist_name: row.psychologist_name,
      credential_type: row.credential_type,
      at: row.expires_at,
    });
  }

  console.log(JSON.stringify({ expiring, expired }, null, 2));

  if (APPLY && psychologistsExpired.rows.length > 0) {
    for (const row of psychologistsExpired.rows) {
      await query(
        `UPDATE psychologists SET verification_status = 'expired', updated_at = NOW() WHERE id = $1`,
        [row.id]
      );
      console.error(`Expired psychologist: ${row.id} ${row.name}`);
    }
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
