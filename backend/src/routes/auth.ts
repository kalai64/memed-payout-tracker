import { Router } from 'express';
import type { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';
import { loginSchema, signupSchema } from '../lib/validation';
import { ApiError } from '../lib/errors';
import { authenticate, currentUser } from '../middleware/auth';

export const authRouter = Router();
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.NODE_ENV === 'production',
  path: '/',
};
function publicUser(user: { _id: Types.ObjectId; name: string; email: string; role: string }) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}
authRouter.post('/signup', async (req, res) => {
  const data = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email,
    role: data.role,
    passwordHash,
  });
  const token = jwt.sign({}, config.JWT_SECRET, { subject: user._id.toString(), expiresIn: '7d' });
  res.cookie('session', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(201).json({ user: publicUser(user) });
});
authRouter.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash)))
    throw new ApiError(401, 'Email or password is incorrect.');
  const token = jwt.sign({}, config.JWT_SECRET, { subject: user._id.toString(), expiresIn: '7d' });
  res.cookie('session', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: publicUser(user) });
});
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('session', cookieOptions);
  res.status(204).end();
});
authRouter.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(currentUser(req).id).orFail();
  res.json({ user: publicUser(user) });
});
