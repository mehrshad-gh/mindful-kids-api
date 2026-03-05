const ProfessionalReport = require('../models/ProfessionalReport');
const Psychologist = require('../models/Psychologist');
const { detectSafetyRisk, buildSafetyResponse } = require('../utils/safetyText');
const SafetyEscalation = require('../models/SafetyEscalation');

const ALLOWED_REASONS = ['misconduct', 'inaccurate_info', 'inappropriate_behavior', 'other'];

async function reportProfessional(req, res, next) {
  try {
    const { psychologist_id: psychologistId, reason, details } = req.body;
    if (!psychologistId) {
      return res.status(400).json({ error: 'psychologist_id is required' });
    }
    const normalizedReason = (reason && String(reason).trim()) || 'other';
    if (!ALLOWED_REASONS.includes(normalizedReason)) {
      return res.status(400).json({
        error: `reason must be one of: ${ALLOWED_REASONS.join(', ')}`,
      });
    }
    // Safety guardrail: check free-text details; do not persist or log raw high-risk text
    const detailsText = details != null ? String(details) : '';
    const safety = detectSafetyRisk(detailsText);
    if (safety.flagged) {
      await SafetyEscalation.insert({
        userId: req.user.id,
        route: '/reports/professional',
        field: 'details',
        matches: safety.matches,
      });
      return res.status(422).json({
        ...buildSafetyResponse(),
        field: 'details',
      });
    }
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    const report = await ProfessionalReport.create({
      reporterId: req.user.id,
      psychologistId,
      reason: normalizedReason,
      details: details ? String(details).trim() : null,
    });
    res.status(201).json({
      message: 'Report submitted. Our team will review it.',
      report: {
        id: report.id,
        psychologist_id: report.psychologist_id,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  reportProfessional,
};
