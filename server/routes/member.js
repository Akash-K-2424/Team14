const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
} = require('../controllers/memberController');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `member-${uniqueSuffix}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ storage, fileFilter: imageFilter });

router.route('/').get(getMembers).post(upload.single('image'), createMember);
router.route('/:id').get(getMemberById).put(upload.single('image'), updateMember);

module.exports = router;
