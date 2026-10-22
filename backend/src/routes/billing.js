import { Router } from 'express';
import { env } from '../config/env.js';
import { stripe, stripeConfigured } from '../config/stripe.js';
import { Expense } from '../models/Expense.js';
import { User } from '../models/User.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { tenantScope } from '../utils/tenant.js';
import { serializeOrg } from '../utils/serializers.js';
import { effectivePlan } from '../constants.js';
import {
  syncFromSubscription,
  markPaymentSucceeded,
  markPaymentFailed,
  cancelSubscription,
} from '../services/billingService.js';

const router = Router();
router.use(requireAuth);

const demoMode = !stripe && !env.isProd;

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const [expenses, members] = await Promise.all([
      tenantScope(Expense, req.orgId).count(),
      tenantScope(User, req.orgId).count(),
    ]);
    res.json({
      organization: serializeOrg(req.org),
      usage: { expenses, members },
      stripeConfigured,
      demoMode,
    });
  })
);

router.post(
  '/checkout',
  requireOwner,
  asyncHandler(async (req, res) => {
    if (!stripeConfigured) {
      throw new AppError(503, 'Stripe is not configured on this server', 'STRIPE_NOT_CONFIGURED');
    }
    const org = req.org;
    if (effectivePlan(org) === 'pro') throw new AppError(400, 'Already on the Pro plan', 'VALIDATION');

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: req.user.email,
        metadata: { orgId: org.id },
      });
      customerId = customer.id;
      org.stripeCustomerId = customerId;
      await org.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: org.id,
      line_items: [{ price: env.stripe.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { orgId: org.id } },
      success_url: `${env.clientUrl}/billing?status=success`,
      cancel_url: `${env.clientUrl}/billing?status=cancelled`,
    });
    res.json({ url: session.url });
  })
);

router.post(
  '/portal',
  requireOwner,
  asyncHandler(async (req, res) => {
    if (!stripeConfigured || !req.org.stripeCustomerId) {
      throw new AppError(400, 'No billing account to manage yet', 'VALIDATION');
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: req.org.stripeCustomerId,
      return_url: `${env.clientUrl}/billing`,
    });
    res.json({ url: portal.url });
  })
);

// Demo mode only: simulates the Stripe events so the full billing UX can be explored
// locally without a Stripe account. Uses the same state transitions as the real webhook.
router.post(
  '/dev/simulate',
  requireOwner,
  asyncHandler(async (req, res) => {
    if (!demoMode) throw new AppError(404, 'Not available', 'NOT_FOUND');
    const org = req.org;

    switch (req.body.event) {
      case 'upgrade':
        org.stripeCustomerId = org.stripeCustomerId || `cus_demo_${org.id}`;
        await syncFromSubscription(org, {
          id: `sub_demo_${org.id}`,
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        });
        break;
      case 'payment_succeeded':
        await markPaymentSucceeded(org);
        break;
      case 'payment_failed':
        await markPaymentFailed(org);
        break;
      case 'cancel':
        await cancelSubscription(org);
        break;
      default:
        throw new AppError(400, 'Unknown event', 'VALIDATION');
    }
    res.json({ organization: serializeOrg(org) });
  })
);

export default router;
