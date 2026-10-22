import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal.jsx';
import { api } from '../lib/api.js';
import { CATEGORIES, CATEGORY_COLORS, inputDate } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

const blank = () => ({ title: '', amount: '', category: 'Software', date: inputDate(new Date()), note: '' });

export default function ExpenseModal({ open, expense, onClose, onSaved, onLimit }) {
  const toast = useToast();
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      expense
        ? { title: expense.title, amount: String(expense.amount), category: expense.category, date: inputDate(expense.date), note: expense.note || '' }
        : blank()
    );
  }, [open, expense]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (expense) await api.put(`/expenses/${expense._id}`, form);
      else await api.post('/expenses', form);
      toast.success(expense ? 'Expense updated' : 'Expense added');
      onSaved();
      onClose();
    } catch (err) {
      if (err.code === 'PLAN_LIMIT') onLimit?.(err.message);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Add expense'}>
      <form onSubmit={submit} className="form-grid">
        <div className="field full">
          <label className="label">Title</label>
          <input className="input" placeholder="e.g. Figma subscription" value={form.title} onChange={set('title')} required autoFocus />
        </div>
        <div className="field">
          <label className="label">Amount (USD)</label>
          <input className="input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
        </div>
        <div className="field">
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <div className="field full">
          <label className="label">Category</label>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <motion.button
                type="button"
                key={c}
                whileTap={{ scale: 0.93 }}
                className={`chip ${form.category === c ? 'on' : ''}`}
                style={{ '--c': CATEGORY_COLORS[c] }}
                onClick={() => setForm((f) => ({ ...f, category: c }))}
              >
                <span className="dot" />
                {c}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="field full">
          <label className="label">Note (optional)</label>
          <textarea className="input" rows={2} maxLength={300} value={form.note} onChange={set('note')} placeholder="Anything worth remembering" />
        </div>
        {error && <div className="error-text full">{error}</div>}
        <div className="modal-foot full">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : expense ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
