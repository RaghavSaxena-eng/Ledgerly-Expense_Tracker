import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Lock, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { CATEGORIES, CATEGORY_COLORS, money, shortDate } from '../lib/format.js';
import { ease } from '../lib/motion.js';

export default function Expenses() {
  const { org } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const isPro = org?.plan === 'pro';

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    api
      .get('/expenses', { search: query, category, page, limit: 10 })
      .then(setData)
      .catch((e) => toast.error(e.message));
  }, [query, category, page, toast]);

  useEffect(load, [load]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/expenses/${deleting._id}`);
      toast.success('Expense deleted');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    if (!isPro) {
      toast.info('CSV export is part of Pro.');
      navigate('/billing');
      return;
    }
    try {
      const blob = await api.download('/expenses/export', { search: query, category });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported expenses.csv');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const filtered = Boolean(query || category);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p>
            {data ? (
              <>
                {data.total} {data.total === 1 ? 'expense' : 'expenses'}
                {filtered ? ' match your filters' : ''} · <span className="tabular">{money(data.sum)}</span> total
              </>
            ) : (
              'Loading your ledger'
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={exportCsv}>
            {isPro ? <Download size={17} /> : <Lock size={16} />} Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={18} className="ico-plus" /> Add expense
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-icon">
          <Search size={17} />
          <input className="input" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search expenses" />
        </div>
        <select
          className="input"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card table-card">
        {!data ? (
          <div style={{ display: 'grid', gap: 10, padding: 12 }}>
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : data.items.length === 0 ? (
          <div className="empty">
            <div className="e-ico"><Receipt size={26} /></div>
            <h3>{filtered ? 'No matching expenses' : 'No expenses yet'}</h3>
            <p style={{ marginBottom: 20 }}>
              {filtered ? 'Try a different search or clear the category filter.' : 'Add your first expense to start tracking.'}
            </p>
            {filtered ? (
              <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategory(''); }}>Clear filters</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} className="ico-plus" /> Add expense</button>
            )}
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th className="amt">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {data.items.map((x, i) => (
                      <motion.tr
                        key={x._id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03, duration: 0.4, ease } }}
                        exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                      >
                        <td>
                          <span className="t-title">{x.title}</span>
                          <span className="t-sub">{x.createdBy?.name ? `Added by ${x.createdBy.name}` : x.note}</span>
                        </td>
                        <td>
                          <span className="badge">
                            <span className="dot" style={{ background: CATEGORY_COLORS[x.category] }} />
                            {x.category}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{shortDate(x.date)}</td>
                        <td className="amt tabular">{money(x.amount)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="btn-icon" onClick={() => setEditing(x)} aria-label={`Edit ${x.title}`}><Pencil size={15} /></button>
                            <button className="btn-icon danger" onClick={() => setDeleting(x)} aria-label={`Delete ${x.title}`}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>Page {data.page} of {data.pages}</span>
              <div>
                <button className="btn-icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
                <button className="btn-icon" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      <ExpenseModal
        open={adding || Boolean(editing)}
        expense={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSaved={load}
        onLimit={() => toast.info('The Free plan holds 50 expenses. Upgrade to Pro for unlimited.')}
      />

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete this expense?">
        <p style={{ color: 'var(--muted)' }}>
          <b style={{ color: 'var(--text)' }}>{deleting?.title}</b> ({deleting && money(deleting.amount)}) will be removed for everyone in your workspace. This can't be undone.
        </p>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Keep expense</button>
          <button className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <span className="spinner" /> : 'Delete expense'}
          </button>
        </div>
      </Modal>
    </>
  );
}
