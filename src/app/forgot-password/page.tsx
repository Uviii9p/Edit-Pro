'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, LockKeyhole, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpToken, setOtpToken] = useState('');
    const [resetToken, setResetToken] = useState('');
    const router = useRouter();

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // ------------------------------------------
    // STEP 1: Send OTP to email (NOT shown on screen)
    // ------------------------------------------
    const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email) return;
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await api.post('/auth/send-otp', { email });
            // Save the session token for stateless verification
            setOtpToken(res.data.otpToken);

            // OTP is sent to email via backend — NEVER displayed on frontend unless in DEV MODE
            if (res.data.devOtp) {
                setSuccess(`[DEV MODE] OTP: ${res.data.devOtp} (Sent to inbox)`);
            } else {
                setSuccess('OTP has been sent to your email. Please check your inbox.');
            }

            setResendCooldown(30);
            if (step === 1) {
                setTimeout(() => {
                    setStep(2);
                    setSuccess('');
                }, res.data.devOtp ? 5000 : 2000);
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [email, step]);

    // ------------------------------------------
    // STEP 2: Verify OTP (user types code from email)
    // ------------------------------------------
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await api.post('/auth/verify-otp', { email, otp, otpToken });
            setResetToken(res.data.resetToken);
            setSuccess(res.data.message || 'OTP verified successfully!');
            setTimeout(() => {
                setSuccess('');
                setStep(3);
            }, 1500);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------
    // STEP 3: Reset Password
    // ------------------------------------------
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters.');
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/reset-password', { email, newPassword, confirmPassword, resetToken });
            setSuccess(res.data.message || 'Password reset successfully!');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP handler
    const handleResendOtp = () => {
        if (resendCooldown > 0) return;
        setOtp('');
        handleSendOtp();
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
            <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Accent gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

                <Link href="/login" className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>

                <div className="text-center space-y-2 mt-4 mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Account Recovery
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {step === 1 && "Enter your email to receive a secure code"}
                        {step === 2 && "Check your email inbox for the 6-digit code"}
                        {step === 3 && "Create a new strong password"}
                    </p>
                </div>

                {/* Step Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`h-1 rounded-full transition-all duration-300 ${step >= 1 ? (step > 1 ? 'w-10 bg-emerald-500' : 'w-12 bg-indigo-500') : 'w-8 bg-slate-700'}`} />
                    <div className={`h-1 rounded-full transition-all duration-300 ${step >= 2 ? (step > 2 ? 'w-10 bg-emerald-500' : 'w-12 bg-indigo-500') : 'w-8 bg-slate-700'}`} />
                    <div className={`h-1 rounded-full transition-all duration-300 ${step >= 3 ? 'w-12 bg-indigo-500' : 'w-8 bg-slate-700'}`} />
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div key="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div key="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 1: Email Input */}
                {step === 1 && (
                    <motion.form key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={handleSendOtp} className="space-y-6 text-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send OTP Code'}
                        </button>
                    </motion.form>
                )}

                {/* STEP 2: OTP Verification (code from EMAIL only) */}
                {step === 2 && (
                    <motion.form key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={handleVerifyOtp} className="space-y-6 text-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 text-center block">Enter Code From Email</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    inputMode="numeric"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base tracking-[0.5em] text-center font-bold"
                                    placeholder="••••••"
                                    required
                                    autoComplete="one-time-code"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                        </button>

                        {/* Resend OTP with 30s cooldown */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 disabled:text-slate-600 transition-colors disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={14} /> Resend OTP
                            </button>
                            {resendCooldown > 0 && (
                                <span className="text-xs text-amber-500 font-bold">
                                    Resend available in {resendCooldown}s
                                </span>
                            )}
                        </div>

                        <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors">
                            Change Email Address
                        </button>
                    </motion.form>
                )}

                {/* STEP 3: Reset Password */}
                {step === 3 && (
                    <motion.form key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={handleResetPassword} className="space-y-5 text-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                            <div className="relative">
                                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
                            <div className="relative">
                                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                    placeholder="Re-enter password"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center mt-4">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Set New Password'}
                        </button>
                    </motion.form>
                )}

                <p className="text-center mt-6 text-sm text-slate-500">
                    Remember your password? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
