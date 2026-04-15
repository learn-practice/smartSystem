import { Router } from 'express';
import { getTeams, getTeamById, createTeam, updateTeam, deleteTeam } from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', authorize('admin'), createTeam);
router.put('/:id', authorize('admin', 'manager'), updateTeam);
router.delete('/:id', authorize('admin'), deleteTeam);
export default router;
