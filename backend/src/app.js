import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';
import { stripeWebhook } from './routes/webhook.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import statsRoutes from './routes/stats.js';
import teamRoutes from './routes/team.js';
import billingRoutes from './routes/billing.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
if (!env.isProd) app.use(morgan('dev'));

// The Stripe webhook needs the raw request body for signature verification,
// so it must be registered BEFORE express.json().
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '100kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes' },
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/billing', billingRoutes);

app.use(notFound);
app.use(errorHandler);
