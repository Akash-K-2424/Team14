const express = require('express');
const router = express.Router();
const {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  analyzeResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

// All resume routes are protected
router.use(protect);

router.route('/')
  .post(createResume)
  .get(getResumes);

router.route('/:id')
  .get(getResume)
  .put(updateResume)
  .delete(deleteResume);

router.post('/:id/ats-analyze', analyzeResume);

module.exports = router;
