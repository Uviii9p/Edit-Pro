'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Briefcase, Clock, AlertCircle,
    Calendar, IndianRupee, ArrowUpRight, TrendingUp
} from 'lucide-react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';


export default function DashboardPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState<'WEEK' | 'MONTH'>('WEEK');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = useAuthStore((state: any) => state.user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashResp, calResp] = await Promise.all([
                    api.get('/dashboard'),
                    api.get('/calendar')
                ]);
                setData({ ...dashResp.data, calendarEvents: calResp.data });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-20 bg-slate-800/50 rounded-2xl w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800/30 rounded-2xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[400px] bg-slate-800/30 rounded-2xl"></div>
                <div className="h-[400px] bg-slate-800/30 rounded-2xl"></div>
            </div>
        </div>
    );

    const stats = [
        { label: "Active Projects", value: data?.activeProjectsCount || 0, icon: Briefcase, color: "text-blue-400" },
        { label: "Revenue (Month)", value: `₹${data?.revenueThisMonth?.toLocaleString() || 0}`, icon: IndianRupee, color: "text-emerald-400" },
        { label: "Pending Revenue", value: `₹${data?.pendingRevenue?.toLocaleString() || 0}`, icon: Clock, color: "text-amber-400" },
        { label: "Overdue Amount", value: `₹${data?.totalOverdue?.toLocaleString() || 0}`, icon: AlertCircle, color: "text-red-400" },
    ];

    const chartData = chartMode === 'WEEK'
        ? (data?.weeklyRevenue || [])
        : (data?.monthlyRevenue || []);

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-16 sm:mt-0">
                <div className="space-y-1 w-full text-center sm:text-left">
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-[10px] md:text-sm text-slate-500 font-bold tracking-tight uppercase tracking-widest opacity-80">Studio performance at peak potential.</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/40 p-1.5 pl-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm w-full sm:w-auto">
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Yearly Revenue</p>
                        <p className="font-bold text-emerald-400 tracking-tight">₹{data?.revenueThisYear?.toLocaleString() || 0}</p>
                    </div>
                    <img
                        src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=3b82f6&color=fff`}
                        className="w-10 h-10 rounded-xl border border-slate-700/50 object-cover"
                        alt="Profile"
                    />
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        key={stat.label}
                        className="glass-card p-6 relative overflow-hidden group"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className={`p-2.5 rounded-lg bg-slate-950/50 ${stat.color} group-hover:scale-110 transition-transform duration-300 border border-slate-800/50`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">+12% vs last month</div>
                        </div>
                        <div className="mt-5 relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">{stat.label}</p>
                            <h3 className="text-3xl font-bold mt-2 tracking-tight">{stat.value}</h3>
                        </div>
                        {/* Decorative Gradient Glow */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-colors duration-500" />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-panel p-4 md:p-8">
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Financial Growth</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {chartMode === 'WEEK' ? 'Weekly revenue stream' : 'Monthly revenue stream'}
                                </p>
                            </div>
                            <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
                                <button
                                    onClick={() => setChartMode('WEEK')}
                                    className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                        chartMode === 'WEEK' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')}
                                >
                                    WEEK
                                </button>
                                <button
                                    onClick={() => setChartMode('MONTH')}
                                    className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                        chartMode === 'MONTH' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')}
                                >
                                    MONTH
                                </button>
                            </div>
                        </div>

                        {/* Responsive Legend */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoiced</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overdue</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[320px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                                    fontWeight={700}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={10}
                                    fontWeight={700}
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
                                    animationDuration={1000}
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
                                    animationDuration={1000}
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
                                    animationDuration={1000}
                                    connectNulls
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Studio Schedule Widget */}
                <div className="glass-panel p-8 bg-slate-900/50 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Studio Schedule</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Today&apos;s Sessions</p>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = '/calendar'} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                            <ArrowUpRight size={18} />
                        </button>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {data?.calendarEvents?.filter((e: any) => isSameDay(parseISO(e.date), new Date())).length > 0 ? (
                            data.calendarEvents
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .filter((e: any) => isSameDay(parseISO(e.date), new Date()))
                                .slice(0, 4)
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .map((event: any) => (
                                    <div key={event.id} className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                {event.type}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-slate-500">{event.startTime} - {event.endTime}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{event.title}</h4>
                                        <p className="text-[11px] text-slate-500 mt-1 font-medium italic">Project: {event.projectName}</p>
                                    </div>
                                ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-3xl">
                                <Clock size={32} className="mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest opacity-40">No sessions today</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => window.location.href = '/calendar'}
                        className="w-full py-3 mt-6 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-blue-500/20"
                    >
                        Open Full Calendar
                    </button>
                </div>

                {/* AI Insights Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 h-full bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                <TrendingUp className="text-indigo-400" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Studio Intelligence</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Insight Feed</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="group cursor-help">
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 group-hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency suggest</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        Shift your rough-cut editing tasks to morning slots (9 AM - 11 AM) for a <span className="text-blue-400 font-bold">15% speed increase</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="group cursor-help">
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 group-hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Forecast</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        Based on current active projects, you&apos;re projected to hit <span className="text-emerald-400 font-bold">₹1.2L additional revenue</span> by end of quarter.
                                    </p>
                                </div>
                            </div>

                            <button className="w-full py-4 mt-6 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-slate-300">
                                Upgrade Insights
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
