import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-otp';

export async function POST(req: Request) {
    try {
        const { email, newPassword, resetToken } = await req.json();

        if (!resetToken) {
            return NextResponse.json({ message: 'Unauthorized. Verification required.' }, { status: 403 });
        }

        try {
            const decoded: any = jwt.verify(resetToken, JWT_SECRET);

            if (decoded.email !== email || !decoded.verified) {
                return NextResponse.json({ message: 'Invalid session.' }, { status: 403 });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update in DB (SQLite on dev, could be anything in prod)
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });

            return NextResponse.json({ message: 'Password reset successfully! You can now log in.' });

        } catch (err) {
            return NextResponse.json({ message: 'Session expired. Please start over.' }, { status: 403 });
        }
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Error' }, { status: 500 });
    }
}
