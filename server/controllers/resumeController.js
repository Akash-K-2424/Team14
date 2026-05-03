const Resume = require('../models/Resume');
const { enrichAtsSuggestionsWithAI } = require('./aiController');

const ATS_WEIGHTS = {
  keywords: 35,
  structure: 25,
  impact: 25,
  formatting: 15,
};

const ATS_BASE_KEYWORDS = [
  'leadership', 'communication', 'collaboration', 'problem solving', 'project management',
  'sql', 'python', 'javascript', 'react', 'node', 'aws', 'docker', 'api', 'analytics',
];

const ATS_STOPWORDS = new Set([
  'with', 'from', 'that', 'this', 'these', 'those', 'your', 'their', 'there', 'have', 'has', 'had',
  'will', 'would', 'should', 'could', 'about', 'into', 'over', 'under', 'between', 'across', 'using',
  'used', 'least', 'more', 'most', 'very', 'also', 'must', 'such', 'than', 'then', 'able', 'both',
  'include', 'includes', 'including', 'required', 'requirements', 'experience', 'skills', 'skill',
  'strong', 'excellent', 'good', 'competent', 'analytical', 'objective', 'concepts', 'successfully',
  'submitted', 'store', 'applications', 'demonstrated', 'build', 'building', 'work', 'working',
  'team', 'role', 'position', 'candidate', 'years', 'year',
]);

const ATS_PHRASE_PATTERNS = [
  'react', 'react native', 'javascript', 'typescript', 'node.js', 'node', 'express',
  'python', 'java', 'sql', 'mongodb', 'mysql', 'postgresql', 'aws', 'azure', 'docker',
  'kubernetes', 'ci/cd', 'rest api', 'graphql', 'machine learning', 'data analysis',
  'project management', 'agile', 'ios', 'iphone', 'ipad', 'xcode',
];

const normalize = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9+\-#.\s]/g, ' ').replace(/\s+/g, ' ').trim();

const splitKeywords = (text = '') => {
  const normalized = normalize(text);
  const phraseKeywords = ATS_PHRASE_PATTERNS.filter((phrase) => normalized.includes(phrase)).map((phrase) => phrase.toLowerCase());
  const words = normalized
    .split(' ')
    .filter((w) => w.length >= 4)
    .filter((w) => !ATS_STOPWORDS.has(w))
    .filter((w) => /[a-z]/.test(w))
    .filter((w) => !/^\d+$/.test(w));

  return [...new Set([...phraseKeywords, ...words])];
};

const extractResumeText = (resume) => {
  const parts = [
    resume.personalInfo?.fullName,
    resume.personalInfo?.email,
    resume.personalInfo?.phone,
    resume.personalInfo?.location,
    resume.summary,
    ...(resume.skills || []),
    ...(resume.languages || []),
    ...(resume.experience || []).flatMap((exp) => [
      exp.company,
      exp.position,
      exp.location,
      exp.description,
      exp.startDate,
      exp.endDate,
    ]),
    ...(resume.education || []).flatMap((edu) => [
      edu.institution,
      edu.degree,
      edu.field,
      edu.description,
    ]),
    ...(resume.projects || []).flatMap((project) => [
      project.name,
      project.description,
      project.technologies,
    ]),
    ...(resume.certifications || []).flatMap((cert) => [
      cert.name,
      cert.issuer,
    ]),
  ];
  return normalize(parts.filter(Boolean).join(' '));
};

const buildBaseSuggestions = ({ missingKeywords, structureReasons, impactReasons, formattingReasons }) => {
  const suggestions = [];

  if (missingKeywords.length > 0) {
    suggestions.push(`Add missing keywords naturally: ${missingKeywords.slice(0, 8).join(', ')}.`);
  }

  structureReasons.forEach((reason) => suggestions.push(reason));
  impactReasons.forEach((reason) => suggestions.push(reason));
  formattingReasons.forEach((reason) => suggestions.push(reason));

  if (suggestions.length === 0) {
    suggestions.push('Tailor the resume for each role and keep achievement metrics updated.');
  }

  return suggestions.slice(0, 8);
};

