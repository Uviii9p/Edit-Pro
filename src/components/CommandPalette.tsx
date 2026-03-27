'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, LayoutDashboard, Briefcase, CheckSquare, 
    Calendar, CreditCard, Settings, Command, X, 
    Zap, Terminal, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CommandItem {
    id: string;
    label: string;
    icon: any;
    href?: string;
    action?: () => void;
    category: 'Navigation' | 'Actions' | 'Studio';
}

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const toggle = useCallback(() => setOpen(o => !o), []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [toggle]);

    const items: CommandItem[] = [
        { id: 'dash', label: 'Go to Dashboard', icon: LayoutDashboard, href: '/dashboard', category: 'Navigation' },
        { id: 'proj', label: 'Browse Projects', icon: Briefcase, href: '/projects', category: 'Navigation' },
        { id: 'task', label: 'Manage Tasks', icon: CheckSquare, href: '/tasks', category: 'Navigation' },
        { id: 'cal', label: 'Open Calendar', icon: Calendar, href: '/calendar', category: 'Navigation' },
        { id: 'inv', label: 'View Invoices', icon: CreditCard, href: '/invoices', category: 'Navigation' },
        { id: 'set', label: 'System Settings', icon: Settings, href: '/settings', category: 'Navigation' },
        { id: 'new-proj', label: 'Create New Project', icon: Zap, action: () => router.push('/projects/new'), category: 'Actions' },
        { id: 'sync', label: 'Force Studio Sync', icon: Cpu, action: () => alert('Syncing nodes...'), category: 'Studio' },
        { id: 'term', label: 'Open Command Center', icon: Terminal, action: () => alert('Terminal active'), category: 'Studio' },
    ];

    const filtered = items.filter(i => 
        i.label.toLowerCase().includes(search.toLowerCase()) || 
        i.category.toLowerCase().includes(search.toLowerCase())
    );

    const onSelect = (item: CommandItem) => {
        if (item.href) router.push(item.href);
        if (item.action) item.action();
        setOpen(false);
        setSearch('');
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                    />

                    {/* Window */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative z-10"
                    >
                        {/* Digital Scanline */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
                        
                        <div className="p-2 border-b border-white/5 relative z-20 flex items-center">
                            <div className="p-4 text-slate-500">
                                <Search size={22} />
                            </div>
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Execute command or search studio..."
                                className="w-full bg-transparent px-2 py-6 text-xl font-bold text-white outline-none placeholder:text-slate-600 placeholder:italic"
                            />
                            <div className="px-6 flex items-center gap-2">
                                <span className="px-2 py-1 bg-slate-800 rounded-md text-[10px] font-black text-slate-500 border border-white/5 uppercase">ESC TO CLOSE</span>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-hide relative z-20">
                            {['Navigation', 'Actions', 'Studio'].map((cat) => {
                                const catItems = filtered.filter(i => i.category === cat);
                                if (catItems.length === 0) return null;

                                return (
                                    <div key={cat} className="mb-6 last:mb-2">
                                        <h4 className="px-4 mb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{cat}</h4>
                                        <div className="space-y-1">
                                            {catItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onSelect(item)}
                                                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-blue-600/10 hover:border-blue-500/20 rounded-2xl border border-transparent transition-all group group-focus:bg-blue-600/10 group-focus:border-blue-500/20"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-blue-600/20 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                                                        <item.icon size={20} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-bold text-slate-200 group-hover:text-white">{item.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{item.category}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">
                                                        <span>SELECT</span>
                                                        <Command size={10} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {filtered.length === 0 && (
                                <div className="py-20 text-center opacity-40">
                                    <Terminal size={40} className="mx-auto mb-4 text-slate-700" />
                                    <p className="text-xl font-black text-slate-600 uppercase tracking-tighter italic">No directive found for &quot;{search}&quot;</p>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2">Check syntax or sync database</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-950/60 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-600 tracking-widest uppercase relative z-20">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5"><span className="p-1 px-2 bg-slate-800 rounded border border-white/5 text-slate-400">↑↓</span> <span>NAVIGATE</span></div>
                                <div className="flex items-center gap-1.5"><span className="p-1 px-2 bg-slate-800 rounded border border-white/5 text-slate-400">ENTER</span> <span>EXECUTE</span></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Cpu size={14} className="text-blue-500 animate-pulse" />
                                <span>SYSTEM READY</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
