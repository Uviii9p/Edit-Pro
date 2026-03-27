'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * DEFINITIVE LOCAL-FIRST MOCK API v4
 * Implements a unified data model with relational-like synchronization.
 * Supports cross-module consistency (Tasks, Milestones, Comments).
 */

const STORAGE_KEYS = {
    AUTH: 'editpro_auth',
    USER: 'editpro_user',
    PROJECTS: 'editpro_projects',
    TASKS: 'editpro_tasks',
    MILESTONES: 'editpro_milestones',
    COMMENTS: 'editpro_comments',
    ACTIVITIES: 'editpro_activities',
    CLIENTS: 'editpro_clients',
    EQUIPMENT: 'editpro_equipment',
    INVOICES: 'editpro_invoices',
    NOTIFICATIONS: 'editpro_notifications',
    DELIVERIES: 'editpro_deliveries',
    TIMER_LOGS: 'editpro_timer_logs',
    FILES: 'editpro_files',
    CALENDAR_EVENTS: 'editpro_calendar_events',
    STUDIO_BOOKINGS: 'editpro_studio_bookings',
    BUSINESS_DETAILS: 'editpro_editor_details',
    MEMBERSHIPS: 'editpro_memberships'
};

const getFromStorage = (key: string, defaultVal: any = []) => {
    if (typeof window === 'undefined') return defaultVal;
    try {
        const data = localStorage.getItem(key);
        if (!data || data === 'undefined' || data === 'null') return defaultVal;
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : defaultVal;
    } catch (e) {
        console.warn(`[STORAGE] Error parsing key "${key}":`, e);
        return defaultVal;
    }
};

const setToStorage = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
};

const getCurrentUser = (): any => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        return JSON.parse(raw);
    } catch { return null; }
};

const getUserProjectIds = (userId: string): Set<string> => {
    const memberships = getFromStorage(STORAGE_KEYS.MEMBERSHIPS, []);
    const memberProjectIds = memberships
        .filter((m: any) => m.userId === userId)
        .map((m: any) => m.projectId);
    return new Set(memberProjectIds);
};

const logActivity = (projectId: string, action: string, details: string) => {
    const user = getCurrentUser();
    const activities = getFromStorage(STORAGE_KEYS.ACTIVITIES, []);
    activities.unshift({
        id: Math.random().toString(36).substr(2, 9),
        projectId,
        userId: user?.id,
        action,
        details,
        createdAt: new Date().toISOString()
    });
    setToStorage(STORAGE_KEYS.ACTIVITIES, activities.slice(0, 100)); // Keep last 100
};

