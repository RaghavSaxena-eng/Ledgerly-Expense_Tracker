import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Receipt, Users, CreditCard, LogOut, Menu, Sparkles } from 'lucide-react';
import Logo from './Logo.jsx';
import Background from './Background.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/format.js';
import { pageVariants } from '../lib/motion.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/billing', label: 'Billing', icon: CreditCard },
];

export default function AppLayout() {
  const { user, org, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="shell">
      <Background />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Logo to="/dashboard" />
        <nav className="nav-list">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <Icon size={19} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          {org?.plan === 'free' && (
            <div className="plan-card">
              <small>{org.name}</small>
              <strong>Free plan</strong>
              <Link to="/billing" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                <Sparkles size={15} className="ico-spark" /> Upgrade to Pro
              </Link>
            </div>
          )}
          <div className="user-chip">
            <span className="avatar sm">{initials(user?.name)}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{org?.name} · {org?.plan === 'pro' ? 'Pro' : 'Free'}</small>
            </div>
            <button className="btn-icon" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="above" style={{ minWidth: 0 }}>
        <div className="mobile-bar">
          <Logo to="/dashboard" />
          <button className="btn-icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
        <main className="main">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
