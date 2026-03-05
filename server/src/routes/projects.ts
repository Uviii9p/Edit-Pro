import express from 'express';
import { createProject, getProjects, updateProject, getProjectById, addComment, addMilestone } from '../controllers/projects';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);
router.put('/:id', auth, updateProject);
router.post('/:id/comments', auth, addComment);
router.post('/:id/milestones', auth, addMilestone);

export default router;
