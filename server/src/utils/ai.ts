import axios from 'axios';
import { prisma } from '../lib/prisma';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export const callAI = async (userId: string, prompt: string) => {
    try {
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'llama3',
            prompt,
            stream: false,
        });

        const aiResponse = response.data.response;

        // Store in database
        await prisma.aIActivity.create({
            data: {
                userId,
                prompt,
                response: aiResponse,
            },
        });

        return aiResponse;
    } catch (error: any) {
        console.error('AI Error:', error.message);
        throw new Error('AI Service unavailable');
    }
};
