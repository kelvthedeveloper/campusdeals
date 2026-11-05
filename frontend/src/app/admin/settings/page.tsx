'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import api from '@/utils/api';
import { showSuccess, showError } from '@/utils/alert';
import {
    Settings as SettingsIcon,
    Shield,
    CreditCard,
    Bell,
    Globe,
    Save,
    AlertTriangle,
    RefreshCw,
    Database,
    Lock,
    Mail,
    Loader2,
    User,
    Camera,
    KeyRound,
    Check,
    X
} from 'lucide-react';

interface PlatformSettings {
    site_name: string;
    contact_email: string;
    maintenance_mode: boolean;
    paystack_public_key: string;
    paystack_secret_key: string;
}

interface Profile {
    id: number;
    username: string;
    email: string;
    phone_number: string;
    address: string;
    profile_picture: string | null;
    profile_picture_url: string | null;
}

interface PasswordData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<'platform' | 'profile' | 'password'>('platform');

    // Platform Settings State
    const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
    const [platformLoading, setPlatformLoading] = useState(true);
    const [isSavingPlatform, setIsSavingPlatform] = useState(false);

    // Profile State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

    // Password State
    const [passwordData, setPasswordData] = useState<PasswordData>({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Fetch Platform Settings
    const fetchPlatformSettings = async () => {
        try {
            const { data } = await api.get('/auth/settings/');
            setPlatformSettings(data);
        } catch (error) {
            console.error('Error fetching platform settings:', error);
        } finally {
            setPlatformLoading(false);
        }
    };

    // Fetch Profile
    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/profile/');
            setProfile(data);
            setProfileImagePreview(data.profile_picture_url);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchPlatformSettings();
        fetchProfile();
    }, []);

    // Save Platform Settings
    const handleSavePlatform = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!platformSettings) return;
        setIsSavingPlatform(true);
        try {
            await api.put('/auth/settings/', platformSettings);
            showSuccess('Settings Saved', 'Platform settings saved successfully!');
        } catch (error) {
            console.error('Error saving platform settings:', error);
            showError('Save Failed', 'Failed to save platform settings.');
        } finally {
            setIsSavingPlatform(false);
        }
    };

    // Save Profile
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSavingProfile(true);
        try {
            const formData = new FormData();
            formData.append('phone_number', profile.phone_number || '');
            formData.append('address', profile.address || '');
            if (profileImageFile) {
                formData.append('profile_picture', profileImageFile);
            }

            const { data } = await api.patch('/auth/profile/', formData);
            setProfile(data);
            setProfileImagePreview(data.profile_picture_url);
            setProfileImageFile(null);
            showSuccess('Profile Updated', 'Profile updated successfully!');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            showError('Update Failed', error?.response?.data?.detail || 'Failed to save profile.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle Profile Image Change
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Change Password
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError("New passwords don't match.");
            return;
        }

        if (passwordData.new_password.length < 8) {
            setPasswordError('Password must be at least 8 characters.');
            return;
        }

        setIsChangingPassword(true);
        try {
            await api.post('/auth/password/change/', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password
            });
            setPasswordSuccess(true);
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error: any) {
            console.error('Error changing password:', error);
            setPasswordError(error?.response?.data?.current_password || error?.response?.data?.detail || 'Failed to change password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const isLoading = platformLoading || profileLoading;

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-96 bg-white rounded-2xl border border-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-2xl font-black text-primary tracking-tight">Settings</h1>
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Manage platform settings and your profile</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="p-2 space-y-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('platform')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                                activeTab === 'platform'
                                    ? 'bg-action text-white shadow-lg shadow-action/20'
                                    : 'text-secondary hover:text-primary hover:bg-slate-50'
                            }`}
                        >
                            <Globe className="h-4 w-4" />
                            Platform Settings
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                                activeTab === 'profile'
                                    ? 'bg-action text-white shadow-lg shadow-action/20'
                                    : 'text-secondary hover:text-primary hover:bg-slate-50'
                            }`}
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('password')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                                activeTab === 'password'
                                    ? 'bg-action text-white shadow-lg shadow-action/20'
                                    : 'text-secondary hover:text-primary hover:bg-slate-50'
                            }`}
                        >
                            <KeyRound className="h-4 w-4" />
                            Change Password
                        </button>
                    </Card>

                    <Card className="p-6 bg-rose-50 border-rose-100">
                        <div className="flex items-center gap-2 text-rose-600 mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Danger Zone</h3>
                        </div>
                        <p className="text-[10px] font-bold text-rose-500/80 leading-relaxed mb-4">
                            These actions are IRREVERSIBLE. Exercise extreme caution.
                        </p>
                        <div className="space-y-2">
                            <button
                                type="button"
                                className="w-full py-2 bg-white border border-rose-200 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                                Clear System Cache
                            </button>
                            <button
                                type="button"
                                className={`w-full py-2 bg-white border border-rose-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    platformSettings?.maintenance_mode
                                        ? 'bg-rose-500 text-white'
                                        : 'text-rose-500 hover:bg-rose-500 hover:text-white'
                                }`}
                                onClick={() =>
                                    setPlatformSettings(prev =>
                                        prev ? { ...prev, maintenance_mode: !prev.maintenance_mode } : null
                                    )
                                }
                            >
                                {platformSettings?.maintenance_mode ? 'Disable Maintenance' : 'Enable Maintenance'}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Content */}
                <div className="lg:col-span-2">
                    {/* Platform Settings Tab */}
                    {activeTab === 'platform' && (
                        <Card className="p-8 space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-primary tracking-tight">General Marketplace Info</h2>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Identity and branding settings</p>
                                </div>
                            </div>

                            <form onSubmit={handleSavePlatform} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                            Marketplace Name
                                        </label>
                                        <input
                                            type="text"
                                            value={platformSettings?.site_name || ''}
                                            onChange={(e) =>
                                                setPlatformSettings(prev =>
                                                    prev ? { ...prev, site_name: e.target.value } : null
                                                )
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                            placeholder="e.g. CampusDeals"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                            Support Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="email"
                                                value={platformSettings?.contact_email || ''}
                                                onChange={(e) =>
                                                    setPlatformSettings(prev =>
                                                        prev ? { ...prev, contact_email: e.target.value } : null
                                                    )
                                                }
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                                placeholder="support@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-primary tracking-tight">Payment Gateways</h2>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Paystack API credentials</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                                Public Key
                                            </label>
                                            <div className="relative">
                                                <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={platformSettings?.paystack_public_key || ''}
                                                    onChange={(e) =>
                                                        setPlatformSettings(prev =>
                                                            prev ? { ...prev, paystack_public_key: e.target.value } : null
                                                        )
                                                    }
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold font-mono"
                                                    placeholder="pk_test_..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                                Secret Key
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="password"
                                                    value={platformSettings?.paystack_secret_key || ''}
                                                    onChange={(e) =>
                                                        setPlatformSettings(prev =>
                                                            prev ? { ...prev, paystack_secret_key: e.target.value } : null
                                                        )
                                                    }
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold font-mono"
                                                    placeholder="sk_test_..."
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                                                Note: Secret keys are encrypted at rest and never shown in full after initial save.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isSavingPlatform} className="w-full py-4 flex items-center justify-center gap-2 text-base">
                                        {isSavingPlatform ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Save className="h-5 w-5" />
                                        )}
                                        {isSavingPlatform ? 'Updating Platform...' : 'Save Global Settings'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <Card className="p-8 space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-primary tracking-tight">Profile Information</h2>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Update your personal details</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                {/* Profile Picture */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200">
                                            {profileImagePreview ? (
                                                <img
                                                    src={profileImagePreview}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                    <User className="h-10 w-10" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 h-8 w-8 bg-action rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-action/90 transition">
                                            <Camera className="h-4 w-4 text-white" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-primary">Profile Picture</h3>
                                        <p className="text-[10px] text-secondary">Click the camera icon to upload a new photo</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={profile?.username || ''}
                                            disabled
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="text-[10px] text-secondary px-1">Username cannot be changed</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            disabled
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="text-[10px] text-secondary px-1">Email cannot be changed</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profile?.phone_number || ''}
                                        onChange={(e) =>
                                            setProfile(prev => prev ? { ...prev, phone_number: e.target.value } : null)
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                        placeholder="+233 20 123 4567"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                        Address
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={profile?.address || ''}
                                        onChange={(e) =>
                                            setProfile(prev => prev ? { ...prev, address: e.target.value } : null)
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                        placeholder="Your address..."
                                    />
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isSavingProfile} className="w-full py-4 flex items-center justify-center gap-2 text-base">
                                        {isSavingProfile ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Save className="h-5 w-5" />
                                        )}
                                        {isSavingProfile ? 'Saving Profile...' : 'Save Profile'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <Card className="p-8 space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-primary tracking-tight">Change Password</h2>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Update your account password</p>
                                </div>
                            </div>

                            {passwordSuccess && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                    <Check className="h-5 w-5 text-emerald-600" />
                                    <p className="text-sm font-bold text-emerald-700">Password changed successfully!</p>
                                </div>
                            )}

                            {passwordError && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
                                    <X className="h-5 w-5 text-rose-600" />
                                    <p className="text-sm font-bold text-rose-700">{passwordError}</p>
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) =>
                                                setPasswordData(prev => ({ ...prev, current_password: e.target.value }))
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                            placeholder="Enter your current password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={(e) =>
                                                setPasswordData(prev => ({ ...prev, new_password: e.target.value }))
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                            placeholder="Enter new password (min 8 characters)"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="password"
                                            value={passwordData.confirm_password}
                                            onChange={(e) =>
                                                setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                            placeholder="Confirm new password"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="w-full py-4 flex items-center justify-center gap-2 text-base"
                                    >
                                        {isChangingPassword ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <KeyRound className="h-5 w-5" />
                                        )}
                                        {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
