const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

const getGeminiModelName = () => process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const tryParseJson = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    // Attempt to extract a JSON object/array from the response
    const startObj = raw.indexOf('{');
    const startArr = raw.indexOf('[');
    const start = startArr !== -1 && (startObj === -1 || startArr < startObj) ? startArr : startObj;
    if (start === -1) return fallback;

    const endObj = raw.lastIndexOf('}');
    const endArr = raw.lastIndexOf(']');
    const end = endArr !== -1 && endArr > endObj ? endArr : endObj;
    if (end === -1 || end <= start) return fallback;

    const sliced = raw.slice(start, end + 1);
    try {
      return JSON.parse(sliced);
    } catch {
      return fallback;
    }
  }
};

const generateJsonWithGemini = async ({ prompt, maxOutputTokens = 900, temperature = 0.4 }) => {
  const genAI = getGeminiClient();
  if (!genAI) return { json: null, source: 'template' };

  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || '';
  const parsed = tryParseJson(text, null);
  return { json: parsed, source: 'gemini', raw: text };
};

const enrichAtsSuggestionsWithAI = async ({ resumeText, jobDescription, missingKeywords, baseSuggestions }) => {
  const genAI = getGeminiClient();
  if (!genAI) {
    return { suggestions: baseSuggestions, source: 'template' };
  }

  const prompt = `You are an ATS resume reviewer. Improve the suggestion list below into concise, actionable items.

Rules:
- Return ONLY a JSON array with max 8 items.
- Each item must start with a strong action verb.
- Focus on ATS alignment, keyword coverage, and measurable impact.

Missing keywords: ${missingKeywords.join(', ') || 'none'}
Base suggestions: ${baseSuggestions.join(' | ')}
Job Description: ${jobDescription || 'Not provided'}
Resume text:
${resumeText.slice(0, 5000)}`;

  const { json } = await generateJsonWithGemini({ prompt, maxOutputTokens: 500, temperature: 0.4 });
  if (Array.isArray(json) && json.length > 0) {
    return {
      suggestions: json.map((item) => String(item).trim()).filter(Boolean).slice(0, 8),
      source: 'gemini',
    };
  }
  return { suggestions: baseSuggestions, source: 'template' };
};

/**
 * @desc    Generate a professional summary
 * @route   POST /api/ai/generate-summary
 * @access  Private
 */
