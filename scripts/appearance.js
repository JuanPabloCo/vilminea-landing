// Intersection-based reveal animations with reduced-motion fallback
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const targets = Array.from(document.querySelectorAll('[data-animate]'));

function revealSequential(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}

if (!prefersReduced && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(revealSequential, {
    root: null,
    threshold: 0.15
  });
  targets.forEach(el => observer.observe(el));
} else {
  // Fallback: mostrar todo sin animación
  targets.forEach(el => el.classList.add('is-visible'));
}
