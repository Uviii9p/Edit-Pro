'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, CheckSquare,
    Calendar, CreditCard, Settings, LogOut, Video
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: Briefcase },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/invoices', label: 'Invoices', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    if (['/login', '/register'].includes(pathname)) return null;

    return (
        <aside className="h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-6 space-y-8">
            <div className="flex items-center gap-3 px-2">
                <Video className="text-blue-500" size={32} />
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    EditPro
                </h2>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all group",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                            <span className="font-semibold">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={logout}
                className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-all"
            >
                <LogOut size={20} />
                <span className="font-semibold">Sign Out</span>
            </button>
        </aside>
    );
};
