'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import api from '@/utils/api';
import { Service } from '@/types';
import { showSuccess, showError, getApiErrorMessage } from '@/utils/alert';
import { Plus, Search, Edit, Trash2, AlertCircle, Loader2, Briefcase } from 'lucide-react';

export default function AdminServicesCatalogPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchServices = async () => {
        try {
            const { data } = await api.get('/services/admin/services/');
            setServices(data);
        } catch (error) {
            console.error('Error fetching admin services catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return services;
        return services.filter((s) =>
            s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
    }, [services, searchTerm]);

    const openCreate = () => {
        setEditingService({ name: '', description: '', is_active: true });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const openEdit = (s: Service) => {
        setEditingService({ ...s });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setImageFile(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingService) return;
        if (!editingService.name?.trim()) return;
        if (!editingService.description?.trim()) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', editingService.name.trim());
            formData.append('description', editingService.description.trim());
            formData.append('is_active', (editingService.is_active ?? true) ? 'true' : 'false');
            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (editingService.id) {
                await api.patch(`/services/admin/services/${editingService.id}/`, formData);
            } else {
                await api.post('/services/admin/services/', formData);
            }

            await fetchServices();
            closeModal();
            showSuccess('Service Saved', editingService.id ? 'Service updated successfully.' : 'Service created successfully.');
        } catch (error: unknown) {
            console.error('Error saving service:', error);
            showError('Save Failed', getApiErrorMessage(error, 'Failed to save service.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!serviceToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/services/admin/services/${serviceToDelete.id}/`);
            await fetchServices();
            setServiceToDelete(null);
            showSuccess('Service Deleted', 'Service has been removed.');
        } catch (error: any) {
            console.error('Error deleting service:', error);
            showError('Delete Failed', error?.response?.data?.detail || 'Failed to delete service.');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleActive = async (s: Service) => {
        try {
            await api.patch(`/services/admin/services/${s.id}/status/`, { is_active: !s.is_active });
            await fetchServices();
        } catch (error: any) {
            console.error('Error updating service status:', error);
            showError('Update Failed', error?.response?.data?.detail || 'Failed to update status.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-slate-200 rounded" />
                <div className="h-96 bg-white rounded-2xl border border-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Services Catalog</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Create and manage service offerings</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => router.push('/admin/services')}>Back to Bookings</Button>
                    <Button className="flex items-center gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New Service
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search services by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    <table className="w-full min-w-[720px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Service</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 sm:px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {s.image ? (
                                                <div className="h-10 w-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
                                                    <img
                                                        src={s.image}
                                                        alt={s.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-primary truncate">{s.name}</p>
                                                <p className="text-[10px] text-secondary font-medium truncate">{s.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(s)}
                                            className={`px-3 py-1 rounded-lg text-xs font-black ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                            title="Toggle Active"
                                        >
                                            {s.is_active ? 'Active' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(s)}
                                                className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setServiceToDelete(s)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-white rounded-lg shadow-sm"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="py-20 text-center">
                        <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary">No services found</h3>
                        <p className="text-sm text-secondary">Create your first service to enable bookings.</p>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingService?.id ? 'Edit Service' : 'New Service'}
                size="lg"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Service Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingService?.name || ''}
                                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Service Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                                {imageFile && (
                                    <p className="text-[10px] text-secondary font-bold px-1">Selected: {imageFile.name}</p>
                                )}
                                {!imageFile && editingService?.image && (
                                    <div className="px-1">
                                        <div className="h-28 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                            <img
                                                src={editingService.image}
                                                alt={editingService.name || 'Service image'}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="svc_active"
                                    checked={!!editingService?.is_active}
                                    onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-action focus:ring-action"
                                />
                                <label htmlFor="svc_active" className="text-xs font-bold text-primary select-none cursor-pointer">
                                    Service is Active
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    rows={10}
                                    required
                                    value={editingService?.description || ''}
                                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Service'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!serviceToDelete}
                onClose={() => setServiceToDelete(null)}
                title="Confirm Delete"
                size="sm"
            >
                <div className="space-y-6 text-center">
                    <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-primary">Delete this service?</h4>
                        <p className="text-sm text-secondary mt-1 leading-relaxed px-4">
                            This will permanently delete <span className="font-bold text-primary">"{serviceToDelete?.name}"</span>.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete Service'}
                        </button>
                        <button
                            onClick={() => setServiceToDelete(null)}
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
