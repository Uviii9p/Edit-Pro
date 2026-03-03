import express from 'express';
import { createInvoice, getInvoices, generatePDF, updateInvoice } from '../controllers/invoices';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, authorize(['ADMIN', 'EDITOR']), createInvoice);
router.get('/', auth, authorize(['ADMIN', 'EDITOR']), getInvoices);
router.put('/:id', auth, authorize(['ADMIN', 'EDITOR']), updateInvoice);
router.get('/:id/pdf', auth, authorize(['ADMIN', 'EDITOR']), generatePDF);

export default router;
