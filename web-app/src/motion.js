/**
 * Motion preferences
 *
 * CSS media queries cannot reach scrollIntoView()/scrollTo(), so any
 * JavaScript-driven scrolling has to check the preference itself. Smooth
 * scrolling across a document this long is a genuine problem for readers with
 * vestibular disorders.
 */

const reduceMotionQuery = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

/**
 * Returns the scroll behaviour to use: 'auto' (instant) when the user has
 * asked for reduced motion, 'smooth' otherwise.
 */
export function scrollBehavior() {
  return reduceMotionQuery && reduceMotionQuery.matches ? 'auto' : 'smooth';
}

/**
 * True when the user has asked for reduced motion.
 */
export function prefersReducedMotion() {
  return Boolean(reduceMotionQuery && reduceMotionQuery.matches);
}
