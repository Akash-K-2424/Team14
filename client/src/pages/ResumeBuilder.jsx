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
  const { isDarkMode, toggleTheme } = useTheme();
  const componentRef = useRef();
  const lastSavedData = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: resume?.personalInfo?.fullName ? `${resume.personalInfo.fullName} Resume` : 'Resume',
  });

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const { data } = await api.get(`/resumes/${id}`);
        setResume(data);
        lastSavedData.current = JSON.stringify(data);
      } catch (error) {
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
      });
      setResume(data);
      lastSavedData.current = JSON.stringify(data);
      toast.success('Resume saved!');
    } catch (error) {
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
        });
        lastSavedData.current = currentData;
      } catch (error) {
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
      const { data } = await api.post('/ai/generate-summary', {
        jobTitle: resume.personalInfo?.fullName ? `professional` : 'professional',
        experience: resume.experience?.map((e) => e.position).filter(Boolean).join(', '),
        skills: resume.skills?.join(', '),
      });
      updateField('summary', data.result);
      toast.success('Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setAiLoading((p) => ({ ...p, summary: false }));
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
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to suggest skills');
    } finally {
      setAiLoading((p) => ({ ...p, skills: false }));
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
            </select>
            <button
              onClick={() => handlePrint()}
              className="btn-secondary text-sm !px-3 sm:!px-4 !py-2"
              title="Download PDF"
            >
              <HiOutlineDownload className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Download PDF</span>
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
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className="hidden lg:block w-1/2 bg-dark-100 dark:bg-dark-900 border-l border-dark-200 dark:border-dark-800 overflow-y-auto p-6">
          <div className="max-w-[800px] mx-auto" ref={componentRef}>
            <ResumePreview resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Resume Preview Component
// ========================================
function ResumePreview({ resume }) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, template = 'modern' } = resume;

  const tpl = {
    modern: {
      container: "font-sans",
      header: "text-center mb-6 pb-4 border-b-2 border-primary-500",
      name: "text-2xl font-bold text-dark-900 mb-1",
      contact: "flex items-center justify-center gap-3 text-xs text-dark-500 flex-wrap",
      links: "flex items-center justify-center gap-3 text-xs text-primary-600 mt-1 flex-wrap",
      section: "mb-5",
      title: "text-sm font-bold uppercase tracking-wider text-primary-700 mb-2 border-b border-dark-200 pb-1",
      itemTitle: "font-semibold text-dark-900",
      itemSub: "text-dark-600",
      date: "text-xs text-dark-500 whitespace-nowrap",
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
      date: "text-xs italic text-black whitespace-nowrap",
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
      date: "text-xs text-dark-400 whitespace-nowrap",
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
          {personalInfo?.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo?.github && <span>• {personalInfo.github}</span>}
          {personalInfo?.website && <span>• {personalInfo.website}</span>}
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
              <div className="flex justify-between items-start">
                <div>
                  <p className={style.itemTitle}>{exp.position || 'Position'}</p>
                  <p className={style.itemSub}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
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
              <div className="flex justify-between items-start">
                <div>
                  <p className={style.itemTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                  <p className={style.itemSub}>{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</p>
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
