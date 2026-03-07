import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, sendOtp, verifyOtp, resetPassword } from '../controllers/auth';
import { auth } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('image'), updateProfile);
router.post('/change-password', auth, changePassword);

// OTP Password Reset Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
