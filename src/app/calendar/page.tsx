'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Video,
    Users,
    MapPin,
    AlertCircle,
    Edit2,
    Trash2,
    X,
    Zap,
    Star,
    Monitor,
    Coffee,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, parseISO, startOfDay, addHours } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';

type EventType = 'SHOOT' | 'EDIT' | 'MEETING' | 'GRADING' | 'DEADLINE' | 'RENDER' | 'OTHER';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    projectId: string;
    projectName: string;
    clientName: string;
    type: EventType;
    date: string; // ISO format
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    location: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
}

interface StudioBooking {
    id: string;
    studioName: string;
    editorName: string;
    projectId: string;
    startTime: string; // ISO
    endTime: string; // ISO
}

const EVENT_TYPE_STYLES: Record<EventType, { color: string; bg: string; border: string; icon: React.ElementType }> = {
    SHOOT: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Video },
    EDIT: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Monitor },
    MEETING: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Users },
    GRADING: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: Zap },
    DEADLINE: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle },
    RENDER: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Coffee },
    OTHER: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Star },
};

export default function CalendarPage() {
    const { notify } = useNotifications();
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [searchQuery] = useState('');
    const [filterType] = useState<string>('ALL');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        clientName: '',
        type: 'EDIT' as EventType,
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH'
    });

    const [bookingData, setBookingData] = useState({
        studioName: 'Studio A',
        editorName: '',
        projectId: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm")
    });

    // Refs
    // const modalRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const [eventsResp, projectsResp] = await Promise.all([
                api.get('/calendar'),
                api.get('/projects')
            ]);
            setEvents(eventsResp.data);
            setProjects(projectsResp.data);
        } catch (err) {
            console.error('Failed to fetch calendar data', err);
        }
    };

    // Initial Fetch
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchData();
    }, []);

    // Navigation
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Month Grid Calculation
    const monthDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentDate]);

    // Helpers
    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(parseISO(event.date), day))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setFormData({ ...formData, startTime: '09:00', endTime: '10:00' });
        setIsEventModalOpen(true);
    };

    const handleSubmitEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate && !editingEvent) return;

        const dateToUse = selectedDate || parseISO(editingEvent!.date);
        const project = projects.find(p => p.id === formData.projectId);

        const eventPayload = {
            ...formData,
            projectName: project?.name || 'General',
            date: dateToUse.toISOString(),
            status: 'PENDING'
        };

        try {
            if (editingEvent) {
                await api.put(`/calendar/${editingEvent.id}`, eventPayload);
            } else {
                await api.post('/calendar', eventPayload);
            }
            setIsEventModalOpen(false);
            setEditingEvent(null);
            fetchData();
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Permanently delete this event?')) return;
        try {
            await api.delete(`/calendar/${id}`);
            fetchData();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    /*
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.projectName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'ALL' || e.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [events, searchQuery, filterType]);
    */

    // Studio Booking Logic
    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check for overlaps
        const bookings = await api.get('/bookings');
        const hasOverlap = bookings.data.some((b: StudioBooking) => {
            if (b.studioName !== bookingData.studioName) return false;
            const startA = parseISO(b.startTime);
            const endA = parseISO(b.endTime);
            const startB = parseISO(bookingData.startTime);
            const endB = parseISO(bookingData.endTime);
            return (startB < endA && endB > startA);
        });

        if (hasOverlap) {
            alert('⚠️ Studio already booked for this time block!');
            return;
        }

        try {
            await api.post('/bookings', bookingData);
            setIsBookingModalOpen(false);
            // Also create a calendar event for visibility
            const proj = projects.find(p => p.id === bookingData.projectId);
            await api.post('/calendar', {
                title: `Studio: ${bookingData.studioName}`,
                description: `Editor: ${bookingData.editorName}`,
                projectId: bookingData.projectId,
                projectName: proj?.name || 'Studio Booking',
                clientName: 'Internal',
                type: 'SHOOT',
                date: startOfDay(parseISO(bookingData.startTime)).toISOString(),
                startTime: format(parseISO(bookingData.startTime), 'HH:mm'),
                endTime: format(parseISO(bookingData.endTime), 'HH:mm'),
                location: bookingData.studioName,
                status: 'PENDING',
                priority: 'HIGH'
            });
            notify('Reservation Locked', `${bookingData.studioName} confirmed for ${bookingData.editorName}.`, 'success');
            fetchData();
        } catch (err) {
            console.error('Booking failed', err);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900/50 border-b border-slate-800 backdrop-blur-xl z-20 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Production Schedule</h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{format(currentDate, 'MMMM yyyy')}</p>
                    </div>
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
                    <button
                        onClick={() => setView('MONTH')}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", view === 'MONTH' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                    >Month</button>
                    <button
                        onClick={() => setView('WEEK')}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", view === 'WEEK' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                    >Week</button>
                    <button
                        onClick={() => setView('DAY')}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", view === 'DAY' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                    >Day</button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={goToToday} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-700">Today</button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronRight size={20} /></button>
                    <div className="w-px h-6 bg-slate-800 mx-2" />
                    <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-900/20 group"
                        title="Book Studio"
                    >
                        <Monitor size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={() => { setSelectedDate(new Date()); setIsEventModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/30"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Event</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Calendar Grid */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {view === 'MONTH' && (
                        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
                            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/50">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[160px]">
                                {monthDays.map((day, i) => {
                                    const dayEvents = getEventsForDay(day);
                                    const isCurrentMonth = isSameMonth(day, currentDate);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleDayClick(day)}
                                            className={cn(
                                                "border-r border-b border-slate-800 p-2 transition-all relative group cursor-pointer hover:bg-slate-800/20",
                                                !isCurrentMonth && "opacity-20 bg-slate-950/50"
                                            )}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={cn(
                                                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                                    isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-110" : "text-slate-400"
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                                {dayEvents.length > 0 && (
                                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                        {dayEvents.length} Tasks
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1 overflow-hidden">
                                                {dayEvents.slice(0, 3).map(event => (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingEvent(event);
                                                            setFormData({
                                                                title: event.title,
                                                                description: event.description,
                                                                projectId: event.projectId,
                                                                clientName: event.clientName,
                                                                type: event.type,
                                                                startTime: event.startTime,
                                                                endTime: event.endTime,
                                                                location: event.location,
                                                                priority: event.priority
                                                            });
                                                            setIsEventModalOpen(true);
                                                        }}
                                                        className={cn(
                                                            "px-2 py-1 rounded-md text-[10px] font-bold truncate transition-all flex items-center gap-1.5 border group/event",
                                                            EVENT_TYPE_STYLES[event.type].bg,
                                                            EVENT_TYPE_STYLES[event.type].color,
                                                            EVENT_TYPE_STYLES[event.type].border,
                                                            "hover:scale-[1.02] active:scale-95"
                                                        )}
                                                    >
                                                        <div className={cn("w-1 h-1 rounded-full", EVENT_TYPE_STYLES[event.type].color.replace('text', 'bg'))} />
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[9px] font-bold text-slate-600 pl-2">
                                                        + {dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>

                                            <button className="absolute bottom-2 right-2 p-1.5 bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {view === 'WEEK' && (
                        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full">
                            <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/50">
                                <div className="p-4 border-r border-slate-800 text-[10px] font-bold text-slate-500 uppercase">GMT+5:30</div>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => {
                                    const day = addDays(startOfWeek(currentDate), idx);
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <div key={dayName} className="p-4 text-center border-r border-slate-800 last:border-0 flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dayName}</span>
                                            <span className={cn("text-lg font-bold w-10 h-10 flex items-center justify-center rounded-xl", isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40" : "text-slate-300")}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex-1 overflow-y-auto relative">
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} className="grid grid-cols-8 border-b border-slate-800/50 h-20 group">
                                        <div className="p-2 border-r border-slate-800 text-[10px] font-medium text-slate-500 text-right pr-4">
                                            {hour === 0 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                                        </div>
                                        {Array.from({ length: 7 }).map((_, dayIdx) => (
                                            <div key={dayIdx} className="border-r border-slate-800/30 group-hover:bg-slate-800/10 transition-colors relative" />
                                        ))}
                                    </div>
                                ))}
                                {/* Floating Events in Week View would go here using absolute positioning */}
                            </div>
                        </div>
                    )}

                    {view === 'DAY' && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl flex items-center justify-between">
                                <div>
                                    <h2 className="text-4xl font-extrabold text-white mb-2">{format(currentDate, 'EEEE')}</h2>
                                    <p className="text-lg text-slate-400 font-medium">{format(currentDate, 'MMMM d, yyyy')}</p>
                                </div>
                                <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl text-center min-w-[120px]">
                                    <span className="text-3xl font-black text-indigo-400 block">{getEventsForDay(currentDate).length}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sessions</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {getEventsForDay(currentDate).length > 0 ? (
                                    getEventsForDay(currentDate).map(event => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn(
                                                "p-6 rounded-3xl border flex items-center gap-6 group transition-all hover:translate-x-2",
                                                EVENT_TYPE_STYLES[event.type].bg,
                                                EVENT_TYPE_STYLES[event.type].border
                                            )}
                                        >
                                            <div className={cn("p-4 rounded-2xl", EVENT_TYPE_STYLES[event.type].bg.replace('10', '20'))}>
                                                {(() => {
                                                    const Icon = EVENT_TYPE_STYLES[event.type].icon;
                                                    return <Icon className={EVENT_TYPE_STYLES[event.type].color} size={28} />;
                                                })()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter", EVENT_TYPE_STYLES[event.type].bg, EVENT_TYPE_STYLES[event.type].color)}>
                                                        {event.type}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-500">#{event.projectName}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white">{event.title}</h3>
                                                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                                    <MapPin size={14} className="text-slate-600" /> {event.location || 'Studio Main'}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <div className="flex items-center gap-2 font-mono text-lg font-bold text-slate-200">
                                                    <Clock size={18} className="text-indigo-400" />
                                                    {event.startTime} - {event.endTime}
                                                </div>
                                                <div className="flex justify-end gap-2 pr-1">
                                                    <button onClick={() => { setEditingEvent(event); setFormData({ ...event }); setIsEventModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteEvent(event.id)} className="p-2 hover:bg-red-500/10 rounded-xl transition-all text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                                        <Zap size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                                        <h3 className="text-xl font-bold text-slate-500">Clear Skies for Today</h3>
                                        <p className="text-sm text-slate-600 mt-1">No production sessions scheduled.</p>
                                        <button
                                            onClick={() => { setSelectedDate(currentDate); setIsEventModalOpen(true); }}
                                            className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-700"
                                        >
                                            Schedule Session
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Panel - Daily Insights */}
                <aside className="hidden lg:flex flex-col w-80 bg-slate-900/50 border-l border-slate-800 p-6 backdrop-blur-md overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Activity size={14} className="text-indigo-400" /> Today&apos;s Velocity
                            </h3>
                            <div className="space-y-4">
                                {getEventsForDay(new Date()).slice(0, 3).map(event => (
                                    <div key={event.id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", EVENT_TYPE_STYLES[event.type].bg, EVENT_TYPE_STYLES[event.type].color)}>
                                                {event.type.toLowerCase()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-400 transition-colors">{event.startTime}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{event.title}</h4>
                                        <p className="text-[11px] text-slate-500 mt-1 font-medium">{event.projectName}</p>
                                    </div>
                                ))}
                                {getEventsForDay(new Date()).length === 0 && (
                                    <p className="text-xs text-slate-600 italic">No events for today.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </aside>
            </div>

            {/* EVENT MODAL */}
            <AnimatePresence>
                {isEventModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-3 rounded-2xl", EVENT_TYPE_STYLES[formData.type].bg, EVENT_TYPE_STYLES[formData.type].color)}>
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{editingEvent ? 'Edit Session' : 'Plan New Session'}</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Schedule Workflow'}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsEventModalOpen(false); setEditingEvent(null); }} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitEvent} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Session Title</label>
                                    <input
                                        autoFocus
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg"
                                        placeholder="e.g. Wedding Film Master Grading"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
                                            className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500 transition-all font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="SHOOT">🎥 Studio Shoot</option>
                                            <option value="EDIT">🖥️ Editing Session</option>
                                            <option value="MEETING">👥 Client Meeting</option>
                                            <option value="GRADING">✨ Color Grading</option>
                                            <option value="RENDER">⏳ Heavy Render</option>
                                            <option value="DEADLINE">🚨 Project Deadline</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Project Link</label>
                                        <select
                                            value={formData.projectId}
                                            onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                            className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500 transition-all font-bold appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Link a Project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Start Timeline</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                                className="w-full bg-slate-800/50 pl-11 pr-4 py-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500 transition-all font-mono font-bold"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">End Timeline</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                                className="w-full bg-slate-800/50 pl-11 pr-4 py-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500 transition-all font-mono font-bold"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Location / Studio</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-slate-800/50 pl-11 pr-4 py-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                            placeholder="Studio B / Remote"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEventModalOpen(false); setEditingEvent(null); }}
                                        className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-all"
                                    >Cancel</button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-blue-900/30 transition-all transform active:scale-95"
                                    >
                                        {editingEvent ? 'Confirm Edits' : 'Commit to Schedule'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* STUDIO BOOKING MODAL */}
            <AnimatePresence>
                {isBookingModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-600 to-amber-500" />

                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-600/10 text-orange-400 rounded-2xl">
                                        <Monitor size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold">Studio Reservation</h2>
                                </div>
                                <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleBooking} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] pl-1">Target Studio</label>
                                        <select
                                            value={bookingData.studioName}
                                            onChange={e => setBookingData({ ...bookingData, studioName: e.target.value })}
                                            className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-orange-500 transition-all font-bold appearance-none"
                                        >
                                            <option value="Studio A">Studio A (DaVinci Grading Suite)</option>
                                            <option value="Studio B">Studio B (Dubbing & Sound)</option>
                                            <option value="Studio C">Studio C (Green Screen)</option>
                                            <option value="Booth 1">Booth 1 (Podcast & VO)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] pl-1">Editor Name</label>
                                        <input
                                            value={bookingData.editorName}
                                            onChange={e => setBookingData({ ...bookingData, editorName: e.target.value })}
                                            className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-orange-500 transition-all font-bold"
                                            placeholder="Lead Editor Name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 text-white">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] pl-1">Session In</label>
                                        <input
                                            type="datetime-local"
                                            value={bookingData.startTime}
                                            onChange={e => setBookingData({ ...bookingData, startTime: e.target.value })}
                                            className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-orange-500 transition-all font-bold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 text-white">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] pl-1">Session Out</label>
                                        <input
                                            type="datetime-local"
                                            value={bookingData.endTime}
                                            onChange={e => setBookingData({ ...bookingData, endTime: e.target.value })}
                                            className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none ring-1 ring-slate-700/50 focus:ring-2 focus:ring-orange-500 transition-all font-bold text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-orange-900/20 transition-all transform active:scale-[0.98]">
                                    Lock Reservation
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
                
                input[type="time"]::-webkit-calendar-picker-indicator,
                input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

