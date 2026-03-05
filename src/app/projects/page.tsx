'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Plus, Search, MoreVertical, Trash2, Edit, ExternalLink,
    CheckCircle, Clock, LayoutGrid, List, X, IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'PLANNING' | 'EDITING' | 'REVIEW' | 'DELIVERED';
    budget: number;
    deadline: string;
    revisionCount: number;
}

type ProjectStatus = 'PLANNING' | 'EDITING' | 'REVIEW' | 'DELIVERED';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [newProject, setNewProject] = useState({ name: '', description: '', budget: 0, deadline: '' });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
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
            setIsModalOpen(false);
            setNewProject({ name: '', description: '', budget: 0, deadline: '' });
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
        const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return <span className="text-red-400">{Math.abs(diff)}d overdue</span>;
        if (diff === 0) return <span className="text-amber-400">Due today</span>;
        return <span>{diff} days left</span>;
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Studio Projects</h1>
                    <p className="text-sm text-slate-400">Track your video editing contracts and progress.</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
                    >
                        <Plus size={20} />
                        Create Project
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all hover:translate-y-[-2px] group relative cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold", getStatusColor(project.status))}>
                                {project.status.replace('_', ' ')}
                            </span>
                            <div className="relative">
                                <button
                                    onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === project.id ? null : project.id); }}
                                    className="text-slate-600 hover:text-white transition-colors p-1"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {/* Context Menu */}
                                <AnimatePresence>
                                    {activeMenu === project.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                            className="absolute right-0 top-8 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => { setEditingProject(project); setActiveMenu(null); }}
                                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700 text-sm text-slate-300 transition-all"
                                            >
                                                <Edit size={14} /> Edit Project
                                            </button>
                                            <div className="border-t border-slate-700" />
                                            <p className="px-4 py-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Change Status</p>
                                            {(['PLANNING', 'EDITING', 'REVIEW', 'DELIVERED'] as ProjectStatus[]).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(project.id, s); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-4 py-2 text-xs transition-all",
                                                        project.status === s ? "bg-slate-700/50 text-blue-400 font-bold" : "text-slate-400 hover:bg-slate-700"
                                                    )}
                                                >
                                                    {project.status === s && <CheckCircle size={12} />}
                                                    <span className={project.status === s ? '' : 'ml-5'}>{s.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{project.name}</h3>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{project.description}</p>

                        <div className="mt-6 flex justify-between items-center text-xs">
                            <div className="space-y-1">
                                <p className="text-slate-500 font-bold uppercase tracking-wider">Budget</p>
                                <p className="text-emerald-400 font-bold text-base">₹{project.budget?.toLocaleString()}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-slate-500 font-bold uppercase tracking-wider">Revision</p>
                                <p className="text-slate-300 font-bold text-base">{project.revisionCount}</p>
                            </div>
                        </div>

                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercent(project.status)}%` }}
                                className={cn("h-full rounded-full transition-all", getProgressColor(project.status))}
                            />
                        </div>

                        <div className="flex justify-between items-center mt-4 text-xs font-bold text-slate-500 uppercase">
                            <div className="flex items-center gap-1">
                                <Clock size={12} strokeWidth={3} />
                                <span>{getDaysLeft(project.deadline) || 'No deadline'}</span>
                            </div>
                            <span className="text-[10px] normal-case">{getProgressPercent(project.status)}% complete</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* CREATE PROJECT MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsModalOpen(false)}>
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
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors block md:hidden"><X size={24} /></button>
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
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-28 transition-all resize-none"
                                    />
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
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="hidden md:block flex-1 py-4 font-bold text-slate-400 hover:text-white transition-all">Cancel</button>
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
                                        className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-28 transition-all resize-none"
                                    />
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
        </div>
    );
}
