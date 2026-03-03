import express from 'express';
import { createMeeting, getMeetings, updateMeeting, deleteMeeting } from '../controllers/meetings';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createMeeting);
router.get('/', auth, getMeetings);
router.put('/:id', auth, updateMeeting);
router.delete('/:id', auth, deleteMeeting);

export default router;
