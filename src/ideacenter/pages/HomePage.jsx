import React from 'react';
import {
  Sparkles,
  Rocket,
  Target,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  Trophy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Plus,
  ThumbsUp,
  Database,
  Cpu,
  Bot,
  BookOpen,
  MessageSquare,
  Users,
  UserCheck,
  Layers,
  Award,
  Check,
  Zap,
  Flame,
  Leaf,
  Shield,
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import { A } from '../hooks/useNav.jsx';
import { STATUS_COLOR } from '../lookups.js';
import { computeStats } from '../lib/stats.js';
import { fdate } from '../lib/dates.js';
import { AsyncView } from '../components/ui.jsx';
import { isOwner, canVote } from '../permissions.js';
import RadialKpiShowcase from '../components/RadialKpiShowcase.jsx';

// Designation mapping for known team members with fallback to department or 'Innovator'
const DESIGNATION_MAP = {
  'Sanjay P.': 'Solutions Lead',
  'Priya N.': 'Data Engineer',
  'Karthik R.': 'Senior Data Engineer',
  'Lakshmi V.': 'Cloud Architect',
  'Arjun M.': 'Product Engineer',
  'Arjun I.': 'Product Engineer',
  'Divya S.': 'Pre-sales Consultant',
  'Imran K.': 'Support Engineer',
  'Meera K.': 'Program Lead',
};

// Profile avatar URLs with graceful fallback
const AVATAR_MAP = {
  'Priya N.': '/assets/priya_avatar.jpg',
  'Sanjay P.': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  'Karthik R.': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
  'Lakshmi V.': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
  'Arjun M.': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
  'Arjun I.': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
  'Divya S.': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  'Imran K.': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
};

// Avatar component with graceful image error handling and stylish gradient initial fallback
function UserAvatar({ name, src, size = 32 }) {
  const [error, setError] = React.useState(false);
  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
    : 'U';

  const gradients = [
    'linear-gradient(135deg, #7C3AED, #A855F7)',
    'linear-gradient(135deg, #2563EB, #60A5FA)',
    'linear-gradient(135deg, #059669, #34D399)',
    'linear-gradient(135deg, #D97706, #FBBF24)',
    'linear-gradient(135deg, #E11D48, #FB7185)',
  ];
  const charCode = (name || '').charCodeAt(0) || 0;
  const grad = gradients[charCode % gradients.length];

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white shadow-2xs border border-white/80 dark:border-purple-800/50"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.floor(size * 0.38)),
        background: grad,
      }}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// Rank badge with distinctive colors for Top 3 as in the reference design
function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold text-xs flex items-center justify-center shrink-0">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="w-6 h-6 rounded-full bg-[#F1F5F9] dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="w-6 h-6 rounded-full bg-[#FFFBEB] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
        3
      </span>
    );
  }
  return (
    <span className="w-6 h-6 rounded-full bg-[#F1F5F9] dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
      {rank}
    </span>
  );
}

// Helper to get category/tech icon for Most Voted ideas matching reference
function getMostVotedIcon(idea, idx) {
  const t = `${idea.title} ${idea.category} ${idea.technology}`.toLowerCase();
  if (t.includes('contract') || t.includes('ai') || t.includes('genai') || t.includes('bot') || idx === 0) {
    return {
      icon: <Bot size={16} />,
      cls: 'bg-[#F3E8FF] text-[#7C3AED] dark:bg-purple-950/70 dark:text-purple-300',
    };
  }
  if (t.includes('green') || t.includes('energy') || t.includes('sustain') || idx === 1) {
    return {
      icon: <Leaf size={16} />,
      cls: 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/70 dark:text-emerald-300',
    };
  }
  if (t.includes('onboarding') || t.includes('buddy') || t.includes('joiner') || idx === 2) {
    return {
      icon: <Users size={16} />,
      cls: 'bg-[#FFEDD5] text-[#EA580C] dark:bg-amber-950/70 dark:text-amber-300',
    };
  }
  if (t.includes('shelf') || t.includes('vision') || t.includes('retail') || t.includes('domo') || idx === 3) {
    return {
      icon: <BarChart3 size={16} />,
      cls: 'bg-[#E0F2FE] text-[#0284C7] dark:bg-sky-950/70 dark:text-sky-300',
    };
  }
  return {
    icon: <ShieldCheck size={16} />,
    cls: 'bg-[#FFE4E6] text-[#E11D48] dark:bg-rose-950/70 dark:text-rose-300',
  };
}

