import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { HiOutlineMenu, HiOutlineX, HiOutlineLogout, HiOutlineUser, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

/**
 * Navbar
 * Premium top navigation bar with responsive mobile menu.
 * Shows different links based on auth state.
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  // Don't show navbar on the resume builder page (it has its own header)
  if (location.pathname.startsWith('/builder/')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-950/80 backdrop-blur-xl border-b border-dark-100 dark:border-dark-800">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-soft group-hover:shadow-elevated transition-shadow duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">ResuAI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-ghost text-sm">
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-dark-200 dark:border-dark-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <HiOutlineUser className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    title="Logout"
                  >
                    <HiOutlineLogout className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/team" className="btn-ghost text-sm">
                  Team App
                </Link>
                <Link to="/login" className="btn-ghost text-sm">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary text-sm !px-5 !py-2.5">
                  Get Started Free
                </Link>
              </>
            )}
            
            {/* Theme Toggle Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2 ml-2 rounded-lg text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            >
              {isDarkMode ? <HiOutlineSun className="w-6 h-6" /> : <HiOutlineMoon className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            >
              {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-100 dark:border-dark-800 bg-white dark:bg-dark-950 animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <HiOutlineUser className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">{user?.name}</p>
                    <p className="text-xs text-dark-500">{user?.email}</p>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/team"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 font-medium transition-colors"
                >
                  Team App
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl bg-primary-600 text-white text-center font-medium hover:bg-primary-700 transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
