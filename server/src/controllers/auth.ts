import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';

const otps: Record<string, { otp: string, expiresAt: number, attempts: number, lastSent: number, verified: boolean }> = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

export const sendOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User with this email not found.' });

        const now = Date.now();
        const record = otps[email];

        if (record && now - record.lastSent < 30000) {
            return res.status(429).json({ message: 'Please wait 30 seconds before requesting another OTP.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otps[email] = {
            otp,
            expiresAt: now + 5 * 60 * 1000,
            attempts: 0,
            lastSent: now,
            verified: false
        };

        const mailOptions = {
            from: `"EditPro Studio" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'EditPro Password Reset OTP',
            html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 16px; color: #e2e8f0;">
                    <h1 style="font-size: 24px; font-weight: 800; color: #818cf8; margin: 0 0 8px 0;">EditPro Studio</h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px 0;">Password Recovery Request</p>
                    <hr style="border: none; border-top: 1px solid #1e293b; margin: 0 0 24px 0;">
                    <p style="margin: 0 0 16px 0; line-height: 1.6;">Hello,</p>
                    <p style="margin: 0 0 24px 0; line-height: 1.6;">Your password reset OTP is:</p>
                    <div style="text-align: center; background: #1e293b; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
                        <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #818cf8;">${otp}</span>
                    </div>
                    <p style="margin: 0 0 8px 0; color: #f59e0b; font-size: 13px; font-weight: 600;">⏱ This code will expire in 5 minutes.</p>
                    <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">If you did not request this reset, please ignore this email. Your account remains secure.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP securely dispatched to your email address.' });
    } catch (err: any) {
        console.error("[AUTH] Nodemailer Error:", err);
        res.status(500).json({ message: 'Failed to send OTP email.' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email & OTP are required.' });

    const record = otps[email];
    if (!record) return res.status(400).json({ message: 'No OTP currently requested for this email.' });

    if (Date.now() > record.expiresAt) {
        delete otps[email];
        return res.status(400).json({ message: 'Your OTP has expired.' });
    }

    if (record.attempts >= 3) {
        delete otps[email];
        return res.status(429).json({ message: 'Maximum failure attempts reached.' });
    }

    if (record.otp !== otp) {
        record.attempts += 1;
        return res.status(400).json({ message: `Invalid OTP code. ${3 - record.attempts} attempts remaining.` });
    }

    record.verified = true;
    res.json({ message: 'OTP verified successfully! You can reset your password.' });
};

export const resetPassword = async (req: Request, res: Response) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Complete form parameters are required.' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const record = otps[email];
    if (!record || !record.verified) {
        return res.status(403).json({ message: 'OTP unverified. Verify an OTP first.' });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        delete otps[email];
        res.json({ message: 'Password has been safely reset.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
