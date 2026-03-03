'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
    User, Bell, Shield,
    Settings, Save, CheckCircle,
    Trash2, Mail, Lock, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const { user, fetchProfile, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync name if user profile loads after initial render
    useEffect(() => {
        if (user?.name && !name) {
            setName(user.name);
        }
    }, [user?.name]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            await api.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await fetchProfile();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            alert("Passwords don't match!");
            return;
        }
        if (!passwords.old || !passwords.new) {
            alert("Please fill all fields!");
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword: passwords.old,
                newPassword: passwords.new
            });
            setSuccess(true);
            setPasswords({ old: '', new: '', confirm: '' });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Account Security', icon: Shield },
        { id: 'billing', label: 'Billing Plan', icon: Settings },
        { id: 'logout', label: 'Sign Out', icon: Trash2 },
    ];

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Studio Settings</h1>
                    <p className="text-sm text-slate-400">Manage your account preferences and studio configurations.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : success ? <CheckCircle size={20} /> : <Save size={20} />}
                    {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                {/* Mobile: Horizontal scrollable tabs */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    {/* Mobile tabs */}
                    <div className="flex md:hidden overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => tab.id === 'logout' ? logout() : setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                    {/* Desktop tabs */}
                    <div className="hidden md:flex md:flex-col space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => tab.id === 'logout' ? logout() : setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'}`}
                            >
                                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                                <span className="font-bold">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 shadow-xl">
                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4 md:gap-6 pb-6 md:pb-8 border-b border-slate-800">
                                <div className="relative group flex-shrink-0">
                                    <img
                                        src={previewUrl || user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`}
                                        className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border-2 border-slate-800 object-cover"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 md:flex items-center justify-center transition-opacity cursor-pointer flex"
                                    >
                                        <Camera size={18} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg md:text-xl font-bold truncate">{user?.name}</h2>
                                    <p className="text-slate-500 text-xs md:text-sm">Professional Editor • {user?.role}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                    <input
                                        value={name || ''}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        disabled
                                        value={user?.email || ''}
                                        className="w-full bg-slate-800/50 p-3 rounded-xl outline-none ring-1 ring-slate-700 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Timezone</label>
                                    <select className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500">
                                        <option>UTC +05:30 (India Standard Time)</option>
                                        <option>UTC -05:00 (Eastern Standard Time)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Daily Summary</label>
                                    <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl ring-1 ring-slate-700">
                                        <input type="checkbox" className="w-4 h-4 rounded-md accent-blue-600" defaultChecked />
                                        <span className="text-sm font-bold">Enable Daily Email Summary</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <h3 className="text-lg font-bold">Notification Preferences</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Project Deadlines', desc: 'Notify when a project is due in 24 hours' },
                                    { label: 'Client Messages', desc: 'Instant alert when a client sends a message' },
                                    { label: 'Studio Bookings', desc: 'Confirmation emails for slotted studio time' },
                                ].map(pref => (
                                    <div key={pref.label} className="flex justify-between items-center p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all">
                                        <div>
                                            <p className="font-bold text-sm">{pref.label}</p>
                                            <p className="text-xs text-slate-500">{pref.desc}</p>
                                        </div>
                                        <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1">
                                            <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <h3 className="text-lg font-bold">Account Security</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwords.old || ''}
                                        onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                                        className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                                        <input
                                            type="password"
                                            value={passwords.new || ''}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm || ''}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl font-bold transition-all border border-blue-500/20 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'billing' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <h3 className="text-lg font-bold">Studio Billing Plan</h3>
                            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-blue-100 text-sm font-bold uppercase tracking-widest">Current Plan</p>
                                        <h2 className="text-3xl font-bold">Pro Creator</h2>
                                    </div>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">Active</span>
                                </div>
                                <p className="text-blue-100 text-sm">₹2,499 / Month • Next billing on April 02, 2026</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest pt-4">Plan Benefits</h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['Unlimited Projects', 'AI Schedule Optimization', 'Priority Studio Booking', 'Custom Invoice Brading'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                                            <CheckCircle size={16} className="text-emerald-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 border-2 border-slate-700 hover:border-slate-600 rounded-2xl font-bold text-slate-300 transition-all mt-4">
                                    Upgrade to Enterprise
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'logout' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
                                <Trash2 size={48} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">Sign Out of EditPro</h3>
                                <p className="text-slate-400 mt-1">Are you sure you want to log out of your current session?</p>
                            </div>
                            <button
                                onClick={logout}
                                className="px-12 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                            >
                                Sign Out Now
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
