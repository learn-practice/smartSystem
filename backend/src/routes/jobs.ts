import { Router } from 'express';
import { getJobs, createJob, updateJob, deleteJob } from '../controllers/jobController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getJobs);
router.post('/', authorize('admin', 'manager'), createJob);
router.put('/:id', authorize('admin', 'manager'), updateJob);
router.delete('/:id', authorize('admin'), deleteJob);
export default router;
