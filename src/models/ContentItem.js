const { query } = require('../database/connection');

const TYPES = ['article', 'video', 'activity'];

/** Public list: only published, optional filters type, age_range */
async function findAll(filters = {}) {
  let sql = `
    SELECT id, type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
           for_parents_notes, evidence_notes, is_published, published_at, created_at, updated_at
    FROM content_items
    WHERE is_published = true`;
  const params = [];
  let i = 1;
  if (filters.type) {
    sql += ` AND type = $${i++}`;
    params.push(filters.type);
  }
  if (filters.age_range) {
    sql += ` AND (age_range = $${i++} OR age_range IS NULL)`;
    params.push(filters.age_range);
  }
  sql += ' ORDER BY published_at DESC NULLS LAST, created_at DESC';
  const result = await query(sql, params);
  return result.rows;
}

/** Public get one: only if published */
async function findById(id) {
  const result = await query(
    `SELECT id, type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
            for_parents_notes, evidence_notes, is_published, published_at, created_at, updated_at
     FROM content_items WHERE id = $1 AND is_published = true`,
    [id]
  );
  return result.rows[0] || null;
}

/** Admin: list all (optional type filter) */
async function findAllAdmin(filters = {}) {
  let sql = `
    SELECT id, type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
           for_parents_notes, evidence_notes, is_published, published_at, created_at, updated_at
    FROM content_items WHERE 1=1`;
  const params = [];
  let i = 1;
  if (filters.type) {
    sql += ` AND type = $${i++}`;
    params.push(filters.type);
  }
  sql += ' ORDER BY updated_at DESC';
  const result = await query(sql, params);
  return result.rows;
}

/** Admin: get one by id (any publish state) */
async function findByIdAdmin(id) {
  const result = await query(
    `SELECT id, type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
            for_parents_notes, evidence_notes, is_published, published_at, created_at, updated_at
     FROM content_items WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/** Admin: create */
async function create(data) {
  const {
    type,
    title,
    summary = null,
    body_markdown = null,
    video_url = null,
    age_range = null,
    tags = [],
    psychology_basis = [],
    for_parents_notes = null,
    evidence_notes = null,
    is_published = false,
  } = data;
  if (!TYPES.includes(type)) {
    throw new Error(`type must be one of: ${TYPES.join(', ')}`);
  }
  const result = await query(
    `INSERT INTO content_items (
      type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
      for_parents_notes, evidence_notes, is_published, published_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    RETURNING id, type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
              for_parents_notes, evidence_notes, is_published, published_at, created_at, updated_at`,
    [
      type,
      title,
      summary,
      body_markdown,
      video_url,
      age_range,
      Array.isArray(tags) ? tags : [],
      Array.isArray(psychology_basis) ? psychology_basis : [],
      for_parents_notes,
      evidence_notes,
      is_published,
      is_published ? new Date() : null,
    ]
  );
  return result.rows[0];
}

/** Admin: update (partial) */
async function update(id, data) {
  const allowed = [
    'type', 'title', 'summary', 'body_markdown', 'video_url', 'age_range',
    'tags', 'psychology_basis', 'for_parents_notes', 'evidence_notes', 'is_published',
  ];
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (data[key] === undefined) continue;
    if (key === 'tags' || key === 'psychology_basis') {
      setClauses.push(`${key} = $${i++}`);
      values.push(Array.isArray(data[key]) ? data[key] : []);
    } else if (key === 'is_published') {
      const published = !!data[key];
      setClauses.push(`is_published = $${i++}`);
      values.push(published);
      setClauses.push(`published_at = CASE WHEN $${i++} = true THEN COALESCE(published_at, NOW()) ELSE NULL END`);
      values.push(published);
    } else {
      setClauses.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }
  if (setClauses.length === 0) {
    const row = await findByIdAdmin(id);
    if (!row) return null;
    return row;
  }
  setClauses.push('updated_at = NOW()');
  values.push(id);
  const result = await query(
    `UPDATE content_items SET ${setClauses.join(', ')} WHERE id = $${i}
     RETURNING id, type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis,
               for_parents_notes, evidence_notes, is_published, published_at, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
}

/** Admin: set published flag (convenience) */
async function setPublish(id, isPublished) {
  return update(id, { is_published: isPublished });
}

module.exports = {
  TYPES,
  findAll,
  findById,
  findAllAdmin,
  findByIdAdmin,
  create,
  update,
  setPublish,
};
