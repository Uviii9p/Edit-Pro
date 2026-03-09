"use client";

import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import { differenceInHours, parseISO } from 'date-fns';

export function DeadlineObserver() {
    const { notify } = useNotifications();
    const notifiedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const checkDeadlines = async () => {
            try {
                const resp = await api.get('/projects');
                const projects = resp.data;
                const now = new Date();

                projects.forEach((project: any) => {
                    if (!project.deadline) return;

                    const deadlineDate = parseISO(project.deadline);
                    const hoursLeft = differenceInHours(deadlineDate, now);

                    // If due in next 24 hours and not already notified in this session
                    if (hoursLeft > 0 && hoursLeft <= 24 && !notifiedRef.current.has(project.id)) {
                        notify(
                            '⚠️ Project Deadline Approaching',
                            `"${project.name}" is due in ${hoursLeft} hours!`,
                            'warning'
                        );
                        notifiedRef.current.add(project.id);
                    }
                });
            } catch (err) {
                console.error('Deadline check failed', err);
            }
        };

        // Check immediately and then every hour
        checkDeadlines();
        const interval = setInterval(checkDeadlines, 3600000);

        return () => clearInterval(interval);
    }, [notify]);

    return null;
}
