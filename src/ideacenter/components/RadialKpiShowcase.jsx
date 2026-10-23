import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  FileText,
  TrendingUp,
  Rocket,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { A } from '../hooks/useNav.jsx';

// Animated count-up component
function AnimatedNumber({ value, duration = 1200 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
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

/**
 * Generates continuous keyframe samples along an organic shared orbital trajectory:
 * 1. Begins in the lower region below the component, initially hidden (opacity 0, reduced scale).
 * 2. Rises smoothly upward and curves outward to join the circular orbit around the bulb.
 * 3. Sweeps clockwise along the orbit toward its assigned final angular position.
 * 4. Decelerates naturally as it nears its destination with a subtle micro-spring settling.
 * 5. Settles permanently into its stationary position.
 */
function generateOrbitalTrajectory(startAngle, targetAngle, cx, cy, rx, ry, diameter, steps = 26) {
  const xFrames = [];
  const yFrames = [];
  const opacityFrames = [];
  const scaleFrames = [];

  // Bottom staging offset (below the orbit)
  const stagingOffsetY = ry * 1.48;

  for (let i = 0; i <= steps; i++) {
    const u = i / steps; // 0 to 1

    // Eased parametric progress with smooth acceleration, orbital glide, and gentle deceleration
    let p;
    if (u < 0.82) {
      const t = u / 0.82;
      p = 0.86 * (1 - Math.cos((t * Math.PI) / 2));
    } else {
      const t = (u - 0.82) / 0.18;
      // Very restrained settling overshoot (<= 1.2% micro-spring cushion)
      const microSpring = Math.sin(t * Math.PI) * 0.012;
      p = 0.86 + 0.14 * Math.sin((t * Math.PI) / 2) + microSpring;
      if (i === steps) p = 1.0;
    }

    // Angle strictly interpolates clockwise from startAngle to targetAngle
    const currentAngle = startAngle + p * (targetAngle - startAngle);

    // Radius: smoothly blends from staging offset onto the orbit radius
    // Continuous cubic falloff eliminates sharp corners at orbit entry
    const liftT = Math.min(1, p * 3.2);
    const liftFactor = Math.pow(1 - liftT, 2.4); // smoothly decays from 1 to 0

    // Gentle orbital clearance flare during mid-flight to avoid crowding
    const orbitFlare = Math.sin(p * Math.PI) * 0.05;

    const curRx = rx * (1 - liftFactor * 0.62 + orbitFlare);
    const curRy = ry * (1 + liftFactor * 0.48 + orbitFlare);

    const px = Math.round(cx + curRx * Math.cos(currentAngle) - diameter / 2);
    const py = Math.round(cy + curRy * Math.sin(currentAngle) - diameter / 2);

    xFrames.push(px);
    yFrames.push(py);

    // Gradual fade-in: opacity smoothly reaches 1 by u = 0.18
    const op = u === 0 ? 0 : Math.min(1, parseFloat(Math.sin((Math.min(1, u * 4.8) * Math.PI) / 2).toFixed(3)));
    opacityFrames.push(op);

    // Smooth scale up: starts at 0.40, scales to 1.0 with subtle 1.015 settling
    const baseScale = u === 0 ? 0.40 : 0.40 + 0.60 * Math.sin((Math.min(1, u * 3.8) * Math.PI) / 2);
    const settleScale = (u > 0.82 && u < steps) ? 1.015 : 1.0;
    scaleFrames.push(parseFloat((baseScale * settleScale).toFixed(3)));
  }

  return { xFrames, yFrames, opacityFrames, scaleFrames };
}

export default function RadialKpiShowcase({ stats = {}, myIdeasCount = 0 }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 480, height: 440 });
  const [hoveredId, setHoveredId] = useState(null);
  const prefersReduced = useReducedMotion();

  // Scroll-driven circular animation states and refs
  const [isFormed, setIsFormed] = useState(false);
  const isFormedRef = useRef(false);
  const cardOrbitRefs = useRef({});
  const rafIdRef = useRef(null);
  const currentOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const radiusRef = useRef({ rx: 0, ry: 0 });
  const cardsRef = useRef([]);

  // Measure container dimensions responsively
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDims = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDims({ width: rect.width, height: rect.height });
      }
    };

    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Center coordinate and radii - slightly offset cy to balance pentagon top/bottom clearance
  const isMobile = dims.width < 440;
  const isTablet = dims.width >= 440 && dims.width < 560;

  const cx = dims.width / 2;
  const cy = dims.height / 2;

  // Prominently sized circular orbit tailored to fill the 100vh hero screen
  const radiusX = useMemo(() => {
    if (isMobile) return Math.min(dims.width * 0.35, 140);
    if (isTablet) return Math.min(dims.width * 0.36, 175);
    return Math.min(dims.width * 0.36, 205);
  }, [dims.width, isMobile, isTablet]);

  const radiusY = useMemo(() => {
    if (isMobile) return Math.min(dims.height * 0.31, 120);
    if (isTablet) return Math.min(dims.height * 0.33, 146);
    return Math.min(dims.height * 0.34, 168);
  }, [dims.height, isMobile, isTablet]);

  const cardDiameter = isMobile ? 80 : isTablet ? 94 : 108;

  const bulbSize = useMemo(() => {
    if (isMobile) return { width: 85, height: 128 };
    if (isTablet) return { width: 100, height: 150 };
    return { width: 114, height: 170 };
  }, [isMobile, isTablet]);

  // Symmetrical 5-position regular pentagonal distribution:
  // angle = -PI/2 + (2 * PI * index) / 5
  // index 0: Top (270 deg)           -> Ideas Submitted
  // index 1: Top-Right (342 deg)      -> New Ideas (30d)
  // index 2: Bottom-Right (54 deg)    -> Ideas in Action
  // index 3: Bottom-Left (126 deg)    -> Delivered
  // index 4: Top-Left (198 deg)       -> Your Ideas
  //
  // COORDINATED OVERLAPPING ENTRANCE SEQUENCE:
  // - Bulb reveals first (0.00s -> 0.70s)
  // - Cards launch in a swift, organic wave from the lower staging region with 130ms stagger:
  //   1. Ideas in Action (Leader -> Bottom-Right, 414 deg): delay = 0.55s, duration = 1.55s
  //   2. New Ideas (30d) (Follower -> Top-Right, 342 deg):  delay = 0.68s, duration = 1.45s
  //   3. Ideas Submitted (Follower -> Top, 270 deg):        delay = 0.81s, duration = 1.35s
  //   4. Your Ideas      (Follower -> Top-Left, 198 deg):   delay = 0.94s, duration = 1.25s
  //   5. Delivered       (Follower -> Bottom-Left, 126 deg): delay = 1.07s, duration = 1.15s
  //
  // Because the leader sweeps to the farthest clockwise position and trailing cards peel into
  // preceding positions, no card ever overtakes or crosses through a previously settled card!
  // Between 1.07s and 2.10s, all five cards are in flight concurrently in a fluid orbital wave.
  // All cards settle smoothly into the stationary regular pentagon circle between 2.10s and 2.22s.
  const kpiItems = useMemo(
    () => [
      {
        id: 'submitted',
        title: 'Ideas Submitted',
        shortLabel: 'Submitted',
        subtext: 'All-time proposals',
        value: stats.total || 0,
        icon: FileText,
        color: '#7C3AED',
        iconBg: 'bg-purple-100 text-[#7C3AED] dark:bg-purple-950/80 dark:text-purple-300',
        href: '/employee/ideas',
        targetAngleDeg: 270, // Final: Top (12 o'clock)
        delay: 0.81,
        duration: 1.35,
      },
      {
        id: 'new30d',
        title: 'New Ideas (30d)',
        shortLabel: 'New (30d)',
        subtext: 'Last 30-day influx',
        value: stats.last30Days || 0,
        icon: TrendingUp,
        color: '#059669',
        iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300',
        href: '/employee/ideas',
        targetAngleDeg: 342, // Final: Top-Right (~2 o'clock)
        delay: 0.68,
        duration: 1.45,
      },
      {
        id: 'inAction',
        title: 'Ideas in Action',
        shortLabel: 'In Action',
        subtext: 'Approved & building',
        value: stats.inAction || 0,
        icon: Rocket,
        color: '#D97706',
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-300',
        href: '/employee/ideas',
        targetAngleDeg: 414, // Final: Bottom-Right (~4 o'clock, 54 deg)
        delay: 0.55,
        duration: 1.55,
      },
      {
        id: 'delivered',
        title: 'Delivered',
        shortLabel: 'Delivered',
        subtext: 'Live in production',
        value: stats.delivered || 0,
        icon: Trophy,
        color: '#2563EB',
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300',
        href: '/employee/ideas',
        targetAngleDeg: 126, // Final: Bottom-Left (~7 o'clock)
        delay: 1.07,
        duration: 1.15,
      },
      {
        id: 'myIdeas',
        title: 'Your Ideas',
        shortLabel: 'Your Ideas',
        subtext: 'Proposed by you',
        value: myIdeasCount || 0,
        icon: Sparkles,
        color: '#9333EA',
        iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300',
        href: '/employee/my-ideas',
        targetAngleDeg: 198, // Final: Top-Left (~10 o'clock)
        delay: 0.94,
        duration: 1.25,
      },
    ],
    [stats.total, stats.last30Days, stats.inAction, stats.delivered, myIdeasCount]
  );

  // Common staging launch angle: 82 deg (lower region, initiating clockwise sweep)
  const startAngleRad = (82 * Math.PI) / 180;

  // Compute mathematical trajectories and settled coordinates for all cards
  const cardsWithTrajectory = useMemo(() => {
    return kpiItems.map((item) => {
      const targetRad = (item.targetAngleDeg * Math.PI) / 180;

      // Final settled circular orbit coordinates
      const finalX = Math.round(cx + radiusX * Math.cos(targetRad) - cardDiameter / 2);
      const finalY = Math.round(cy + radiusY * Math.sin(targetRad) - cardDiameter / 2);

      // Trajectory keyframes along the shared clockwise circular orbit
      const trajectory = generateOrbitalTrajectory(
        startAngleRad,
        targetRad,
        cx,
        cy,
        radiusX,
        radiusY,
        cardDiameter,
        26
      );

      return {
        ...item,
        targetRad,
        finalX,
        finalY,
        trajectory,
      };
    });
  }, [cx, cy, radiusX, radiusY, cardDiameter, kpiItems, startAngleRad]);

  // Keep geometry and cards cached in refs for performance during high-frequency scroll frames
  useEffect(() => {
    radiusRef.current = { rx: radiusX, ry: radiusY };
    cardsRef.current = cardsWithTrajectory;
  }, [radiusX, radiusY, cardsWithTrajectory]);

  // Maximum subtle angular displacement (~28.5 deg = 0.497 rad, ~30% increase for enhanced responsiveness)
  // Preserves clear label orientation and equal card spacing without crowding
  const MAX_SCROLL_OFFSET_RAD = (28.5 * Math.PI) / 180;

  // Direct GPU translation along the exact circular orbit
  const applyOrbitalOffset = (offsetRad) => {
    const { rx, ry } = radiusRef.current;
    const cards = cardsRef.current;
    if (!cards || !rx || !ry) return;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const el = cardOrbitRefs.current[card.id];
      if (!el) continue;

      const rad = card.targetRad;
      // Precise offset along the ellipse: delta = newPosition - settledPosition
      const dx = rx * (Math.cos(rad + offsetRad) - Math.cos(rad));
      const dy = ry * (Math.sin(rad + offsetRad) - Math.sin(rad));

      el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
  };

  // Scroll synchronization engine using RAF with smooth inertia damping
  const syncScrollMotion = () => {
    if (prefersReduced || !isFormedRef.current) return;

    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    // Map scroll distance across showcase height to normalized 0..1 range
    const scrollRange = Math.max(dims.height * 0.92, 400);
    const progress = Math.min(Math.max(scrollY / scrollRange, 0), 1);
    targetOffsetRef.current = progress * MAX_SCROLL_OFFSET_RAD;

    if (rafIdRef.current == null) {
      const tick = () => {
        const diff = targetOffsetRef.current - currentOffsetRef.current;
        if (Math.abs(diff) < 0.0003) {
          currentOffsetRef.current = targetOffsetRef.current;
          applyOrbitalOffset(currentOffsetRef.current);
          rafIdRef.current = null;
        } else {
          // Liquid damping factor (0.18): responsive, fluid, and jitter-free
          currentOffsetRef.current += diff * 0.22;
          applyOrbitalOffset(currentOffsetRef.current);
          rafIdRef.current = requestAnimationFrame(tick);
        }
      };
      rafIdRef.current = requestAnimationFrame(tick);
    }
  };

  // 1. Enable scroll-driven circular motion ONLY after the initial formation animation finishes completely
  // The slowest entrance card finishes at 1.07s + 1.15s = 2.22s. We unlock at 2.35s.
  useEffect(() => {
    if (prefersReduced) {
      setIsFormed(true);
      isFormedRef.current = true;
      return;
    }

    const timer = setTimeout(() => {
      setIsFormed(true);
      isFormedRef.current = true;
      // If the user already scrolled during initial entrance, gently catch up to current scroll position
      syncScrollMotion();
    }, 2350);

    return () => clearTimeout(timer);
  }, [prefersReduced]);

  // 2. Passive scroll listener registered on window with automatic cleanup
  useEffect(() => {
    if (prefersReduced) return;

    const onScroll = () => {
      if (!isFormedRef.current) return;
      syncScrollMotion();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [prefersReduced, dims.height]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[650px] lg:max-w-[670px] h-[430px] sm:h-[460px] md:h-[485px] lg:h-[505px] max-h-[calc(100vh-150px)] flex items-center justify-center select-none overflow-visible"
      aria-label="Radial KPI Innovation Showcase"
    >
      {/* 1. THIN, SUBTLE CIRCULAR OUTLINE SVG (Reinforces final arrangement) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="bulb-ambient-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#C4B5FD" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient subtle glow disk */}
        <circle cx={cx} cy={cy} r={radiusX * 0.65} fill="url(#bulb-ambient-aura)" />

        {/* Thin, subtle dashed circular/elliptical orbit guide */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={radiusX}
          ry={radiusY}
          fill="none"
          stroke="#A78BFA"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          strokeOpacity="0.38"
          className="dark:stroke-purple-600/40"
        />

        {/* Faint inner concentric guide ring */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={radiusX * 0.66}
          ry={radiusY * 0.66}
          fill="none"
          stroke="#C4B5FD"
          strokeWidth="0.8"
          strokeOpacity="0.20"
          className="dark:stroke-purple-700/25"
        />

        {/* Hollow purple ring node at bottom center (90 deg) */}
        <circle
          cx={cx}
          cy={cy + radiusY}
          r="4.5"
          fill="#FAF5FF"
          stroke="#A855F7"
          strokeWidth="2"
        />

        {/* Hollow purple ring node on left lower arc (164 deg) */}
        <circle
          cx={cx + radiusX * Math.cos((164 * Math.PI) / 180)}
          cy={cy + radiusY * Math.sin((164 * Math.PI) / 180)}
          r="3.5"
          fill="#FAF5FF"
          stroke="#A855F7"
          strokeWidth="1.8"
        />

        {/* Soft lavender dot at upper left (305 deg) */}
        <circle
          cx={cx + radiusX * Math.cos((305 * Math.PI) / 180)}
          cy={cy + radiusY * Math.sin((305 * Math.PI) / 180)}
          r="3"
          fill="#C4B5FD"
          opacity="0.8"
        />

        {/* Soft amber dot at upper right (15 deg) */}
        <circle
          cx={cx + radiusX * Math.cos((15 * Math.PI) / 180)}
          cy={cy + radiusY * Math.sin((15 * Math.PI) / 180)}
          r="3"
          fill="#F59E0B"
          opacity="0.75"
        />
      </svg>

      {/* 2. CENTRAL INNOVATION BULB — Standalone floating bulb with complete screw base and zero crystals */}
      <motion.div
        className="relative z-10 flex items-center justify-center pointer-events-none"
        initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.70, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: bulbSize.width,
          height: bulbSize.height,
        }}
      >
        {/* Restrained lavender halo behind bulb */}
        <div className="absolute inset-0 m-auto w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-purple-300/20 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

        {/* 3D AI Brain Lightbulb Image — standalone with complete screw base */}
        <img
          src="/assets/spark_bulb_standalone_clean.png"
          alt="AI Brain Innovation Lightbulb"
          className="w-full h-full object-contain drop-shadow-[0_10px_24px_rgba(107,47,168,0.18)] select-none"
          draggable="false"
        />
      </motion.div>

      {/* 3. FIVE CIRCULAR KPI CARDS — Organic Overlapping Orbital Assembly */}
      {cardsWithTrajectory.map((card) => {
        const Icon = card.icon;
        const isHovered = hoveredId === card.id;

        return (
          <motion.div
            key={card.id}
            className="absolute z-20"
            style={{
              width: cardDiameter,
              height: cardDiameter,
              left: 0,
              top: 0,
            }}
            initial={
              prefersReduced
                ? { x: card.finalX, y: card.finalY, opacity: 1, scale: 1 }
                : {
                    x: card.trajectory.xFrames[0],
                    y: card.trajectory.yFrames[0],
                    opacity: 0,
                    scale: 0.40,
                  }
            }
            animate={
              prefersReduced
                ? { x: card.finalX, y: card.finalY, opacity: 1, scale: 1 }
                : {
                    x: card.trajectory.xFrames,
                    y: card.trajectory.yFrames,
                    opacity: card.trajectory.opacityFrames,
                    scale: card.trajectory.scaleFrames,
                  }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : {
                    duration: card.duration,
                    delay: card.delay,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          >
            {/* Scroll-driven circular offset container (enabled after initial formation completes) */}
            <div
              ref={(el) => {
                cardOrbitRefs.current[card.id] = el;
              }}
              className="w-full h-full"
              style={{ willChange: 'transform' }}
            >
              {/* Clickable circular card anchor matching reference design */}
              <A
                to={card.href}
                className={`group relative flex flex-col items-center justify-center rounded-full text-center transition-all duration-200 outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
                  isHovered
                    ? 'scale-[1.07] ring-2 ring-purple-500/70 z-30'
                    : 'hover:scale-[1.03]'
                }`}
                style={{
                  width: cardDiameter,
                  height: cardDiameter,
                  background: '#ffffff',
                  border: isHovered
                    ? `2px solid ${card.color}`
                    : '1.5px solid rgba(226, 216, 245, 0.95)',
                  boxShadow: isHovered
                    ? `0 20px 40px -8px rgba(124,58,237,0.25), 0 0 0 1px ${card.color}`
                    : '0 10px 25px -4px rgba(107, 47, 168, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
                }}
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(card.id)}
                onBlur={() => setHoveredId(null)}
                aria-label={`${card.title}: ${card.value}`}
              >
                {/* Inner Circle Content */}
                <div className="flex flex-col items-center justify-center px-2 py-1">
                  {/* Micro Icon */}
                  <div
                    className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center mb-1 shrink-0 transition-transform group-hover:scale-110 shadow-2xs ${card.iconBg}`}
                  >
                    <Icon size={isMobile ? 12 : 14} strokeWidth={2.4} />
                  </div>

                  {/* Big Metric Number */}
                  <span className="font-display font-black text-lg sm:text-xl lg:text-[21px] text-[#1E1B4B] dark:text-[#FAF7FF] leading-none tracking-tight">
                    <AnimatedNumber value={card.value} />
                  </span>

                  {/* Short Label */}
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-[#64748B] dark:text-[#A9A1C9] leading-tight line-clamp-1 mt-1 max-w-[82px]">
                    {card.shortLabel}
                  </span>

                  {/* Subtle Brand Accent Indicator Dash */}
                  <span
                    className="w-4 sm:w-4.5 h-0.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: card.color, opacity: 0.9 }}
                  />
                </div>

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div
                    className="absolute bottom-full mb-2.5 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-[10.5px] font-semibold whitespace-nowrap shadow-xl pointer-events-none z-40 animate-fade-in flex items-center gap-1.5"
                    role="tooltip"
                  >
                    <span>{card.title}</span>
                    <span className="opacity-70 font-normal">({card.subtext})</span>
                  </div>
                )}
              </A>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
