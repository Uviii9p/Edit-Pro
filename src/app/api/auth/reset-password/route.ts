import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/constants';

export async function POST(req: Request) {
    try {
        const { email, newPassword, resetToken } = await req.json();
        console.log(`[RESET-PASSWORD] Start for: ${email}`);

        if (!resetToken) {
            console.error('[RESET-PASSWORD] No resetToken provided');
            return NextResponse.json({ message: 'Unauthorized. Verification required.' }, { status: 403 });
        }

        try {
            console.log('[RESET-PASSWORD] Verifying resetToken...');
            const decoded: any = jwt.verify(resetToken, JWT_SECRET);
            console.log(`[RESET-PASSWORD] Decoded email: ${decoded.email}, Verified: ${decoded.verified}`);

            if (decoded.email !== email || !decoded.verified) {
                console.error(`[RESET-PASSWORD] Mismatch: ${decoded.email} vs ${email}`);
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

        } catch (err: any) {
            console.error('[RESET-PASSWORD] JWT Verify Error:', err.name, err.message);
            return NextResponse.json({ message: 'Session expired. Please start over.' }, { status: 403 });
        }
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Error' }, { status: 500 });
    }
}
