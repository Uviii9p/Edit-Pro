import express from 'express';
import { createTask, getTasks, updateTask, deleteTask, startTimeTrack, stopTimeTrack } from '../controllers/tasks';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createTask);
router.get('/', auth, getTasks);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);
router.post('/:id/start', auth, startTimeTrack);
router.post('/:id/stop', auth, stopTimeTrack);

export default router;
