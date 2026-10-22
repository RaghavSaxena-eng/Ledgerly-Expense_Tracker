import { PRO_STATUSES } from '../constants.js';

/**
 * Billing state transitions. Both the Stripe webhook handler and the demo-mode simulator
 * call these, so the app behaves identically with or without a live Stripe account.
 */

export async function syncFromSubscription(org, sub) {
  org.stripeSubscriptionId = sub.id;
  org.subscriptionStatus = sub.status;
  org.plan = PRO_STATUSES.includes(sub.status) ? 'pro' : 'free';

  // Newer Stripe API versions moved the period end onto the subscription item.
  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  if (periodEnd) org.currentPeriodEnd = new Date(periodEnd * 1000);

  if (sub.status === 'active') org.paymentFailedAt = null;
  return org.save();
}

export async function markPaymentSucceeded(org) {
  org.plan = 'pro';
  org.subscriptionStatus = 'active';
  org.paymentFailedAt = null;
  return org.save();
}

export async function markPaymentFailed(org) {
  org.subscriptionStatus = 'past_due';
  org.paymentFailedAt = new Date();
  return org.save();
}

export async function cancelSubscription(org) {
  org.plan = 'free';
  org.subscriptionStatus = 'canceled';
  org.stripeSubscriptionId = null;
  org.currentPeriodEnd = null;
  org.paymentFailedAt = null;
  return org.save();
}