const generateSummary = async (req, res) => {
  try {
    const { jobTitle, experience, skills } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    // If no API key configured, return a smart fallback
    if (!getGeminiClient()) {
      const fallback = generateFallbackSummary(jobTitle, experience, skills);
      return res.json({ result: fallback, source: 'template' });
    }

    const prompt = `Write a professional resume summary (3-4 sentences) for a ${jobTitle}${experience ? ` with experience in ${experience}` : ''}${skills ? ` skilled in ${skills}` : ''}. 
Make it compelling, concise, and ATS-friendly. Use strong action-oriented language. Do not include any labels or headers, just the summary text.`;

    res.json({
      result: (await generateJsonWithGemini({
        prompt: `Return ONLY JSON: {"text":"..."}\n\n${prompt}`,
        maxOutputTokens: 250,
        temperature: 0.7,
      })).json?.text?.trim?.() || generateFallbackSummary(jobTitle, experience, skills),
      source: 'gemini',
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

/**
 * @desc    Improve a text description (e.g. experience bullet points)
 * @route   POST /api/ai/improve-text
 * @access  Private
 */
const improveText = async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!getGeminiClient()) {
      const improved = improveTextFallback(text);
      return res.json({ result: improved, source: 'template' });
    }

    const prompt = `Improve the following resume ${context || 'description'} to be more professional, impactful, and ATS-friendly. Use strong action verbs, quantify achievements where possible, and keep it concise. Return only the improved text, no labels or explanations.

Original text:
${text}`;

    res.json({
      result: (await generateJsonWithGemini({
        prompt: `Return ONLY JSON: {"text":"..."}\n\n${prompt}`,
        maxOutputTokens: 350,
        temperature: 0.7,
      })).json?.text?.trim?.() || improveTextFallback(text),
      source: 'gemini',
    });
  } catch (error) {
    console.error('Improve text error:', error);
    res.status(500).json({ error: 'Failed to improve text' });
  }
};

/**
 * @desc    Suggest skills based on job title
 * @route   POST /api/ai/suggest-skills
 * @access  Private
 */
const suggestSkills = async (req, res) => {
  try {
    const { jobTitle, currentSkills } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    if (!getGeminiClient()) {
      const skills = suggestSkillsFallback(jobTitle);
      return res.json({ result: skills, source: 'template' });
    }

    const prompt = `Suggest 10 relevant technical and soft skills for a ${jobTitle} position${currentSkills ? `. They already have: ${currentSkills}. Suggest different skills they might be missing` : ''}. 
Return ONLY a JSON array of strings, no explanation. Example: ["Skill 1", "Skill 2"]`;

    const { json } = await generateJsonWithGemini({ prompt, maxOutputTokens: 250, temperature: 0.7 });
    const skills = Array.isArray(json) ? json : suggestSkillsFallback(jobTitle);
    res.json({ result: skills, source: 'gemini' });
  } catch (error) {
    console.error('Suggest skills error:', error);
    res.status(500).json({ error: 'Failed to suggest skills' });
  }
};

/**
 * @desc    Generate a full resume patch (summary/skills/experience/projects) from existing data + job description
 * @route   POST /api/ai/generate-resume
 * @access  Private
 */
const generateResume = async (req, res) => {
  try {
    const { resume, jobDescription, targetRole } = req.body || {};

    if (!getGeminiClient()) {
      return res.json({
        patch: {
          summary: '',
          skills: [],
          experience: [],
          projects: [],
        },
        source: 'template',
      });
    }

    const safeResume = resume && typeof resume === 'object' ? resume : {};
    const personal = safeResume.personalInfo || {};
    const inferredRole =
      targetRole ||
      safeResume.experience?.[0]?.position ||
      safeResume.title ||
      'the target role';

    const prompt = `You are a professional resume writer. Generate an ATS-friendly resume improvement "patch" as STRICT JSON.

Return ONLY a single JSON object with this shape:
{
  "summary": "3-4 sentence professional summary",
  "skills": ["10-18 skills, mix of technical + soft, role-relevant, no duplicates"],
  "experience": [
    {
      "company": "keep existing if provided",
      "position": "keep existing if provided",
      "location": "keep existing if provided",
      "startDate": "keep existing if provided",
      "endDate": "keep existing if provided",
      "current": true/false (keep existing if provided),
      "description": "4-6 bullet points separated by \\n- (each bullet starts with action verb, includes impact/metrics when possible)"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "2-3 bullets separated by \\n- with impact + tech",
      "technologies": "comma-separated tech",
      "link": "optional"
    }
  ]
}

Rules:
- Preserve the user's personal info (name/email/phone/links) by NOT changing it (you are only returning the patch above).
- If existing experience/projects exist, improve them; do NOT invent employers. If data is missing, write generic but plausible bullets without fabricating company names.
- Make it concise, modern, and ATS-friendly.
- No Markdown, no extra text, JSON only.

Target role: ${inferredRole}
Candidate name: ${personal.fullName || ''}
Existing resume JSON:
${JSON.stringify(
  {
    title: safeResume.title,
    summary: safeResume.summary,
    skills: safeResume.skills,
    experience: safeResume.experience,
    projects: safeResume.projects,
    education: safeResume.education,
    certifications: safeResume.certifications,
  },
  null,
  2
).slice(0, 12000)}

Job description (optional):
${String(jobDescription || safeResume.jobDescription || '').slice(0, 8000)}`;

    const { json: parsed } = await generateJsonWithGemini({
      prompt,
      maxOutputTokens: 1100,
      temperature: 0.4,
    });

    const patch = {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      skills: Array.isArray(parsed.skills) ? parsed.skills.map((s) => String(s).trim()).filter(Boolean) : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    };

    res.json({ patch, source: 'gemini' });
  } catch (error) {
    console.error('Generate resume error:', error);
    res.status(500).json({ error: 'Failed to generate resume' });
  }
};

// ========================================
// Fallback generators (when no API key)
// ========================================

function generateFallbackSummary(jobTitle, experience, skills) {
  const templates = [
    `Results-driven ${jobTitle} with a proven track record of delivering high-quality solutions. ${experience ? `Experienced in ${experience}. ` : ''}${skills ? `Proficient in ${skills}. ` : ''}Passionate about leveraging technology to solve complex problems and drive business growth.`,
    `Dynamic and detail-oriented ${jobTitle} dedicated to building efficient, scalable solutions. ${experience ? `Background in ${experience}. ` : ''}${skills ? `Skilled in ${skills}. ` : ''}Known for strong analytical thinking and collaborative problem-solving.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function improveTextFallback(text) {
  // Basic improvements: capitalize first letter, ensure period at end
  let improved = text.charAt(0).toUpperCase() + text.slice(1);
  if (!improved.endsWith('.')) improved += '.';

  // Replace weak verbs with stronger ones
  const replacements = {
    'worked on': 'Spearheaded',
    'helped with': 'Facilitated',
    'was responsible for': 'Led',
    'did': 'Executed',
    'made': 'Developed',
    'used': 'Leveraged',
  };

  Object.entries(replacements).forEach(([weak, strong]) => {
    improved = improved.replace(new RegExp(weak, 'gi'), strong);
  });

  return improved;
}

function suggestSkillsFallback(jobTitle) {
  const skillMap = {
    'software engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker', 'Agile', 'REST APIs'],
    'frontend developer': ['React', 'TypeScript', 'CSS/SASS', 'Next.js', 'Tailwind CSS', 'Figma', 'Jest', 'Webpack', 'Accessibility', 'Performance Optimization'],
    'backend developer': ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'GraphQL', 'Microservices', 'CI/CD'],
    'data scientist': ['Python', 'R', 'SQL', 'TensorFlow', 'Pandas', 'Scikit-learn', 'Tableau', 'Statistics', 'Machine Learning', 'Data Visualization'],
    'product manager': ['Product Strategy', 'Agile/Scrum', 'User Research', 'Data Analysis', 'Roadmapping', 'Stakeholder Management', 'A/B Testing', 'Jira', 'SQL', 'Wireframing'],
    'designer': ['Figma', 'Adobe Creative Suite', 'UI/UX Design', 'Prototyping', 'Design Systems', 'Typography', 'User Research', 'Wireframing', 'HTML/CSS', 'Accessibility'],
    default: ['Communication', 'Problem Solving', 'Team Leadership', 'Project Management', 'Critical Thinking', 'Adaptability', 'Time Management', 'Data Analysis', 'Technical Writing', 'Collaboration'],
  };

  const key = Object.keys(skillMap).find((k) =>
    jobTitle.toLowerCase().includes(k)
  );
  return skillMap[key] || skillMap.default;
}

module.exports = { generateSummary, improveText, suggestSkills, enrichAtsSuggestionsWithAI, generateResume };
