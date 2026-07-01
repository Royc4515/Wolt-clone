import React, { createContext, useState, useCallback, useMemo, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/services/api';
import { AuthContext } from './AuthContext';

export interface CartItem {
    item: Product;
    qty: number;
}

export interface CartState {
    [restaurantId: string]: CartItem[]; // A map of restaurant IDs to their specific cart items.
}

export interface CartContextValue {
    // Returns all carts state
    carts: CartState;
    // Helper to get items for a specific restaurant
    getCartByRestaurant: (restaurantId: string) => CartItem[];
    // Helper to get total qty for a specific item
    getQty: (restaurantId: string, itemId: string) => number;
    add: (item: Product) => void;
    addMany: (item: Product, qty: number) => void;
    remove: (restaurantId: string, itemId: string) => void;
    clearCart: (restaurantId: string) => void;
    clearAllCarts: () => void;
}

export const CartContext = createContext<CartContextValue>({
    carts: {},
    getCartByRestaurant: () => [],
    getQty: () => 0,
    add: () => {},
    addMany: () => {},
    remove: () => {},
    clearCart: () => {},
    clearAllCarts: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [carts, setCarts] = useState<CartState>({});
    
    // Use refs to strictly track loading state and prevent cross-saving between users.
    const isLoadedRef = useRef(false);
    const loadedKeyRef = useRef<string | null>(null);

    const userId = user?.id || (user as any)?._id;
    const storageKey = userId ? `@carts_${userId}` : '@carts_guest';

    // Carts are loaded upon login using user's specific key.
    useEffect(() => {
        let isMounted = true;
        isLoadedRef.current = false;

        const loadCarts = async () => {
            try {
                const savedCarts = await AsyncStorage.getItem(storageKey);
                if (isMounted) {
                    if (savedCarts) {
                        setCarts(JSON.parse(savedCarts));
                    } else {
                        setCarts({});
                    }
                    // Mark that the current 'carts' state firmly belongs to this specific user key
                    loadedKeyRef.current = storageKey;
                    isLoadedRef.current = true; // Allow saving again
                }
            } catch (e) {
                console.error("Failed to load carts", e);
            }
        };
        loadCarts();

        return () => {
            isMounted = false;
        };
    }, [storageKey]);

    // Save the cart upon any change.
    useEffect(() => {
        if (isLoadedRef.current && loadedKeyRef.current === storageKey) {
            AsyncStorage.setItem(storageKey, JSON.stringify(carts)).catch(e => console.error("Failed to save carts", e));
        }
    }, [carts, storageKey]);

    const getCartByRestaurant = useCallback((restaurantId: string) => {
        return carts[restaurantId] || [];
    }, [carts]);

    const getQty = useCallback((restaurantId: string, itemId: string) => {
        const cart = carts[restaurantId] || [];
        const found = cart.find(i => i.item.id === itemId);
        return found ? found.qty : 0;
    }, [carts]);

    const add = useCallback((item: Product) => {
        setCarts(prev => {
            const rid = item.restaurantId;
            const currentCart = prev[rid] || [];
            const found = currentCart.find(i => i.item.id === item.id);
            
            const newCart = found 
                ? currentCart.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                : [...currentCart, { item, qty: 1 }];

            return { ...prev, [rid]: newCart };
        });
    }, []);

    const addMany = useCallback((item: Product, qty: number) => {
        setCarts(prev => {
            const rid = item.restaurantId;
            const currentCart = prev[rid] || [];
            const found = currentCart.find(i => i.item.id === item.id);
            
            const newCart = found 
                ? currentCart.map(i => i.item.id === item.id ? { ...i, qty: i.qty + qty } : i)
                : [...currentCart, { item, qty }];

            return { ...prev, [rid]: newCart };
        });
    }, []);

    const remove = useCallback((restaurantId: string, itemId: string) => {
        setCarts(prev => {
            const currentCart = prev[restaurantId] || [];
            const found = currentCart.find(i => i.item.id === itemId);
            
            if (!found) return prev;

            let newCart: CartItem[];
            if (found.qty > 1) {
                newCart = currentCart.map(i => i.item.id === itemId ? { ...i, qty: i.qty - 1 } : i);
            } else {
                newCart = currentCart.filter(i => i.item.id !== itemId);
            }

            // If the cart for this restaurant is empty, remove the key from state
            if (newCart.length === 0) {
                const { [restaurantId]: _, ...rest } = prev;
                return rest;
            }

            return { ...prev, [restaurantId]: newCart };
        });
    }, []);

    const clearCart = useCallback((restaurantId: string) => {
        setCarts(prev => {
            const { [restaurantId]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    const clearAllCarts = useCallback(() => {
        setCarts({});
    }, []);

    const value = useMemo(() => ({ 
        carts, 
        getCartByRestaurant, 
        getQty, 
        add, 
        addMany,
        remove, 
        clearCart,
        clearAllCarts
    }), [carts, getCartByRestaurant, getQty, add, addMany, remove, clearCart, clearAllCarts]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};