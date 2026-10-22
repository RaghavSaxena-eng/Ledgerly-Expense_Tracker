import mongoose from 'mongoose';
import { SUBSCRIPTION_STATUSES } from '../constants.js';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    subscriptionStatus: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'none' },
    stripeCustomerId: { type: String, index: true, sparse: true },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    paymentFailedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Organization = mongoose.model('Organization', organizationSchema);
