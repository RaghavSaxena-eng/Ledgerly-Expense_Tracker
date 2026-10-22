import mongoose from 'mongoose';
import { CATEGORIES } from '../constants.js';

const expenseSchema = new mongoose.Schema(
  {
    // Tenant key: every query is scoped by this field (see utils/tenant.js)
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, enum: CATEGORIES, required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// Tenant key first so every per-tenant query hits an index
expenseSchema.index({ organization: 1, date: -1 });
expenseSchema.index({ organization: 1, category: 1 });

export const Expense = mongoose.model('Expense', expenseSchema);
