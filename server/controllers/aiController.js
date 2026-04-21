const OpenAI = require('openai');

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
    return null;
  }
  return new OpenAI({ apiKey });
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

    const openai = getOpenAIClient();

    // If no API key configured, return a smart fallback
    if (!openai) {
      const fallback = generateFallbackSummary(jobTitle, experience, skills);
      return res.json({ result: fallback, source: 'template' });
    }

    const prompt = `Write a professional resume summary (3-4 sentences) for a ${jobTitle}${experience ? ` with experience in ${experience}` : ''}${skills ? ` skilled in ${skills}` : ''}. 
Make it compelling, concise, and ATS-friendly. Use strong action-oriented language. Do not include any labels or headers, just the summary text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    res.json({
      result: completion.choices[0].message.content.trim(),
      source: 'openai',
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

    const openai = getOpenAIClient();

    if (!openai) {
      const improved = improveTextFallback(text);
      return res.json({ result: improved, source: 'template' });
    }

    const prompt = `Improve the following resume ${context || 'description'} to be more professional, impactful, and ATS-friendly. Use strong action verbs, quantify achievements where possible, and keep it concise. Return only the improved text, no labels or explanations.

Original text:
${text}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    res.json({
      result: completion.choices[0].message.content.trim(),
      source: 'openai',
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

    const openai = getOpenAIClient();

    if (!openai) {
      const skills = suggestSkillsFallback(jobTitle);
      return res.json({ result: skills, source: 'template' });
    }

    const prompt = `Suggest 10 relevant technical and soft skills for a ${jobTitle} position${currentSkills ? `. They already have: ${currentSkills}. Suggest different skills they might be missing` : ''}. 
Return ONLY a JSON array of strings, no explanation. Example: ["Skill 1", "Skill 2"]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    let skills;
    try {
      skills = JSON.parse(completion.choices[0].message.content.trim());
    } catch {
      // If JSON parsing fails, split by lines/commas
      skills = completion.choices[0].message.content
        .trim()
        .split(/[,\n]/)
        .map((s) => s.replace(/^[\d.\-"'\s]+/, '').replace(/["']/g, '').trim())
        .filter(Boolean);
    }

    res.json({ result: skills, source: 'openai' });
  } catch (error) {
    console.error('Suggest skills error:', error);
    res.status(500).json({ error: 'Failed to suggest skills' });
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

module.exports = { generateSummary, improveText, suggestSkills };
