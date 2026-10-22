import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Sparkles, Trash2, UserPlus } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { initials, shortDate } from '../lib/format.js';
import { ease } from '../lib/motion.js';

export default function Team() {
  const { user, org } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);

  const isOwner = user?.role === 'owner';
  const max = org?.limits?.maxMembers ?? 1;
  const solo = max === 1;
  const full = members && members.length >= max;

  const load = useCallback(() => {
    api.get('/team').then(setMembers).catch((e) => toast.error(e.message));
  }, [toast]);

  useEffect(load, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/team', form);
      toast.success(`${form.name} joined your workspace`);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/team/${removing.id}`);
      toast.success(`${removing.name} was removed`);
      setRemoving(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <p>People who can see and add expenses in {org?.name}.</p>
        </div>
        {members && (
          <span className="badge">{members.length} of {max} {max === 1 ? 'seat' : 'seats'} used</span>
        )}
      </div>

      <div className="team-grid">
        <div className="card">
          <div className="card-title"><h3>Members</h3></div>
          {!members ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {members.map((m, i) => (
                <motion.div
                  className="member-row"
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.45, ease } }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                >
                  <span className="avatar">{initials(m.name)}</span>
                  <div className="m-main">
                    <strong>{m.name}{m.id === user.id ? ' (you)' : ''}</strong>
                    <small>{m.email} · joined {shortDate(m.joinedAt)}</small>
                  </div>
                  <span className={`badge ${m.role === 'owner' ? 'badge-pro' : ''}`}>{m.role === 'owner' ? 'Owner' : 'Member'}</span>
                  {isOwner && m.id !== user.id && (
                    <button className="btn-icon danger" onClick={() => setRemoving(m)} aria-label={`Remove ${m.name}`}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="card">
          {!isOwner ? (
            <>
              <div className="card-title"><h3>Invite teammates</h3></div>
              <p style={{ color: 'var(--muted)' }}>Only the workspace owner can add or remove people.</p>
            </>
          ) : solo ? (
            <>
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="e-ico"><Lock size={24} /></div>
                <h3>Teams are part of Pro</h3>
                <p style={{ marginBottom: 20 }}>The Free plan is for one person. Pro adds up to 10 seats.</p>
                <Link to="/billing" className="btn btn-primary"><Sparkles size={16} className="ico-spark" /> See Pro</Link>
              </div>
            </>
          ) : (
            <>
              <div className="card-title"><h3>Add a teammate</h3></div>
              <form onSubmit={add} style={{ display: 'grid', gap: 16 }}>
                <div className="field">
                  <label className="label" htmlFor="m-name">Name</label>
                  <input id="m-name" className="input" placeholder="Noah Kim" value={form.name} onChange={set('name')} required disabled={full} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="m-email">Email</label>
                  <input id="m-email" className="input" type="email" placeholder="noah@company.com" value={form.email} onChange={set('email')} required disabled={full} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="m-pass">Temporary password</label>
                  <input id="m-pass" className="input" type="password" minLength={8} placeholder="At least 8 characters" value={form.password} onChange={set('password')} required disabled={full} />
                </div>
                {full && <div className="error-text">All {max} seats are in use. Remove someone to add a new teammate.</div>}
                {error && <div className="error-text" role="alert">{error}</div>}
                <button className="btn btn-primary" disabled={busy || full}>
                  {busy ? <span className="spinner" /> : <><UserPlus size={17} /> Add teammate</>}
                </button>
                <p className="hint" style={{ marginTop: 0 }}>Share the temporary password with them directly. They sign in with their email.</p>
              </form>
            </>
          )}
        </div>
      </div>

      <Modal open={Boolean(removing)} onClose={() => setRemoving(null)} title="Remove this teammate?">
        <p style={{ color: 'var(--muted)' }}>
          <b style={{ color: 'var(--text)' }}>{removing?.name}</b> will lose access to {org?.name} immediately. Expenses they added stay in your workspace.
        </p>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setRemoving(null)}>Keep teammate</button>
          <button className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <span className="spinner" /> : 'Remove teammate'}
          </button>
        </div>
      </Modal>
    </>
  );
}
