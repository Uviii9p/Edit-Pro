'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, LockKeyhole, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await api.post('/auth/send-otp', { email });
            setSuccess(res.data.message || 'OTP Sent successfully!');
            // Auto-fill the OTP if demo mode returns it
            if (res.data.demoOtp) {
                setOtp(res.data.demoOtp);
            }
            setTimeout(() => {
                setStep(2);
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            setSuccess(res.data.message || 'OTP Verified!');
            setTimeout(() => {
                setSuccess('');
                setStep(3);
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/reset-password', { email, newPassword, confirmPassword });
            setSuccess(res.data.message || 'Password reset successfully!');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
            <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
                <Link href="/login" className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>

                <div className="text-center space-y-2 mt-4 mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Account Recovery
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {step === 1 && "Enter your email to receive a secure code"}
                        {step === 2 && "Enter the 6-digit code sent to your email"}
                        {step === 3 && "Create a new strong password"}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {/* Error / Success Alerts */}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> {success}
                        </motion.div>
                    )}

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

                    {step === 2 && (
                        <motion.form key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={handleVerifyOtp} className="space-y-6 text-slate-100">
                            <div className="space-y-2 text-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Secure Code</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base tracking-[0.5em] text-center font-bold"
                                        placeholder="••••••"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors">
                                Change Email Address
                            </button>
                        </motion.form>
                    )}

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
                                        placeholder="•••••••••"
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
                                        placeholder="•••••••••"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center mt-4">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Set New Password'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
