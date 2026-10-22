import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      headline="Pick up where your books left off."
      blurb="Sign in to see this month's spending, your team, and your plan."
    >
      <p className="sub">Sign in to your workspace.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <div className="input-icon">
            <Mail size={17} />
            <input id="email" className="input" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required autoFocus />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="input-icon">
            <Lock size={17} />
            <input id="password" className="input" type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={set('password')} required />
          </div>
        </div>
        {error && <div className="error-text" role="alert">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? <span className="spinner" /> : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        className="demo-hint"
        onClick={() => setForm({ email: 'demo@acme.dev', password: 'Demo@1234' })}
      >
        Seeded the demo data with <b>npm run seed</b>? Click to fill the demo login (demo@acme.dev).
      </button>

      <p className="auth-switch">
        New to Ledgerly? <Link to="/register">Create a workspace</Link>
      </p>
    </AuthShell>
  );
}