const api = {
    auth: {
        login: async (email: string, password: string) => {
            const users = getFromStorage(STORAGE_KEYS.AUTH, []);
            const user = users.find((u: any) => u.email === email && u.password === password);
            if (user) {
                const { password: _, ...safeUser } = user;
                const token = `mock_jwt_${Date.now()}`;
                localStorage.setItem('token', token);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
                return { data: { user: safeUser, token } };
            }
            throw { response: { status: 401, data: { message: 'Invalid credentials' } } };
        },
        register: async (userData: any) => {
            const users = getFromStorage(STORAGE_KEYS.AUTH, []);
            if (users.find((u: any) => u.email === userData.email)) {
                throw { response: { status: 400, data: { message: 'Identity already initialized' } } };
            }
            const newUser = {
                ...userData,
                id: Math.random().toString(36).substr(2, 9),
                role: userData.role || 'EDITOR'
            };
            users.push(newUser);
            setToStorage(STORAGE_KEYS.AUTH, users);
            const { password: _, ...safeUser } = newUser;
            const token = `mock_jwt_${Date.now()}`;
            localStorage.setItem('token', token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
            return { data: { user: safeUser, token } };
        }
    },

    get: async (endpoint: string, _config?: any) => {
        await new Promise(r => setTimeout(r, 50));
        const user = getCurrentUser();

        if (endpoint === '/auth/profile') {
            if (!user) throw { response: { status: 401 } };
            return { data: user };
        }

        // Sub-resource GET (Members)
        if (endpoint.match(/^\/projects\/(.+)\/members$/)) {
            const projectId = endpoint.split('/')[2];
            const projects = getFromStorage(STORAGE_KEYS.PROJECTS, []);
            const project = projects.find((p: any) => p.id === projectId);
            if (!project) throw { response: { status: 404 } };
            const members = [{ id: project.ownerId, name: project.ownerName || 'Project Owner', role: 'OWNER', joinedAt: project.createdAt }];
            const memberships = getFromStorage(STORAGE_KEYS.MEMBERSHIPS, []);
            memberships.filter((m: any) => m.projectId === projectId).forEach((m: any) => {
                if (!members.find(x => x.id === m.userId)) {
                    members.push({ id: m.userId, name: m.userName || 'Member', role: 'MEMBER', joinedAt: m.joinedAt });
                }
            });
            return { data: members };
        }

        // Dashboard Analytics
        if (endpoint === '/dashboard') {
            const accessibleProjectIds = getUserProjectIds(user?.id);
            const projects = getFromStorage(STORAGE_KEYS.PROJECTS).filter((p: any) => p.ownerId === user?.id || accessibleProjectIds.has(p.id));
            const invoices = getFromStorage(STORAGE_KEYS.INVOICES).filter((inv: any) => inv.userId === user?.id);
            const tasks = getFromStorage(STORAGE_KEYS.TASKS).filter((t: any) => t.userId === user?.id || accessibleProjectIds.has(t.projectId));
            
            const now = new Date();
            const activeCount = projects.filter((p: any) => ['PLANNING', 'EDITING', 'REVIEW'].includes(p.status?.toUpperCase())).length;
            const paidInvoices = invoices.filter((i: any) => i.status === 'PAID');
            const revenueThisMonth = paidInvoices.filter((i: any) => new Date(i.paymentDate || i.createdAt).getMonth() === now.getMonth()).reduce((acc: number, i: any) => acc + (parseFloat(i.amount) || 0), 0);
            
            return { data: {
                activeProjectsCount: activeCount,
                revenueThisMonth,
                revenueThisYear: revenueThisMonth * 1.5, // Mock
                pendingRevenue: invoices.filter((i: any) => i.status !== 'PAID').reduce((acc: number, i: any) => acc + (parseFloat(i.amount) || 0), 0),
                totalOverdue: invoices.filter((i: any) => i.status === 'OVERDUE').reduce((acc: number, i: any) => acc + (parseFloat(i.amount) || 0), 0),
                weeklyRevenue: [{ name: 'Current', amount: revenueThisMonth/4, invoiced: revenueThisMonth/3, overdue: 0 }],
                monthlyRevenue: [{ name: now.toLocaleDateString('en-IN', { month: 'short' }), amount: revenueThisMonth, invoiced: revenueThisMonth * 1.2, overdue: 0 }]
            }};
        }

        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS, '/tasks': STORAGE_KEYS.TASKS, '/clients': STORAGE_KEYS.CLIENTS,
            '/invoices': STORAGE_KEYS.INVOICES, '/calendar': STORAGE_KEYS.CALENDAR_EVENTS, '/bookings': STORAGE_KEYS.STUDIO_BOOKINGS,
            '/notifications': STORAGE_KEYS.NOTIFICATIONS
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            let data = getFromStorage(keyMap[key]);
            if (user?.id) {
                const joinedIds = getUserProjectIds(user.id);
                if (key === '/projects') {
                    data = data.filter((p: any) => p.ownerId === user.id || joinedIds.has(p.id));
                } else if (key === '/tasks' || key === '/calendar' || key === '/bookings') {
                    data = data.filter((item: any) => item.userId === user.id || joinedIds.has(item.projectId));
                } else {
                    data = data.filter((item: any) => item.userId === user.id);
                }
            }

            // Single Item lookup
            const pathParts = endpoint.split('/');
            if (pathParts.length === 3 && pathParts[0] === '' && `/${pathParts[1]}` === key) {
                const id = pathParts[2];
                const item = data.find((i: any) => i.id === id);
                if (item) {
                    if (key === '/projects') {
                        // HYDRATION: Fetch sub-resources from global stores
                        const pTasks = getFromStorage(STORAGE_KEYS.TASKS).filter((t: any) => t.projectId === id);
                        const pMilestones = getFromStorage(STORAGE_KEYS.MILESTONES).filter((m: any) => m.projectId === id);
                        const pComments = getFromStorage(STORAGE_KEYS.COMMENTS).filter((c: any) => c.projectId === id);
                        const pActivities = getFromStorage(STORAGE_KEYS.ACTIVITIES).filter((a: any) => a.projectId === id);
                        return { data: { 
                            ...item, 
                            tasks: pTasks, 
                            milestones: pMilestones, 
                            comments: pComments, 
                            activities: pActivities,
                            inviteCode: item.inviteCode || 'CODE12'
                        }};
                    }
                    return { data: item };
                }
                throw { response: { status: 404 } };
            }

            // Sub-resource lookups (members|activity)
            const subMatch = endpoint.match(/^\/projects\/(.+)\/(members|activities)$/);
            if (subMatch) {
                const [_, pId, type] = subMatch;
                if (type === 'members') {
                    const memberships = getFromStorage(STORAGE_KEYS.MEMBERSHIPS).filter((m: any) => m.projectId === pId);
                    const users = getFromStorage(STORAGE_KEYS.AUTH);
                    return { data: memberships.map((m: any) => {
                        const u = users.find((u: any) => u.id === m.userId);
                        return { 
                            id: m.userId, 
                            name: m.userName || u?.name || 'Studio Member', 
                            role: m.userId === m.ownerId ? 'OWNER' : 'MEMBER' // Simplified role logic
                        };
                    })};
                }
                if (type === 'activities') {
                    return { data: getFromStorage(STORAGE_KEYS.ACTIVITIES).filter((a: any) => a.projectId === pId) };
                }
            }

            return { data };
        }
        return { data: [] };
    },

    post: async (endpoint: string, payload: any, _config?: any) => {
        await new Promise(r => setTimeout(r, 50));
        const user = getCurrentUser();

        if (endpoint === '/auth/login') return api.auth.login(payload.email, payload.password);
        if (endpoint === '/auth/register') return api.auth.register(payload);
        if (endpoint === '/auth/change-password') return { data: { success: true, message: 'Password updated in vault.' } };
        if (endpoint === '/auth/send-otp') return { data: { success: true, message: 'OTP Sent (123456)' } };

        // Join Project
        if (endpoint === '/projects/join' && user?.id) {
            const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
            const p = projects.find((x: any) => x.inviteCode === payload.code);
            if (p) {
                const members = getFromStorage(STORAGE_KEYS.MEMBERSHIPS);
                if (!members.find((m: any) => m.userId === user.id && m.projectId === p.id)) {
                    members.push({ id: Math.random().toString(36).substr(2, 9), userId: user.id, userName: user.name, projectId: p.id, joinedAt: new Date().toISOString() });
                    setToStorage(STORAGE_KEYS.MEMBERSHIPS, members);
                    logActivity(p.id, 'JOINED', `${user.name} joined via code`);
                }
                return { data: { success: true, project: p } };
            }
            throw { response: { status: 404, data: { message: 'Invalid Studio Code' } } };
        }

        // Sub-resource POST (tasks|milestones|comments)
        const subMatch = endpoint.match(/^\/projects\/(.+)\/(tasks|milestones|comments)$/);
        if (subMatch) {
            const [_, pId, type] = subMatch;
            const storeKey = type === 'tasks' ? STORAGE_KEYS.TASKS : type === 'milestones' ? STORAGE_KEYS.MILESTONES : STORAGE_KEYS.COMMENTS;
            const items = getFromStorage(storeKey);
            const newItem = { 
                id: Math.random().toString(36).substr(2, 9), 
                projectId: pId, 
                userId: user?.id, 
                user: user ? { name: user.name, id: user.id } : null,
                ...payload, 
                createdAt: new Date().toISOString() 
            };
            items.push(newItem);
            setToStorage(storeKey, items);
            logActivity(pId, `ADDED_${type.toUpperCase().slice(0, -1)}`, `Added ${type}: ${payload.title || payload.content}`);
            return { data: newItem };
        }

        // Top-level POST
        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS, '/tasks': STORAGE_KEYS.TASKS, '/clients': STORAGE_KEYS.CLIENTS,
            '/invoices': STORAGE_KEYS.INVOICES, '/calendar': STORAGE_KEYS.CALENDAR_EVENTS, '/bookings': STORAGE_KEYS.STUDIO_BOOKINGS,
            '/notifications': STORAGE_KEYS.NOTIFICATIONS
        };
        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const data = getFromStorage(keyMap[key]);
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                userId: user?.id,
                ownerId: key === '/projects' ? user?.id : undefined,
                ownerName: key === '/projects' ? user?.name : undefined,
                inviteCode: key === '/projects' ? Math.random().toString(36).substr(2, 6).toUpperCase() : undefined,
                ...payload,
                createdAt: new Date().toISOString()
            };
            data.push(newItem);
            setToStorage(keyMap[key], data);
            if (key === '/projects') logActivity(newItem.id, 'PROJECT_CREATED', `Studio project "${newItem.name}" initialized.`);
            return { data: newItem };
        }
        return { data: payload };
    },

    put: async (endpoint: string, payload: any, _config?: any) => {
        await new Promise(r => setTimeout(r, 50));
        const user = getCurrentUser();

        if (endpoint === '/auth/profile') {
            const users = getFromStorage(STORAGE_KEYS.AUTH);
            const idx = users.findIndex((u: any) => u.id === user?.id);
            if (idx !== -1) {
                // Handle FormData or JSON
                const updates = payload instanceof FormData ? Object.fromEntries((payload as any).entries()) : payload;
                users[idx] = { ...users[idx], ...updates };
                setToStorage(STORAGE_KEYS.AUTH, users);
                const { password: _, ...safeUser } = users[idx];
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
                return { data: safeUser };
            }
        }
        const subMatch = endpoint.match(/^\/projects\/(.+)\/(tasks|milestones|comments)\/(.+)$/);
        if (subMatch) {
            const [_, pId, type, iId] = subMatch;
            const storeKey = type === 'tasks' ? STORAGE_KEYS.TASKS : type === 'milestones' ? STORAGE_KEYS.MILESTONES : STORAGE_KEYS.COMMENTS;
            const items = getFromStorage(storeKey);
            const idx = items.findIndex((i: any) => i.id === iId);
            if (idx !== -1) {
                items[idx] = { ...items[idx], ...payload };
                setToStorage(storeKey, items);
                logActivity(pId, `UPDATED_${type.toUpperCase().slice(0, -1)}`, `Updated ${type}`);
                return { data: items[idx] };
            }
        }

        const keyMap: Record<string, string> = { '/projects': STORAGE_KEYS.PROJECTS, '/tasks': STORAGE_KEYS.TASKS, '/invoices': STORAGE_KEYS.INVOICES };
        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const id = endpoint.split('/').pop();
            const data = getFromStorage(keyMap[key]);
            const idx = data.findIndex((i: any) => i.id === id);
            if (idx !== -1) {
                data[idx] = { ...data[idx], ...payload };
                setToStorage(keyMap[key], data);
                if (key === '/projects') logActivity(id!, 'SETTINGS_UPDATED', 'Project configuration modified.');
                return { data: data[idx] };
            }
        }
        return { data: payload };
    },

    delete: async (endpoint: string, _config?: any) => {
        await new Promise(r => setTimeout(r, 50));
        
        // Sub-resource DELETE
        const subMatch = endpoint.match(/^\/projects\/(.+)\/(tasks|milestones|comments)\/(.+)$/);
        if (subMatch) {
            const [_, pId, type, iId] = subMatch;
            const storeKey = type === 'tasks' ? STORAGE_KEYS.TASKS : type === 'milestones' ? STORAGE_KEYS.MILESTONES : STORAGE_KEYS.COMMENTS;
            const items = getFromStorage(storeKey);
            setToStorage(storeKey, items.filter((i: any) => i.id !== iId));
            logActivity(pId, `DELETED_${type.toUpperCase().slice(0, -1)}`, `Removed ${type}`);
            return { data: { success: true } };
        }

        const keyMap: Record<string, string> = { '/projects': STORAGE_KEYS.PROJECTS, '/tasks': STORAGE_KEYS.TASKS, '/invoices': STORAGE_KEYS.INVOICES };
        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const id = endpoint.split('/').pop();
            if (!id) return { data: { success: false } };
            const data = getFromStorage(keyMap[key]);
            setToStorage(keyMap[key], data.filter((i: any) => i.id !== id));
            
            // Cascading Delete for Projects
            if (key === '/projects') {
                [STORAGE_KEYS.TASKS, STORAGE_KEYS.MILESTONES, STORAGE_KEYS.COMMENTS, STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.MEMBERSHIPS].forEach(k => {
                    const items = getFromStorage(k);
                    setToStorage(k, items.filter((i: any) => i.projectId !== id));
                });
            }
            return { data: { success: true } };
        }
        return { data: { success: false } };
    },

    utils: {
        exportAppData: () => {
            const v = { storage: {} as any };
            Object.values(STORAGE_KEYS).forEach(k => v.storage[k] = getFromStorage(k));
            const blob = new Blob([JSON.stringify(v, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'editpro-export.studio'; a.click();
        },
        importAppData: (jsonString: string) => {
            try {
                const data = JSON.parse(jsonString);
                if (data.storage) {
                    Object.entries(data.storage).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
                    return true;
                }
                return false;
            } catch { return false; }
        }
    }
};

export default api;
