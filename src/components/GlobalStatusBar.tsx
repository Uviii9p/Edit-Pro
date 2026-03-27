'use client';

import { useState, useEffect } from 'react';
import { 
    Cpu, Wifi, Lock, Zap, 
    Monitor, Globe, Clock, Command
} from 'lucide-react';
import { motion } from 'framer-motion';

export const GlobalStatusBar = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-slate-950/20 backdrop-blur-3xl border-t border-white/5 z-[100] hidden lg:flex items-center justify-between px-6 pointer-events-none select-none">
            {/* Left Section: System Status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Studio Nodes Sync: 100%</span>
                </div>
                <div className="flex items-center gap-2">
                    <Wifi size={12} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frequency: 5.2 GHz</span>
                </div>
                <div className="flex items-center gap-4 border-l border-white/5 pl-6">
                    <div className="flex items-center gap-1.5">
                        <Cpu size={12} className="text-slate-600" />
                        <span className="text-[9px] font-mono text-slate-600 tracking-tighter">RENDER: 12%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Monitor size={12} className="text-slate-600" />
                        <span className="text-[9px] font-mono text-slate-600 tracking-tighter">GPU: NORMAL</span>
                    </div>
                </div>
            </div>

            {/* Center Section: Command Prompt Placeholder */}
            <div className="flex items-center gap-3 opacity-30 group cursor-pointer hover:opacity-100 transition-opacity pointer-events-auto">
                <Command size={14} className="text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Press</span>
                <span className="p-1 px-1.5 bg-slate-800 rounded border border-white/5 text-slate-400 font-black text-[10px]">⌘K</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">for Quick Directives</span>
            </div>

            {/* Right Section: Time & Auth Status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Lock size={12} className="text-slate-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">AES-256 ENCRYPTED</span>
                </div>
                <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-[11px] font-mono text-blue-400 font-black tracking-tighter leading-none">
                            {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                    <div className="px-2 py-0.5 bg-blue-600/10 rounded-md border border-blue-500/20">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">IST</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
