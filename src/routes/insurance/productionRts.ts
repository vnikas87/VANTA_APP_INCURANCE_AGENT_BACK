import { Router } from 'express';
import {
  createProductionRecord,
  deleteProductionRecord,
  getProductionRecordById,
  listProductionRecords,
  updateProductionRecord,
} from '../../controllers/insurance/productionCtl';

const router = Router();

router.get('/', listProductionRecords);
router.get('/:id', getProductionRecordById);
router.post('/', createProductionRecord);
router.patch('/:id', updateProductionRecord);
router.delete('/:id', deleteProductionRecord);

export default router;
