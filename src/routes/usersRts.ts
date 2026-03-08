import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getUserById,
  getUserDetails,
  updateMyProfile,
  updateUser,
  uploadMyAvatar,
} from '../controllers/usersCtl';
import { authMiddleware } from '../middleware/auth';
import { permissionMiddleware } from '../middleware/permission';

const router = Router();

router.use(authMiddleware, permissionMiddleware);

router.get('/me', getCurrentUser);
router.patch('/me/profile', updateMyProfile);
router.post('/me/avatar', uploadMyAvatar);
router.get('/', getAllUsers);
router.get('/:id/details', getUserDetails);
router.get('/:id', getUserById);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
