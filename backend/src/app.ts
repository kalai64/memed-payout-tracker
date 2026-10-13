import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { config } from './config';
import { authRouter } from './routes/auth';
import { campaignRouter } from './routes/campaigns';
import { submissionRouter } from './routes/submissions';
import { errorHandler, ApiError } from './lib/errors';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
// CORS alone does not stop cross-origin writes. Reject foreign browser origins.
app.use((req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin &&
    req.headers.origin !== new URL(config.FRONTEND_URL).origin
  ) {
    throw new ApiError(403, 'Request origin is not allowed.');
  }
  next();
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/submissions', submissionRouter);
app.use((_req, _res, next) => next(new ApiError(404, 'Endpoint not found.')));
app.use(errorHandler);
