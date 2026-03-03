import express from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/tasks';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createTask);
router.get('/', auth, getTasks);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

export default router;
