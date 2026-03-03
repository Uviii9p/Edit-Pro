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

        // Helper for currency
        const formatCurrency = (val: number) => `Rs. ${new Intl.NumberFormat('en-IN').format(val)}`;

        // --- 1. HEADER SECTION ---
        doc.fillColor('#3b82f6').fontSize(24).text('EditPro Studio', 50, 50);
        doc.fillColor('#64748b').fontSize(10).text('Creative Video Production & Post-Production', 50, 80);
        doc.text('contact@editpro.studio', 50, 95);
        doc.text('Mumbai, Maharashtra, India', 50, 110);

        doc.fillColor('#0f172a').fontSize(28).text('INVOICE', 350, 50, { align: 'right' });
        doc.fontSize(10).fillColor('#64748b').text(`Invoice #: ${invoice.invoiceNumber}`, 350, 85, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, 100, { align: 'right' });

        // Divider
        doc.moveTo(50, 140).lineTo(545, 140).strokeColor('#e2e8f0').stroke();

        // --- 2. CLIENT SECTION ---
        doc.moveDown(3);
        const clientY = 160;
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, clientY);
        doc.font('Helvetica').fontSize(11).text(invoice.user?.name || 'Valued Client', 50, clientY + 20);
        doc.fillColor('#64748b').fontSize(10).text(invoice.user?.email || '', 50, clientY + 35);

        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Project Details:', 350, clientY);
        doc.font('Helvetica').fillColor('#3b82f6').text(invoice.project?.name || 'Direct Service Billing', 350, clientY + 20);

        // --- 3. STATUS BADGE ---
        const isPaid = invoice.status === 'PAID';
        const badgeColor = isPaid ? '#10b981' : '#f59e0b';
        const badgeBg = isPaid ? '#ecfdf5' : '#fffbeb';

        doc.rect(460, clientY + 45, 85, 22).fill(badgeBg);
        doc.fillColor(badgeColor).fontSize(10).font('Helvetica-Bold').text(invoice.status, 460, clientY + 52, { width: 85, align: 'center' });

        // --- 4. AMOUNT TABLE SECTION ---
        const tableTop = 260;
        doc.moveDown(4);

        // Table Header
        doc.rect(50, tableTop, 495, 30).fill('#f8fafc');
        doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('Description', 70, tableTop + 10);
        doc.text('Amount', 400, tableTop + 10, { align: 'right', width: 125 });

        // Table Rows
        const row1Y = tableTop + 45;
        doc.fillColor('#0f172a').font('Helvetica').text('Project Base Fee / Editing Services', 70, row1Y);
        doc.text(formatCurrency(invoice.amount), 400, row1Y, { align: 'right', width: 125 });

        const row2Y = row1Y + 30;
        doc.fillColor('#64748b').text(`Taxes & GST (${(invoice as any).taxRate}%)`, 70, row2Y);
        doc.text(formatCurrency(invoice.tax), 400, row2Y, { align: 'right', width: 125 });

        // Total Box
        const totalBoxY = row2Y + 40;
        doc.rect(300, totalBoxY, 245, 50).fill('#eff6ff');
        doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold').text('TOTAL DUE', 320, totalBoxY + 18);
        doc.fontSize(16).text(formatCurrency(invoice.amount + invoice.tax), 400, totalBoxY + 17, { align: 'right', width: 125 });

        // Table Borders (subtle)
        doc.rect(50, tableTop, 495, row2Y - tableTop + 25).strokeColor('#e2e8f0').stroke();

        // --- 5. FOOTER ---
        const footerY = 700;
        doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').stroke();

        doc.moveDown(2);
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Thank you for your business!', 50, footerY + 20, { align: 'center', width: 495 });
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Payment is due within 7 days of invoice issue date. Please contact us for any billing inquiries.', 50, footerY + 40, { align: 'center', width: 495 });

        doc.fillColor('#94a3b8').fontSize(8).text('Generated by EditPro Studio Manager', 50, 780, { align: 'center', width: 495 });

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
