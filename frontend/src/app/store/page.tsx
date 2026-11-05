'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/molecules/ProductCard';
import { Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';

interface PaginatedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Product[];
}

const PRODUCTS_PER_PAGE = 24;

function StoreContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category') || '';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(pageParam);
    const [searchQuery, setSearchQuery] = useState(queryParam);
    const [selectedCategory, setSelectedCategory] = useState(categoryParam);

    const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            router.replace('/admin');
        }
    }, [user, router]);

    useEffect(() => {
        setSearchQuery(queryParam);
        setCurrentPage(1);
    }, [queryParam]);

    useEffect(() => {
        setSelectedCategory(categoryParam);
        setCurrentPage(1);
    }, [categoryParam]);

    useEffect(() => {
        setCurrentPage(pageParam);
    }, [pageParam]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                limit: PRODUCTS_PER_PAGE,
            };
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }
            if (selectedCategory) {
                params.category = selectedCategory;
            }
            const { data } = await api.get<any>('/store/products/', { params });

            const results: Product[] = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                    ? data.results
                    : [];

            const count: number = typeof data?.count === 'number' ? data.count : results.length;

            setProducts(results);
            setTotalCount(count);
        } catch (error) {
            console.error('Error fetching store data:', error);
            setProducts([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, selectedCategory]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page));
        window.history.pushState(null, '', `?${params.toString()}`);
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        window.history.pushState(null, '', '/store');
        setSearchQuery('');
        setSelectedCategory('');
        setCurrentPage(1);
    };

    const startItem = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount);

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Store Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-blue-100 text-action rounded-xl flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <h1 className="text-3xl font-black text-primary tracking-tight">Store Front</h1>
                    </div>
                    <p className="text-secondary max-w-xl">
                        {selectedCategory
                            ? `Showing products in ${selectedCategory}`
                            : 'Shop affordable tech, textbooks, and student essentials. Verified listings for campus life.'}
                    </p>
                    {(searchQuery || selectedCategory) && (
                        <button
                            onClick={clearFilters}
                            className="mt-3 text-sm text-action hover:underline font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Results count */}
                {!loading && totalCount > 0 && (
                    <div className="mb-6 text-sm text-secondary">
                        Showing {startItem}-{endItem} of {totalCount} products
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] justify-items-center">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white rounded-xl h-[350px] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : (products?.length ?? 0) === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary">No products found</h3>
                        <p className="text-secondary text-sm mb-4">Try adjusting your search or filters.</p>
                        {(searchQuery || selectedCategory) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-action text-white rounded-lg font-medium hover:bg-action/90 transition"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Products Grid */}
                        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] justify-items-center mb-12">
                            {products.map((product: Product) => (
                                <ProductCard
                                    key={product.id}
                                    id={Number(product.id)}
                                    name={product.name}
                                    slug={product.slug}
                                    base_price={product.base_price}
                                    image={product.image}
                                    stock={product.stock}
                                    category_name={product.category?.name}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 py-8">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-5 w-5 text-primary" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            if (totalPages <= 7) return true;
                                            if (page === 1 || page === totalPages) return true;
                                            if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                                            return false;
                                        })
                                        .map((page, index, arr) => (
                                            <div key={page} className="flex items-center">
                                                {index > 0 && arr[index - 1] !== page - 1 && (
                                                    <span className="px-3 py-2 text-slate-400">...</span>
                                                )}
                                                <button
                                                    onClick={() => goToPage(page)}
                                                    className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition ${
                                                        currentPage === page
                                                            ? 'bg-action text-white'
                                                            : 'bg-white border border-slate-200 text-primary hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="h-5 w-5 text-primary" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function StorePage() {
    return (
        <Suspense fallback={
            <div className="bg-slate-50 min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-40 w-full bg-white animate-pulse rounded-2xl border border-slate-100 mb-12" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl h-[350px] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                </div>
            </div>
        }>
            <StoreContent />
        </Suspense>
    );
}
