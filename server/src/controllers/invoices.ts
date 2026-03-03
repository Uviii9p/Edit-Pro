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

        // 1️⃣ Configuration: Strict Single Page, No Auto Page Break
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

        // --- 1. HEADER SECTION (Fixed Coordinates) ---
        // Left Column
        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('EditPro Studio', 50, 50);
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('contact@editpro.studio', 50, 78);
        doc.text('+91 98765 43210', 50, 92);
        doc.text('Mumbai Digital Plaza, MH, India', 50, 106);

        // Right Column
        doc.fillColor('#1e40af').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 50, { align: 'right', width: 195 });
        doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(`Invoice #: ${invoice.invoiceNumber}`, 350, 85, { align: 'right', width: 195 });
        doc.font('Helvetica').text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, 100, { align: 'right', width: 195 });

        doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#f1f5f9').lineWidth(2).stroke();

        // --- 2. BILL TO SECTION (Fixed coordinates) ---
        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Bill To:', 50, 160);
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(invoice.user?.name || 'Valued Client', 50, 185, { width: 250 });
        doc.fillColor('#64748b').fontSize(11).font('Helvetica').text(invoice.user?.email || '', 50, 202, { width: 250 });
        doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold').text(`Project: ${invoice.project?.name || 'Standard Service'}`, 50, 220, { width: 250, lineBreak: false });

        // --- 3. COMPACT AMOUNT TABLE (Fixed Rects) ---
        // Header
        const tableY = 260;
        doc.rect(50, tableY, 495, 30).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DESCRIPTION', 65, tableY + 10);
        doc.text('AMOUNT', 400, tableY + 10, { align: 'right', width: 125 });

        // Row 1
        const row1Y = tableY + 30;
        doc.rect(50, row1Y, 495, 30).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica').text('Video Production & Editing', 65, row1Y + 10, { width: 330, lineBreak: false });
        doc.font('Helvetica-Bold').text(formatCurrency(invoice.amount), 400, row1Y + 10, { align: 'right', width: 125 });

        // Row 2
        const row2Y = row1Y + 30;
        doc.rect(50, row2Y, 495, 30).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#64748b').font('Helvetica').text(`Tax / GST (${(invoice as any).taxRate}%)`, 65, row2Y + 10, { width: 330, lineBreak: false });
        doc.text(formatCurrency(invoice.tax), 400, row2Y + 10, { align: 'right', width: 125 });

        // Total
        const totalY = row2Y + 30;
        doc.rect(50, totalY, 495, 35).fill('#f8fafc');
        doc.rect(50, totalY, 495, 35).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold').text('TOTAL PAYABLE', 65, totalY + 12);
        doc.fontSize(14).text(formatCurrency(invoice.amount + invoice.tax), 400, totalY + 10, { align: 'right', width: 125 });

        // --- 4. STATUS BADGE ---
        const badgeY = totalY + 50;
        const isPaid = invoice.status === 'PAID';
        doc.roundedRect(50, badgeY, 80, 24, 4).fill(isPaid ? '#10b981' : '#ef4444');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(invoice.status, 50, badgeY + 7, { width: 80, align: 'center' });

        // --- 5. FOOTER (Bottom Fixed) ---
        const footY = 750;
        doc.moveTo(50, footY).lineTo(545, footY).strokeColor('#f1f5f9').lineWidth(1).stroke();
        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Thank you for your business!', 50, footY + 20, { align: 'center', width: 495 });
        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('Payment due within 7 days. Generated by EditPro Studio Manager', 50, footY + 40, { align: 'center', width: 495 });

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
