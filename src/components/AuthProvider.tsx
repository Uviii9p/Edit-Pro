'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { fetchProfile, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else if (pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password') {
            router.push('/login');
        }
    }, [fetchProfile, pathname, router]);

    return <>{children}</>;
};
