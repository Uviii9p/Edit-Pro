import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
    } catch (error: any) {
        console.error('Email error:', error.message);
    }
};

export const createNotification = async (userId: string, title: string, message: string) => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
            },
        });
    } catch (error: any) {
        console.error('Notification error:', error.message);
    }
};
