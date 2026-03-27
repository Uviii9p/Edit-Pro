'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from '@/lib/utils';
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { NotificationProvider } from "@/hooks/useNotifications";
import { DeadlineObserver } from "@/components/DeadlineObserver";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalStatusBar } from "@/components/GlobalStatusBar";
import { AnimatePresence, motion } from "framer-motion";
import { PageWrapper } from "@/components/PageWrapper";
import { StudioAI } from "@/components/StudioAI";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname);

    // Close sidebar when route changes
    useEffect(() => {
        setIsSidebarOpen(false);

        // Register PWA service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW Registered:', reg.scope))
                    .catch(err => console.error('SW Failed:', err));
            });
        }
    }, [pathname]);

    return (
        <AuthProvider>
            <NotificationProvider>
                <DeadlineObserver />
                <CommandPalette />
                <GlobalStatusBar />
                <StudioAI isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
                {!isAuthPage && (
                    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-[60]">
                        <span className="font-bold text-xl tracking-tight text-blue-500">EditPro</span>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 bg-slate-800 rounded-lg text-slate-400"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                )}

                <div className="flex relative">
                    {!isAuthPage && (
                        <>
                            {/* Mobile Backdrop: Only visible on small screens when sidebar is toggled */}
                            <div className={`
                  fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] lg:hidden transition-opacity duration-300
                  ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `} onClick={() => setIsSidebarOpen(false)} />

                            {/* Sidebar Container: Fixed on mobile (slide-over), Sticky on desktop (side-by-side) */}
                            <div className={`
                  fixed lg:sticky top-0 left-0 h-screen w-64 z-[80] transition-transform duration-300
                  ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                                <Sidebar onClose={() => setIsSidebarOpen(false)} />
                            </div>
                        </>
                    )}

                    <main className={cn("flex-1 w-full min-h-screen flex flex-col relative", !isAuthPage ? 'pt-16 lg:pt-0' : '')}>
                        <div className="flex-1 w-full max-w-[1600px] mx-auto pb-20">
                            <AnimatePresence mode="wait">
                                <PageWrapper key={pathname}>
                                    {children}
                                </PageWrapper>
                            </AnimatePresence>
                        </div>
                    </main>
                </div>
            </NotificationProvider>
        </AuthProvider>
    );
}
