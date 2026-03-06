import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';

export const createInvoice = async (req: any, res: Response) => {
    const { amount, tax, taxRate, projectId, invoiceNumber, dueDate } = req.body;

    const baseAmount = parseFloat(amount);
    const taxAmount = parseFloat(tax);
    const rate = parseFloat(taxRate);

    if (isNaN(baseAmount) || isNaN(taxAmount) || isNaN(rate)) {
        return res.status(400).json({ error: "Invalid numeric values for amount or tax" });
    }

    try {
        const invoice = await (prisma.invoice as any).create({
            data: {
                invoiceNumber,
                amount: baseAmount,
                tax: taxAmount,
                taxRate: rate || 18,
                projectId: projectId || null,
                userId: req.user.id,
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            },
        });
        res.status(201).json(invoice);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInvoices = async (req: any, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { userId: req.user.id },
            include: { project: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(invoices);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { invoiceNumber, amount, tax, taxRate, projectId, status } = req.body;

    const parsedAmount = amount !== undefined ? parseFloat(amount) : undefined;
    const parsedTax = tax !== undefined ? parseFloat(tax) : undefined;
    const parsedRate = taxRate !== undefined ? parseFloat(taxRate) : undefined;

    if ((amount !== undefined && isNaN(parsedAmount as number)) ||
        (tax !== undefined && isNaN(parsedTax as number)) ||
        (taxRate !== undefined && isNaN(parsedRate as number))) {
        return res.status(400).json({ error: "Invalid numeric values in update request" });
    }

    try {
        const invoice = await (prisma.invoice as any).update({
            where: { id: id as string },
            data: {
                invoiceNumber,
                amount: parsedAmount,
                tax: parsedTax,
                taxRate: parsedRate,
                projectId: projectId || null,
                status,
            },
        });
        res.json(invoice);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Mark invoice as paid
export const markAsPaid = async (req: any, res: Response) => {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;

    try {
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const updated = await (prisma.invoice as any).update({
            where: { id },
            data: {
                status: 'PAID',
                paymentMethod: paymentMethod || 'Bank Transfer',
                paymentDate: new Date(),
                transactionId: transactionId || `TXN-${Date.now()}`,
                paidAmount: invoice.amount + invoice.tax,
            },
            include: { project: true },
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Send payment reminder
export const sendReminder = async (req: any, res: Response) => {
    const { id } = req.params;
    const { method } = req.body; // email, whatsapp, sms

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { project: true, user: true },
        });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Update reminder tracking
        const updated = await (prisma.invoice as any).update({
            where: { id },
            data: {
                reminderSentAt: new Date(),
                reminderCount: { increment: 1 },
            },
            include: { project: true },
        });

        // In a real app, you'd send actual email/SMS/WhatsApp here
        // For now we log it and return success
        const clientName = invoice.project?.clientName || 'Valued Client';
        const total = invoice.amount + invoice.tax;
        const dueDate = invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString('en-IN')
            : 'Upon Receipt';

        const message = `Hello ${clientName}, your invoice #${invoice.invoiceNumber} of ₹${total.toLocaleString()} is due on ${dueDate}. Please complete the payment. Thank you.`;

        console.log(`[REMINDER ${method?.toUpperCase() || 'EMAIL'}] ${message}`);

        res.json({
            success: true,
            message: `Reminder sent via ${method || 'email'}`,
            invoice: updated,
            reminderMessage: message,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Payment analytics
// Payment analytics
export const getPaymentAnalytics = async (req: any, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { userId: req.user.id },
            include: { project: true },
        });

        const now = new Date();

        const totalPaid = invoices
            .filter(i => i.status === 'PAID')
            .reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0);

        const totalPending = invoices
            .filter(i => i.status !== 'PAID' && (!i.dueDate || new Date(i.dueDate) >= now))
            .reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0);

        const totalOverdue = invoices
            .filter(i => i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < now)
            .reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0);

        // Monthly revenue for chart (last 6 months)
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

            const monthPaid = invoices
                .filter(inv => {
                    if (inv.status !== 'PAID') return false;
                    const dateToUse = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                    return dateToUse >= monthStart && dateToUse <= monthEnd;
                })
                .reduce((acc, inv) => acc + (inv.amount || 0) + (inv.tax || 0), 0);

            const monthInvoiced = invoices
                .filter(inv => {
                    const cd = new Date(inv.createdAt);
                    return cd >= monthStart && cd <= monthEnd;
                })
                .reduce((acc, inv) => acc + (inv.amount || 0) + (inv.tax || 0), 0);

            monthlyRevenue.push({ name: monthStr, amount: monthPaid, invoiced: monthInvoiced });
        }

        // Weekly revenue (Last 4 weeks)
        const weeklyRevenue = [];
        for (let i = 3; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - (i * 7));
            weekEnd.setHours(23, 59, 59, 999);

            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekEnd.getDate() - 7);
            weekStart.setHours(0, 0, 0, 0);

            const weekStr = i === 0 ? 'Current' : `Wk ${4 - i}`;

            const weekPaid = invoices
                .filter(inv => {
                    if (inv.status !== 'PAID') return false;
                    const dateToUse = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                    return dateToUse >= weekStart && dateToUse <= weekEnd;
                })
                .reduce((acc, inv) => acc + (inv.amount || 0) + (inv.tax || 0), 0);

            const weekInvoiced = invoices
                .filter(inv => {
                    const cd = new Date(inv.createdAt);
                    return cd >= weekStart && cd <= weekEnd;
                })
                .reduce((acc, inv) => acc + (inv.amount || 0) + (inv.tax || 0), 0);

            weeklyRevenue.push({ name: weekStr, amount: weekPaid, invoiced: weekInvoiced });
        }

        res.json({
            totalPaid,
            totalPending,
            totalOverdue,
            totalInvoices: invoices.length,
            paidCount: invoices.filter(i => i.status === 'PAID').length,
            pendingCount: invoices.filter(i => i.status !== 'PAID' && (!i.dueDate || new Date(i.dueDate) >= now)).length,
            overdueCount: invoices.filter(i => i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < now).length,
            monthlyRevenue,
            weeklyRevenue,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const generatePDF = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: id as string },
            include: { project: true, user: true },
        });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            autoFirstPage: true,
            bufferPages: false
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        doc.pipe(res);

        const formatCurrency = (val: number) => `₹${new Intl.NumberFormat('en-IN').format(val)}`;

        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('EditPro Studio', 50, 50);
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('contact@editpro.studio', 50, 78);
        doc.text('+91 98765 43210', 50, 92);
        doc.text('Mumbai Digital Plaza, MH, India', 50, 106);

        doc.fillColor('#1e40af').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 50, { align: 'right', width: 195 });
        doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(`Invoice #: ${invoice.invoiceNumber}`, 350, 85, { align: 'right', width: 195 });
        doc.font('Helvetica').text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, 100, { align: 'right', width: 195 });
        if (invoice.dueDate) {
            doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 350, 115, { align: 'right', width: 195 });
        }

        doc.moveTo(50, 135).lineTo(545, 135).strokeColor('#f1f5f9').lineWidth(2).stroke();

        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Bill To:', 50, 155);
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(invoice.project?.clientName || invoice.user?.name || 'Valued Client', 50, 175, { width: 250 });
        doc.fillColor('#64748b').fontSize(11).font('Helvetica').text(invoice.project?.clientEmail || invoice.user?.email || '', 50, 192, { width: 250 });
        doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold').text(`Project: ${invoice.project?.name || 'Standard Service'}`, 50, 210, { width: 250 });

        // Payment status
        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Payment:', 350, 155);
        doc.fillColor('#64748b').fontSize(11).font('Helvetica').text(`Method: ${invoice.paymentMethod || 'Pending'}`, 350, 175);
        doc.text(`Status: ${invoice.status}`, 350, 192);

        const tableY = 245;
        doc.rect(50, tableY, 495, 30).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DESCRIPTION', 65, tableY + 10);
        doc.text('QTY', 280, tableY + 10, { width: 40, align: 'center' });
        doc.text('PRICE', 330, tableY + 10, { width: 80, align: 'right' });
        doc.text('TOTAL', 420, tableY + 10, { width: 105, align: 'right' });

        const row1Y = tableY + 30;
        doc.rect(50, row1Y, 495, 30).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica').text(invoice.project?.name || 'Video Editing', 65, row1Y + 10, { width: 210 });
        doc.text('1', 280, row1Y + 10, { width: 40, align: 'center' });
        doc.font('Helvetica-Bold').text(formatCurrency(invoice.amount), 330, row1Y + 10, { width: 80, align: 'right' });
        doc.text(formatCurrency(invoice.amount), 420, row1Y + 10, { width: 105, align: 'right' });

        const row2Y = row1Y + 30;
        doc.rect(50, row2Y, 495, 30).fill('#f8fafc');
        doc.rect(50, row2Y, 495, 30).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#64748b').font('Helvetica').text(`GST (${(invoice as any).taxRate}%)`, 65, row2Y + 10, { width: 210 });
        doc.text('—', 280, row2Y + 10, { width: 40, align: 'center' });
        doc.text(formatCurrency(invoice.tax), 330, row2Y + 10, { width: 80, align: 'right' });
        doc.text(formatCurrency(invoice.tax), 420, row2Y + 10, { width: 105, align: 'right' });

        const totalY = row2Y + 30;
        doc.rect(50, totalY, 495, 35).fill('#1e3a5f');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('GRAND TOTAL', 65, totalY + 12);
        doc.fontSize(14).text(formatCurrency(invoice.amount + invoice.tax), 420, totalY + 10, { width: 105, align: 'right' });

        // Payment info box
        const payY = totalY + 55;
        doc.rect(50, payY, 495, 60).fill('#f0f7ff');
        doc.rect(50, payY, 495, 60).strokeColor('#dbeafe').stroke();
        doc.fillColor('#3b82f6').fontSize(9).font('Helvetica-Bold').text('PAYMENT INFORMATION', 65, payY + 10);
        doc.fillColor('#475569').fontSize(10).font('Helvetica').text('Bank: State Bank of India  |  A/C: XXXX XXXX 4567  |  IFSC: SBIN0001234', 65, payY + 28);
        doc.text('UPI: editpro@upi', 65, payY + 42);

        // Status badge
        const badgeY = payY + 75;
        const isPaid = invoice.status === 'PAID';
        doc.roundedRect(50, badgeY, 80, 24, 4).fill(isPaid ? '#10b981' : '#ef4444');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(invoice.status, 50, badgeY + 7, { width: 80, align: 'center' });

        const footY = 750;
        doc.moveTo(50, footY).lineTo(545, footY).strokeColor('#f1f5f9').lineWidth(1).stroke();
        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Thank you for your business!', 50, footY + 20, { align: 'center', width: 495 });
        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('Payment due within 15 days • GSTIN: 27XXXXX1234X1ZX • EditPro Studio', 50, footY + 40, { align: 'center', width: 495 });

        doc.end();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
