import express from 'express';
import { createBooking, getBookings } from '../controllers/bookings';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, getBookings);

export default router;
