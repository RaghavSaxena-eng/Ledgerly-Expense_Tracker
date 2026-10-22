import Stripe from 'stripe';
import { env } from './env.js';

// null when no key is configured: the app then runs in demo mode.
export const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;

export const stripeConfigured = Boolean(stripe && env.stripe.priceId);
