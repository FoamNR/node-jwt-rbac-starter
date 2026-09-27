import { Router } from 'express';
import { NotFoundError } from '../errors/app-error';
import { sendSuccess } from '../utils/response.util';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: API Health Check
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API is healthy and operational
 */
router.get('/health', (_req, res) => {
  sendSuccess(
    res,
    {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    'Service is healthy'
  );
});

// Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// 404 handler for unmatched API routes
router.use('*', (req) => {
  throw new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}' does not exist on this server`);
});

export default router;
