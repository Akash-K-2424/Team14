import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import {
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineClock,
  HiOutlineTemplate,
} from 'react-icons/hi';

/**
 * Dashboard Page
 * Shows all user resumes with create/edit/delete actions.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes');
      setResumes(data);
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/resumes', {
        title: `Resume ${resumes.length + 1}`,
      });
      toast.success('Resume created!');
      navigate(`/builder/${data._id}`);
    } catch (error) {
      toast.error('Failed to create resume');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/resumes/${id}`);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted');
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const templateColors = {
    modern: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
    classic: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    minimal: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  };

  return (
    <div className="page-wrapper min-h-screen bg-dark-50 dark:bg-dark-950 pt-24 pb-12">
      <div className="section-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-dark-500 dark:text-dark-400">
            Manage your resumes and create new ones.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-dark-100 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{resumes.length}</p>
                <p className="text-sm text-dark-500">Total Resumes</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-dark-100 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <HiOutlineTemplate className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">3</p>
                <p className="text-sm text-dark-500">Templates</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-dark-100 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <HiOutlineClock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">
                  {resumes.length > 0 ? formatDate(resumes[0]?.updatedAt) : '—'}
                </p>
                <p className="text-sm text-dark-500">Last Updated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark-900 dark:text-white">Your Resumes</h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary text-sm !px-5 disabled:opacity-60"
          >
            {creating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              <>
                <HiOutlinePlus className="w-5 h-5 mr-1.5" />
                New Resume
              </>
            )}
          </button>
        </div>

        {/* Resume Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-dark-500 text-sm">Loading your resumes...</p>
            </div>
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
              <HiOutlineDocumentText className="w-10 h-10 text-dark-400" />
            </div>
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
              No resumes yet
            </h3>
            <p className="text-dark-500 dark:text-dark-400 mb-6 max-w-sm mx-auto">
              Create your first resume and start building your professional profile with AI assistance.
            </p>
            <button onClick={handleCreate} disabled={creating} className="btn-primary">
              <HiOutlinePlus className="w-5 h-5 mr-1.5" />
              Create your first resume
            </button>
          </div>
        ) : (
          /* Resume Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="group bg-white dark:bg-dark-900 rounded-2xl border border-dark-100 dark:border-dark-800 hover:border-primary-200 dark:hover:border-primary-800/40 hover:shadow-elevated transition-all duration-300 overflow-hidden"
              >
                {/* Card Top — Resume preview placeholder */}
                <div className="h-40 bg-gradient-to-br from-dark-50 to-dark-100 dark:from-dark-800 dark:to-dark-850 p-4 relative">
                  <div className="space-y-2">
                    <div className="h-3 w-1/2 bg-dark-200 dark:bg-dark-700 rounded-full"></div>
                    <div className="h-2 w-3/4 bg-dark-150 dark:bg-dark-750 rounded-full opacity-60"></div>
                    <div className="h-2 w-2/3 bg-dark-150 dark:bg-dark-750 rounded-full opacity-40"></div>
                    <div className="h-2 w-5/6 bg-dark-150 dark:bg-dark-750 rounded-full opacity-30"></div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${templateColors[resume.template] || templateColors.modern}`}>
                      {resume.template}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <h3 className="font-semibold text-dark-900 dark:text-white mb-1 truncate">
                    {resume.title}
                  </h3>
                  <p className="text-sm text-dark-400 flex items-center gap-1.5 mb-4">
                    <HiOutlineClock className="w-4 h-4" />
                    Updated {formatDate(resume.updatedAt)}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/builder/${resume._id}`}
                      className="flex-1 btn-primary text-sm !py-2.5 !px-4"
                    >
                      <HiOutlinePencil className="w-4 h-4 mr-1.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(resume._id, resume.title)}
                      className="p-2.5 rounded-xl text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      title="Delete resume"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
