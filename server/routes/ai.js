const express = require('express');
const router = express.Router();
const {
  generateSummary,
  improveText,
  suggestSkills,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All AI routes are protected
router.use(protect);

router.post('/generate-summary', generateSummary);
router.post('/improve-text', improveText);
router.post('/suggest-skills', suggestSkills);

module.exports = router;
