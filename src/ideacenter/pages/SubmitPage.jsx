import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Lightbulb,
  Target,
  TrendingUp,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  Compass,
  Zap,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  Check,
  Eye,
  X,
} from 'lucide-react';
import IdeaCard from '../components/IdeaCard.jsx';
import { api } from '../api/ideaApi.js';
import { asMessage } from '../api/errors.js';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import { A, navigate, getNavState } from '../hooks/useNav.jsx';
import {
  DOMAINS,
  TIMELINES,
  TARGET_DEPTS,
  TECH_AREAS,
  SUBMITTER_TYPES,
  BENEFIT_TYPES,
  BENEFIT_PERIODS,
  ROI_CONFIDENCE,
  SENSITIVE_OPTIONS,
  LIMITS,
} from '../lookups.js';
import { validateIdea, validateStep } from '../lib/validate.js';
import { computeRoi, inr } from '../lib/roi.js';
import { Field } from '../components/ui.jsx';
import EmailVerify from '../components/EmailVerify.jsx';
import BotCheck from '../components/BotCheck.jsx';

const STEPS = [
  { id: 1, label: 'Idea basics', icon: Lightbulb },
  { id: 2, label: 'Problem & solution', icon: Target },
  { id: 3, label: 'Business impact', icon: TrendingUp },
  { id: 4, label: 'Review', icon: ClipboardCheck },
];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return ImageIcon;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return FileText;
  return File;
}

