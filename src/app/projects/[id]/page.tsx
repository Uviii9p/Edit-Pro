'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Calendar, Clock, IndianRupee, MessageSquare,
    MoreVertical, Plus, Send, Settings,
    ChevronRight, CheckCircle2, AlertCircle,
    History, Zap, FileText, Share2,
    Trash2, Edit3, User, List, X
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
    inviteCode?: string;
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'team' | 'files'>('overview');
    const [comment, setComment] = useState('');
    const user = useAuthStore((state: any) => state.user);
    const { notify } = useNotifications();
    const commentEndRef = useRef<HTMLDivElement>(null);
    const [hasMounted, setHasMounted] = useState(false);
    
    // UI State
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [taskColumn, setTaskColumn] = useState<string>('PENDING');

    const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '', status: 'PENDING' });
    const [taskForm, setTaskForm] = useState({ title: '', priority: 'MEDIUM', deadline: '', status: 'PENDING' });
    const [settingsForm, setSettingsForm] = useState({ name: '', description: '', status: '' });
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        setHasMounted(true);
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'team') {
            commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            
            // Premium polling for real-time feel
            const interval = setInterval(() => {
                fetchProject();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [project?.comments, activeTab]);

    const fetchProject = async () => {
        try {
            const resp = await api.get(`/projects/${id}`);
            setProject(resp.data);
            // Fetch team members
            try {
                const membersResp = await api.get(`/projects/${id}/members`);
                setMembers(membersResp.data);
            } catch { setMembers([]); }
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
            notify('Synced', 'Production note added.', 'success');
            setComment('');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/milestones`, milestoneForm);
            setIsMilestoneModalOpen(false);
            setMilestoneForm({ title: '', dueDate: '', status: 'PENDING' });
            notify('Milestone Set', 'A new production goal has been locked in.', 'success');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleMilestone = async (milestoneId: string, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
            await api.put(`/projects/${id}/milestones/${milestoneId}`, { status: nextStatus });
            notify('Timeline Updated', 'Production stage status synchronized.', 'success');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteMilestone = async (milestoneId: string) => {
        if (!confirm('Are you sure you want to remove this milestone?')) return;
        try {
            await api.delete(`/projects/${id}/milestones/${milestoneId}`);
            notify('Milestone Removed', 'Goal has been purged from the roadmap.', 'warning');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/tasks`, taskForm);
            setIsTaskModalOpen(false);
            setTaskForm({ title: '', priority: 'MEDIUM', deadline: '', status: 'PENDING' });
            notify('Task Assigned', 'New asset production is now in the pipeline.', 'success');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, nextStatus: string) => {
        try {
            await api.put(`/projects/${id}/tasks/${taskId}`, { status: nextStatus });
            notify('Pipeline Sync', `Task moved to ${nextStatus.replace('_', ' ')}`, 'success');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Remove this task from the production pipeline?')) return;
        try {
            await api.delete(`/projects/${id}/tasks/${taskId}`);
            notify('Task Removed', 'Production task has been purged.', 'warning');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${id}`, settingsForm);
            setIsSettingsModalOpen(false);
            notify('Settings Saved', 'Project configuration updated.', 'success');
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const copyInviteCode = () => {
        if (!project?.inviteCode) return;
        navigator.clipboard.writeText(project.inviteCode);
        notify('Copied', 'Invite code is on the clipboard.', 'success');
    };

    useEffect(() => {
        if (project) {
            setSettingsForm({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'PLANNING'
            });
        }
    }, [project]);

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'PLANNING': return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
            case 'EDITING': return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
            case 'REVIEW': return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
            case 'DELIVERED': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
            default: return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
        }
    };

    const formatDate = (dateString: string | undefined, includeTime: boolean = false) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Invalid Date';
        return (
            <span suppressHydrationWarning>
                {includeTime 
                    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString()}
            </span>
        );
    };

    if (!hasMounted || loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-10 bg-slate-800 rounded-lg w-1/4"></div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-[600px] bg-slate-800/30 rounded-3xl"></div>
                <div className="h-[600px] bg-slate-800/30 rounded-3xl"></div>
            </div>
        </div>
    );

    if (!project) return <div className="p-8 text-center text-slate-400">Project Not Found</div>;

    const currentStatus = project.status || 'PLANNING';
    const theme = getStatusTheme(currentStatus);

    return (
        <div className="p-4 md:p-10 space-y-10">
            {/* Header / Breadcrumbs */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/projects')}>Projects</span>
                        <ChevronRight size={12} />
                        <span className="text-slate-300">{project.name || 'Studio Project'}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <h1 className="text-4xl font-extrabold tracking-tight">{project.name || 'Untitled Production'}</h1>
                        <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm", theme.color, theme.bg, theme.border)}>
                            {currentStatus.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsShareModalOpen(true)}
                        className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl transition-all"
                    ><Share2 size={20} /></button>
                    <button 
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl transition-all"
                    ><Settings size={20} /></button>
                    <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all"
                    >
                        <Plus size={20} /> New Asset
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-2 border-b border-slate-800/60 pb-px">
                {(['overview', 'tasks', 'timeline', 'team', 'files'] as const).map(tab => (
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
                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
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
                                {/* Dashboard Hero */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 glass-panel p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-600/10 transition-all duration-700" />
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                                                    <Zap size={20} />
                                                </div>
                                                <h3 className="text-xl font-bold">Studio Velocity</h3>
                                            </div>
                                            <div className="flex items-end gap-6">
                                                <div className="text-5xl font-black text-white tracking-tighter">
                                                    {Math.round(((project.tasks?.filter(t => t.status === 'COMPLETED').length || 0) / (project.tasks?.length || 1)) * 100)}%
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${((project.tasks?.filter(t => t.status === 'COMPLETED').length || 0) / (project.tasks?.length || 1)) * 100}%` }}
                                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Overall Production Completion</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-panel p-8 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Deadline</p>
                                            <p className="text-2xl font-black text-slate-100 uppercase tracking-tight">{formatDate(project.deadline)}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-800/50">
                                            <div className="flex items-center gap-2 text-amber-400">
                                                <Clock size={14} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Deliver in 12 Days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Brief & Stats */}
                                <div className="glass-panel p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-indigo-400" size={20} />
                                            <h3 className="text-xl font-bold">Production Roadmap</h3>
                                        </div>
                                        <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-500"><Edit3 size={16} /></button>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed font-medium text-lg">{project.description || 'Initialize your production brief to start tracking milestones and assets.'}</p>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 border-t border-slate-800/50">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Budget Cap</p>
                                            <div className="flex items-center gap-2">
                                                <IndianRupee size={14} className="text-emerald-500" />
                                                <p className="text-xl font-black text-white tracking-tight">{project.budget?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Team Focus</p>
                                            <p className="text-xl font-black text-white tracking-tight">{members.length} Members</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Assets Ready</p>
                                            <p className="text-xl font-black text-blue-400 tracking-tight">{project.tasks?.filter(t => t.status === 'COMPLETED').length || 0}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Studio Health</p>
                                            <p className="text-xl font-black text-emerald-400 tracking-tight">Optimal</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Milestone Pulse */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <History className="text-amber-500" size={20} />
                                            <h3 className="text-xl font-bold uppercase tracking-tight">Master Timeline Pulse</h3>
                                        </div>
                                        <button onClick={() => setActiveTab('timeline')} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Expand Roadmap</button>
                                    </div>
                                    <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                        {project.milestones?.length > 0 ? project.milestones.map((m, idx) => (
                                            <div key={m.id} className={cn(
                                                "min-w-[280px] p-6 rounded-3xl border transition-all shrink-0",
                                                m.status === 'COMPLETED' ? "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5" : "glass-panel border-slate-800/80"
                                            )}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", m.status === 'COMPLETED' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-600")} />
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Phase {idx + 1}</span>
                                                    </div>
                                                    {m.status === 'COMPLETED' && <CheckCircle2 size={16} className="text-emerald-400" />}
                                                </div>
                                                <h4 className="font-bold text-slate-100 mb-1">{m.title}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(m.dueDate)}</p>
                                            </div>
                                        )) : (
                                            <div className="w-full py-12 text-center glass-panel border-dashed">
                                                <p className="text-slate-500 italic font-bold">No active milestones. Create your first production goal.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'tasks' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-1">Production Pipeline</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Syncing {project.tasks?.length || 0} Assets Across Studio</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setIsTaskModalOpen(true)}
                                            className="px-6 py-3 bg-blue-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                                        ><Plus size={18} /> Add Production Item</button>
                                    </div>
                                </div>

                                {/* Kanban Board UI */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const).map(col => (
                                        <div key={col} className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        col === 'PENDING' ? "bg-slate-500" :
                                                        col === 'IN_PROGRESS' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" :
                                                        col === 'REVIEW' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500"
                                                    )} />
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                        {col === 'PENDING' ? 'Pipeline' : col === 'IN_PROGRESS' ? 'Active Edit' : col === 'REVIEW' ? 'Studio Review' : 'Final Cut'}
                                                    </h4>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-md">
                                                    {project.tasks?.filter(t => t.status === col).length || 0}
                                                </span>
                                            </div>

                                            <div className="space-y-3 min-h-[400px]">
                                                {project.tasks?.filter(t => t.status === col).map(task => (
                                                    <motion.div 
                                                        layoutId={task.id}
                                                        key={task.id} 
                                                        className="glass-card p-5 group hover:border-blue-500/40 cursor-grab active:cursor-grabbing transition-all"
                                                    >
                                                        <div className="flex justify-between items-start gap-2 mb-3">
                                                            <h5 className="font-bold text-sm text-slate-100 leading-tight">{task.title}</h5>
                                                            <div className="flex gap-1 shrink-0">
                                                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 px-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all"><Trash2 size={12} /></button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between mt-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                                                                    task.priority === 'HIGH' ? "bg-red-500/10 text-red-500" :
                                                                    task.priority === 'MEDIUM' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                                                                )}>
                                                                    {task.priority}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-slate-600 uppercase" suppressHydrationWarning>{formatDate(task.deadline)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    onClick={() => {
                                                                        const statuses = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
                                                                        const currentIdx = statuses.indexOf(task.status);
                                                                        if (currentIdx < statuses.length - 1) handleUpdateTaskStatus(task.id, statuses[currentIdx + 1]);
                                                                    }}
                                                                    className="p-1.5 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-400 hover:text-white transition-all transform active:scale-95"
                                                                >
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                
                                                <button 
                                                    onClick={() => { setIsTaskModalOpen(true); setTaskColumn(col); }}
                                                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 hover:text-slate-400 hover:border-slate-700 hover:bg-slate-800/20 text-xs font-bold transition-all"
                                                >
                                                    + Push to Pipeline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'timeline' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                <div className="flex justify-between items-center bg-slate-900/40 p-8 rounded-[32px] border border-slate-800/60 backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-black text-white tracking-tighter italic mb-1 uppercase">MASTER ROADMAP</h3>
                                        <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Zap size={14} /> Studio Velocity: {project.milestones?.filter(m => m.status === 'COMPLETED').length || 0} / {project.milestones?.length || 0} Goalposts
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsMilestoneModalOpen(true)}
                                        className="relative z-10 px-8 py-4 bg-amber-500 rounded-2xl font-black text-slate-950 uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 transform active:scale-95"
                                    >Set New Milestone</button>
                                </div>

                                <div className="relative pl-12 space-y-16 py-4 before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-1 before:bg-gradient-to-b before:from-amber-500/50 before:via-blue-500/50 before:to-transparent">
                                    {project.milestones?.map((m, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={m.id} 
                                            className="relative group/ms"
                                        >
                                            <div className={cn(
                                                "absolute -left-[37px] top-6 w-5 h-5 rounded-full border-[5px] border-slate-950 z-10 transition-all duration-500",
                                                m.status === 'COMPLETED' ? "bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-125" : "bg-slate-800"
                                            )} />
                                            <div className={cn(
                                                "glass-panel p-8 transition-all duration-500 relative group-hover/ms:translate-x-2",
                                                m.status === 'COMPLETED' ? "bg-amber-500/[0.03] border-amber-500/20 shadow-xl shadow-amber-500/5" : "hover:border-slate-600"
                                            )}>
                                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Phase {i + 1}</span>
                                                            <div className="h-px w-8 bg-slate-800" />
                                                            <span suppressHydrationWarning className="text-[10px] font-black text-slate-500 font-mono tracking-widest">{formatDate(m.dueDate)}</span>
                                                        </div>
                                                        <h4 className="text-2xl font-black text-slate-100 tracking-tight leading-none">{m.title}</h4>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic border",
                                                            m.status === 'COMPLETED' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-slate-800/50 text-slate-600 border-slate-700/50"
                                                        )}>
                                                            {m.status}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleToggleMilestone(m.id, m.status)}
                                                                className={cn(
                                                                    "p-3 rounded-xl transition-all shadow-xl",
                                                                    m.status === 'COMPLETED' ? "bg-slate-800 text-slate-500 hover:text-white" : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                                                )}
                                                            ><CheckCircle2 size={18} /></button>
                                                            <button 
                                                                onClick={() => handleDeleteMilestone(m.id)}
                                                                className="p-3 bg-slate-900/50 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-xl transition-all border border-slate-800/50"
                                                            ><Trash2 size={18} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {project.milestones?.length === 0 && (
                                        <div className="py-24 text-center glass-panel border-dashed opacity-60">
                                            <p className="text-lg font-bold text-slate-500 italic mb-2 tracking-tight">STILL MAPPING THE ROUTE</p>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-[0.4em]">NO MILESTONES DEFINED</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'team' && (
                            <div className="grid grid-cols-1 xl:grid-cols-4 h-[750px] glass-panel p-0 overflow-hidden relative shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] border-white/10 selection:bg-blue-500/40">
                                {/* Left Side: Chat Area */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="xl:col-span-3 flex flex-col h-full border-r border-white/5 relative bg-slate-950/20"
                                >
                                    {/* Digital Grid Overlay */}
                                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
                                    
                                    {/* Chat Header */}
                                    <div className="p-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl flex justify-between items-center relative z-20">
                                        <div className="flex items-center gap-8">
                                            <div className="relative group">
                                                <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                                                    <MessageSquare size={32} className="text-white" />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-950 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-4">
                                                    Studio Comms
                                                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black not-italic text-blue-400 tracking-[0.3em]">SECURE</span>
                                                </h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase bg-blue-400/5 px-2 py-0.5 rounded">DIRECTIVES_CHANNEL</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                                    <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase italic">{project.comments?.length || 0} production notes</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex items-center bg-slate-900/40 p-2 rounded-[22px] border border-white/5 shadow-inner">
                                                <button title="Attach Directive" className="p-3 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all active:scale-90"><Plus size={20} /></button>
                                                <div className="w-px h-10 bg-white/5 mx-2" />
                                                <button title="System Diagnostics" className="p-3 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all active:scale-90"><Zap size={20} /></button>
                                            </div>
                                            <button 
                                                onClick={copyInviteCode}
                                                className="p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] shadow-[0_20px_40px_-5px_rgba(37,99,235,0.4)] transition-all transform active:scale-95 group"
                                            >
                                                <Share2 size={24} className="group-hover:rotate-12 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pinned Directives HUD */}
                                    <div className="px-10 py-5 bg-blue-600/[0.03] border-b border-blue-500/10 flex items-center gap-6 overflow-x-auto scrollbar-hide">
                                        <div className="flex items-center gap-3 shrink-0 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 shadow-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">HIGH PRIORITY: Final Export by 18:00</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 bg-slate-800/40 px-4 py-2 rounded-xl border border-white/5 opacity-40 hover:opacity-100 transition-opacity">
                                            <FileText size={14} className="text-slate-500" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Roadmap Synchronized</span>
                                        </div>
                                    </div>
                                    
                                    {/* Messages Feed */}
                                    <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide relative z-10">
                                        {project.comments?.map((c, i) => {
                                            const isMe = c.userId === user?.id;
                                            const colors = ['from-blue-600 to-blue-400', 'from-emerald-600 to-emerald-400', 'from-purple-600 to-purple-400', 'from-amber-600 to-amber-400'];
                                            const userColor = colors[Math.abs(c.userId?.length || 0) % colors.length];
                                            
                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={c.id} 
                                                    className={cn("flex gap-5 group", isMe ? "flex-row-reverse" : "flex-row")}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-[18px] bg-gradient-to-br flex items-center justify-center text-sm font-black text-white shrink-0 border-2 border-slate-950 shadow-2xl relative transition-transform group-hover:scale-105",
                                                            isMe ? "from-blue-600 to-blue-700" : userColor
                                                        )}>
                                                            {(c.user?.name || 'T')[0].toUpperCase()}
                                                            {!isMe && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className={cn("space-y-2.5 max-w-[75%]", isMe ? "items-end text-right" : "items-start text-left")}>
                                                        <div className="flex items-center gap-3 px-1">
                                                            <span className={cn("text-[11px] font-black uppercase tracking-[0.1em]", isMe ? "text-blue-400" : "text-slate-300")}>
                                                                {isMe ? 'YOU' : c.user?.name}
                                                            </span>
                                                            <span className="text-[9px] font-black text-slate-600 uppercase italic">
                                                                {formatDate(c.createdAt, true)}
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <div className={cn(
                                                                "px-6 py-5 rounded-[28px] text-[14px] leading-relaxed shadow-3xl transition-all duration-300 border backdrop-blur-xl relative group/msg",
                                                                isMe 
                                                                    ? "bg-blue-600/90 text-white rounded-tr-none border-blue-400/30 shadow-blue-500/10" 
                                                                    : "bg-slate-900/90 text-slate-100 rounded-tl-none border-white/5 hover:border-white/10"
                                                            )}>
                                                                {/* Optional Glass Shine */}
                                                                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                <p className="font-medium tracking-tight overflow-hidden whitespace-pre-wrap">{c.content}</p>
                                                                
                                                                {/* Message Controls (Hover) */}
                                                                <div className={cn(
                                                                    "absolute -bottom-4 bg-slate-800 border border-white/10 rounded-xl px-2 py-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-2xl z-30",
                                                                    isMe ? "right-2" : "left-2"
                                                                )}>
                                                                    <button className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">👍</button>
                                                                    <button className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">🔥</button>
                                                                    <button className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">🚀</button>
                                                                    <div className="w-px h-3 bg-white/10 mx-1" />
                                                                    <button className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={12} /></button>
                                                                </div>
                                                            </div>
                                                            {isMe && (
                                                                <div className="mt-1 flex justify-end gap-1 opacity-40">
                                                                    <CheckCircle2 size={10} className="text-blue-400" />
                                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">SEEN</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        {project.comments?.length === 0 && (
                                            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40">
                                                <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                                                    <MessageSquare size={40} className="text-slate-700" />
                                                </div>
                                                <p className="text-lg font-black text-slate-600 uppercase tracking-tighter italic">Initializing Secure Frequency</p>
                                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2">Sync requested</p>
                                            </div>
                                        )}
                                        <div ref={commentEndRef} />
                                    </div>

                                    {/* Action Suggestions (Floating) */}
                                    <AnimatePresence>
                                        {comment.startsWith('/') && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute bottom-[110px] left-10 right-10 bg-slate-900/90 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl z-40"
                                            >
                                                <div className="flex items-center gap-4 mb-3 px-2 border-b border-white/5 pb-2">
                                                    <Zap size={14} className="text-blue-500" />
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Available Directives</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {['/task [title]', '/deadline [date]', '/urgent [message]', '/review @user'].map(cmd => (
                                                        <button key={cmd} className="w-full flex justify-between items-center p-3 hover:bg-blue-600/10 rounded-xl transition-all group/cmd">
                                                            <span className="font-mono text-sm text-slate-300 group-hover/cmd:text-white">{cmd}</span>
                                                            <span className="text-[10px] font-bold text-slate-600 uppercase">SYNTAX</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Input Section */}
                                    <div className="p-8 bg-slate-950/40 backdrop-blur-3xl relative z-20">
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-800/50 to-transparent" />
                                        
                                        <div className="flex items-center gap-4 mb-4 opacity-50 hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"><FileText size={18} /></button>
                                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"><AlertCircle size={18} /></button>
                                            <div className="w-px h-4 bg-white/10" />
                                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors cursor-default"><User size={18} /> <span className="text-[10px] font-black uppercase ml-1">@</span></button>
                                        </div>

                                        <form onSubmit={handleAddComment} className="flex gap-4">
                                            <div className="flex-1 relative group bg-slate-900 p-1 rounded-[32px] border border-white/5 focus-within:border-blue-500/30 transition-all shadow-inner">
                                                <input
                                                    value={comment}
                                                    onChange={e => setComment(e.target.value)}
                                                    placeholder="Translate ideas into directives (type / for commands)..."
                                                    className="w-full bg-transparent px-8 py-5 rounded-[28px] outline-none font-bold text-slate-100 placeholder:text-slate-600 italic"
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black tracking-widest border border-blue-500/20 rounded-lg hidden sm:block">SYNC ACTIVE</div>
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={!comment.trim()}
                                                className="bg-blue-600 p-6 rounded-[30px] hover:bg-blue-500 disabled:opacity-50 shadow-[0_15px_30px_rgba(37,99,235,0.3)] transition-all transform active:scale-95 group/send"
                                            >
                                                <Send size={26} className="text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>

                                {/* Right Side: Production Voice & Metadata (XL Only) */}
                                <aside className="hidden xl:flex flex-col h-full bg-slate-950/40 p-8 space-y-8 relative z-20">
                                    <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none" />
                                    
                                    <div className="space-y-10">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Voice Matrix</h4>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">ENCRYPTED</span>
                                            </div>
                                        </div>
                                        
                                        <div className="relative group/voice">
                                            {/* Simulated Audio Waveform */}
                                            <div className="absolute -top-6 left-0 right-0 h-1 flex items-end gap-0.5 opacity-20 pointer-events-none group-hover/voice:opacity-50 transition-opacity">
                                                {[...Array(40)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                                                        transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                                                        className="flex-1 bg-blue-500"
                                                    />
                                                ))}
                                            </div>

                                            <div className="p-10 bg-slate-900/60 rounded-[40px] border border-white/5 space-y-8 flex flex-col items-center shadow-2xl overflow-hidden relative">
                                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                                                
                                                <div className="w-32 h-32 rounded-full bg-blue-600/10 border-2 border-blue-500/20 flex items-center justify-center relative group-hover/voice:scale-105 transition-transform duration-700">
                                                    <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-pulse opacity-40" />
                                                    <div className="absolute inset-4 rounded-full border border-blue-400/20 animate-ping opacity-20" />
                                                    <Zap size={48} className="text-blue-500 opacity-60 group-hover/voice:opacity-100 group-hover/voice:scale-110 transition-all" />
                                                </div>
                                                
                                                <div className="text-center space-y-4">
                                                    <div>
                                                        <h5 className="text-lg font-black text-white uppercase tracking-tighter italic">Studio Link</h5>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase mt-2 tracking-[0.2em]">Frequency: 144.2 MHZ</p>
                                                    </div>
                                                    <button className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-[20px] text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5 active:scale-95 shadow-xl hover:shadow-blue-500/10">Synchronize Audio</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Quick Directives</h4>
                                        <div className="space-y-3">
                                            {['SYNC_TIMELINE', 'PURGE_LOGS', 'MASTER_ASSET_READY'].map(act => (
                                                <button key={act} className="w-full p-4 bg-slate-900/40 hover:bg-slate-900 rounded-2xl border border-white/5 text-left group transition-all">
                                                    <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-400 transition-colors">{act}</p>
                                                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Automated Action</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1" />
                                    
                                    <div className="p-6 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-[32px] border border-blue-500/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Zap size={18} className="text-blue-400" />
                                            <p className="text-xs font-black text-white tracking-widest">STUDIO AI</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">System monitoring active. All nodes synchronized within 4ms latency.</p>
                                    </div>
                                </aside>
                            </div>
                        )}


                        {activeTab === 'files' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div className="flex justify-between items-center bg-slate-900/40 p-8 rounded-[32px] border border-slate-800/60 backdrop-blur-xl">
                                    <div>
                                        <h3 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase italic">Studio Vault</h3>
                                        <p className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Cloud Infrastructure for Production Assets</p>
                                    </div>
                                    <button className="px-8 py-4 bg-slate-100 rounded-2xl font-black text-slate-950 uppercase tracking-widest text-xs hover:bg-white transition-all transform active:scale-95 shadow-2xl">Upload Asset</button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(idx => (
                                        <div key={idx} className="glass-panel p-6 group cursor-pointer hover:border-blue-500/30 transition-all">
                                            <div className="w-full aspect-video bg-slate-950 rounded-[20px] mb-4 overflow-hidden border border-slate-800/50 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <FileText size={40} className="text-slate-800 group-hover:text-blue-900 group-hover:scale-110 transition-all" />
                                                </div>
                                                <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[9px] font-black tracking-widest text-slate-400 uppercase">RAW_FILE</div>
                                            </div>
                                            <h5 className="font-bold text-slate-200 text-sm mb-1 truncate">Production_Asset_{idx}.mp4</h5>
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                <span>128 MB</span>
                                                <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 hover:border-blue-500/50 transition-all cursor-pointer bg-slate-800/10">
                                        <Plus size={32} className="text-slate-600 mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Files</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Sidebar Info Panels */}
                <aside className="lg:col-span-4 space-y-10">
                    {/* Client Context Panel */}
                    <div className="glass-panel p-10 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                                    <User size={22} />
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Client Context</h3>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div className="group/item">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Company Executive</p>
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-default">
                                    <p className="font-extrabold text-slate-100 text-lg tracking-tight">{project?.clientName || 'Unassigned'}</p>
                                </div>
                            </div>
                            <div className="group/item">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Digital Coordinates</p>
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-default">
                                    <p className="font-bold text-slate-400 text-sm break-all font-mono tracking-tighter">{project?.clientEmail || 'PROJECT_PENDING@STUDIO.IO'}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-blue-600/[0.03] rounded-3xl border border-blue-500/10 relative group/notes">
                                <div className="absolute -top-3 -right-3 p-2 bg-slate-900 border border-slate-800 rounded-xl text-blue-500 opacity-0 group-hover/notes:opacity-100 transition-opacity">
                                    <Edit3 size={14} />
                                </div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Executive Directives</p>
                                <p className="text-sm text-slate-300 italic font-medium leading-[1.8] tracking-tight">{project?.clientNotes || 'Establish core production objectives and client preferences to synchronize the creative pipeline.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Team Members Panel */}
                    <div className="glass-panel p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/[0.02] blur-[80px] rounded-full" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                                    <MessageSquare size={22} />
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Active Nodes</h3>
                            </div>
                            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-500 tracking-widest">{members.length} OPS</div>
                        </div>
                        <div className="space-y-4 relative z-10">
                            {members.map((member: any) => (
                                <motion.div 
                                    whileHover={{ x: 5 }}
                                    key={member.id} 
                                    className="flex items-center gap-4 p-4 bg-slate-950/30 rounded-2xl border border-white/5 hover:bg-slate-900/50 hover:border-blue-500/20 transition-all cursor-pointer group"
                                >
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:rotate-6 transition-transform">
                                            {(member.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-slate-100 text-sm tracking-tight leading-tight uppercase">{member.name}</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{member.role || 'Contributor'}</p>
                                    </div>
                                    {member.role === 'OWNER' ? (
                                        <span className="text-[8px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">MASTER</span>
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-700 hover:text-slate-400 transition-colors">
                                            <MoreVertical size={16} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {members.length === 0 && (
                                <div className="py-10 text-center border-2 border-dashed border-slate-800/50 rounded-3xl">
                                    <p className="text-sm font-bold text-slate-600 italic">No nodes connected yet.</p>
                                </div>
                            )}
                            <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-all transform active:scale-[0.98]">
                                Sync All Members
                            </button>
                        </div>
                    </div>

                    {/* Studio Activity Audit */}
                    <div className="glass-panel p-10 space-y-8 relative overflow-hidden bg-slate-950/60 transition-all duration-500 hover:shadow-blue-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-500/10 rounded-2xl text-slate-400 border border-slate-500/20">
                                    <History size={22} />
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Ledger Audit</h3>
                            </div>
                            <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/50 pb-0.5">Full History</button>
                        </div>
                        <div className="space-y-8 relative z-10">
                            {project.activities?.slice(0, 5).map((act, i) => (
                                <div key={act.id} className="relative flex gap-6 pl-4 font-mono">
                                    {/* Timeline Line */}
                                    {i < (project.activities?.length - 1) && (
                                        <div className="absolute left-[18.5px] top-6 bottom-[-32px] w-px bg-gradient-to-b from-slate-700 via-slate-800 to-transparent" />
                                    )}
                                    <div className="relative z-10">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-colors duration-500 mt-1">
                                            <div className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors duration-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <p className="text-[11px] font-black text-slate-300 tracking-tighter uppercase">
                                                {(act.action || '').replace(/_/g, ' ')}
                                            </p>
                                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{formatDate(act.createdAt, true)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px] group-hover:text-slate-400 transition-colors">{act.details}</p>
                                    </div>
                                </div>
                            ))}
                            {project.activities?.length === 0 && (
                                <div className="space-y-4 flex flex-col items-center py-6 opacity-40">
                                    <div className="w-1 h-12 bg-gradient-to-t from-slate-700 to-transparent rounded-full" />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Ledger Empty</p>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-800/50">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Real-time Tracking Enabled</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* CREATE MILESTONE MODAL */}
            <AnimatePresence>
                {isMilestoneModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsMilestoneModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">New Milestone</h2>
                                <button onClick={() => setIsMilestoneModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateMilestone} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Milestone Goal</label>
                                    <input
                                        placeholder="e.g. First Cut Completion"
                                        value={milestoneForm.title}
                                        onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Target Date</label>
                                    <input
                                        type="date"
                                        value={milestoneForm.dueDate}
                                        onChange={e => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Record Milestone</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CREATE TASK MODAL */}
            <AnimatePresence>
                {isTaskModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsTaskModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-blue-400">Add Production Task</h2>
                                <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateTask} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Task Title</label>
                                    <input
                                        placeholder="e.g. Color Grade Intro"
                                        value={taskForm.title}
                                        onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Priority</label>
                                        <select
                                            value={taskForm.priority}
                                            onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                                            className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Deadline</label>
                                        <input
                                            type="date"
                                            value={taskForm.deadline}
                                            onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                            className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">Add to Pipeline</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SHARE MODAL */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsShareModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Share2 className="text-blue-400" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Invite to Studio</h2>
                                <p className="text-slate-400 text-sm font-medium">Share this code with your teammates to collaborate on this production.</p>
                                
                                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 mt-8 mb-4">
                                    <div className="flex-1 text-center font-black tracking-[0.3em] text-xl text-blue-400 pl-4 uppercase">{project?.inviteCode}</div>
                                    <button 
                                        onClick={copyInviteCode}
                                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-300"
                                    >Copy</button>
                                </div>
                                
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest py-4 italic">Security: Only people with this code can join the team chat.</p>

                                <button 
                                    onClick={() => setIsShareModalOpen(false)}
                                    className="w-full py-4 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest pt-4"
                                >Dismiss</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SETTINGS MODAL */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsSettingsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <Settings className="text-slate-400" size={20} />
                                    <h2 className="text-2xl font-bold">Project Settings</h2>
                                </div>
                                <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleUpdateSettings} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Display Name</label>
                                    <input
                                        value={settingsForm.name}
                                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Production Brief</label>
                                    <textarea
                                        rows={4}
                                        value={settingsForm.description}
                                        onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Production Status</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                        {(['PLANNING', 'EDITING', 'REVIEW', 'DELIVERED'] as const).map(status => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setSettingsForm({ ...settingsForm, status: status })}
                                                className={cn(
                                                    "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                    settingsForm.status === status ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500"
                                                )}
                                            >{status}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-all"
                                    >Cancel</button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                    >Save Changes</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
