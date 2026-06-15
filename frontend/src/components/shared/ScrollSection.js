import { useRef, Children } from 'react';
import useScrollEdges from '../../hooks/useScrollEdges';

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

export default function ScrollSection({ title, children, classPrefix, sectionRef }) {
  const rowRef = useRef(null);
  const { canLeft, canRight } = useScrollEdges(rowRef, Children.count(children));

  return (
    <section className={`${classPrefix}__section`} ref={sectionRef}>
      <div className={`${classPrefix}__section-header`}>
        <h2 className={`${classPrefix}__section-title`}>{title}</h2>
        <div className={`${classPrefix}__section-nav`}>
          <button
            type="button"
            className={`${classPrefix}__scroll-btn`}
            onClick={() => rowRef.current?.scrollBy({ left: -560, behavior: 'smooth' })}
            disabled={!canLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className={`${classPrefix}__scroll-btn`}
            onClick={() => rowRef.current?.scrollBy({ left: 560, behavior: 'smooth' })}
            disabled={!canRight}
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className={`${classPrefix}__scroll-row`} ref={rowRef}>
        {children}
      </div>
    </section>
  );
}
