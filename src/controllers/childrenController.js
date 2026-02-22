const Child = require('../models/Child');

async function list(req, res, next) {
  try {
    const children = await Child.findByParentId(req.user.id);
    res.json({ children });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const child = await Child.findById(req.params.id, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    res.json({ child });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, birth_date, age_group, avatar_url } = req.body;
    const child = await Child.create({
      parentId: req.user.id,
      name,
      birthDate: birth_date,
      ageGroup: age_group,
      avatarUrl: avatar_url,
    });
    res.status(201).json({ child });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const child = await Child.update(
      req.params.id,
      req.user.id,
      {
        name: req.body.name,
        birthDate: req.body.birth_date,
        ageGroup: req.body.age_group,
        avatarUrl: req.body.avatar_url,
      }
    );
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    res.json({ child });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await Child.remove(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Child not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
