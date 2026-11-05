'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import { ShoppingCart, ArrowLeft, ShoppingBag, Trash2, Plus, Minus, CreditCard, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import api from '@/utils/api';
import { formatMoneyGHS } from '@/utils/money';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, totalPrice, totalCount, clearCart } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            // 1. Get current user for email
            const { data: user } = await api.get('/auth/me/');

            // 2. Create Order
            const { data: order } = await api.post('/payments/orders/', {
                items: cart.map(item => ({
                    id: item.id,
                    variantId: item.variantId,
                    quantity: item.quantity
                }))
            });

            // 3. Initialize Payment
            const { data: paystack } = await api.post('/payments/initialize/', {
                email: user.email,
                amount: totalPrice,
                content_type: 'order',
                object_id: order.id
            });

            // 4. Clear cart and redirect
            clearCart();
            window.location.href = paystack.authorization_url;

        } catch (error: unknown) {
            console.error('Checkout failed:', error);
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401) {
                window.location.href = `/auth/login?redirect=/cart`;
            } else {
                alert('Checkout failed. Please try again later.');
            }
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (totalCount === 0) {
        return (
            <div className="bg-slate-50 min-h-screen py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/store" className="inline-flex items-center gap-2 text-secondary hover:text-primary font-medium mb-8 transition">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Store
                    </Link>

                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Shopping Cart</h1>
                    </div>

                    <Card className="p-8 sm:p-12 text-center">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <ShoppingCart className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-2">Your cart is empty</h2>
                        <p className="text-secondary mb-8">Looks like you haven&apos;t added any campus deals yet.</p>
                        <Link href="/store">
                            <Button size="lg" className="flex items-center gap-2 mx-auto">
                                <ShoppingBag className="h-5 w-5" />
                                Start Shopping
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/store" className="inline-flex items-center gap-2 text-secondary hover:text-primary font-medium mb-8 transition">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Store
                </Link>

                <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-8">Your Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <Card key={`${item.id}-${item.variantId}`} className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                        <Image
                                            src={item.image || '/placeholder-product.svg'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold text-primary hover:text-action transition line-clamp-1">
                                                    <Link href={`/store/${item.slug}`}>{item.name}</Link>
                                                </h3>
                                                {item.variantName && (
                                                    <p className="text-xs font-bold text-secondary text-[10px] uppercase tracking-widest mt-0.5">
                                                        Option: {item.variantName}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.variantId)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3">
                                            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition text-slate-600 disabled:opacity-30"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-primary">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition text-slate-600"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary">{formatMoneyGHS((parseFloat(item.price) * item.quantity).toFixed(2), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-[10px] text-secondary font-bold uppercase">{formatMoneyGHS(item.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 lg:sticky lg:top-24 border-action/10 bg-blue-50/5 shadow-xl">
                            <h2 className="text-xl font-bold text-primary mb-6">Order Summary</h2>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Subtotal ({totalCount} items)</span>
                                    <span className="font-bold text-primary">{formatMoneyGHS(totalPrice.toFixed(2), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Shipping</span>
                                    <span className="text-emerald-600 font-bold uppercase text-[10px]">Free for Campus</span>
                                </div>
                                <div className="border-t border-slate-100 pt-4 flex justify-between">
                                    <span className="text-lg font-bold text-primary">Total</span>
                                    <span className="text-2xl font-black text-action">{formatMoneyGHS(totalPrice.toFixed(2), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full py-4 shadow-lg shadow-blue-500/20"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                            >
                                {isCheckingOut ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        Checkout Now
                                    </>
                                )}
                            </Button>

                            <p className="text-[10px] text-center text-secondary mt-6 font-medium">
                                Secure campus checkout powered by Paystack.
                                <br />
                                Guaranteed delivery within 24 hours.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