export default function SubmitPage() {
  const user = useCurrentUser();
  const { toast, bump } = useSpark();
  const signedIn = !!user;

  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [f, setF] = useState(() => ({
    name: '',
    email: '',
    submitterType: 'Employee',
    title: getNavState()?.draftTitle || '',
    domain: '',
    otherDomain: '',
    technology: '',
    otherTechnology: '',
    timeline: '',
    otherTimeline: '',
    targetDept: '',
    otherTargetDept: '',
    problem: '',
    solution: '',
    stack: '',
    plan: '',
    sensitive: 'Not sure',
    benefitType: '',
    otherBenefitType: '',
    benefitDescription: '',
    investment: '',
    financialBenefit: '',
    benefitPeriod: 'Annual',
    roiConfidence: 'Rough',
    files: [],
    consent: false,
  }));

  const [errors, setErrors] = useState({});
  const [verifyToken, setVerifyToken] = useState(null);
  const [botToken, setBotToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const name = signedIn ? user.name : f.name;
  const email = signedIn ? user.email : f.email;

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
    setFormError('');
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setShowPreview(false);
    };
    if (showPreview) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPreview]);

  const roi = useMemo(
    () => computeRoi(f),
    [f.investment, f.financialBenefit, f.benefitPeriod]
  ); // eslint-disable-line

  // Simulated live idea card data for the preview
  const previewIdea = useMemo(() => {
    const domainVal = f.domain === 'Other' ? (f.otherDomain || 'Other') : (f.domain || 'Innovation');
    const techVal = f.technology === 'Other' ? (f.otherTechnology || 'Other') : (f.technology || 'Technology');
    const deptVal = f.targetDept === 'Other' ? (f.otherTargetDept || '') : (f.targetDept || (signedIn ? user?.dept : ''));
    return {
      id: 'IDEA-PREVIEW',
      title: f.title.trim() || 'Your idea title appears here',
      category: domainVal,
      technology: techVal,
      domain: domainVal,
      timeline: f.timeline === 'Other' ? f.otherTimeline : f.timeline,
      solution: f.solution.trim() || f.problem.trim() || 'Your proposed solution and approach will appear here as you type.',
      submitterName: name || 'Your name',
      dept: deptVal,
      createdAt: Date.now(),
      voteCount: 0,
      votedByMe: false,
      status: 'Submitted',
    };
  }, [f.domain, f.otherDomain, f.technology, f.otherTechnology, f.timeline, f.otherTimeline, f.targetDept, f.otherTargetDept, f.title, f.solution, f.problem, name, signedIn, user]);

  // Proposal readiness meter for live preview
  const readiness = useMemo(() => {
    const hasTitle = (f.title || '').trim().length >= 6;
    const hasDomain = !!(f.domain && (f.domain !== 'Other' || (f.otherDomain || '').trim()));
    const hasTech = !!(f.technology && (f.technology !== 'Other' || (f.otherTechnology || '').trim()));
    const hasTimeline = !!(f.timeline && (f.timeline !== 'Other' || (f.otherTimeline || '').trim()));
    const hasProblem = (f.problem || '').trim().length >= 15;
    const hasSolution = (f.solution || '').trim().length >= 15;

    let score = 0;
    if (hasTitle) score += 20;
    if (hasDomain) score += 15;
    if (hasTech) score += 15;
    if (hasTimeline) score += 10;
    if (hasProblem) score += 20;
    if (hasSolution) score += 20;

    return {
      score: Math.min(score, 100),
      hasTitle,
      hasDomain,
      hasTech,
      hasTimeline,
      hasProblem,
      hasSolution,
    };
  }, [f]);

  // File Upload Handlers
  const handleFiles = (newFileList) => {
    if (!newFileList || newFileList.length === 0) return;
    const added = Array.from(newFileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified,
    }));
    setF((prev) => ({
      ...prev,
      files: [...prev.files, ...added],
    }));
    toast(`${added.length} file(s) attached.`);
  };

  const removeFile = (indexToRemove) => {
    setF((prev) => ({
      ...prev,
      files: prev.files.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true); 3
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Step Navigation Validation
  const handleContinue = (e) => {
    e.preventDefault();
    setFormError('');
    const stepErrs = validateStep(step, f, { needsContact: !signedIn });
    if (Object.keys(stepErrs).length > 0) {
      setErrors(stepErrs);
      setFormError('Please complete all required fields before continuing.');
      const firstErr = Object.keys(stepErrs)[0];
      document.getElementById(`f-${firstErr}`)?.focus();
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleBack = () => {
    setFormError('');
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const goToStep = (targetStep) => {
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    // Validate current step before allowing forward jump
    const stepErrs = validateStep(step, f, { needsContact: !signedIn });
    if (Object.keys(stepErrs).length === 0) {
      setStep(targetStep);
    } else {
      setErrors(stepErrs);
      setFormError('Please complete current step fields first.');
    }
  };

  // Final Submission
  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      ...f,
      name,
      email,
      submitterType: signedIn ? 'Employee' : f.submitterType,
      investment: f.investment === '' ? null : Number(f.investment),
      financialBenefit: f.financialBenefit === '' ? null : Number(f.financialBenefit),
    };

    const errs = validateIdea(payload, { needsContact: !signedIn });
    if (!signedIn && !verifyToken) {
      errs.email = errs.email || 'Verify your email with the six-digit code before you submit.';
    }
    if (!signedIn && !botToken) {
      errs.bot = 'Tick the box to show you are a person.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setFormError('Some fields need attention before submission.');
      // Switch to first step with errors
      if (errs.title || errs.domain || errs.otherDomain || errs.technology || errs.otherTechnology || errs.timeline || errs.otherTimeline) {
        setStep(1);
      } else if (errs.problem || errs.solution) {
        setStep(2);
      } else if (errs.benefitType || errs.otherBenefitType || errs.benefitDescription || errs.investment || errs.financialBenefit) {
        setStep(3);
      } else {
        setStep(4);
      }
      return;
    }

    setBusy(true);
    try {
      if (signedIn) {
        const r = await api.createIdea(payload);
        bump();
        navigate('/submitted', { id: r.id, signedIn: true });
      } else {
        const r = await api.publicCreateIdea({
          ...payload,
          verificationToken: verifyToken,
          botToken,
        });
        navigate('/submitted', { id: r.id, trackingUrl: r.trackingUrl, signedIn: false });
      }
      toast('Thank you for submitting! Leadership will review and will update about the status.');
    } catch (err) {
      setFormError(asMessage(err));
    }
    setBusy(false);
  };

  const INPUT_CLS =
    'w-full border border-slate-200 dark:border-purple-800/60 rounded-lg px-3 py-1.5 bg-white dark:bg-[#251D4A] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] transition';
  const TEXTAREA_CLS =
    'w-full border border-slate-200 dark:border-purple-800/60 rounded-lg px-3 py-1.5 bg-white dark:bg-[#251D4A] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] transition resize-y min-h-[58px] sm:min-h-[64px] leading-relaxed';
  const SELECT_CLS =
    'w-full border border-slate-200 dark:border-purple-800/60 rounded-lg px-3 py-1.5 bg-white dark:bg-[#251D4A] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] transition cursor-pointer';

  return (
    <div className={`w-full mx-auto px-2 sm:px-4 transition-all duration-300 ${showPreview ? 'max-w-6xl' : 'max-w-3xl lg:max-w-[840px]'}`}>
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* LEFT COLUMN: THE PROPOSAL WIZARD CARD */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#1E1740] border border-slate-200/90 dark:border-purple-900/60 rounded-2xl shadow-xl shadow-purple-500/5 overflow-hidden transition-all flex flex-col max-h-[calc(100vh-76px)]">

          {/* 1. HEADER SECTION */}
          <div className="px-5 sm:px-7 pt-3.5 sm:pt-4 pb-2 shrink-0 bg-white dark:bg-[#1E1740]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#1E1B4B] dark:text-[#EEE9FC] tracking-tight leading-tight">
                  Create an innovation proposal
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#A9A1C9] mt-0.5">
                  Turn your idea into an actionable business proposal.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer border ${showPreview
                      ? 'bg-purple-100 dark:bg-purple-900/70 text-[#7C3AED] dark:text-purple-200 border-[#7C3AED]'
                      : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60 shadow-2xs'
                    }`}
                  title={showPreview ? 'Hide preview' : 'Show live preview on right side'}
                >
                  <Eye size={11} className="text-[#7C3AED] dark:text-purple-300" />
                  <span>{showPreview ? 'Hide preview' : 'Live preview'}</span>
                </button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200 border border-slate-200/70 dark:border-purple-800/60 shadow-2xs">
                  Step {step} of 4
                </span>
              </div>
            </div>

            {/* PURPLE PROGRESS TRACK */}
            <div className="w-full bg-slate-100 dark:bg-purple-950/50 h-1 rounded-full mt-2.5 mb-2 overflow-hidden">
              <div
                className="h-full bg-[#7C3AED] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            {/* 2. STEPPER TAB BAR */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 border-b border-slate-100 dark:border-purple-900/40 pb-2 overflow-x-auto no-scrollbar">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isPast = step > s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${isActive
                        ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                        : isPast
                          ? 'text-[#7C3AED] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-purple-200 hover:bg-slate-50 dark:hover:bg-[#251D4A]/50'
                      }`}
                  >
                    <Icon
                      size={14}
                      className={`shrink-0 ${isActive
                          ? 'text-white'
                          : isPast
                            ? 'text-[#7C3AED] dark:text-purple-300'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                    />
                    <span className="whitespace-nowrap">{s.label}</span>
                    {isPast && (
                      <Check size={11} className="text-emerald-500 dark:text-emerald-400 shrink-0 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. STEP CONTENT FORM */}
          <form onSubmit={step === 4 ? submit : handleContinue} noValidate className="flex-1 flex flex-col min-h-0 overflow-hidden">

            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3">
              {/* STEP 1: IDEA BASICS */}
              {step === 1 && (
                <div className="space-y-2.5 sm:space-y-3 animate-fadeIn">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                      Tell us about your idea
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-[#A9A1C9] mt-0.5">
                      Start with a clear name and where your idea fits.
                    </p>
                  </div>

                  {/* Idea Title */}
                  <Field
                    label="Idea title *"
                    htmlFor="f-title"
                    error={errors.title}
                  >
                    <input
                      id="f-title"
                      type="text"
                      maxLength={LIMITS.title}
                      value={f.title}
                      onChange={set('title')}
                      placeholder="e.g. AI-powered automated test-data masking"
                      className={INPUT_CLS}
                    />
                  </Field>

                  {/* Domain & Technology Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Domain Selection */}
                    <div>
                      <Field label="Domain *" htmlFor="f-domain" error={errors.domain}>
                        <select
                          id="f-domain"
                          value={f.domain}
                          onChange={set('domain')}
                          className={SELECT_CLS}
                        >
                          <option value="">Select domain</option>
                          {DOMAINS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Dynamic Input if "Other" domain is selected */}
                      {f.domain === 'Other' && (
                        <div className="mt-2 animate-fadeIn">
                          <Field
                            label="Specify domain *"
                            htmlFor="f-otherDomain"
                            error={errors.otherDomain}
                          >
                            <input
                              id="f-otherDomain"
                              type="text"
                              value={f.otherDomain}
                              onChange={set('otherDomain')}
                              placeholder="e.g. Aerospace, Agriculture, LegalTech..."
                              className={INPUT_CLS}
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* Technology Area Selection */}
                    <div>
                      <Field label="Technology area *" htmlFor="f-technology" error={errors.technology}>
                        <select
                          id="f-technology"
                          value={f.technology}
                          onChange={set('technology')}
                          className={SELECT_CLS}
                        >
                          <option value="">Select technology</option>
                          {TECH_AREAS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Dynamic Input if "Other" technology is selected */}
                      {f.technology === 'Other' && (
                        <div className="mt-2 animate-fadeIn">
                          <Field
                            label="Specify technology area *"
                            htmlFor="f-otherTechnology"
                            error={errors.otherTechnology}
                          >
                            <input
                              id="f-otherTechnology"
                              type="text"
                              value={f.otherTechnology}
                              onChange={set('otherTechnology')}
                              placeholder="e.g. Computer Vision, Blockchain, Quantum..."
                              className={INPUT_CLS}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline to Build & Target Department Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Timeline Selection */}
                    <div>
                      <Field
                        label="Timeline to build *"
                        htmlFor="f-timeline"
                        error={errors.timeline}
                      >
                        <select
                          id="f-timeline"
                          value={f.timeline}
                          onChange={set('timeline')}
                          className={SELECT_CLS}
                        >
                          <option value="">Select timeline</option>
                          {TIMELINES.map((tl) => (
                            <option key={tl} value={tl}>
                              {tl}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Dynamic Input if "Other" timeline is selected */}
                      {f.timeline === 'Other' && (
                        <div className="mt-2 animate-fadeIn">
                          <Field
                            label="Specify timeline *"
                            htmlFor="f-otherTimeline"
                            error={errors.otherTimeline}
                          >
                            <input
                              id="f-otherTimeline"
                              type="text"
                              value={f.otherTimeline}
                              onChange={set('otherTimeline')}
                              placeholder="e.g. 2-3 weeks prototype, 9 months roadmap..."
                              className={INPUT_CLS}
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* Target Department Selection */}
                    <div>
                      <Field
                        label="Target department"
                        htmlFor="f-targetDept"
                        error={errors.targetDept}
                      >
                        <select
                          id="f-targetDept"
                          value={f.targetDept}
                          onChange={set('targetDept')}
                          className={SELECT_CLS}
                        >
                          <option value="">Who will benefit from this idea?</option>
                          {TARGET_DEPTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Dynamic Input if "Other" target dept is selected */}
                      {f.targetDept === 'Other' && (
                        <div className="mt-2 animate-fadeIn">
                          <Field
                            label="Specify target department *"
                            htmlFor="f-otherTargetDept"
                            error={errors.otherTargetDept}
                          >
                            <input
                              id="f-otherTargetDept"
                              type="text"
                              value={f.otherTargetDept}
                              onChange={set('otherTargetDept')}
                              placeholder="e.g. Customer Experience, Procurement..."
                              className={INPUT_CLS}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PROBLEM & SOLUTION */}
              {step === 2 && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                      Problem & proposed solution
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-[#A9A1C9] mt-0.5">
                      Articulate the pain point clearly and how your proposal addresses it.
                    </p>
                  </div>

                  {/* Problem statement */}
                  <Field
                    label="Problem statement *"
                    htmlFor="f-problem"
                    hint="What is the pain point, and who faces it in daily operations?"
                    error={errors.problem}
                    counter={
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">
                        {f.problem.length} / {LIMITS.problem}
                      </div>
                    }
                  >
                    <textarea
                      id="f-problem"
                      maxLength={LIMITS.problem}
                      value={f.problem}
                      onChange={set('problem')}
                      placeholder="Describe the current operational challenge, bottlenecks, or inefficiencies..."
                      className={TEXTAREA_CLS}
                    />
                  </Field>

                  {/* Proposed solution */}
                  <Field
                    label="Proposed solution *"
                    htmlFor="f-solution"
                    hint="How would your idea solve the problem? What is the approach?"
                    error={errors.solution}
                    counter={
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">
                        {f.solution.length} / {LIMITS.solution}
                      </div>
                    }
                  >
                    <textarea
                      id="f-solution"
                      maxLength={LIMITS.solution}
                      value={f.solution}
                      onChange={set('solution')}
                      placeholder="Describe your solution architecture, AI workflow, automation, or process..."
                      className={TEXTAREA_CLS}
                    />
                  </Field>

                  {/* Tech Stack & Sensitive Data Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <Field
                      label="Technology stack / tools (optional)"
                      htmlFor="f-stack"
                      error={errors.stack}
                    >
                      <input
                        id="f-stack"
                        type="text"
                        maxLength={LIMITS.stack}
                        value={f.stack}
                        onChange={set('stack')}
                        placeholder="e.g. Python, OpenAI, React, Snowflake"
                        className={INPUT_CLS}
                      />
                    </Field>

                    <div>
                      <span className="block font-semibold mb-1 text-xs text-[#1E1B4B] dark:text-[#EEE9FC]">
                        Uses sensitive or customer data?
                      </span>
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        {SENSITIVE_OPTIONS.map((o) => (
                          <label
                            key={o}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${f.sensitive === o
                                ? 'bg-purple-100 dark:bg-purple-900/60 text-[#7C3AED] dark:text-purple-200 border-[#7C3AED]/50 shadow-2xs'
                                : 'bg-white dark:bg-[#251D4A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-purple-800/60 hover:border-purple-300'
                              }`}
                          >
                            <input
                              type="radio"
                              name="sensitive"
                              value={o}
                              checked={f.sensitive === o}
                              onChange={set('sensitive')}
                              className="sr-only"
                            />
                            <span>{o}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Implementation plan */}
                  <Field
                    label="Rough implementation plan (optional)"
                    htmlFor="f-plan"
                    hint="Key milestones or steps to build and roll this out."
                    error={errors.plan}
                  >
                    <textarea
                      id="f-plan"
                      maxLength={LIMITS.plan}
                      value={f.plan}
                      onChange={set('plan')}
                      placeholder="Phase 1: Proof of concept (2 weeks) → Phase 2: Pilot with department..."
                      className={TEXTAREA_CLS}
                    />
                  </Field>
                </div>
              )}

              {/* STEP 3: BUSINESS IMPACT & ATTACHMENTS */}
              {step === 3 && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                      Business impact & file attachments
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-[#A9A1C9] mt-0.5">
                      Quantify the anticipated value and attach supporting diagrams, mockups, or documents.
                    </p>
                  </div>

                  {/* Benefit Type & Other Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Field
                        label="Expected value type *"
                        htmlFor="f-benefitType"
                        error={errors.benefitType}
                      >
                        <select
                          id="f-benefitType"
                          value={f.benefitType}
                          onChange={set('benefitType')}
                          className={SELECT_CLS}
                        >
                          <option value="">Select expected value type</option>
                          {BENEFIT_TYPES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {f.benefitType === 'Other' && (
                        <div className="mt-2 animate-fadeIn">
                          <Field
                            label="Specify value type *"
                            htmlFor="f-otherBenefitType"
                            error={errors.otherBenefitType}
                          >
                            <input
                              id="f-otherBenefitType"
                              type="text"
                              value={f.otherBenefitType}
                              onChange={set('otherBenefitType')}
                              placeholder="e.g. Risk reduction, Brand reputation..."
                              className={INPUT_CLS}
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    <div className="sm:row-span-2">
                      <Field
                        label="Expected value and assumptions *"
                        htmlFor="f-benefitDescription"
                        hint="Explain the expected impact with assumptions."
                        error={errors.benefitDescription}
                        counter={
                          <div className="text-right text-[10px] text-slate-400 mt-0.5">
                            {f.benefitDescription.length} / {LIMITS.benefitDescription}
                          </div>
                        }
                      >
                        <textarea
                          id="f-benefitDescription"
                          maxLength={LIMITS.benefitDescription}
                          value={f.benefitDescription}
                          onChange={set('benefitDescription')}
                          placeholder="e.g. Automates manual data checks, saving 25 hours per sprint for a team of 6 engineers."
                          className={TEXTAREA_CLS}
                          style={{ minHeight: '68px' }}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* FILE UPLOAD ZONE */}
                  <div className="border border-slate-200 dark:border-purple-800/60 rounded-xl p-3 sm:p-3.5 bg-[#FAF8FE] dark:bg-[#251D4A]/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <UploadCloud size={16} className="text-[#7C3AED]" />
                        <span className="text-xs font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                          Attach supporting files (optional)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {f.files.length} attached
                      </span>
                    </div>

                    {/* Drag and Drop Box */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${dragActive
                          ? 'border-[#7C3AED] bg-purple-50 dark:bg-purple-950/60 scale-[1.01]'
                          : 'border-purple-200 dark:border-purple-800/60 hover:border-[#7C3AED] bg-white dark:bg-[#1E1740]'
                        }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg,.svg,.csv,.zip"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center">
                          <UploadCloud size={16} />
                        </div>
                        <p className="text-xs font-semibold text-[#1E1B4B] dark:text-[#EEE9FC]">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[10.5px] text-slate-400 max-w-sm">
                          PDF, DOCX, XLSX, PPTX, PNG, JPG, CSV (up to 25 MB per file)
                        </p>
                      </div>
                    </div>

                    {/* Uploaded File List */}
                    {f.files.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {f.files.map((file, idx) => {
                          const FileIcon = getFileIcon(file.name);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#1E1740] border border-purple-100 dark:border-purple-900/60 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-900/40 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0">
                                  <FileIcon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[#1E1B4B] dark:text-[#EEE9FC] truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(idx);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                                title="Remove file"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL ROI CALCULATOR */}
                  <details className="border border-slate-200 dark:border-purple-800/60 rounded-xl p-3 bg-white dark:bg-[#1E1740] group">
                    <summary className="cursor-pointer font-semibold text-xs text-[#7C3AED] dark:text-purple-300 select-none">
                      Optional financial estimate: calculate indicative ROI
                    </summary>
                    <div className="pt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field
                          label="Estimated investment (₹)"
                          htmlFor="f-investment"
                          error={errors.investment}
                        >
                          <input
                            id="f-investment"
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={f.investment}
                            onChange={set('investment')}
                            placeholder="e.g. 150000"
                            className={INPUT_CLS}
                          />
                        </Field>
                        <Field
                          label="Expected financial benefit (₹)"
                          htmlFor="f-financialBenefit"
                          error={errors.financialBenefit}
                        >
                          <input
                            id="f-financialBenefit"
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={f.financialBenefit}
                            onChange={set('financialBenefit')}
                            placeholder="e.g. 450000"
                            className={INPUT_CLS}
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Benefit period" htmlFor="f-benefitPeriod">
                          <select
                            id="f-benefitPeriod"
                            value={f.benefitPeriod}
                            onChange={set('benefitPeriod')}
                            className={SELECT_CLS}
                          >
                            {BENEFIT_PERIODS.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Estimate confidence" htmlFor="f-roiConfidence">
                          <select
                            id="f-roiConfidence"
                            value={f.roiConfidence}
                            onChange={set('roiConfidence')}
                            className={SELECT_CLS}
                          >
                            {ROI_CONFIDENCE.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      {/* Computed Metrics */}
                      <div className="grid grid-cols-3 gap-2.5 bg-[#FAF8FE] dark:bg-[#251D4A] rounded-lg p-2.5 text-xs">
                        <div>
                          <span className="block text-slate-400 text-[10px]">
                            Yearly benefit
                          </span>
                          <b className="font-bold text-[#1E1B4B] dark:text-[#EEE9FC] text-xs">
                            {roi ? inr(roi.annualBenefit) : '—'}
                          </b>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">
                            Net benefit
                          </span>
                          <b className="font-bold text-[#1E1B4B] dark:text-[#EEE9FC] text-xs">
                            {roi ? inr(roi.net) : '—'}
                          </b>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">
                            Indicative ROI
                          </span>
                          <b className="font-bold text-[#7C3AED] dark:text-purple-300 text-xs">
                            {roi ? `${roi.percent.toFixed(1)}%` : '—'}
                          </b>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMISSION */}
              {step === 4 && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                      Review your proposal
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-[#A9A1C9] mt-0.5">
                      Confirm proposal details before submitting to the Innovation Committee.
                    </p>
                  </div>

                  {/* PROPOSAL SUMMARY CARD */}
                  <div className="bg-[#FAF8FE] dark:bg-[#251D4A]/50 border border-purple-200/80 dark:border-purple-800/60 rounded-xl p-3.5 sm:p-4 space-y-3">
                    {/* Header with Title and Badges */}
                    <div className="border-b border-purple-100 dark:border-purple-900/50 pb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {/* Domain badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-[#7C3AED] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/70">
                          {f.domain === 'Other' ? f.otherDomain || 'Custom Domain' : f.domain || 'Domain'}
                        </span>
                        {/* Technology badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                          {f.technology === 'Other' ? f.otherTechnology || 'Custom Tech' : f.technology || 'Technology'}
                        </span>
                        {/* Timeline badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                          {f.timeline === 'Other' ? f.otherTimeline || 'Custom Timeline' : f.timeline || 'Timeline'}
                        </span>
                        {/* Target Dept badge */}
                        {f.targetDept && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                            {f.targetDept === 'Other' ? f.otherTargetDept || 'Custom Dept' : f.targetDept}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                        {f.title || 'Untitled Innovation Proposal'}
                      </h3>
                    </div>

                    {/* Problem & Solution review */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                          Problem Statement
                        </span>
                        <p className="text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed whitespace-pre-wrap">
                          {f.problem || 'Not specified'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                          Proposed Solution
                        </span>
                        <p className="text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed whitespace-pre-wrap">
                          {f.solution || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Expected Value review */}
                    <div className="border-t border-purple-100 dark:border-purple-900/50 pt-2 text-xs">
                      <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                        Expected Value & Impact
                      </span>
                      <p className="text-[#1E1B4B] dark:text-[#EEE9FC] mt-0.5 leading-relaxed">
                        <strong className="text-[#7C3AED] dark:text-purple-300">
                          {f.benefitType === 'Other' ? f.otherBenefitType : f.benefitType}:
                        </strong>{' '}
                        {f.benefitDescription}
                      </p>
                      {roi && (
                        <div className="flex gap-3 mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>Annual Benefit: {inr(roi.annualBenefit)}</span>
                          <span>•</span>
                          <span>Indicative ROI: {roi.percent.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Attached Files review */}
                    {f.files.length > 0 && (
                      <div className="border-t border-purple-100 dark:border-purple-900/50 pt-2">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block mb-1.5">
                          Attached Files ({f.files.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {f.files.map((file, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#1E1740] border border-slate-200 dark:border-purple-800 text-[11px] font-medium text-slate-700 dark:text-purple-200"
                            >
                              <FileText size={11} className="text-[#7C3AED]" />
                              <span className="truncate max-w-[180px]">{file.name}</span>
                              <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submitter details and consent */}
                  <div className="border border-slate-200 dark:border-purple-800/60 rounded-xl p-3 sm:p-3.5 space-y-2.5 bg-white dark:bg-[#1E1740]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6B2FA8] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {name
                            ? name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                            : 'U'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                            {name || 'Guest Submitter'}
                          </h4>
                          <p className="text-[10.5px] text-slate-400">
                            {email || 'Provide email below'}
                            {signedIn && user.dept ? ` • ${user.dept}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={13} />
                        <span>{signedIn ? 'Verified Employee' : 'External Submitter'}</span>
                      </span>
                    </div>

                    {/* If Not Signed In, ask for contact and verification */}
                    {!signedIn && (
                      <div className="space-y-3 pt-2.5 border-t border-slate-100 dark:border-purple-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Name *" htmlFor="f-name" error={errors.name}>
                            <input
                              id="f-name"
                              type="text"
                              value={f.name}
                              onChange={set('name')}
                              placeholder="Your full name"
                              className={INPUT_CLS}
                            />
                          </Field>
                          <Field label="Email *" htmlFor="f-email" error={errors.email}>
                            <input
                              id="f-email"
                              type="email"
                              value={f.email}
                              onChange={set('email')}
                              placeholder="name@company.com"
                              className={INPUT_CLS}
                            />
                          </Field>
                        </div>

                        <EmailVerify email={f.email} onVerified={setVerifyToken} />

                        <BotCheck
                          checked={!!botToken}
                          onToken={(t) => {
                            setBotToken(t);
                            setErrors((p) => ({ ...p, bot: undefined }));
                          }}
                        />
                        {errors.bot && (
                          <p className="text-xs text-rose-600 font-medium">{errors.bot}</p>
                        )}
                      </div>
                    )}

                    <label className="flex gap-2 items-start font-medium cursor-pointer text-xs text-[#1E1B4B] dark:text-[#EEE9FC] pt-1">
                      <input
                        type="checkbox"
                        checked={f.consent}
                        onChange={set('consent')}
                        className="mt-0.5 accent-[#7C3AED] rounded"
                      />
                      <span>Show my name on the solution page if this idea is built</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Close scrollable step body */}
            </div>

            {/* FORM ERROR MESSAGE */}
            {formError && (
              <div
                className="mx-4 sm:mx-6 my-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0"
                role="alert"
              >
                {formError}
              </div>
            )}

            {/* 4. FOOTER ACTION BAR (PINNED AT BOTTOM OF CARD) */}
            <div className="px-5 sm:px-7 py-2.5 sm:py-3 border-t border-slate-100 dark:border-purple-900/40 shrink-0 bg-white dark:bg-[#1E1740] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {/* Draft saved notice */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Draft saved automatically</span>
              </div>

              {/* Stepper Buttons & Live Preview */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-purple-800 text-xs font-semibold text-[#1E1B4B] dark:text-purple-200 hover:bg-slate-50 dark:hover:bg-purple-950/40 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Back</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${showPreview
                      ? 'border-[#7C3AED] bg-purple-100 dark:bg-purple-900/70 text-[#7C3AED] dark:text-purple-200'
                      : 'border-purple-200/90 dark:border-purple-800/80 bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-[#7C3AED] dark:text-purple-300'
                    }`}
                  title={showPreview ? 'Hide side preview' : 'Show live preview on right side'}
                >
                  <Eye size={13} />
                  <span>{showPreview ? 'Hide preview' : 'Live preview'}</span>
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-4 sm:px-5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white !text-white text-xs font-semibold shadow-md shadow-purple-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={busy || (!signedIn && !verifyToken)}
                    className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white !text-white text-xs font-bold shadow-lg shadow-purple-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    <span>{busy ? 'Submitting proposal…' : 'Submit proposal 🚀'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW SIDE PANEL (ON RIGHT SIDE, NOT POPUP) */}
        {showPreview && (
          <aside className="w-full lg:w-[350px] xl:w-[380px] shrink-0 bg-white dark:bg-[#1E1740] border border-slate-200/90 dark:border-purple-900/60 rounded-2xl shadow-xl shadow-purple-500/5 overflow-hidden transition-all flex flex-col max-h-[calc(100vh-76px)] animate-fadeIn">
            {/* Header of Preview Panel */}
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-purple-900/40 flex items-center justify-between shrink-0 bg-[#FAF8FE] dark:bg-[#251D4A]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Eye size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-[#EEE9FC] leading-none">
                    Live Idea Preview
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Updates in real time as you type
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-purple-950/60 transition cursor-pointer"
                title="Hide preview"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable Preview Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5">
              {/* Real-time IdeaCard */}
              <div className="shadow-xs">
                <IdeaCard idea={previewIdea} preview={true} />
              </div>

              {/* Proposal Readiness Meter */}
              <div className="bg-[#FAF8FE] dark:bg-[#251D4A] rounded-xl p-3 border border-purple-100 dark:border-purple-900/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#1E1B4B] dark:text-[#EEE9FC] flex items-center gap-1.5">
                    <Zap size={12} className="text-[#7C3AED]" />
                    Proposal Readiness
                  </span>
                  <span className="text-[#7C3AED] dark:text-purple-300 font-bold">
                    {readiness.score}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-purple-100 dark:bg-purple-950/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(readiness.score, 4)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 text-[10px] font-medium pt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-md ${readiness.hasTitle ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-purple-950/30'}`}>
                    {readiness.hasTitle ? '✓ Title' : '• Title'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md ${readiness.hasDomain ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-purple-950/30'}`}>
                    {readiness.hasDomain ? '✓ Domain' : '• Domain'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md ${readiness.hasTech ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-purple-950/30'}`}>
                    {readiness.hasTech ? '✓ Tech' : '• Tech'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md ${readiness.hasTimeline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-purple-950/30'}`}>
                    {readiness.hasTimeline ? '✓ Timeline' : '• Timeline'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md ${readiness.hasProblem ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-purple-950/30'}`}>
                    {readiness.hasProblem ? '✓ Problem' : '• Problem'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md ${readiness.hasSolution ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-purple-950/30'}`}>
                    {readiness.hasSolution ? '✓ Solution' : '• Solution'}
                  </span>
                </div>
              </div>

              {/* Quick sync info pill */}
              <div className="px-2.5 py-1.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-[10.5px] text-slate-500 dark:text-purple-300/80 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={11} className="text-[#7C3AED] dark:text-purple-300 shrink-0" />
                  <span>Simulated live card preview</span>
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Live
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
