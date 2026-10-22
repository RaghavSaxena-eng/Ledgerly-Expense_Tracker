export const CATEGORIES = ['Software', 'Marketing', 'Travel', 'Meals', 'Office', 'Utilities', 'Payroll', 'Other'];

export const CATEGORY_COLORS = {
  Software: '#2b59ff',
  Marketing: '#e5568d',
  Travel: '#0fa3c4',
  Meals: '#e8a100',
  Office: '#12a66a',
  Utilities: '#8b5cf6',
  Payroll: '#f2733d',
  Other: '#8a909d',
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const money = (n) => usd.format(n || 0);
export const moneyWhole = (n) => usdWhole.format(n || 0);

export const shortDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const inputDate = (d) => new Date(d).toISOString().slice(0, 10);

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
