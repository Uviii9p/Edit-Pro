"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Settings, Send, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface Toast {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
}

export default function NotificationsPage() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [title, setTitle] = useState('New Update');
    const [message, setMessage] = useState('Your notification system is ready!');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            addToast('System Error', 'Notifications not supported by this browser.', 'warning');
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            addToast('Success!', 'Notification permission granted.', 'success');
            new Notification('Notifications Enabled', {
                body: 'You will now receive alerts on your device.',
                icon: '/notification-icon.png'
            });
        }
    };

    const addToast = (title: string, message: string, type: Toast['type'] = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, title, message, type }]);

        // Auto remove toast
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const sendDeviceNotification = () => {
        if (permission !== 'granted') {
            requestPermission();
            return;
        }

        // DOM Interaction + Device Notification
        addToast(title, message, 'info');

        new Notification(title, {
            body: message,
            icon: '/notification-icon.png',
            badge: '/notification-icon.png',
            tag: 'demo-notification',
        });
    };

    return (
        <div className="min-h-screen p-8 bg-[#020617] text-white">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient mb-2">Notification Center</h1>
                        <p className="text-slate-400 text-lg">System-wide alerts and device integration</p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-3 rounded-2xl glass-card"
                    >
                        {permission === 'granted' ? <BellRing className="text-blue-400 w-8 h-8" /> : <Bell className="text-slate-500 w-8 h-8" />}
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Controls Panel */}
                    <section className="glass-panel p-8 rounded-3xl space-y-8">
                        <div className="flex items-center gap-3">
                            <Settings className="text-blue-400" />
                            <h2 className="text-xl font-semibold">Configuration</h2>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm text-slate-400 mb-1 italic">Status</label>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                                <span className="text-sm font-medium">Browser Authorization</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${permission === 'granted' ? 'bg-emerald-500/20 text-emerald-400' :
                                    permission === 'denied' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                                    }`}>
                                    {permission}
                                </span>
                            </div>

                            {permission !== 'granted' && (
                                <button
                                    onClick={requestPermission}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20"
                                >
                                    Request Device Permission
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 pt-6">
                            <label className="block text-sm text-slate-400 italic">Composer</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Notification Title"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 focus:border-blue-500 focus:bg-slate-900 transition-all text-white placeholder:text-slate-600"
                            />
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Message content..."
                                rows={3}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 focus:border-blue-500 focus:bg-slate-900 transition-all text-white placeholder:text-slate-600"
                            />
                            <button
                                onClick={sendDeviceNotification}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-accent-gradient rounded-2xl font-bold text-white shadow-xl shadow-blue-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Send size={18} />
                                Trigger Device Notification
                            </button>
                        </div>
                    </section>

                    {/* Explanation Panel */}
                    <section className="space-y-6">
                        <div className="glass-card p-6 rounded-2xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Info size={18} className="text-blue-400" />
                                How it works
                            </h3>
                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    <span><strong>DOM Orchestration:</strong> The app creates UI elements in the current web page to show immediate feedback.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    <span><strong>System Integration:</strong> Using the <code>Notification</code> API, the browser communicates with the OS (Windows macOS, Android) to show native alerts.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    <span><strong>Background Processing:</strong> Even if the user switches tabs, system notifications will still appear if the page is open.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-blue-500">
                            <p className="text-sm italic text-slate-400">
                                "Modern applications bridge the gap between web experiences and native device feel. This implementation ensures your users stay engaged regardless of where they are."
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Toast Overlay */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 max-w-sm w-full">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 100 }}
                            className="glass-panel p-5 rounded-2xl flex items-start gap-4 shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
                                {toast.type === 'success' ? <CheckCircle className="text-emerald-400 w-5 h-5" /> :
                                    toast.type === 'warning' ? <AlertTriangle className="text-amber-400 w-5 h-5" /> :
                                        <Bell className="text-blue-400 w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{toast.title}</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-slate-500 hover:text-white transition-colors p-1"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
