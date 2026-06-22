import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { BackIcon, PinIcon, AlertIcon } from '../components/icons';
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
import { isAuthenticated } from '../utils/auth';
import { getUserLocation } from '../utils/location';
import { readCart, writeCart } from '../utils/cartStorage';
import { computeTotals, paymentLabel, money, calcAerialDistance, MAX_DELIVERY_RADIUS_KM } from '../utils/checkout';
import woltIcon from '../assets/wolt-logo.png';
import './Checkout.css';

// The server's ETA is numeric for pickup but can come back malformed for
// delivery (it adds the restaurant's string deliveryTime). Show it only when
// it's a clean number; otherwise fall back to the restaurant's own estimate.
function formatEta(estimatedTime, mode, restaurant) {
  const n = Number(estimatedTime);
  if (Number.isFinite(n) && n > 0) return `≈ ${Math.round(n)} min`;
  return mode === 'pickup' ? 'Ready for pickup soon' : (restaurant?.deliveryTime || 'Soon');
}

export default function Checkout() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const { items, updateQty, clearCart, restoreItems, total: subtotal } = useCart();
  const location = useMemo(() => getUserLocation(), []);

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
  const [cutlery, setCutlery] = useState(0);
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
    if (confirmed) {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* jsdom */ }
    }
  }, [confirmed]);

  const totals = useMemo(
    () => computeTotals({ subtotal, tip, mode, restaurant, userLocation: location }),
    [subtotal, tip, mode, restaurant, location]
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
      const payload = {
        restaurantId,
        items: items.map((e) => ({ productId: e.item.id, quantity: e.qty })),
        mode,
        paymentMethod: method,
        cutlery,
        notes: note,
        tip: mode === 'delivery' ? tip : 0,
        ...(mode === 'delivery' && location ? { location } : {}),
      };
      // The server returns the full order with the authoritative pricing.
      const order = await createOrder(payload);
      setPlaced({
        count: items.reduce((sum, e) => sum + e.qty, 0),
        pricing: order?.pricing ?? null,
        total: order?.pricing?.total ?? totals.total,
        eta: formatEta(order?.estimatedTime, mode, restaurant),
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
                {placed.pricing && (
                  <>
                    <div className="checkout__receipt-row">
                      <span>Subtotal</span>
                      <span>{money(placed.pricing.subtotal)}</span>
                    </div>
                    <div className="checkout__receipt-row">
                      <span>Service fee</span>
                      <span>{money(placed.pricing.serviceFee)}</span>
                    </div>
                    {placed.mode === 'delivery' && (
                      <div className="checkout__receipt-row">
                        <span>Delivery</span>
                        <span>{placed.pricing.deliveryFee === 0 ? 'Free' : money(placed.pricing.deliveryFee)}</span>
                      </div>
                    )}
                    {placed.pricing.finalTip > 0 && (
                      <div className="checkout__receipt-row">
                        <span>Courier tip</span>
                        <span>{money(placed.pricing.finalTip)}</span>
                      </div>
                    )}
                  </>
                )}
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

  // Server requires a location for delivery — block until one is set.
  const needsLocation = mode === 'delivery' && !location;
  // Client-side mirror of the server's 15 km delivery radius: pre-empt the 400
  // so the user gets immediate, actionable feedback instead of a failed order.
  const distanceKm =
    mode === 'delivery' && location && restaurant?.location
      ? calcAerialDistance(restaurant.location.lat, restaurant.location.lng, location.lat, location.lng)
      : null;
  const tooFar = distanceKm != null && distanceKm > MAX_DELIVERY_RADIUS_KM;
  const canPlace = !placing && items.length > 0 && !needsLocation && !tooFar;
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

          <CutleryRow value={cutlery} onChange={setCutlery} />

          <PaymentSection method={method} onChange={setMethod} />

          {mode === 'delivery' && <TipSection tip={tip} onChange={setTip} />}

          {needsLocation && (
            <div className="checkout__notice" role="alert">
              Add a delivery location in your profile to place a delivery order, or{' '}
              <button type="button" className="checkout__inline-link" onClick={() => setMode('pickup')}>
                switch to Pickup
              </button>.
            </div>
          )}

          {tooFar && (
            <div className="checkout__too-far" role="alert">
              <span className="checkout__too-far-icon" aria-hidden="true"><AlertIcon size={24} /></span>
              <div className="checkout__too-far-body">
                <p className="checkout__too-far-title">Delivery isn't available here</p>
                <p className="checkout__too-far-text">
                  {restaurant.name} is {distanceKm.toFixed(1)} km away — beyond our{' '}
                  {MAX_DELIVERY_RADIUS_KM} km delivery range.
                </p>
              </div>
              <button type="button" className="checkout__too-far-btn" onClick={() => setMode('pickup')}>
                Switch to Pickup
              </button>
            </div>
          )}

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