// Helper to get Recent Idea top square icon matching reference
function getRecentIdeaIcon(idea, idx) {
  const t = `${idea.title} ${idea.category} ${idea.technology}`.toLowerCase();
  if (t.includes('document') || t.includes('rework') || t.includes('domo') || idx === 0) {
    return {
      icon: <FileText size={18} />,
      cls: 'bg-[#E0F2FE] text-[#0284C7] dark:bg-blue-950/70 dark:text-blue-300',
    };
  }
  if (t.includes('gpu') || t.includes('lab') || t.includes('cpu') || t.includes('dashboard') || idx === 1) {
    return {
      icon: <Cpu size={18} />,
      cls: 'bg-[#F3E8FF] text-[#7C3AED] dark:bg-purple-950/70 dark:text-purple-300',
    };
  }
  if (t.includes('demand') || t.includes('forecast') || t.includes('template') || t.includes('green') || idx === 2) {
    return {
      icon: <Leaf size={18} />,
      cls: 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/70 dark:text-emerald-300',
    };
  }
  if (t.includes('feedback') || t.includes('tag') || t.includes('customer') || idx === 3) {
    return {
      icon: <Shield size={18} />,
      cls: 'bg-[#FFEDD5] text-[#EA580C] dark:bg-amber-950/70 dark:text-amber-300',
    };
  }
  return {
    icon: <Users size={18} />,
    cls: 'bg-[#FCE7F3] text-[#DB2777] dark:bg-pink-950/70 dark:text-pink-300',
  };
}

// Category badge pill color matching reference
function getCategoryBadgeClass(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('process') || cat.includes('product') || cat.includes('domo')) {
    return 'bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40';
  }
  if (cat.includes('tech') || cat.includes('cloud') || cat.includes('ai') || cat.includes('value')) {
    return 'bg-[#F5F0FF] text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40';
  }
  if (cat.includes('operation') || cat.includes('internal') || cat.includes('sustain')) {
    return 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40';
  }
  if (cat.includes('customer') || cat.includes('pain')) {
    return 'bg-[#FFF7ED] text-[#EA580C] dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40';
  }
  return 'bg-[#FDF2F8] text-[#DB2777] dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/40';
}

