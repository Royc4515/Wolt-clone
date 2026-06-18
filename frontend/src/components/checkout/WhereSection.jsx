import { Link } from 'react-router-dom';
import { PinIcon, ChevronRightIcon, DoorIcon, NoteIcon } from '../icons';

function PickupLocation({ restaurant }) {
  return (
    <section className="checkout-section">
      <h2 className="checkout-section__title">Pickup location</h2>
      <div className="checkout-card">
        <div className="checkout-row">
          <PinIcon size={20} />
          <div className="checkout-row__main">
            <p className="checkout-row__label">{restaurant.name}</p>
            <p className="checkout-row__sub">Collect your order from the restaurant</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WhereSection({
  mode,
  location,
  restaurant,
  leaveAtDoor,
  onToggleLeaveAtDoor,
  note,
  onNoteChange,
}) {
  if (mode === 'pickup') return <PickupLocation restaurant={restaurant} />;

  return (
    <section className="checkout-section">
      <h2 className="checkout-section__title">Where?</h2>
      <div className="checkout-card">
        <Link to="/profile" className="checkout-row checkout-row--link">
          <PinIcon size={20} />
          <div className="checkout-row__main">
            <p className="checkout-row__label">{location ? 'Your location' : 'Set a location'}</p>
            <p className="checkout-row__sub">
              {location
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : 'Add a delivery location in your profile'}
            </p>
          </div>
          <ChevronRightIcon />
        </Link>

        <div className="checkout-row checkout-row--divider">
          <DoorIcon size={20} />
          <span className="checkout-row__label" id="leave-at-door-label">Leave order at the door</span>
          <button
            type="button"
            role="switch"
            aria-checked={leaveAtDoor}
            aria-labelledby="leave-at-door-label"
            className={`checkout-switch${leaveAtDoor ? ' checkout-switch--on' : ''}`}
            onClick={onToggleLeaveAtDoor}
          >
            <span className="checkout-switch__knob" />
          </button>
        </div>

        <div className="checkout-row checkout-row--divider">
          <NoteIcon size={20} />
          <input
            className="checkout-note"
            placeholder="Add note for the courier"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            aria-label="Add note for the courier"
          />
        </div>
      </div>
    </section>
  );
}
