/**
 * Safety escalation guardrail: detect high-risk crisis keywords in user-submitted text.
 * We do NOT provide therapy or crisis intervention; we gate and direct to emergency/crisis resources.
 * No ML, no external APIs. For MVP we only trigger on HIGH_CONFIDENCE phrases to reduce false positives.
 * Single-word triggers like "gun" / "knife" are not used (would require "kill" or "hurt" context).
 */

/** MVP: only these phrases trigger; single-word "gun"/"knife" and abuse/molest/rape omitted to reduce false positives. */
const HIGH_CONFIDENCE = [
  'suicide',
  'kill myself',
  'self harm',
  'self-harm',
  'hurt myself',
  'end my life',
  'overdose',
  "can't go on",
  'hurt someone',
  'kill someone',
];

/**
 * Normalize text for matching: lowercase, collapse repeated whitespace.
 * @param {string} text - Raw input (may be null/undefined)
 * @returns {string}
 */
function normalizeText(text) {
  if (text == null || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if text contains high-risk crisis keywords. MVP: only HIGH_CONFIDENCE phrases trigger.
 * @param {string} text - User-submitted text
 * @returns {{ flagged: boolean, matches: string[] }}
 */
function detectSafetyRisk(text) {
  const normalized = normalizeText(text);
  if (!normalized) return { flagged: false, matches: [] };
  const matches = HIGH_CONFIDENCE.filter((keyword) => normalized.includes(keyword));
  return {
    flagged: matches.length > 0,
    matches,
  };
}

/**
 * Standard response body for safety escalation (422).
 * Non-clinical, non-therapeutic; directs to emergency/crisis resources.
 */
function buildSafetyResponse() {
  return {
    code: 'SAFETY_ESCALATION',
    message:
      "If you or someone else is in immediate danger, call local emergency services. This app is not for emergencies. If you're worried about safety, contact a qualified professional or a local crisis hotline.",
  };
}

module.exports = {
  detectSafetyRisk,
  buildSafetyResponse,
};
