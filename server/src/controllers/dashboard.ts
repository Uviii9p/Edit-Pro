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

        const revenueThisMonth = await prisma.invoice.aggregate({
            where: {
                userId,
                createdAt: { gte: startOfMonth },
                status: 'PAID',
            },
            _sum: { amount: true, tax: true },
        });

        const completedTasks = await prisma.task.count({
            where: { userId, status: 'COMPLETED' },
        });

        const totalTasks = await prisma.task.count({
            where: { userId },
        });

        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate Revenue Chart Data (Last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            return d;
        }).reverse();

        const weeklyRevenue = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            const dayRevenue = await prisma.invoice.aggregate({
                where: {
                    userId,
                    status: 'PAID',
                    createdAt: {
                        gte: date,
                        lt: nextDay,
                    },
                },
                _sum: { amount: true, tax: true },
            });

            return {
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: (dayRevenue._sum.amount || 0) + (dayRevenue._sum.tax || 0),
            };
        }));

        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const activeProjectsCount = await prisma.project.count({
            where: { ownerId: userId, status: { not: 'COMPLETED' }, archived: false },
        });

        const pendingInvoices = await prisma.invoice.aggregate({
            where: { userId, status: 'UNPAID' },
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
            revenueThisMonth: (revenueThisMonth._sum.amount || 0) + (revenueThisMonth._sum.tax || 0),
            revenueThisYear: (revenueThisYear._sum.amount || 0) + (revenueThisYear._sum.tax || 0),
            pendingRevenue: (pendingInvoices._sum.amount || 0) + (pendingInvoices._sum.tax || 0),
            taskCompletionRate,
            weeklyRevenue,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
