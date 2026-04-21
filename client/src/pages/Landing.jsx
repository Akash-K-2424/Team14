import { Link } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineDocumentText, HiOutlineDownload, HiOutlineLightningBolt, HiOutlineTemplate, HiOutlineShieldCheck } from 'react-icons/hi';

/**
 * Landing Page
 * Modern SaaS-style hero with features grid and CTA.
 */
export default function Landing() {
  const features = [
    {
      icon: <HiOutlineSparkles className="w-6 h-6" />,
      title: 'AI-Powered Writing',
      description: 'Generate professional summaries and improve descriptions with one click using AI.',
      color: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: <HiOutlineDocumentText className="w-6 h-6" />,
      title: 'Real-Time Preview',
      description: 'See exactly how your resume looks as you type. No surprises, no guesswork.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: <HiOutlineDownload className="w-6 h-6" />,
      title: 'PDF Export',
      description: 'Download your polished resume as a beautifully formatted PDF in seconds.',
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: <HiOutlineTemplate className="w-6 h-6" />,
      title: 'Multiple Templates',
      description: 'Choose from professionally designed templates — Modern, Classic, or Minimal.',
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      icon: <HiOutlineLightningBolt className="w-6 h-6" />,
      title: 'ATS-Friendly',
      description: 'Optimized layouts that pass through Applicant Tracking Systems with ease.',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
    },
    {
      icon: <HiOutlineShieldCheck className="w-6 h-6" />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely. We never share your information.',
      color: 'from-teal-500 to-cyan-500',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
  ];

  return (
    <div className="page-wrapper">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 dark:bg-primary-800/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>

        <div className="section-container relative z-10 pt-24 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 mb-8 animate-slide-up">
              <HiOutlineSparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                Powered by Artificial Intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Build Your Perfect
              <br />
              <span className="gradient-text">Resume with AI</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-dark-500 dark:text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Create professional, ATS-friendly resumes in minutes. Let AI write compelling descriptions,
              suggest skills, and optimize your content for your dream job.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup" className="btn-primary text-lg !px-8 !py-4 w-full sm:w-auto">
                Start Building — It's Free
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/login" className="btn-secondary text-lg !px-8 !py-4 w-full sm:w-auto">
                I have an account
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-dark-400 dark:text-dark-500 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {['bg-primary-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'].map((color, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-white dark:border-dark-900`}></div>
                  ))}
                </div>
                <span className="ml-2 font-medium">1,000+ users</span>
              </div>
              <span className="text-dark-300 dark:text-dark-600">•</span>
              <span>⭐ 4.9/5 rating</span>
            </div>
          </div>

          {/* Hero Preview - Resume mockup */}
          <div className="mt-16 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-indigo-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative glass-card p-6 sm:p-8 rounded-2xl">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 ml-3 h-8 bg-dark-100 dark:bg-dark-800 rounded-lg flex items-center px-3">
                    <span className="text-xs text-dark-400">app.resuai.com/builder</span>
                  </div>
                </div>
                {/* Resume preview content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-3">
                    <div className="h-4 w-3/4 bg-primary-200 dark:bg-primary-800/30 rounded-full"></div>
                    <div className="h-3 w-full bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                    <div className="h-3 w-2/3 bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                    <div className="h-3 w-5/6 bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                    <div className="mt-4 h-4 w-1/2 bg-primary-200 dark:bg-primary-800/30 rounded-full"></div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['w-16', 'w-14', 'w-20', 'w-12', 'w-18', 'w-14'].map((w, i) => (
                        <div key={i} className={`h-6 ${w} bg-primary-100 dark:bg-primary-900/30 rounded-full`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="h-6 w-2/3 bg-dark-800 dark:bg-dark-200 rounded-full"></div>
                    <div className="h-3 w-1/3 bg-dark-200 dark:bg-dark-700 rounded-full"></div>
                    <div className="space-y-2 mt-4">
                      <div className="h-3 w-full bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                      <div className="h-3 w-11/12 bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                      <div className="h-3 w-4/5 bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                    </div>
                    <div className="h-4 w-1/2 bg-primary-200 dark:bg-primary-800/30 rounded-full mt-6"></div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                      <div className="h-3 w-10/12 bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                      <div className="h-3 w-3/4 bg-dark-100 dark:bg-dark-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-dark-950 relative">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-dark-900 dark:text-white">
              Everything you need to land your
              <span className="gradient-text"> dream job</span>
            </h2>
            <p className="text-lg text-dark-500 dark:text-dark-400">
              Powerful features designed to help you create standout resumes, faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-dark-100 dark:border-dark-800 hover:border-primary-200 dark:hover:border-primary-800/40 bg-white dark:bg-dark-900 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 text-primary-600 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-500 dark:text-dark-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-700"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="section-container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to build your perfect resume?
          </h2>
          <p className="text-lg text-primary-100 max-w-xl mx-auto mb-8">
            Join thousands of professionals who've landed their dream jobs with ResuAI.
          </p>
          <Link to="/signup" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-elevated hover:shadow-lg text-lg">
            Get Started — It's Free
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-dark-50 dark:bg-dark-950 border-t border-dark-100 dark:border-dark-800">
        <div className="section-container text-center">
          <p className="text-sm text-dark-400">
            © {new Date().getFullYear()} ResuAI. Built with ❤️ and AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
