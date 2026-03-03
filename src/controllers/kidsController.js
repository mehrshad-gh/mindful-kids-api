const Child = require('../models/Child');
const KidToolSession = require('../models/KidToolSession');
const Activity = require('../models/Activity');
const Progress = require('../models/Progress');

const DOMAIN_IDS = ['emotional_awareness', 'self_regulation', 'problem_solving', 'social_connection', 'resilience'];

/** tool_type (slug) values accepted for /kids/tools; must resolve to allowed domain. */
const TOOL_TYPE_SLUGS = [
  'calm-breathing-dbt', 'grounding_54321', 'calm_body_reset', 'pause_and_choose',
  'emotion-wheel', 'emotion-identification-cbt', 'emotion_match_game', 'body_signals_map', 'feeling_intensity_check',
  'problem_ladder', 'fix_it_plan', 'try_again_tool',
];

const TOOL_ALLOWED_DOMAINS = ['self_regulation', 'emotional_awareness', 'problem_solving'];

function normalizeToolType(toolType) {
  if (toolType === 'breathing') return 'calm-breathing-dbt';
  return toolType;
}

/** GET /kids/domain-progress?child_id= – domain progress for a child (parent auth). */
async function getDomainProgress(req, res, next) {
  try {
    const child_id = req.query.child_id;
    if (!child_id) {
      return res.status(400).json({ error: 'child_id query is required' });
    }
    const child = await Child.findById(child_id, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const rows = await KidToolSession.getDomainProgressByChildId(child_id);
    const byDomain = {};
    for (const r of rows) {
      byDomain[r.domain_id] = {
        domain_id: r.domain_id,
        sessions_completed: Number(r.sessions_completed) || 0,
        total_stars: Number(r.total_stars) || 0,
        last_practiced_at: r.last_practiced_at || null,
      };
    }
    const domains = DOMAIN_IDS.map((id) => ({
      domain_id: id,
      sessions_completed: byDomain[id]?.sessions_completed ?? 0,
      total_stars: byDomain[id]?.total_stars ?? 0,
      last_practiced_at: byDomain[id]?.last_practiced_at ?? null,
    }));
    res.json({ domains });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /kids/tools/start — validate child and resolve tool_type to activity. Returns activity_id for client.
 */
async function toolsStart(req, res, next) {
  try {
    const { child_id: childId, tool_type: toolType } = req.body;
    if (!childId || !toolType) {
      return res.status(400).json({ error: 'child_id and tool_type are required' });
    }
    const child = await Child.findById(childId, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const slug = normalizeToolType(toolType);
    if (!TOOL_TYPE_SLUGS.includes(slug)) {
      return res.status(400).json({
        error: 'Invalid tool_type. Use one of: breathing, grounding_54321, calm_body_reset, pause_and_choose, emotion_match_game, body_signals_map, feeling_intensity_check, emotion-wheel, emotion-identification-cbt, problem_ladder, fix_it_plan, try_again_tool',
      });
    }
    const activity = await Activity.findBySlug(slug);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found for this tool' });
    }
    if (!TOOL_ALLOWED_DOMAINS.includes(activity.domain_id)) {
      return res.status(400).json({ error: 'This tool is not available for the tools API' });
    }
    res.json({
      activity_id: activity.id,
      title: activity.title,
      slug: activity.slug,
      domain_id: activity.domain_id,
    });
  } catch (err) {
    next(err);
  }
}

/** Idempotency window: do not insert another kid_tool_session if last completion was within this many ms. */
const COMPLETE_IDEMPOTENCY_MS = 30 * 1000;

/**
 * POST /kids/tools/complete — record completion, write progress + kid_tool_sessions. No duplicate star awarding.
 */
async function toolsComplete(req, res, next) {
  try {
    const { child_id: childId, tool_type: toolType, stars, metadata } = req.body;
    if (!childId || !toolType) {
      return res.status(400).json({ error: 'child_id and tool_type are required' });
    }
    const child = await Child.findById(childId, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const slug = normalizeToolType(toolType);
    if (!TOOL_TYPE_SLUGS.includes(slug)) {
      return res.status(400).json({
        error: 'Invalid tool_type. Use one of: breathing, grounding_54321, calm_body_reset, pause_and_choose, emotion_match_game, body_signals_map, feeling_intensity_check, emotion-wheel, emotion-identification-cbt, problem_ladder, fix_it_plan, try_again_tool',
      });
    }
    const activity = await Activity.findBySlug(slug);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found for this tool' });
    }
    if (!TOOL_ALLOWED_DOMAINS.includes(activity.domain_id)) {
      return res.status(400).json({ error: 'This tool is not available for the tools API' });
    }

    const recent = await KidToolSession.findMostRecent(childId, activity.id);
    const now = new Date();
    if (recent) {
      const completedAt = new Date(recent.completed_at);
      if (now - completedAt < COMPLETE_IDEMPOTENCY_MS) {
        const progress = await Progress.findByChildAndActivity(childId, activity.id);
        return res.status(200).json({
          progress: progress || { stars: 0, completed_at: recent.completed_at },
          duplicate_ignored: true,
        });
      }
    }

    const starsValue = Math.min(5, Math.max(0, Math.round(Number(stars) || 0)));
    const progress = await Progress.upsert({
      childId,
      activityId: activity.id,
      stars: starsValue,
      streakDays: 0,
      metadata: metadata || {},
      completedAt: null,
    });
    await KidToolSession.insert({
      childId,
      activityId: activity.id,
      domainId: activity.domain_id,
      stars: progress.stars,
      completedAt: progress.completed_at,
    });
    res.status(201).json({ progress });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDomainProgress,
  toolsStart,
  toolsComplete,
};
