import { Router } from 'express';
import {
  createFolder,
  createGroup,
  createRule,
  createSubFolder,
  deleteFolder,
  deleteGroup,
  deleteRule,
  deleteSubFolder,
  getNavigationAdmin,
  getNavigationMenu,
  moveFolder,
  moveSubFolder,
  updateFolder,
  updateGroup,
  updateRule,
  updateSubFolder,
} from '../controllers/navigationCtl';
import {
  createNavigationRole,
  deleteNavigationRole,
  getNavigationRoles,
  updateNavigationRole,
} from '../controllers/navRoleCtl';
import { authMiddleware } from '../middleware/auth';
import { LEGACY_API_ROLES } from '../config/roles';
import { permissionMiddleware } from '../middleware/permission';
import { requireRoles } from '../middleware/requireRoles';

const router = Router();

router.use(authMiddleware, permissionMiddleware);

router.get('/menu', getNavigationMenu);
router.get('/roles', getNavigationRoles);

router.get('/admin', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), getNavigationAdmin);
router.post('/roles', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), createNavigationRole);
router.patch('/roles/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), updateNavigationRole);
router.delete('/roles/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), deleteNavigationRole);

router.post('/groups', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), createGroup);
router.patch('/groups/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), updateGroup);
router.delete('/groups/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), deleteGroup);

router.post('/folders', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), createFolder);
router.patch('/folders/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), updateFolder);
router.patch('/folders/:id/move', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), moveFolder);
router.delete('/folders/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), deleteFolder);

router.post('/sub-folders', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), createSubFolder);
router.patch('/sub-folders/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), updateSubFolder);
router.patch('/sub-folders/:id/move', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), moveSubFolder);
router.delete('/sub-folders/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), deleteSubFolder);

router.post('/rules', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), createRule);
router.patch('/rules/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), updateRule);
router.delete('/rules/:id', requireRoles([LEGACY_API_ROLES.ADMINISTRATOR]), deleteRule);

export default router;
