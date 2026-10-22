import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { tenantScope } from '../utils/tenant.js';
import { str, email, password } from '../utils/validate.js';
import { PLANS, effectivePlan } from '../constants.js';
import { serializeUser } from '../utils/serializers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const members = await tenantScope(User, req.orgId).find({}).sort({ createdAt: 1 });
    res.json(members.map((m) => ({ ...serializeUser(m), joinedAt: m.createdAt })));
  })
);

router.post(
  '/',
  requireOwner,
  asyncHandler(async (req, res) => {
    const scope = tenantScope(User, req.orgId);
    const max = PLANS[effectivePlan(req.org)].maxMembers;
    if ((await scope.count()) >= max) {
      throw new AppError(
        402,
        max === 1 ? 'The Free plan is for one user. Upgrade to Pro to invite teammates.' : `Team limit of ${max} reached`,
        'PLAN_LIMIT'
      );
    }

    const mail = email(req.body.email);
    if (await User.exists({ email: mail })) {
      throw new AppError(409, 'An account with this email already exists', 'DUPLICATE');
    }

    const member = await scope.create({
      name: str(req.body.name, 'Name', { min: 2, max: 60 }),
      email: mail,
      passwordHash: await bcrypt.hash(password(req.body.password), 12),
      role: 'member',
    });
    res.status(201).json({ ...serializeUser(member), joinedAt: member.createdAt });
  })
);

router.delete(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) throw new AppError(400, 'You cannot remove yourself', 'VALIDATION');
    const removed = await tenantScope(User, req.orgId).deleteById(req.params.id);
    if (!removed) throw new AppError(404, 'Member not found', 'NOT_FOUND');
    res.json({ ok: true });
  })
);

export default router;
