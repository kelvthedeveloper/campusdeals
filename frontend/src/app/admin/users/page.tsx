'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import {
    UserPlus,
    Search,
    Shield,
    Users,
    Mail,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    UserCheck,
    UserX
} from 'lucide-react';
import api from '@/utils/api';
import { User } from '@/types';
import { showSuccess, showError } from '@/utils/alert';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);

    // Modal state
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [userToUpdate, setUserToUpdate] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New staff form state
    const [newStaff, setNewStaff] = useState({
        username: '',
        email: '',
        password: '',
        role: 'STAFF' as 'STAFF' | 'ADMIN'
    });

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/auth/users/');
            setUsers(data);
        } catch (error) {
            console.error('Error fetching admin users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const { data } = await api.get('/auth/me/');
                setCurrentUserId(data?.id ?? null);
            } catch {
                setCurrentUserId(null);
            }
            await fetchUsers();
        };
        init();
    }, []);

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Using the registration endpoint logic or the user list create
            await api.post('/auth/users/', {
                ...newStaff,
                is_staff: true,
                is_active: true
            });
            fetchUsers();
            setIsStaffModalOpen(false);
            setNewStaff({ username: '', email: '', password: '', role: 'STAFF' });
            showSuccess('Staff Created', 'Staff account created successfully.');
        } catch (error: any) {
            console.error('Error creating staff:', error);
            const data = error?.response?.data;
            showError('Create Failed', data?.detail || (data ? JSON.stringify(data, null, 2) : 'Failed to create staff account.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!userToUpdate) return;
        setIsSaving(true);
        try {
            await api.patch(`/auth/users/${userToUpdate.id}/`, {
                is_active: !userToUpdate.is_active
            });
            fetchUsers();
            setIsStatusModalOpen(false);
            setUserToUpdate(null);
            showSuccess('Status Updated', 'User status updated successfully.');
        } catch (error) {
            console.error('Error updating user status:', error);
            const data = (error as any)?.response?.data;
            showError('Update Failed', data?.detail || (data ? JSON.stringify(data, null, 2) : 'Failed to update user status.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/auth/users/${userToDelete.id}/`);
            await fetchUsers();
            setUserToDelete(null);
            showSuccess('User Deleted', 'User has been removed.');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            const data = error?.response?.data;
            showError('Delete Failed', data?.detail || (data ? JSON.stringify(data, null, 2) : 'Failed to delete user.'));
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredUsers = users
        .filter((u) => (currentUserId == null ? true : u.id !== currentUserId))
        .filter((u) =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

    if (loading) return <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-96 bg-white rounded-2xl border border-slate-100" />
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Users & Staff</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Manage platform participants and permissions</p>
                </div>
                <Button className="flex items-center gap-2" onClick={() => setIsStaffModalOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                    Create Staff Account
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 border-slate-200">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Total Users</p>
                    <p className="text-2xl font-black text-primary mt-2">{users.length}</p>
                </Card>
                <Card className="p-5 border-slate-200">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Staff</p>
                    <p className="text-2xl font-black text-primary mt-2">{users.filter((u) => u.role === 'STAFF').length}</p>
                </Card>
                <Card className="p-5 border-slate-200">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Admins</p>
                    <p className="text-2xl font-black text-primary mt-2">{users.filter((u) => u.role === 'ADMIN').length}</p>
                </Card>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find user by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">User Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Access</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Platform Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black border border-slate-200">
                                                {(u.username?.[0] || 'U').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-primary">{u.username}</p>
                                                <div className="flex items-center gap-2 text-secondary">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="text-[10px] font-medium">{u.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                                                u.role === 'STAFF' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            <Shield className="h-3 w-3" />
                                            {u.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                <span className={u.is_staff ? 'text-emerald-600' : 'text-slate-300'}>Is Staff</span>
                                                <span className={u.is_superuser ? 'text-purple-600' : 'text-slate-300'}>Is Super</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {u.is_active ? (
                                                <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase">
                                                    <XCircle className="h-4 w-4" />
                                                    Deactivated
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setUserToUpdate(u);
                                                    setIsStatusModalOpen(true);
                                                }}
                                                className={`p-2 rounded-xl border border-slate-200 bg-white transition-all ${u.is_active
                                                        ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                                        : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                                                    }`}
                                                title={u.is_active ? 'Disable user' : 'Enable user'}
                                            >
                                                {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => setUserToDelete(u)}
                                                className="p-2 rounded-xl border border-slate-200 bg-white transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                title="Delete user"
                                            >
                                                <UserX className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Staff Modal */}
            <Modal
                isOpen={isStaffModalOpen}
                onClose={() => setIsStaffModalOpen(false)}
                title="Create Staff Account"
                size="md"
            >
                <form onSubmit={handleCreateStaff} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Username</label>
                            <input
                                type="text"
                                required
                                value={newStaff.username}
                                onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={newStaff.email}
                                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Temporary Password</label>
                            <input
                                type="password"
                                required
                                value={newStaff.password}
                                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Administrative Role</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setNewStaff({ ...newStaff, role: 'STAFF' })}
                                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${newStaff.role === 'STAFF' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white'
                                        }`}
                                >
                                    Staff
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewStaff({ ...newStaff, role: 'ADMIN' })}
                                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${newStaff.role === 'ADMIN' ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white'
                                        }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Status Change Confirmation Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title={userToUpdate?.is_active ? 'Deactivate User' : 'Activate User'}
                size="sm"
            >
                <div className="space-y-6 text-center">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${userToUpdate?.is_active ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                        }`}>
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-primary">
                            {userToUpdate?.is_active ? 'Deactivate ' : 'Reactivate '} {userToUpdate?.username}?
                        </h4>
                        <p className="text-sm text-secondary mt-1 leading-relaxed px-4">
                            {userToUpdate?.is_active
                                ? 'This user will lose immediate access to the platform.'
                                : 'The user will regain access to their account features.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleToggleStatus}
                            disabled={isSaving}
                            className={`w-full py-3 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center ${userToUpdate?.is_active ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirm ${userToUpdate?.is_active ? 'Deactivation' : 'Activation'}`}
                        </button>
                        <button
                            onClick={() => setIsStatusModalOpen(false)}
                            className="w-full py-3 bg-slate-50 text-secondary rounded-xl font-bold text-sm hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                title="Delete User"
                size="sm"
            >
                <div className="space-y-6 text-center">
                    <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto bg-rose-50 text-rose-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-primary">Delete {userToDelete?.username}?</h4>
                        <p className="text-sm text-secondary mt-1 leading-relaxed px-4">
                            This permanently removes the user account.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="w-full py-3 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center bg-rose-500 hover:bg-rose-600"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delete'}
                        </button>
                        <button
                            onClick={() => setUserToDelete(null)}
                            className="w-full py-3 bg-slate-50 text-secondary rounded-xl font-bold text-sm hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
