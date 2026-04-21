const mongoose = require('mongoose');

/**
 * Resume Schema
 * Full resume data model with all standard sections.
 * Each resume belongs to a user (ref: User).
 */

// ---- Sub-schemas for resume sections ----

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  position: { type: String, default: '' },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  description: { type: String, default: '' },
});

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  gpa: { type: String, default: '' },
  description: { type: String, default: '' },
});

const projectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: { type: String, default: '' },
  link: { type: String, default: '' },
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
  link: { type: String, default: '' },
});

// ---- Main Resume Schema ----

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Resume',
      trim: true,
    },
    template: {
      type: String,
      enum: ['modern', 'classic', 'minimal'],
      default: 'modern',
    },

    // Personal Information
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
      github: { type: String, default: '' },
    },

    // Professional Summary
    summary: {
      type: String,
      default: '',
    },

    // Work Experience
    experience: [experienceSchema],

    // Education
    education: [educationSchema],

    // Skills (array of strings)
    skills: [{ type: String }],

    // Projects
    projects: [projectSchema],

    // Certifications
    certifications: [certificationSchema],

    // Languages (array of strings)
    languages: [{ type: String }],

    // Last saved timestamp (for autosave)
    lastSaved: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast user-based queries
resumeSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
