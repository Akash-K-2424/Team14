import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import {
  HiOutlineArrowLeft,
  HiOutlineSave,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineDownload,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBadgeCheck,
  HiOutlineClipboardCopy,
} from 'react-icons/hi';
import { useReactToPrint } from 'react-to-print';

/**
 * Resume Builder Page
 * Left panel: form sections | Right panel: live preview
 */

// Default empty structures
const emptyExperience = { company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' };
const emptyEducation = { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', description: '' };
const emptyProject = { name: '', description: '', technologies: '', link: '' };
const emptyCertification = { name: '', issuer: '', date: '', link: '' };

export default function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [aiLoading, setAiLoading] = useState({});
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const componentRef = useRef();
  const lastSavedData = useRef(null);

  const printResume = useReactToPrint({
    contentRef: componentRef,
    documentTitle: resume?.personalInfo?.fullName ? `${resume.personalInfo.fullName} Resume` : 'Resume',
  });

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const { data } = await api.get(`/resumes/${id}`);
        setResume(data);
        setAtsResult(data.ats || null);
        lastSavedData.current = JSON.stringify(data);
      } catch {
        toast.error('Resume not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [id, navigate]);

  // Update resume field
  const updateField = useCallback((field, value) => {
    setResume((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Update nested personal info
  const updatePersonalInfo = useCallback((field, value) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  }, []);

  // Update array item
  const updateArrayItem = useCallback((arrayName, index, field, value) => {
    setResume((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  // Add array item
  const addArrayItem = useCallback((arrayName, template) => {
    setResume((prev) => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), { ...template }],
    }));
  }, []);

  // Remove array item
  const removeArrayItem = useCallback((arrayName, index) => {
    setResume((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  }, []);

  // Save resume
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/resumes/${id}`, {
        title: resume.title,
        template: resume.template,
        personalInfo: resume.personalInfo,
        summary: resume.summary,
        experience: resume.experience,
        education: resume.education,
        skills: resume.skills,
        projects: resume.projects,
        certifications: resume.certifications,
        languages: resume.languages,
        jobDescription: resume.jobDescription,
      });
      setResume(data);
      setAtsResult(data.ats || null);
      lastSavedData.current = JSON.stringify(data);
      toast.success('Resume saved!');
    } catch {
      toast.error('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  // Autosave
  useEffect(() => {
    if (!resume || loading) return;

    const currentData = JSON.stringify(resume);
    if (currentData === lastSavedData.current) return;

    const timer = setTimeout(async () => {
      setIsAutosaving(true);
      try {
        await api.put(`/resumes/${id}`, {
          title: resume.title,
          template: resume.template,
          personalInfo: resume.personalInfo,
          summary: resume.summary,
          experience: resume.experience,
          education: resume.education,
          skills: resume.skills,
          projects: resume.projects,
          certifications: resume.certifications,
          languages: resume.languages,
          jobDescription: resume.jobDescription,
        });
        lastSavedData.current = currentData;
      } catch {
        // Silent fail for autosave
      } finally {
        setIsAutosaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [resume, id, loading]);

  // AI: Generate summary
  const handleAISummary = async () => {
    setAiLoading((p) => ({ ...p, summary: true }));
    try {
      const inferredRole =
        resume.experience?.[0]?.position ||
        (resume.jobDescription || '').split('\n')[0].slice(0, 80) ||
        resume.title ||
        'Professional';
      const { data } = await api.post('/ai/generate-summary', {
        jobTitle: inferredRole,
        experience: resume.experience?.map((e) => e.position).filter(Boolean).join(', '),
        skills: resume.skills?.join(', '),
      });
      updateField('summary', data.result);
      toast.success('Summary generated!');
    } catch {
      toast.error('Failed to generate summary');
    } finally {
      setAiLoading((p) => ({ ...p, summary: false }));
    }
  };

  const handleAIGenerateResume = async () => {
    setAiLoading((p) => ({ ...p, generateResume: true }));
    try {
      const inferredRole =
        resume.experience?.[0]?.position ||
        (resume.jobDescription || '').split('\n')[0].slice(0, 80) ||
        resume.title ||
        'Target role';

      const { data } = await api.post('/ai/generate-resume', {
        resume,
        jobDescription: resume.jobDescription || '',
        targetRole: inferredRole,
      });

      const patch = data?.patch || {};

      setResume((prev) => {
        const next = { ...prev };
        if (typeof patch.summary === 'string' && patch.summary.trim()) next.summary = patch.summary.trim();
        if (Array.isArray(patch.skills) && patch.skills.length) next.skills = [...new Set(patch.skills)];

        if (Array.isArray(patch.experience) && patch.experience.length) {
          // Preserve company/position metadata if AI omitted it
          next.experience = patch.experience.map((e, idx) => ({
            ...prev.experience?.[idx],
            ...e,
          }));
        }

        if (Array.isArray(patch.projects) && patch.projects.length) {
          next.projects = patch.projects.map((p, idx) => ({
            ...prev.projects?.[idx],
            ...p,
          }));
        }

        return next;
      });

      toast.success('Generated resume content!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to generate resume');
    } finally {
      setAiLoading((p) => ({ ...p, generateResume: false }));
    }
  };

  // AI: Improve text
  const handleAIImprove = async (arrayName, index, field) => {
    const key = `${arrayName}_${index}_${field}`;
    setAiLoading((p) => ({ ...p, [key]: true }));
    try {
      const text = resume[arrayName][index][field];
      if (!text) {
        toast.error('Write something first, then improve it with AI');
        return;
      }
      const { data } = await api.post('/ai/improve-text', { text, context: 'experience description' });
      updateArrayItem(arrayName, index, field, data.result);
      toast.success('Text improved!');
    } catch {
      toast.error('Failed to improve text');
    } finally {
      setAiLoading((p) => ({ ...p, [key]: false }));
    }
  };

  // AI: Suggest skills
  const handleAISuggestSkills = async () => {
    setAiLoading((p) => ({ ...p, skills: true }));
    try {
      const jobTitle = resume.experience?.[0]?.position || 'professional';
      const { data } = await api.post('/ai/suggest-skills', {
        jobTitle,
        currentSkills: resume.skills?.join(', '),
      });
      updateField('skills', [...new Set([...(resume.skills || []), ...data.result])]);
      toast.success('Skills suggested!');
    } catch {
      toast.error('Failed to suggest skills');
    } finally {
      setAiLoading((p) => ({ ...p, skills: false }));
    }
  };

  const handleAnalyzeATS = async () => {
    setAtsLoading(true);
    try {
      const { data } = await api.post(`/resumes/${id}/ats-analyze`, {
        jobDescription: resume.jobDescription || '',
      });
      setAtsResult(data.ats);
      setResume((prev) => ({ ...prev, ats: data.ats }));
      toast.success('ATS analysis updated');
    } catch {
      toast.error('Failed to analyze ATS score');
    } finally {
      setAtsLoading(false);
    }
  };

  const handleApplyMissingSkills = () => {
    if (!atsResult?.missingKeywords?.length) {
      toast.error('No missing keywords found');
      return;
    }
    const genericWords = new Set([
      'experience', 'skills', 'skill', 'applications', 'strong', 'excellent', 'good',
      'competent', 'analytical', 'objective', 'concepts', 'required', 'requirements',
      'include', 'including', 'submitted', 'least',
    ]);
    const cleanedMissing = (atsResult.missingKeywords || [])
      .map((k) => String(k).trim())
      .filter((k) => k.length >= 3)
      .filter((k) => /[a-z]/i.test(k))
      .filter((k) => !genericWords.has(k.toLowerCase()))
      .slice(0, 8);
    const merged = [...new Set([...(resume.skills || []), ...cleanedMissing])];
    updateField('skills', merged);
    toast.success('Added top missing keywords into skills');
  };

  const handleImproveSummaryFromATS = async () => {
    setAiLoading((prev) => ({ ...prev, atsSummary: true }));
    try {
      const keywords = (atsResult?.missingKeywords || []).slice(0, 5).join(', ');
      const summaryText = (resume.summary || '')
        .replace(/include these keywords naturally:[^.]*/gi, '')
        .trim();
      if (!summaryText) {
        toast.error('Write a summary first');
        return;
      }
      const { data } = await api.post('/ai/improve-text', {
        text: summaryText,
        context: keywords
          ? `professional summary with natural integration of: ${keywords}`
          : 'professional summary',
      });
      updateField('summary', data.result);
      toast.success('Summary improved for ATS');
    } catch {
      toast.error('Failed to improve summary');
    } finally {
      setAiLoading((prev) => ({ ...prev, atsSummary: false }));
    }
  };

  const handleCleanSummary = () => {
    const original = (resume.summary || '').trim();
    if (!original) {
      toast.error('Summary is empty');
      return;
    }

    const cleaned = original
      .replace(/include these keywords naturally:[^.]*(\.)?/gi, ' ')
      .replace(/add missing keywords naturally:[^.]*(\.)?/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned || cleaned === original) {
      toast.success('Summary is already clean');
      return;
    }

    updateField('summary', cleaned);
    toast.success('Summary cleaned');
  };

  const getCriticalExportWarnings = () => {
    const warnings = [];
    if (!resume.personalInfo?.fullName || !resume.personalInfo?.email || !resume.personalInfo?.phone) {
      warnings.push('Contact details are incomplete.');
    }
    if (!(resume.summary || '').trim()) {
      warnings.push('Professional summary is missing.');
    }
    if (!(resume.experience || []).length) {
      warnings.push('Work experience section is empty.');
    }
    if ((resume.skills || []).length < 4) {
      warnings.push('Skills section has very few keywords.');
    }
    return warnings;
  };

  const handleDownloadPDF = () => {
    const warnings = getCriticalExportWarnings();
    if (warnings.length > 0) {
      toast.warning(`ATS warning: ${warnings[0]}`);
    }
    printResume();
  };

  const handleCopyAtsCurl = async () => {
    const sampleJD = (resume.jobDescription || 'Paste job description here').replace(/\n/g, ' ');
    const curlCommand = `curl -X POST "http://localhost:5001/api/resumes/${id}/ats-analyze" -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json" -d '{"jobDescription":"${sampleJD.replace(/"/g, '\\"')}" }'`;
    try {
      await navigator.clipboard.writeText(curlCommand);
      toast.success('ATS curl command copied');
    } catch {
      toast.error('Failed to copy curl command');
    }
  };

  // Sections navigation
  const sections = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'jobDescription', label: 'Job Description' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-dark-500 text-sm">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-dark-900/90 backdrop-blur-xl border-b border-dark-100 dark:border-dark-800 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 rounded-lg text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors">
              <HiOutlineArrowLeft className="w-5 h-5" />
            </Link>
            <input
              type="text"
              value={resume.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none text-dark-900 dark:text-white w-48 sm:w-auto"
              placeholder="Resume title"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors hidden sm:block"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-dark-200 dark:bg-dark-700 hidden sm:block mx-1"></div>
            
            {/* Template selector */}
            <select
              value={resume.template}
              onChange={(e) => updateField('template', e.target.value)}
              className="hidden sm:block text-sm bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-3 py-1.5 text-dark-700 dark:text-dark-300 outline-none"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
              <option value="ats">ATS (Table)</option>
            </select>
            <button
              onClick={handleDownloadPDF}
              className="btn-secondary text-sm !px-3 sm:!px-4 !py-2"
              title="Download PDF"
            >
              <HiOutlineDownload className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handleAIGenerateResume}
              disabled={!!aiLoading.generateResume || saving || isAutosaving}
              className="btn-secondary text-sm !px-3 sm:!px-4 !py-2 disabled:opacity-60"
              title="Generate resume content with AI"
            >
              {aiLoading.generateResume ? 'Generating...' : (
                <>
                  <HiOutlineSparkles className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Generate Resume</span>
                </>
              )}
            </button>
            <button
              onClick={handleAnalyzeATS}
              disabled={atsLoading || isAutosaving}
              className="btn-secondary text-sm !px-3 sm:!px-4 !py-2 disabled:opacity-60"
              title="Analyze ATS score"
            >
              {atsLoading ? 'Analyzing...' : 'Analyze ATS'}
            </button>
            <button
              onClick={handleCopyAtsCurl}
              className="btn-secondary text-sm !px-3 !py-2"
              title="Copy ATS endpoint curl"
            >
              <HiOutlineClipboardCopy className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Copy ATS Curl</span>
            </button>
            <span className="text-xs text-dark-500 dark:text-dark-400 hidden sm:block mr-2 font-medium">
              {isAutosaving ? 'Autosaving...' : 'All changes saved'}
            </span>
            <button
              onClick={handleSave}
              disabled={saving || isAutosaving}
              className="btn-primary text-sm !px-4 !py-2 disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <HiOutlineSave className="w-4 h-4 mr-1.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-14 flex h-screen">
        {/* LEFT: Form Panel */}
        <div className="w-full lg:w-1/2 overflow-y-auto">
          {/* Section Tabs */}
          <div className="sticky top-0 z-10 bg-dark-50 dark:bg-dark-950 border-b border-dark-100 dark:border-dark-800 px-4 pt-3">
            <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeSection === s.id
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Personal Info Section */}
            {activeSection === 'personal' && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">Full Name</label>
                    <input type="text" value={resume.personalInfo?.fullName || ''} onChange={(e) => updatePersonalInfo('fullName', e.target.value)} className="input-field" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">Email</label>
                    <input type="email" value={resume.personalInfo?.email || ''} onChange={(e) => updatePersonalInfo('email', e.target.value)} className="input-field" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">Phone</label>
                    <input type="tel" value={resume.personalInfo?.phone || ''} onChange={(e) => updatePersonalInfo('phone', e.target.value)} className="input-field" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">Location</label>
                    <input type="text" value={resume.personalInfo?.location || ''} onChange={(e) => updatePersonalInfo('location', e.target.value)} className="input-field" placeholder="San Francisco, CA" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">LinkedIn</label>
                    <input type="url" value={resume.personalInfo?.linkedin || ''} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} className="input-field" placeholder="linkedin.com/in/johndoe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">Website</label>
                    <input type="url" value={resume.personalInfo?.website || ''} onChange={(e) => updatePersonalInfo('website', e.target.value)} className="input-field" placeholder="johndoe.dev" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-600 dark:text-dark-400 mb-1">GitHub</label>
                    <input type="url" value={resume.personalInfo?.github || ''} onChange={(e) => updatePersonalInfo('github', e.target.value)} className="input-field" placeholder="github.com/johndoe" />
                  </div>
                </div>
              </div>
            )}

            {/* Summary Section */}
            {activeSection === 'summary' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Professional Summary</h2>
                  <button
                    onClick={handleAISummary}
                    disabled={aiLoading.summary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                  >
                    {aiLoading.summary ? (
                      <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                    ) : (
                      <HiOutlineSparkles className="w-4 h-4" />
                    )}
                    Generate with AI
                  </button>
                </div>
                <textarea
                  value={resume.summary || ''}
                  onChange={(e) => updateField('summary', e.target.value)}
                  className="input-field min-h-[150px] resize-none"
                  placeholder="Write a brief professional summary highlighting your key strengths and career objectives..."
                  rows={6}
                />
              </div>
            )}

            {/* Experience Section */}
            {activeSection === 'experience' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Work Experience</h2>
                  <button onClick={() => addArrayItem('experience', emptyExperience)} className="btn-secondary text-sm !px-3 !py-1.5">
                    <HiOutlinePlus className="w-4 h-4 mr-1" /> Add
                  </button>
                </div>
                {(resume.experience || []).map((exp, index) => (
                  <div key={index} className="bg-white dark:bg-dark-900 rounded-xl border border-dark-100 dark:border-dark-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark-500">Experience {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAIImprove('experience', index, 'description')}
                          disabled={aiLoading[`experience_${index}_description`]}
                          className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
                          title="Improve with AI"
                        >
                          {aiLoading[`experience_${index}_description`] ? (
                            <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                          ) : (
                            <HiOutlineSparkles className="w-4 h-4" />
                          )}
                        </button>
                        <button onClick={() => removeArrayItem('experience', index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" value={exp.company} onChange={(e) => updateArrayItem('experience', index, 'company', e.target.value)} className="input-field text-sm" placeholder="Company" />
                      <input type="text" value={exp.position} onChange={(e) => updateArrayItem('experience', index, 'position', e.target.value)} className="input-field text-sm" placeholder="Position" />
                      <input type="text" value={exp.location} onChange={(e) => updateArrayItem('experience', index, 'location', e.target.value)} className="input-field text-sm" placeholder="Location" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={exp.startDate} onChange={(e) => updateArrayItem('experience', index, 'startDate', e.target.value)} className="input-field text-sm" placeholder="Start" />
                        <input type="text" value={exp.endDate} onChange={(e) => updateArrayItem('experience', index, 'endDate', e.target.value)} className="input-field text-sm" placeholder="End" disabled={exp.current} />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <input type="checkbox" checked={exp.current} onChange={(e) => updateArrayItem('experience', index, 'current', e.target.checked)} className="rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                      Currently working here
                    </label>
                    <textarea value={exp.description} onChange={(e) => updateArrayItem('experience', index, 'description', e.target.value)} className="input-field text-sm min-h-[80px] resize-none" placeholder="Describe your role, responsibilities, and achievements..." rows={3} />
                  </div>
                ))}
              </div>
            )}

            {/* Education Section */}
            {activeSection === 'education' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Education</h2>
                  <button onClick={() => addArrayItem('education', emptyEducation)} className="btn-secondary text-sm !px-3 !py-1.5">
                    <HiOutlinePlus className="w-4 h-4 mr-1" /> Add
                  </button>
                </div>
                {(resume.education || []).map((edu, index) => (
                  <div key={index} className="bg-white dark:bg-dark-900 rounded-xl border border-dark-100 dark:border-dark-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark-500">Education {index + 1}</span>
                      <button onClick={() => removeArrayItem('education', index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" value={edu.institution} onChange={(e) => updateArrayItem('education', index, 'institution', e.target.value)} className="input-field text-sm" placeholder="Institution" />
                      <input type="text" value={edu.degree} onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)} className="input-field text-sm" placeholder="Degree" />
                      <input type="text" value={edu.field} onChange={(e) => updateArrayItem('education', index, 'field', e.target.value)} className="input-field text-sm" placeholder="Field of Study" />
                      <input type="text" value={edu.gpa} onChange={(e) => updateArrayItem('education', index, 'gpa', e.target.value)} className="input-field text-sm" placeholder="GPA" />
                      <input type="text" value={edu.startDate} onChange={(e) => updateArrayItem('education', index, 'startDate', e.target.value)} className="input-field text-sm" placeholder="Start Year" />
                      <input type="text" value={edu.endDate} onChange={(e) => updateArrayItem('education', index, 'endDate', e.target.value)} className="input-field text-sm" placeholder="End Year" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills Section */}
            {activeSection === 'skills' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Skills</h2>
                  <button
                    onClick={handleAISuggestSkills}
                    disabled={aiLoading.skills}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                  >
                    {aiLoading.skills ? (
                      <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                    ) : (
                      <HiOutlineSparkles className="w-4 h-4" />
                    )}
                    Suggest with AI
                  </button>
                </div>
                {/* Current skills as tags */}
                <div className="flex flex-wrap gap-2">
                  {(resume.skills || []).map((skill, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-medium">
                      {skill}
                      <button onClick={() => {
                        const newSkills = [...resume.skills];
                        newSkills.splice(index, 1);
                        updateField('skills', newSkills);
                      }} className="text-primary-400 hover:text-red-500 transition-colors">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {/* Add skill input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field text-sm flex-1"
                    placeholder="Type a skill and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        updateField('skills', [...(resume.skills || []), e.target.value.trim()]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Projects Section */}
            {activeSection === 'projects' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Projects</h2>
                  <button onClick={() => addArrayItem('projects', emptyProject)} className="btn-secondary text-sm !px-3 !py-1.5">
                    <HiOutlinePlus className="w-4 h-4 mr-1" /> Add
                  </button>
                </div>
                {(resume.projects || []).map((proj, index) => (
                  <div key={index} className="bg-white dark:bg-dark-900 rounded-xl border border-dark-100 dark:border-dark-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark-500">Project {index + 1}</span>
                      <button onClick={() => removeArrayItem('projects', index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" value={proj.name} onChange={(e) => updateArrayItem('projects', index, 'name', e.target.value)} className="input-field text-sm" placeholder="Project Name" />
                      <input type="text" value={proj.technologies} onChange={(e) => updateArrayItem('projects', index, 'technologies', e.target.value)} className="input-field text-sm" placeholder="Technologies" />
                      <input type="url" value={proj.link} onChange={(e) => updateArrayItem('projects', index, 'link', e.target.value)} className="input-field text-sm sm:col-span-2" placeholder="Project URL" />
                    </div>
                    <textarea value={proj.description} onChange={(e) => updateArrayItem('projects', index, 'description', e.target.value)} className="input-field text-sm min-h-[60px] resize-none" placeholder="Brief description..." rows={2} />
                  </div>
                ))}
              </div>
            )}

            {/* Certifications Section */}
            {activeSection === 'certifications' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Certifications</h2>
                  <button onClick={() => addArrayItem('certifications', emptyCertification)} className="btn-secondary text-sm !px-3 !py-1.5">
                    <HiOutlinePlus className="w-4 h-4 mr-1" /> Add
                  </button>
                </div>
                {(resume.certifications || []).map((cert, index) => (
                  <div key={index} className="bg-white dark:bg-dark-900 rounded-xl border border-dark-100 dark:border-dark-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark-500">Certification {index + 1}</span>
                      <button onClick={() => removeArrayItem('certifications', index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" value={cert.name} onChange={(e) => updateArrayItem('certifications', index, 'name', e.target.value)} className="input-field text-sm" placeholder="Certification Name" />
                      <input type="text" value={cert.issuer} onChange={(e) => updateArrayItem('certifications', index, 'issuer', e.target.value)} className="input-field text-sm" placeholder="Issuing Organization" />
                      <input type="text" value={cert.date} onChange={(e) => updateArrayItem('certifications', index, 'date', e.target.value)} className="input-field text-sm" placeholder="Date" />
                      <input type="url" value={cert.link} onChange={(e) => updateArrayItem('certifications', index, 'link', e.target.value)} className="input-field text-sm" placeholder="Certificate URL" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'jobDescription' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Target Job Description</h2>
                  <button
                    onClick={handleAnalyzeATS}
                    disabled={atsLoading}
                    className="btn-secondary text-sm !px-3 !py-1.5 disabled:opacity-60"
                  >
                    {atsLoading ? 'Analyzing...' : 'Analyze ATS'}
                  </button>
                </div>
                <textarea
                  value={resume.jobDescription || ''}
                  onChange={(e) => updateField('jobDescription', e.target.value)}
                  className="input-field min-h-[220px] resize-y"
                  placeholder="Paste the target job description (optional). ATS scoring will match your resume against this role."
                  rows={9}
                />
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  Tip: Add the exact role description to get stronger keyword match suggestions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className="hidden lg:block w-1/2 bg-dark-100 dark:bg-dark-900 border-l border-dark-200 dark:border-dark-800 overflow-y-auto p-6">
          <div className="max-w-[800px] mx-auto space-y-4">
            <ATSPanel
              atsResult={atsResult}
              atsLoading={atsLoading}
              onAnalyze={handleAnalyzeATS}
              onApplyMissingSkills={handleApplyMissingSkills}
              onImproveSummary={handleImproveSummaryFromATS}
              onCleanSummary={handleCleanSummary}
              improvingSummary={!!aiLoading.atsSummary}
            />
            <div ref={componentRef}>
            <ResumePreview resume={resume} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ATSPanel({ atsResult, atsLoading, onAnalyze, onApplyMissingSkills, onImproveSummary, onCleanSummary, improvingSummary }) {
  if (!atsResult) {
    return (
      <div className="bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-dark-900 dark:text-white">ATS Check</h3>
          <button onClick={onAnalyze} disabled={atsLoading} className="btn-secondary text-xs !px-3 !py-1.5 disabled:opacity-60">
            {atsLoading ? 'Analyzing...' : 'Run Check'}
          </button>
        </div>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Run ATS analysis to get score, keyword match, and priority improvements.
        </p>
      </div>
    );
  }

  const categoryLabels = [
    ['keywords', 'Keywords'],
    ['structure', 'Structure'],
    ['impact', 'Impact'],
    ['formatting', 'Formatting'],
  ];
  const score = atsResult.overallScore || 0;
  const scoreColor =
    score >= 80 ? 'text-emerald-600' : score >= 65 ? 'text-amber-500' : 'text-red-500';
  const scoreBarColor =
    score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-xl p-4 space-y-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-dark-900 dark:text-white">ATS Score</h3>
          <p className="text-xs text-dark-500 dark:text-dark-400">
            Last analyzed: {atsResult.analyzedAt ? new Date(atsResult.analyzedAt).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="text-right min-w-[96px]">
          <p className={`text-3xl font-bold ${scoreColor}`}>{score}/100</p>
          <p className="text-xs text-dark-500 dark:text-dark-400">
            {score >= 80 ? 'Strong' : score >= 65 ? 'Needs tuning' : 'Needs work'}
          </p>
          <button onClick={onAnalyze} disabled={atsLoading} className="btn-secondary text-xs !px-2.5 !py-1 disabled:opacity-60">
            {atsLoading ? 'Analyzing...' : 'Recheck'}
          </button>
        </div>
      </div>

      <div className="h-2.5 rounded-full bg-dark-100 dark:bg-dark-800 overflow-hidden">
        <div className={`h-full ${scoreBarColor} transition-all duration-500`} style={{ width: `${Math.max(5, score)}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {categoryLabels.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-dark-100 dark:border-dark-800 px-3 py-2 bg-dark-50/60 dark:bg-dark-850/40">
            <p className="text-xs text-dark-500 dark:text-dark-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-dark-900 dark:text-white">{atsResult.categoryScores?.[key] || 0}</p>
          </div>
        ))}
      </div>

      {!!atsResult.criticalWarnings?.length && (
        <div>
          <p className="text-xs font-medium text-red-500 mb-1">Critical fixes</p>
          <ul className="space-y-1">
            {atsResult.criticalWarnings.slice(0, 3).map((warning) => (
              <li key={warning} className="text-xs text-dark-600 dark:text-dark-300">- {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {!!atsResult.missingKeywords?.length && (
        <div>
          <p className="text-xs font-medium text-amber-600 mb-1.5">Missing Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {atsResult.missingKeywords.slice(0, 10).map((keyword) => (
              <span key={keyword} className="px-2 py-0.5 rounded-md text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={onApplyMissingSkills} className="btn-secondary text-xs !px-3 !py-1.5">
          Add Missing Keywords to Skills
        </button>
        <button onClick={onImproveSummary} disabled={improvingSummary} className="btn-secondary text-xs !px-3 !py-1.5 disabled:opacity-60">
          {improvingSummary ? 'Improving...' : 'Improve Summary for ATS'}
        </button>
        <button onClick={onCleanSummary} className="btn-secondary text-xs !px-3 !py-1.5">
          Clean Summary Text
        </button>
      </div>

      {!!atsResult.matchedKeywords?.length && (
        <div>
          <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
            <HiOutlineBadgeCheck className="w-4 h-4" /> Matched Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {atsResult.matchedKeywords.slice(0, 8).map((keyword) => (
              <span key={keyword} className="px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!atsResult.suggestions?.length && (
        <div>
          <p className="text-xs font-medium text-primary-600 mb-1.5">Top ATS Suggestions</p>
          <div className="space-y-1.5">
            {atsResult.suggestions.slice(0, 4).map((suggestion) => (
              <div
                key={suggestion}
                className="text-xs text-dark-700 dark:text-dark-300 rounded-md border border-dark-100 dark:border-dark-800 px-2.5 py-1.5 bg-white/70 dark:bg-dark-900/30"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// Resume Preview Component
// ========================================
function ResumePreview({ resume }) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, template = 'modern' } = resume;

  if (template === 'ats') {
    const sectionBar = (title) => (
      <div className="mt-4 bg-slate-200 border border-slate-300 px-3 py-1 text-center font-bold text-xs tracking-wider uppercase">
        {title}
      </div>
    );

    const contactLine = [
      personalInfo?.email ? `Email: ${personalInfo.email}` : null,
      personalInfo?.phone ? `Phone: ${personalInfo.phone}` : null,
      personalInfo?.location ? personalInfo.location : null,
    ].filter(Boolean);

    const linksLine = [
      personalInfo?.linkedin || null,
      personalInfo?.github || null,
      personalInfo?.website || null,
    ].filter(Boolean);

    const educationRows = (education || []).map((edu) => {
      const year = (edu.endDate || edu.startDate || '').toString().trim();
      const degree = `${edu.degree || ''}${edu.field ? ` (${edu.field})` : ''}`.trim();
      const institute = (edu.institution || '').trim();
      const cgpa = (edu.gpa || '').trim();
      return { year, degree, institute, cgpa };
    });

    const safeSummary = (summary || '').trim();

    return (
      <div className="bg-white shadow-elevated rounded-lg p-8 min-h-[900px] text-black font-serif" style={{ fontSize: '12.5px', lineHeight: '1.55' }}>
        {/* Header */}
        <div className="text-center">
          <div className="font-bold uppercase tracking-wide text-sm">
            {(personalInfo?.fullName || 'Your Name').toUpperCase()}
          </div>
          {contactLine.length > 0 && (
            <div className="mt-1 text-xs">
              {contactLine.map((item, idx) => (
                <span key={item}>
                  {idx > 0 ? ' | ' : ''}
                  {item}
                </span>
              ))}
            </div>
          )}
          {linksLine.length > 0 && (
            <div className="mt-1 text-xs text-blue-700 break-all">
              {linksLine.map((item, idx) => (
                <span key={item}>
                  {idx > 0 ? ' | ' : ''}
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Summary (no bar in your sample, but keep clean paragraph) */}
        {safeSummary && (
          <p className="mt-3 text-justify">
            {safeSummary}
          </p>
        )}

        {/* Education table */}
        {educationRows.length > 0 && (
          <>
            {sectionBar('Education')}
            <div className="border border-slate-300 border-t-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 w-[70px]">Year</th>
                    <th className="text-left px-3 py-2">Degree</th>
                    <th className="text-left px-3 py-2">Institute</th>
                    <th className="text-right px-3 py-2 w-[110px]">CGPA/Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {educationRows.map((row, i) => (
                    <tr key={`${row.institute}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 align-top">{row.year || '—'}</td>
                      <td className="px-3 py-2 align-top">{row.degree || '—'}</td>
                      <td className="px-3 py-2 align-top">{row.institute || '—'}</td>
                      <td className="px-3 py-2 align-top text-right font-semibold">{row.cgpa || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Experience */}
        {(experience || []).length > 0 && (
          <>
            {sectionBar('Experience')}
            <div className="border border-slate-300 border-t-0 px-4 py-3">
              <ul className="list-disc pl-5 space-y-2">
                {experience.map((exp, i) => {
                  const title = [exp.position, exp.company].filter(Boolean).join(' — ');
                  const dates = `${exp.startDate || ''}${exp.startDate && (exp.endDate || exp.current) ? ' — ' : ''}${exp.current ? 'Present' : (exp.endDate || '')}`.trim();
                  return (
                    <li key={i}>
                      <div className="flex justify-between gap-3">
                        <div className="font-bold">{title || 'Experience'}</div>
                        <div className="text-xs whitespace-nowrap">{dates}</div>
                      </div>
                      {exp.location && <div className="text-xs">{exp.location}</div>}
                      {exp.description && <div className="mt-1">{exp.description}</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* Projects */}
        {(projects || []).length > 0 && (
          <>
            {sectionBar('Projects')}
            <div className="border border-slate-300 border-t-0 px-4 py-3">
              <ul className="list-disc pl-5 space-y-2">
                {projects.map((proj, i) => (
                  <li key={i}>
                    <span className="font-bold">{proj.name || 'Project'}</span>
                    {proj.description ? <span> : {proj.description}</span> : null}
                    {proj.technologies ? <span className="text-xs"> (Tech: {proj.technologies})</span> : null}
                    {proj.link ? <div className="text-xs text-blue-700 break-all">{proj.link}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Skills & Expertise */}
        {(skills || []).length > 0 && (
          <>
            {sectionBar('Skills and Expertise')}
            <div className="border border-slate-300 border-t-0 px-4 py-3">
              <div className="text-xs">
                <span className="font-bold">Skills</span>: {skills.filter(Boolean).join(' | ')}
              </div>
            </div>
          </>
        )}

        {/* Certifications */}
        {(certifications || []).length > 0 && (
          <>
            {sectionBar('Certifications')}
            <div className="border border-slate-300 border-t-0 px-4 py-3">
              <ul className="list-disc pl-5 space-y-1.5">
                {certifications.map((cert, i) => (
                  <li key={i}>
                    {cert.name}
                    {cert.issuer ? ` — ${cert.issuer}` : ''}
                    {cert.date ? ` (${cert.date})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }

  const tpl = {
    modern: {
      container: "font-sans",
      header: "mb-6 pb-4 border-b-2 border-primary-500",
      name: "text-2xl font-bold text-dark-900 mb-1 tracking-wide",
      contact: "flex items-center gap-3 text-xs text-dark-500 flex-wrap",
      links: "flex items-center gap-3 text-xs text-primary-600 mt-1 flex-wrap",
      section: "mb-5",
      title: "text-sm font-bold uppercase tracking-wider text-primary-700 mb-2 border-b border-dark-200 pb-1",
      itemTitle: "font-semibold text-dark-900",
      itemSub: "text-dark-600",
      date: "text-xs text-dark-500 whitespace-nowrap pl-4 text-right min-w-[120px]",
      desc: "text-dark-700 mt-1",
      skillBox: "flex flex-wrap gap-1.5",
      skill: "px-2.5 py-0.5 bg-dark-50 rounded text-xs text-dark-700 border border-dark-100",
    },
    classic: {
      container: "font-serif",
      header: "text-center mb-6 pb-4 border-b border-black",
      name: "text-3xl font-bold text-black mb-1 uppercase tracking-widest",
      contact: "flex items-center justify-center gap-3 text-xs text-black flex-wrap",
      links: "flex items-center justify-center gap-3 text-xs text-black mt-1 flex-wrap",
      section: "mb-5",
      title: "text-sm font-bold uppercase tracking-widest text-black mb-2 border-b border-black pb-1 text-center mt-6",
      itemTitle: "font-bold text-black",
      itemSub: "text-black",
      date: "text-xs italic text-black whitespace-nowrap pl-4 text-right min-w-[120px]",
      desc: "text-black mt-1",
      skillBox: "flex flex-wrap gap-x-3 gap-y-1 justify-center",
      skill: "text-xs text-black list-item ml-4",
    },
    minimal: {
      container: "font-sans",
      header: "mb-8",
      name: "text-4xl font-light text-dark-900 mb-2",
      contact: "flex items-center gap-3 text-xs text-dark-500 flex-wrap",
      links: "flex items-center gap-3 text-xs text-dark-500 mt-1 flex-wrap",
      section: "mb-6",
      title: "text-xs font-bold uppercase tracking-widest text-dark-400 mb-4",
      itemTitle: "font-medium text-dark-900",
      itemSub: "text-dark-500",
      date: "text-xs text-dark-400 whitespace-nowrap pl-4 text-right min-w-[120px]",
      desc: "text-dark-600 mt-1.5 leading-relaxed",
      skillBox: "flex flex-wrap gap-x-4 gap-y-2",
      skill: "text-sm text-dark-700",
    }
  };

  const style = tpl[template] || tpl.modern;

  return (
    <div className={`bg-white shadow-elevated rounded-lg p-8 min-h-[900px] text-dark-900 ${style.container}`} style={{ fontSize: '13px', lineHeight: '1.6' }}>
      {/* Header */}
      <div className={style.header}>
        <h1 className={style.name}>
          {personalInfo?.fullName || 'Your Name'}
        </h1>
        <div className={style.contact}>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.location && <span>• {personalInfo.location}</span>}
        </div>
        <div className={style.links}>
          {personalInfo?.linkedin && <span className="break-all">{personalInfo.linkedin}</span>}
          {personalInfo?.github && <span className="break-all">• {personalInfo.github}</span>}
          {personalInfo?.website && <span className="break-all">• {personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className={style.section}>
          <h2 className={style.title}>Professional Summary</h2>
          <p className={style.desc}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <div className={style.section}>
          <h2 className={style.title}>Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className={style.itemTitle}>{exp.position || 'Position'}</p>
                  <p className={`${style.itemSub} break-words`}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                </div>
                <p className={style.date}>
                  {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' — ' : ''}{exp.current ? 'Present' : exp.endDate}
                </p>
              </div>
              {exp.description && <p className={style.desc}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <div className={style.section}>
          <h2 className={style.title}>Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className={style.itemTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                  <p className={`${style.itemSub} break-words`}>{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</p>
                </div>
                <p className={style.date}>
                  {edu.startDate}{edu.startDate && edu.endDate ? ' — ' : ''}{edu.endDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills?.length > 0 && (
        <div className={style.section}>
          <h2 className={style.title}>Skills</h2>
          <div className={style.skillBox}>
            {skills.map((skill, i) => (
              <span key={i} className={style.skill}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <div className={style.section}>
          <h2 className={style.title}>Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <p className={style.itemTitle}>
                {proj.name}
                {proj.technologies && <span className="font-normal text-dark-500 text-xs ml-2">({proj.technologies})</span>}
              </p>
              {proj.description && <p className={style.desc}>{proj.description}</p>}
              {proj.link && <p className="text-primary-600 text-xs mt-0.5">{proj.link}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <div className={style.section}>
          <h2 className={style.title}>Certifications</h2>
          {certifications.map((cert, i) => (
            <div key={i} className="mb-2">
              <p className={style.itemTitle}>{cert.name}</p>
              <p className={`${style.itemSub} text-xs`}>{cert.issuer}{cert.date ? ` • ${cert.date}` : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
