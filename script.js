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

  /* Line-art illustrations: draw when they scroll into view, pause while off screen */

  const arts = Array.from(document.querySelectorAll('svg.art'));

  const setLive = (svg, live) => {
    svg.classList.toggle('is-live', live);
    if (typeof svg.pauseAnimations === 'function') {
      if (live) {
        svg.unpauseAnimations();
      } else {
        svg.pauseAnimations();
      }
    }
  };

  if ('IntersectionObserver' in window && !reduceMotion) {
    arts.forEach((svg) => setLive(svg, false));

    const artObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
        }
        setLive(entry.target, entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.2 });

    arts.forEach((svg) => artObserver.observe(svg));
  } else {
    arts.forEach((svg) => {
      svg.classList.add('is-in', 'is-live');
      if (reduceMotion && typeof svg.pauseAnimations === 'function') {
        svg.pauseAnimations();
      }
    });
  }

  /* Cursor effects for mouse and trackpad: a ring and dot that follow the pointer, a soft glow
     behind the page, a spotlight on a few surfaces and a slight tilt of the hero card. */

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduceMotion) {
    const root = document.documentElement;
    const glow = document.createElement('div');
    const ring = document.createElement('div');
    const dot = document.createElement('div');
    glow.className = 'cursor-glow';
    ring.className = 'cursor-ring';
    dot.className = 'cursor-dot';
    [glow, ring, dot].forEach((el) => {
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    });

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringAt = { x: target.x, y: target.y };
    const glowAt = { x: target.x, y: target.y };
    let ringScale = 1;
    let ringScaleTarget = 1;
    let frame = 0;

    // The scale is part of the same transform so the ring grows around the pointer, not the page corner.
    const place = (el, point, scale = 1) => {
      el.style.transform = `translate3d(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    };

    const follow = () => {
      ringAt.x += (target.x - ringAt.x) * 0.18;
      ringAt.y += (target.y - ringAt.y) * 0.18;
      glowAt.x += (target.x - glowAt.x) * 0.07;
      glowAt.y += (target.y - glowAt.y) * 0.07;
      ringScale += (ringScaleTarget - ringScale) * 0.2;
      place(dot, target);
      place(ring, ringAt, ringScale);
      place(glow, glowAt);

      const settled = Math.abs(target.x - glowAt.x) < 0.2
        && Math.abs(target.y - glowAt.y) < 0.2
        && Math.abs(ringScaleTarget - ringScale) < 0.005;
      frame = settled ? 0 : window.requestAnimationFrame(follow);
    };

    document.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') {
        return;
      }
      target.x = event.clientX;
      target.y = event.clientY;

      if (!root.classList.contains('has-cursor')) {
        ringAt.x = glowAt.x = target.x;
        ringAt.y = glowAt.y = target.y;
        root.classList.add('has-cursor');
      }

      const over = event.target instanceof Element ? event.target : null;
      const onControl = Boolean(over && over.closest('a, button, .viewer-stage'));
      const onDark = Boolean(over && over.closest('.results, .lightbox'));
      ringScaleTarget = onControl ? 1.6 : 1;
      ring.classList.toggle('is-active', onControl);
      ring.classList.toggle('on-dark', onDark);
      dot.classList.toggle('on-dark', onDark);

      if (!frame) {
        frame = window.requestAnimationFrame(follow);
      }
    }, { passive: true });

    root.addEventListener('mouseleave', () => root.classList.remove('has-cursor'));

    document.querySelectorAll('.hero-card, .results, .contact').forEach((surface) => {
      surface.addEventListener('pointermove', (event) => {
        const box = surface.getBoundingClientRect();
        surface.style.setProperty('--mx', `${(event.clientX - box.left).toFixed(0)}px`);
        surface.style.setProperty('--my', `${(event.clientY - box.top).toFixed(0)}px`);
        surface.classList.add('is-lit');
      }, { passive: true });
      surface.addEventListener('pointerleave', () => surface.classList.remove('is-lit'));
    });

    const heroCard = document.querySelector('.hero-card');
    if (heroCard) {
      const settle = () => heroCard.classList.add('is-settled');
      heroCard.addEventListener('animationend', (event) => {
        if (event.target === heroCard) {
          settle();
        }
      });
      window.setTimeout(settle, 2500);

      heroCard.addEventListener('pointermove', (event) => {
        const box = heroCard.getBoundingClientRect();
        const nx = (event.clientX - box.left) / box.width - 0.5;
        const ny = (event.clientY - box.top) / box.height - 0.5;
        heroCard.style.setProperty('--ry', `${(nx * 9).toFixed(2)}deg`);
        heroCard.style.setProperty('--rx', `${(-ny * 9).toFixed(2)}deg`);
      }, { passive: true });
      heroCard.addEventListener('pointerleave', () => {
        heroCard.style.setProperty('--rx', '0deg');
        heroCard.style.setProperty('--ry', '0deg');
      });
    }
  }

  /* Touch screens have no cursor, so a tap leaves a short ripple instead */

  if (!reduceMotion) {
    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') {
        return;
      }
      const ripple = document.createElement('span');
      ripple.className = 'tap-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      if (event.target instanceof Element && event.target.closest('.results')) {
        ripple.classList.add('on-dark');
      }
      ripple.addEventListener('animationend', () => ripple.remove());
      document.body.appendChild(ripple);
    }, { passive: true });
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

  const viewers = Array.from(document.querySelectorAll('[data-viewer]'));

  // Fetch a viewer's hidden figures as soon as it is near the screen, so switching is instant.
  const loadFigures = (viewer) => {
    viewer.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });
  };

  if ('IntersectionObserver' in window) {
    const figureObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          figureObserver.unobserve(entry.target);
          loadFigures(entry.target);
        }
      });
    }, { rootMargin: '300px 0px' });

    viewers.forEach((viewer) => figureObserver.observe(viewer));
  }

  viewers.forEach((viewer) => {
    const slides = Array.from(viewer.querySelectorAll('.slide'));
    const tabs = Array.from(viewer.querySelectorAll('.viewer-tab'));

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        loadFigures(viewer);
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
