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
                        "p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg group",
                        !isMobile && "cursor-grab active:cursor-grabbing",
                        snapshot.isDragging && "ring-2 ring-blue-500/50 shadow-2xl opacity-90 scale-[1.02]"
                    )}
                    style={{ ...provided.draggableProps.style }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {!isMobile && <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />}
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getPriorityColor(task.priority))}>
                                {task.priority}
                            </span>
                        </div>
                        <div className={cn("flex gap-1", isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity")}>
                            <button onClick={() => setEditingTask(task)} className="p-1.5 hover:text-blue-400 text-slate-500 transition-colors cursor-pointer z-10" title="Edit">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteTask(task.id)} className="p-1.5 hover:text-red-400 text-slate-500 transition-colors cursor-pointer z-10" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <h4 className={cn("font-bold text-slate-100 text-sm", !isMobile && "ml-6")}>{task.title}</h4>
                    {task.description && <p className={cn("text-xs text-slate-500 mt-1 line-clamp-2", !isMobile && "ml-6")}>{task.description}</p>}
                    <div className={cn("mt-3 flex items-center justify-between text-[10px] text-slate-500", !isMobile && "ml-6")}>
                        <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                        {task.project && (
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 truncate max-w-[100px]">{task.project.name}</span>
                        )}
                    </div>
                    {/* Mobile: Move to next status button */}
                    {isMobile && (
                        <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                            {(['TODO', 'IN_PROGRESS', 'COMPLETED'] as Status[]).filter(s => s !== task.status).map(s => (
                                <button
                                    key={s}
                                    onClick={() => updateTaskStatus(task.id, s)}
                                    className={cn("flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all",
                                        s === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" :
                                            s === 'IN_PROGRESS' ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" :
                                                "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    )}
                                >
                                    → {getStatusLabel(s)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <header className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold">Studio Tasks</h1>
                        <p className="text-xs md:text-sm text-slate-400">Manage your editing workflow.</p>
                    </div>
                    <button
                        onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 text-sm md:text-base"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Task</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button
                            onClick={() => setView('board')}
                            className={cn("px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all", view === 'board' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500")}
                        >Board</button>
                        <button
                            onClick={() => setView('list')}
                            className={cn("px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all", view === 'list' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500")}
                        >List</button>
                    </div>
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
                                    return (
                                        <div key={col.status} className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn("w-2.5 h-2.5 rounded-full", col.dotColor)} />
                                                    <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">{col.title}</h3>
                                                </div>
                                                <span className="bg-slate-800 px-2.5 py-0.5 rounded-lg text-xs font-bold text-slate-500">{columnTasks.length}</span>
                                            </div>
                                            <Droppable droppableId={col.status}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={cn(
                                                            "flex-1 p-3 rounded-2xl border-2 border-dashed space-y-3 overflow-y-auto transition-all duration-200 min-h-[200px]",
                                                            snapshot.isDraggingOver ? col.borderHighlight : "border-slate-800/60",
                                                            "bg-slate-900/30"
                                                        )}>
                                                        {columnTasks.map((task, index) => renderTaskCard(task, false, index))}
                                                        {provided.placeholder}
                                                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 pointer-events-none">
                                                                <CheckCircle2 size={32} className="mb-2 opacity-30" />
                                                                <p className="text-xs font-medium">No tasks here</p>
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
