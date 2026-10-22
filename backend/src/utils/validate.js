import { CATEGORIES } from '../constants.js';
import { AppError } from './AppError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fail = (message) => {
  throw new AppError(400, message, 'VALIDATION');
};

export function str(value, label, { min = 1, max = 120 } = {}) {
  if (typeof value !== 'string') fail(`${label} is required`);
  const v = value.trim();
  if (v.length < min) fail(`${label} must be at least ${min} characters`);
  if (v.length > max) fail(`${label} must be at most ${max} characters`);
  return v;
}

export function email(value) {
  const v = str(value, 'Email', { max: 160 }).toLowerCase();
  if (!EMAIL_RE.test(v)) fail('Enter a valid email address');
  return v;
}

export function password(value) {
  if (typeof value !== 'string' || value.length < 8) fail('Password must be at least 8 characters');
  if (value.length > 100) fail('Password is too long');
  return value;
}

export function expenseInput(body = {}) {
  const title = str(body.title, 'Title', { max: 100 });

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) fail('Amount must be greater than 0');
  if (amount > 10_000_000) fail('Amount is too large');

  if (!CATEGORIES.includes(body.category)) fail('Choose a valid category');

  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) fail('Enter a valid date');

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';

  return { title, amount: Math.round(amount * 100) / 100, category: body.category, date, note };
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
