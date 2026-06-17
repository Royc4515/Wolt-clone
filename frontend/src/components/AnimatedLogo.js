import { useEffect, useRef } from 'react';
import './AnimatedLogo.css';

// Centerline pen-stroke paths tracing cursive "Wolt" (viewBox 0 0 154 56).
// The mask reveals the actual filled logo as each stroke is drawn.
const MAIN_PATH =
  // W — start top-left, two valleys, exit right
  'M 3,6 C 5,20 8,42 10,48 C 14,38 18,12 22,6 ' +
  'C 26,18 30,42 36,48 C 40,32 52,8 58,6 ' +
  'C 60,16 62,28 63,32 ' +
  // o — full circle, exit right
  'M 63,32 C 63,18 70,8 80,8 C 90,8 96,20 95,34 ' +
  'C 94,46 85,52 75,50 C 63,48 61,40 63,32 ' +
  'C 65,26 96,38 99,28 ' +
  // l — tall ascender then descender
  'C 99,8 101,4 102,4 C 103,4 104,20 106,52 ' +
  // t — stem (crossbar is animated separately below)
  'M 111,5 L 111,52';

// t crossbar — short horizontal flick, animated with a delay
const CROSSBAR_PATH = 'M 102,30 L 128,30';

export default function AnimatedLogo({ className = '' }) {
  // Unique mask ID so multiple instances on the same page don't conflict
  const maskId = useRef(`woltMask${Math.random().toString(36).slice(2)}`).current;
  const mainRef = useRef(null);
  const crossRef = useRef(null);

  useEffect(() => {
    const main = mainRef.current;
    const cross = crossRef.current;
    if (!main || !cross) return;

    // Compute exact lengths so the animation covers 0% → 100% precisely
    const mainLen = Math.ceil(main.getTotalLength());
    const crossLen = Math.ceil(cross.getTotalLength());

    main.setAttribute('stroke-dasharray', mainLen);
    main.setAttribute('stroke-dashoffset', mainLen);
    cross.setAttribute('stroke-dasharray', crossLen);
    cross.setAttribute('stroke-dashoffset', crossLen);

    // Small delay ensures initial hidden state is painted before transition fires
    const startTimer = setTimeout(() => {
      main.style.transition = 'stroke-dashoffset 1.7s cubic-bezier(0.4, 0, 0.2, 1)';
      main.setAttribute('stroke-dashoffset', 0);
    }, 50);

    // Crossbar flicks in just as the main stroke finishes
    const crossTimer = setTimeout(() => {
      cross.style.transition = 'stroke-dashoffset 0.3s ease-out';
      cross.setAttribute('stroke-dashoffset', 0);
    }, 1650);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(crossTimer);
    };
  }, []);

  return (
    <svg
      className={`wolt-logo-wrap${className ? ` ${className}` : ''}`}
      viewBox="0 0 154 56"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Wolt"
      role="img"
    >
      <defs>
        <mask id={maskId}>
          {/* Pen-stroke paths drawn via stroke-dashoffset — white = reveal */}
          <path
            ref={mainRef}
            d={MAIN_PATH}
            stroke="white"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            ref={crossRef}
            d={CROSSBAR_PATH}
            stroke="white"
            strokeWidth="24"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>

      {/* Actual Wolt logo paths, revealed by the mask above */}
      <g mask={`url(#${maskId})`}>
        <path
          fill="currentColor"
          d="M149.3,23.7c2.5-0.1,4.2-0.8,4.7-3.2c0.3-1.4-0.6-2.3-2.2-2.4c0,0-4.6-0.2-10-0.5
          c0,0,1.1-5.9,1.6-8.3c0.3-1.2-0.4-2.4-1.9-2.7c-1.5-0.4-4.9-0.4-6-0.3c-1,0.1-1.9,0.7-2.1,1.7
          c-0.5,2.5-1.1,5.5-1.8,9.3c-2,0-3.9-0.1-5.2,0c-1.2,0-1.8,0.7-2.1,1.7c-0.3,1-0.5,2.5-0.5,4
          c-0.1,1.2,1.2,1.7,2.5,1.6c0,0,1.6-0.1,4.1-0.2c0,0,0,0,0,0l0,0c-0.5,2.2-1.4,8-1.7,11.6
          c-2.2,7.5-6.9,13.1-10.9,13.1c-2.5,0-3.9-1.5-3.9-5.9c0-6.1,1.4-13.8,3.5-21.6
          c2.9-7,4.6-14.7,4.6-18.2c0-1.3-0.4-2.8-2-3.1c-2.8-0.6-5.6-0.5-7.5,0.1c-1.7,0.5-2,2.3-2.2,3.3
          c-1,4.6-2.6,12.7-3.7,19.8c-2.5,3-5.4,5.1-8.5,5.7c-0.3-5.5-2.3-9.2-5.4-11.3
          c-0.9-0.6-1.9-1.1-3-1.4c-1.5-0.5-3.2-0.7-5.1-0.7c-13.2,0-21.7,11.8-21.7,25
          c0,10.7,5.9,15.2,14.4,15.2c10.1,0,17.5-7.1,20.3-20.2c2.8-0.6,5.3-2,7.5-3.9
          c0,0-1.6,8.1-1.6,12.9c0,7.2,3.1,11.2,10.4,11.2c6,0,11.2-4.2,14.5-9.4
          c0.9,6.7,4.4,9.4,10.1,9.4c5.2,0,10.3-3.3,13.8-9.3c0.7-1.2,1.2-2.2,0.8-2.8
          c-1-1.2-3-1.8-3.5-0.8c-2.3,4.3-4.9,6-7.6,6c-2.2,0-3.9-1.3-3.9-5.1c0-5.4,3.1-20.1,3.1-20.1
          C143.5,23.9,146.5,23.8,149.3,23.7z
          M88.1,34.1c-1.4,8.8-5.3,16.1-9.5,16.1c-3,0-5.1-2.6-5.1-7.8
          c0-10,3.6-20.7,9.9-20.7c0.7,0,1.4,0.1,1.9,0.3c0.1,0,0.1,0.1,0.2,0.1
          c-0.5,1.4-0.6,2.8-0.7,4.3C84.8,28.7,85.2,31.7,88.1,34.1C88.1,34,88.1,34,88.1,34.1z"
        />
        <path
          fill="currentColor"
          d="M130.3,24.5C130.3,24.4,130.3,24.4,130.3,24.5C129.8,24.5,129.9,24.5,130.3,24.5z"
        />
        <path
          fill="currentColor"
          d="M57.9,0c-1.8,0-3.3,0.1-4.1,0.2c-1.5,0.2-2.1,1.6-1.9,3.1c1.6,20.9-3,45.1-8.2,45.1
          c-3.9,0-5-11.3-5-21.4c0-6,0.3-11.7,0.5-16.8c0.1-1.9-0.6-2.2-2-2.4c-2.1-0.3-3.5-0.2-5.6,0.2
          C30,8.3,29.6,9.6,28,13.5C19.8,33,11.9,48.6,11.9,48.6c-2.1-15.7,0.6-30.9,2.9-42
          c0.3-1.5-0.4-2.4-1.7-2.4c-2.4,0-6,0.1-7.6,1.2c-1.5,1-2.1,2.1-2.5,4.3
          c-2.5,12.7-4.2,28.7-1.6,41c0.6,2.7,1.2,3.3,2.3,4c1.1,0.7,6,1.3,7.8,1.3
          c2.1,0,4.1-0.6,5.7-3.4c3.4-5.9,6.2-11.8,11.4-23.1c0.5,14.7,2.6,26.3,13,26.3
          C55.2,55.9,64,21.6,64,5.1C64,0.7,61.9,0,57.9,0z"
        />
      </g>
    </svg>
  );
}
