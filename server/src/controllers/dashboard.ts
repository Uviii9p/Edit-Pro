import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardData = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayTasks = await prisma.task.findMany({
            where: {
                userId,
                deadline: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        const upcomingMeetings = await prisma.meeting.findMany({
            where: {
                userId,
                startTime: { gte: new Date() },
            },
            take: 5,
            orderBy: { startTime: 'asc' },
        });

        const studioBookings = await prisma.studioBooking.findMany({
            where: {
                startTime: { gte: new Date() },
            },
            take: 5,
            orderBy: { startTime: 'asc' },
        });

        const completedTasks = await prisma.task.count({
            where: { userId, status: 'COMPLETED' },
        });

        const totalTasks = await prisma.task.count({
            where: { userId },
        });

        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const invoices = await prisma.invoice.findMany({
            where: { userId },
            include: { project: true }
        });

        const totalPaid = invoices
            .filter(i => i.status === 'PAID')
            .reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0);

        const pendingRevenue = invoices
            .filter(i => i.status !== 'PAID')
            .reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0);

        const revenueThisMonth = invoices
            .filter(i => i.status === 'PAID' && new Date(i.paymentDate || i.createdAt) >= startOfMonth)
            .reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0);

        const activeProjectsCount = await prisma.project.count({
            where: { ownerId: userId, status: { not: 'COMPLETED' }, archived: false },
        });

        // Calculate Weekly Revenue (Last 4 Weeks)
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

        // Calculate Monthly Revenue (Last 6 months)
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

        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const pendingInvoices = await prisma.invoice.aggregate({
            where: { userId, status: { not: 'PAID' } },
            _sum: { amount: true, tax: true },
        });

        const revenueThisYear = await prisma.invoice.aggregate({
            where: {
                userId,
                createdAt: { gte: startOfYear },
                status: 'PAID',
            },
            _sum: { amount: true, tax: true },
        });

        res.json({
            todayTasks,
            upcomingMeetings,
            studioBookings,
            activeProjectsCount,
            revenueThisMonth,
            revenueThisYear: (revenueThisYear._sum.amount || 0) + (revenueThisYear._sum.tax || 0),
            pendingRevenue,
            taskCompletionRate,
            weeklyRevenue,
            monthlyRevenue
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
