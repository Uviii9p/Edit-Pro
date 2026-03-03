'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '@/lib/api';
import { Plus, X, Calendar as CalendarIcon, Clock, User, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Meeting {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    type: string;
}

export default function CalendarPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [selectedDate, setSelectedDate] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<Meeting | null>(null);
    const [newMeeting, setNewMeeting] = useState({ title: '', description: '', startTime: '', endTime: '', type: 'MEETING' });

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const resp = await api.get('/meetings');
            setMeetings(resp.data);
            const formatted = resp.data.map((m: any) => ({
                id: m.id,
                title: m.title,
                start: m.startTime,
                end: m.endTime,
                backgroundColor: m.type === 'MEETING' ? '#0ea5e9' : '#10b981',
                borderColor: 'transparent',
                extendedProps: { meetingId: m.id, type: m.type, description: m.description },
            }));
            setEvents(formatted);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.dateStr);
        setEditingMeeting(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (arg: any) => {
        const meetingId = arg.event.extendedProps.meetingId;
        const meeting = meetings.find(m => m.id === meetingId);
        if (meeting) {
            setSelectedEvent(meeting);
        }
    };

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dateStr = selectedDate || new Date().toISOString().split('T')[0];
            const start = newMeeting.startTime.includes('T') ? newMeeting.startTime.split('T')[1] : (newMeeting.startTime || '09:00');
            const end = newMeeting.endTime.includes('T') ? newMeeting.endTime.split('T')[1] : (newMeeting.endTime || '10:00');

            await api.post('/meetings', {
                ...newMeeting,
                startTime: `${dateStr}T${start}`,
                endTime: `${dateStr}T${end}`,
            });
            setIsModalOpen(false);
            setNewMeeting({ title: '', description: '', startTime: '', endTime: '', type: 'MEETING' });
            fetchMeetings();
        } catch (err) {
            console.error(err);
            alert('Failed to schedule meeting. Ensure dates/times are valid.');
        }
    };

    const handleEditMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMeeting) return;
        try {
            await api.put(`/meetings/${editingMeeting.id}`, {
                title: editingMeeting.title,
                description: editingMeeting.description,
                startTime: editingMeeting.startTime,
                endTime: editingMeeting.endTime,
                type: editingMeeting.type,
            });
            setEditingMeeting(null);
            setIsModalOpen(false);
            fetchMeetings();
        } catch (err) {
            console.error(err);
            alert('Failed to update meeting.');
        }
    };

    const handleDeleteMeeting = async (id: string) => {
        if (!confirm('Delete this event?')) return;
        try {
            await api.delete(`/meetings/${id}`);
            setSelectedEvent(null);
            fetchMeetings();
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Studio Calendar</h1>
                    <p className="text-sm text-slate-400">Schedule client meetings and studio bookings.</p>
                </div>
                <button
                    onClick={() => { setEditingMeeting(null); setSelectedDate(new Date().toISOString().split('T')[0]); setIsModalOpen(true); }}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add Event</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </header>

            <div className="bg-slate-900 border border-slate-800 p-2 md:p-6 rounded-2xl md:rounded-3xl shadow-xl overflow-x-auto">
                <div className="min-w-0 md:min-w-0">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek',
                        }}
                        events={events}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        height="auto"
                        contentHeight="auto"
                        themeSystem="standard"
                        selectable={true}
                        editable={true}
                        droppable={true}
                        dayMaxEventRows={2}
                        fixedWeekCount={false}
                    />
                </div>
            </div>

            {/* EVENT DETAIL POPUP */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center" onClick={() => setSelectedEvent(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2.5 rounded-xl", selectedEvent.type === 'MEETING' ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500")}>
                                        {selectedEvent.type === 'MEETING' ? <User size={22} /> : <CalendarIcon size={22} />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                            selectedEvent.type === 'MEETING' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                                        )}>
                                            {selectedEvent.type}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white transition-colors"><X size={22} /></button>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <CalendarIcon size={16} className="text-slate-500" />
                                    <span>{formatDate(selectedEvent.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <Clock size={16} className="text-slate-500" />
                                    <span>{formatTime(selectedEvent.startTime)} — {formatTime(selectedEvent.endTime)}</span>
                                </div>
                                {selectedEvent.description && (
                                    <div className="p-4 bg-slate-800/50 rounded-xl text-sm text-slate-300">
                                        {selectedEvent.description}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => openEditModal(selectedEvent)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteMeeting(selectedEvent.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl font-bold transition-all border border-red-500/20"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CREATE / EDIT MEETING MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center" onClick={() => { setIsModalOpen(false); setEditingMeeting(null); }}>
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", editingMeeting ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500")}>
                                        {editingMeeting ? <Edit2 size={24} /> : <CalendarIcon size={24} />}
                                    </div>
                                    <h2 className="text-2xl font-bold">{editingMeeting ? 'Edit Event' : 'Schedule Event'}</h2>
                                </div>
                                <button onClick={() => { setIsModalOpen(false); setEditingMeeting(null); }} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={editingMeeting ? handleEditMeeting : handleCreateMeeting} className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Event Title</label>
                                    <input
                                        value={editingMeeting ? editingMeeting.title : newMeeting.title}
                                        onChange={e => editingMeeting
                                            ? setEditingMeeting({ ...editingMeeting, title: e.target.value })
                                            : setNewMeeting({ ...newMeeting, title: e.target.value })
                                        }
                                        className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter title..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Description</label>
                                    <textarea
                                        value={editingMeeting ? (editingMeeting.description || '') : newMeeting.description}
                                        onChange={e => editingMeeting
                                            ? setEditingMeeting({ ...editingMeeting, description: e.target.value })
                                            : setNewMeeting({ ...newMeeting, description: e.target.value })
                                        }
                                        className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 h-20"
                                        placeholder="Add notes..."
                                    />
                                </div>

                                {editingMeeting ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-slate-400 block mb-1">Start</label>
                                            <input
                                                type="datetime-local"
                                                value={editingMeeting.startTime ? editingMeeting.startTime.slice(0, 16) : ''}
                                                onChange={e => setEditingMeeting({ ...editingMeeting, startTime: e.target.value })}
                                                className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-slate-400 block mb-1">End</label>
                                            <input
                                                type="datetime-local"
                                                value={editingMeeting.endTime ? editingMeeting.endTime.slice(0, 16) : ''}
                                                onChange={e => setEditingMeeting({ ...editingMeeting, endTime: e.target.value })}
                                                className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-slate-400 block mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                onChange={e => setNewMeeting({ ...newMeeting, startTime: `${selectedDate}T${e.target.value}` })}
                                                className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-slate-400 block mb-1">End Time</label>
                                            <input
                                                type="time"
                                                onChange={e => setNewMeeting({ ...newMeeting, endTime: `${selectedDate}T${e.target.value}` })}
                                                className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-bold text-slate-400 block mb-1">Event Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => editingMeeting
                                                ? setEditingMeeting({ ...editingMeeting, type: 'MEETING' })
                                                : setNewMeeting({ ...newMeeting, type: 'MEETING' })
                                            }
                                            className={cn("p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2",
                                                (editingMeeting ? editingMeeting.type : newMeeting.type) === 'MEETING'
                                                    ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700 text-slate-400")}
                                        >
                                            <User size={16} /> Client Meeting
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editingMeeting
                                                ? setEditingMeeting({ ...editingMeeting, type: 'BOOKING' })
                                                : setNewMeeting({ ...newMeeting, type: 'BOOKING' })
                                            }
                                            className={cn("p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2",
                                                (editingMeeting ? editingMeeting.type : newMeeting.type) === 'BOOKING'
                                                    ? "bg-emerald-600 border-emerald-500" : "bg-slate-800 border-slate-700 text-slate-400")}
                                        >
                                            <CalendarIcon size={16} /> Studio Booking
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold mt-4 shadow-lg shadow-blue-900/40 transition-all">
                                    {editingMeeting ? 'Save Changes' : 'Confirm Appointment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        .fc { --fc-border-color: #1e293b; --fc-button-bg-color: #1e293b; --fc-button-border-color: #334155; --fc-today-bg-color: #1e293b; }
        .fc-theme-standard td, .fc-theme-standard th { border: 1px solid #1e293b; }
        .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active { background-color: #2563eb !important; }
        .fc-daygrid-day:hover { background-color: #0f172a; cursor: pointer; }
        .fc-event { border-radius: 6px; padding: 2px 4px; font-weight: bold; font-size: 11px; cursor: pointer; }
        .fc-event:hover { opacity: 0.85; }
        .fc-toolbar { flex-wrap: wrap; gap: 8px; }
        .fc-toolbar-title { font-size: 1.1rem !important; }
        .fc .fc-button { padding: 4px 10px; font-size: 12px; }
        @media (max-width: 640px) {
          .fc-toolbar { justify-content: center !important; }
          .fc-toolbar-title { font-size: 0.9rem !important; width: 100%; text-align: center; order: -1; }
          .fc-toolbar-chunk { display: flex; justify-content: center; }
          .fc .fc-button { padding: 6px 8px; font-size: 11px; }
          .fc-col-header-cell-cushion { font-size: 10px; }
          .fc-daygrid-day-number { font-size: 11px; padding: 2px 4px !important; }
          .fc-event { font-size: 9px; padding: 1px 3px; }
        }
      `}</style>
        </div>
    );
}
