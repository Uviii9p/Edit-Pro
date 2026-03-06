'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, CheckSquare,
    Calendar, CreditCard, Settings, LogOut, Video, Wallet, X
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: Briefcase },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/invoices', label: 'Invoices', icon: CreditCard },
    { href: '/payments', label: 'Payments', icon: Wallet },
    { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    if (['/login', '/register'].includes(pathname)) return null;

    return (
        <aside className="h-full w-64 glass-panel border-r border-slate-800/50 flex flex-col p-6 space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Video className="text-white" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gradient">
                        EditPro
                    </h2>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 space-y-1.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-slate-800/60 text-white shadow-sm"
                                    : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
                            )}
                            onClick={() => onClose?.()}
                        >
                            {isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-accent-gradient rounded-full" />
                            )}
                            <item.icon
                                size={18}
                                className={cn(
                                    isActive
                                        ? "text-blue-400"
                                        : "text-slate-500 group-hover:text-blue-400"
                                )}
                            />
                            <span className="font-medium text-sm tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-slate-800/50">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};
