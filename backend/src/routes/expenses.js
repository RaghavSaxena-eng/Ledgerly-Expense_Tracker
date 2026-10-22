import { Router } from 'express';
import { Expense } from '../models/Expense.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { tenantScope } from '../utils/tenant.js';
import { expenseInput, escapeRegex } from '../utils/validate.js';
import { CATEGORIES, PLANS, effectivePlan } from '../constants.js';

const router = Router();
router.use(requireAuth);

function buildFilter(query) {
  const filter = {};
  if (query.category && CATEGORIES.includes(query.category)) filter.category = query.category;
  if (query.search) filter.title = { $regex: escapeRegex(String(query.search).slice(0, 60)), $options: 'i' };

  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  if ((from && !Number.isNaN(from)) || (to && !Number.isNaN(to))) {
    filter.date = {};
    if (from && !Number.isNaN(from)) filter.date.$gte = from;
    if (to && !Number.isNaN(to)) filter.date.$lte = to;
  }
  return filter;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const scope = tenantScope(Expense, req.orgId);
    const filter = buildFilter(req.query);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [items, total, sums] = await Promise.all([
      scope
        .find(filter)
        .sort({ date: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'name')
        .lean(),
      scope.count(filter),
      scope.aggregate([{ $match: filter }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      sum: sums[0]?.sum || 0,
    });
  })
);

// CSV export is a Pro feature
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    if (!PLANS[effectivePlan(req.org)].csvExport) {
      throw new AppError(402, 'CSV export is available on the Pro plan', 'PLAN_LIMIT');
    }
    const rows = await tenantScope(Expense, req.orgId).find(buildFilter(req.query)).sort({ date: -1 }).lean();
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      'Date,Title,Category,Amount,Note',
      ...rows.map((r) =>
        [r.date.toISOString().slice(0, 10), esc(r.title), r.category, r.amount.toFixed(2), esc(r.note)].join(',')
      ),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csv);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const scope = tenantScope(Expense, req.orgId);
    const max = PLANS[effectivePlan(req.org)].maxExpenses;
    if (max !== null && (await scope.count()) >= max) {
      throw new AppError(402, `Free plan is limited to ${max} expenses. Upgrade to Pro for unlimited.`, 'PLAN_LIMIT');
    }
    const expense = await scope.create({ ...expenseInput(req.body), createdBy: req.user._id });
    res.status(201).json(expense);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await tenantScope(Expense, req.orgId).updateById(req.params.id, expenseInput(req.body));
    if (!expense) throw new AppError(404, 'Expense not found', 'NOT_FOUND');
    res.json(expense);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await tenantScope(Expense, req.orgId).deleteById(req.params.id);
    if (!expense) throw new AppError(404, 'Expense not found', 'NOT_FOUND');
    res.json({ ok: true });
  })
);

export default router;
