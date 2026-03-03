'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('EDITOR');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', { email, password, name, role });
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
            <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        Join EditPro
                    </h1>
                    <p className="text-slate-400 text-sm">Create your professional studio workspace</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base text-white"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base text-white"
                            placeholder="name@company.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base text-white"
                            placeholder="Minimum 8 characters"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Studio Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-3.5 bg-slate-800 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-base text-white appearance-none"
                        >
                            <option value="EDITOR">Professional Editor</option>
                            <option value="ADMIN">Studio Admin</option>
                            <option value="CLIENT">Client Partner</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 text-white"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Create Account'}
                    </button>
                </form>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Already a member?</span></div>
                </div>

                <p className="text-center text-sm text-slate-400">
                    <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                        Sign in to your account
                    </Link>
                </p>
            </div>
        </div>
    );
}