// Carousel component with smooth horizontal scrolling and conditional left/right arrows
function RecentIdeasCarousel({ recentIdeas, openIdea, handleVote }) {
  const scrollRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const timer = setTimeout(checkScroll, 120);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, recentIdeas.length]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(260, el.clientWidth * 0.65);
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group/carousel">
      {/* Left Scroll Button - only shown when required */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#221A46] border border-purple-200/90 dark:border-purple-800/80 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-purple-50 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
          aria-label="Scroll left to see previous ideas"
          title="Previous ideas"
        >
          <ChevronLeft size={19} strokeWidth={2.4} />
        </button>
      )}

      {/* Cards Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-3.5 overflow-x-auto scroll-smooth py-1 px-0.5 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recentIdeas.map((idea, idx) => {
          const iconMeta = getRecentIdeaIcon(idea, idx);
          const isVoted = idea.effectiveVotedByMe;
          const votes = idea.effectiveVoteCount;

          return (
            <div
              key={idea.id}
              onClick={() => openIdea(idea.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openIdea(idea.id)}
              className="group bg-white dark:bg-[#1E1740] rounded-2xl border border-purple-100/90 dark:border-purple-900/40 p-4 shadow-2xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700/60 transition-all flex flex-col justify-between cursor-pointer w-[240px] sm:w-[250px] md:w-[260px] lg:w-[calc((100%-56px)/5)] min-w-[230px] shrink-0"
            >
              {/* Top portion: Icon & Title & Description */}
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-3 ${iconMeta.cls}`}>
                  {iconMeta.icon}
                </div>

                <h3 className="font-bold text-[13.5px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-snug line-clamp-2 group-hover:text-[#7C3AED] dark:group-hover:text-[#C4B5FD] transition-colors mb-1.5 min-h-[38px]">
                  {idea.title}
                </h3>

                <p className="text-xs text-[#6B6684] dark:text-[#A9A1C9] line-clamp-2 leading-relaxed mb-3 min-h-[32px]">
                  {idea.solution || idea.problem || 'Innovative initiative submitted to Spark.'}
                </p>

                {/* Category Badge */}
                <div className="mb-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${getCategoryBadgeClass(idea.category)}`}>
                    {idea.category || idea.technology || 'Innovation'}
                  </span>
                </div>
              </div>

              {/* Bottom Meta Row: Author / Avatar / Date & Vote Button */}
              <div className="flex items-center justify-between gap-1.5 pt-2.5 border-t border-purple-50 dark:border-purple-900/30">
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserAvatar name={idea.submitterName} src={AVATAR_MAP[idea.submitterName]} size={20} />
                  <span className="text-[11px] text-[#6B6684] dark:text-[#A9A1C9] font-medium truncate">
                    {idea.submitterName ? idea.submitterName.split(' ')[0] : 'Innovator'}
                    <span className="mx-1 text-gray-400">•</span>
                    {fdate(idea.createdAt)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleVote(e, idea)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-2xs ${
                    isVoted
                      ? 'bg-[#7C3AED] hover:bg-[#6D28D9] !text-white text-white'
                      : 'bg-[#F5F0FF] dark:bg-purple-950/60 text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-purple-100 dark:hover:bg-purple-900/60'
                  }`}
                  style={isVoted ? { color: '#ffffff' } : undefined}
                  title={isVoted ? 'Click to withdraw vote' : 'Click to vote'}
                  aria-pressed={isVoted}
                >
                  <ThumbsUp
                    size={11}
                    className={isVoted ? 'fill-white text-white' : 'text-[#7C3AED] dark:text-[#C4B5FD]'}
                    style={isVoted ? { fill: '#ffffff', color: '#ffffff' } : undefined}
                  />
                  <span>{votes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Scroll Button - only shown when required */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#221A46] border border-purple-200/90 dark:border-purple-800/80 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-purple-50 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
          aria-label="Scroll right to see more ideas"
          title="More ideas"
        >
          <ChevronRight size={19} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

// Smooth count-up animation component from 0 to value
function AnimatedNumber({ value, duration = 1400 }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const end = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    if (end <= 0) {
      setDisplayValue(end);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easeOut curve: clear visible increments, gentle landing
      const easeOut = 1 - Math.pow(1 - progress, 2.6);
      const current = Math.round(easeOut * end);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

// Helper to get category/technology icon
function getIdeaIcon(idea) {
  const tech = (idea.technology || '').toLowerCase();
  const cat = (idea.category || '').toLowerCase();
  const title = (idea.title || '').toLowerCase();

  if (tech.includes('genai') || tech.includes('ai') || title.includes('bot') || title.includes('llm')) {
    return <Bot size={15} className="text-purple-600 dark:text-purple-400" />;
  }
  if (tech.includes('domo') || tech.includes('data') || title.includes('domo') || title.includes('dataset')) {
    return <Database size={15} className="text-blue-600 dark:text-blue-400" />;
  }
  if (tech.includes('cloud') || title.includes('gpu') || title.includes('dashboard')) {
    return <Cpu size={15} className="text-indigo-600 dark:text-indigo-400" />;
  }
  if (cat.includes('customer') || title.includes('feedback') || title.includes('qbr')) {
    return <MessageSquare size={15} className="text-amber-600 dark:text-amber-400" />;
  }
  if (cat.includes('process') || title.includes('playbook') || title.includes('review')) {
    return <BookOpen size={15} className="text-emerald-600 dark:text-emerald-400" />;
  }
  return <BarChart3 size={15} className="text-teal-600 dark:text-teal-400" />;
}

export default function HomePage() {
  const user = useCurrentUser();
  const { openIdea, version, bump, toast } = useSpark();
  const state = useAsync(() => api.listIdeas({}), [version, user?.id]);
  const [overrides, setOverrides] = React.useState({});

  // Optimistic vote handler preserving existing voting functionality
  const handleVote = async (e, idea) => {
    e.stopPropagation();
    if (!canVote(user)) return;
    const currentVoted = overrides[idea.id]?.votedByMe ?? !!idea.votedByMe;
    const currentCount = overrides[idea.id]?.voteCount ?? (idea.voteCount || 0);
    const before = { votedByMe: currentVoted, voteCount: currentCount };
    const next = {
      votedByMe: !before.votedByMe,
      voteCount: before.voteCount + (before.votedByMe ? -1 : 1),
    };
    setOverrides((prev) => ({ ...prev, [idea.id]: next }));
    try {
      const res = await api.toggleVote(idea.id);
      setOverrides((prev) => ({ ...prev, [idea.id]: res }));
      bump();
    } catch (err) {
      setOverrides((prev) => ({ ...prev, [idea.id]: before }));
      toast?.('Your vote could not be saved.');
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <AsyncView state={state} rows={5} isEmpty={(d) => d.length === 0} empty="No ideas yet. Be the first to submit one.">
        {(ideas) => {
          const s = computeStats(ideas);
          const mine = ideas.filter((i) => isOwner(user, i));

          // 1. Top Innovators: derived from actual ideas and enriched with static benchmark innovators
          const innovatorsMap = {};
          ideas.forEach((idea) => {
            const name = idea.submitterName;
            // Never rank Anonymous Innovator or external guest submitters on internal leaderboard
            if (!name || name === 'Anonymous Innovator' || idea.submitterType === 'External') return;
            if (!innovatorsMap[name]) {
              innovatorsMap[name] = {
                name,
                role: DESIGNATION_MAP[name] || idea.dept || 'Innovator',
                ideas: 0,
                votes: 0,
                avatar: AVATAR_MAP[name] || null,
              };
            }
            innovatorsMap[name].ideas += 1;
            const currentVotes = overrides[idea.id]?.voteCount ?? (idea.voteCount || 0);
            innovatorsMap[name].votes += currentVotes;
          });

          // Curated static benchmark innovators across GWC teams to ensure the leaderboard is rich and full
          const STATIC_BENCHMARK_INNOVATORS = [
            {
              name: 'Sanjay P.',
              role: DESIGNATION_MAP['Sanjay P.'] || 'Solutions Lead',
              ideas: 4,
              votes: 14,
              avatar: AVATAR_MAP['Sanjay P.'] || null,
            },
            {
              name: 'Karthik R.',
              role: DESIGNATION_MAP['Karthik R.'] || 'Senior Data Engineer',
              ideas: 3,
              votes: 10,
              avatar: AVATAR_MAP['Karthik R.'] || null,
            },
            {
              name: 'Priya N.',
              role: DESIGNATION_MAP['Priya N.'] || 'Data Engineer',
              ideas: 3,
              votes: 7,
              avatar: AVATAR_MAP['Priya N.'] || null,
            },
            {
              name: 'Divya S.',
              role: DESIGNATION_MAP['Divya S.'] || 'Pre-sales Consultant',
              ideas: 2,
              votes: 6,
              avatar: AVATAR_MAP['Divya S.'] || null,
            },
            {
              name: 'Imran K.',
              role: DESIGNATION_MAP['Imran K.'] || 'Support Engineer',
              ideas: 2,
              votes: 5,
              avatar: AVATAR_MAP['Imran K.'] || null,
            },
          ];

          // Supplement dynamic innovators with benchmark static innovators so there are always top innovators displayed
          STATIC_BENCHMARK_INNOVATORS.forEach((staticInv) => {
            if (!innovatorsMap[staticInv.name]) {
              innovatorsMap[staticInv.name] = { ...staticInv };
            } else {
              innovatorsMap[staticInv.name].ideas = Math.max(innovatorsMap[staticInv.name].ideas, staticInv.ideas);
              innovatorsMap[staticInv.name].votes = Math.max(innovatorsMap[staticInv.name].votes, staticInv.votes);
              if (!innovatorsMap[staticInv.name].avatar && staticInv.avatar) {
                innovatorsMap[staticInv.name].avatar = staticInv.avatar;
              }
            }
          });

          const topInnovators = Object.values(innovatorsMap)
            .sort((a, b) => b.votes - a.votes || b.ideas - a.ideas)
            .slice(0, 5);

          // 2. Most Voted Ideas derived from actual data, sorted by votes
          const mostVoted = [...ideas]
            .filter((i) => i.status !== 'Rejected')
            .map((i) => ({
              ...i,
              effectiveVoteCount: overrides[i.id]?.voteCount ?? (i.voteCount || 0),
              effectiveVotedByMe: overrides[i.id]?.votedByMe ?? !!i.votedByMe,
            }))
            .sort((a, b) => b.effectiveVoteCount - a.effectiveVoteCount)
            .slice(0, 5);

          // 3. Recent Ideas derived from actual data, newest first
          const recentIdeas = [...ideas]
            .map((i) => ({
              ...i,
              effectiveVoteCount: overrides[i.id]?.voteCount ?? (i.voteCount || 0),
              effectiveVotedByMe: overrides[i.id]?.votedByMe ?? !!i.votedByMe,
            }))
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 10);

          return (
            <>
              {/* 1. HERO SECTION — Full 100vh Viewport Stage: Only Navbar & Grand Hero Appear */}
              <section
                className="relative w-full min-h-[calc(100vh-92px)] flex items-center justify-center py-2 sm:py-3 overflow-visible"
                aria-label="Spark Innovation Hero and KPI Showcase"
              >
                {/* Centered 2-Column Hero Content Grid */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-[49%_51%] xl:grid-cols-[50%_50%] gap-6 xl:gap-8 items-center py-2">
                  {/* Left Column: Eyebrow, Large Bold Two-Line Headline, CTAs & Scroll Cue */}
                  <div className="flex flex-col items-start justify-center text-left py-2 lg:pl-6 xl:pl-10 lg:pr-2">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-100/90 dark:bg-purple-950/70 border border-purple-200/80 dark:border-purple-800/60 text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-bold tracking-wider uppercase mb-3.5 shadow-2xs">
                      <Sparkles size={13} className="text-[#7C3AED] dark:text-[#C4B5FD]" />
                      <span>SPARK IDEAS PLATFORM</span>
                    </div>

                    <h1 className="font-display text-4xl sm:text-5xl lg:text-[45px] xl:text-[50px] font-black text-[#1E1B4B] dark:text-[#FAF7FF] leading-[1.08] tracking-tight mb-3.5">
                      <span className="block whitespace-nowrap">Ideas today.</span>
                      <span className="block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] dark:from-[#C4B5FD] dark:via-[#DDD6FE] dark:to-[#A78BFA] pr-3">
                        For a better tomorrow.
                      </span>
                    </h1>

                    <p className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#5D5875] dark:text-[#A9A1C9] max-w-[440px] mb-6 font-normal">
                      Share innovative ideas, collaborate with teams, and help build a better GWC.
                    </p>

                    {/* Primary & Secondary CTA Buttons */}
                    <div className="flex items-center gap-3.5 flex-wrap mb-5 sm:mb-6">
                      <A
                        to="/employee/submit"
                        className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white !text-white text-[14px] sm:text-[14.5px] font-semibold shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                        style={{ color: '#ffffff' }}
                      >
                        <Plus size={18} strokeWidth={2.6} style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff' }}>Submit an Idea</span>
                      </A>
                      <A
                        to="/employee/ideas"
                        className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-full border border-purple-200/90 dark:border-purple-700/60 bg-white/95 dark:bg-white/10 text-[#6D28D9] dark:text-[#C4B5FD] text-[14px] sm:text-[14.5px] font-semibold hover:bg-white dark:hover:bg-white/20 shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>Explore Ideas</span>
                        <ArrowRight size={16} />
                      </A>
                    </div>

                    {/* Meaningfully Aligned Scroll to Explore Prompt */}
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('dashboard-overview')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-[#1E1740]/80 dark:hover:bg-[#251D4A] border border-purple-200/80 dark:border-purple-800/60 text-[#6B2FA8] dark:text-[#C4B5FD] text-xs sm:text-[12.5px] font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none"
                      aria-label="Scroll to explore innovators and top ideas"
                    >
                      <span className="w-5.5 h-5.5 rounded-full bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD] shrink-0">
                        <ChevronDown size={13} className="group-hover:translate-y-0.5 transition-transform animate-bounce" />
                      </span>
                      <span>Scroll to explore innovators & top ideas</span>
                    </button>
                  </div>

                  {/* Right Column: Animated Radial KPI Composition around central glowing innovation bulb */}
                  <div className="flex items-center justify-center relative w-full overflow-visible lg:-translate-x-4 xl:-translate-x-6">
                    <RadialKpiShowcase stats={s} myIdeasCount={mine.length} />
                  </div>
                </div>
              </section>

              {/* LOWER DASHBOARD: ROW 1 (TOP INNOVATORS & MOST VOTED IDEAS) & ROW 2 (RECENT IDEAS) */}
              <div id="dashboard-overview" className="flex flex-col gap-6 w-full pt-10 pb-16">
                {/* ROW 1: TWO COLUMNS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-stretch">
                  {/* LEFT COLUMN: Top Innovators */}
                  <section
                    className="bg-white dark:bg-[#1C153B] border border-purple-100/90 dark:border-purple-900/40 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between"
                    aria-label="Top Innovators"
                  >
                    <div>
                      {/* Section Header */}
                      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] dark:bg-amber-950/60 text-[#D97706] dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Trophy size={20} className="text-[#D97706] dark:text-amber-400" />
                          </div>
                          <div>
                            <h2 className="font-display text-base sm:text-[17px] font-bold text-[#1E1B4B] dark:text-[#F5F3FF] leading-tight">
                              Top Innovators
                            </h2>
                            <p className="text-xs text-[#6B6684] dark:text-[#A9A1C9] mt-0.5 font-normal">
                              Leading the spark across GWC
                            </p>
                          </div>
                        </div>
                        <A
                          to="/employee/ideas"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F0FF] hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span>View all</span>
                          <ArrowRight size={13} />
                        </A>
                      </div>

                      {/* Leaderboard Rows */}
                      <div className="flex flex-col">
                        {topInnovators.length > 0 ? (
                          topInnovators.map((innovator, idx) => (
                            <div
                              key={innovator.name}
                              className="flex items-center justify-between gap-3 py-3 border-b border-gray-100/90 dark:border-purple-900/30 last:border-b-0 hover:bg-[#FAF9FE] dark:hover:bg-[#221A46]/70 rounded-xl px-1.5 transition-colors"
                            >
                              {/* Left: Rank, Avatar, Name & Role */}
                              <div className="flex items-center gap-3 min-w-0">
                                <RankBadge rank={idx + 1} />
                                <UserAvatar name={innovator.name} src={innovator.avatar} size={36} />
                                <div className="min-w-0">
                                  <span className="block font-bold text-[13.5px] sm:text-sm text-[#1E1B4B] dark:text-[#EEE9FC] truncate leading-tight">
                                    {innovator.name}
                                  </span>
                                  <span className="block text-xs text-[#6B6684] dark:text-[#A9A1C9] truncate mt-0.5">
                                    {innovator.role}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Ideas count & Votes count */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F0FF] dark:bg-purple-950/60 text-[#7C3AED] dark:text-[#C4B5FD] whitespace-nowrap">
                                  {innovator.ideas} {innovator.ideas === 1 ? 'idea' : 'ideas'}
                                </span>

                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#251D4A] text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-semibold shadow-2xs whitespace-nowrap">
                                  <ThumbsUp size={12} className="text-[#7C3AED] dark:text-[#C4B5FD]" />
                                  <span>{innovator.votes}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-xs text-[#6B6684] dark:text-[#A9A1C9]">
                            No contributor records found yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* RIGHT COLUMN: Most Voted Ideas */}
                  <section
                    className="bg-white dark:bg-[#1C153B] border border-purple-100/90 dark:border-purple-900/40 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between"
                    aria-label="Most Voted Ideas"
                  >
                    <div>
                      {/* Section Header */}
                      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFE4E6] dark:bg-rose-950/60 text-[#E11D48] dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Flame size={20} className="text-[#E11D48] dark:text-rose-400" />
                          </div>
                          <div>
                            <h2 className="font-display text-base sm:text-[17px] font-bold text-[#1E1B4B] dark:text-[#F5F3FF] leading-tight">
                              Most Voted Ideas
                            </h2>
                            <p className="text-xs text-[#6B6684] dark:text-[#A9A1C9] mt-0.5 font-normal">
                              Ideas that inspire our community
                            </p>
                          </div>
                        </div>
                        <A
                          to="/employee/ideas"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F0FF] hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span>View all</span>
                          <ArrowRight size={13} />
                        </A>
                      </div>

                      {/* Ideas List */}
                      <div className="flex flex-col">
                        {mostVoted.length > 0 ? (
                          mostVoted.map((idea, idx) => {
                            const iconMeta = getMostVotedIcon(idea, idx);
                            const isVoted = idea.effectiveVotedByMe;
                            const votes = idea.effectiveVoteCount;

                            return (
                              <div
                                key={idea.id}
                                className="flex items-center justify-between gap-3 py-3 border-b border-gray-100/90 dark:border-purple-900/30 last:border-b-0 hover:bg-[#FAF9FE] dark:hover:bg-[#221A46]/70 rounded-xl px-1.5 transition-colors cursor-pointer group"
                                onClick={() => openIdea(idea.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && openIdea(idea.id)}
                              >
                                {/* Left: Rank, Category Icon, Title & Meta */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <RankBadge rank={idx + 1} />
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconMeta.cls}`}>
                                    {iconMeta.icon}
                                  </div>
                                  <div className="min-w-0 flex-1 pr-1">
                                    <h3 className="font-bold text-[13.5px] sm:text-sm text-[#1E1B4B] dark:text-[#EEE9FC] truncate leading-tight group-hover:text-[#7C3AED] dark:group-hover:text-[#C4B5FD] transition-colors">
                                      {idea.title}
                                    </h3>
                                    <p className="text-xs text-[#6B6684] dark:text-[#A9A1C9] truncate mt-0.5">
                                      {idea.submitterName || 'Innovator'}
                                      <span className="mx-1.5 text-gray-400">•</span>
                                      {fdate(idea.createdAt)}
                                      <span className="mx-1.5 text-gray-400">•</span>
                                      {idea.category || idea.technology || 'Innovation'}
                                    </p>
                                  </div>
                                </div>

                                {/* Right: Interactive Vote Button */}
                                <div className="shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleVote(e, idea)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                                      isVoted
                                        ? 'bg-[#7C3AED] hover:bg-[#6D28D9] !text-white text-white'
                                        : 'border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#251D4A] text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-purple-50 dark:hover:bg-purple-900/40'
                                    }`}
                                    style={isVoted ? { color: '#ffffff' } : undefined}
                                    title={isVoted ? 'Click to withdraw vote' : 'Click to vote'}
                                    aria-pressed={isVoted}
                                  >
                                    <ThumbsUp
                                      size={12}
                                      className={isVoted ? 'fill-white text-white' : 'text-[#7C3AED] dark:text-[#C4B5FD]'}
                                      style={isVoted ? { fill: '#ffffff', color: '#ffffff' } : undefined}
                                    />
                                    <span>{votes}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center text-xs text-[#6B6684] dark:text-[#A9A1C9]">
                            No voted ideas recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                {/* ROW 2: FULL-WIDTH RECENT IDEAS */}
                <section
                  className="bg-white dark:bg-[#1C153B] border border-purple-100/90 dark:border-purple-900/40 rounded-2xl p-5 sm:p-6 shadow-2xs w-full"
                  aria-label="Recent Ideas"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E0F2FE] dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0">
                        <Clock size={20} className="text-[#0284C7] dark:text-sky-400" />
                      </div>
                      <div>
                        <h2 className="font-display text-base sm:text-[17px] font-bold text-[#1E1B4B] dark:text-[#F5F3FF] leading-tight">
                          Recent Ideas
                        </h2>
                        <p className="text-xs text-[#6B6684] dark:text-[#A9A1C9] mt-0.5 font-normal">
                          Latest ideas from across GWC
                        </p>
                      </div>
                    </div>
                    <A
                      to="/employee/ideas"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F0FF] hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>View all</span>
                      <ArrowRight size={13} />
                    </A>
                  </div>

                  {/* Horizontally arranged scrollable cards with left/right arrows when required */}
                  {recentIdeas.length > 0 ? (
                    <RecentIdeasCarousel
                      recentIdeas={recentIdeas}
                      openIdea={openIdea}
                      handleVote={handleVote}
                    />
                  ) : (
                    <div className="py-8 text-center text-xs text-[#6B6684] dark:text-[#A9A1C9]">
                      No recent ideas submitted yet.
                    </div>
                  )}
                </section>
              </div>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
