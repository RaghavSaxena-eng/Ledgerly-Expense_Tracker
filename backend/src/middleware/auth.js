import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, 'Session expired, please sign in again', 'UNAUTHENTICATED');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'Account no longer exists', 'UNAUTHENTICATED');

  const org = await Organization.findById(user.organization);
  if (!org) throw new AppError(401, 'Organization no longer exists', 'UNAUTHENTICATED');

  req.user = user;
  req.org = org;
  // The tenant id is derived from the database record, never from client input.
  req.orgId = String(user.organization);
  next();
});

export const requireOwner = (req, _res, next) => {
  if (req.user.role !== 'owner') {
    return next(new AppError(403, 'Only the workspace owner can do this', 'FORBIDDEN'));
  }
  next();
};
