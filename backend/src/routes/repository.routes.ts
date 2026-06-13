import { Router } from 'express';
import {
  analyzeRepository,
  getRepositories,
  getRepository,
  deleteRepository,
} from '../controllers/repository.controller';
import { authenticate } from '../middleware/auth.middleware';

export const repositoryRouter = Router();

repositoryRouter.use(authenticate);
repositoryRouter.post('/analyze', analyzeRepository);
repositoryRouter.get('/', getRepositories);
repositoryRouter.get('/:id', getRepository);
repositoryRouter.delete('/:id', deleteRepository);
