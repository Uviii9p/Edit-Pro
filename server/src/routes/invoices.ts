import express from 'express';
import { createInvoice, getInvoices, generatePDF, updateInvoice, markAsPaid, sendReminder, getPaymentAnalytics } from '../controllers/invoices';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, authorize(['ADMIN', 'EDITOR']), createInvoice);
router.get('/', auth, authorize(['ADMIN', 'EDITOR']), getInvoices);
router.get('/analytics', auth, authorize(['ADMIN', 'EDITOR']), getPaymentAnalytics);
router.put('/:id', auth, authorize(['ADMIN', 'EDITOR']), updateInvoice);
router.put('/:id/pay', auth, authorize(['ADMIN', 'EDITOR']), markAsPaid);
router.post('/:id/reminder', auth, authorize(['ADMIN', 'EDITOR']), sendReminder);
router.get('/:id/pdf', auth, authorize(['ADMIN', 'EDITOR']), generatePDF);

export default router;
