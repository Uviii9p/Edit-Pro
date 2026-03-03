import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendEmail } from './notifications';

export const setupCronJobs = () => {
    // Daily summary at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily summary cron job');
        const users = await prisma.user.findMany();

        for (const user of users) {
            const todayTasks = await prisma.task.findMany({
                where: {
                    userId: user.id,
                    deadline: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            });

            if (todayTasks.length > 0) {
                const taskTitles = todayTasks.map(t => `- ${t.title}`).join('\n');
                await sendEmail(
                    user.email,
                    'Your Daily Task Summary',
                    `Good morning, ${user.name}!\n\nHere are your tasks for today:\n${taskTitles}\n\nHave a productive day!`
                );
            }
        }
    });
};
