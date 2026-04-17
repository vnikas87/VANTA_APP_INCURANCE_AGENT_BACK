import { Router } from 'express';
import {
  createPolicyNote,
  deletePolicyNote,
  getPolicyNoteById,
  listPolicyNotes,
  updatePolicyNote,
} from '../../controllers/insurance/notesCtl';

const router = Router();

router.get('/', listPolicyNotes);
router.get('/:id', getPolicyNoteById);
router.post('/', createPolicyNote);
router.patch('/:id', updatePolicyNote);
router.delete('/:id', deletePolicyNote);

export default router;
