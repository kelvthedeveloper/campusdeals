'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    MoreHorizontal,
    Box,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Loader2
} from 'lucide-react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Product, Category } from '@/types';
import { formatMoneyGHS } from '@/utils/money';
import { showSuccess, showError, getApiErrorMessage } from '@/utils/alert';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/store/products/');
            // Handle paginated response: extract results array
            const productsArray = Array.isArray(data) ? data : data.results || [];
            setProducts(productsArray);
        } catch (error) {
            console.error('Error fetching admin products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/store/categories/');
            const categoryList = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                    ? data.results
                    : [];
            setCategories(categoryList);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const handleOpenModal = (product: Product | null = null) => {
        setImageFile(null);
        if (product) {
            setEditingProduct({
                ...product,
                category_id: (product.category as any)?.id // Assign ID for serializer
            } as any);
        } else {
            setEditingProduct({
                name: '',
                description: '',
                base_price: '0.00',
                stock: 0,
                is_active: true,
                category_id: categories[0]?.id
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        const name = String(editingProduct.name ?? '').trim();
        if (!name) {
            showError('Validation Error', 'Product name is required.');
            return;
        }

        const resolvedCategoryId = (editingProduct as any).category_id ?? categories[0]?.id;
        if (resolvedCategoryId === undefined || resolvedCategoryId === null || resolvedCategoryId === '') {
            showError('Validation Error', 'Please create/enable a category first, then select a category for this product.');
            return;
        }

        setIsSaving(true);
        try {
            const categoryId = resolvedCategoryId;
            const formData = new FormData();
            formData.append('category_id', String(categoryId));
            formData.append('name', name);
            if (editingProduct.description !== undefined) formData.append('description', String(editingProduct.description ?? ''));
            if (editingProduct.base_price !== undefined) formData.append('base_price', String(editingProduct.base_price));
            if (editingProduct.stock !== undefined) formData.append('stock', String(editingProduct.stock));
            formData.append('is_active', (editingProduct.is_active ? 'true' : 'false'));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (editingProduct.id) {
                await api.patch(`/store/products/${editingProduct.slug}/`, formData);
            } else {
                await api.post('/store/products/', formData);
            }
            fetchProducts();
            setIsModalOpen(false);
            showSuccess('Product Saved', editingProduct.id ? 'Product updated successfully.' : 'Product created successfully.');
        } catch (error) {
            console.error('Error saving product:', error);
            showError('Save Failed', getApiErrorMessage(error, 'Failed to save product.'));
        } finally {
            setTimeout(() => setIsSaving(false), 300);
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/store/products/${productToDelete.slug}/`);
            fetchProducts();
            setProductToDelete(null);
            showSuccess('Product Deleted', 'Product has been removed.');
        } catch (error) {
            console.error('Error deleting product:', error);
            showError('Delete Failed', 'Failed to delete product.');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-96 bg-white rounded-2xl border border-slate-100" />
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Inventory Management</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Control your marketplace stock and pricing</p>
                </div>
                <Button className="flex items-center gap-2" onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4" />
                    Add New Product
                </Button>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products by name or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-primary hover:bg-slate-50 transition">
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Product Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Price</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Inventory</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100">
                                                {product.image ? (
                                                    <img src={product.image as string} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Box className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="max-w-[200px]">
                                                <p className="font-bold text-sm text-primary truncate group-hover:text-action transition-colors">{product.name}</p>
                                                <p className="text-[10px] text-secondary font-medium truncate uppercase tracking-tighter">ID: {product.id.toString().substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 italic text-sm font-black text-primary">
                                        {formatMoneyGHS(product.base_price)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                            <span className="text-xs font-bold text-primary">{product.stock} in stock</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                            {product.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {product.is_active ? 'Active' : 'Archived'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setProductToDelete(product)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-white rounded-lg shadow-sm"
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

                {filteredProducts.length === 0 && (
                    <div className="py-20 text-center">
                        <Box className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary">No products found</h3>
                        <p className="text-sm text-secondary">Try adjusting your search or add a new item.</p>
                    </div>
                )}
            </Card>

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct?.id ? 'Edit Product' : 'New Product'}
                size="lg"
            >
                <form onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct?.name || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                    placeholder="e.g. Vintage iMac G3"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Category</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                    value={(editingProduct as any)?.category_id || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value } as any)}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Base Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editingProduct?.base_price || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, base_price: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Stock Level</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingProduct?.stock || 0}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Product Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    rows={4}
                                    value={editingProduct?.description || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-medium leading-relaxed"
                                    placeholder="Describe the product features, condition, and details..."
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingProduct?.is_active || false}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-action focus:ring-action"
                                />
                                <label htmlFor="is_active" className="text-xs font-bold text-primary select-none cursor-pointer">
                                    Product is Active (Visible to Customers)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Product'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
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
                            Deleting <span className="font-bold text-primary">"{productToDelete?.name}"</span> cannot be undone. All associated data will be removed.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleDeleteProduct}
                            disabled={isDeleting}
                            className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete Product'}
                        </button>
                        <button
                            onClick={() => setProductToDelete(null)}
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
