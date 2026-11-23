(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Typing line under the name */

  const typingEl = document.getElementById('typing-text');
  const phrases = [
    'ANALOG & MIXED-SIGNAL IC DESIGN',
    'CUSTOM LAYOUT · DRC / LVS / PEX',
    'M.S. STUDENT · TEXAS A&M UNIVERSITY'
  ];

  if (typingEl && !reduceMotion) {
    let phrase = 0;
    let position = phrases[0].length;
    let deleting = true;

    const tick = () => {
      position += deleting ? -1 : 1;
      typingEl.textContent = phrases[phrase].slice(0, position);

      let delay = deleting ? 28 : 55;
      if (!deleting && position === phrases[phrase].length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && position === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        delay = 350;
      }
      window.setTimeout(tick, delay);
    };

    window.setTimeout(tick, 2200);
  }

  /* Mobile menu */

  const toggle = document.getElementById('menu-toggle');
  const navList = document.getElementById('nav-list');

  if (toggle && navList) {
    const setOpen = (open) => {
      navList.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    navList.addEventListener('click', (event) => {
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

  const navLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));
  const linkById = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));

  if ('IntersectionObserver' in window && navLinks.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const id = entry.target.id === 'digital-projects' ? 'projects' : entry.target.id;
        const active = linkById.get(id);
        navLinks.forEach((link) => link.classList.toggle('is-active', link === active));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
  }

  /* Figure viewer: without it, the figure links simply open the image */

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
