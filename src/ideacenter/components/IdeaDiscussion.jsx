import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  CheckCircle2,
  RotateCcw,
  Send,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowUpDown,
  CornerDownRight,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { asMessage } from '../api/errors.js';
import { formatRelativeTime, formatFullDateTime, fdate } from '../lib/dates.js';
import {
  canComment,
  canEditComment,
  canDeleteComment,
  canResolveQuestion,
  canReopenQuestion,
  canDesignateOfficial,
  isLeadership,
  isOwner,
} from '../permissions.js';

export default function IdeaDiscussion({ idea, user, onChanged, toast }) {
  // Composer state
  const [composerType, setComposerType] = useState('comment'); // 'comment' | 'question'
  const [content, setContent] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Feed control state
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'questions' | 'comments'

  // Idea like in-flight state
  const [votingIdea, setVotingIdea] = useState(false);

  // Active reply composers: map of commentId -> boolean
  const [activeReplyId, setActiveReplyId] = useState(null);

  // Active editing items: map of { id, text, isReply, parentId } or null
  const [editingItem, setEditingItem] = useState(null);

  // Deleting in-flight IDs
  const [deletingId, setDeletingId] = useState(null);

  // Discussion raw list
  const discussionList = idea.discussion || [];

  // Filtered and sorted discussion
  const items = useMemo(() => {
    let list = [...discussionList];
    if (filterType === 'questions') {
      list = list.filter((item) => item.type === 'question');
    } else if (filterType === 'comments') {
      list = list.filter((item) => item.type === 'comment');
    }

    list.sort((a, b) => {
      if (sortOrder === 'newest') return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });

    return list;
  }, [discussionList, filterType, sortOrder]);

  // Engagement calculations from actual discussion data
  const totalReplies = discussionList.reduce(
    (acc, c) => acc + (c.replies ? c.replies.length : 0),
    0
  );
  const totalCommentsAndReplies = discussionList.length + totalReplies;
  const questionsList = discussionList.filter((c) => c.type === 'question');
  const unresolvedQuestionsCount = questionsList.filter((c) => !c.resolved).length;
  const resolvedQuestionsCount = questionsList.filter((c) => c.resolved).length;

  // Toggle Like on Idea
  const handleToggleIdeaLike = async () => {
    if (!user) {
      toast?.('Please sign in to like this idea.');
      return;
    }
    setVotingIdea(true);
    try {
      const res = await api.toggleVote(idea.id);
      if (onChanged) {
        onChanged({
          ...idea,
          voteCount: res.voteCount,
          votedByMe: res.votedByMe,
        });
      }
      toast?.(res.votedByMe ? 'Liked idea!' : 'Unliked idea');
    } catch (err) {
      toast?.(asMessage(err));
    } finally {
      setVotingIdea(false);
    }
  };

  // Submit new comment or question
  const handleSubmitComment = async (e) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setSubmitError('Please enter your message before submitting.');
      return;
    }
    if (!canComment(user, idea)) {
      setSubmitError('You do not have permission to post in this discussion.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const isOff = canDesignateOfficial(user) && isOfficial;
      const updated = await api.addComment(idea.id, {
        type: composerType,
        content: trimmed,
        isOfficial: isOff,
      });
      setContent('');
      setIsOfficial(false);
      onChanged?.(updated);
      toast?.(
        composerType === 'question'
          ? (isOff ? 'Official Committee Clarification submitted!' : 'Question posted to discussion!')
          : (isOff ? 'Official Leadership Guidance posted!' : 'Feedback posted!')
      );
    } catch (err) {
      setSubmitError(asMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Like on Comment or Reply (distinct from idea upvotes)
  const handleToggleLike = async (commentId, replyId = null) => {
    if (!user) {
      toast?.('Please sign in to like comments.');
      return;
    }
    try {
      const updated = await api.toggleCommentLike(idea.id, commentId, replyId);
      onChanged?.(updated);
    } catch (err) {
      toast?.(asMessage(err));
    }
  };

  // Toggle Resolve Question (permission checked in API and UI)
  const handleToggleResolve = async (commentId) => {
    try {
      const updated = await api.toggleResolveQuestion(idea.id, commentId);
      onChanged?.(updated);
      const target = (updated.discussion || []).find((c) => c.id === commentId);
      toast?.(
        target?.resolved ? 'Question marked as resolved!' : 'Question reopened.'
      );
    } catch (err) {
      toast?.(asMessage(err));
    }
  };

  // Toggle Official Leadership Guidance designation
  const handleToggleOfficialGuidance = async (commentId) => {
    try {
      const updated = await api.toggleOfficialGuidance(idea.id, commentId);
      onChanged?.(updated);
      const target = (updated.discussion || []).find((c) => c.id === commentId);
      toast?.(
        target?.isOfficial
          ? 'Designated as Official Leadership Guidance.'
          : 'Official guidance designation removed.'
      );
    } catch (err) {
      toast?.(asMessage(err));
    }
  };

  // Submit reply
  const handleAddReply = async (commentId, replyText, isOfficialReply, resetFn) => {
    const trimmed = (replyText || '').trim();
    if (!trimmed) return;
    try {
      const isOff = canDesignateOfficial(user) && !!isOfficialReply;
      const updated = await api.addReply(idea.id, commentId, {
        content: trimmed,
        isOfficial: isOff,
      });
      onChanged?.(updated);
      setActiveReplyId(null);
      resetFn?.();
      toast?.(isOff ? 'Official Leadership Guidance reply posted!' : 'Reply posted!');
    } catch (err) {
      toast?.(asMessage(err));
    }
  };

  // Save edit (comment or reply)
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const trimmed = (editingItem.text || '').trim();
    if (!trimmed) return;

    try {
      let updated;
      if (editingItem.isReply) {
        updated = await api.editReply(
          idea.id,
          editingItem.parentId,
          editingItem.id,
          { content: trimmed }
        );
      } else {
        updated = await api.editComment(idea.id, editingItem.id, { content: trimmed });
      }
      onChanged?.(updated);
      setEditingItem(null);
      toast?.('Changes saved.');
    } catch (err) {
      toast?.(asMessage(err));
    }
  };

  // Delete comment or reply
  const handleDelete = async (commentId, replyId = null) => {
    const isReply = !!replyId;
    const confirmMsg = isReply
      ? 'Are you sure you want to delete this reply?'
      : 'Are you sure you want to delete this discussion item and all its replies?';
    if (!window.confirm(confirmMsg)) return;

    const targetId = replyId || commentId;
    setDeletingId(targetId);
    try {
      let updated;
      if (isReply) {
        updated = await api.deleteReply(idea.id, commentId, replyId);
      } else {
        updated = await api.deleteComment(idea.id, commentId);
      }
      onChanged?.(updated);
      toast?.(isReply ? 'Reply deleted.' : 'Discussion item deleted.');
    } catch (err) {
      toast?.(asMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className="space-y-5 pt-3 border-t border-purple-100 dark:border-purple-900/40"
      aria-label="Idea discussion and engagement"
    >
      {/* 1. SECTION TITLE & COMPACT ENGAGEMENT SUMMARY */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC] m-0 leading-tight">
                Discussion & Feedback
              </h3>
              <p className="text-[11.5px] text-slate-500 dark:text-purple-300/80 m-0">
                Collaborative inquiry, questions & constructive feedback
              </p>
            </div>
          </div>

          {/* Authoritative Idea Upvote Count Summary Badge (Primary interactive upvote is in the Details header) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-[#251D4A] border border-purple-200/80 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-200 text-xs font-semibold shadow-2xs">
            <ThumbsUp
              size={12}
              className={idea.votedByMe ? 'fill-[#6B2FA8] text-[#6B2FA8] dark:fill-purple-300 dark:text-purple-300' : 'text-[#6B2FA8] dark:text-purple-300'}
            />
            <span>{idea.voteCount || 0} {idea.voteCount === 1 ? 'like' : 'likes'} on idea</span>
          </div>
        </div>

        {/* Engagement Summary Metric Pills */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-white/70 dark:bg-[#1E1740]/70 border border-purple-100 dark:border-purple-900/40 shadow-2xs">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/40 text-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-purple-300">
              Total Likes
            </span>
            <span className="text-base sm:text-lg font-black text-[#6B2FA8] dark:text-purple-200 leading-tight mt-0.5">
              {idea.voteCount || 0}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/40 text-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-purple-300">
              Comments & Replies
            </span>
            <span className="text-base sm:text-lg font-black text-[#1E1B4B] dark:text-[#EEE9FC] leading-tight mt-0.5">
              {totalCommentsAndReplies}
            </span>
          </div>

          <div
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border ${
              unresolvedQuestionsCount > 0
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60'
                : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60'
            }`}
          >
            <span
              className={`text-[10px] sm:text-[11px] font-medium ${
                unresolvedQuestionsCount > 0
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}
            >
              Unanswered Qs
            </span>
            <span
              className={`text-base sm:text-lg font-black leading-tight mt-0.5 ${
                unresolvedQuestionsCount > 0
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {unresolvedQuestionsCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. COMMENT & QUESTION COMPOSER */}
      <form
        onSubmit={handleSubmitComment}
        className="bg-white dark:bg-[#1E1740] rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-4 space-y-3.5 shadow-xs transition-all focus-within:border-[#8B5CF6] focus-within:shadow-md"
      >
        {/* Action Selector / Segmented Control */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div
            role="radiogroup"
            aria-label="Discussion message type"
            className="inline-flex p-1 rounded-xl bg-[#F5F0FD] dark:bg-[#251D4A] border border-purple-200/60 dark:border-purple-800/40"
          >
            <button
              type="button"
              role="radio"
              aria-checked={composerType === 'comment'}
              onClick={() => {
                setComposerType('comment');
                setSubmitError('');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                composerType === 'comment'
                  ? 'bg-white dark:bg-[#1E1740] text-[#6B2FA8] dark:text-purple-200 shadow-xs'
                  : 'text-slate-600 dark:text-purple-300/80 hover:text-[#6B2FA8]'
              }`}
            >
              <MessageSquare size={13} />
              <span>Feedback / Comment</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={composerType === 'question'}
              onClick={() => {
                setComposerType('question');
                setSubmitError('');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                composerType === 'question'
                  ? 'bg-white dark:bg-[#1E1740] text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-purple-300/80 hover:text-amber-700'
              }`}
            >
              <HelpCircle size={13} />
              <span>Ask a Question</span>
            </button>
          </div>

          {/* Submitter Role Identity Indicator */}
          {user && (
            <div className="text-[11px] text-slate-500 dark:text-purple-300 flex items-center gap-1.5">
              <span>Posting as:</span>
              <span className="font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                {user.name}
              </span>
              {isLeadership(user) ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/80">
                  Leadership
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-purple-950/40 dark:text-purple-300">
                  Employee
                </span>
              )}
            </div>
          )}
        </div>

        {/* Text Area with Dynamic Placeholder */}
        <div className="space-y-1">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (submitError) setSubmitError('');
            }}
            placeholder={
              composerType === 'question'
                ? 'Ask a question to clarify this idea (architecture, security, ROI, pilot rollout)...'
                : 'Share your feedback, suggestions, or technical guidance...'
            }
            maxLength={2000}
            className="w-full p-3 rounded-xl border border-purple-100 dark:border-purple-900/60 bg-[#FAF8FE] dark:bg-[#251D4A] text-xs sm:text-[13px] text-[#1E1B4B] dark:text-[#EEE9FC] placeholder-slate-400 dark:placeholder-purple-400/60 focus:bg-white dark:focus:bg-[#1E1740] focus:outline-none focus:border-[#6B2FA8] dark:focus:border-purple-500 transition resize-y min-h-[85px]"
          />
          {submitError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 m-0 pt-0.5">
              {submitError}
            </p>
          )}
        </div>

        {/* Leadership Official Designation Checkbox */}
        {canDesignateOfficial(user) && (
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#6B2FA8] dark:text-purple-300 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 select-none">
            <input
              type="checkbox"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="accent-[#6B2FA8] rounded w-3.5 h-3.5 cursor-pointer"
            />
            <ShieldCheck size={14} className="text-[#6B2FA8] dark:text-purple-300 shrink-0" />
            <span>
              {composerType === 'question'
                ? 'Designate as Official Committee Clarification'
                : 'Designate as Official Leadership Guidance'}
            </span>
          </label>
        )}

        {/* Footer: Character Counter & Submit Button */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[11px] text-slate-400">
            {content.length}/2000 characters
          </span>

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] hover:from-[#582090] hover:to-[#7C3AED] text-white font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Send size={13} />
            <span>
              {submitting
                ? 'Posting…'
                : composerType === 'question'
                ? 'Submit Question'
                : 'Post Feedback'}
            </span>
          </button>
        </div>
      </form>

      {/* 3. DISCUSSION CONTROLS (SORT & FILTER) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#6B2FA8] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1E1740] border border-purple-200 dark:border-purple-800/60 text-slate-600 dark:text-purple-300 hover:bg-purple-50'
            }`}
          >
            All ({discussionList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('questions')}
            className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer ${
              filterType === 'questions'
                ? 'bg-[#6B2FA8] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1E1740] border border-purple-200 dark:border-purple-800/60 text-slate-600 dark:text-purple-300 hover:bg-purple-50'
            }`}
          >
            Questions ({questionsList.length})
            {unresolvedQuestionsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                {unresolvedQuestionsCount} open
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('comments')}
            className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer ${
              filterType === 'comments'
                ? 'bg-[#6B2FA8] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1E1740] border border-purple-200 dark:border-purple-800/60 text-slate-600 dark:text-purple-300 hover:bg-purple-50'
            }`}
          >
            Feedback ({discussionList.length - questionsList.length})
          </button>
        </div>

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E1740] border border-purple-200 dark:border-purple-800 text-slate-600 dark:text-purple-300 font-medium hover:bg-purple-50 transition cursor-pointer"
          title="Toggle chronological sorting"
        >
          <ArrowUpDown size={12} className="text-[#6B2FA8] dark:text-purple-400" />
          <span>
            {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </span>
        </button>
      </div>

      {/* 4. DISCUSSION FEED */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-white/60 dark:bg-[#1E1740]/60 backdrop-blur-xs border border-dashed border-purple-200 dark:border-purple-800/60 rounded-2xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6B2FA8] dark:bg-purple-950/60 dark:text-purple-300 mx-auto flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#1E1B4B] dark:text-[#EEE9FC] m-0">
              No discussion yet.
            </p>
            <p className="text-xs text-slate-500 dark:text-purple-300/80 m-0 max-w-sm mx-auto">
              Start the conversation by sharing feedback or asking a question to help evaluate this idea.
            </p>
          </div>
        ) : (
          items.map((comment) => (
            <DiscussionItem
              key={comment.id}
              idea={idea}
              comment={comment}
              currentUser={user}
              onToggleLike={handleToggleLike}
              onToggleResolve={handleToggleResolve}
              onToggleOfficialGuidance={handleToggleOfficialGuidance}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              onAddReply={handleAddReply}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Individual Discussion Item (Comment or Question) Component
// -------------------------------------------------------------
function DiscussionItem({
  idea,
  comment,
  currentUser,
  onToggleLike,
  onToggleResolve,
  onToggleOfficialGuidance,
  activeReplyId,
  setActiveReplyId,
  onAddReply,
  editingItem,
  setEditingItem,
  onSaveEdit,
  onDelete,
  deletingId,
}) {
  const isQuestion = comment.type === 'question';
  const isResolved = isQuestion && !!comment.resolved;
  const isAuthor = currentUser?.id === comment.authorId;
  const isLead = isLeadership({ role: comment.authorRole });
  const isOfficial = !!comment.isOfficial;
  const canEdit = canEditComment(currentUser, comment);
  const canDel = canDeleteComment(currentUser, comment);
  const canResolve = canResolveQuestion(currentUser, comment, idea);
  const canReopen = canReopenQuestion(currentUser, comment, idea);
  const canOfficial = canDesignateOfficial(currentUser);
  const isIdeaOwner = isOwner(currentUser, idea);

  const isEditing = editingItem && editingItem.id === comment.id && !editingItem.isReply;
  const isReplying = activeReplyId === comment.id;

  const initials = comment.authorName
    ? comment.authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'U';

  const replies = comment.replies || [];

  return (
    <article
      className={`rounded-2xl border transition-all ${
        isOfficial
          ? 'bg-[#F7F2FE] dark:bg-[#281D4E] border-purple-400/90 dark:border-purple-600 ring-2 ring-purple-400/20 shadow-xs'
          : isQuestion
          ? isResolved
            ? 'bg-white dark:bg-[#1E1740] border-emerald-200/90 dark:border-emerald-900/50 shadow-2xs'
            : 'bg-white dark:bg-[#1E1740] border-amber-300/90 dark:border-amber-900/60 shadow-2xs ring-1 ring-amber-300/30'
          : isLead
          ? 'bg-white dark:bg-[#1E1740] border-purple-200/90 dark:border-purple-800/80 shadow-2xs'
          : 'bg-white dark:bg-[#1E1740] border-purple-100 dark:border-purple-900/40 shadow-2xs'
      } p-4 sm:p-4.5 space-y-3`}
    >
      {/* HEADER: Author, Role, Message Type Badge & Timestamp */}
      <div className="flex items-start justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with initials */}
          <div
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-2xs ${
              isLead || isOfficial
                ? 'bg-gradient-to-tr from-[#6B2FA8] to-[#9333EA]'
                : 'bg-gradient-to-tr from-slate-600 to-slate-400'
            }`}
          >
            {initials}
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-[13px] text-[#1E1B4B] dark:text-[#EEE9FC]">
                {comment.authorName}
              </span>

              {/* Role Label */}
              {isLead ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/80">
                  <ShieldCheck size={10} />
                  <span>{comment.authorRole === 'admin' ? 'Leadership • CIO Admin' : 'Leadership • Reviewer'}</span>
                </span>
              ) : (
                <span className="text-[10.5px] text-slate-400 dark:text-purple-300/70 font-medium">
                  Employee{comment.authorDept ? ` • ${comment.authorDept}` : ''}
                </span>
              )}
            </div>

            <div
              className="text-[11px] text-slate-400 dark:text-purple-300/60 flex items-center gap-1 mt-0.5"
              title={formatFullDateTime(comment.createdAt)}
            >
              <Clock size={11} />
              <span>{formatRelativeTime(comment.createdAt)}</span>
              {comment.updatedAt && (
                <span className="italic text-[10px] text-slate-400"> (edited)</span>
              )}
            </div>
          </div>
        </div>

        {/* Message Type Badge (Question vs Comment) & Resolved status / Official designation */}
        <div className="flex items-center gap-2">
          {isOfficial ? (
            isQuestion ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-2xs">
                <AlertCircle size={12} className="text-[#6B2FA8] dark:text-purple-200" />
                <span>Committee Clarification</span>
                {isResolved && (
                  <span className="ml-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    (Resolved)
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-2xs">
                <ShieldCheck size={12} className="text-[#6B2FA8] dark:text-purple-200" />
                <span>Official Leadership Guidance</span>
              </span>
            )
          ) : isQuestion ? (
            isResolved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>Resolved</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <AlertCircle size={12} className="text-amber-600 dark:text-amber-400" />
                <span>Open Question</span>
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-[#6B2FA8] dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60">
              <MessageSquare size={11} />
              <span>Feedback</span>
            </span>
          )}

          {/* Edit / Delete Actions */}
          {(canEdit || canDel) && !isEditing && (
            <div className="flex items-center gap-1 ml-1 text-slate-400">
              {canEdit && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingItem({
                      id: comment.id,
                      text: comment.content,
                      isReply: false,
                    })
                  }
                  className="p-1 rounded-md hover:bg-purple-100 hover:text-[#6B2FA8] dark:hover:bg-purple-900/50 transition cursor-pointer"
                  title="Edit comment"
                  aria-label="Edit comment"
                >
                  <Edit2 size={12} />
                </button>
              )}
              {canDel && (
                <button
                  type="button"
                  disabled={deletingId === comment.id}
                  onClick={() => onDelete(comment.id)}
                  className="p-1 rounded-md hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 transition cursor-pointer disabled:opacity-50"
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT: Normal or Inline Edit */}
      {isEditing ? (
        <div className="space-y-2 pt-1">
          <textarea
            rows={3}
            value={editingItem.text}
            onChange={(e) =>
              setEditingItem({ ...editingItem, text: e.target.value })
            }
            className="w-full p-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-[#FAF8FE] dark:bg-[#251D4A] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] focus:outline-none focus:border-[#6B2FA8]"
          />
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-slate-600 dark:text-purple-300 hover:bg-purple-50 cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={!editingItem.text.trim()}
              className="px-3 py-1 rounded-lg bg-[#6B2FA8] hover:bg-[#582090] text-white font-semibold cursor-pointer disabled:opacity-40"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed whitespace-pre-wrap break-words m-0">
          {comment.content}
        </p>
      )}

      {/* SUBMITTER COMMITTEE CLARIFICATION CALLOUT */}
      {isOfficial && isQuestion && !isResolved && isIdeaOwner && (
        <div className="p-3 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-[#6B2FA8] dark:text-purple-200 block">
              Clarification Requested by Innovation Committee
            </span>
            <p className="text-purple-900/80 dark:text-purple-300 m-0">
              Please click reply below to provide the clarification requested by leadership.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveReplyId(comment.id)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] hover:from-[#582090] hover:to-[#7C3AED] text-white font-bold shrink-0 cursor-pointer shadow-2xs transition"
          >
            Reply to Committee
          </button>
        </div>
      )}

      {/* QUESTION RESOLUTION NOTE (IF RESOLVED) */}
      {isResolved && comment.resolvedBy && (
        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-[11.5px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>
              Marked resolved by <strong>{comment.resolvedBy}</strong>{' '}
              {comment.resolvedAt && (
                <span className="text-emerald-700/80 dark:text-emerald-400/80">
                  • {formatRelativeTime(comment.resolvedAt)}
                </span>
              )}
            </span>
          </span>

          {canReopen && (
            <button
              type="button"
              onClick={() => onToggleResolve(comment.id)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer ml-auto"
            >
              <RotateCcw size={11} />
              <span>Reopen question</span>
            </button>
          )}
        </div>
      )}

      {/* ACTIONS BAR: Like, Reply, Mark Official, and Mark as Resolved (if open question) */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-100/70 dark:border-purple-900/30 text-xs">
        <div className="flex items-center gap-2">
          {/* Like comment button */}
          <button
            type="button"
            onClick={() => onToggleLike(comment.id)}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-semibold transition cursor-pointer ${
              comment.likedByMe
                ? 'bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200'
                : 'text-slate-500 hover:text-[#6B2FA8] dark:text-purple-300/70 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
            aria-pressed={comment.likedByMe}
            title={comment.likedByMe ? 'Unlike this comment' : 'Like this comment'}
          >
            <ThumbsUp
              size={12}
              className={comment.likedByMe ? 'fill-[#6B2FA8] text-[#6B2FA8] dark:fill-purple-300 dark:text-purple-300' : ''}
            />
            <span>{comment.likesCount || 0}</span>
          </button>

          {/* Reply button */}
          <button
            type="button"
            onClick={() => setActiveReplyId(isReplying ? null : comment.id)}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-semibold transition cursor-pointer ${
              isReplying
                ? 'bg-[#6B2FA8] text-white shadow-2xs'
                : 'text-slate-500 hover:text-[#6B2FA8] dark:text-purple-300/70 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <CornerDownRight size={12} />
            <span>{replies.length > 0 ? `Reply (${replies.length})` : 'Reply'}</span>
          </button>

          {/* Leadership toggle official status button */}
          {canOfficial && (
            <button
              type="button"
              onClick={() => onToggleOfficialGuidance(comment.id)}
              className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                comment.isOfficial
                  ? 'bg-purple-200 text-[#6B2FA8] dark:bg-purple-900/80 dark:text-purple-200 border border-purple-300'
                  : 'text-slate-400 hover:text-[#6B2FA8] hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
              title={comment.isOfficial ? 'Remove official leadership designation' : 'Designate as official leadership guidance'}
            >
              <ShieldCheck size={12} />
              <span>{comment.isOfficial ? 'Official' : 'Mark Official'}</span>
            </button>
          )}
        </div>

        {/* Mark as Resolved button (if question is open and user is permitted) */}
        {isQuestion && !isResolved && canResolve && (
          <button
            type="button"
            onClick={() => onToggleResolve(comment.id)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer ml-auto"
          >
            <CheckCircle2 size={12} />
            <span>Mark as resolved</span>
          </button>
        )}
      </div>

      {/* 5. THREADED REPLIES (Strictly 1-Level Deep) */}
      {(replies.length > 0 || isReplying) && (
        <div className="mt-2.5 pl-3.5 sm:pl-4 space-y-2.5 border-l-2 border-purple-200/80 dark:border-purple-800/60">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              commentId={comment.id}
              reply={reply}
              currentUser={currentUser}
              onToggleLike={onToggleLike}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
              deletingId={deletingId}
            />
          ))}

          {/* Inline Reply Composer */}
          {isReplying && (
            <ReplyComposer
              commentAuthor={comment.authorName}
              canOfficial={canOfficial}
              onSend={(text, isOfficialReply, reset) =>
                onAddReply(comment.id, text, isOfficialReply, reset)
              }
              onCancel={() => setActiveReplyId(null)}
            />
          )}
        </div>
      )}
    </article>
  );
}

// -------------------------------------------------------------
// Reply Item Component
// -------------------------------------------------------------
function ReplyItem({
  commentId,
  reply,
  currentUser,
  onToggleLike,
  editingItem,
  setEditingItem,
  onSaveEdit,
  onDelete,
  deletingId,
}) {
  const isLead = isLeadership({ role: reply.authorRole });
  const isOfficial = !!reply.isOfficial;
  const canEdit = canEditComment(currentUser, reply);
  const canDel = canDeleteComment(currentUser, reply);
  const isEditing = editingItem && editingItem.id === reply.id && editingItem.isReply;

  const initials = reply.authorName
    ? reply.authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'U';

  return (
    <div
      className={`rounded-xl p-3 border space-y-2 text-xs transition-all ${
        isOfficial
          ? 'bg-[#F7F2FE] dark:bg-[#281D4E] border-purple-300 dark:border-purple-700 ring-1 ring-purple-300/40'
          : 'bg-[#FAF8FE] dark:bg-[#251D4A] border-purple-100/90 dark:border-purple-900/50'
      }`}
    >
      {/* Reply Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
              isLead || isOfficial
                ? 'bg-gradient-to-tr from-[#6B2FA8] to-[#9333EA]'
                : 'bg-gradient-to-tr from-slate-600 to-slate-400'
            }`}
          >
            {initials}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <span className="font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
              {reply.authorName}
            </span>
            {isOfficial ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/70 dark:text-purple-200 border border-purple-200/80">
                <ShieldCheck size={10} />
                <span>Official Guidance</span>
              </span>
            ) : isLead ? (
              <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/80">
                Leadership
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                Employee{reply.authorDept ? ` • ${reply.authorDept}` : ''}
              </span>
            )}
            <span
              className="text-[10.5px] text-slate-400 flex items-center gap-0.5 ml-1"
              title={formatFullDateTime(reply.createdAt)}
            >
              • {formatRelativeTime(reply.createdAt)}
            </span>
            {reply.updatedAt && (
              <span className="italic text-[9.5px] text-slate-400"> (edited)</span>
            )}
          </div>
        </div>

        {/* Edit / Delete */}
        {(canEdit || canDel) && !isEditing && (
          <div className="flex items-center gap-1 text-slate-400">
            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  setEditingItem({
                    id: reply.id,
                    parentId: commentId,
                    text: reply.content,
                    isReply: true,
                  })
                }
                className="p-1 hover:text-[#6B2FA8] rounded transition cursor-pointer"
                title="Edit reply"
                aria-label="Edit reply"
              >
                <Edit2 size={11} />
              </button>
            )}
            {canDel && (
              <button
                type="button"
                disabled={deletingId === reply.id}
                onClick={() => onDelete(commentId, reply.id)}
                className="p-1 hover:text-rose-600 rounded transition cursor-pointer disabled:opacity-50"
                title="Delete reply"
                aria-label="Delete reply"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reply Message or Edit form */}
      {isEditing ? (
        <div className="space-y-1.5 pt-1">
          <textarea
            rows={2}
            value={editingItem.text}
            onChange={(e) =>
              setEditingItem({ ...editingItem, text: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#1E1740] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] focus:outline-none focus:border-[#6B2FA8]"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-2.5 py-0.5 rounded text-[11px] border border-purple-200 dark:border-purple-800 text-slate-600 dark:text-purple-300 hover:bg-purple-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={!editingItem.text.trim()}
              className="px-2.5 py-0.5 rounded text-[11px] bg-[#6B2FA8] hover:bg-[#582090] text-white font-semibold cursor-pointer disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed whitespace-pre-wrap break-words m-0">
          {reply.content}
        </p>
      )}

      {/* Reply footer: Like button */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onToggleLike(commentId, reply.id)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
            reply.likedByMe
              ? 'bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200'
              : 'text-slate-400 hover:text-[#6B2FA8]'
          }`}
          aria-pressed={reply.likedByMe}
          title={reply.likedByMe ? 'Unlike reply' : 'Like reply'}
        >
          <ThumbsUp
            size={11}
            className={reply.likedByMe ? 'fill-[#6B2FA8] text-[#6B2FA8] dark:fill-purple-300 dark:text-purple-300' : ''}
          />
          <span>{reply.likesCount || 0}</span>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Inline Reply Composer Component
// -------------------------------------------------------------
function ReplyComposer({ commentAuthor, canOfficial, onSend, onCancel }) {
  const [text, setText] = useState('');
  const [isOfficialReply, setIsOfficialReply] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    await onSend(text, isOfficialReply, () => setText(''));
    setBusy(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1E1740] rounded-xl p-3 border border-purple-200/90 dark:border-purple-800/80 space-y-2 shadow-xs animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-purple-300 font-medium">
        <span>Replying to {commentAuthor}</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-purple-200 cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      <textarea
        rows={2}
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a clear, constructive reply…"
        className="w-full p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/60 bg-[#FAF8FE] dark:bg-[#251D4A] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] focus:bg-white dark:focus:bg-[#1E1740] focus:outline-none focus:border-[#6B2FA8]"
      />

      <div className="flex items-center justify-between gap-2 text-xs pt-1">
        {canOfficial ? (
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#6B2FA8] dark:text-purple-300 select-none">
            <input
              type="checkbox"
              checked={isOfficialReply}
              onChange={(e) => setIsOfficialReply(e.target.checked)}
              className="accent-[#6B2FA8] rounded w-3 h-3 cursor-pointer"
            />
            <ShieldCheck size={12} />
            <span>Official guidance</span>
          </label>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-slate-600 dark:text-purple-300 hover:bg-purple-50 cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="px-3.5 py-1 rounded-lg bg-[#6B2FA8] hover:bg-[#582090] text-white font-semibold cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Send size={11} />
            <span>{busy ? 'Replying…' : 'Reply'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
