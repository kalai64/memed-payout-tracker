import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    });
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error?.code === 11000) {
    res.status(409).json({ message: 'This email or post is already registered.' });
    return;
  }
  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    res.status(400).json({ message: 'Invalid data supplied.' });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON body.' });
    return;
  }
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ message: 'Request body is too large.' });
    return;
  }
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};
