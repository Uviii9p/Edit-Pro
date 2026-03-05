'use client';

/**
 * LOCAL-FIRST MOCK API
 * Uses localStorage for persistent storage without a backend.
 * Provides an axios-like interface for compatibility.
 */

const STORAGE_KEYS = {
    AUTH: 'editpro_auth',
    USER: 'editpro_user',
    PROJECTS: 'editpro_projects',
    TASKS: 'editpro_tasks',
    CLIENTS: 'editpro_clients',
    EQUIPMENT: 'editpro_equipment',
    INVOICES: 'editpro_invoices',
    NOTIFICATIONS: 'editpro_notifications',
    DELIVERIES: 'editpro_deliveries',
    TIMER_LOGS: 'editpro_timer_logs',
    FILES: 'editpro_files'
};

const getFromStorage = (key: string, defaultVal: any = []) => {
    if (typeof window === 'undefined') return defaultVal;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const setToStorage = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
};

const api = {
    // Auth helpers
    auth: {
        login: (email: string, password: string) => {
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
        register: (userData: any) => {
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

    // Axios-like interface
    get: async (endpoint: string, _config?: any) => {
        // Mock delay
        await new Promise(r => setTimeout(r, 100));

        if (endpoint === '/auth/profile') {
            const user = getFromStorage(STORAGE_KEYS.USER, null);
            if (!user) throw { response: { status: 401 } };
            return { data: user };
        }

        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/equipment': STORAGE_KEYS.EQUIPMENT,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/delivery': STORAGE_KEYS.DELIVERIES,
            '/timer': STORAGE_KEYS.TIMER_LOGS
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const data = getFromStorage(keyMap[key]);

            // Handle /[route]/[id]
            if (endpoint !== key) {
                const id = endpoint.split('/').pop();
                const item = data.find((p: any) => p.id === id);
                if (item) return { data: item };
                throw { response: { status: 404 } };
            }

            return { data };
        }

        return { data: [] };
    },

    post: async (endpoint: string, payload: any, _config?: any) => {
        await new Promise(r => setTimeout(r, 100));

        if (endpoint === '/auth/login') return api.auth.login(payload.email, payload.password);
        if (endpoint === '/auth/register') return api.auth.register(payload);

        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/equipment': STORAGE_KEYS.EQUIPMENT,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/timer': STORAGE_KEYS.TIMER_LOGS
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const data = getFromStorage(keyMap[key]);
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                ...payload,
                createdAt: new Date().toISOString()
            };
            if (key === '/timer') {
                data.unshift(newItem);
            } else {
                data.push(newItem);
            }
            setToStorage(keyMap[key], data);
            return { data: newItem };
        }

        return { data: payload };
    },

    put: async (endpoint: string, payload: any, _config?: any) => {
        await new Promise(r => setTimeout(r, 100));
        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const id = endpoint.split('/').pop();
            const data = getFromStorage(keyMap[key]);
            const index = data.findIndex((i: any) => i.id === id);
            if (index !== -1) {
                data[index] = { ...data[index], ...payload };
                setToStorage(keyMap[key], data);
                return { data: data[index] };
            }
        }
        return { data: payload };
    },

    delete: async (endpoint: string, _config?: any) => {
        await new Promise(r => setTimeout(r, 100));
        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/timer': STORAGE_KEYS.TIMER_LOGS
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const id = endpoint.split('/').pop();
            const data = getFromStorage(keyMap[key]);
            const filtered = data.filter((i: any) => i.id !== id);
            setToStorage(keyMap[key], filtered);
            return { data: { success: true } };
        }
        return { data: { success: false } };
    }
};

export default api;
