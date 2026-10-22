import { env } from '../config/env.js';
import { stripe } from '../config/stripe.js';
import { Organization } from '../models/Organization.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { asyncHandler } from '../utils/AppError.js';
import {
  syncFromSubscription,
  markPaymentSucceeded,
  markPaymentFailed,
  cancelSubscription,
} from '../services/billingService.js';

const orgForCustomer = (customerId) => Organization.findOne({ stripeCustomerId: customerId });

async function orgForSubscription(sub) {
  const byCustomer = await orgForCustomer(sub.customer);
  if (byCustomer) return byCustomer;
  return sub.metadata?.orgId ? Organization.findById(sub.metadata.orgId) : null;
}

async function handleEvent(event) {
  const obj = event.data.object;

  switch (event.type) {
    // Customer completed Checkout: link the Stripe customer and activate the subscription
    case 'checkout.session.completed': {
      if (obj.mode !== 'subscription' || !obj.client_reference_id) return;
      const org = await Organization.findById(obj.client_reference_id);
      if (!org) return;
      org.stripeCustomerId = obj.customer;
      const subscription = await stripe.subscriptions.retrieve(obj.subscription);
      await syncFromSubscription(org, subscription);
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const org = await orgForSubscription(obj);
      if (!org) return;
      if (!org.stripeCustomerId) org.stripeCustomerId = obj.customer;
      await syncFromSubscription(org, obj);
      return;
    }

    case 'customer.subscription.deleted': {
      const org = await orgForSubscription(obj);
      if (org) await cancelSubscription(org);
      return;
    }

    // Payment success: make sure the workspace is active and clear any past-due flag
    case 'invoice.payment_succeeded': {
      const org = await orgForCustomer(obj.customer);
      if (org) await markPaymentSucceeded(org);
      return;
    }

    // Payment failure: flag the workspace as past due (Stripe will retry the card)
    case 'invoice.payment_failed': {
      const org = await orgForCustomer(obj.customer);
      if (org) await markPaymentFailed(org);
      return;
    }

    default:
      // Unhandled event types are acknowledged so Stripe doesn't keep retrying them
      return;
  }
}

export const stripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe || !env.stripe.webhookSecret) {
    return res.status(503).json({ message: 'Stripe webhooks are not configured' });
  }

  let event;
  try {
    // req.body is the raw Buffer (express.raw), required for signature verification
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], env.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  // Idempotency: the unique index rejects an event we've already processed
  try {
    await WebhookEvent.create({ eventId: event.id, type: event.type });
  } catch (err) {
    if (err.code === 11000) return res.json({ received: true, duplicate: true });
    throw err;
  }

  try {
    await handleEvent(event);
    res.json({ received: true });
  } catch (err) {
    // Release the idempotency lock so Stripe's retry can process the event again
    await WebhookEvent.deleteOne({ eventId: event.id });
    console.error(`Webhook ${event.type} failed:`, err);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
});
