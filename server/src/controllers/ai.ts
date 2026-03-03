import { Request, Response } from 'express';
import { callAI } from '../utils/ai';

export const generateSchedule = async (req: any, res: Response) => {
    const { projectTasks } = req.body;
    const prompt = `Generate a realistic editing schedule for these tasks: ${JSON.stringify(projectTasks)}`;
    try {
        const response = await callAI(req.user.id, prompt);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const suggestTaskBreakdown = async (req: any, res: Response) => {
    const { projectGoal } = req.body;
    const prompt = `Break down this video editing project goal into actionable tasks: ${projectGoal}`;
    try {
        const response = await callAI(req.user.id, prompt);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const generateVideoMeta = async (req: any, res: Response) => {
    const { contentDescription } = req.body;
    const prompt = `Generate a viral video title and description for this content: ${contentDescription}`;
    try {
        const response = await callAI(req.user.id, prompt);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const suggestReply = async (req: any, res: Response) => {
    const { clientMessage } = req.body;
    const prompt = `Suggest a professional reply to this client message: ${clientMessage}`;
    try {
        const response = await callAI(req.user.id, prompt);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