const analyzeResumeATS = async (resume) => {
  const resumeText = extractResumeText(resume);
  const jdText = normalize(resume.jobDescription || '');
  const targetKeywordSet = new Set(
    (jdText ? splitKeywords(jdText).slice(0, 40) : ATS_BASE_KEYWORDS)
      .map((k) => k.toLowerCase())
  );
  const targetKeywords = [...targetKeywordSet];

  const matchedKeywords = targetKeywords.filter((keyword) => resumeText.includes(keyword));
  const missingKeywords = targetKeywords.filter((keyword) => !resumeText.includes(keyword));

  const keywordScore = targetKeywords.length === 0
    ? ATS_WEIGHTS.keywords
    : Math.round((matchedKeywords.length / targetKeywords.length) * ATS_WEIGHTS.keywords);

  const structureReasons = [];
  let structureScore = 0;
  if (resume.personalInfo?.fullName && resume.personalInfo?.email && resume.personalInfo?.phone) {
    structureScore += 7;
  } else {
    structureReasons.push('Complete contact info: full name, email, and phone.');
  }
  if ((resume.summary || '').trim().length >= 50) {
    structureScore += 6;
  } else {
    structureReasons.push('Expand summary to at least 2-3 ATS-friendly lines.');
  }
  if ((resume.experience || []).length > 0) {
    structureScore += 6;
  } else {
    structureReasons.push('Add at least one experience entry with responsibilities and outcomes.');
  }
  if ((resume.education || []).length > 0) {
    structureScore += 3;
  } else {
    structureReasons.push('Add education details for ATS completeness.');
  }
  if ((resume.skills || []).length >= 5) {
    structureScore += 3;
  } else {
    structureReasons.push('List at least 5 relevant skills.');
  }

  const impactReasons = [];
  const expDescriptions = (resume.experience || [])
    .map((e) => (e.description || '').trim())
    .filter(Boolean);
  const metricsMatches = expDescriptions.join(' ').match(/\b\d+%|\b\d+\b/g) || [];
  const actionVerbMatches = expDescriptions.join(' ').match(/\b(built|led|improved|optimized|increased|reduced|launched|implemented|managed|designed)\b/gi) || [];

  let impactScore = 0;
  if (expDescriptions.length >= 2) {
    impactScore += 10;
  } else {
    impactReasons.push('Add at least 2 detailed achievement bullets in experience.');
  }
  if (metricsMatches.length >= 2) {
    impactScore += 8;
  } else {
    impactReasons.push('Quantify results with metrics (%, counts, time, revenue).');
  }
  if (actionVerbMatches.length >= 2) {
    impactScore += 7;
  } else {
    impactReasons.push('Start bullets with strong action verbs (Led, Built, Improved, etc.).');
  }

  const formattingReasons = [];
  let formattingScore = 0;
  if ((resume.title || '').trim().length > 0) formattingScore += 4;
  else formattingReasons.push('Use a clear resume title.');

  const hasLongBlock = expDescriptions.some((text) => text.length > 350);
  if (!hasLongBlock) formattingScore += 5;
  else formattingReasons.push('Break long paragraphs into concise bullet-style statements.');

  const hasCoreSections = (resume.summary || '').trim() && (resume.experience || []).length && (resume.skills || []).length;
  if (hasCoreSections) formattingScore += 6;
  else formattingReasons.push('Ensure summary, experience, and skills sections are all filled.');

  const categoryScores = {
    keywords: Math.min(ATS_WEIGHTS.keywords, keywordScore),
    structure: Math.min(ATS_WEIGHTS.structure, structureScore),
    impact: Math.min(ATS_WEIGHTS.impact, impactScore),
    formatting: Math.min(ATS_WEIGHTS.formatting, formattingScore),
  };

  const overallScore = categoryScores.keywords + categoryScores.structure + categoryScores.impact + categoryScores.formatting;

  const baseSuggestions = buildBaseSuggestions({
    missingKeywords,
    structureReasons,
    impactReasons,
    formattingReasons,
  });

  let aiSource = 'template';
  let suggestions = baseSuggestions;
  try {
    const aiResult = await enrichAtsSuggestionsWithAI({
      resumeText,
      jobDescription: resume.jobDescription || '',
      missingKeywords,
      baseSuggestions,
    });
    suggestions = aiResult.suggestions;
    aiSource = aiResult.source;
  } catch (error) {
    console.error('ATS AI enrichment error:', error);
  }

  return {
    overallScore,
    categoryScores,
    matchedKeywords: matchedKeywords.slice(0, 30),
    missingKeywords: missingKeywords.slice(0, 30),
    suggestions,
    criticalWarnings: [
      ...structureReasons,
      ...impactReasons,
      ...formattingReasons,
    ].slice(0, 6),
    analyzedAt: new Date(),
    source: aiSource,
  };
};

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
      'certifications', 'languages', 'jobDescription',
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
 * @desc    Analyze resume for ATS score and suggestions
 * @route   POST /api/resumes/:id/ats-analyze
 * @access  Private
 */
const analyzeResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (req.body.jobDescription !== undefined) {
      resume.jobDescription = req.body.jobDescription;
    }

    const analysis = await analyzeResumeATS(resume);
    resume.ats = {
      overallScore: analysis.overallScore,
      categoryScores: analysis.categoryScores,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      suggestions: analysis.suggestions,
      criticalWarnings: analysis.criticalWarnings,
      analyzedAt: analysis.analyzedAt,
    };
    resume.lastSaved = Date.now();
    await resume.save();

    res.json({
      ats: resume.ats,
      source: analysis.source,
    });
  } catch (error) {
    console.error('Analyze resume ATS error:', error);
    res.status(500).json({ error: 'Failed to analyze resume for ATS' });
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
  analyzeResume,
};
