import { NextResponse } from 'next/server';
import otps from '@/lib/otp-store';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();
        const record = otps[email];

        if (!record) return NextResponse.json({ message: 'No OTP requested for this email.' }, { status: 400 });
        if (Date.now() > record.expiresAt) return NextResponse.json({ message: 'OTP has expired.' }, { status: 400 });
        if (record.attempts >= 3) return NextResponse.json({ message: 'Max attempts exceeded.' }, { status: 429 });

        if (record.otp !== otp) {
            record.attempts += 1;
            return NextResponse.json({ message: 'Invalid OTP code.' }, { status: 400 });
        }

        record.verified = true;
        return NextResponse.json({ message: 'OTP verified successfully.' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
