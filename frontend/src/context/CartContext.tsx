'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '@/types';

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: number, variantId?: number) => void;
    updateQuantity: (id: number, quantity: number, variantId?: number) => void;
    clearCart: () => void;
    totalCount: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Use effect to load from localStorage to avoid SSR hydration mismatch
    useEffect(() => {
        const savedCart = localStorage.getItem('campusdeals_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setCart(parsed);
                }
            } catch (e) {
                console.error('Failed to parse cart from localStorage', e);
            }
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('campusdeals_cart', JSON.stringify(cart));
        }
    }, [cart, isInitialized]);

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existingItemIndex = prev.findIndex(
                (i) => i.id === item.id && i.variantId === item.variantId
            );

            if (existingItemIndex > -1) {
                const newCart = [...prev];
                newCart[existingItemIndex].quantity += item.quantity;
                return newCart;
            }

            return [...prev, item];
        });
    };

    const removeFromCart = (id: number, variantId?: number) => {
        setCart((prev) => prev.filter((i) => !(i.id === id && i.variantId === variantId)));
    };

    const updateQuantity = (id: number, quantity: number, variantId?: number) => {
        if (quantity < 1) return;
        setCart((prev) =>
            prev.map((i) =>
                i.id === id && i.variantId === variantId ? { ...i, quantity } : i
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalCount,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
