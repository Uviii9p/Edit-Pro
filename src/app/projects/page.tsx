'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Plus, Search, Filter, MoreVertical,
    Calendar, CheckCircle2, Clock,
    ArrowRight, MessageSquare, IndianRupee,
    ChevronRight, Trash2, Edit3, X, UserPlus, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'PLANNING' | 'EDITING' | 'REVIEW' | 'DELIVERED';
    budget: number;
    deadline: string;
    revisionCount: number;
    clientName?: string;
    clientEmail?: string;
    clientAddress?: string;
    clientPhone?: string;
    clientNotes?: string;
}

type ProjectStatus = 'PLANNING' | 'EDITING' | 'REVIEW' | 'DELIVERED';

export default function ProjectsPage() {
    const router = useRouter();
    const { notify } = useNotifications();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        budget: 0,
        deadline: '',
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        clientPhone: ''
    });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        fetchProjects();
    }, []);

    // Close menus on click outside
    useEffect(() => {
        const handler = () => setActiveMenu(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    const fetchProjects = async () => {
        try {
            const resp = await api.get('/projects');
            setProjects(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setIsCreateModalOpen(false);
            setNewProject({
                name: '', description: '', budget: 0, deadline: '',
                clientName: '', clientEmail: '', clientAddress: '', clientPhone: ''
            });
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;
        try {
            await api.put(`/projects/${editingProject.id}`, {
                name: editingProject.name,
                description: editingProject.description,
                budget: editingProject.budget,
                deadline: editingProject.deadline,
                status: editingProject.status,
                clientName: editingProject.clientName,
                clientEmail: editingProject.clientEmail,
                clientAddress: editingProject.clientAddress,
                clientPhone: editingProject.clientPhone,
            });
            setEditingProject(null);
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateStatus = async (id: string, status: ProjectStatus) => {
        try {
            await api.put(`/projects/${id}`, { status });
            setActiveMenu(null);
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLANNING': return 'text-slate-400 bg-slate-800';
            case 'EDITING': return 'text-blue-400 bg-blue-400/10';
            case 'REVIEW': return 'text-amber-400 bg-amber-400/10';
            case 'DELIVERED': return 'text-emerald-400 bg-emerald-400/10';
            default: return 'text-slate-400 bg-slate-800';
        }
    };

    const getProgressPercent = (status: string) => {
        switch (status) {
            case 'PLANNING': return 15;
            case 'EDITING': return 45;
            case 'REVIEW': return 75;
            case 'DELIVERED': return 100;
            default: return 0;
        }
    };

    const handleJoinProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/projects/join', { code: joinCode });
            setIsJoinModalOpen(false);
            setJoinCode('');
            notify('Access Granted', 'Welcome to the studio production.', 'success');
            router.push(`/projects/${data.project.id}`);
        } catch (err: any) {
            notify('Authentication Error', err.response?.data?.message || 'Invalid invite code.', 'error');
        }
    };

    const getProgressColor = (status: string) => {
        switch (status) {
            case 'PLANNING': return 'bg-slate-500';
            case 'EDITING': return 'bg-blue-500';
            case 'REVIEW': return 'bg-amber-500';
            case 'DELIVERED': return 'bg-emerald-500';
            default: return 'bg-slate-500';
        }
    };

    const getDaysLeft = (deadline: string) => {
        if (!deadline) return null;
        const d = new Date(deadline);
        if (isNaN(d.getTime())) return <span className="text-slate-600 italic">Invalid Date</span>;
        const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return <span className="text-red-400 font-black">{Math.abs(diff)}d OVERDUE</span>;
        if (diff === 0) return <span className="text-amber-400 font-black">DUE TODAY</span>;
        return <span suppressHydrationWarning>{diff} days left</span>;
    };

    const filteredProjects = projects.filter(p =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto min-h-screen">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Vault: ACTIVE</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Studio Productions
                    </h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] opacity-80">Synchronizing creative contracts and cinematic deliveries.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto relative z-10">
                    <div className="relative w-full md:w-96 group">
                        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Locate production node..."
                            className="w-full bg-slate-900/40 backdrop-blur-2xl border border-white/5 pl-16 pr-8 py-5 rounded-[28px] text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all font-medium text-white placeholder:text-slate-700 placeholder:italic"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="flex-1 md:flex-none px-8 py-5 bg-slate-900/60 hover:bg-slate-800 text-slate-500 hover:text-blue-400 rounded-[24px] border border-white/5 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-2xl"
                        >
                            <UserPlus size={18} /> Join Node
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-[2] md:flex-none bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 text-white active:scale-95"
                        >
                            <Plus size={22} className="stroke-[3]" /> NEW PRODUCTION
                        </button>
                    </div>
                </div>
            </header>

            {/* Studio Metrics Quickbar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Active', value: projects.length, icon: Hash, color: 'blue' },
                    { label: 'In Production', value: projects.filter(p => p.status === 'EDITING').length, icon: Edit3, color: 'blue' },
                    { label: 'Awaiting Review', value: projects.filter(p => p.status === 'REVIEW').length, icon: MessageSquare, color: 'amber' },
                    { label: 'Final Cuts', value: projects.filter(p => p.status === 'DELIVERED').length, icon: CheckCircle2, color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-3xl flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-2xl", 
                            stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                            stat.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                        )}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-xl font-black text-white">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {!hasMounted ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[400px] bg-slate-900/30 rounded-[3rem] animate-pulse border border-white/5" />
                    ))
                ) : filteredProjects.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-40 bg-slate-950/20 border-2 border-slate-900/50 border-dashed rounded-[4rem] space-y-8">
                        <div className="w-32 h-32 bg-slate-900/50 rounded-[2.5rem] flex items-center justify-center text-slate-700 shadow-inner ring-1 ring-white/5">
                            <Calendar size={56} className="opacity-10 translate-y-3" />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Studio Vault is Offline</h3>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No active productions found matching your residency.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-12 py-5 bg-slate-900 hover:bg-slate-800 rounded-[24px] font-black text-[10px] uppercase tracking-[0.4em] transition-all border border-white/10 shadow-3xl active:scale-95"
                        >Launch Initial Production</button>
                    </div>
                ) : filteredProjects.map((project, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.08, ease: [0.23, 1, 0.32, 1] }}
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="group bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] hover:border-blue-500/30 transition-all hover:bg-slate-900/40 relative cursor-pointer overflow-hidden p-10 shadow-2xl hover:shadow-blue-500/10 ring-1 ring-white/10"
                    >
                        {/* Status Label */}
                        <div className="flex justify-between items-start mb-10">
                            <div className={cn(
                                "px-5 py-2 rounded-[20px] text-[9px] font-black uppercase tracking-[0.3em] shadow-inner ring-1 ring-white/10", 
                                getStatusColor(project.status || 'PLANNING')
                            )}>
                                {(project.status || 'PLANNING').replace('_', ' ')}
                            </div>
                            
                            <div className="relative">
                                <button
                                    onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === project.id ? null : project.id); }}
                                    className="w-12 h-12 flex items-center justify-center bg-slate-900/80 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:border-slate-700 transition-all shadow-xl"
                                >
                                    <MoreVertical size={20} />
                                </button>
                                
                                <AnimatePresence>
                                    {activeMenu === project.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                            className="absolute right-0 top-14 w-64 bg-slate-900/95 border border-white/10 rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-[200] overflow-hidden p-3 backdrop-blur-3xl ring-1 ring-white/10"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => { setEditingProject(project); setActiveMenu(null); }}
                                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all"
                                            >
                                                <Edit3 size={18} /> Modify Directive
                                            </button>
                                            <div className="h-[1px] bg-white/5 my-3 mx-4" />
                                            <p className="px-6 py-2 text-[8px] text-slate-600 font-black uppercase tracking-[0.3em]">TRANSITION NODE</p>
                                            {(['PLANNING', 'EDITING', 'REVIEW', 'DELIVERED'] as ProjectStatus[]).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(project.id, s); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-1",
                                                        (project.status || 'PLANNING') === s 
                                                            ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" 
                                                            : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                                                    )}
                                                >
                                                    {(project.status || 'PLANNING') === s ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-800" />}
                                                    <span>{s.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Project Identity */}
                        <div className="space-y-4 mb-10">
                            <h3 className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter italic leading-none">{project.name}</h3>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed line-clamp-3 opacity-80">{project.description || 'Neural production directives active.'}</p>
                        </div>

                        {/* Financial Monitor */}
                        <div className="p-6 bg-slate-900/40 rounded-[32px] border border-white/5 flex justify-between items-center group/info shadow-inner">
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 group-hover/info:text-emerald-400 transition-colors">Contract Value</p>
                                <p className="text-xl font-black text-slate-200 tracking-tight italic">₹{project.budget?.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 group-hover/info:text-blue-400 transition-colors">Project Lead</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.clientName || 'ENCRYPTED'}</p>
                            </div>
                        </div>

                        {/* Staged Delivery Indicator */}
                        <div className="mt-10 space-y-5">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{getDaysLeft(project.deadline || '') || 'TBD'}</span>
                                </div>
                                <span className="text-[10px] font-black text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">NODE SYNC: {getProgressPercent(project.status || 'PLANNING')}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden relative p-[2px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getProgressPercent(project.status || 'PLANNING')}%` }}
                                    className={cn("h-full rounded-full relative shadow-lg", getProgressColor(project.status || 'PLANNING'))}
                                >
                                    {/* Scanline Effect */}
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:100px_100%] animate-[shimmer_2s_linear_infinite]" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Interaction Hub */}
                        <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8 opacity-40 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-950 bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-600 ring-1 ring-white/10 uppercase italic">
                                        N{i}
                                    </div>
                                ))}
                                <div className="w-10 h-10 rounded-full border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-blue-500 animate-pulse">
                                    +1
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] group-hover:gap-4 transition-all italic">
                                INITIALIZE STUDIO <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </div>
                        
                        {/* Dynamic Background Fog */}
                        <div className={cn(
                            "absolute -bottom-20 -right-20 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none",
                            project.status === 'DELIVERED' ? 'bg-emerald-500' : 
                            project.status === 'REVIEW' ? 'bg-amber-500' : 'bg-blue-600'
                        )} />
                    </motion.div>
                ))}
            </div>

            {/* CREATE PROJECT MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsCreateModalOpen(false)}>
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-slate-900 border-t md:border border-slate-800 p-8 rounded-t-3xl md:rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto safe-bottom"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drag handle for mobile */}
                            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 md:hidden" />

                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Start New Project</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white transition-colors block md:hidden"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateProject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Project Identity</label>
                                    <input
                                        placeholder="e.g. Summer Music Video"
                                        value={newProject.name || ''}
                                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Brief Description</label>
                                    <textarea
                                        placeholder="Outline the core scope and goals..."
                                        value={newProject.description || ''}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-24 transition-all resize-none"
                                    />
                                </div>
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
                                    <label className="text-xs font-bold text-blue-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                        👤 Client Information
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            placeholder="Client Name"
                                            value={newProject.clientName || ''}
                                            onChange={e => setNewProject({ ...newProject, clientName: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                        <input
                                            placeholder="Client Email"
                                            value={newProject.clientEmail || ''}
                                            onChange={e => setNewProject({ ...newProject, clientEmail: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                        <input
                                            placeholder="Client Address"
                                            value={newProject.clientAddress || ''}
                                            onChange={e => setNewProject({ ...newProject, clientAddress: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-blue-500 text-sm col-span-2"
                                        />
                                        <input
                                            placeholder="Client Phone"
                                            value={newProject.clientPhone || ''}
                                            onChange={e => setNewProject({ ...newProject, clientPhone: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-blue-500 text-sm col-span-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Budget (₹)</label>
                                        <div className="relative">
                                            <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={newProject.budget || ''}
                                                onFocus={e => e.target.select()}
                                                onChange={e => setNewProject({ ...newProject, budget: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-slate-800 pl-10 pr-4 py-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Deadline</label>
                                        <input
                                            type="date"
                                            value={newProject.deadline || ''}
                                            onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                            className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="hidden md:block flex-1 py-4 font-bold text-slate-400 hover:text-white transition-all">Cancel</button>
                                    <button type="submit" className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40 text-white transform active:scale-[0.98]">Launch Project</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT PROJECT MODAL */}
            <AnimatePresence>
                {editingProject && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setEditingProject(null)}>
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-slate-900 border-t md:border border-slate-800 p-8 rounded-t-3xl md:rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto safe-bottom"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 md:hidden" />

                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Adjust Project</h2>
                            </div>
                            <form onSubmit={handleEditProject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Project Name</label>
                                    <input
                                        value={editingProject.name}
                                        onFocus={e => e.target.select()}
                                        onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Description</label>
                                    <textarea
                                        value={editingProject.description}
                                        onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-24 transition-all resize-none"
                                    />
                                </div>
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
                                    <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                        👤 Client Information
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            placeholder="Client Name"
                                            value={editingProject.clientName || ''}
                                            onChange={e => setEditingProject({ ...editingProject, clientName: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-emerald-500 text-sm"
                                        />
                                        <input
                                            placeholder="Client Email"
                                            value={editingProject.clientEmail || ''}
                                            onChange={e => setEditingProject({ ...editingProject, clientEmail: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-emerald-500 text-sm"
                                        />
                                        <input
                                            placeholder="Client Address"
                                            value={editingProject.clientAddress || ''}
                                            onChange={e => setEditingProject({ ...editingProject, clientAddress: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-emerald-500 text-sm col-span-2"
                                        />
                                        <input
                                            placeholder="Client Phone"
                                            value={editingProject.clientPhone || ''}
                                            onChange={e => setEditingProject({ ...editingProject, clientPhone: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-1 focus:ring-emerald-500 text-sm col-span-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Budget (₹)</label>
                                        <div className="relative">
                                            <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                value={editingProject.budget || ''}
                                                onFocus={e => e.target.select()}
                                                onChange={e => setEditingProject({ ...editingProject, budget: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-slate-800 pl-10 pr-4 py-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Deadline</label>
                                        <input
                                            type="date"
                                            value={editingProject.deadline ? editingProject.deadline.split('T')[0] : ''}
                                            onChange={e => setEditingProject({ ...editingProject, deadline: e.target.value })}
                                            className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Live Status</label>
                                    <select
                                        value={editingProject.status}
                                        onChange={e => setEditingProject({ ...editingProject, status: e.target.value as ProjectStatus })}
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-bold appearance-none"
                                    >
                                        <option value="PLANNING">Planning Phase</option>
                                        <option value="EDITING">Production Editing</option>
                                        <option value="REVIEW">Client Review</option>
                                        <option value="DELIVERED">Project Delivered</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setEditingProject(null)} className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-all">Discard Changes</button>
                                    <button type="submit" className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40 text-white">Save Updates</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* JOIN PROJECT MODAL */}
            <AnimatePresence>
                {isJoinModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setIsJoinModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
                            
                            <div className="text-center space-y-6 pt-4">
                                <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-2">
                                    <Hash className="text-blue-400" size={32} />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight">Join Production</h2>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">Enter the 6-digit studio code shared by your project manager.</p>
                                
                                <form onSubmit={handleJoinProject} className="space-y-8 pt-4">
                                    <input
                                        placeholder="STUDIO CODE"
                                        value={joinCode}
                                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                        className="w-full bg-slate-950 p-6 rounded-3xl outline-none ring-1 ring-slate-800 text-center font-black tracking-[0.5em] text-2xl text-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-slate-800"
                                        maxLength={6}
                                        required
                                    />
                                    
                                    <button 
                                        type="submit"
                                        className="w-full py-5 bg-blue-600 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                                    >Request Entry</button>
                                </form>
                                
                                <button 
                                    onClick={() => setIsJoinModalOpen(false)}
                                    className="text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest pt-4 block w-full"
                                >Cancel Request</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
