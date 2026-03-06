'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Search, CheckCircle, Clock, AlertTriangle, Bell,
    TrendingUp, Wallet, Eye, CreditCard, Send,
    X, IndianRupee, BarChart3, ArrowUpRight, ArrowDownRight,
    Mail, MessageCircle, Smartphone, FileText, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function PaymentsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoices, setInvoices] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [transactionId, setTransactionId] = useState('');
    const [reminderMethod, setReminderMethod] = useState('email');
    const [actionLoading, setActionLoading] = useState(false);
    const [timeframe, setTimeframe] = useState<'WEEK' | 'MONTH'>('MONTH');
    const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invRes, anaRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/invoices/analytics'),
            ]);
            setInvoices(invRes.data);
            setAnalytics(anaRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: string = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getStatus = (invoice: any) => {
        if (invoice.status === 'PAID') return 'PAID';
        if (invoice.status === 'OVERDUE') return 'OVERDUE';
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) return 'OVERDUE';
        return 'PENDING';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'OVERDUE': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const handleMarkPaid = async () => {
        if (!selectedInvoice) return;
        setActionLoading(true);
        try {
            await api.put(`/invoices/${selectedInvoice.id}/pay`, {
                paymentMethod,
                transactionId: transactionId || undefined,
            });
            showToast(`Invoice #${selectedInvoice.invoiceNumber} marked as paid!`);
            setShowPayModal(false);
            setSelectedInvoice(null);
            setTransactionId('');
            fetchData();
        } catch (err) {
            showToast('Failed to mark as paid', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendReminder = async () => {
        if (!selectedInvoice) return;
        setActionLoading(true);
        try {
            await api.post(`/invoices/${selectedInvoice.id}/reminder`, {
                method: reminderMethod,
            });
            showToast(`Reminder sent via ${reminderMethod}!`);
            setShowReminderModal(false);
            setSelectedInvoice(null);
            fetchData();
        } catch (err) {
            showToast('Failed to send reminder', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = invoices.filter(inv => {
        const status = getStatus(inv);
        const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
        const matchesSearch =
            (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.project?.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });



    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-6 right-6 z-[200] px-6 py-3 rounded-xl font-bold text-sm shadow-2xl flex items-center gap-2",
                            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                        )}
                    >
                        <CheckCircle size={18} />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">Payment Management</h1>
                    <p className="text-[10px] md:text-sm text-slate-400 mt-1">Track payments, send reminders, and view analytics.</p>
                </div>
            </header>

            {/* ═══════ ANALYTICS CARDS ═══════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="p-5 md:p-6 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl group hover:border-emerald-500/20 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Total Paid</p>
                            <h2 className="text-2xl md:text-3xl font-bold mt-1 text-emerald-400">₹{(analytics?.totalPaid || 0).toLocaleString()}</h2>
                            <p className="text-[10px] text-slate-500 mt-1">{analytics?.paidCount || 0} invoices</p>
                        </div>
                        <div className="p-2.5 md:p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
                <div className="p-5 md:p-6 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl group hover:border-amber-500/20 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Pending</p>
                            <h2 className="text-2xl md:text-3xl font-bold mt-1 text-amber-400">₹{(analytics?.totalPending || 0).toLocaleString()}</h2>
                            <p className="text-[10px] text-slate-500 mt-1">{analytics?.pendingCount || 0} invoices</p>
                        </div>
                        <div className="p-2.5 md:p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>
                <div className="p-5 md:p-6 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl group hover:border-red-500/20 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Overdue</p>
                            <h2 className="text-2xl md:text-3xl font-bold mt-1 text-red-400">₹{(analytics?.totalOverdue || 0).toLocaleString()}</h2>
                            <p className="text-[10px] text-slate-500 mt-1">{analytics?.overdueCount || 0} invoices</p>
                        </div>
                        <div className="p-2.5 md:p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>
                <div className="p-5 md:p-6 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl group hover:border-blue-500/20 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Total Invoices</p>
                            <h2 className="text-2xl md:text-3xl font-bold mt-1">{analytics?.totalInvoices || 0}</h2>
                            <p className="text-[10px] text-slate-500 mt-1">All time</p>
                        </div>
                        <div className="p-2.5 md:p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ MONTHLY REVENUE CHART ═══════ */}
            {analytics?.monthlyRevenue && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-8">
                    <div className="mb-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/10">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">{timeframe === 'MONTH' ? 'Monthly' : 'Weekly'} Revenue</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{timeframe === 'MONTH' ? 'Last 6 months' : 'Last 8 weeks'} performance</p>
                                </div>
                            </div>
                            <div className="flex gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800 w-fit self-end sm:self-auto">
                                <button
                                    onClick={() => setTimeframe('WEEK')}
                                    className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                        timeframe === 'WEEK' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')}
                                >
                                    WEEKLY
                                </button>
                                <button
                                    onClick={() => setTimeframe('MONTH')}
                                    className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                        timeframe === 'MONTH' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')}
                                >
                                    MONTHLY
                                </button>
                            </div>
                        </div>

                        {/* Responsive Legend */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settled Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoiced Issued</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Critical Backlogs</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={timeframe === 'MONTH' ? analytics.monthlyRevenue : analytics.weeklyRevenue}
                                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={11}
                                    fontWeight={600}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={10}
                                    fontWeight={600}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                                        padding: '12px 16px',
                                    }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(value: any, name?: string) => {
                                        const labels: any = {
                                            amount: 'Paid Revenue',
                                            invoiced: 'Total Invoiced',
                                            overdue: 'Overdue Amount'
                                        };
                                        return [`₹${Number(value || 0).toLocaleString()}`, labels[name!] || name];
                                    }}
                                />
                                <Area
                                    type="linear"
                                    dataKey="invoiced"
                                    stroke="#3b82f6"
                                    fillOpacity={0.4}
                                    fill="url(#colorInvoiced)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    animationDuration={800}
                                    connectNulls
                                    dot={false}
                                />
                                <Area
                                    type="linear"
                                    dataKey="overdue"
                                    stroke="#ef4444"
                                    fillOpacity={0.3}
                                    fill="url(#colorOverdue)"
                                    strokeWidth={2}
                                    animationDuration={800}
                                    connectNulls
                                    dot={false}
                                />
                                <Area
                                    type="linear"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    fillOpacity={0.5}
                                    fill="url(#colorPaid)"
                                    strokeWidth={3}
                                    animationDuration={800}
                                    connectNulls
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div >
            )
            }

            {/* ═══════ CLIENT PAYMENT TRACKER ═══════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Paid Clients */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                            <CheckCircle size={18} />
                        </div>
                        <h3 className="text-base md:text-lg font-bold">Settled Clients</h3>
                        <span className="ml-auto px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-md">PAID</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {invoices.filter(i => i.status === 'PAID').map(inv => (
                            <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl group hover:border-emerald-500/20 transition-all gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-400 font-black text-xs border border-emerald-500/10">
                                        {inv.project?.clientName?.charAt(0).toUpperCase() || 'C'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-sm text-white truncate max-w-[150px]">{inv.project?.clientName || 'Client'}</p>
                                        <p className="text-[9px] text-slate-500 uppercase font-black">Paid: {inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : 'Recent'}</p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                                    <p className="font-black text-emerald-400 text-sm">₹{(Number(inv.amount || 0) + Number(inv.tax || 0)).toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">TXN: {inv.transactionId || 'DIRECT-BANK'}</p>
                                </div>
                            </div>
                        ))}
                        {invoices.filter(i => i.status === 'PAID').length === 0 && (
                            <p className="text-center py-10 text-xs text-slate-600 italic">No payments recorded yet.</p>
                        )}
                    </div>
                </div>

                {/* Unpaid Clients */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                            <Clock size={18} />
                        </div>
                        <h3 className="text-base md:text-lg font-bold">Outstanding Clients</h3>
                        <span className="ml-auto px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-md">PENDING</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {invoices.filter(i => i.status !== 'PAID').map(inv => {
                            const isOverdue = inv.status === 'OVERDUE' || (inv.dueDate && new Date(inv.dueDate) < new Date());
                            return (
                                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl group hover:border-amber-500/20 transition-all gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border",
                                            isOverdue ? "bg-red-500/5 text-red-500 border-red-500/10" : "bg-amber-500/5 text-amber-500 border-amber-500/10")}>
                                            {inv.project?.clientName?.charAt(0).toUpperCase() || 'C'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-black text-sm text-white truncate max-w-[150px]">{inv.project?.clientName || 'Client'}</p>
                                            <p className={cn("text-[9px] uppercase font-black tracking-widest", isOverdue ? "text-red-500/80" : "text-amber-500/80")}>
                                                {isOverdue ? 'CRITICAL: OVERDUE' : 'PENDING: DUE ON'} {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 flex items-center justify-between sm:block">
                                        <p className="font-black text-slate-200 text-sm">₹{(Number(inv.amount || 0) + Number(inv.tax || 0)).toLocaleString()}</p>
                                        <button
                                            onClick={() => { setSelectedInvoice(inv); setShowReminderModal(true); }}
                                            className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                                        >
                                            REACH OUT →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {invoices.filter(i => i.status !== 'PAID').length === 0 && (
                            <p className="text-center py-10 text-xs text-slate-600 italic">All invoices are settled! ✨</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ FILTERS & SEARCH ═══════ */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1 w-full md:max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by invoice #, customer..."
                        className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                statusFilter === s
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                            )}
                        >
                            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════ PAYMENTS TABLE ═══════ */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                        <tr>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Customer</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Invoice #</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Date</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Due Date</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Amount</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Status</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase">Method</th>
                            <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filtered.map(inv => {
                            const status = getStatus(inv);
                            return (
                                <tr key={inv.id} className="hover:bg-slate-800/30 transition-all group">
                                    <td className="px-4 md:px-6 py-4">
                                        <p className="font-bold text-sm text-slate-200">{inv.project?.clientName || 'Client'}</p>
                                        <p className="text-[10px] text-slate-500">{inv.project?.name || 'General'}</p>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 font-bold text-sm text-slate-300">#{inv.invoiceNumber}</td>
                                    <td className="px-4 md:px-6 py-4 text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 md:px-6 py-4 text-xs text-slate-500">
                                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td className="px-4 md:px-6 py-4 font-bold text-sm text-emerald-400">
                                        ₹{((inv.amount || 0) + (inv.tax || 0)).toLocaleString()}
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", getStatusStyle(status))}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-xs text-slate-400">
                                        {inv.paymentMethod || '—'}
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {status !== 'PAID' && (
                                                <>
                                                    <button
                                                        onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                                                        className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                                        title="Mark as Paid"
                                                    >
                                                        <CheckCircle size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedInvoice(inv); setShowReminderModal(true); }}
                                                        className="p-2 hover:bg-amber-500/10 rounded-lg text-slate-400 hover:text-amber-400 transition-all"
                                                        title="Send Reminder"
                                                    >
                                                        <Bell size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                        <Wallet size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium">No invoices found</p>
                    </div>
                )}
            </div>

            {/* ═══════ VIEW DETAILS MODAL ═══════ */}
            <AnimatePresence>
                {selectedInvoice && !showPayModal && !showReminderModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold">Invoice Details</h2>
                                </div>
                                <button onClick={() => setSelectedInvoice(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice #</p>
                                        <p className="text-lg font-bold mt-1">#{selectedInvoice.invoiceNumber}</p>
                                    </div>
                                    <div className="p-4 bg-slate-800 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                                        <span className={cn("inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold border", getStatusStyle(getStatus(selectedInvoice)))}>
                                            {getStatus(selectedInvoice)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</p>
                                        <p className="text-sm font-bold mt-1">{selectedInvoice.project?.clientName || 'Client'}</p>
                                        <p className="text-xs text-slate-500">{selectedInvoice.project?.clientEmail || ''}</p>
                                    </div>
                                    <div className="p-4 bg-slate-800 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Amount</p>
                                        <p className="text-xl font-bold mt-1 text-emerald-400">₹{((selectedInvoice.amount || 0) + (selectedInvoice.tax || 0)).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-slate-800 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Base</p>
                                        <p className="text-sm font-bold text-slate-300 mt-1">₹{(selectedInvoice.amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-slate-800 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Tax ({selectedInvoice.taxRate || 18}%)</p>
                                        <p className="text-sm font-bold text-slate-300 mt-1">₹{(selectedInvoice.tax || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-slate-800 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Due Date</p>
                                        <p className="text-sm font-bold text-slate-300 mt-1">
                                            {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN') : '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment History */}
                                {selectedInvoice.status === 'PAID' && (
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Payment History</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold">Payment Date</p>
                                                <p className="text-sm font-bold text-slate-200">
                                                    {selectedInvoice.paymentDate ? new Date(selectedInvoice.paymentDate).toLocaleDateString('en-IN') : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold">Method</p>
                                                <p className="text-sm font-bold text-slate-200">{selectedInvoice.paymentMethod || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold">Transaction ID</p>
                                                <p className="text-sm font-bold text-slate-200 font-mono">{selectedInvoice.transactionId || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold">Paid Amount</p>
                                                <p className="text-sm font-bold text-emerald-400">₹{(selectedInvoice.paidAmount || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reminders */}
                                {selectedInvoice.reminderCount > 0 && (
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                        <Bell size={16} className="text-amber-400" />
                                        <p className="text-xs text-amber-300">
                                            <strong>{selectedInvoice.reminderCount}</strong> reminder(s) sent.
                                            Last: {selectedInvoice.reminderSentAt ? new Date(selectedInvoice.reminderSentAt).toLocaleDateString('en-IN') : ''}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                {getStatus(selectedInvoice) !== 'PAID' && (
                                    <>
                                        <button
                                            onClick={() => setShowPayModal(true)}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Mark Paid
                                        </button>
                                        <button
                                            onClick={() => setShowReminderModal(true)}
                                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <Bell size={16} /> Send Reminder
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setSelectedInvoice(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════ MARK AS PAID MODAL ═══════ */}
            <AnimatePresence>
                {showPayModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-3xl w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Confirm Payment</h2>
                                        <p className="text-xs text-slate-500">Invoice #{selectedInvoice.invoiceNumber}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPayModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                            </div>

                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-6 text-center">
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Amount to be recorded</p>
                                <h3 className="text-3xl font-bold text-white mt-1">₹{((selectedInvoice.amount || 0) + (selectedInvoice.tax || 0)).toLocaleString()}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Bank Transfer', 'UPI', 'Cash', 'Card'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setPaymentMethod(m)}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                                                    paymentMethod === m
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                                )}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Transaction ID (Optional)</label>
                                    <input
                                        value={transactionId}
                                        onChange={e => setTransactionId(e.target.value)}
                                        placeholder="TXN-123456..."
                                        className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 font-mono text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleMarkPaid}
                                disabled={actionLoading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl font-bold mt-6 shadow-xl shadow-emerald-900/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                                {actionLoading ? 'Processing...' : 'Confirm Payment'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════ SEND REMINDER MODAL ═══════ */}
            <AnimatePresence>
                {showReminderModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setShowReminderModal(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-3xl w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                                        <Bell size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Send Reminder</h2>
                                        <p className="text-xs text-slate-500">Invoice #{selectedInvoice.invoiceNumber}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReminderModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                            </div>

                            {/* Reminder preview */}
                            <div className="p-4 bg-slate-800 rounded-xl mb-6">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Message Preview</p>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Hello <strong>{selectedInvoice.project?.clientName || 'Client'}</strong>, your invoice
                                    <strong> #{selectedInvoice.invoiceNumber}</strong> of
                                    <strong className="text-emerald-400"> ₹{((selectedInvoice.amount || 0) + (selectedInvoice.tax || 0)).toLocaleString()}</strong> is due on
                                    <strong> {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN') : 'receipt'}</strong>.
                                    Please complete the payment. Thank you.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Reminder Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'email', label: 'Email', icon: Mail },
                                            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                                            { id: 'sms', label: 'SMS', icon: Smartphone },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setReminderMethod(m.id)}
                                                className={cn(
                                                    "px-3 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5",
                                                    reminderMethod === m.id
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                                )}
                                            >
                                                <m.icon size={18} />
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Auto-Reminder Schedule</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: '3 days before due date', active: true },
                                            { label: 'On due date', active: true },
                                            { label: '3 days after due date', active: false },
                                        ].map((opt, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-500" />
                                                    <span className="text-sm text-slate-300">{opt.label}</span>
                                                </div>
                                                <div className={cn(
                                                    "w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors",
                                                    opt.active ? 'bg-amber-600' : 'bg-slate-700'
                                                )}>
                                                    <div className={cn(
                                                        "w-4 h-4 bg-white rounded-full transition-transform",
                                                        opt.active ? 'translate-x-4' : 'translate-x-0'
                                                    )} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSendReminder}
                                disabled={actionLoading}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 rounded-xl font-bold mt-6 shadow-xl shadow-amber-900/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                                {actionLoading ? 'Sending...' : 'Send Payment Reminder'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
