const Member = require('../models/Member');
const fs = require('fs');
const path = require('path');

const createMember = async (req, res, next) => {
  try {
    const { fullName, role, email, contact, bio = '' } = req.body;

    if (!fullName || !role || !email || !contact) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Profile image is required' });
    }

    const member = await Member.create({
      fullName,
      role,
      email,
      contact,
      bio,
      image: req.file.filename,
    });

    return res.status(201).json(member);
  } catch (error) {
    return next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    return res.json(members);
  } catch (error) {
    return next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.json(member);
  } catch (error) {
    return next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { fullName, role, email, contact, bio } = req.body || {};

    if (typeof fullName === 'string') member.fullName = fullName;
    if (typeof role === 'string') member.role = role;
    if (typeof email === 'string') member.email = email;
    if (typeof contact === 'string') member.contact = contact;
    if (typeof bio === 'string') member.bio = bio;

    if (req.file) {
      const oldFilename = member.image;
      member.image = req.file.filename;

      if (oldFilename) {
        const oldPath = path.join(__dirname, '..', 'uploads', oldFilename);
        fs.promises.unlink(oldPath).catch(() => {});
      }
    }

    await member.save();
    return res.json(member);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
};
