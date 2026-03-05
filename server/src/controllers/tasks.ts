import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createTask = async (req: any, res: Response) => {
    const { title, description, priority, deadline, projectId } = req.body;

    try {
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                deadline: deadline ? new Date(deadline) : null,
                projectId: projectId || null,
                userId: req.user.id,
            },
        });
        res.status(201).json(task);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getTasks = async (req: any, res: Response) => {
    const { projectId } = req.query;

    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: req.user.id,
                projectId: projectId ? String(projectId) : undefined,
            },
            include: {
                project: true,
                timeLogs: {
                    where: { endTime: null },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, priority, status, deadline, projectId } = req.body;

    try {
        const task = await prisma.task.update({
            where: { id: id as string },
            data: {
                title,
                description,
                priority,
                status,
                deadline: deadline ? new Date(deadline) : undefined,
                projectId: projectId || null,
            },
        });
        res.json(task);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.task.delete({ where: { id: id as string } });
        res.json({ message: 'Task deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const startTimeTrack = async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        const timeLog = await prisma.timeLog.create({
            data: {
                taskId: id,
                userId: req.user.id,
                startTime: new Date(),
            }
        });
        res.status(201).json(timeLog);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const stopTimeTrack = async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        const activeLog = await prisma.timeLog.findFirst({
            where: {
                taskId: id,
                userId: req.user.id,
                endTime: null
            },
            orderBy: { startTime: 'desc' }
        });

        if (!activeLog) return res.status(404).json({ message: 'No active timer found' });

        const updated = await prisma.timeLog.update({
            where: { id: activeLog.id },
            data: { endTime: new Date() }
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
