import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createBooking = async (req: any, res: Response) => {
    const { title, startTime, endTime } = req.body;

    try {
        // Conflict detection
        const conflict = await prisma.studioBooking.findFirst({
            where: {
                OR: [
                    {
                        startTime: { lt: new Date(endTime) },
                        endTime: { gt: new Date(startTime) },
                    },
                ],
            },
        });

        if (conflict) {
            return res.status(400).json({ message: 'Studio already booked for this time slot' });
        }

        const booking = await prisma.studioBooking.create({
            data: {
                title,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                userId: req.user.id,
            },
        });
        res.status(201).json(booking);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getBookings = async (req: any, res: Response) => {
    try {
        const bookings = await prisma.studioBooking.findMany({
            include: { user: true },
        });
        res.json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
