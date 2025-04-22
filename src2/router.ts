import { Router } from 'express';

const router = Router();

// Home routes
import homeRoutes from './routes/index';
router.use('/', homeRoutes);

// Login routes
import loginRoutes from './routes/login';
router.use('/login', loginRoutes);

export default router;