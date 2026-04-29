'use client';
import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import Roadmap from './components/Roadmap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('complete beginner');
  const [stack, setStack] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadHistory(session.user.id);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadHistory(session.user.id);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
    if (error) console.error('History error:', error);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    setRoadmapData(null);
  };

  const generate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, level, stack }),
    });
    const data = await res.json();

    if (user) {
      await supabase.from('roadmaps').insert({
        user_id: user.id,
        goal,
        level,
        data,
      });
      loadHistory(user.id);
    }

    setRoadmapData(data);
    setLoading(false);
  };

  if (authLoading) {
    return <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'system-ui' }}>Loading...</div>;
  }

  if (roadmapData) {
    return <Roadmap data={roadmapData} goal={goal} user={user} onBack={() => {
      setRoadmapData(null);
      setGoal('');
      setLevel('complete beginner');
      setStack('');
      if (user) loadHistory(user.id);
    }} />;
  }

  return (
    <main style={s.wrap}>
      <div style={s.authBar}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} style={s.avatar} />
            )}
            <span style={s.userName}>{user.user_metadata?.full_name || user.email}</span>
            <button onClick={() => setShowHistory(!showHistory)} style={s.historyBtn}>
              📚 My roadmaps ({history.length})
            </button>
            <button onClick={signOut} style={s.signOutBtn}>Sign out</button>
          </div>
        ) : (
          <button onClick={signInWithGoogle} style={s.googleBtn}>
            Sign in with Google
          </button>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div style={s.historyPanel}>
          <p style={s.historyTitle}>Your past roadmaps</p>
          {history.map((h, i) => (
            <div key={i} onClick={() => {
              setRoadmapData(h.data);
              setGoal(h.goal);
              setShowHistory(false);
            }} style={s.historyItem}>
              <p style={s.historyGoal}>{h.goal}</p>
              <p style={s.historyMeta}>{h.level} · {new Date(h.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {showHistory && history.length === 0 && (
        <div style={s.historyPanel}>
          <p style={s.historyTitle}>No roadmaps yet</p>
          <p style={{ fontSize: 13, color: '#666' }}>Generate your first roadmap below!</p>
        </div>
      )}

      <div style={s.hero}>
        <div style={s.badge}>🎓 CodePath AI</div>
        <h1 style={s.title}>Your personal<br />coding <span style={s.accent}>teacher.</span></h1>
        <p style={s.sub}>Tell us what you want to build. AI creates your personal 8-week roadmap, gives you assignments, reviews your work, and won't let you move on until you actually get it.</p>

        <div style={s.card}>
          <label style={s.label}>I want to build...</label>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. a food delivery app, my own Instagram, a portfolio website..."
            style={s.textarea}
            rows={3}
          />

          <label style={s.label}>My current level</label>
          <div style={s.levels}>
            {['complete beginner', 'some experience', 'intermediate'].map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                ...s.levelBtn,
                ...(level === l ? s.levelBtnActive : {}),
              }}>{l}</button>
            ))}
          </div>

          <label style={s.label}>Preferred tech stack (optional)</label>
          <input
            value={stack}
            onChange={e => setStack(e.target.value)}
            placeholder="e.g. Python, React, Flutter, Node.js..."
            style={s.input}
          />

          <button onClick={generate} disabled={loading || !goal.trim()} style={{
            ...s.btn,
            opacity: loading || !goal.trim() ? 0.5 : 1,
          }}>
            {loading ? 'Building your roadmap...' : 'Build my roadmap →'}
          </button>
        </div>

        <div style={s.examples}>
          <p style={s.exLabel}>Try one of these:</p>
          <div style={s.exRow}>
            {['A food delivery app', 'My own social media', 'A multiplayer game', 'An AI chatbot'].map(ex => (
              <button key={ex} onClick={() => setGoal(ex)} style={s.exBtn}>{ex}</button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' },
  authBar: { position: 'absolute', top: 20, right: 24, zIndex: 100 },
  avatar: { width: 32, height: 32, borderRadius: '50%' },
  userName: { fontSize: 13, color: '#aaa' },
  historyBtn: { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  signOutBtn: { background: 'none', border: '1px solid #333', color: '#666', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  googleBtn: { background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  historyPanel: { position: 'absolute', top: 64, right: 24, background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16, width: 300, zIndex: 100, maxHeight: 400, overflowY: 'auto' },
  historyTitle: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 },
  historyItem: { padding: '10px 12px', background: '#1a1a1a', borderRadius: 8, marginBottom: 6, cursor: 'pointer', border: '1px solid transparent' },
  historyGoal: { fontSize: 13, color: '#fff', marginBottom: 2 },
  historyMeta: { fontSize: 11, color: '#666' },
  hero: { maxWidth: 600, width: '100%', textAlign: 'center' },
  badge: { display: 'inline-block', background: '#1a1a1a', border: '1px solid #333', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#888', marginBottom: 24, letterSpacing: '0.05em' },
  title: { fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' },
  accent: { color: '#e8356b' },
  sub: { fontSize: 16, color: '#666', lineHeight: 1.6, marginBottom: 40 },
  card: { background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, textAlign: 'left' },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 16 },
  textarea: { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 15, resize: 'none', marginBottom: 8, fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' },
  input: { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20 },
  levels: { display: 'flex', gap: 8, marginBottom: 8 },
  levelBtn: { flex: 1, padding: '8px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#888', fontSize: 13, cursor: 'pointer' },
  levelBtnActive: { background: '#e8356b18', border: '1px solid #e8356b88', color: '#e8356b' },
  btn: { width: '100%', background: '#e8356b', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  examples: { marginTop: 32 },
  exLabel: { fontSize: 12, color: '#555', marginBottom: 12 },
  exRow: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  exBtn: { background: '#111', border: '1px solid #222', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#888', cursor: 'pointer' },
};