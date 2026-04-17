import { Router } from 'express';
import {
  createPolicyFinancial,
  deletePolicyFinancial,
  getPolicyFinancialById,
  listPolicyFinancials,
  updatePolicyFinancial,
} from '../../controllers/insurance/financialsCtl';

const router = Router();

router.get('/', listPolicyFinancials);
router.get('/:id', getPolicyFinancialById);
router.post('/', createPolicyFinancial);
router.patch('/:id', updatePolicyFinancial);
router.delete('/:id', deletePolicyFinancial);

export default router;
