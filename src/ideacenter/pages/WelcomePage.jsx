import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useUserControls } from '../hooks/useCurrentUser.jsx';
import { navigate } from '../hooks/useNav.jsx';

export default function WelcomePage() {
  const { setMockUser } = useUserControls();

  const handleSelectEmployee = () => {
    setMockUser('priya');
    navigate('/employee');
  };

  const handleSelectAdmin = () => {
    setMockUser('meera');
    navigate('/admin');
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-purple-300/30 via-fuchsia-200/20 to-indigo-300/25 blur-3xl rounded-full" />
      </div>

      {/* Main Heading Section */}
      <div className="w-full text-center max-w-3xl mx-auto mb-10 anim-hero">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-display mb-2">
          GWC Spark Idea Innovation
        </h1>
        <p className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
          Idea Submission
        </p>
      </div>

      {/* Two Simple Login Cards */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 anim-kpi">
        {/* Card 1: Login as Employee */}
        <div
          onClick={handleSelectEmployee}
          className="group relative flex flex-col justify-between bg-white/95 dark:bg-[#1E1740]/90 rounded-2xl p-7 sm:p-8 border-2 border-purple-200/80 dark:border-purple-800/60 shadow-lg shadow-purple-900/5 hover:shadow-xl hover:shadow-purple-700/15 hover:border-purple-500/80 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 text-center"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectEmployee();
            }
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display mb-2.5 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
              Login as Employee
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Submit new ideas, collaborate with colleagues, and track your innovations.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectEmployee();
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-purple-700/20 group-hover:shadow-lg group-hover:shadow-purple-700/30 group-hover:brightness-105 transition-all"
          >
            <span>Login as Employee</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Card 2: Login as Admin */}
        <div
          onClick={handleSelectAdmin}
          className="group relative flex flex-col justify-between bg-white/95 dark:bg-[#1E1740]/90 rounded-2xl p-7 sm:p-8 border-2 border-indigo-200/80 dark:border-indigo-800/60 shadow-lg shadow-indigo-900/5 hover:shadow-xl hover:shadow-indigo-700/15 hover:border-indigo-500/80 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 text-center"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectAdmin();
            }
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display mb-2.5 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              Login as Admin
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Review submissions, manage idea pipelines, and evaluate organizational impact.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAdmin();
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 text-white font-semibold text-sm shadow-md shadow-indigo-700/20 group-hover:shadow-lg group-hover:shadow-indigo-700/30 group-hover:brightness-105 transition-all"
          >
            <span>Login as Admin</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
