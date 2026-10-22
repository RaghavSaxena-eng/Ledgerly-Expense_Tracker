import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, CalendarDays, Hash, Plus, Receipt, Scale, Wallet } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import ExpenseModal from '../components/ExpenseModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { CATEGORY_COLORS, money, shortDate } from '../lib/format.js';
import { pop, stagger } from '../lib/motion.js';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div style={{ color: 'var(--faint)' }}>{label}</div>
      <strong>{money(payload[0].value)}</strong>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    api.get('/stats').then(setData).catch((e) => toast.error(e.message));
  }, [toast]);

  useEffect(load, [load]);

  const first = user?.name?.split(' ')[0];
  const avg = data && data.monthCount ? data.thisMonth / data.monthCount : 0;
  const up = data?.change > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{greeting()}, {first}</h1>
          <p>Here is where your team's money went this month.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Plus size={18} className="ico-plus" /> Add expense
        </button>
      </div>

      {!data ? (
        <>
          <div className="stat-grid">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 138 }} />)}
          </div>
          <div className="two-col">
            <div className="skeleton" style={{ height: 340 }} />
            <div className="skeleton" style={{ height: 340 }} />
          </div>
        </>
      ) : data.totalCount === 0 ? (
        <motion.div className="card empty" variants={pop} initial="hidden" animate="show">
          <div className="e-ico"><Receipt size={28} /></div>
          <h3>No expenses yet</h3>
          <p style={{ marginBottom: 22 }}>Add your first expense and your charts will fill in right away.</p>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={18} className="ico-plus" /> Add your first expense
          </button>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show">
          <div className="stat-grid">
            <motion.div variants={pop} className="card stat card-hover">
              <div className="s-top">
                This month
                <span className="s-icon"><Wallet size={18} /></span>
              </div>
              <div className="s-val tabular"><AnimatedNumber value={data.thisMonth} format={money} /></div>
              <div className="s-sub">Total spent so far</div>
            </motion.div>

            <motion.div variants={pop} className="card stat card-hover">
              <div className="s-top">
                Last month
                <span className="s-icon"><CalendarDays size={18} /></span>
              </div>
              <div className="s-val tabular"><AnimatedNumber value={data.lastMonth} format={money} /></div>
              <div className={`s-sub ${data.change == null ? '' : up ? 'delta-up' : 'delta-down'}`}>
                {data.change == null ? (
                  'No spending to compare'
                ) : (
                  <>
                    {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    {Math.abs(data.change).toFixed(0)}% {up ? 'more' : 'less'} this month
                  </>
                )}
              </div>
            </motion.div>

            <motion.div variants={pop} className="card stat card-hover">
              <div className="s-top">
                Expenses this month
                <span className="s-icon"><Hash size={18} /></span>
              </div>
              <div className="s-val tabular"><AnimatedNumber value={data.monthCount} /></div>
              <div className="s-sub">{data.totalCount} recorded in total</div>
            </motion.div>

            <motion.div variants={pop} className="card stat card-hover">
              <div className="s-top">
                Average expense
                <span className="s-icon"><Scale size={18} /></span>
              </div>
              <div className="s-val tabular"><AnimatedNumber value={avg} format={money} /></div>
              <div className="s-sub">Per entry this month</div>
            </motion.div>
          </div>

          <div className="two-col">
            <motion.div variants={pop} className="card">
              <div className="card-title">
                <h3>Spending, last 6 months</h3>
                <small>Monthly totals</small>
              </div>
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={data.trend} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2b59ff" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#2b59ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2b59ff" />
                      <stop offset="100%" stopColor="#2b59ff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(15,17,21,.07)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8a909d', fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={54}
                    tick={{ fill: '#8a909d', fontSize: 12 }}
                    tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                  />
                  <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(15,17,21,.25)', strokeDasharray: 4 }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="url(#line)"
                    strokeWidth={3}
                    fill="url(#fill)"
                    animationDuration={1400}
                    activeDot={{ r: 6, fill: '#fff', stroke: '#2b59ff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div variants={pop} className="card">
              <div className="card-title">
                <h3>By category</h3>
                <small>This month</small>
              </div>
              {data.categories.length === 0 ? (
                <p style={{ color: 'var(--muted)', padding: '40px 0', textAlign: 'center' }}>Nothing spent yet this month.</p>
              ) : (
                <>
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categories}
                          dataKey="total"
                          nameKey="category"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={3}
                          cornerRadius={6}
                          stroke="none"
                          animationDuration={1200}
                        >
                          {data.categories.map((c) => <Cell key={c.category} fill={CATEGORY_COLORS[c.category]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <div>
                        <small>Total</small>
                        <strong className="tabular"><AnimatedNumber value={data.thisMonth} format={(v) => `$${Math.round(v).toLocaleString()}`} /></strong>
                      </div>
                    </div>
                  </div>
                  <div className="legend">
                    {data.categories.slice(0, 5).map((c) => (
                      <div className="legend-row" key={c.category}>
                        <span className="dot" style={{ background: CATEGORY_COLORS[c.category] }} />
                        {c.category}
                        <span className="tabular">{money(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          <motion.div variants={pop} className="card">
            <div className="card-title">
              <h3>Recent expenses</h3>
              <Link to="/expenses" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {data.recent.map((r) => (
              <div className="list-row" key={r._id}>
                <span
                  className="cat-icon"
                  style={{ background: `color-mix(in srgb, ${CATEGORY_COLORS[r.category]} 20%, transparent)`, color: CATEGORY_COLORS[r.category] }}
                >
                  {r.category[0]}
                </span>
                <div className="lr-main">
                  <strong>{r.title}</strong>
                  <small>{r.category} · {shortDate(r.date)}</small>
                </div>
                <span className="lr-amt tabular">{money(r.amount)}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}

      <ExpenseModal
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={load}
        onLimit={() => toast.info('The Free plan holds 50 expenses. Upgrade to Pro for unlimited.')}
      />
    </>
  );
}
