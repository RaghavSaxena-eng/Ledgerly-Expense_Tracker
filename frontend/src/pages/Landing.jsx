import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BarChart3, Check, CheckCircle2, CreditCard, FileDown, ShieldCheck, Users, Zap } from 'lucide-react';
import Background from '../components/Background.jsx';
import Logo from '../components/Logo.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { money } from '../lib/format.js';
import { ease, fadeUp, stagger, pop } from '../lib/motion.js';

const smooth = (pts) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');

const POINTS = [70, 96, 84, 118, 104, 132, 120, 148, 132, 156].map((v, i) => [i * (800 / 9), 170 - v]);
const LINE = smooth(POINTS);
const AREA = `${LINE} L800,170 L0,170 Z`;

function HeroMock() {
  const { scrollY } = useScroll();
  const rotateX = useTransform(scrollY, [0, 520], [11, 0]);
  const scale = useTransform(scrollY, [0, 520], [0.95, 1]);

  return (
    <div className="mock-wrap">
      <motion.div className="float-chip" style={{ top: -22, right: -26 }} animate={{ y: [0, -9, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        <span className="chip-icon good"><CheckCircle2 size={18} /></span>
        <div>Payment succeeded<small>Globex Labs · Pro $12.00</small></div>
      </motion.div>
      <motion.div className="float-chip" style={{ bottom: 46, left: -34 }} animate={{ y: [0, 9, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <span className="chip-icon"><ShieldCheck size={18} /></span>
        <div>Workspace isolated<small>Acme can't see Globex</small></div>
      </motion.div>

      <motion.div className="mock" style={{ rotateX, scale }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.35 }}>
        <div className="mock-bar">
          <i /><i /><i />
          <span className="mock-url">app.ledgerly.com/dashboard</span>
        </div>
        <div className="mock-body">
          <div className="mock-stats">
            <div className="mock-stat"><small>This month</small><strong className="tabular"><AnimatedNumber value={4286.4} format={money} duration={1.6} /></strong></div>
            <div className="mock-stat"><small>Last month</small><strong className="tabular"><AnimatedNumber value={3912.1} format={money} duration={1.6} /></strong></div>
            <div className="mock-stat"><small>Expenses</small><strong className="tabular"><AnimatedNumber value={38} duration={1.6} /></strong></div>
          </div>
          <div className="mock-chart">
            <svg viewBox="0 0 800 170" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="mfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b59ff" stopOpacity=".2" />
                  <stop offset="100%" stopColor="#2b59ff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mline" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2b59ff" />
                  <stop offset="100%" stopColor="#2b59ff" />
                </linearGradient>
              </defs>
              {[40, 85, 130].map((y) => <line key={y} x1="0" x2="800" y1={y} y2={y} stroke="rgba(15,17,21,.07)" />)}
              <motion.path d={AREA} fill="url(#mfill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} />
              <motion.path d={LINE} fill="none" stroke="url(#mline)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 1.8, ease }} />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Private workspaces', text: 'Each team gets its own space inside one database. Every query is scoped on the server, so data never crosses over.' },
  { icon: CreditCard, title: 'Simple Pro billing', text: 'Upgrade with Stripe Checkout. Successful and failed payments update your workspace automatically.' },
  { icon: BarChart3, title: 'Live spending insights', text: 'See this month against last, spending by category, and a six-month trend as soon as you add an expense.' },
  { icon: Users, title: 'Built for small teams', text: 'Add up to 10 teammates. Owners manage people and billing, members add expenses.' },
  { icon: Zap, title: 'Fast to fill in', text: 'Title, amount, category, date. Add an expense in a few seconds and search or filter any time.' },
  { icon: FileDown, title: 'CSV export', text: 'Send your accountant a clean spreadsheet of any filtered view with one click on Pro.' },
];

const TENANTS = [
  { name: 'Acme Studio', color: '#2b59ff' },
  { name: 'Globex Labs', color: '#12a66a' },
  { name: 'Initech', color: '#f2733d' },
];
const SLOTS = 9;
const STRIPES = 27;

// Each workspace's expenses move along their own lane while sharing one database underneath.
function TenantFlow() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 650);
    return () => clearInterval(id);
  }, []);

  const trail = (head, i, n) => {
    const age = (((head - i) % n) + n) % n;
    return Math.max(0.14, 1 - age * 0.13);
  };

  return (
    <div className="tenants" aria-label="Three workspaces writing to one shared database">
      {TENANTS.map((t, row) => (
        <div className="tenant-row" key={t.name}>
          <div className="tenant-name">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
            {t.name}
          </div>
          <div className="tenant-lane">
            {Array.from({ length: SLOTS }, (_, s) => (
              <motion.span key={s} style={{ background: t.color }} animate={{ opacity: trail(tick + row * 3, s, SLOTS) }} transition={{ duration: 0.45 }} />
            ))}
          </div>
        </div>
      ))}
      <div className="db-box">
        <small>One shared database, every document tagged with its workspace</small>
        <div className="db-stripes">
          {Array.from({ length: STRIPES }, (_, j) => (
            <motion.span key={j} style={{ background: TENANTS[j % 3].color }} animate={{ opacity: trail(tick * 2, j, STRIPES) * 0.9 }} transition={{ duration: 0.4 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const PLANS = [
  { name: 'Free', price: '$0', note: 'For one person getting organised', perks: ['Up to 50 expenses', '1 user', 'Dashboard and charts', 'Search and filters'], cta: 'Start free' },
  { name: 'Pro', price: '$12', note: 'For teams that spend together', perks: ['Unlimited expenses', 'Up to 10 teammates', 'CSV export', 'Stripe billing, cancel anytime'], cta: 'Start with Pro', featured: true },
];

export default function Landing() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <div>
      <Background />
      <div className="above">
        <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="container nav-inner">
            <Logo />
            <nav className="nav-links" aria-label="Primary">
              <a href="#features">Features</a>
              <a href="#security">Isolation</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <div className="nav-cta">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-sm">Open dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="container">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.span variants={fadeUp} className="eyebrow"><b>Pro</b> Unlimited expenses for $12 a month</motion.span>
              <h1 aria-label="Know where every dollar goes">
                {['Know', 'where', 'every', 'dollar', 'goes'].map((w, i) => (
                  <span className="mask" key={w} aria-hidden="true">
                    <motion.span style={{ display: 'inline-block' }} initial={{ y: '115%' }} animate={{ y: 0 }} transition={{ duration: 0.95, ease, delay: 0.15 + i * 0.09 }}>
                      {w}
                    </motion.span>
                  </span>
                ))}
              </h1>
              <motion.p variants={fadeUp} className="lead">
                Ledgerly gives every team a private workspace for expenses, with live spending insights and billing that just works.
              </motion.p>
              <motion.div variants={fadeUp} className="hero-cta">
                <Link to="/register" className="btn btn-primary btn-lg">Create a free workspace <ArrowRight size={18} className="arrow" /></Link>
                <a href="#security" className="btn btn-ghost btn-lg">How isolation works</a>
              </motion.div>
              <motion.p variants={fadeUp} className="hero-note">Free for one person. No card needed.</motion.p>
            </motion.div>
            <HeroMock />
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <div className="section-head">
              <h2>Everything a small team needs, nothing it doesn't</h2>
              <p>Record spending, see the trend, share the books with the people who need them.</p>
            </div>
            <motion.div className="features" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <motion.div key={title} variants={pop} className="card card-hover feature" whileHover={{ y: -5 }}>
                  <div className="ficon"><Icon size={21} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="section" id="security" style={{ paddingTop: 20 }}>
          <div className="container iso">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease }}>
              <h2>One database. Separate books.</h2>
              <p>Your workspace shares infrastructure, never data. The server decides which workspace a request belongs to from your signed-in account, not from anything the browser sends.</p>
              <ul>
                <li><Check size={19} />Every expense and member carries a workspace ID</li>
                <li><Check size={19} />Reads, edits, deletes and reports are filtered by it automatically</li>
                <li><Check size={19} />Guessing another workspace's record ID returns "not found"</li>
              </ul>
              <pre className="code" style={{ marginTop: 26 }}>
                <span className="c">{'// every query goes through the tenant scope'}</span>{'\n'}
                <span className="k">const</span> scope = <span className="f">tenantScope</span>(Expense, req.orgId);{'\n'}
                <span className="k">await</span> scope.<span className="f">find</span>({'{ '}category: <span className="s">'Travel'</span>{' }'});
              </pre>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease }}>
              <TenantFlow />
            </motion.div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="container">
            <div className="section-head">
              <h2>Pricing you can read in one breath</h2>
              <p>Start free. Upgrade when your team needs more room. Cancel from your billing page.</p>
            </div>
            <motion.div className="pricing" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
              {PLANS.map((p) => (
                <motion.div key={p.name} variants={pop} className={`card plan ${p.featured ? 'featured' : ''}`} whileHover={{ y: -6 }}>
                  {p.featured && <span className="tag">Most popular</span>}
                  <h3>{p.name}</h3>
                  <div className="price tabular">{p.price}<span> / month</span></div>
                  <p style={{ color: 'var(--muted)' }}>{p.note}</p>
                  <ul>
                    {p.perks.map((perk) => <li key={perk}><Check size={18} />{perk}</li>)}
                  </ul>
                  <Link to="/register" className={`btn btn-lg ${p.featured ? 'btn-primary' : 'btn-ghost'}`}>{p.cta}</Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 20 }}>
          <div className="container">
            <motion.div className="cta-band" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
              <h2>Give your team a ledger of its own</h2>
              <p>Set up a workspace in under a minute.</p>
              <Link to="/register" className="btn btn-primary btn-lg">Create a free workspace <ArrowRight size={18} className="arrow" /></Link>
            </motion.div>
          </div>
        </section>

        <footer className="footer">
          <div className="container footer-inner">
            <Logo />
            <span>Built with React, Node.js, Express, MongoDB and Stripe.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
