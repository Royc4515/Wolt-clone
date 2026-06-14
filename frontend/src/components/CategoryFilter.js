import { useState } from 'react';

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
  return (
    <div className="category-filter" role="group" aria-label="Filter by category">
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
  );
}
