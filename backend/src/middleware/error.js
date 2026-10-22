import { env } from '../config/env.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)[0]?.message || 'Invalid data';
    return res.status(400).json({ message, code: 'VALIDATION' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier', code: 'VALIDATION' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use', code: 'DUPLICATE' });
  }

  console.error(err);
  res.status(500).json({
    message: env.isProd ? 'Something went wrong' : err.message,
    code: 'SERVER_ERROR',
  });
};
