/* ============================================================
   UNICAMP Pocket Hub — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Scroll progress bar ─────────────────────────────── */
  const progressBar = document.getElementById('progress-bar');

  function updateProgress() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  /* ── 2. Hero parallax ────────────────────────────────────── */
  const heroBg = document.getElementById('hero-bg');

  function updateParallax() {
    if (!heroBg) return;
    const scrollY = window.scrollY;
    heroBg.style.transform = `translateY(${scrollY * 0.28}px)`;
  }

  /* ── 3. Intersection Observer — fade-in ─────────────────── */
  const fadeEls = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach((el, i) => {
    // Stagger sibling cards/timeline steps by their order within a parent
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.classList.contains('fade-in'));
      const idx = siblings.indexOf(el);
      if (idx > 0) {
        el.style.transitionDelay = `${idx * 0.08}s`;
      }
    }
    observer.observe(el);
  });

  /* ── Combined scroll handler ─────────────────────────────── */
  window.addEventListener('scroll', () => {
    updateProgress();
    updateParallax();
  }, { passive: true });

  // Initial call
  updateProgress();
  updateParallax();

  /* ── 4. Lightbox ─────────────────────────────────────────── */
  const galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
  const lightbox     = document.getElementById('lightbox');
  const lbImg        = document.getElementById('lb-img');
  const lbCounter    = document.getElementById('lb-counter');
  const lbClose      = document.getElementById('lb-close');
  const lbPrev       = document.getElementById('lb-prev');
  const lbNext       = document.getElementById('lb-next');

  let currentIndex = 0;
  let previousFocus = null;

  function getImageData(index) {
    const btn = galleryItems[index];
    const img = btn.querySelector('img');
    return { src: img.src, alt: img.alt };
  }

  function showLightbox(index) {
    currentIndex = index;
    const { src, alt } = getImageData(index);
    lbImg.src = src;
    lbImg.alt = alt;
    lbCounter.textContent = `${index + 1} / ${galleryItems.length}`;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    previousFocus = document.activeElement;
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
    if (previousFocus) previousFocus.focus();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    const { src, alt } = getImageData(currentIndex);
    lbImg.src = src;
    lbImg.alt = alt;
    lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    const { src, alt } = getImageData(currentIndex);
    lbImg.src = src;
    lbImg.alt = alt;
    lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  }

  galleryItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      showLightbox(idx);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', showPrev);
  lbNext.addEventListener('click', showNext);

  // Click backdrop to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); showPrev(); break;
      case 'ArrowRight': e.preventDefault(); showNext(); break;
      case 'Escape':     e.preventDefault(); closeLightbox(); break;
    }
  });

  /* ── 5. Mobile bottom nav ───────────────────────────────── */
  const mobileNav  = document.getElementById('mobile-nav');
  const mobileTabs = document.querySelectorAll('.mobile-nav__tab');
  const isMobile   = () => window.innerWidth <= 768;

  const sectionIds = ['inicio', 'projeto', 'programa', 'fases', 'plantas', 'galeria'];

  mobileTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      const el = document.getElementById(targetId);
      if (!el) return;

      mobileTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Highlight active mobile tab on scroll
  const sectionEls = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const tabObserver = new IntersectionObserver(
    (entries) => {
      if (!isMobile()) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          mobileTabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.target === id);
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sectionEls.forEach(el => tabObserver.observe(el));

})();
