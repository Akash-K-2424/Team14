/* eslint-disable no-console */
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const baseURL = process.env.ATS_TEST_BASE_URL || `http://localhost:${process.env.PORT || 5001}/api`;
const token = process.env.ATS_TEST_TOKEN;
const resumeId = process.env.ATS_TEST_RESUME_ID;
const jobDescription = process.env.ATS_TEST_JOB_DESCRIPTION || `
Senior Frontend Engineer
Requirements:
- Strong React and JavaScript experience
- Build reusable UI components and optimize performance
- Work with REST APIs, testing, and CI/CD
- Collaborate with product and design teams
`;

if (!token || !resumeId) {
  console.error('Missing required env vars: ATS_TEST_TOKEN and ATS_TEST_RESUME_ID');
  console.error('Example usage: ATS_TEST_TOKEN=... ATS_TEST_RESUME_ID=... npm run test:ats');
  process.exit(1);
}

const client = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const run = async () => {
  try {
    console.log(`Using API: ${baseURL}`);
    console.log(`Resume ID: ${resumeId}`);

    const before = await client.get(`/resumes/${resumeId}`);
    console.log(`Loaded resume title: ${before.data.title}`);

    const analysisResponse = await client.post(`/resumes/${resumeId}/ats-analyze`, {
      jobDescription,
    });

    const ats = analysisResponse.data.ats;
    if (!ats) {
      throw new Error('ATS response missing `ats` payload');
    }

    console.log('\nATS Analysis Result');
    console.log('-------------------');
    console.log(`Overall Score: ${ats.overallScore}/100`);
    console.log('Category Scores:', ats.categoryScores);
    console.log(`Matched Keywords (${(ats.matchedKeywords || []).length}):`, (ats.matchedKeywords || []).slice(0, 10));
    console.log(`Missing Keywords (${(ats.missingKeywords || []).length}):`, (ats.missingKeywords || []).slice(0, 10));
    console.log('Top Suggestions:', (ats.suggestions || []).slice(0, 5));

    const after = await client.get(`/resumes/${resumeId}`);
    console.log(`\nPersisted analyzedAt: ${after.data.ats?.analyzedAt || 'not persisted'}`);
    console.log('ATS endpoint functional test passed.');
  } catch (error) {
    const message = error.response?.data || error.message;
    console.error('ATS endpoint functional test failed:', message);
    process.exit(1);
  }
};

run();
