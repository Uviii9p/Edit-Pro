import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';

export const createInvoice = async (req: any, res: Response) => {
    const { amount, tax, taxRate, projectId, invoiceNumber } = req.body;

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
        });
        res.json(invoices);
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

        // Configuration: Strict single-page A4
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            autoFirstPage: true
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        doc.pipe(res);

        const formatCurrency = (val: number) => `₹${new Intl.NumberFormat('en-IN').format(val)}`;
        let y = 50;

        // --- 1. HEADER SECTION ---
        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('EditPro Studio', 50, y);
        doc.fillColor('#1e40af').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, y, { align: 'right', width: 195 });

        y += 28;
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('contact@editpro.studio', 50, y);
        doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(`Invoice #: ${invoice.invoiceNumber}`, 350, y, { align: 'right', width: 195 });

        y += 14;
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('+91 98765 43210', 50, y);
        doc.text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, y, { align: 'right', width: 195 });

        y += 14;
        doc.text('Mumbai Digital Plaza, MH, India', 50, y);

        y += 24;
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#f1f5f9').lineWidth(2).stroke();

        // --- 2. BILL TO SECTION ---
        y += 30;
        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Bill To:', 50, y);
        y += 20;
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(invoice.user?.name || 'Valued Client', 50, y);
        y += 18;
        doc.fillColor('#64748b').fontSize(11).font('Helvetica').text(invoice.user?.email || '', 50, y);
        y += 18;
        doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold').text(`Project: ${invoice.project?.name || 'Standard Service'}`, 50, y);

        // --- 3. AMOUNT TABLE SECTION ---
        y += 40;
        const tableTop = y;
        doc.rect(50, tableTop, 495, 30).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DESCRIPTION', 65, tableTop + 10);
        doc.text('AMOUNT', 400, tableTop + 10, { align: 'right', width: 125 });

        // Row 1
        y += 30;
        doc.rect(50, y, 495, 30).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica').text('Creative Video Production & Editing Services', 65, y + 10);
        doc.font('Helvetica-Bold').text(formatCurrency(invoice.amount), 400, y + 10, { align: 'right', width: 125 });

        // Row 2
        y += 30;
        doc.rect(50, y, 495, 30).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#64748b').font('Helvetica').text(`Tax / GST (${(invoice as any).taxRate}%)`, 65, y + 10);
        doc.text(formatCurrency(invoice.tax), 400, y + 10, { align: 'right', width: 125 });

        // Total Row
        y += 30;
        doc.rect(50, y, 495, 35).fill('#f8fafc');
        doc.rect(50, y, 495, 35).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold').text('TOTAL PAYABLE', 65, y + 12);
        doc.fontSize(14).text(formatCurrency(invoice.amount + invoice.tax), 400, y + 10, { align: 'right', width: 125 });

        // --- 4. STATUS BADGE ---
        y += 50;
        const isPaid = invoice.status === 'PAID';
        doc.roundedRect(50, y, 80, 24, 4).fill(isPaid ? '#10b981' : '#ef4444');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(invoice.status, 50, y + 7, { width: 80, align: 'center' });

        // --- 5. FOOTER SECTION ---
        const footerY = 750;
        doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#f1f5f9').lineWidth(1).stroke();
        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Thank you for your business!', 50, footerY + 20, { align: 'center', width: 495 });
        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('Payment due within 7 days. Generated by EditPro Studio Manager', 50, footerY + 40, { align: 'center', width: 495 });

        doc.end();
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
