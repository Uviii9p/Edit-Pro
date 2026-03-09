'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Calendar, Clock, IndianRupee, MessageSquare,
    MoreVertical, Plus, Send, Settings,
    ChevronRight, CheckCircle2, AlertCircle,
    History, Zap, FileText, Share2,
    Trash2, Edit3, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotifications } from '@/hooks/useNotifications';

interface ProjectDetail {
    id: string;
    name: string;
    description: string;
    status: string;
    budget: number;
    deadline: string;
    clientName?: string;
    clientEmail?: string;
    clientNotes?: string;
    tasks: any[];
    milestones: any[];
    comments: any[];
    activities: any[];
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'team'>('overview');
    const [comment, setComment] = useState('');
    const user = useAuthStore((state: any) => state.user);
    const { notify } = useNotifications();
    const commentEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'team') {
            commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [project?.comments, activeTab]);

    const fetchProject = async () => {
        try {
            const resp = await api.get(`/projects/${id}`);
            setProject(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await api.post(`/projects/${id}/comments`, { content: comment });
            notify('Message Sent', 'Your message has been posted to the studio floor.', 'success');
            setComment('');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'PLANNING': return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
            case 'EDITING': return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
            case 'REVIEW': return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
            case 'DELIVERED': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
            default: return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
        }
    };

    if (loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-10 bg-slate-800 rounded-lg w-1/4"></div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-[600px] bg-slate-800/30 rounded-3xl"></div>
                <div className="h-[600px] bg-slate-800/30 rounded-3xl"></div>
            </div>
        </div>
    );

    if (!project) return <div className="p-8 text-center text-slate-400">Project Not Found</div>;

    const theme = getStatusTheme(project.status);

    return (
        <div className="p-4 md:p-10 space-y-10">
            {/* Header / Breadcrumbs */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/projects')}>Projects</span>
                        <ChevronRight size={12} />
                        <span className="text-slate-300">{project.name}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <h1 className="text-4xl font-extrabold tracking-tight">{project.name}</h1>
                        <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm", theme.color, theme.bg, theme.border)}>
                            {project.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl transition-all"><Share2 size={20} /></button>
                    <button className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl transition-all"><Settings size={20} /></button>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all">
                        <Plus size={20} /> New Asset
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-2 border-b border-slate-800/60 pb-px">
                {(['overview', 'tasks', 'timeline', 'team'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-4 text-sm font-bold uppercase tracking-widest relative transition-all",
                            activeTab === tab ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                ))}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <main className="lg:col-span-8 space-y-10">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                {/* Description Card */}
                                <div className="glass-panel p-8 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-blue-400" size={20} />
                                        <h3 className="text-xl font-bold">Project Brief</h3>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed font-medium">{project.description || 'No description provided for this studio production.'}</p>

                                    {/* Project Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget</p>
                                            <p className="text-lg font-bold text-emerald-400">₹{project.budget?.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deadline</p>
                                            <p className="text-lg font-bold text-slate-200">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasks</p>
                                            <p className="text-lg font-bold text-slate-200">{project.tasks?.length || 0}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revisions</p>
                                            <p className="text-lg font-bold text-slate-200">2 / 5</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Milestone Timeline (Simplified) */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Zap className="text-amber-400" size={20} />
                                            <h3 className="text-xl font-bold">Key Milestones</h3>
                                        </div>
                                        <button className="text-xs font-bold text-blue-400 hover:underline">Add Milestone</button>
                                    </div>
                                    <div className="space-y-4">
                                        {project.milestones?.length > 0 ? project.milestones.map((m, idx) => (
                                            <div key={m.id} className="glass-card p-5 flex items-center justify-between border-l-4 border-blue-500/50">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-950/50 flex items-center justify-center border border-slate-800/50 text-slate-400 font-bold text-sm">{idx + 1}</div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-200 text-sm">{m.title}</h4>
                                                        <p className="text-xs text-slate-500">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Set Date'}</p>
                                                    </div>
                                                </div>
                                                <div className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase", m.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                                                    {m.status}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-10 border-2 border-dashed border-slate-800 rounded-3xl text-center">
                                                <p className="text-slate-500 text-sm font-bold italic">No milestones defined yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'tasks' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Production Tasks</h3>
                                    <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all">Export Task List</button>
                                </div>
                                <div className="space-y-3">
                                    {project.tasks?.map(task => (
                                        <div key={task.id} className="glass-card p-5 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer", task.status === 'COMPLETED' ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-700")}>
                                                    {task.status === 'COMPLETED' && <CheckCircle2 size={14} strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <h4 className={cn("font-bold text-sm", task.status === 'COMPLETED' ? "text-slate-500 line-through" : "text-slate-200")}>{task.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                                        <span className={cn(task.priority === 'HIGH' ? "text-red-400" : task.priority === 'MEDIUM' ? "text-amber-400" : "text-blue-400")}>{task.priority}</span>
                                                        <span>•</span>
                                                        <span>Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'ASAP'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-500"><MoreVertical size={16} /></button>
                                        </div>
                                    ))}
                                    {project.tasks?.length === 0 && <p className="text-center py-20 text-slate-500 font-bold italic">No tasks created for this project.</p>}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'team' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[600px] glass-panel p-0 overflow-hidden">
                                <div className="p-6 border-b border-slate-800/60 bg-slate-900/40">
                                    <h3 className="text-lg font-bold">Studio Collaboration</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Internal Team Chat</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {project.comments?.map((c, i) => (
                                        <div key={c.id} className={cn("flex flex-col gap-2 max-w-[80%]", c.userId === user?.id ? "ml-auto items-end" : "items-start")}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {c.userId !== user?.id && <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{c.user?.name || 'Teammate'}</span>}
                                                <span className="text-[10px] font-medium text-slate-600 uppercase tracking-widest leading-none">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className={cn("p-4 rounded-2xl text-sm font-medium leading-relaxed", c.userId === user?.id ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none")}>
                                                {c.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={commentEndRef} />
                                </div>
                                <form onSubmit={handleAddComment} className="p-6 bg-slate-950/50 flex gap-4 border-t border-slate-800/60">
                                    <input
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Sync with your team..."
                                        className="flex-1 bg-slate-800/50 px-5 py-3 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium"
                                    />
                                    <button type="submit" className="bg-blue-600 p-3.5 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"><Send size={18} /></button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Sidebar Info Panels */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Client Context Panel */}
                    <div className="glass-panel p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <User className="text-indigo-400" size={20} />
                            <h3 className="text-lg font-bold">Client Context</h3>
                        </div>
                        <div className="space-y-5">
                            <div className="group">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Company Executive</p>
                                <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{project.clientName || 'Unassigned'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email Address</p>
                                <p className="font-bold text-slate-300 break-all">{project.clientEmail || 'Pending...'}</p>
                            </div>
                            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Editor's Notes</p>
                                <p className="text-xs text-slate-400 italic font-medium leading-[1.6]">{project.clientNotes || 'No specific studio notes for this production yet.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Studio Activity Audit */}
                    <div className="glass-panel p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="text-slate-400" size={20} />
                                <h3 className="text-lg font-bold">Audit Trail</h3>
                            </div>
                            <button className="text-[10px] font-bold text-slate-500 uppercase hover:text-white">View Full</button>
                        </div>
                        <div className="space-y-6">
                            {project.activities?.map((act, i) => (
                                <div key={act.id} className="relative flex gap-4 pl-4 border-l border-slate-800 py-1">
                                    <div className="absolute -left-[5.5px] top-2.5 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900 group-hover:bg-blue-500 transition-colors" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-300">
                                            {act.action.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium">{act.details}</p>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">
                                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {project.activities?.length === 0 && <p className="text-center text-xs text-slate-600 italic">Project initialized recently.</p>}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
