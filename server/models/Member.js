const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    aboutProject: {
      type: String,
      default: '',
      trim: true,
    },
    hobbies: {
      type: String,
      default: '',
      trim: true,
    },
    certificate: {
      type: String,
      default: '',
      trim: true,
    },
    internship: {
      type: String,
      default: '',
      trim: true,
    },
    aboutAim: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      default: 'Student',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    contact: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
