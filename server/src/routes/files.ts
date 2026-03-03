import express from 'express';
import multer from 'multer';
import { uploadProjectFile, getProjectFiles } from '../controllers/files';
import { auth } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', auth, upload.single('file'), uploadProjectFile);
router.get('/project/:projectId', auth, getProjectFiles);

export default router;
