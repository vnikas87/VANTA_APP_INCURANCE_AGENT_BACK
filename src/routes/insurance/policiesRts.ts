import { Router } from 'express';
import {
  createPolicy,
  deletePolicy,
  getPolicyById,
  listPolicies,
  updatePolicy,
} from '../../controllers/insurance/policiesCtl';

const router = Router();

router.get('/', listPolicies);
router.get('/:id', getPolicyById);
router.post('/', createPolicy);
router.patch('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

export default router;
