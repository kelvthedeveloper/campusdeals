'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import { User, Mail, MapPin, Phone, Shield, Camera, Lock, Check, AlertCircle } from 'lucide-react';
import { User as UserType } from '@/types';
import Image from 'next/image';

type Tab = 'profile' | 'password';

export default function ProfilePage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile form state
    const [formData, setFormData] = useState({
        phone_number: '',
        address: '',
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/auth/me/');
            setUser(data);
            setFormData({
                phone_number: data.phone_number || '',
                address: data.address || '',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append('phone_number', formData.phone_number);
            formDataObj.append('address', formData.address);

            const { data } = await api.put('/auth/profile/', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUser(data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setSaving(false);
            return;
        }

        try {
            await api.post('/auth/password/change/', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setActiveTab('profile');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaving(true);
        setMessage(null);

        const formDataObj = new FormData();
        formDataObj.append('profile_picture', file);

        try {
            const { data } = await api.put('/auth/profile/', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUser(data);
            setMessage({ type: 'success', text: 'Profile picture updated!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload picture' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-10 w-48 bg-slate-100 rounded" />
                <div className="h-96 bg-slate-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Profile Settings</h1>
                <p className="text-secondary mt-1">Manage your identity and campus preferences.</p>
            </div>

            {message && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left sidebar - Profile summary */}
                <div className="lg:col-span-1">
                    <Card className="p-6 text-center">
                        <div className="relative inline-block">
                            <div className="h-24 w-24 mx-auto rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                                {user?.profile_picture ? (
                                    <Image
                                        src={user.profile_picture}
                                        alt={user.username}
                                        width={96}
                                        height={96}
                                        className="object-cover h-full w-full"
                                        unoptimized
                                    />
                                ) : (
                                    <User className="h-12 w-12 text-slate-400" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 h-8 w-8 bg-action text-white rounded-full flex items-center justify-center hover:bg-action/90 transition"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePictureUpload}
                            />
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-primary">{user?.username}</h2>
                        <p className="text-sm text-secondary">{user?.email}</p>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider mt-3 ${
                            user?.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                            user?.role === 'STAFF' ? 'bg-blue-50 text-blue-700' :
                            'bg-slate-50 text-slate-700'
                        }`}>
                            <Shield className="h-3 w-3" />
                            {user?.role}
                        </span>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="text-left space-y-3">
                                <div className="flex items-center gap-3 text-sm text-secondary">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span>{user?.phone_number || 'No phone'}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-secondary">
                                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <span className="line-clamp-2">{user?.address || 'No address'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main content */}
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-slate-100 mb-6">
                            <button
                                onClick={() => { setActiveTab('profile'); setMessage(null); }}
                                className={`pb-3 text-sm font-bold transition relative ${
                                    activeTab === 'profile' ? 'text-action' : 'text-secondary hover:text-primary'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Edit Profile
                                </span>
                                {activeTab === 'profile' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-action rounded-full" />
                                )}
                            </button>
                            <button
                                onClick={() => { setActiveTab('password'); setMessage(null); }}
                                className={`pb-3 text-sm font-bold transition relative ${
                                    activeTab === 'password' ? 'text-action' : 'text-secondary hover:text-primary'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Change Password
                                </span>
                                {activeTab === 'password' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-action rounded-full" />
                                )}
                            </button>
                        </div>

                        {/* Profile Form */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                            Username
                                        </label>
                                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <User className="h-5 w-5 text-slate-400" />
                                            <span className="text-primary font-medium">{user?.username}</span>
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Username cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                            Email Address
                                        </label>
                                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                            <span className="text-primary font-medium">{user?.email}</span>
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Email cannot be changed</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                        Phone Number
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-action focus:outline-none text-primary"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                        Default Address
                                    </label>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-slate-400 mt-3" />
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={3}
                                            className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-action focus:outline-none text-primary resize-none"
                                            placeholder="Enter your campus address"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Password Form */}
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-action focus:outline-none text-primary"
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-action focus:outline-none text-primary"
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-action focus:outline-none text-primary"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
