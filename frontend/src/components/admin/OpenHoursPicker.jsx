// Two time dropdowns (every 30 min) that produce an "HH:MM–HH:MM" string.
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export default function OpenHoursPicker({ value, onChange }) {
  const [from = '', to = ''] = (value || '').split(/[–-]/).map((s) => s.trim());
  const set = (f, t) => onChange(f && t ? `${f}–${t}` : f || t || '');

  return (
    <div className="hours-picker">
      <select
        className="input"
        aria-label="Opening time"
        value={from}
        onChange={(e) => set(e.target.value, to)}
      >
        <option value="">Opens…</option>
        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <span className="hours-picker__sep">to</span>
      <select
        className="input"
        aria-label="Closing time"
        value={to}
        onChange={(e) => set(from, e.target.value)}
      >
        <option value="">Closes…</option>
        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}
