import express from 'express';
import { createProject, getProjects, updateProject } from '../controllers/projects';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.put('/:id', auth, updateProject);

export default router;
