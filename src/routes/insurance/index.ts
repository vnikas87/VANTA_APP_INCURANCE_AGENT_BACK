import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { permissionMiddleware } from '../../middleware/permission';
import customersRoutes from './customersRts';
import financialsRoutes from './financialsRts';
import gridPreferencesRoutes from './gridPreferencesRts';
import lookupsRoutes from './lookupsRts';
import notesRoutes from './notesRts';
import policiesRoutes from './policiesRts';
import productionRoutes from './productionRts';

const router = Router();

router.use(authMiddleware, permissionMiddleware);

router.use('/lookups', lookupsRoutes);
router.use('/customers', customersRoutes);
router.use('/policies', policiesRoutes);
router.use('/production-records', productionRoutes);
router.use('/policy-financials', financialsRoutes);
router.use('/policy-notes', notesRoutes);
router.use('/grid-preferences', gridPreferencesRoutes);

export default router;
