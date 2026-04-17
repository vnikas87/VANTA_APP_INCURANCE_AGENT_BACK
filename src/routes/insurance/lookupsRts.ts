import { Router } from 'express';
import {
  createLookupItem,
  deleteLookupItem,
  getInsuranceLookups,
  listLookupItems,
  updateLookupItem,
} from '../../controllers/insurance/lookupsCtl';

const router = Router();

router.get('/', getInsuranceLookups);
router.get('/:type', listLookupItems);
router.post('/:type', createLookupItem);
router.patch('/:type/:id', updateLookupItem);
router.delete('/:type/:id', deleteLookupItem);

export default router;
