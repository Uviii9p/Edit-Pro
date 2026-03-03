'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Users, Briefcase, CheckCircle, Clock,
    Calendar, IndianRupee, ArrowUpRight, TrendingUp
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/dashboard');
                setData(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    const stats = [
        { label: "Today's Tasks", value: data?.todayTasks?.length || 0, icon: CheckCircle, color: "text-emerald-400" },
        { label: "Upcoming Meetings", value: data?.upcomingMeetings?.length || 0, icon: Calendar, color: "text-blue-400" },
        { label: "Monthly Revenue", value: `₹${data?.revenueThisMonth?.toLocaleString() || 0}`, icon: IndianRupee, color: "text-amber-400" },
        { label: "Completion Rate", value: `${Math.round(data?.taskCompletionRate || 0)}%`, icon: TrendingUp, color: "text-purple-400" },
    ];

    const chartData = data?.weeklyRevenue || [];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name}!</h1>
                    <p className="text-sm text-slate-400 mt-1">Here's what's happening in your studio today.</p>
                </div>
                <div className="flex -space-x-2">
                    <img src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-900" />
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={stat.label}
                        className="p-4 md:p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-xl bg-slate-800 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <ArrowUpRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={20} />
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-xl md:text-3xl font-bold mt-1">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <h3 className="text-xl font-bold mb-6">Revenue Overview</h3>
                    <div className="h-[200px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, "Revenue"]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Proposals */}
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-blue-400" />
                        <h3 className="text-xl font-bold">AI Studio Insight</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-blue-500">
                            <p className="text-sm font-semibold">Productivity Tip</p>
                            <p className="text-xs text-slate-400 mt-1">You're most productive between 10 AM and 1 PM. Schedule high-complexity editing during this window.</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-emerald-500">
                            <p className="text-sm font-semibold">Deadline Alert</p>
                            <p className="text-xs text-slate-400 mt-1">Project 'Cinematic Vlog' is due in 48 hours. You have 3 pending revision tasks.</p>
                        </div>
                        <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors">
                            Refresh Insights
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
