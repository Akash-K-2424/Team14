const Resume = require('../models/Resume');

/**
 * @desc    Create a new resume
 * @route   POST /api/resumes
 * @access  Private
 */
const createResume = async (req, res) => {
  try {
    const resume = await Resume.create({
      user: req.user._id,
      title: req.body.title || 'Untitled Resume',
      // Pre-fill personal info from user profile
      personalInfo: {
        fullName: req.user.name,
        email: req.user.email,
      },
    });

    res.status(201).json(resume);
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ error: 'Failed to create resume' });
  }
};

/**
 * @desc    Get all resumes for the logged-in user
 * @route   GET /api/resumes
 * @access  Private
 */
const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title template updatedAt createdAt lastSaved');

    res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
};

/**
 * @desc    Get a single resume by ID
 * @route   GET /api/resumes/:id
 * @access  Private
 */
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
};

/**
 * @desc    Update a resume
 * @route   PUT /api/resumes/:id
 * @access  Private
 */
const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'template', 'personalInfo', 'summary',
      'experience', 'education', 'skills', 'projects',
      'certifications', 'languages',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        resume[field] = req.body[field];
      }
    });

    resume.lastSaved = Date.now();
    await resume.save();

    res.json(resume);
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
};

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resumes/:id
 * @access  Private
 */
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};

module.exports = {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
};
