const ContentItem = require('../models/ContentItem');

/** GET /admin/content – list all items (optional type in query) */
async function list(req, res, next) {
  try {
    const { type } = req.query;
    const filters = type && ContentItem.TYPES.includes(type) ? { type } : {};
    const items = await ContentItem.findAllAdmin(filters);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/** GET /admin/content/:id – get one (any publish state) */
async function getOne(req, res, next) {
  try {
    const item = await ContentItem.findByIdAdmin(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

/** POST /admin/content – create */
async function create(req, res, next) {
  try {
    const {
      type,
      title,
      summary,
      body_markdown,
      video_url,
      age_range,
      tags,
      psychology_basis,
      for_parents_notes,
      evidence_notes,
      is_published,
    } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }
    const item = await ContentItem.create({
      type,
      title,
      summary: summary ?? null,
      body_markdown: body_markdown ?? null,
      video_url: video_url ?? null,
      age_range: age_range ?? null,
      tags: Array.isArray(tags) ? tags : [],
      psychology_basis: Array.isArray(psychology_basis) ? psychology_basis : [],
      for_parents_notes: for_parents_notes ?? null,
      evidence_notes: evidence_notes ?? null,
      is_published: !!is_published,
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

/** PATCH /admin/content/:id – update (partial); body can include is_published to publish/unpublish */
async function update(req, res, next) {
  try {
    const existing = await ContentItem.findByIdAdmin(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Content not found' });
    }
    const {
      type,
      title,
      summary,
      body_markdown,
      video_url,
      age_range,
      tags,
      psychology_basis,
      for_parents_notes,
      evidence_notes,
      is_published,
    } = req.body;
    const data = {};
    if (type !== undefined) data.type = type;
    if (title !== undefined) data.title = title;
    if (summary !== undefined) data.summary = summary;
    if (body_markdown !== undefined) data.body_markdown = body_markdown;
    if (video_url !== undefined) data.video_url = video_url;
    if (age_range !== undefined) data.age_range = age_range;
    if (tags !== undefined) data.tags = tags;
    if (psychology_basis !== undefined) data.psychology_basis = psychology_basis;
    if (for_parents_notes !== undefined) data.for_parents_notes = for_parents_notes;
    if (evidence_notes !== undefined) data.evidence_notes = evidence_notes;
    if (is_published !== undefined) data.is_published = is_published;
    const item = await ContentItem.update(req.params.id, data);
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
};
