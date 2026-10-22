import { Router } from 'express';
import { Expense } from '../models/Expense.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';
import { tenantScope } from '../utils/tenant.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const scope = tenantScope(Expense, req.orgId);
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const startThis = new Date(Date.UTC(y, m, 1));
    const startSix = new Date(Date.UTC(y, m - 5, 1));
    const nextMonth = new Date(Date.UTC(y, m + 1, 1));

    const [monthly, byCategory, totalCount, recent] = await Promise.all([
      scope.aggregate([
        { $match: { date: { $gte: startSix, $lt: nextMonth } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      scope.aggregate([
        { $match: { date: { $gte: startThis, $lt: nextMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      scope.count(),
      scope.find({}).sort({ date: -1, _id: -1 }).limit(5).lean(),
    ]);

    // Fill gaps so the chart always shows six months
    const byKey = new Map(monthly.map((r) => [r._id, r]));
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 5 + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const row = byKey.get(key);
      return {
        key,
        label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        total: Math.round((row?.total || 0) * 100) / 100,
        count: row?.count || 0,
      };
    });

    const thisMonth = trend[5].total;
    const lastMonth = trend[4].total;

    res.json({
      thisMonth,
      lastMonth,
      change: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null,
      monthCount: trend[5].count,
      totalCount,
      trend,
      categories: byCategory.map((c) => ({ category: c._id, total: Math.round(c.total * 100) / 100 })),
      recent,
    });
  })
);

export default router;
