(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow and reading-progress bar */

  const header = document.querySelector('.site-header');
  const progress = document.getElementById('progress');
  let scrollQueued = false;

  const updateScrollState = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) {
      progress.style.setProperty('--p', ratio.toFixed(4));
    }
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    scrollQueued = false;
  };

  const queueScrollUpdate = () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollState);
    }
  };

  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', queueScrollUpdate);
  updateScrollState();

  /* Mobile menu */

  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        setOpen(false);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    });
  }

  /* Highlight the nav link of the section in view */

  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  const linkById = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));

  if ('IntersectionObserver' in window && navLinks.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const active = linkById.get(entry.target.id) || null;
        navLinks.forEach((link) => link.classList.toggle('is-active', link === active));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section').forEach((section) => sectionObserver.observe(section));
  }

  /* Scroll reveal */

  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* Count the result figures up once they scroll into view */

  const counters = Array.from(document.querySelectorAll('[data-count]'));

  const runCounter = (el) => {
    const finalText = el.dataset.count;
    const target = Number.parseFloat(finalText);
    const decimals = (finalText.split('.')[1] || '').length;
    if (!Number.isFinite(target)) {
      return;
    }

    const duration = 1400;
    const start = window.performance.now();

    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        el.textContent = (target * eased).toFixed(decimals);
        window.requestAnimationFrame(frame);
      } else {
        el.textContent = finalText;
      }
    };

    el.textContent = (0).toFixed(decimals);
    window.requestAnimationFrame(frame);
  };

  if (counters.length > 0 && 'IntersectionObserver' in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counterObserver.unobserve(entry.target);
          runCounter(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* Figure viewer in each project: the buttons switch between schematic, layout and LVS */

  document.querySelectorAll('[data-viewer]').forEach((viewer) => {
    const slides = Array.from(viewer.querySelectorAll('.slide'));
    const tabs = Array.from(viewer.querySelectorAll('.viewer-tab'));

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
        tabs.forEach((other, i) => {
          other.classList.toggle('is-active', i === index);
          other.setAttribute('aria-pressed', String(i === index));
        });
      });
    });
  });

  /* Enlarged figure: without it, the figure links simply open the image */

  const dialog = document.getElementById('lightbox');
  const bigImage = document.getElementById('lightbox-img');
  const bigCaption = document.getElementById('lightbox-caption');

  if (dialog && bigImage && bigCaption && typeof dialog.showModal === 'function') {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a.zoom');
      if (!link) {
        return;
      }
      event.preventDefault();
      const thumbnail = link.querySelector('img');
      bigImage.src = link.getAttribute('href');
      bigImage.alt = thumbnail ? thumbnail.alt : '';
      bigCaption.textContent = link.dataset.caption || '';
      dialog.showModal();
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      bigImage.removeAttribute('src');
    });
  }
})();
