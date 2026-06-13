import { Router } from 'express';
import { register, login, googleAuth, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/google', googleAuth);
authRouter.get('/me', authenticate, getMe);
