'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, CheckSquare,
    Calendar, CreditCard, Settings, LogOut, Video, Wallet, X, Cpu
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Studio' },
    { href: '/projects', label: 'Projects', icon: Briefcase, group: 'Studio' },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare, group: 'Studio' },
    { href: '/calendar', label: 'Calendar', icon: Calendar, group: 'Studio' },
    { href: '/invoices', label: 'Invoices', icon: CreditCard, group: 'Systems' },
    { href: '/payments', label: 'Payments', icon: Wallet, group: 'Systems' },
    { href: '/settings', label: 'Settings', icon: Settings, group: 'Systems' },
];

interface SidebarProps {
    onClose?: () => void;
    onToggleAI?: () => void;
}

export const Sidebar = ({ onClose, onToggleAI }: SidebarProps) => {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    if (['/login', '/register', '/forgot-password'].includes(pathname)) return null;

    return (
        <aside className="h-full w-64 glass-panel border-r border-white/5 flex flex-col p-6 space-y-8 relative overflow-hidden">
            {/* Logo Section */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 bg-accent-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        <Video className="text-white" size={24} />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-gradient leading-none">EditPro</h2>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1 italic">Studio Studio</span>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                )}
            </div>

            {/* Nav Section */}
            <nav className="flex-1 overflow-y-auto scrollbar-hide">
                {['Studio', 'Systems'].map(group => (
                    <div key={group} className="mb-8">
                        <h3 className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2">
                             <span>{group}</span>
                             <div className="flex-1 h-px bg-white/5" />
                        </h3>
                        <div className="space-y-1">
                            {navItems.filter(i => i.group === group).map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                            isActive
                                                ? "bg-blue-600/10 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/10"
                                                : "text-slate-400 hover:bg-slate-800/20 hover:text-white border border-transparent"
                                        )}
                                        onClick={() => onClose?.()}
                                    >
                                        <item.icon
                                            size={18}
                                            className={cn(
                                                isActive
                                                    ? "text-blue-400"
                                                    : "text-slate-500 group-hover:text-blue-400 transition-colors"
                                            )}
                                        />
                                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                        {isActive && (
                                            <div className="absolute right-3 w-1 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Section */}
            <div className="pt-6 border-t border-white/5 space-y-4">
                {/* AI Assistant Hook */}
                <div 
                    onClick={onToggleAI}
                    className="p-4 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl border border-blue-500/10 flex items-center gap-3 group cursor-pointer hover:border-blue-500/30 transition-all active:scale-95 shadow-lg hover:shadow-blue-900/10"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:scale-110 transition-transform">
                        <Cpu size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Studio Assistant</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">AI Ready</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/5 hover:text-red-400 transition-all duration-300 group font-bold"
                >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};
