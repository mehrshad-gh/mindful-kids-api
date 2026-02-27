const ProfessionalReport = require('../models/ProfessionalReport');
const AdminAuditLog = require('../models/AdminAuditLog');

const ALLOWED_ACTION_TAKEN = ['none', 'warning', 'temporary_suspension', 'verification_revoked'];
const ALLOWED_STATUS = ['open', 'under_review', 'resolved', 'dismissed'];

async function list(req, res, next) {
  try {
    const { status, limit } = req.query;
    const reports = await ProfessionalReport.findAllForAdmin({
      status: status && ALLOWED_STATUS.includes(status) ? status : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const report = await ProfessionalReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { status, action_taken } = req.body;
    const report = await ProfessionalReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const data = {};
    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUS.join(', ')}` });
      }
      data.status = status;
    }
    if (action_taken !== undefined) {
      if (!ALLOWED_ACTION_TAKEN.includes(action_taken)) {
        return res.status(400).json({ error: `action_taken must be one of: ${ALLOWED_ACTION_TAKEN.join(', ')}` });
      }
      data.action_taken = action_taken;
    }
    if (Object.keys(data).length === 0) {
      return res.json({ report });
    }
    const updated = await ProfessionalReport.update(req.params.id, data);

    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'report_action_taken',
      targetType: 'professional_report',
      targetId: req.params.id,
      details: { status: data.status, action_taken: data.action_taken, psychologist_id: report.psychologist_id },
    });

    res.json({
      message: 'Report updated. Psychologist verification status was updated if action_taken required it.',
      report: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  update,
};
