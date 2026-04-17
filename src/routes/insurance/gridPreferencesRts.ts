import { Router } from 'express';
import { getGridPreference, upsertGridPreference } from '../../controllers/insurance/gridPreferencesCtl';

const router = Router();

router.get('/:viewKey', getGridPreference);
router.put('/:viewKey', upsertGridPreference);

export default router;
