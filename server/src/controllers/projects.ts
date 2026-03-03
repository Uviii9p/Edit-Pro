import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createProject = async (req: any, res: Response) => {
    const { name, description, budget, deadline } = req.body;

    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                budget: parseFloat(budget),
                deadline: deadline ? new Date(deadline) : null,
                ownerId: req.user.id,
            },
        });
        res.status(201).json(project);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjects = async (req: any, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: req.user.id },
                    { teamMembers: { some: { id: req.user.id } } }
                ]
            },
            include: { owner: true, teamMembers: true },
        });
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, budget, deadline, status, archived } = req.body;

    try {
        const project = await prisma.project.update({
            where: { id: id as string },
            data: {
                name,
                description,
                budget: budget ? parseFloat(budget) : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                status,
                archived,
            },
        });
        res.json(project);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
