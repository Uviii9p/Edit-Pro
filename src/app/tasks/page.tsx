'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Plus, Search, GripVertical,
    Trash2, Edit2, Clock, CheckCircle2,
    X, ChevronRight, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

interface Task {
    id: string;
    title: string;
    description?: string;
    priority: Priority;
    status: Status;
    deadline?: string;
    projectId?: string;
    project?: { name: string };
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [view, setView] = useState<'board' | 'list'>('board');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM' as Priority, projectId: '', deadline: '' });
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedMobileCol, setExpandedMobileCol] = useState<Status | null>(null);
    const [moveMenuTask, setMoveMenuTask] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fetchTasks();
        fetchProjects();
    }, []);

    const fetchTasks = async () => {
        try {
            const resp = await api.get('/tasks');
            setTasks(resp.data);
        } catch (err) { console.error(err); }
    };

    const fetchProjects = async () => {
        try {
            const resp = await api.get('/projects');
            setProjects(resp.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Optimistic Update
            const tempId = `temp-${Date.now()}`;
            const optimisticTask: Task = {
                id: tempId,
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                status: 'TODO',
                deadline: newTask.deadline,
                projectId: newTask.projectId,
                project: projects.find(p => p.id === newTask.projectId)
            };
            setTasks(prev => [optimisticTask, ...prev]);

            await api.post('/tasks', newTask);
            setIsModalOpen(false);
            setNewTask({ title: '', description: '', priority: 'MEDIUM', projectId: '', deadline: '' });
            fetchTasks();
        } catch (err) { console.error(err); }
    };

    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;
        try {
            await api.put(`/tasks/${editingTask.id}`, {
                title: editingTask.title,
                description: editingTask.description,
                priority: editingTask.priority,
                status: editingTask.status,
                projectId: editingTask.projectId || null,
            });
            setEditingTask(null);
            fetchTasks();
        } catch (err) { console.error(err); }
    };

    const updateTaskStatus = async (id: string, status: Status) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        setMoveMenuTask(null);
        try {
            await api.put(`/tasks/${id}`, { status });
        } catch (err) {
            console.error(err);
            fetchTasks();
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        } catch (err) { console.error(err); }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const targetStatus = destination.droppableId as Status;

        // Optimistic UI update
        const taskToMove = tasks.find(t => t.id === draggableId);
        if (!taskToMove) return;

        setTasks(prevTasks => {
            const updatedTasks = prevTasks.map(t =>
                t.id === draggableId ? { ...t, status: targetStatus } : t
            );
            return updatedTasks;
        });

        try {
            await api.put(`/tasks/${draggableId}`, { status: targetStatus });
        } catch (err) {
            console.error('Failed to update task status:', err);
            fetchTasks(); // Revert on failure
        }
    };

    const columns: { title: string; status: Status; dotColor: string; borderHighlight: string }[] = [
        { title: 'To Do', status: 'TODO', dotColor: 'bg-slate-400', borderHighlight: 'border-slate-400/50 bg-slate-400/5' },
        { title: 'In Progress', status: 'IN_PROGRESS', dotColor: 'bg-blue-500', borderHighlight: 'border-blue-500/50 bg-blue-500/5' },
        { title: 'Completed', status: 'COMPLETED', dotColor: 'bg-emerald-500', borderHighlight: 'border-emerald-500/50 bg-emerald-500/5' },
    ];

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case 'HIGH': return 'text-red-400 bg-red-400/10 ring-1 ring-red-400/20';
            case 'MEDIUM': return 'text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/20';
            case 'LOW': return 'text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20';
        }
    };

    const getNextStatus = (s: Status): Status | null => {
        if (s === 'TODO') return 'IN_PROGRESS';
        if (s === 'IN_PROGRESS') return 'COMPLETED';
        return null;
    };

    const getStatusLabel = (s: Status) => {
        switch (s) {
            case 'TODO': return 'To Do';
            case 'IN_PROGRESS': return 'In Progress';
            case 'COMPLETED': return 'Completed';
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Shared task card renderer
    const renderTaskCard = (task: Task, isMobile: boolean, index: number) => (
        <Draggable draggableId={task.id} index={index} key={task.id} isDragDisabled={isMobile}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "p-6 bg-slate-950/40 backdrop-blur-3xl rounded-[28px] border border-white/5 transition-all duration-500 group relative shadow-2xl overflow-hidden",
                        !isMobile && "cursor-grab active:cursor-grabbing hover:border-blue-500/30",
                        snapshot.isDragging && "ring-2 ring-blue-500 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] opacity-100 scale-[1.05] bg-slate-900"
                    )}
                    style={{ ...provided.draggableProps.style }}
                >
                    {/* Visual Pulse for active dragging */}
                    {snapshot.isDragging && <div className="absolute inset-0 bg-blue-500/[0.03] animate-pulse" />}
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            {!isMobile && <GripVertical size={16} className="text-slate-700 group-hover:text-blue-500 transition-colors flex-shrink-0" />}
                            <div className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-inner",
                                getPriorityColor(task.priority)
                            )}>
                                {task.priority}
                            </div>
                        </div>
                        <div className={cn("flex gap-2", isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0")}>
                            <button onClick={() => setEditingTask(task)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all shadow-xl"><Edit2 size={16} /></button>
                            <button onClick={() => deleteTask(task.id)} className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-all shadow-xl"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    
                    <div className="relative z-10 mb-6">
                        <h4 className="text-lg font-black text-slate-100 tracking-tight leading-snug group-hover:text-blue-400 transition-colors">{task.title}</h4>
                        {task.description && <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-2 leading-relaxed italic">{task.description}</p>}
                    </div>

                    <div className="pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-600" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mono-label">
                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'NO_DEADLINE'}
                            </span>
                        </div>
                        {task.project && (
                            <div className="px-3 py-1 bg-slate-900/60 rounded-full border border-white/5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{task.project.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Desktop Hover Accessory */}
                    {!isMobile && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    )}

                    {/* Mobile: Move Actions */}
                    {isMobile && (
                        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-2 gap-3 relative z-10">
                            {(['TODO', 'IN_PROGRESS', 'COMPLETED'] as Status[]).filter(s => s !== task.status).map(s => (
                                <button
                                    key={s}
                                    onClick={() => updateTaskStatus(task.id, s)}
                                    className={cn("flex items-center justify-center gap-2 text-[9px] font-black py-3 rounded-2xl uppercase tracking-widest transition-all shadow-xl outline-none",
                                        s === 'COMPLETED' ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" :
                                            s === 'IN_PROGRESS' ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" :
                                                "bg-slate-800 text-slate-400 border border-white/5"
                                    )}
                                >
                                    {getStatusLabel(s)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );

    return (
        <div className="p-8 md:p-12 space-y-12 max-w-[1500px] mx-auto min-h-screen">
            <header className="flex flex-col gap-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">SYNC: ACTIVE</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                            Studio Tasks
                            <span className="px-3 py-1 bg-slate-800 border border-white/5 rounded-xl text-[10px] font-black not-italic text-slate-500 tracking-widest">{tasks.length} NODES</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] opacity-80">Synchronizing production directives.</p>
                    </div>
                    
                    <div className="flex bg-slate-900/60 p-1.5 rounded-[22px] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <button
                            onClick={() => setView('board')}
                            className={cn(
                                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                view === 'board' ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" : "text-slate-500 hover:text-white"
                            )}
                        >BOARD mode</button>
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                view === 'list' ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" : "text-slate-500 hover:text-white"
                            )}
                        >LIST mode</button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                    <div className="relative flex-1 group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Search size={22} />
                        </div>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter production nodes (type task ID or title)..."
                            className="w-full bg-slate-900/40 backdrop-blur-2xl border border-white/5 pl-16 pr-8 py-6 rounded-[28px] text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all placeholder:text-slate-700 placeholder:italic"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                        className="flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-500 px-8 py-6 rounded-[28px] font-black tracking-widest uppercase text-xs text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all group active:scale-95"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        New Directive
                    </button>
                </div>
            </header>

            {view === 'board' ? (
                <>
                    {/* DESKTOP BOARD - hidden on mobile */}
                    {isClient && (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="hidden md:grid md:grid-cols-3 gap-6 min-h-[calc(100vh-280px)]">
                                {columns.map(col => {
                                    const columnTasks = filteredTasks.filter(t => t.status === col.status);
                                    const accentColors: any = {
                                        'TODO': 'from-slate-400/20 to-transparent border-slate-400/10',
                                        'IN_PROGRESS': 'from-blue-600/10 to-transparent border-blue-500/10',
                                        'COMPLETED': 'from-emerald-600/10 to-transparent border-emerald-500/10'
                                    };
                                    
                                    return (
                                        <div key={col.status} className="flex flex-col gap-6">
                                            <div className="flex items-center justify-between px-3">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-3 h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]", col.dotColor)} />
                                                    <h3 className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] italic">{col.title}</h3>
                                                </div>
                                                <div className="px-3 py-1 bg-slate-900 rounded-full border border-white/5">
                                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{columnTasks.length}</span>
                                                </div>
                                            </div>
                                            <Droppable droppableId={col.status}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={cn(
                                                            "flex-1 p-6 rounded-[34px] border-2 border-dashed space-y-6 overflow-y-auto transition-all duration-500 h-full min-h-[500px] scrollbar-hide perspective-1000",
                                                            snapshot.isDraggingOver 
                                                                ? cn("bg-gradient-to-b scale-[0.98] border-opacity-50", accentColors[col.status]) 
                                                                : "border-white/5 bg-slate-950/20"
                                                        )}>
                                                        {columnTasks.map((task, index) => renderTaskCard(task, false, index))}
                                                        {provided.placeholder}
                                                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                                            <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-20 filter grayscale hover:grayscale-0 transition-all duration-700">
                                                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center mb-6">
                                                                    <CheckCircle2 size={40} className="text-slate-500" />
                                                                </div>
                                                                <p className="text-sm font-black uppercase tracking-[0.3em]">No Directives</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    );
                                })}
                            </div>
                        </DragDropContext>
                    )}

                    {/* MOBILE BOARD - collapsible columns */}
                    {isClient && (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="md:hidden space-y-3">
                                {columns.map(col => {
                                    const columnTasks = filteredTasks.filter(t => t.status === col.status);
                                    const isExpanded = expandedMobileCol === col.status || expandedMobileCol === null;
                                    return (
                                        <div key={col.status} className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                                            <button
                                                onClick={() => setExpandedMobileCol(expandedMobileCol === col.status ? null : col.status)}
                                                className="w-full flex items-center justify-between p-4"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn("w-2.5 h-2.5 rounded-full", col.dotColor)} />
                                                    <h3 className="font-bold text-slate-300 text-sm">{col.title}</h3>
                                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">{columnTasks.length}</span>
                                                </div>
                                                <ChevronRight size={18} className={cn("text-slate-500 transition-transform", isExpanded && "rotate-90")} />
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <Droppable droppableId={col.status}>
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    className="p-3 pt-0 space-y-3"
                                                                >
                                                                    {columnTasks.map((task, index) => renderTaskCard(task, true, index))}
                                                                    {provided.placeholder}
                                                                    {columnTasks.length === 0 && (
                                                                        <div className="text-center py-6 text-slate-600 text-xs">No tasks</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </DragDropContext>
                    )}
                </>
            ) : (
                /* LIST VIEW */
                <div className="space-y-3 md:space-y-0">
                    {/* Desktop table */}
                    <div className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-slate-800/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Task</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Priority</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Project</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredTasks.map(task => (
                                    <tr key={task.id} className="hover:bg-slate-800/30 transition-all group">
                                        <td className="px-6 py-4 font-semibold">{task.title}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={task.status}
                                                onChange={e => updateTaskStatus(task.id, e.target.value as Status)}
                                                className={cn("px-3 py-1 rounded-full text-xs font-bold bg-transparent border cursor-pointer outline-none",
                                                    task.status === 'TODO' ? 'border-slate-600 text-slate-400' :
                                                        task.status === 'IN_PROGRESS' ? 'border-blue-500/30 text-blue-400' :
                                                            'border-emerald-500/30 text-emerald-400')}
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getPriorityColor(task.priority))}>{task.priority}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{task.project?.name || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingTask(task)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"><Edit2 size={16} /></button>
                                                <button onClick={() => deleteTask(task.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile list cards */}
                    <div className="md:hidden space-y-3">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="list">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {filteredTasks.map((task, index) => renderTaskCard(task, true, index))}
                                        {provided.placeholder}
                                        {filteredTasks.length === 0 && (
                                            <div className="text-center py-12 text-slate-600 text-sm">No tasks found</div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            )}

            {/* CREATE TASK MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl md:text-2xl font-bold">Create New Task</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={22} /></button>
                            </div>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Title</label>
                                    <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 text-base" placeholder="Task title..." required />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Description</label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-20 text-base" placeholder="Details..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-bold text-slate-400 block mb-1">Priority</label>
                                        <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as Priority })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 text-base">
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-400 block mb-1">Project</label>
                                        <select value={newTask.projectId} onChange={e => setNewTask({ ...newTask, projectId: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 text-base">
                                            <option value="">None</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Deadline</label>
                                    <input type="date" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 text-base" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-xl font-bold shadow-lg shadow-blue-900/40">Create</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT TASK MODAL */}
            <AnimatePresence>
                {editingTask && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center" onClick={() => setEditingTask(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl md:text-2xl font-bold">Edit Task</h2>
                                <button onClick={() => setEditingTask(null)} className="text-slate-500 hover:text-white"><X size={22} /></button>
                            </div>
                            <form onSubmit={handleEditTask} className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Title</label>
                                    <input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 text-base" required />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Description</label>
                                    <textarea value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-20 text-base" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-bold text-slate-400 block mb-1">Priority</label>
                                        <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Priority })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 text-base">
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-400 block mb-1">Status</label>
                                        <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value as Status })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 text-base">
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Project</label>
                                    <select value={editingTask.projectId || ''} onChange={e => setEditingTask({ ...editingTask, projectId: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 text-base">
                                        <option value="">None</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setEditingTask(null)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-xl font-bold shadow-lg shadow-blue-900/40">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
