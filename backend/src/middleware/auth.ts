import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../lib/errors';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'brand' | 'creator' };
    }
  }
}
export const authenticate: RequestHandler = async (req, _res, next) => {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer ?? req.cookies?.session;
  if (!token) throw new ApiError(401, 'Please log in.');
  let userId: string;
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded.sub) throw new Error('Invalid token');
    userId = decoded.sub;
  } catch {
    throw new ApiError(401, 'Your session expired. Please log in again.');
  }
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'Account not found.');
  req.user = { id: user.id, role: user.role };
  next();
};
export function allowRole(role: 'brand' | 'creator'): RequestHandler {
  return (req, _res, next) => {
    if (req.user?.role !== role) throw new ApiError(403, `This action requires a ${role} account.`);
    next();
  };
}
export function currentUser(req: Request) {
  if (!req.user) throw new ApiError(401, 'Please log in.');
  return req.user;
}
