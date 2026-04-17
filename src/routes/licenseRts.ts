import { Router } from 'express';
import { LEGACY_API_ROLES } from '../config/roles';
import {
  activateLicenseCode,
  deactivateLicense,
  getLicenseStatus,
  setUserSeatStatus,
} from '../controllers/licenseCtl';
import { authMiddleware } from '../middleware/auth';
import { permissionMiddleware } from '../middleware/permission';
import { requireRoles } from '../middleware/requireRoles';

const router = Router();

router.use(authMiddleware, permissionMiddleware, requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]));

router.get('/', getLicenseStatus);
router.post('/activate', activateLicenseCode);
router.post('/deactivate', deactivateLicense);
router.patch('/users/:userId', setUserSeatStatus);

export default router;
