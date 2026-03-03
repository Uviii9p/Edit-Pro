import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { uploadFile } from '../utils/storage';

export const uploadProjectFile = async (req: any, res: Response) => {
    const { projectId } = req.body;
    const file = req.file as Express.Multer.File;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const uploaded = await uploadFile(file);
        const savedFile = await prisma.file.create({
            data: {
                name: uploaded.name,
                url: uploaded.url,
                size: uploaded.size,
                type: uploaded.type,
                projectId,
                userId: req.user.id,
            },
        });
        res.status(201).json(savedFile);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjectFiles = async (req: any, res: Response) => {
    const { projectId } = req.params;
    try {
        const files = await prisma.file.findMany({
            where: { projectId },
        });
        res.json(files);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
