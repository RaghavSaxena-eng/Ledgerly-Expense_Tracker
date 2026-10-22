import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Expense } from '../models/Expense.js';

const DEMO = [
  { org: 'Acme Studio', name: 'Ava Carter', email: 'demo@acme.dev', plan: 'free', expenses: 38 },
  { org: 'Globex Labs', name: 'Noah Kim', email: 'demo@globex.dev', plan: 'pro', expenses: 46 },
];
const PASSWORD = 'Demo@1234';

const CATALOG = {
  Software: [['Figma subscription', 45], ['GitHub Team', 84], ['Notion workspace', 32], ['AWS hosting', 212], ['Vercel Pro', 40]],
  Marketing: [['Google Ads', 380], ['Newsletter sponsorship', 250], ['Canva Pro', 13], ['Product Hunt launch kit', 120]],
  Travel: [['Flight to Berlin', 410], ['Uber rides', 56], ['Hotel – client visit', 260]],
  Meals: [['Team lunch', 94], ['Client dinner', 168], ['Coffee run', 27]],
  Office: [['Standing desk', 340], ['Monitor arm', 79], ['Printer paper', 24]],
  Utilities: [['Internet', 60], ['Co-working space', 220], ['Phone plan', 45]],
  Payroll: [['Contractor – design', 900], ['Contractor – QA', 600]],
  Other: [['Accounting fees', 150], ['Business insurance', 110]],
};

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

await connectDB();

// Remove previous demo data only
const old = await User.find({ email: { $in: DEMO.map((d) => d.email) } });
const oldOrgIds = old.map((u) => u.organization);
await Expense.deleteMany({ organization: { $in: oldOrgIds } });
await User.deleteMany({ organization: { $in: oldOrgIds } });
await Organization.deleteMany({ _id: { $in: oldOrgIds } });

const passwordHash = await bcrypt.hash(PASSWORD, 10);
const now = new Date();

for (const d of DEMO) {
  const org = await Organization.create({
    name: d.org,
    plan: d.plan,
    subscriptionStatus: d.plan === 'pro' ? 'active' : 'none',
    stripeCustomerId: d.plan === 'pro' ? `cus_demo_${d.email}` : undefined,
    currentPeriodEnd: d.plan === 'pro' ? new Date(Date.now() + 21 * 24 * 3600 * 1000) : null,
  });
  const user = await User.create({ organization: org._id, name: d.name, email: d.email, passwordHash, role: 'owner' });

  const startMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1);
  const docs = Array.from({ length: d.expenses }, () => {
    const category = pick(Object.keys(CATALOG));
    const [title, base] = pick(CATALOG[category]);
    return {
      organization: org._id,
      createdBy: user._id,
      title,
      category,
      amount: Math.round(base * rand(0.85, 1.25) * 100) / 100,
      date: new Date(rand(startMs, now.getTime())),
      note: '',
    };
  });
  await Expense.insertMany(docs);
  console.log(`Seeded ${d.org}: ${d.email} / ${PASSWORD} (${d.plan}, ${d.expenses} expenses)`);
}

await mongoose.disconnect();
