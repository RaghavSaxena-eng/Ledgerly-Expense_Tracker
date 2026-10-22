import mongoose from 'mongoose';

// Records processed Stripe events so retries and duplicate deliveries are handled exactly once.
const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
