'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

import { Metadata } from 'next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EditPro',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthPage = ['/login', '/register'].includes(pathname);

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden`}>
        <AuthProvider>
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
                  <Sidebar />
                </div>
              </>
            )}

            <main className={`flex-1 w-full min-h-screen flex flex-col ${!isAuthPage ? 'pt-16 lg:pt-0' : ''}`}>
              <div className="flex-1 w-full max-w-[1600px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
