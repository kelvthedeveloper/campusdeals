'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import api from '@/utils/api';
import { Category } from '@/types';
import { showSuccess, showError } from '@/utils/alert';
import {
    Tags,
    Plus,
    Search,
    Edit,
    Trash2,
    AlertCircle,
    Loader2
} from 'lucide-react';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/admin/categories/');
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const tree = useMemo(() => {
        const map = new Map<number, Category>();
        for (const c of categories) {
            map.set(c.id, { ...c, children: [] });
        }

        const roots: Category[] = [];
        for (const c of map.values()) {
            const parentId = (c.parent as any)?.id;
            if (parentId && map.has(parentId)) {
                (map.get(parentId)!.children as Category[]).push(c);
            } else {
                roots.push(c);
            }
        }

        const sortFn = (a: Category, b: Category) => {
            const soA = a.sort_order ?? 0;
            const soB = b.sort_order ?? 0;
            if (soA !== soB) return soA - soB;
            return a.name.localeCompare(b.name);
        };
        roots.sort(sortFn);
        for (const r of roots) {
            (r.children || []).sort(sortFn);
        }
        return roots;
    }, [categories]);

    const filteredTree = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return tree;
        const matches = (c: Category) =>
            c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
        const res: Category[] = [];
        for (const root of tree) {
            const childHits = (root.children || []).filter(matches);
            if (matches(root) || childHits.length) {
                res.push({ ...root, children: childHits });
            }
        }
        return res;
    }, [tree, searchTerm]);

    const openCreateMain = () => {
        setEditingCategory({ name: '', is_active: true, sort_order: 0, parent: null } as any);
        setIsModalOpen(true);
    };

    const openCreateSub = (parent: Category) => {
        setEditingCategory({ name: '', is_active: true, sort_order: 0, parent } as any);
        setIsModalOpen(true);
        setExpanded((prev) => new Set(prev).add(parent.id));
    };

    const openEdit = (c: Category) => {
        setEditingCategory({ ...c, is_active: c.is_active ?? true } as any);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        if (!editingCategory.name?.trim()) return;

        setIsSaving(true);
        try {
            const payload: any = {
                name: editingCategory.name.trim(),
                is_active: editingCategory.is_active ?? true,
                sort_order: editingCategory.sort_order ?? 0,
            };
            if ((editingCategory as any).parent?.id) {
                payload.parent_id = (editingCategory as any).parent.id;
            } else {
                payload.parent_id = null;
            }

            if (editingCategory.id) {
                await api.patch(`/admin/categories/${editingCategory.id}/`, payload);
            } else {
                await api.post('/admin/categories/', payload);
            }
            await fetchCategories();
            closeModal();
            showSuccess('Category Saved', editingCategory.id ? 'Category updated successfully.' : 'Category created successfully.');
        } catch (error: any) {
            console.error('Error saving category:', error);
            showError('Save Failed', error?.response?.data?.detail || 'Failed to save category.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/admin/categories/${categoryToDelete.id}/`);
            await fetchCategories();
            setCategoryToDelete(null);
            showSuccess('Category Deleted', 'Category has been removed.');
        } catch (error: any) {
            console.error('Error deleting category:', error);
            showError('Delete Failed', error?.response?.data?.detail || 'Failed to delete category.');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleExpanded = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleActive = async (c: Category) => {
        try {
            await api.patch(`/admin/categories/${c.id}/status/`, { is_active: !(c.is_active ?? true) });
            await fetchCategories();
        } catch (error: any) {
            console.error('Error toggling category status:', error);
            showError('Update Failed', error?.response?.data?.detail || 'Failed to update category status.');
        }
    };

    const moveWithinSiblings = async (c: Category, direction: 'up' | 'down') => {
        const parentId = (c.parent as any)?.id ?? null;
        const siblings = categories
            .filter((x) => (((x.parent as any)?.id ?? null) === parentId))
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const idx = siblings.findIndex((s) => s.id === c.id);
        if (idx === -1) return;
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= siblings.length) return;

        const a = siblings[idx];
        const b = siblings[swapWith];
        const aOrder = a.sort_order ?? 0;
        const bOrder = b.sort_order ?? 0;

        try {
            await Promise.all([
                api.patch(`/admin/categories/${a.id}/`, { sort_order: bOrder }),
                api.patch(`/admin/categories/${b.id}/`, { sort_order: aOrder }),
            ]);
            await fetchCategories();
        } catch (error: any) {
            console.error('Error reordering categories:', error);
            showError('Reorder Failed', error?.response?.data?.detail || 'Failed to reorder categories.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-96 bg-white rounded-2xl border border-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Category Management</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Create and organize store categories</p>
                </div>
                <Button className="flex items-center gap-2" onClick={openCreateMain}>
                    <Plus className="h-4 w-4" />
                    Add Main Category
                </Button>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search categories by name or slug..."
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
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Products</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Slug</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTree.flatMap((root) => {
                                const rows: React.ReactNode[] = [];
                                const isOpen = expanded.has(root.id);

                                rows.push(
                                    <tr key={root.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(root.id)}
                                                    className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 font-black"
                                                    title={isOpen ? 'Collapse' : 'Expand'}
                                                >
                                                    {isOpen ? '-' : '+'}
                                                </button>
                                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <Tags className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-primary">{root.name}</p>
                                                    <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter">Main Category</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(root)}
                                                className={`px-3 py-1 rounded-lg text-xs font-black ${root.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                                title="Toggle Active"
                                            >
                                                {root.is_active ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-slate-700">{root.product_count ?? 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{root.slug}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => moveWithinSiblings(root, 'up')}
                                                    className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                    title="Move Up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveWithinSiblings(root, 'down')}
                                                    className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                    title="Move Down"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => openCreateSub(root)}
                                                    className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                    title="Add Subcategory"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(root)}
                                                    className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setCategoryToDelete(root)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-white rounded-lg shadow-sm"
                                                    title="Disable"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );

                                if (isOpen) {
                                    for (const child of root.children || []) {
                                        rows.push(
                                            <tr key={child.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 pl-12">
                                                        <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                                                            <Tags className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-primary">{child.name}</p>
                                                            <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter">Subcategory of {root.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(child)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-black ${child.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                                        title="Toggle Active"
                                                    >
                                                        {child.is_active ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-black text-slate-700">{child.product_count ?? 0}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{child.slug}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => moveWithinSiblings(child, 'up')}
                                                            className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                            title="Move Up"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => moveWithinSiblings(child, 'down')}
                                                            className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                            title="Move Down"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(child)}
                                                            className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setCategoryToDelete(child)}
                                                            className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-white rounded-lg shadow-sm"
                                                            title="Disable"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                }

                                return rows;
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTree.length === 0 && (
                    <div className="py-20 text-center">
                        <Tags className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary">No categories found</h3>
                        <p className="text-sm text-secondary">Create your first category to organize products.</p>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCategory?.id ? 'Edit Category' : 'New Category'}
                size="md"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Category Name</label>
                        <input
                            type="text"
                            required
                            value={editingCategory?.name || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                            placeholder="e.g. Laptops"
                        />
                        <p className="text-[10px] text-secondary font-bold px-1">
                            Parent: {(editingCategory as any)?.parent?.name || 'None (Main Category)'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input
                            type="checkbox"
                            id="cat_active"
                            checked={!!editingCategory?.is_active}
                            onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-action focus:ring-action"
                        />
                        <label htmlFor="cat_active" className="text-xs font-bold text-primary select-none cursor-pointer">
                            Category is Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Category'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                title="Confirm Deletion"
                size="sm"
            >
                <div className="space-y-6 text-center">
                    <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-primary">Are you absolutely sure?</h4>
                        <p className="text-sm text-secondary mt-1 leading-relaxed px-4">
                            This will permanently delete <span className="font-bold text-primary">"{categoryToDelete?.name}"</span>.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete Category'}
                        </button>
                        <button
                            onClick={() => setCategoryToDelete(null)}
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
