import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;

    try {
        console.log(`[AUTH] Registering user: ${email}`);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.log(`[AUTH] Registration failed: User ${email} already exists`);
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'EDITOR',
            },
        });

        console.log(`[AUTH] User registered successfully: ${user.id}`);
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (error: any) {
        console.error('[AUTH] Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log(`[AUTH] Login attempt for: ${email}`);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`[AUTH] Login failed: User not found - ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[AUTH] Login failed: Password mismatch for - ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log(`[AUTH] Login successful: ${user.id}`);
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.json({ user, token });
    } catch (error: any) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, role: true, image: true },
        });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req: any, res: Response) => {
    const { name } = req.body;
    const userId = req.user.id;
    let imageUrl = undefined;

    try {
        if (req.file) {
            const { uploadFile } = await import('../utils/storage');
            const uploadResult = await uploadFile(req.file, 'avatars');
            imageUrl = uploadResult.url;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                image: imageUrl,
            },
            select: { id: true, email: true, name: true, role: true, image: true },
        });

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req: any, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
