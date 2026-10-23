import React, { useEffect, useState } from 'react';
import './ideacenter.css';
import { CurrentUserProvider, useCurrentUser, useUserControls } from './hooks/useCurrentUser.jsx';
import { SparkProvider, useSpark } from './hooks/SparkContext.jsx';
import { usePath, A } from './hooks/useNav.jsx';
import { resolveRoute } from './routes.js';
import Header from './components/Header.jsx';
import DetailsDrawer from './components/DetailsDrawer.jsx';
import { Loading } from './components/ui.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import HomePage from './pages/HomePage.jsx';
import IdeasPage from './pages/IdeasPage.jsx';
import SubmitPage from './pages/SubmitPage.jsx';
import SubmittedPage from './pages/SubmittedPage.jsx';
import MyIdeasPage from './pages/MyIdeasPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import LeadershipDashboardPage from './pages/LeadershipDashboardPage.jsx';
import LeadershipIdeasListPage from './pages/LeadershipIdeasListPage.jsx';
import ManageIdeasPage from './pages/ManageIdeasPage.jsx';
import { TrackForm, TrackDetail } from './pages/TrackPage.jsx';

const THEME_KEY = 'spark_theme';

function readTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch { /* storage can be blocked */ }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Routes() {
  const path = usePath();
  const user = useCurrentUser();
  const { ready, setMockUser } = useUserControls();
  const { closeIdea } = useSpark();
  const route = resolveRoute(path);

  useEffect(() => { closeIdea(); }, [path, user?.id, closeIdea]);

  useEffect(() => {
    if (path.startsWith('/admin') && user?.id !== 'meera') {
      setMockUser('meera');
    } else if (path.startsWith('/employee') && user?.id !== 'priya') {
      setMockUser('priya');
    }
  }, [path, user?.id, setMockUser]);

  if (!ready) return <Loading rows={2} label="Loading Spark" />;
  if (!route) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-8 shadow-xs">
        <h2 className="text-xl font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">We could not find that page</h2>
        <p className="my-3 text-xs sm:text-sm text-[#646C8C] dark:text-[#A9A1C9]">
          <A to="/" className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] text-white shadow-xs transition inline-flex">
            Back to welcome page
          </A>
        </p>
      </div>
    );
  }

  switch (route.page) {
    case 'welcome': return <WelcomePage />;
    case 'employeeHome':
    case 'home': return <HomePage />;
    case 'employeeIdeas':
    case 'ideas': return <IdeasPage />;
    case 'employeeSubmit':
    case 'submit': return <SubmitPage key={user?.id || 'employee'} />;
    case 'employeeMine':
    case 'mine': return <MyIdeasPage />;
    case 'adminDashboard':
    case 'dashboard': return <LeadershipDashboardPage />;
    case 'adminIdeasView': return <LeadershipIdeasListPage filterParam={route.params?.filter} />;
    case 'adminReview':
    case 'review': return <ReviewPage />;
    case 'adminManage': return <ManageIdeasPage />;
    case 'submitted': return <SubmittedPage />;
    case 'track': return <TrackForm />;
    case 'trackDetail': return <TrackDetail token={route.params.token} />;
    default: return <WelcomePage />;
  }
}

function Shell({ themeProp }) {
  const path = usePath();
  const { openId, toastMsg } = useSpark();
  const [theme, setTheme] = useState(themeProp || readTheme);

  useEffect(() => { if (themeProp) setTheme(themeProp); }, [themeProp]);

  const changeTheme = (t) => {
    setTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  };

  const isWelcome = path === '/';
  const isSubmit = path === '/employee/submit' || path === '/submit';

  return (
    <div className={`spark-root ${isSubmit ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'}`} data-theme={theme}>
      <Header path={path} theme={theme} onTheme={changeTheme} showThemeToggle={!themeProp} />
      <main className={`${isSubmit ? 'flex-1 min-h-0 py-1.5 sm:py-2 flex items-center justify-center overflow-hidden' : isWelcome ? 'pt-2 pb-6' : 'pt-1.5 sm:pt-2.5 pb-8 sm:pb-12'}`}>
        <div className={`max-w-[1380px] w-full mx-auto px-3 sm:px-5 lg:px-6 ${isSubmit ? 'h-full flex flex-col justify-center' : ''}`}>
          <Routes />
        </div>
      </main>
      {openId && <DetailsDrawer key={openId} />}
      {toastMsg && (
        <div
          className="fixed left-1/2 bottom-6 -translate-x-1/2 bg-[#1F2A5C] dark:bg-[#EEE9FC] text-white dark:text-[#130F28] px-5 py-2.5 rounded-full z-50 max-w-[90%] shadow-xl font-medium text-xs sm:text-sm"
          role="status"
          aria-live="polite"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function IdeaCenterApp({ theme }) {
  return (
    <CurrentUserProvider>
      <SparkProvider>
        <Shell themeProp={theme} />
      </SparkProvider>
    </CurrentUserProvider>
  );
}
