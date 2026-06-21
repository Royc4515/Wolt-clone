import { renderHook, act } from '@testing-library/react';
import useCart from './useCart';

const PIZZA = { id: 'p1', name: 'Margherita', price: 62, maxQty: 10 };
const ESPRESSO = { id: 'e1', name: 'Espresso', price: 14, maxQty: 3 };

describe('useCart', () => {
  test('initial state is empty', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.count).toBe(0);
  });

  test('addItem adds a new entry with qty 1', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({ item: PIZZA, qty: 1 });
    expect(result.current.count).toBe(1);
  });

  test('addItem increments qty for existing item', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });
    act(() => { result.current.addItem(PIZZA); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(2);
    expect(result.current.count).toBe(2);
  });

  test('addItem does not exceed maxQty', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(ESPRESSO); });
    act(() => { result.current.addItem(ESPRESSO); });
    act(() => { result.current.addItem(ESPRESSO); });
    act(() => { result.current.addItem(ESPRESSO); }); // 4th — should be ignored
    expect(result.current.items[0].qty).toBe(3);
  });

  test('total is sum of price * qty across all items', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });   // 62
    act(() => { result.current.addItem(ESPRESSO); }); // 14
    act(() => { result.current.addItem(PIZZA); });   // 62 * 2 = 124
    expect(result.current.total).toBe(124 + 14);
  });

  test('removeItem removes entry by id', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });
    act(() => { result.current.addItem(ESPRESSO); });
    act(() => { result.current.removeItem('p1'); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].item.id).toBe('e1');
  });

  test('removeItem on unknown id does not throw', () => {
    const { result } = renderHook(() => useCart());
    expect(() => {
      act(() => { result.current.removeItem('nope'); });
    }).not.toThrow();
  });

  test('updateQty updates qty capped at maxQty', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(ESPRESSO); });
    act(() => { result.current.updateQty('e1', 10); }); // capped to 3
    expect(result.current.items[0].qty).toBe(3);
  });

  test('updateQty does not produce NaN for items without maxQty (admin-created)', () => {
    const NO_MAX = { id: 'a1', name: 'New Dish', price: 30 }; // no maxQty
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(NO_MAX); });
    act(() => { result.current.updateQty('a1', 3); });
    expect(result.current.items[0].qty).toBe(3);
    expect(Number.isNaN(result.current.items[0].qty)).toBe(false);
  });

  test('updateQty with qty < 1 removes the item', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });
    act(() => { result.current.updateQty('p1', 0); });
    expect(result.current.items).toHaveLength(0);
  });

  test('clearCart empties all items', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });
    act(() => { result.current.addItem(ESPRESSO); });
    act(() => { result.current.clearCart(); });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.count).toBe(0);
  });

  test('count reflects total number of individual units', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(PIZZA); });
    act(() => { result.current.addItem(PIZZA); });
    act(() => { result.current.addItem(ESPRESSO); });
    expect(result.current.count).toBe(3);
  });
});
