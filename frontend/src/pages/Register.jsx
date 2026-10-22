import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, User } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ organizationName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      headline="A private ledger for your team."
      blurb="Free for one person, up to 50 expenses. Upgrade to Pro when your team grows."
    >
      <p className="sub">Takes under a minute. No card needed.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
        <div className="field">
          <label className="label" htmlFor="org">Workspace name</label>
          <div className="input-icon">
            <Building2 size={17} />
            <input id="org" className="input" placeholder="Acme Studio" value={form.organizationName} onChange={set('organizationName')} required autoFocus />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="name">Your name</label>
          <div className="input-icon">
            <User size={17} />
            <input id="name" className="input" autoComplete="name" placeholder="Ava Carter" value={form.name} onChange={set('name')} required />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="email">Work email</label>
          <div className="input-icon">
            <Mail size={17} />
            <input id="email" className="input" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="input-icon">
            <Lock size={17} />
            <input id="password" className="input" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
          </div>
        </div>
        {error && <div className="error-text" role="alert">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? <span className="spinner" /> : 'Create workspace'}
        </button>
      </form>
      <p className="auth-switch">
        Already have a workspace? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
