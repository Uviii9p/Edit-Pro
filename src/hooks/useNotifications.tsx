"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
    notify: (title: string, message: string, type?: Notification['type']) => void;
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Notification[]>([]);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
        }
    };

    const notify = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);

        // 1. Add to DOM Toasts
        setToasts((prev) => [...prev, { id, title, message, type }]);

        // 2. Browser Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico', // Default icon
            });
        }

        // Auto remove toast
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    return (
        <NotificationContext.Provider value={{ notify, permission, requestPermission }}>
            {children}

            {/* Toast Overlay */}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 max-w-sm w-[350px] pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, x: 20, y: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 50, transition: { duration: 0.2 } }}
                            className="group pointer-events-auto relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-slate-900/60 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
                        >
                            {/* Ambient Glow Background - Vivid Colors */}
                            <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full blur-[45px] opacity-25 transition-colors duration-500 ${toast.type === 'success' ? 'bg-emerald-500' :
                                    toast.type === 'warning' ? 'bg-amber-500' :
                                        toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                                }`} />

                            <div className="flex items-start gap-4 relative z-10">
                                {/* Premium Icon Container */}
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border transition-all duration-300 ${toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:bg-emerald-500/20' :
                                        toast.type === 'warning' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:bg-amber-500/20' :
                                            toast.type === 'error' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] group-hover:bg-rose-500/20' :
                                                'border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:bg-blue-500/20'
                                    }`}>
                                    {toast.type === 'success' ? <CheckCircle size={22} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> :
                                        toast.type === 'warning' ? <AlertTriangle size={22} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> :
                                            toast.type === 'error' ? <AlertTriangle size={22} className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> :
                                                <Bell size={22} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                </div>

                                {/* Content Layer */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <h4 className="text-[14px] font-black text-white tracking-tight leading-tight mb-1 uppercase opacity-90">{toast.title}</h4>
                                    <p className="text-[12px] font-bold text-slate-300/80 leading-snug line-clamp-2">{toast.message}</p>
                                </div>

                                {/* Soft Close Button */}
                                <button
                                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                    className="mt-1 rounded-full p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* High-Fidelity Progress Bar */}
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-800/40">
                                <motion.div
                                    initial={{ scaleX: 1 }}
                                    animate={{ scaleX: 0 }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className={`h-full w-full origin-left bg-gradient-to-r ${toast.type === 'success' ? 'from-emerald-500 to-emerald-300' :
                                            toast.type === 'warning' ? 'from-amber-500 to-orange-400' :
                                                toast.type === 'error' ? 'from-rose-600 to-rose-400' : 'from-blue-600 to-indigo-400'
                                        } shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
