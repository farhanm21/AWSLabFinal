import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EventCard({ event }) {
  const initials = event.creator_name?.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>{event.title}</h3>
          {event.location && <span style={styles.location}>📍 {event.location}</span>}
        </div>
        <div style={styles.dateChip}>{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
      {event.description && <p style={styles.desc}>{event.description}</p>}
      <div style={styles.cardFooter}>
        <span style={styles.avatar}>{initials}</span>
        <span style={styles.creatorText}>{event.creator_name}</span>
        <span style={styles.timeText}>{formatDate(event.event_date)}</span>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.createEvent(form);
      if (res.error) { setError(res.error); return; }
      onCreated(res);
      onClose();
    } catch { setError('Failed to create event'); }
    finally { setLoading(false); }
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>New Event</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={submit} style={styles.form}>
          <Field label="Title" name="title" value={form.title} onChange={handle} required placeholder="Team retrospective" />
          <Field label="Location" name="location" value={form.location} onChange={handle} placeholder="Conference Room A / Zoom" />
          <Field label="Date & Time" name="event_date" type="datetime-local" value={form.event_date} onChange={handle} required />
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea name="description" value={form.description} onChange={handle} style={{ ...styles.input, height: '80px', resize: 'vertical' }} placeholder="Optional details..." />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>{loading ? 'Creating...' : 'Create Event'}</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} {...props} />
    </div>
  );
}

export default function EventsPage() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getEvents();
      if (Array.isArray(res)) setEvents(res);
      else setError(res.error || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>EventFlow</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>👤 {user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Events</h1>
            <p style={styles.pageSub}>{events.length} event{events.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={() => setShowModal(true)} style={styles.btn}>+ New Event</button>
        </div>

        {loading ? (
          <div style={styles.center}><span style={styles.spinner}>⟳</span> Loading events...</div>
        ) : error ? (
          <div style={styles.center}><p style={styles.error}>{error}</p></div>
        ) : events.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📅</div>
            <p style={styles.emptyText}>No events yet</p>
            <p style={styles.emptySub}>Create your first event to get started</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </main>

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={ev => setEvents(prev => [ev, ...prev])}
        />
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0d0d0f', fontFamily: "'DM Sans', sans-serif" },
  header: { background: '#18181b', borderBottom: '1px solid #2a2a2e', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: { fontSize: '1.3rem', color: '#a78bfa' },
  logoText: { fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', color: '#fff' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { color: '#a1a1aa', fontSize: '0.9rem' },
  logoutBtn: { background: 'transparent', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  pageTitle: { fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: '#fff', margin: 0 },
  pageSub: { color: '#71717a', fontSize: '0.9rem', margin: '4px 0 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
  card: { background: '#18181b', border: '1px solid #2a2a2e', borderRadius: '12px', padding: '1.25rem', transition: 'border-color 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  cardTitle: { color: '#fff', margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 },
  location: { color: '#a78bfa', fontSize: '0.8rem' },
  dateChip: { background: '#2d1b69', color: '#c4b5fd', fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' },
  desc: { color: '#a1a1aa', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1rem' },
  cardFooter: { display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '0.75rem', borderTop: '1px solid #2a2a2e' },
  avatar: { background: '#7c3aed', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 },
  creatorText: { color: '#a1a1aa', fontSize: '0.8rem', flex: 1 },
  timeText: { color: '#52525b', fontSize: '0.75rem' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', minHeight: '200px', gap: '8px' },
  spinner: { animation: 'spin 1s linear infinite', fontSize: '1.2rem' },
  empty: { textAlign: 'center', padding: '4rem 1rem' },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  emptyText: { color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 600 },
  emptySub: { color: '#71717a', fontSize: '0.9rem', marginTop: '4px' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  modal: { background: '#18181b', border: '1px solid #2a2a2e', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: '#fff', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { background: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%', boxSizing: 'border-box', colorScheme: 'dark' },
  btn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#f87171', fontSize: '0.85rem', margin: 0, background: '#450a0a', borderRadius: '6px', padding: '0.5rem 0.75rem' },
};
