import React, { createContext, useState, useCallback, useMemo } from 'react';
import { Product } from '@/services/api';

export interface CartItem {
    item: Product;
    qty: number;
}

export interface CartContextValue {
    items: CartItem[];
    cartRestaurantId: string | null;
    subtotal: number;
    getQty: (itemId: string) => number;
    add: (item: Product) => void;
    addMany: (item: Product, qty: number) => void;
    remove: (itemId: string) => void;
    clearCart: () => void;
}

export const CartContext = createContext<CartContextValue>({
    items: [],
    cartRestaurantId: null,
    subtotal: 0,
    getQty: () => 0,
    add: () => {},
    addMany: () => {},
    remove: () => {},
    clearCart: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [cartRestaurantId, setCartRestaurantId] = useState<string | null>(null);

    // Calculate the total cost of all items currently in the cart
    const subtotal = useMemo(() => {
        return items.reduce((sum, current) => sum + (current.item.price * current.qty), 0);
    }, [items]);

    const getQty = useCallback((itemId: string) => {
        const found = items.find(i => i.item.id === itemId);
        return found ? found.qty : 0;
    }, [items]);

    const add = useCallback((item: Product) => {
        setItems(prev => {
            // Enforce single-restaurant cart policy:
            // If adding an item from a different restaurant, clear the cart first
            if (prev.length > 0 && cartRestaurantId !== item.restaurantId) {
                setCartRestaurantId(item.restaurantId);
                return [{ item, qty: 1 }];
            }

            // Set the restaurant ID for the first item
            if (prev.length === 0) {
                setCartRestaurantId(item.restaurantId);
            }

            const found = prev.find(i => i.item.id === item.id);
            if (found) {
                return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { item, qty: 1 }];
        });
    }, [cartRestaurantId]);

    const addMany = useCallback((item: Product, qty: number) => {
        setItems(prev => {
            // Enforce single-restaurant cart policy
            if (prev.length > 0 && cartRestaurantId !== item.restaurantId) {
                setCartRestaurantId(item.restaurantId);
                return [{ item, qty }];
            }

            if (prev.length === 0) {
                setCartRestaurantId(item.restaurantId);
            }

            const found = prev.find(i => i.item.id === item.id);
            if (found) {
                return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + qty } : i);
            }
            return [...prev, { item, qty }];
        });
    }, [cartRestaurantId]);

    const remove = useCallback((itemId: string) => {
        setItems(prev => {
            const found = prev.find(i => i.item.id === itemId);
            if (found && found.qty > 1) {
                // Decrement quantity if more than 1
                return prev.map(i => i.item.id === itemId ? { ...i, qty: i.qty - 1 } : i);
            }
            
            // Remove item entirely if quantity reaches 0
            const updatedItems = prev.filter(i => i.item.id !== itemId);
            
            // If cart is empty after removal, reset the restaurant lock
            if (updatedItems.length === 0) {
                setCartRestaurantId(null);
            }
            
            return updatedItems;
        });
    }, []);

    const clearCart = useCallback(() => {
        // Completely reset the cart state (used after successful checkout)
        setItems([]);
        setCartRestaurantId(null);
    }, []);

    const value = useMemo(() => ({ 
        items, 
        cartRestaurantId, 
        subtotal, 
        getQty, 
        add, 
        addMany, 
        remove, 
        clearCart 
    }), [items, cartRestaurantId, subtotal, getQty, add, addMany, remove, clearCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};