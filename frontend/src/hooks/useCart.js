import { useState } from 'react';

export default function useCart() {
  const [items, setItems] = useState([]);

  function addItem(item) {
    setItems(prev => {
      const existing = prev.find(e => e.item.id === item.id);
      if (existing) {
        if (existing.qty >= (item.maxQty ?? Infinity)) return prev;
        return prev.map(e =>
          e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function removeItem(itemId) {
    setItems(prev => prev.filter(e => e.item.id !== itemId));
  }

  function updateQty(itemId, qty) {
    if (qty < 1) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(e => {
        if (e.item.id !== itemId) return e;
        const capped = Math.min(qty, e.item.maxQty ?? Infinity);
        return { ...e, qty: capped };
      })
    );
  }

  function clearCart() {
    setItems([]);
  }

  function restoreItems(cartItems) {
    setItems(cartItems);
  }

  const total = items.reduce((sum, e) => sum + e.item.price * e.qty, 0);
  const count = items.reduce((sum, e) => sum + e.qty, 0);

  return { items, addItem, removeItem, updateQty, clearCart, restoreItems, total, count };
}
