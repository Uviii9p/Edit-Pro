import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createMeeting = async (req: any, res: Response) => {
    const { title, description, startTime, endTime, type, isRecurring } = req.body;

    try {
        // Conflict detection logic
        const conflict = await prisma.meeting.findFirst({
            where: {
                userId: req.user.id,
                OR: [
                    {
                        startTime: { lt: new Date(endTime) },
                        endTime: { gt: new Date(startTime) },
                    },
                ],
            },
        });

        if (conflict) {
            return res.status(400).json({ message: 'Meeting conflict detected' });
        }

        const meeting = await prisma.meeting.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type,
                isRecurring,
                userId: req.user.id,
            },
        });
        res.status(201).json(meeting);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMeetings = async (req: any, res: Response) => {
    try {
        const meetings = await prisma.meeting.findMany({
            where: { userId: req.user.id },
        });
        res.json(meetings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMeeting = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, startTime, endTime, type, isRecurring } = req.body;

    try {
        const meeting = await prisma.meeting.update({
            where: { id: id as string },
            data: {
                title,
                description,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                type,
                isRecurring,
            },
        });
        res.json(meeting);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMeeting = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.meeting.delete({ where: { id: id as string } });
        res.json({ message: 'Meeting deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
