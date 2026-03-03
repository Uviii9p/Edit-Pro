import express from 'express';
import { generateSchedule, suggestTaskBreakdown, generateVideoMeta, suggestReply } from '../controllers/ai';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/schedule', auth, generateSchedule);
router.post('/breakdown', auth, suggestTaskBreakdown);
router.post('/meta', auth, generateVideoMeta);
router.post('/reply', auth, suggestReply);

export default router;
