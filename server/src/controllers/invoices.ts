import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';

export const createInvoice = async (req: any, res: Response) => {
    const { amount, tax, taxRate, projectId, invoiceNumber } = req.body;

    // Server-side strict numeric validation
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

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        doc.pipe(res);

        // Helper for currency formatting
        const formatCurrency = (val: number) => `₹${new Intl.NumberFormat('en-IN').format(val)}`;

        // --- 1. HEADER SECTION ---
        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('EditPro Studio', 50, 50);
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('contact@editpro.studio', 50, 75);
        doc.text('+91 98765 43210', 50, 88);
        doc.text('Mumbai Digital Plaza, MH, India', 50, 101);

        doc.fillColor('#1e40af').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 50, { align: 'right' });
        doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(`Invoice #: ${invoice.invoiceNumber}`, 350, 85, { align: 'right' });
        doc.font('Helvetica').text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, 100, { align: 'right' });

        // Header Divider
        doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#f1f5f9').lineWidth(2).stroke();

        // --- 2. CLIENT INFORMATION ---
        const clientY = 160;
        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, clientY);
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(invoice.user?.name || 'Valued Client', 50, clientY + 15);
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(invoice.user?.email || '', 50, clientY + 32);

        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('PROJECT', 350, clientY);
        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold').text(invoice.project?.name || 'Standard Service', 350, clientY + 15);

        // --- 3. AMOUNT TABLE ---
        const tableTop = 250;

        // Table Header
        doc.rect(50, tableTop, 495, 35).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DESCRIPTION', 70, tableTop + 13);
        doc.text('AMOUNT', 400, tableTop + 13, { align: 'right', width: 125 });

        // Row 1: Base Amount
        const row1Y = tableTop + 50;
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica').text('Creative Video Production & Editing Services', 70, row1Y);
        doc.font('Helvetica-Bold').text(formatCurrency(invoice.amount), 400, row1Y, { align: 'right', width: 125 });

        doc.moveTo(50, row1Y + 20).lineTo(545, row1Y + 20).strokeColor('#f1f5f9').lineWidth(1).stroke();

        // Row 2: Tax
        const row2Y = row1Y + 35;
        doc.fillColor('#64748b').font('Helvetica').text(`Tax / GST (${(invoice as any).taxRate}%)`, 70, row2Y);
        doc.text(formatCurrency(invoice.tax), 400, row2Y, { align: 'right', width: 125 });

        doc.moveTo(50, row2Y + 20).lineTo(545, row2Y + 20).strokeColor('#f1f5f9').stroke();

        // --- 4. TOTAL & STATUS ---
        const footerInfoY = row2Y + 60;

        // Total Box
        doc.rect(345, footerInfoY, 200, 60).fill('#f8fafc');
        doc.rect(345, footerInfoY, 200, 60).strokeColor('#e2e8f0').stroke();

        doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('TOTAL AMOUNT', 360, footerInfoY + 15);
        doc.fillColor('#1e40af').fontSize(18).text(formatCurrency(invoice.amount + invoice.tax), 360, footerInfoY + 30, { align: 'right', width: 170 });

        // Status Badge
        const isPaid = invoice.status === 'PAID';
        const badgeColor = isPaid ? '#10b981' : '#ef4444';

        doc.roundedRect(50, footerInfoY + 10, 80, 24, 4).fill(badgeColor);
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(invoice.status, 50, footerInfoY + 18, { width: 80, align: 'center' });

        // --- 5. FOOTER SECTION ---
        const pageBottom = 720;
        doc.moveTo(50, pageBottom).lineTo(545, pageBottom).strokeColor('#f1f5f9').stroke();

        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Thank you for your business!', 50, pageBottom + 20, { align: 'center', width: 495 });
        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Payment due within 7 days. For queries, email billing@editpro.studio', 50, pageBottom + 40, { align: 'center', width: 495 });
        doc.fontSize(8).text('Generated by EditPro Studio Manager', 50, 780, { align: 'center', width: 495 });

        // Table Borders (Outer)
        doc.rect(50, tableTop, 495, 120).strokeColor('#e2e8f0').lineWidth(1).stroke();

        doc.end();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { invoiceNumber, amount, tax, taxRate, projectId, status } = req.body;

    // Server-side strict numeric validation for updates
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
