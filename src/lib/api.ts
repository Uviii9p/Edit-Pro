'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

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
    FILES: 'editpro_files',
    CALENDAR_EVENTS: 'editpro_calendar_events',
    STUDIO_BOOKINGS: 'editpro_studio_bookings',
    BUSINESS_DETAILS: 'editpro_editor_details'
};

const getFromStorage = (key: string, defaultVal: any = []) => { // eslint-disable-line @typescript-eslint/no-explicit-any

    if (typeof window === 'undefined') return defaultVal;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const setToStorage = (key: string, data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any

    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
};

const api = {
    // Auth helpers
    auth: {
        login: (email: string, password: string) => {
            const users = getFromStorage(STORAGE_KEYS.AUTH, []);
            const user = users.find((u: any) => u.email === email && u.password === password); // eslint-disable-line @typescript-eslint/no-explicit-any

            if (user) {
                const { password: _, ...safeUser } = user;
                const token = `mock_jwt_${Date.now()}`;
                localStorage.setItem('token', token);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
                return { data: { user: safeUser, token } };
            }
            throw { response: { status: 401, data: { message: 'Invalid credentials' } } };
        },
        register: (userData: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any

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
    get: async (endpoint: string, _config?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any

        // Mock delay
        await new Promise(r => setTimeout(r, 100));

        if (endpoint === '/auth/profile') {
            const user = getFromStorage(STORAGE_KEYS.USER, null);
            if (!user) throw { response: { status: 401 } };
            return { data: user };
        }

        // Dashboard endpoint – compute real stats from stored data
        if (endpoint === '/dashboard') {
            const projects = getFromStorage(STORAGE_KEYS.PROJECTS, []);
            const invoices = getFromStorage(STORAGE_KEYS.INVOICES, []);
            const tasks = getFromStorage(STORAGE_KEYS.TASKS, []);
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const activeProjectsCount = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || !p.status).length;

            // Categorize Invoices Strictly
            const paidInvoices = invoices.filter((inv: any) => inv.status === 'PAID');
            const overdueInvoices = invoices.filter((inv: any) => inv.status === 'OVERDUE' || (inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < now));
            const pendingInvoices = invoices.filter((inv: any) => inv.status !== 'PAID' && !overdueInvoices.find((o: any) => o.id === inv.id));

            const totalPaid = paidInvoices.reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);
            const totalOverdue = overdueInvoices.reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);
            const pendingRevenue = pendingInvoices.reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

            // Monthly revenue (paid this month) - for summary card
            const revenueThisMonth = paidInvoices
                .filter((inv: any) => {
                    const pd = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                    return pd.getMonth() === currentMonth && pd.getFullYear() === currentYear;
                })
                .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

            // Yearly revenue (paid this year)
            const revenueThisYear = paidInvoices
                .filter((inv: any) => {
                    const pd = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                    return pd.getFullYear() === currentYear;
                })
                .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

            // Task completion rate
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;
            const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Weekly revenue (last 4 weeks)
            const weeklyRevenue: { name: string; amount: number; invoiced: number }[] = [];
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);

                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekEnd.getDate() - 7);
                weekStart.setHours(0, 0, 0, 0);

                const weekStr = i === 0 ? 'Current' : `Wk ${4 - i}`;

                const weekPaid = invoices
                    .filter((inv: any) => {
                        if (inv.status !== 'PAID') return false;
                        const pd = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                        return pd >= weekStart && pd <= weekEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                const weekInvoiced = invoices
                    .filter((inv: any) => {
                        const cd = new Date(inv.createdAt);
                        return cd >= weekStart && cd <= weekEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                weeklyRevenue.push({ name: weekStr, amount: weekPaid, invoiced: weekInvoiced });
            }

            // Monthly revenue (last 6 months)
            const monthlyRevenue = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

                const monthPaid = invoices
                    .filter((inv: any) => {
                        if (inv.status !== 'PAID') return false;
                        const pd = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                        return pd >= monthStart && pd <= monthEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                const monthInvoiced = invoices
                    .filter((inv: any) => {
                        const cd = new Date(inv.createdAt);
                        return cd >= monthStart && cd <= monthEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                monthlyRevenue.push({ name: d.toLocaleDateString('en-IN', { month: 'short' }), amount: monthPaid, invoiced: monthInvoiced });
            }

            return {
                data: {
                    activeProjectsCount,
                    revenueThisMonth,
                    revenueThisYear,
                    pendingRevenue,
                    totalOverdue,
                    totalPaid,
                    taskCompletionRate,
                    weeklyRevenue,
                    monthlyRevenue,
                }
            };
        }

        // Payment analytics endpoint
        if (endpoint === '/invoices/analytics') {
            const invoices = getFromStorage(STORAGE_KEYS.INVOICES, []);
            const now = new Date();

            const paidInvoices = invoices.filter((i: any) => i.status === 'PAID');
            const overdueInvoices = invoices.filter((i: any) => i.status === 'OVERDUE' || (i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < now));
            const pendingInvoices = invoices.filter((i: any) => i.status !== 'PAID' && !overdueInvoices.find((o: any) => o.id === i.id));

            const totalPaid = paidInvoices.reduce((acc: number, i: any) => acc + (parseFloat(i.amount) || 0) + (parseFloat(i.tax) || 0), 0);
            const totalPending = pendingInvoices.reduce((acc: number, i: any) => acc + (parseFloat(i.amount) || 0) + (parseFloat(i.tax) || 0), 0);
            const totalOverdue = overdueInvoices.reduce((acc: number, i: any) => acc + (parseFloat(i.amount) || 0) + (parseFloat(i.tax) || 0), 0);

            const weeklyRevenue = [];
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);
                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekEnd.getDate() - 7);
                weekStart.setHours(0, 0, 0, 0);

                const weekPaid = invoices
                    .filter((inv: any) => {
                        if (inv.status !== 'PAID') return false;
                        const pd = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                        return pd >= weekStart && pd <= weekEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                const weekInvoiced = invoices
                    .filter((inv: any) => {
                        const cd = new Date(inv.createdAt);
                        return cd >= weekStart && cd <= weekEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                const weekOverdue = invoices
                    .filter((inv: any) => {
                        const isOverdue = inv.status === 'OVERDUE' || (inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < now);
                        if (!isOverdue) return false;
                        const cd = new Date(inv.createdAt);
                        return cd >= weekStart && cd <= weekEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                weeklyRevenue.push({ name: i === 0 ? 'Current' : `Wk ${4 - i}`, amount: weekPaid, invoiced: weekInvoiced, overdue: weekOverdue });
            }

            const monthlyRevenue = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

                const monthPaid = invoices
                    .filter((inv: any) => {
                        if (inv.status !== 'PAID') return false;
                        const pd = inv.paymentDate ? new Date(inv.paymentDate) : new Date(inv.createdAt);
                        return pd >= monthStart && pd <= monthEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                const monthInvoiced = invoices
                    .filter((inv: any) => {
                        const cd = new Date(inv.createdAt);
                        return cd >= monthStart && cd <= monthEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                const monthOverdue = invoices
                    .filter((inv: any) => {
                        const isOverdue = inv.status === 'OVERDUE' || (inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < now);
                        if (!isOverdue) return false;
                        const cd = new Date(inv.createdAt);
                        return cd >= monthStart && cd <= monthEnd;
                    })
                    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.amount) || 0) + (parseFloat(inv.tax) || 0), 0);

                monthlyRevenue.push({
                    name: d.toLocaleDateString('en-IN', { month: 'short' }),
                    amount: monthPaid,
                    invoiced: monthInvoiced,
                    overdue: monthOverdue
                });
            }

            return {
                data: {
                    totalPaid,
                    totalPending,
                    totalOverdue,
                    totalInvoices: invoices.length,
                    paidCount: paidInvoices.length,
                    pendingCount: pendingInvoices.length,
                    overdueCount: overdueInvoices.length,
                    monthlyRevenue,
                    weeklyRevenue,
                }
            };
        }

        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/equipment': STORAGE_KEYS.EQUIPMENT,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/delivery': STORAGE_KEYS.DELIVERIES,
            '/timer': STORAGE_KEYS.TIMER_LOGS,
            '/calendar': STORAGE_KEYS.CALENDAR_EVENTS,
            '/bookings': STORAGE_KEYS.STUDIO_BOOKINGS
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            let data = getFromStorage(keyMap[key]);

            // RELATIONAL ENRICHMENT: Automatically join related entities for specific routes
            if (endpoint === '/invoices') {
                const projects = getFromStorage(STORAGE_KEYS.PROJECTS, []);
                data = data.map((inv: any) => ({
                    ...inv,
                    project: projects.find((p: any) => p.id === inv.projectId) || null
                }));
            }

            if (endpoint.startsWith('/projects') && endpoint !== '/projects') {
                // Single project might need enrichment too
            }

            // Handle /[route]/[id]
            if (endpoint !== key) {
                const id = endpoint.split('/').pop();
                const item = data.find((p: any) => p.id === id); // eslint-disable-line @typescript-eslint/no-explicit-any

                if (item) return { data: item };
                throw { response: { status: 404 } };
            }

            return { data };
        }

        return { data: [] };
    },

    post: async (endpoint: string, payload: any, _config?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any

        await new Promise(r => setTimeout(r, 100));

        if (endpoint === '/auth/login') return api.auth.login(payload.email, payload.password);
        if (endpoint === '/auth/register') return api.auth.register(payload);

        // --- LOCAL DEVICE AUTH: Purely client-side (No backend required) ---
        if (endpoint === '/auth/send-otp') {
            const users = getFromStorage(STORAGE_KEYS.AUTH, []);
            const user = users.find((u: any) => u.email === payload.email);
            if (!user) throw { response: { status: 404, data: { message: 'Identity not found' } } };

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`[DEVICE AUTH] Local OTP for ${payload.email}: ${otp}`);

            // Store OTP in device storage for local verification
            localStorage.setItem(`otp_${payload.email}`, otp);

            return { data: { success: true, message: 'OTP Generated on Device', devOtp: otp } };
        }

        if (endpoint === '/auth/verify-otp') {
            const storedOtp = localStorage.getItem(`otp_${payload.email}`);
            if (storedOtp === payload.otp) {
                return { data: { success: true, message: 'Device Storage Verified' } };
            }
            throw { response: { status: 401, data: { message: 'Invalid Device Code' } } };
        }

        if (endpoint === '/auth/reset-password') {
            const users = getFromStorage(STORAGE_KEYS.AUTH, []);
            const userIndex = users.findIndex((u: any) => u.email === payload.email);
            if (userIndex !== -1) {
                users[userIndex].password = payload.newPassword;
                setToStorage(STORAGE_KEYS.AUTH, users);
                localStorage.removeItem(`otp_${payload.email}`);
                return { data: { success: true, message: 'Password Updated on Device' } };
            }
            throw { response: { status: 404 } };
        }
        // -----------------------------------------------------------

        // Send reminder endpoint: /invoices/:id/reminder
        const reminderMatch = endpoint.match(/^\/invoices\/(.+)\/reminder$/);
        if (reminderMatch) {
            const invoiceId = reminderMatch[1];
            const invoices = getFromStorage(STORAGE_KEYS.INVOICES, []);
            const index = invoices.findIndex((i: any) => i.id === invoiceId);
            if (index !== -1) {
                invoices[index] = {
                    ...invoices[index],
                    reminderSentAt: new Date().toISOString(),
                    reminderCount: (invoices[index].reminderCount || 0) + 1,
                };
                setToStorage(STORAGE_KEYS.INVOICES, invoices);
                const clientName = invoices[index].project?.clientName || 'Valued Client';
                const total = (parseFloat(invoices[index].amount) || 0) + (parseFloat(invoices[index].tax) || 0);
                const dueDate = invoices[index].dueDate
                    ? new Date(invoices[index].dueDate).toLocaleDateString('en-IN')
                    : 'Upon Receipt';
                return {
                    data: {
                        success: true,
                        message: `Reminder sent via ${payload.method || 'email'}`,
                        invoice: invoices[index],
                        reminderMessage: `Hello ${clientName}, your invoice #${invoices[index].invoiceNumber} of ₹${total.toLocaleString()} is due on ${dueDate}. Please complete the payment. Thank you.`,
                    }
                };
            }
            return { data: { success: false, message: 'Invoice not found' } };
        }

        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/equipment': STORAGE_KEYS.EQUIPMENT,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/timer': STORAGE_KEYS.TIMER_LOGS,
            '/calendar': STORAGE_KEYS.CALENDAR_EVENTS,
            '/bookings': STORAGE_KEYS.STUDIO_BOOKINGS
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

    put: async (endpoint: string, payload: any, _config?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any

        await new Promise(r => setTimeout(r, 100));

        // Mark as paid endpoint: /invoices/:id/pay
        const payMatch = endpoint.match(/^\/invoices\/(.+)\/pay$/);
        if (payMatch) {
            const invoiceId = payMatch[1];
            const invoices = getFromStorage(STORAGE_KEYS.INVOICES, []);
            const index = invoices.findIndex((i: any) => i.id === invoiceId);
            if (index !== -1) {
                const total = (parseFloat(invoices[index].amount) || 0) + (parseFloat(invoices[index].tax) || 0);
                invoices[index] = {
                    ...invoices[index],
                    status: 'PAID',
                    paymentMethod: payload.paymentMethod || 'Bank Transfer',
                    paymentDate: new Date().toISOString(),
                    transactionId: payload.transactionId || `TXN-${Date.now()}`,
                    paidAmount: total,
                };
                setToStorage(STORAGE_KEYS.INVOICES, invoices);
                return { data: invoices[index] };
            }
            return { data: payload };
        }

        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/calendar': STORAGE_KEYS.CALENDAR_EVENTS,
            '/bookings': STORAGE_KEYS.STUDIO_BOOKINGS
        };

        if (endpoint === '/auth/profile') {
            const user = getFromStorage(STORAGE_KEYS.USER, {});
            // Handle FormData or Object
            const updates = payload instanceof FormData ? Object.fromEntries(payload.entries()) : payload;
            const updatedUser = { ...user, ...updates };
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

            // Also update in AUTH list
            const auths = getFromStorage(STORAGE_KEYS.AUTH, []);
            const authIndex = auths.findIndex((u: any) => u.id === user.id);
            if (authIndex !== -1) {
                auths[authIndex] = { ...auths[authIndex], ...updates };
                setToStorage(STORAGE_KEYS.AUTH, auths);
            }

            return { data: updatedUser };
        }

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const id = endpoint.split('/').pop();
            const data = getFromStorage(keyMap[key]);
            const index = data.findIndex((i: any) => i.id === id); // eslint-disable-line @typescript-eslint/no-explicit-any

            if (index !== -1) {
                data[index] = { ...data[index], ...payload };
                setToStorage(keyMap[key], data);
                return { data: data[index] };
            }
        }
        return { data: payload };
    },

    delete: async (endpoint: string, _config?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any

        await new Promise(r => setTimeout(r, 100));
        const keyMap: Record<string, string> = {
            '/projects': STORAGE_KEYS.PROJECTS,
            '/tasks': STORAGE_KEYS.TASKS,
            '/clients': STORAGE_KEYS.CLIENTS,
            '/invoices': STORAGE_KEYS.INVOICES,
            '/files': STORAGE_KEYS.FILES,
            '/timer': STORAGE_KEYS.TIMER_LOGS,
            '/calendar': STORAGE_KEYS.CALENDAR_EVENTS,
            '/bookings': STORAGE_KEYS.STUDIO_BOOKINGS
        };

        const key = Object.keys(keyMap).find(k => endpoint.startsWith(k));
        if (key) {
            const id = endpoint.split('/').pop();
            const data = getFromStorage(keyMap[key]);
            const filtered = data.filter((i: any) => i.id !== id); // eslint-disable-line @typescript-eslint/no-explicit-any

            setToStorage(keyMap[key], filtered);
            return { data: { success: true } };
        }
        return { data: { success: false } };
    },

    /**
     * LOCAL DEVICE STORAGE MANAGEMENT
     */
    utils: {
        exportAppData: () => {
            const data: Record<string, any> = {};
            Object.values(STORAGE_KEYS).forEach(key => {
                data[key] = localStorage.getItem(key);
            });
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `editpro-studio-vault-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        importAppData: (fileContents: string) => {
            try {
                const data = JSON.parse(fileContents);
                Object.keys(data).forEach(key => {
                    if (data[key]) localStorage.setItem(key, data[key]);
                });
                window.location.reload();
            } catch (err) {
                console.error('Data corrupted:', err);
                alert('CRITICAL: Incompatible or Corrupted Archive!');
            }
        }
    }
};

export default api;
