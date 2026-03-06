'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import {
    Plus, Search, Download, Edit2,
    Trash2, CreditCard, IndianRupee,
    FileText, TrendingUp, Clock, AlertCircle, X, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useRef } from 'react';

// Dynamically import html2pdf to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;


export default function InvoicesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [newInvoice, setNewInvoice] = useState({
        invoiceNumber: '',
        amount: '',  // Use string for input flexibility
        tax: '',
        taxRate: 18,
        projectId: ''
    });

    // Helper to prevent leading zeros
    const cleanNumberInput = (value: string) => {
        const cleaned = value.replace(/^0+(?=\d)/, '');
        return cleaned === '' ? '0' : cleaned;
    };

    // Correctly calculate total for creating invoice
    const createTotal = useMemo(() => {
        const base = parseFloat(newInvoice.amount as string) || 0;
        const tax = parseFloat(newInvoice.tax as string) || 0;
        return base + tax;
    }, [newInvoice.amount, newInvoice.tax]);

    // Correctly calculate total for editing invoice
    const editTotal = useMemo(() => {
        if (!editingInvoice) return 0;
        const base = parseFloat(editingInvoice.amount as string) || 0;
        const tax = parseFloat(editingInvoice.tax as string) || 0;
        return base + tax;
    }, [editingInvoice]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pdfInvoice, setPdfInvoice] = useState<any>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInvoices();
        fetchProjects();
    }, []);

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
                taxRate: parseFloat(newInvoice.taxRate.toString()) || 18
            });
            setIsModalOpen(false);
            setNewInvoice({ invoiceNumber: '', amount: '', tax: '', taxRate: 18, projectId: '' });
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
                invoiceNumber: editingInvoice.invoiceNumber,
                amount: parseFloat(editingInvoice.amount as string) || 0,
                tax: parseFloat(editingInvoice.tax as string) || 0,
                taxRate: parseFloat(editingInvoice.taxRate as string) || 18,
                projectId: editingInvoice.projectId || null,
                status: editingInvoice.status,
            });
            setEditingInvoice(null);
            fetchInvoices();
        } catch (err) {
            console.error(err);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const downloadPDF = async (invoice: any) => {
        setPdfInvoice(invoice);

        // Wait for state update and rendering
        setTimeout(() => {
            if (!invoiceRef.current || !html2pdf) return;

            const opt = {
                margin: 10,
                filename: `invoice-${invoice.invoiceNumber}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(invoiceRef.current).set(opt).save().then(() => {
                setPdfInvoice(null);
            });
        }, 500);
    };

    const filteredInvoices = invoices.filter(i =>
        (i.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Billing & Invoices</h1>
                    <p className="text-sm text-slate-400">Manage your earnings, taxes, and client billing.</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search invoices..."
                            className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg"
                    >
                        <Plus size={20} />
                        Create Invoice
                    </button>
                </div>
            </header>

            {/* Finance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center group hover:border-emerald-500/20 transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Revenue</p>
                        <h2 className="text-3xl font-bold mt-1 text-emerald-400">₹{invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0).toLocaleString()}</h2>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                </div>
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center group hover:border-amber-500/20 transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending</p>
                        <h2 className="text-3xl font-bold mt-1 text-amber-400">₹{invoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + (i.amount || 0) + (i.tax || 0), 0).toLocaleString()}</h2>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center group hover:border-blue-500/20 transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Invoices issued</p>
                        <h2 className="text-3xl font-bold mt-1">{invoices.length}</h2>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Number</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Project</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredInvoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-slate-800/30 transition-all group">
                                <td className="px-6 py-4 font-bold text-slate-200">#{invoice.invoiceNumber}</td>
                                <td className="px-6 py-4 text-slate-400">{invoice.project?.name || 'Manual Billing'}</td>
                                <td className="px-6 py-4 font-bold text-emerald-400">₹{((invoice.amount || 0) + (invoice.tax || 0)).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold",
                                        invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-400')}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingInvoice(invoice)}
                                            className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => downloadPDF(invoice)}
                                            className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                        <FileText size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium">No invoices found</p>
                    </div>
                )}
            </div>

            {/* CREATE INVOICE MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                                        <CreditCard size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold">Generate Invoice</h2>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleCreateInvoice} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Invoice #</label>
                                        <input
                                            value={newInvoice.invoiceNumber || ''}
                                            onChange={e => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-mono transition-all"
                                            placeholder="INV-1001"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Project Link</label>
                                        <select
                                            value={newInvoice.projectId || ''}
                                            onChange={e => setNewInvoice({ ...newInvoice, projectId: e.target.value })}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select a Project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Base Amount (₹)</label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            value={newInvoice.amount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                const valStr = cleanNumberInput(e.target.value);
                                                const valNum = parseFloat(valStr) || 0;
                                                const tax = Math.round(valNum * (newInvoice.taxRate / 100));
                                                setNewInvoice({ ...newInvoice, amount: valStr, tax: tax.toString() });
                                            }}
                                            className="w-full bg-slate-800 pl-10 pr-4 py-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tax Rate (%)</label>
                                        <select
                                            value={newInvoice.taxRate}
                                            onChange={e => {
                                                const rate = parseFloat(e.target.value);
                                                const baseNum = parseFloat(newInvoice.amount as string) || 0;
                                                const tax = Math.round(baseNum * (rate / 100));
                                                setNewInvoice({ ...newInvoice, taxRate: rate, tax: tax.toString() });
                                            }}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                            <option value="0">0% (GST Free)</option>
                                            <option value="5">5% (GST)</option>
                                            <option value="12">12% (GST)</option>
                                            <option value="18">18% (Standard GST)</option>
                                            <option value="28">28% (Luxury GST)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tax Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={newInvoice.tax}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setNewInvoice({ ...newInvoice, tax: cleanNumberInput(e.target.value) })}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-300"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Total Payable</p>
                                            <h3 className="text-3xl font-bold text-white">₹{createTotal.toLocaleString()}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Verified Billing</p>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold mt-2 shadow-xl shadow-blue-900/40 transition-all transform active:scale-[0.98]">
                                    Generate & Issue Invoice
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT INVOICE MODAL */}
            <AnimatePresence>
                {editingInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingInvoice(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                                        <Edit2 size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold">Edit Invoice</h2>
                                </div>
                                <button onClick={() => setEditingInvoice(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleEditInvoice} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Invoice #</label>
                                        <input
                                            value={editingInvoice.invoiceNumber}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value })}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Status</label>
                                        <select
                                            value={editingInvoice.status}
                                            onChange={e => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="PAID">Paid</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Base Amount (₹)</label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            value={editingInvoice.amount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                const valStr = cleanNumberInput(e.target.value);
                                                const valNum = parseFloat(valStr) || 0;
                                                const rate = parseFloat(editingInvoice.taxRate?.toString() || '18');
                                                const tax = Math.round(valNum * (rate / 100));
                                                setEditingInvoice({ ...editingInvoice, amount: valStr, tax: tax.toString() });
                                            }}
                                            className="w-full bg-slate-800 pl-10 pr-4 py-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tax Rate (%)</label>
                                        <select
                                            value={editingInvoice.taxRate || 18}
                                            onChange={e => {
                                                const rate = parseFloat(e.target.value);
                                                const baseNum = parseFloat(editingInvoice.amount?.toString() || '0');
                                                const tax = Math.round(baseNum * (rate / 100));
                                                setEditingInvoice({ ...editingInvoice, taxRate: rate, tax: tax.toString() });
                                            }}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="0">0% (None)</option>
                                            <option value="5">5% (GST)</option>
                                            <option value="12">12% (GST)</option>
                                            <option value="18">18% (GST)</option>
                                            <option value="28">28% (GST)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Tax Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={editingInvoice.tax}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setEditingInvoice({ ...editingInvoice, tax: cleanNumberInput(e.target.value) })}
                                            className="w-full bg-slate-800 p-3.5 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-900/10 border border-emerald-900/20 rounded-xl mt-4">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-emerald-400 uppercase tracking-widest">Calculated Total</span>
                                        <span className="text-white text-xl">₹{editTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setEditingInvoice(null)} className="flex-1 py-3 font-bold text-slate-400 hover:text-white transition-all">Discard Changes</button>
                                    <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-900/40 transition-all">Confirm Update</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Hidden PDF Template for generation */}
            <div className="hidden">
                <div
                    ref={invoiceRef}
                    className="p-12 bg-white text-slate-950 w-[210mm] min-h-[297mm] font-sans"
                    style={{
                        backgroundColor: '#ffffff',
                        color: '#020617',
                    }}
                >
                    {pdfInvoice && (
                        <div className="space-y-12">
                            <div className="flex justify-between items-start pb-8" style={{ borderBottom: '4px solid #2563eb' }}>
                                <div>
                                    <h1 className="text-5xl font-black tracking-tighter" style={{ color: '#2563eb' }}>INVOICE</h1>
                                    <p className="text-xl font-bold mt-2" style={{ color: '#64748b' }}>#{pdfInvoice.invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-black" style={{ color: '#020617' }}>EditPro Studio</h2>
                                    <p className="text-sm font-bold" style={{ color: '#64748b' }}>Premium Video Production</p>
                                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>contact@editpro.studio</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Billed To</p>
                                    <h3 className="text-xl font-bold" style={{ color: '#020617' }}>{pdfInvoice.project?.client?.name || 'Valued Client'}</h3>
                                    <p className="text-sm font-medium" style={{ color: '#64748b' }}>{pdfInvoice.project?.name || 'Professional Services'}</p>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Date Issued</p>
                                    <h3 className="text-lg font-bold" style={{ color: '#020617' }}>{new Date(pdfInvoice.createdAt).toLocaleDateString()}</h3>
                                    <p className="text-sm font-medium" style={{ color: '#64748b' }}>Due: Upon Receipt</p>
                                </div>
                            </div>

                            <div className="mt-12">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th className="py-4 text-xs font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Description</th>
                                            <th className="py-4 text-right text-xs font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="py-6">
                                                <h4 className="font-bold text-lg" style={{ color: '#020617' }}>{pdfInvoice.project?.name || 'Video Editing Services'}</h4>
                                                <p className="text-sm" style={{ color: '#64748b' }}>Cinematic Post-Production & Delivery</p>
                                            </td>
                                            <td className="py-6 text-right font-bold text-lg" style={{ color: '#020617' }}>₹{(pdfInvoice.amount || 0).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-12">
                                <div className="w-80 space-y-4">
                                    <div className="flex justify-between text-sm font-bold" style={{ color: '#64748b' }}>
                                        <span>Subtotal</span>
                                        <span>₹{(pdfInvoice.amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold" style={{ color: '#64748b' }}>
                                        <span>Tax ({pdfInvoice.taxRate || 18}%)</span>
                                        <span>₹{(pdfInvoice.tax || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="h-px w-full my-4" style={{ backgroundColor: '#e2e8f0' }} />
                                    <div className="flex justify-between text-2xl font-black" style={{ color: '#2563eb' }}>
                                        <span>TOTAL</span>
                                        <span>₹{((pdfInvoice.amount || 0) + (pdfInvoice.tax || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-24 pt-12 text-center" style={{ borderTop: '1px solid #f1f5f9' }}>
                                <p className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(37, 99, 235, 0.5)' }}>Thank you for your business</p>
                                <p className="text-[10px] mt-2 font-medium" style={{ color: '#94a3b8' }}>&copy; 2026 EditPro Studio. All Rights Reserved.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
