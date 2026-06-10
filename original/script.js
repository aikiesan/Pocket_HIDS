/* ============================================================
   UNICAMP Pocket HIDS — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Scroll progress bar ─────────────────────────────── */
  const progressBar = document.getElementById('progress-bar');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
  }

  /* ── 2. Hero parallax ────────────────────────────────────── */
  const heroBg = document.getElementById('hero-bg');

  function updateParallax() {
    if (!heroBg) return;
    heroBg.style.transform = `translateY(${window.scrollY * 0.28}px)`;
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

  fadeEls.forEach((el) => {
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

  updateProgress();
  updateParallax();

  /* ── 4. Lightbox ─────────────────────────────────────────── */
  const gallery = document.getElementById('gallery');

  if (gallery) {
    const galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
    const lightbox     = document.getElementById('lightbox');
    const lbImg        = document.getElementById('lb-img');
    const lbCounter    = document.getElementById('lb-counter');
    const lbClose      = document.getElementById('lb-close');
    const lbPrev       = document.getElementById('lb-prev');
    const lbNext       = document.getElementById('lb-next');

    let currentIndex  = 0;
    let previousFocus = null;

    function getImageData(index) {
      const btn = galleryItems[index];
      const img = btn.querySelector('img');
      return { src: img.src, alt: img.alt };
    }

    function showLightbox(index) {
      currentIndex = index;
      const { src, alt } = getImageData(index);
      lbImg.src  = src;
      lbImg.alt  = alt;
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
        showLightbox(parseInt(btn.dataset.index, 10));
      });
    });

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', showPrev);
    lbNext.addEventListener('click', showNext);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); showPrev();       break;
        case 'ArrowRight': e.preventDefault(); showNext();       break;
        case 'Escape':     e.preventDefault(); closeLightbox();  break;
      }
    });
  }

  /* ── 5. Mobile bottom nav — page navigation ─────────────── */
  document.querySelectorAll('.mobile-nav__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const href = tab.dataset.href;
      if (href) window.location.href = href;
    });
  });

  /* ── 6. Detect current page & mark active nav ────────────── */
  function detectPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar__links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === path);
    });
    document.querySelectorAll('.mobile-nav__tab').forEach(tab => {
      tab.classList.toggle('active', (tab.dataset.href || '') === path);
    });
  }

  detectPage();

})();
