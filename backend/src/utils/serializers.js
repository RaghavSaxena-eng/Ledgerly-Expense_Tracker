import { PLANS, effectivePlan } from '../constants.js';

export const serializeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

export const serializeOrg = (o) => {
  const plan = effectivePlan(o);
  return {
    id: o.id,
    name: o.name,
    plan,
    subscriptionStatus: o.subscriptionStatus,
    currentPeriodEnd: o.currentPeriodEnd,
    paymentFailed: o.subscriptionStatus === 'past_due',
    limits: PLANS[plan],
  };
}
