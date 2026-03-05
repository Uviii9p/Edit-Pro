import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createProject = async (req: any, res: Response) => {
    const { name, description, budget, deadline, clientName, clientEmail, clientNotes } = req.body;

    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                budget: parseFloat(budget) || 0,
                deadline: deadline ? new Date(deadline) : null,
                clientName,
                clientEmail,
                clientNotes,
                ownerId: req.user.id,
            },
        });

        // Log Activity
        await prisma.activity.create({
            data: {
                action: 'PROJECT_CREATED',
                details: `Project "${name}" was initialized.`,
                userId: req.user.id,
                projectId: project.id
            }
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
                ownerId: req.user.id,
                archived: false
            },
            include: {
                _count: { select: { tasks: true, comments: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjectById = async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: true,
                files: true,
                milestones: true,
                revisions: true,
                comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
                activities: { orderBy: { createdAt: 'desc' }, take: 20 }
            }
        });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProject = async (req: any, res: Response) => {
    const { id } = req.params;
    const { name, description, budget, deadline, status, archived, clientName, clientEmail, clientNotes } = req.body;

    try {
        const project = await prisma.project.update({
            where: { id: id as string },
            data: {
                name,
                description,
                budget: budget !== undefined ? parseFloat(budget) : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                status,
                archived,
                clientName,
                clientEmail,
                clientNotes
            },
        });

        // Log Activity if status changed
        if (status) {
            await prisma.activity.create({
                data: {
                    action: 'STATUS_UPDATED',
                    details: `Project status moved to ${status}`,
                    userId: req.user.id,
                    projectId: project.id
                }
            });
        }

        res.json(project);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addComment = async (req: any, res: Response) => {
    const { id } = req.params;
    const { content, taskId } = req.body;

    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                userId: req.user.id,
                projectId: id,
                taskId: taskId || null
            }
        });

        // Activity log
        await prisma.activity.create({
            data: {
                action: 'COMMENT_ADDED',
                details: `New message in ${taskId ? 'task' : 'project'} team chat.`,
                userId: req.user.id,
                projectId: id
            }
        });

        res.status(201).json(comment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addMilestone = async (req: any, res: Response) => {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    try {
        const milestone = await prisma.milestone.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: id
            }
        });

        await prisma.activity.create({
            data: {
                action: 'MILESTONE_CREATED',
                details: `Milestone "${title}" added to production roadmap.`,
                userId: req.user.id,
                projectId: id
            }
        });

        res.status(201).json(milestone);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
