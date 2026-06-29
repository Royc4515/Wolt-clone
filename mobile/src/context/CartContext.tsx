import React, { createContext, useState, useCallback, useMemo } from 'react';
import { Product } from '@/services/api';

export interface CartItem {
    item: Product;
    qty: number;
}

export interface CartContextValue {
    getQty: (itemId: string) => number;
    add: (item: Product) => void;
    addMany: (item: Product, qty: number) => void;
    remove: (itemId: string) => void;
    items: CartItem[];
}

export const CartContext = createContext<CartContextValue>({
    getQty: () => 0,
    add: () => {},
    addMany: () => {},
    remove: () => {},
    items: [],
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    const getQty = useCallback((itemId: string) => {
        const found = items.find(i => i.item.id === itemId);
        return found ? found.qty : 0;
    }, [items]);

    const add = useCallback((item: Product) => {
        setItems(prev => {
            const found = prev.find(i => i.item.id === item.id);
            if (found) {
                return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { item, qty: 1 }];
        });
    }, []);

    const addMany = useCallback((item: Product, qty: number) => {
        setItems(prev => {
            const found = prev.find(i => i.item.id === item.id);
            if (found) {
                return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + qty } : i);
            }
            return [...prev, { item, qty }];
        });
    }, []);

    const remove = useCallback((itemId: string) => {
        setItems(prev => {
            const found = prev.find(i => i.item.id === itemId);
            if (found && found.qty > 1) {
                return prev.map(i => i.item.id === itemId ? { ...i, qty: i.qty - 1 } : i);
            }
            return prev.filter(i => i.item.id !== itemId);
        });
    }, []);

    const value = useMemo(() => ({ getQty, add, addMany, remove, items }), [getQty, add, addMany, remove, items]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
