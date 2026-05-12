import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      if (res.error) { setError(res.error); return; }
      login(res.user, res.token);
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>EventFlow</span>
        </div>
        <h2 style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p style={styles.sub}>{mode === 'login' ? 'Sign in to manage your events' : 'Get started for free'}</p>

        <form onSubmit={submit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input name="name" value={form.name} onChange={handle} required style={styles.input} placeholder="Ada Lovelace" />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} required style={styles.input} placeholder="you@example.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} required style={styles.input} placeholder="••••••••" />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span style={styles.link} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0f', padding: '1rem' },
  card: { background: '#18181b', border: '1px solid #2a2a2e', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '400px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' },
  logoIcon: { fontSize: '1.5rem', color: '#a78bfa' },
  logoText: { fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: '#fff' },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', color: '#fff', margin: '0 0 4px' },
  sub: { color: '#71717a', fontSize: '0.9rem', margin: '0 0 2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: { background: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  btn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' },
  error: { color: '#f87171', fontSize: '0.85rem', margin: 0, background: '#450a0a', borderRadius: '6px', padding: '0.5rem 0.75rem' },
  toggle: { textAlign: 'center', color: '#71717a', fontSize: '0.85rem', marginTop: '1.5rem', marginBottom: 0 },
  link: { color: '#a78bfa', cursor: 'pointer', fontWeight: 600 },
};
