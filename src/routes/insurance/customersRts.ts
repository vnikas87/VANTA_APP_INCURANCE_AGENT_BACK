import { Router } from 'express';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '../../controllers/insurance/customersCtl';

const router = Router();

router.get('/', listCustomers);
router.post('/', createCustomer);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
