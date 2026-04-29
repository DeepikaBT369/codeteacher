'use client';
import { useState } from 'react';

export default function Roadmap({ data, goal, user, onBack }) {
  const [activeWeek, setActiveWeek] = useState(0);
  const [completedWeeks, setCompletedWeeks] = useState(new Set());
  const [submission, setSubmission] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [view, setView] = useState('roadmap');
  const [replyCount, setReplyCount] = useState(0);
  const [conversation, setConversation] = useState([]);

  if (!data?.weeks?.length) return (
    <div style={{ color: '#fff', padding: '2rem' }}>
      Error generating roadmap.
      <button onClick={onBack} style={{ marginLeft: 12, color: '#e8356b', background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button>
    </div>
  );

  const week = data.weeks[activeWeek];
  const progress = (completedWeeks.size / data.weeks.length) * 100;

  const getFeedback = async () => {
    if (!submission.trim() || replyCount >= 3) return;
    setLoadingFeedback(true);

    const newConversation = [...conversation, { role: 'student', text: submission }];

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal,
        weekTitle: week.title,
        assignment: week.assignment,
        submission,
        replyCount,
        conversation: newConversation,
      }),
    });
    const d = await res.json();
    const newReplyCount = replyCount + 1;
    setReplyCount(newReplyCount);
    setConversation([...newConversation, { role: 'teacher', text: d.feedback }]);
    setFeedback(d.feedback);
    setSubmission('');
    setLoadingFeedback(false);
  };

  const markComplete = () => {
    setCompletedWeeks(prev => new Set([...prev, activeWeek]));
    setSubmission('');
    setFeedback('');
    setReplyCount(0);
    setConversation([]);
    setView('roadmap');
    if (activeWeek < data.weeks.length - 1) setActiveWeek(activeWeek + 1);
  };

  if (view === 'assignment') {
    return (
      <div style={s.wrap}>
        <div style={s.topbar}>
          <button onClick={() => setView('roadmap')} style={s.backBtn}>← Back to roadmap</button>
          <span style={s.weekBadge}>Week {week.week}</span>
          <span style={{ ...s.weekBadge, background: replyCount >= 3 ? '#ff444422' : '#e8356b18', color: replyCount >= 3 ? '#ff4444' : '#e8356b', marginLeft: 8 }}>
            {3 - replyCount} teacher replies left
          </span>
        </div>
        <div style={s.assignWrap}>
          <h2 style={s.assignTitle}>{week.assignment.title}</h2>
          <p style={s.assignDesc}>{week.assignment.description}</p>

          <div style={s.infoCard}>
            <p style={s.infoLabel}>🎯 Your deliverable</p>
            <p style={s.infoText}>{week.assignment.deliverable}</p>
          </div>

          <div style={s.hintsBox}>
            <p style={s.infoLabel}>💡 Hints</p>
            {week.assignment.hints.map((h, i) => (
              <p key={i} style={s.hint}>• {h}</p>
            ))}
          </div>

          {week.resources && (
            <div style={{ marginTop: 20 }}>
              <p style={s.infoLabel}>📚 Resources</p>
              {week.resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer" style={s.resourceRow}>
                  <span style={{
                    ...s.resourceIcon,
                    background: r.type === 'video' ? '#ff000022' : r.type === 'article' ? '#0077ff22' : '#00ff7722',
                    color: r.type === 'video' ? '#ff4444' : r.type === 'article' ? '#4499ff' : '#44ff88',
                  }}>
                    {r.type === 'video' ? '▶' : r.type === 'article' ? '📖' : '📄'}
                  </span>
                  <span style={s.resourceTitle}>{r.title}</span>
                  <span style={s.resourceArrow}>→</span>
                </a>
              ))}
            </div>
          )}

          {/* Conversation history */}
          {conversation.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={s.infoLabel}>💬 Conversation with your teacher</p>
              {conversation.map((msg, i) => (
                <div key={i} style={{
                  ...s.msgBubble,
                  alignSelf: msg.role === 'student' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'student' ? '#e8356b18' : '#1a1a1a',
                  border: msg.role === 'student' ? '1px solid #e8356b44' : '1px solid #2a2a2a',
                }}>
                  <p style={{ fontSize: 11, color: msg.role === 'student' ? '#e8356b' : '#888', marginBottom: 4 }}>
                    {msg.role === 'student' ? 'You' : '🎓 AI Teacher'}
                  </p>
                  <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
              ))}
            </div>
          )}

          {replyCount < 3 ? (
            <div style={{ marginTop: 24 }}>
              <label style={s.label}>
                {replyCount === 0 ? 'Describe what you built or paste your code' : 'Continue the conversation...'}
              </label>
              <textarea
                value={submission}
                onChange={e => setSubmission(e.target.value)}
                placeholder={replyCount === 0 ? "Tell your AI teacher what you did, what worked, what didn't..." : "Ask a follow-up question or share more progress..."}
                style={s.textarea}
                rows={5}
              />
              <button onClick={getFeedback} disabled={loadingFeedback || !submission.trim()} style={{
                ...s.submitBtn,
                opacity: loadingFeedback || !submission.trim() ? 0.5 : 1,
              }}>
                {loadingFeedback ? 'Teacher is reviewing...' : `Get feedback (${3 - replyCount} left) →`}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 24, background: '#1a1a1a', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
                🎓 You've used all 3 teacher replies for this week. Time to move on!
              </p>
              <button onClick={markComplete} style={s.completeBtn}>
                ✅ Mark week {week.week} complete → next week
              </button>
            </div>
          )}

          {replyCount > 0 && replyCount < 3 && (
            <button onClick={markComplete} style={{ ...s.completeBtn, marginTop: 12, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
              Skip → Mark complete anyway
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <button onClick={() => {
          setActiveWeek(0);
          setCompletedWeeks(new Set());
          setSubmission('');
          setFeedback('');
          setReplyCount(0);
          setConversation([]);
          setView('roadmap');
          onBack();
        }} style={s.backBtn}>← Start over</button>
        <div style={s.progressWrap}>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>
          <span style={s.progressText}>{completedWeeks.size}/{data.weeks.length} weeks done</span>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.header}>
          <h1 style={s.mainTitle}>{data.title}</h1>
          <p style={s.mainSub}>{data.summary}</p>
          <div style={s.stackRow}>
            {data.techStack.map(t => (
              <span key={t} style={s.stackTag}>{t}</span>
            ))}
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.weekList}>
            <p style={s.sectionLabel}>Your roadmap</p>
            {data.weeks.map((w, i) => (
              <div key={i} onClick={() => setActiveWeek(i)} style={{
                ...s.weekItem,
                ...(i === activeWeek ? s.weekItemActive : {}),
              }}>
                <div style={{
                  ...s.weekDot,
                  ...(completedWeeks.has(i) ? { background: '#4caf50', color: '#fff', border: '1px solid #4caf50' } : {}),
                  ...(i === activeWeek && !completedWeeks.has(i) ? { border: '1px solid #e8356b', color: '#e8356b' } : {}),
                }}>
                  {completedWeeks.has(i) ? '✓' : w.week}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={s.weekItemTitle}>{w.title}</p>
                  <p style={s.weekItemFocus}>{w.focus}</p>
                </div>
              </div>
            ))}
            <div style={s.finalProject}>
              <p style={s.fpLabel}>🏆 Final project</p>
              <p style={s.fpText}>{data.finalProject}</p>
            </div>
          </div>

          <div style={s.weekDetail}>
            <div style={s.weekHeader}>
              <span style={s.weekNum}>Week {week.week}</span>
              <h2 style={s.weekTitle}>{week.title}</h2>
              <p style={s.weekFocus}>{week.focus}</p>
            </div>

            <div style={s.topicsBox}>
              <p style={s.sectionLabel}>What you'll learn</p>
              {week.topics.map((t, i) => (
                <div key={i} style={s.topicRow}>
                  <span style={s.topicDot} />
                  <span style={s.topicText}>{t}</span>
                </div>
              ))}
            </div>

            {week.resources && (
              <div style={{ marginBottom: 20 }}>
                <p style={s.sectionLabel}>📚 Resources</p>
                {week.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" style={s.resourceRow}>
                    <span style={{
                      ...s.resourceIcon,
                      background: r.type === 'video' ? '#ff000022' : r.type === 'article' ? '#0077ff22' : '#00ff7722',
                      color: r.type === 'video' ? '#ff4444' : r.type === 'article' ? '#4499ff' : '#44ff88',
                    }}>
                      {r.type === 'video' ? '▶' : r.type === 'article' ? '📖' : '📄'}
                    </span>
                    <span style={s.resourceTitle}>{r.title}</span>
                    <span style={s.resourceArrow}>→</span>
                  </a>
                ))}
              </div>
            )}

            <div style={s.milestoneBox}>
              <p style={s.sectionLabel}>🎯 By end of this week</p>
              <p style={s.milestoneText}>{week.milestone}</p>
            </div>

            <button onClick={() => setView('assignment')} style={s.assignBtn}>
              {completedWeeks.has(activeWeek) ? '✅ Review assignment' : '📝 Start assignment →'}
            </button>

            <div style={s.hookBox}>
              <p style={s.hookText}>"{data.hookTip}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  topbar: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#080808', zIndex: 10 },
  backBtn: { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  weekBadge: { background: '#e8356b18', border: '1px solid #e8356b44', color: '#e8356b', padding: '4px 12px', borderRadius: 20, fontSize: 12 },
  progressWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 4, background: '#1a1a1a', borderRadius: 2 },
  progressFill: { height: '100%', background: '#e8356b', borderRadius: 2, transition: 'width 0.3s' },
  progressText: { fontSize: 12, color: '#666', whiteSpace: 'nowrap' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 36 },
  mainTitle: { fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 },
  mainSub: { fontSize: 15, color: '#888', lineHeight: 1.6, marginBottom: 16 },
  stackRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  stackTag: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#aaa' },
  grid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10 },
  weekList: { display: 'flex', flexDirection: 'column', gap: 4 },
  weekItem: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: '1px solid transparent' },
  weekItemActive: { background: '#111', border: '1px solid #2a2a2a' },
  weekDot: { width: 26, height: 26, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#888', flexShrink: 0 },
  weekItemTitle: { fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 },
  weekItemFocus: { fontSize: 11, color: '#666', lineHeight: 1.4 },
  finalProject: { marginTop: 16, background: '#0d0d0d', border: '1px solid #e8356b22', borderRadius: 10, padding: '12px 14px' },
  fpLabel: { fontSize: 11, color: '#e8356b', marginBottom: 6 },
  fpText: { fontSize: 12, color: '#888', lineHeight: 1.5 },
  weekDetail: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: 24 },
  weekHeader: { marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #1a1a1a' },
  weekNum: { fontSize: 11, color: '#e8356b', letterSpacing: '0.1em', textTransform: 'uppercase' },
  weekTitle: { fontSize: 24, fontWeight: 800, marginTop: 6, marginBottom: 8 },
  weekFocus: { fontSize: 14, color: '#888', lineHeight: 1.5 },
  topicsBox: { marginBottom: 20 },
  topicRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  topicDot: { width: 6, height: 6, borderRadius: '50%', background: '#e8356b', flexShrink: 0 },
  topicText: { fontSize: 14, color: '#ccc' },
  milestoneBox: { background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px', marginBottom: 20 },
  milestoneText: { fontSize: 14, color: '#bbb', lineHeight: 1.5 },
  assignBtn: { width: '100%', background: '#e8356b', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 20 },
  hookBox: { background: '#0a0a0a', borderLeft: '3px solid #e8356b', borderRadius: '0 8px 8px 0', padding: '12px 16px' },
  hookText: { fontSize: 13, color: '#666', fontStyle: 'italic', lineHeight: 1.5 },
  assignWrap: { maxWidth: 680, margin: '0 auto', padding: '32px 24px' },
  assignTitle: { fontSize: 28, fontWeight: 800, marginBottom: 12 },
  assignDesc: { fontSize: 15, color: '#888', lineHeight: 1.6, marginBottom: 24 },
  infoCard: { background: '#111', border: '1px solid #e8356b22', borderRadius: 10, padding: '14px 16px', marginBottom: 12 },
  infoLabel: { fontSize: 11, color: '#e8356b', marginBottom: 6, fontWeight: 600 },
  infoText: { fontSize: 14, color: '#bbb', lineHeight: 1.5 },
  hintsBox: { background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px' },
  hint: { fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 4 },
  label: { display: 'block', fontSize: 12, color: '#666', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' },
  textarea: { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' },
  submitBtn: { width: '100%', background: '#e8356b', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
  completeBtn: { width: '100%', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
  msgBubble: { display: 'flex', flexDirection: 'column', padding: '12px 14px', borderRadius: 10, marginBottom: 10 },
  resourceRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, marginBottom: 6, textDecoration: 'none', cursor: 'pointer' },
  resourceIcon: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 },
  resourceTitle: { flex: 1, fontSize: 13, color: '#ccc' },
  resourceArrow: { fontSize: 12, color: '#555' },
};