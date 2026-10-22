export const CATEGORIES = [
  'Software',
  'Marketing',
  'Travel',
  'Meals',
  'Office',
  'Utilities',
  'Payroll',
  'Other',
];

export const PLANS = {
  free: { key: 'free', name: 'Free', price: 0, maxExpenses: 50, maxMembers: 1, csvExport: false },
  pro: { key: 'pro', name: 'Pro', price: 12, maxExpenses: null, maxMembers: 10, csvExport: true },
};

// Subscription statuses that keep Pro features switched on.
// past_due stays on during Stripe's retry window so a failed card doesn't instantly lock a team out.
export const PRO_STATUSES = ['active', 'trialing', 'past_due'];

export const SUBSCRIPTION_STATUSES = [
  'none',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
];

export const effectivePlan = (org) =>
  org.plan === 'pro' && PRO_STATUSES.includes(org.subscriptionStatus) ? 'pro' : 'free';
