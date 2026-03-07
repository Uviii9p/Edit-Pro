'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import api from '@/lib/api';
import {
    Plus, Search, Download, Edit2,
    Trash2, CreditCard, IndianRupee,
    FileText, TrendingUp, Clock, X, CheckCircle, Building2,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const EDITOR_STORAGE_KEY = 'editpro_editor_details';

const defaultEditorDetails = {
    companyName: 'EditPro Studio',
    email: 'contact@editpro.studio',
    phone: '+91 98765 43210',
    website: 'www.editpro.studio',
    address: 'Mumbai, Maharashtra, India',
    gstin: '27XXXXX1234X1ZX',
    bankName: 'State Bank of India',
    accountNo: 'XXXX XXXX 4567',
    ifsc: 'SBIN0001234',
    upi: 'editpro@upi',
};

export default function InvoicesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showEditorSettings, setShowEditorSettings] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [newInvoice, setNewInvoice] = useState({
        invoiceNumber: '',
        amount: '',
        tax: '',
        taxRate: 18,
        projectId: '',
        dueDate: ''
    });

    const [editorDetails, setEditorDetails] = useState(defaultEditorDetails);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pdfInvoice, setPdfInvoice] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(EDITOR_STORAGE_KEY);
            if (saved) {
                try { setEditorDetails({ ...defaultEditorDetails, ...JSON.parse(saved) }); } catch { /* ignore */ }
            }
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
        fetchProjects();
    }, []);

    const saveEditorDetails = () => {
        localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editorDetails));
        setShowEditorSettings(false);
    };

    const cleanNumberInput = (value: string) => {
        const cleaned = value.replace(/^0+(?=\d)/, '');
        return cleaned === '' ? '0' : cleaned;
    };

    const fetchInvoices = async () => {
        try {
            const resp = await api.get('/invoices');
            setInvoices(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const resp = await api.get('/projects');
            setProjects(resp.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/invoices', {
                ...newInvoice,
                amount: parseFloat(newInvoice.amount as string) || 0,
                tax: parseFloat(newInvoice.tax as string) || 0,
                taxRate: parseFloat(newInvoice.taxRate.toString()) || 18,
                dueDate: newInvoice.dueDate || undefined
            });
            setIsModalOpen(false);
            setNewInvoice({ invoiceNumber: '', amount: '', tax: '', taxRate: 18, projectId: '', dueDate: '' });
            fetchInvoices();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInvoice) return;
        try {
            await api.put(`/invoices/${editingInvoice.id}`, {
                ...editingInvoice,
                amount: parseFloat(editingInvoice.amount as string) || 0,
                tax: parseFloat(editingInvoice.tax as string) || 0,
                taxRate: parseFloat(editingInvoice.taxRate as string) || 18,
            });
            setEditingInvoice(null);
            fetchInvoices();
        } catch (err) {
            console.error(err);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const downloadPDF = async (invoice: any) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            setPdfInvoice(invoice);
            // Give React enough time to render the hidden template completely
            await new Promise(r => setTimeout(r, 1000));

            if (!invoiceRef.current) {
                throw new Error("Canvas reference missing");
            }

            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default || html2pdfModule;

            const opt = {
                margin: 0,
                filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    windowWidth: 800
                },
                jsPDF: {
                    unit: 'mm' as const,
                    format: 'a4' as const,
                    orientation: 'portrait' as const
                }
            };

            // Execute PDF generation and wait for save
            await html2pdf().from(invoiceRef.current).set(opt).save();
        } catch (err: any) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF: " + (err.message || err.toString()));
        } finally {
            setPdfInvoice(null);
            setIsProcessing(false);
        }
    };

    const createTotal = useMemo(() => {
        const base = parseFloat(newInvoice.amount as string) || 0;
        const tax = parseFloat(newInvoice.tax as string) || 0;
        return base + tax;
    }, [newInvoice.amount, newInvoice.tax]);

    const editTotal = useMemo(() => {
        if (!editingInvoice) return 0;
        const base = parseFloat(editingInvoice.amount as string) || 0;
        const tax = parseFloat(editingInvoice.tax as string) || 0;
        return base + tax;
    }, [editingInvoice]);

    const filteredInvoices = invoices.filter(i =>
        (i.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Billing Data...</div>;

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Billing & Invoices</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">Professional revenue tracking & business identity.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search invoices..."
                            className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-200"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95"
                        >
                            <Plus size={18} />
                            Create
                        </button>
                        <button
                            onClick={() => setShowEditorSettings(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                        >
                            <Building2 size={18} />
                            Details
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-emerald-500/20 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-emerald-500/70">Total Revenue</p>
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white">₹{invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0).toLocaleString()}</h2>
                </div>

                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-amber-500/20 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-amber-500/70">Outstanding</p>
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover:scale-110 transition-transform">
                            <Clock size={16} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white">₹{invoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0).toLocaleString()}</h2>
                </div>

                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-blue-500/20 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-blue-500/70">Issued</p>
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                            <FileText size={16} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white">{invoices.length} <span className="text-xs font-medium text-slate-500 ml-1">Invoices</span></h2>
                </div>

                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-purple-500/20 transition-all cursor-pointer" onClick={() => setShowEditorSettings(true)}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-purple-400">Identity</p>
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                            <Building2 size={16} />
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{editorDetails.companyName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{editorDetails.email}</p>
                    </div>
                </div>
            </div>

            {/* Mobile List View */}
            <div className="space-y-4 md:hidden">
                {filteredInvoices.map(invoice => (
                    <div key={invoice.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all active:scale-[0.99]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-200">#{invoice.invoiceNumber}</h3>
                                <p className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]">{invoice.project?.name || 'Manual Billing'}</p>
                            </div>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider",
                                invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    invoice.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20')}>
                                {invoice.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Amount</p>
                                <p className="text-xl font-black text-slate-100">₹{((invoice.amount || 0) + (invoice.tax || 0)).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => downloadPDF(invoice)} className="p-2.5 bg-slate-800 rounded-xl text-blue-400 border border-slate-700 active:bg-slate-700"><Download size={16} /></button>
                                <button onClick={() => { setEditingInvoice(invoice); setIsModalOpen(true); }} className="p-2.5 bg-slate-800 rounded-xl text-amber-500 border border-slate-700 active:bg-slate-700"><Edit2 size={16} /></button>
                                <button onClick={() => { if (confirm('Delete?')) api.delete(`/invoices/${invoice.id}`).then(() => fetchInvoices()); }} className="p-2.5 bg-slate-800 rounded-xl text-red-400 border border-slate-700 active:bg-red-900/20"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Client & Project</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredInvoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-slate-800/30 transition-all group">
                                <td className="px-6 py-4">
                                    <p className="font-black text-slate-200">#{invoice.invoiceNumber}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-200 font-bold">{invoice.project?.clientName || 'Valued Client'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate max-w-[200px]">{invoice.project?.name || 'Direct Billing'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-100">₹{((invoice.amount || 0) + (invoice.tax || 0)).toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-500 font-bold">Tax: ₹{invoice.tax?.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider",
                                        invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            invoice.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-amber-500/10 text-amber-500 border-amber-500/20')}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => downloadPDF(invoice)} className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition-all" title="Download"><Download size={18} /></button>
                                        <button onClick={() => { setEditingInvoice(invoice); setIsModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-lg text-amber-500 transition-all" title="Edit"><Edit2 size={18} /></button>
                                        <button onClick={() => { if (confirm('Delete?')) api.delete(`/invoices/${invoice.id}`).then(() => fetchInvoices()); }} className="p-2 hover:bg-red-900/20 rounded-lg text-red-400 transition-all" title="Delete"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                        <FileText size={48} className="mb-4 opacity-10" />
                        <p className="text-sm font-black uppercase tracking-widest opacity-40">No Invoices Found</p>
                    </div>
                )}
            </div>

            {/* Modals & PDF Template (Shared with original logic) */}
            <AnimatePresence>
                {(isModalOpen || editingInvoice) && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setIsModalOpen(false); setEditingInvoice(null); }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] w-full max-w-lg shadow-2xl relative my-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2.5 rounded-xl", editingInvoice ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500")}>
                                        <CreditCard size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white">{editingInvoice ? 'Edit' : 'Issue'} Invoice</h2>
                                </div>
                                <button onClick={() => { setIsModalOpen(false); setEditingInvoice(null); }} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={editingInvoice ? handleEditInvoice : handleCreateInvoice} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice #</label>
                                        <input
                                            value={editingInvoice ? editingInvoice.invoiceNumber : newInvoice.invoiceNumber}
                                            onChange={e => {
                                                if (editingInvoice) setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value });
                                                else setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value });
                                            }}
                                            className="w-full bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="INV-101"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{editingInvoice ? 'Status' : 'Project'}</label>
                                        {editingInvoice ? (
                                            <select
                                                value={editingInvoice.status}
                                                onChange={e => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="PAID">Paid</option>
                                                <option value="OVERDUE">Overdue</option>
                                            </select>
                                        ) : (
                                            <select
                                                value={newInvoice.projectId}
                                                onChange={e => setNewInvoice({ ...newInvoice, projectId: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">None / Manual</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Base Amount (₹)</label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="number"
                                            value={editingInvoice ? editingInvoice.amount : newInvoice.amount}
                                            onChange={e => {
                                                const val = cleanNumberInput(e.target.value);
                                                const rate = editingInvoice ? editingInvoice.taxRate : newInvoice.taxRate;
                                                const tax = Math.round(parseFloat(val || '0') * (rate / 100));
                                                if (editingInvoice) setEditingInvoice({ ...editingInvoice, amount: val, tax: tax.toString() });
                                                else setNewInvoice({ ...newInvoice, amount: val, tax: tax.toString() });
                                            }}
                                            className="w-full bg-slate-950/50 border border-slate-800 pl-10 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tax Rate (%)</label>
                                        <select
                                            value={editingInvoice ? editingInvoice.taxRate : newInvoice.taxRate}
                                            onChange={e => {
                                                const rate = parseFloat(e.target.value);
                                                const base = editingInvoice ? editingInvoice.amount : newInvoice.amount;
                                                const tax = Math.round(parseFloat(base || '0') * (rate / 100));
                                                if (editingInvoice) setEditingInvoice({ ...editingInvoice, taxRate: rate, tax: tax.toString() });
                                                else setNewInvoice({ ...newInvoice, taxRate: rate, tax: tax.toString() });
                                            }}
                                            className="w-full bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Calculated Tax</label>
                                        <div className="w-full bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl text-slate-400 font-bold text-sm">
                                            ₹{(editingInvoice ? editingInvoice.tax : newInvoice.tax) || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Payable</p>
                                        <h3 className="text-3xl font-black text-white">₹{(editingInvoice ? editTotal : createTotal).toLocaleString()}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Verified Billing System</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-white shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] mt-2"
                                >
                                    {editingInvoice ? 'Update Records' : 'Generate & Issue Invoice'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Business Details Modal */}
            <AnimatePresence>
                {showEditorSettings && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowEditorSettings(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl relative my-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-500/20 text-purple-500 rounded-xl">
                                        <Building2 size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white">Business Identity</h2>
                                </div>
                                <button onClick={() => setShowEditorSettings(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">Public Information</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                                            <input value={editorDetails.companyName} onChange={e => setEditorDetails({ ...editorDetails, companyName: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                            <input value={editorDetails.email} onChange={e => setEditorDetails({ ...editorDetails, email: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Address</label>
                                            <textarea value={editorDetails.address} onChange={e => setEditorDetails({ ...editorDetails, address: e.target.value })} rows={2} className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">Financial Details</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">GSTIN</label>
                                            <input value={editorDetails.gstin} onChange={e => setEditorDetails({ ...editorDetails, gstin: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase font-mono" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                                            <input value={editorDetails.accountNo} onChange={e => setEditorDetails({ ...editorDetails, accountNo: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">IFSC Code</label>
                                            <input value={editorDetails.ifsc} onChange={e => setEditorDetails({ ...editorDetails, ifsc: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase font-mono" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={saveEditorDetails} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                Update Application Identity
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center gap-4"
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <div className="text-center">
                            <h3 className="text-xl font-black text-white tracking-tight">Generating Studio Export</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Please wait while we prepare your document...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden PDF Canvas - Improved Stability */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div
                    ref={invoiceRef}
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        padding: '20mm',
                        boxSizing: 'border-box',
                        fontFamily: 'sans-serif'
                    }}
                >
                    {pdfInvoice ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {/* PDF Content (Hardcoded Hex Colors for Canvas Parser Compatibility) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #0f172a', paddingBottom: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{editorDetails.companyName}</h1>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ fontSize: '14px', color: '#475569', fontWeight: 700, margin: 0 }}>{editorDetails.website}</p>
                                        <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Studio Manager Identity</p>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '16px', maxWidth: '300px', lineHeight: 1.5, fontWeight: 500 }}>{editorDetails.address}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '8px 24px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>INVOICE</h2>
                                    </div>
                                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>#{pdfInvoice.invoiceNumber}</p>
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Issued On</p>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: 0 }}>{new Date(pdfInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '64px', paddingTop: '32px', paddingBottom: '32px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Bill To</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', margin: 0 }}>{pdfInvoice.project?.clientName || 'Valued Client'}</h3>
                                        <p style={{ fontSize: '14px', color: '#475569', fontWeight: 700, margin: 0 }}>{pdfInvoice.project?.clientEmail || 'client@example.com'}</p>
                                    </div>
                                    <div style={{ paddingTop: '8px' }}>
                                        <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{pdfInvoice.project?.clientAddress || 'Client Location unavailable'}</p>
                                    </div>
                                </div>
                                <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '32px', borderRadius: '40px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', margin: 0 }}>Settlement Info</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                            <span style={{ fontWeight: 700, color: '#64748b' }}>Bank</span>
                                            <span style={{ fontWeight: 900, color: '#0f172a' }}>{editorDetails.bankName}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                            <span style={{ fontWeight: 700, color: '#64748b' }}>Account</span>
                                            <span style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{editorDetails.accountNo}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                            <span style={{ fontWeight: 700, color: '#64748b' }}>IFSC</span>
                                            <span style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', textTransform: 'uppercase' }}>{editorDetails.ifsc}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                            <span style={{ fontWeight: 700, color: '#64748b' }}>UPI ID</span>
                                            <span style={{ fontWeight: 900, color: '#2563eb', fontFamily: 'monospace' }}>{editorDetails.upi}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #0f172a' }}>
                                            <th style={{ padding: '16px 0', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', textAlign: 'left' }}>Services Description</th>
                                            <th style={{ padding: '16px 0', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', textAlign: 'right' }}>Amount (INR)</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <tr>
                                            <td style={{ padding: '40px 0' }}>
                                                <p style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{pdfInvoice.project?.name || 'Professional Services'}</p>
                                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 500, fontStyle: 'italic', borderLeft: '2px solid #e2e8f0', paddingLeft: '16px', margin: 0 }}>Digital media creation, post-production services and technical consultation provided for the specified project duration.</p>
                                            </td>
                                            <td style={{ padding: '40px 0', textAlign: 'right', verticalAlign: 'top' }}>
                                                <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>₹{pdfInvoice.amount?.toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '48px', backgroundColor: '#f8fafc', padding: '40px', borderRadius: '48px' }}>
                                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        <span>Subtotal</span>
                                        <span style={{ color: '#0f172a' }}>₹{pdfInvoice.amount?.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                                        <span>GST ({pdfInvoice.taxRate}%)</span>
                                        <span style={{ color: '#0f172a' }}>₹{pdfInvoice.tax?.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', textDecoration: 'underline', textDecorationColor: '#3b82f6', textDecorationThickness: '4px' }}>Grand Total</span>
                                            <p style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Inclusive of all taxes</p>
                                        </div>
                                        <span style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>₹{((pdfInvoice.amount || 0) + (pdfInvoice.tax || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '96px', textAlign: 'center' }}>
                                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '32px', display: 'inline-block', paddingLeft: '48px', paddingRight: '48px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '8px', margin: 0 }}>Authenticated Studio Document</p>
                                    <p style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 700, maxWidth: '320px', margin: '0 auto' }}>This document is electronically generated by EditPro Studio Manager. No physical signature is required for validity. 2026 Studio Operations.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '297mm' }}>
                            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Initializing rendering engine...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
