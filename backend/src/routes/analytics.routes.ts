import { Router } from 'express';
import { getRepoAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.get('/repository/:id', getRepoAnalytics);
