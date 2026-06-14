import { useState, useRef, useEffect } from 'react';

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function CategoryIcon({ image, emoji, colorClass }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`category-card__icon ${colorClass}${image && !imgFailed ? ' category-card__icon--has-img' : ''}`}>
      {image && !imgFailed
        ? <img src={image} alt="" draggable={false} onError={() => setImgFailed(true)} />
        : <span aria-hidden="true">{emoji}</span>
      }
    </div>
  );
}

export default function CategoryFilter({ categories, active, onSelect }) {
  const rowRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    function update() {
      setCanLeft(el.scrollLeft > 1);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  function scroll(dir) {
    rowRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  }

  return (
    <div className="category-filter-wrap">
      <div className="category-filter-nav">
        <button
          className="home__scroll-btn"
          onClick={() => scroll(-1)}
          aria-label="Scroll categories left"
          disabled={!canLeft}
        >
          <ChevronLeft />
        </button>
        <button
          className="home__scroll-btn"
          onClick={() => scroll(1)}
          aria-label="Scroll categories right"
          disabled={!canRight}
        >
          <ChevronRight />
        </button>
      </div>

      <div className="category-filter" role="group" aria-label="Filter by category" ref={rowRef}>
        <button
          className={`category-card${!active ? ' category-card--active' : ''}`}
          onClick={() => onSelect(null)}
          aria-pressed={!active}
        >
          <div className="category-card__icon category-card__icon--all">
            <span aria-hidden="true">🍽️</span>
          </div>
          <span className="category-card__name">All</span>
        </button>

        {categories.map(({ name, emoji, image }, i) => (
          <button
            key={name}
            className={`category-card${active === name ? ' category-card--active' : ''}`}
            onClick={() => onSelect(name)}
            aria-pressed={active === name}
          >
            <CategoryIcon
              image={image}
              emoji={emoji}
              colorClass={`category-card__icon--c${i % 8}`}
            />
            <span className="category-card__name">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
