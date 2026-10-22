import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { str, email, password } from '../utils/validate.js';
import { serializeOrg, serializeUser } from '../utils/serializers.js';

const router = Router();

const signToken = (user) => jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpires });

const session = (user, org) => ({
  token: signToken(user),
  user: serializeUser(user),
  organization: serializeOrg(org),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const orgName = str(req.body.organizationName, 'Organization name', { min: 2, max: 60 });
    const name = str(req.body.name, 'Name', { min: 2, max: 60 });
    const mail = email(req.body.email);
    const pass = password(req.body.password);

    if (await User.exists({ email: mail })) {
      throw new AppError(409, 'An account with this email already exists', 'DUPLICATE');
    }

    const org = await Organization.create({ name: orgName });
    try {
      const user = await User.create({
        organization: org._id,
        name,
        email: mail,
        passwordHash: await bcrypt.hash(pass, 12),
        role: 'owner',
      });
      res.status(201).json(session(user, org));
    } catch (err) {
      await Organization.findByIdAndDelete(org._id);
      throw err;
    }
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const mail = email(req.body.email);
    const user = await User.findOne({ email: mail }).select('+passwordHash');
    const valid = user && (await bcrypt.compare(String(req.body.password || ''), user.passwordHash));
    if (!valid) throw new AppError(401, 'Incorrect email or password', 'BAD_CREDENTIALS');

    const org = await Organization.findById(user.organization);
    res.json(session(user, org));
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user), organization: serializeOrg(req.org) });
});

export default router;
