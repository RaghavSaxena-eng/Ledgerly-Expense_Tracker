import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, CheckCircle2, CreditCard, FlaskConical, Minus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { shortDate } from '../lib/format.js';
import { ease, pop, stagger } from '../lib/motion.js';

function Meter({ label, value, max }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 100;
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span className="tabular">{value}{max ? ` of ${max}` : ' · unlimited'}</span>
      </div>
      <div className="meter-track">
        <motion.div
          className={`meter-fill ${max && pct >= 85 ? 'hot' : ''}`}
          style={{ opacity: max ? 1 : 0.35 }}
          initial={{ width: 0 }}
          animate={{ width: `${max ? Math.max(pct, 2) : 100}%` }}
          transition={{ duration: 1, ease, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

const PRO_PERKS = ['Unlimited expenses', 'Up to 10 teammates', 'CSV export for your accountant'];

export default function Billing() {
  const { user, setOrg, refresh } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');
  const handledReturn = useRef(false);

  const isOwner = user?.role === 'owner';

  const load = useCallback(async () => {
    const s = await api.get('/billing/status');
    setStatus(s);
    setOrg(s.organization);
    return s;
  }, [setOrg]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load, toast]);

  // Returning from Stripe Checkout: the webhook may land a moment after the redirect, so poll briefly.
  useEffect(() => {
    const result = params.get('status');
    if (!result || handledReturn.current) return;
    handledReturn.current = true;
    setParams({}, { replace: true });

    if (result === 'cancelled') {
      toast.info('Checkout cancelled. You have not been charged.');
      return;
    }
    toast.success('Payment received. Activating Pro…');
    let tries = 0;
    const poll = async () => {
      tries += 1;
      const s = await load().catch(() => null);
      if (s?.organization.plan === 'pro') {
        refresh();
        toast.success('Pro is active. Enjoy unlimited expenses.');
      } else if (tries < 6) {
        setTimeout(poll, 1500);
      }
    };
    poll();
  }, [params, setParams, load, refresh, toast]);

  const simulate = async (event) => {
    setBusy(event);
    try {
      const { organization } = await api.post('/billing/dev/simulate', { event });
      setOrg(organization);
      await load();
      toast.info(
        {
          upgrade: 'Checkout completed. You are on Pro.',
          payment_succeeded: 'Payment succeeded. Workspace is active.',
          payment_failed: 'Payment failed. Workspace is past due.',
          cancel: 'Subscription canceled. Back on Free.',
        }[event]
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  const upgrade = async () => {
    if (status.demoMode) return simulate('upgrade');
    setBusy('upgrade');
    try {
      const { url } = await api.post('/billing/checkout');
      window.location.href = url;
    } catch (e) {
      toast.error(e.message);
      setBusy('');
    }
  };

  const manage = async () => {
    setBusy('portal');
    try {
      const { url } = await api.post('/billing/portal');
      window.location.href = url;
    } catch (e) {
      toast.error(e.message);
      setBusy('');
    }
  };

  if (!status) {
    return (
      <>
        <div className="page-header"><div><h1>Billing</h1></div></div>
        <div className="billing-grid">
          <div className="skeleton" style={{ height: 380 }} />
          <div className="skeleton" style={{ height: 380 }} />
        </div>
      </>
    );
  }

  const { organization: org, usage } = status;
  const pro = org.plan === 'pro';
  const canManage = status.stripeConfigured && pro;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>Your plan, usage and payment status for {org.name}.</p>
        </div>
      </div>

      {org.paymentFailed && (
        <motion.div className="banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} role="alert">
          <AlertTriangle size={22} />
          <div>
            <b>Your last payment failed.</b> Pro stays on while we retry your card. Update your payment method to avoid losing access.
          </div>
          {canManage && isOwner && (
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={manage} disabled={busy === 'portal'}>
              Update card
            </button>
          )}
        </motion.div>
      )}

      <motion.div className="billing-grid" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={pop} className="card">
          <div className="plan-hero">
            <div>
              <small style={{ color: 'var(--faint)' }}>Current plan</small>
              <h2>
                {pro ? 'Pro' : 'Free'}
                <span className={`badge ${org.paymentFailed ? 'badge-warn' : pro ? 'badge-good' : ''}`}>
                  <span className="dot" style={{ background: org.paymentFailed ? '#d99100' : pro ? '#12a66a' : '#8a909d' }} />
                  {org.paymentFailed ? 'Past due' : pro ? 'Active' : 'No subscription'}
                </span>
              </h2>
              <p style={{ color: 'var(--muted)', marginTop: 8 }}>
                {pro
                  ? org.currentPeriodEnd
                    ? `$12 per month. Next renewal ${shortDate(org.currentPeriodEnd)}.`
                    : '$12 per month.'
                  : org.subscriptionStatus === 'canceled'
                    ? 'Your Pro subscription ended. Your data is safe.'
                    : 'Free for one person. Upgrade whenever you need more room.'}
              </p>
            </div>
            {pro && canManage && isOwner && (
              <button className="btn btn-ghost" onClick={manage} disabled={busy === 'portal'}>
                {busy === 'portal' ? <span className="spinner" /> : <><CreditCard size={17} /> Manage billing</>}
              </button>
            )}
          </div>

          <Meter label="Expenses" value={usage.expenses} max={org.limits.maxExpenses} />
          <Meter label="Team seats" value={usage.members} max={org.limits.maxMembers} />

          {!isOwner && <p className="hint">Only the workspace owner can change the plan.</p>}
        </motion.div>

        <motion.div variants={pop} className="card">
          {pro ? (
            <>
              <h3 style={{ fontSize: '1.25rem' }}>What's included in Pro</h3>
              <ul className="perk-list">
                {PRO_PERKS.map((p) => <li key={p}><CheckCircle2 size={19} />{p}</li>)}
              </ul>
              {status.stripeConfigured ? (
                <p className="hint" style={{ marginTop: 0 }}>Change your card, download invoices or cancel from Manage billing.</p>
              ) : (
                <div className="banner ok" style={{ marginBottom: 0 }}>
                  <CheckCircle2 size={20} />
                  <div>Demo mode: billing is simulated. Add Stripe keys to the API to take real payments.</div>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1.25rem' }}>Upgrade to Pro</h3>
              <div className="plan" style={{ padding: 0 }}>
                <div className="price tabular" style={{ marginBottom: 0 }}>$12<span> / month</span></div>
              </div>
              <ul className="perk-list">
                {PRO_PERKS.map((p) => <li key={p}><Check size={19} />{p}</li>)}
                <li className="off"><Minus size={19} />Cancel anytime</li>
              </ul>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={upgrade} disabled={!isOwner || busy === 'upgrade'}>
                {busy === 'upgrade' ? <span className="spinner" /> : <><Sparkles size={18} className="ico-spark" /> {status.demoMode ? 'Upgrade to Pro (demo)' : 'Upgrade to Pro'}</>}
              </button>
              <p className="hint" style={{ textAlign: 'center' }}>
                {status.demoMode ? 'No card needed in demo mode.' : 'Secure checkout by Stripe.'}
              </p>
            </>
          )}
        </motion.div>
      </motion.div>

      {status.demoMode && isOwner && (
        <motion.div className="sim" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.6 } }}>
          <h4><FlaskConical size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Billing event simulator</h4>
          <p>
            Stripe isn't connected, so you can fire the same events the webhook handles and watch the workspace react.
          </p>
          <div className="sim-btns">
            <button className="btn btn-ghost btn-sm" disabled={!!busy || pro} onClick={() => simulate('upgrade')}>Checkout completed</button>
            <button className="btn btn-ghost btn-sm" disabled={!!busy || !pro} onClick={() => simulate('payment_succeeded')}>Payment succeeded</button>
            <button className="btn btn-ghost btn-sm" disabled={!!busy || !pro} onClick={() => simulate('payment_failed')}>Payment failed</button>
            <button className="btn btn-ghost btn-sm" disabled={!!busy || !pro} onClick={() => simulate('cancel')}>Subscription canceled</button>
          </div>
        </motion.div>
      )}
    </>
  );
}
