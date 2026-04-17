import licenseRoutes from './licenseRts';
import { Router } from 'express';
import insuranceRoutes from './insuranceRts';
import navigationRoutes from './navigationRts';
import usersRoutes from './usersRts';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/users', usersRoutes);
router.use('/navigation', navigationRoutes);
router.use('/license', licenseRoutes);
router.use('/insurance', insuranceRoutes);

export default router;
