'use client';

import { useState, useRef, useEffect } from 'react';
import { 
    Send, Sparkles, Cpu, X, 
    Terminal, Zap, Bot, User,
    MessageSquare, Command, BotOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const StudioAI = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Studio Node online. How can I assist with your production today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Response
        setTimeout(() => {
            const responses = [
                "Analyzing production timelines... everything looks optimal.",
                "I've synchronized the latest task directives across all studio nodes.",
                "Directing system resources to current priority projects.",
                "Studio latency is currently at 4ms. Perfect for high-fidelity exports.",
                "Would you like me to generate a production summary for your current projects?"
            ];
            const aiMsg = { 
                role: 'assistant', 
                content: responses[Math.floor(Math.random() * responses.length)] 
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-end p-4 md:p-10 pointer-events-none">
                    {/* Backdrop for mobile */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm md:hidden pointer-events-auto"
                    />

                    <motion.div
                        initial={{ x: 400, opacity: 0, scale: 0.95 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: 400, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-full max-w-lg h-[80vh] bg-slate-900/90 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto relative ring-1 ring-white/10"
                    >
                        {/* Digital Scanline Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-50 opacity-10" />

                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                                    <Cpu size={24} className="text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">Studio Assistant</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Sync Stable</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={i}
                                    className={cn(
                                        "flex gap-4 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                        msg.role === 'user' ? "bg-slate-800" : "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                                    )}>
                                        {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                    </div>
                                    <div className={cn(
                                        "p-5 rounded-3xl text-sm font-bold leading-relaxed shadow-2xl",
                                        msg.role === 'user' 
                                            ? "bg-slate-800 text-slate-200 rounded-tr-none" 
                                            : "glass-panel text-slate-100 rounded-tl-none border-white/5"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-4 mr-auto max-w-[85%]">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20 text-blue-400">
                                        <Bot size={18} />
                                    </div>
                                    <div className="glass-panel p-5 rounded-[24px] rounded-tl-none flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="p-8 bg-slate-950/40 border-t border-white/5">
                            <div className="relative flex items-center group">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Issue studio directive..."
                                    className="w-full bg-slate-800/50 border border-white/5 p-5 pl-8 pr-20 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all placeholder:text-slate-600"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-3 p-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-900/40 transition-all active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-6 opacity-30">
                                <div className="flex items-center gap-1.5">
                                    <Zap size={10} className="text-blue-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Neural Engine v4.2</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Command size={10} className="text-slate-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Voice Sync Active</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
