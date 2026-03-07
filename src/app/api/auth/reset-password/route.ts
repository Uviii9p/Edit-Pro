import { NextResponse } from 'next/server';
import otps from '@/lib/otp-store';

export async function POST(req: Request) {
    try {
        const { email, newPassword } = await req.json();
        const record = otps[email];

        if (!record || !record.verified) {
            return NextResponse.json({ message: 'OTP not verified.' }, { status: 403 });
        }

        // Clean up
        delete otps[email];

        return NextResponse.json({ message: 'Password reset successfully!' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
