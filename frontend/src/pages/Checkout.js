import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { BackIcon, PinIcon } from '../components/icons';
import FulfillmentToggle from '../components/checkout/FulfillmentToggle';
import WhereSection from '../components/checkout/WhereSection';
import WhenSection from '../components/checkout/WhenSection';
import OrderItems from '../components/checkout/OrderItems';
import CutleryRow from '../components/checkout/CutleryRow';
import PaymentSection from '../components/checkout/PaymentSection';
import TipSection from '../components/checkout/TipSection';
import OrderSummary from '../components/checkout/OrderSummary';
import useCart from '../hooks/useCart';
import { getRestaurant } from '../api/restaurants';
import { createOrder } from '../api/orders';
import { isAuthenticated, USER_LOCATION_KEY } from '../utils/auth';
import { readCart, writeCart } from '../utils/cartStorage';
import { computeTotals, paymentLabel, money } from '../utils/checkout';
import woltIcon from '../assets/wolt-logo.png';
import './Checkout.css';

function readUserLocation() {
  try {
    const saved = localStorage.getItem(USER_LOCATION_KEY);
    if (!saved) return null;
    const loc = JSON.parse(saved);
    if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') return loc;
    return null;
  } catch {
    return null;
  }
}

export default function Checkout() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const { items, updateQty, clearCart, restoreItems, total: subtotal } = useCart();
  const location = useMemo(() => readUserLocation(), []);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [restored, setRestored] = useState(false);

  // Faked-on-frontend order options.
  const [mode, setMode] = useState('delivery');
  const [when, setWhen] = useState('standard');
  const [tip, setTip] = useState(0);
  const [method, setMethod] = useState('card');
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [cutlery, setCutlery] = useState(false);
  const [note, setNote] = useState('');

  const [placing, setPlacing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [error, setError] = useState('');

  // Guards + data load (runs once for the restaurant).
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
    const initial = readCart(restaurantId);
    if (initial.length === 0) {
      navigate(`/restaurant/${restaurantId}`, { replace: true });
      return;
    }
    restoreItems(initial);
    setRestored(true);

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getRestaurant(restaurantId)
      .then((rest) => {
        if (cancelled) return;
        setRestaurant(rest);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist cart edits back to localStorage so the restaurant page stays in sync.
  useEffect(() => {
    if (!restored) return;
    writeCart(restaurantId, items);
  }, [items, restored, restaurantId]);

  // If the user empties the cart from the checkout page, send them back.
  useEffect(() => {
    if (restored && items.length === 0 && !confirmed && !placing) {
      navigate(`/restaurant/${restaurantId}`, { replace: true });
    }
  }, [restored, items.length, confirmed, placing, restaurantId, navigate]);

  // The page may be scrolled down when the order is placed — bring the
  // confirmation into view so it isn't missed.
  useEffect(() => {
    if (confirmed) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [confirmed]);

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const totals = useMemo(
    () => computeTotals({ subtotal, deliveryFee, tip, mode }),
    [subtotal, deliveryFee, tip, mode]
  );

  function inc(itemId) {
    const entry = items.find((e) => e.item.id === itemId);
    if (entry) updateQty(itemId, entry.qty + 1);
  }
  function dec(itemId) {
    const entry = items.find((e) => e.item.id === itemId);
    if (entry) updateQty(itemId, entry.qty - 1);
  }

  async function handlePlaceOrder() {
    setError('');
    setPlacing(true);
    try {
      const orderItems = items.map((e) => ({ productId: e.item.id, quantity: e.qty }));
      await createOrder(restaurantId, orderItems);
      // Snapshot the order details before clearing the cart, so the
      // confirmation screen can show a receipt.
      setPlaced({
        count: items.reduce((sum, e) => sum + e.qty, 0),
        total: totals.total,
        eta: mode === 'pickup' ? 'Ready for pickup soon' : (restaurant.deliveryTime || '10–15 min'),
        mode,
      });
      clearCart();
      setConfirmed(true);
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="checkout">
        <AppBar />
        <main className="checkout__loading">
          <img src={woltIcon} alt="Loading" className="checkout__loading-logo" />
        </main>
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="checkout">
        <AppBar />
        <main className="checkout__not-found">
          <h1>Restaurant not found</h1>
        </main>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="checkout">
        <AppBar />
        <main className="checkout__confirm">
          <div className="checkout__confirm-card" role="status" aria-live="polite">
            <svg className="checkout__check" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="checkout__check-circle" cx="26" cy="26" r="24" fill="none" />
              <path className="checkout__check-mark" fill="none" d="M14 27l8 8 16-16" />
            </svg>
            <h1 className="checkout__confirm-title">Order accepted!</h1>
            <p className="checkout__confirm-sub">
              Thanks — your order from <strong>{restaurant.name}</strong> is confirmed.
            </p>

            {placed && (
              <div className="checkout__receipt">
                <div className="checkout__receipt-row">
                  <span>Items</span>
                  <span>{placed.count}</span>
                </div>
                <div className="checkout__receipt-row">
                  <span>{placed.mode === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                  <span>{placed.eta}</span>
                </div>
                <div className="checkout__receipt-row checkout__receipt-row--total">
                  <span>Total paid</span>
                  <span>{money(placed.total)}</span>
                </div>
              </div>
            )}

            <button type="button" className="checkout__confirm-btn" onClick={() => navigate('/')}>
              Back to home
            </button>
            <button type="button" className="checkout__confirm-link" onClick={() => navigate('/orders')}>
              View my orders
            </button>
          </div>
        </main>
      </div>
    );
  }

  const canPlace = !placing && items.length > 0;
  const orderLabel = `Order with ${paymentLabel(method)}`;

  return (
    <div className="checkout">
      <AppBar />

      {/* ── Hero ── */}
      <div className="checkout__hero">
        <button
          type="button"
          className="checkout__back"
          onClick={() => navigate(`/restaurant/${restaurantId}`)}
          aria-label="Back to restaurant"
        >
          <BackIcon />
          <span>Back</span>
        </button>
        <PinIcon size={26} />
        <div>
          <h1 className="checkout__title">Checkout</h1>
          <p className="checkout__restaurant">{restaurant.name}</p>
        </div>
      </div>

      <div className="checkout__layout">
        {/* ── Main column ── */}
        <main className="checkout__col">
          <FulfillmentToggle mode={mode} onChange={setMode} />

          <WhereSection
            mode={mode}
            location={location}
            restaurant={restaurant}
            leaveAtDoor={leaveAtDoor}
            onToggleLeaveAtDoor={() => setLeaveAtDoor((v) => !v)}
            note={note}
            onNoteChange={setNote}
          />

          <WhenSection when={when} onChange={setWhen} deliveryTime={restaurant.deliveryTime} />

          <OrderItems
            items={items}
            onInc={inc}
            onDec={dec}
            onAddMore={() => navigate(`/restaurant/${restaurantId}`)}
          />

          <CutleryRow value={cutlery} onToggle={() => setCutlery((v) => !v)} />

          <PaymentSection method={method} onChange={setMethod} />

          {mode === 'delivery' && <TipSection tip={tip} onChange={setTip} />}

          {error && <div className="checkout__error" role="alert">{error}</div>}
        </main>

        {/* ── Sticky summary ── */}
        <OrderSummary
          totals={totals}
          mode={mode}
          orderLabel={orderLabel}
          onPlaceOrder={handlePlaceOrder}
          placing={placing}
          canPlace={canPlace}
        />
      </div>
    </div>
  );
}
