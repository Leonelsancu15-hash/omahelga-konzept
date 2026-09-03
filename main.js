/* =====================================================================
   Oma Helga — Konzept-Vorschau · main.js
   1. Lenis (ein Smooth-Scroll) an GSAP ScrollTrigger gekoppelt
   2. Wort-Splitting mit intaktem Accessible Name
   3. Der Film: Blob-gepuffert, per Scroll gescrubbt, Poster bis zum ersten Frame
   4. Intro + Choreografie (Hero, Kapitel, feste Abschnitte, Parallax)
   5. Angebot als 3D-Galerie (gepinnt am Desktop, Snap-Scroller mobil)
   6. Navigation, Cursor, Magnetik, Tilt
   7. Anfrageformular (Vorschau: öffnet eine vorausgefüllte E-Mail)
   Ohne JS ist alles sichtbar; unter prefers-reduced-motion gibt es weder
   Smooth-Scroll noch Film noch Partikel. Keine Cookies, kein Tracking.
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const html = document.documentElement;
  const isIndex = document.body.classList.contains('is-index');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const motion = isIndex && hasGSAP && !prefersReduced;

  window.NM = { scroll: 0, cinema: 0, dim: 0 };

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* 1. Smooth Scroll */
  let lenis = null;
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.defaults({ ease: 'power3.out', duration: 0.85 });
  }
  if (motion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, anchors: { offset: -110 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.NM.lenis = lenis;
  }

  /* 2. Wort-Splitting */
  function splitWords(el) {
    if (el.dataset.splitDone) return $$('.wi', el);
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    const frag = document.createDocumentFragment();
    const walk = (node, cls) => {
      Array.prototype.forEach.call(node.childNodes, (n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            const wi = document.createElement('span'); wi.className = 'wi' + (cls ? ' ' + cls : ''); wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === 'BR') { frag.appendChild(document.createElement('br')); return; }
          walk(n, (cls ? cls + ' ' : '') + (n.className || n.tagName.toLowerCase()));
        }
      });
    };
    walk(el, '');
    el.textContent = '';
    el.appendChild(frag);
    el.dataset.splitDone = '1';
    return $$('.wi', el);
  }

  /* 3. Der Film — drei Schnitte: Desktop 16:9, Mobil 16:9 (klein), Hochkant 9:16 */
  const FILM = {
    desktop:  { mp4: 'assets/film/omahelga-bulli-desktop.mp4',  webm: 'assets/film/omahelga-bulli-desktop.webm',  poster: 'assets/film/omahelga-bulli-desktop-poster.jpg' },
    mobile:   { mp4: 'assets/film/omahelga-bulli-mobile.mp4',   webm: 'assets/film/omahelga-bulli-mobile.webm',   poster: 'assets/film/omahelga-bulli-mobile-poster.jpg' },
    portrait: { mp4: 'assets/film/omahelga-bulli-portrait.mp4', webm: 'assets/film/omahelga-bulli-portrait.webm', poster: 'assets/film/omahelga-bulli-portrait-poster.jpg' },
  };
  const KM_START = 12.0;

  const film = (function () {
    const api = { ready: false, setProgress: function () {} };
    const stage = $('#stage'), video = $('#stageFilm'), posterImg = $('#stagePoster img');
    if (!stage || !video || !motion) return api;
    const portrait = window.matchMedia('(orientation: portrait) and (max-width: 899px)').matches;
    const variant = portrait ? FILM.portrait : (window.innerWidth <= 1024 ? FILM.mobile : FILM.desktop);
    if (posterImg && !portrait && variant === FILM.mobile) posterImg.src = variant.poster;
    const canH264 = !!video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
    const canVP9 = !!video.canPlayType && video.canPlayType('video/webm; codecs="vp9"') !== '';
    const src = canH264 ? variant.mp4 : (canVP9 ? variant.webm : null);
    if (!src) return api;

    let duration = 0, target = 0, pending = false, seeking = false, lastApplied = -1, blobUrl = null, primed = false;
    const markReady = () => { if (api.ready) return; api.ready = true; stage.classList.add('is-ready'); if (hasGSAP) ScrollTrigger.refresh(); };
    const applySeek = () => {
      pending = false;
      if (!duration || seeking) return;
      const t = Math.min(duration - 0.04, Math.max(0, target * duration));
      if (Math.abs(t - lastApplied) < 1 / 90) return;
      seeking = true; lastApplied = t;
      try { video.currentTime = t; } catch (e) { seeking = false; }
    };
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(applySeek); } };
    video.addEventListener('seeked', () => { seeking = false; markReady(); if (duration && Math.abs(target * duration - lastApplied) > 1 / 60) schedule(); });
    video.addEventListener('loadeddata', markReady, { once: true });
    video.addEventListener('loadedmetadata', () => { duration = video.duration || 0; lastApplied = -1; schedule(); });
    const prime = () => { if (primed) return; primed = true; const p = video.play(); if (p && p.then) p.then(() => video.pause()).catch(() => {}); };
    ['touchstart', 'pointerdown', 'keydown', 'wheel'].forEach((ev) => window.addEventListener(ev, prime, { once: true, passive: true }));
    fetch(src, { cache: 'force-cache' })
      .then((r) => { if (!r.ok) throw new Error('film ' + r.status); return r.blob(); })
      .then((b) => { blobUrl = URL.createObjectURL(b); video.src = blobUrl; video.load(); })
      .catch(() => {});
    window.addEventListener('pagehide', () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, { once: true });
    api.setProgress = (p) => { target = p; schedule(); };
    return api;
  })();

  /* 4. Intro + Choreografie */
  const veil = $('#veil');
  const liftVeil = () => { if (veil) veil.classList.add('is-lifted'); };

  if (motion) {
    const heroSplits = $$('#heroTitle .split');
    const heroWords = [].concat.apply([], heroSplits.map(splitWords));
    heroSplits.forEach((el) => el.classList.add('is-ready'));
    const intro = $$('.hero [data-intro]');
    gsap.set(heroWords, { yPercent: 110 });
    gsap.set(intro, { opacity: 0, y: 22 });
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
    heroTl
      .to(heroWords, { yPercent: 0, duration: 1.3, stagger: 0.06 }, 0.05)
      .to(intro, { opacity: 1, y: 0, duration: 1, stagger: 0.12, onComplete: () => intro.forEach((el) => el.classList.add('is-visible')) }, 0.5);
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.all([fontsReady, new Promise((r) => setTimeout(r, 380))]).then(() => { liftVeil(); heroTl.play(); ScrollTrigger.refresh(); });
    setTimeout(() => { liftVeil(); if (heroTl.progress() === 0 && !heroTl.isActive()) heroTl.play(); }, 3500);

    gsap.to('.hero-content', { yPercent: -12, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom 40%', scrub: 0.5 } });
    gsap.to('.hero-foot', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: '35% top', scrub: true } });

    const cinemaEnd = $('#kapitel-3') || $('#top');
    const hud = $('#printHud'), hudLayer = $('#hudLayer'), hudFill = $('#hudFill'), hudMeta = $('#hudMeta');
    let lastPhase = '';
    ScrollTrigger.create({
      trigger: '#top', start: 'top top', endTrigger: cinemaEnd, end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        window.NM.cinema = p;
        film.setProgress(p);
        const km = Math.max(0, KM_START * (1 - p));
        if (hudLayer) hudLayer.textContent = km.toFixed(1).replace('.', ',');
        if (hudFill) hudFill.style.transform = 'scaleX(' + p + ')';
        const phase = p < 0.85 ? 'Helgas Bulli · unterwegs zu dir' : 'Helgas Bulli · angekommen';
        if (hudMeta && phase !== lastPhase) { hudMeta.textContent = phase; lastPhase = phase; }
      },
    });
    ScrollTrigger.create({ trigger: '#top', start: '6% top', endTrigger: cinemaEnd, end: 'bottom 70%', onToggle: (s) => { if (hud) hud.classList.toggle('is-on', s.isActive); } });
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { window.NM.scroll = s.progress; } });

    const dim = $('#stageDim'), stage = $('#stage');
    ScrollTrigger.create({ trigger: '#catering', start: 'top bottom', end: 'top 25%', scrub: 0.4, onUpdate: (s) => { window.NM.dim = s.progress; if (dim) dim.style.opacity = String(s.progress * 0.85); } });
    ScrollTrigger.create({ trigger: '#catering', start: 'top top', onEnter: () => stage && stage.classList.add('is-parked'), onLeaveBack: () => stage && stage.classList.remove('is-parked') });

    $$('.chapter').forEach((ch) => {
      const title = $('.split', ch);
      const words = title ? splitWords(title) : [];
      if (title) title.classList.add('is-ready');
      const reveals = $$('.reveal', ch);
      gsap.set(words, { yPercent: 110 });
      gsap.set(reveals, { opacity: 0, y: 26 });
      gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 65%', end: 'top 15%', toggleActions: 'play none none reverse' }, defaults: { ease: 'power4.out' } })
        .to(words, { yPercent: 0, duration: 1.1, stagger: 0.05 }, 0)
        .to(reveals, { opacity: 1, y: 0, duration: 1, stagger: 0.1, onStart: () => reveals.forEach((r) => r.classList.add('is-visible')) }, 0.25);
      gsap.to($('.chapter-copy', ch), { opacity: 0, y: -30, ease: 'none', scrollTrigger: { trigger: ch, start: 'bottom 70%', end: 'bottom 30%', scrub: 0.5 } });
    });

    $$('.solid .split, .band .split').forEach((el) => {
      const words = splitWords(el);
      el.classList.add('is-ready');
      gsap.set(words, { yPercent: 110 });
      gsap.to(words, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('.solid .reveal, .band .reveal').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onStart: () => el.classList.add('is-visible') });
    });
    $$('[data-parallax]').forEach((el) => {
      const img = el.tagName === 'IMG' ? el : $('img', el);
      if (!img) return;
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      gsap.fromTo(img, { yPercent: -speed * 40 }, { yPercent: speed * 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
    gsap.fromTo('.footer-giant', { yPercent: 35 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });

    initGallery();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    liftVeil();
    $$('.reveal').forEach((el) => el.classList.add('is-visible'));
    $$('.split').forEach((el) => el.classList.add('is-ready'));
    $$('[data-intro]').forEach((el) => el.classList.add('is-visible'));
  }

  /* 5. Angebot — 3D-Galerie */
  function initGallery() {
    const gallery = $('#gallery'), track = $('#galleryTrack');
    if (!gallery || !track) return;
    const cards = $$('.product', track);
    if (!cards.length) return;
    let x = 0;
    const isMobile = () => window.innerWidth < 900;
    const cardCenter = (card) => {
      if (isMobile()) { const tr = track.getBoundingClientRect(); return tr.left + card.offsetLeft + card.offsetWidth / 2 - track.scrollLeft; }
      return gallery.getBoundingClientRect().left + x + card.offsetLeft + card.offsetWidth / 2;
    };
    const layout = () => {
      const mid = window.innerWidth / 2;
      const spread = isMobile() ? 0.9 : 0.62;
      cards.forEach((card) => {
        const a = Math.max(-1, Math.min(1, (cardCenter(card) - mid) / (window.innerWidth * spread)));
        const ab = Math.abs(a);
        card.style.transform = 'translateZ(' + (-ab * 240).toFixed(1) + 'px) rotateY(' + (-a * 26).toFixed(2) + 'deg) scale(' + (1 - ab * 0.1).toFixed(3) + ')';
        card.style.opacity = String(1 - ab * 0.3);
      });
    };
    const reset = () => cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; });
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -travel(), ease: 'none',
        scrollTrigger: {
          trigger: gallery, start: 'top top', end: () => '+=' + (travel() + window.innerHeight * 0.4),
          pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: () => { x = gsap.getProperty(track, 'x'); layout(); },
          onRefresh: () => { x = gsap.getProperty(track, 'x'); layout(); },
        },
      });
      layout();
      return () => { tween.kill(); x = 0; reset(); };
    });
    mm.add('(max-width: 899px)', () => {
      let ticking = false;
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; layout(); }); } };
      track.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      layout();
      return () => { track.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); reset(); };
    });
  }

  /* 6. Navigation, Cursor, Magnetik, Tilt */
  const nav = $('#siteNav');
  if (nav) {
    let lastY = window.scrollY, ticking = false;
    const update = () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 60);
      const menuOpen = nav.querySelector('.nav-links.open');
      if (!menuOpen && !prefersReduced) {
        if (y > lastY + 6 && y > 320) nav.classList.add('is-hidden');
        else if (y < lastY - 6) nav.classList.remove('is-hidden');
      }
      lastY = y; ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  (function mobileMenu() {
    const burger = $('#navBurger'), links = $('#navLinks'), backdrop = $('#navBackdrop');
    if (!burger || !links) return;
    const set = (open) => {
      links.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    };
    burger.addEventListener('click', () => set(!links.classList.contains('open')));
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    $$('a', links).forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && links.classList.contains('open')) set(false); });
  })();

  if (isIndex && finePointer && !prefersReduced && hasGSAP) {
    const cur = $('#cursor'), dot = $('#cursorDot');
    if (cur && dot) {
      html.classList.add('has-cursor');
      const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }, ring = { x: pos.x, y: pos.y };
      window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
      gsap.ticker.add(() => {
        ring.x += (pos.x - ring.x) * 0.16; ring.y += (pos.y - ring.y) * 0.16;
        cur.style.transform = 'translate(' + ring.x + 'px,' + ring.y + 'px) translate(-50%,-50%)';
        dot.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px) translate(-50%,-50%)';
      });
      const hoverSel = 'a, button, summary, input, select, textarea, label, .product-media';
      document.addEventListener('pointerover', (e) => { if (e.target.closest(hoverSel)) cur.classList.add('is-hover'); });
      document.addEventListener('pointerout', (e) => { if (e.target.closest(hoverSel)) cur.classList.remove('is-hover'); });
      const hide = () => { cur.classList.add('is-hidden'); dot.classList.add('is-hidden'); };
      const show = () => { cur.classList.remove('is-hidden'); dot.classList.remove('is-hidden'); };
      document.addEventListener('mouseleave', hide);
      document.addEventListener('mouseenter', show);
      window.addEventListener('blur', hide);
      window.addEventListener('focus', show);
    }
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * 0.28); yTo((e.clientY - (r.top + r.height / 2)) * 0.28); });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
    $$('.tilt').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power2.out' });
      const ry = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power2.out' });
      gsap.set(card, { transformPerspective: 1000 });
      card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); rx(((e.clientY - r.top) / r.height - 0.5) * -5); ry(((e.clientX - r.left) / r.width - 0.5) * 6); });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* 7. Anfrage — in der Vorschau öffnet der Versand eine vorausgefüllte E-Mail an info@omahelga.de.
        Im finalen Aufbau wird das Formular direkt an Postfach oder CRM angebunden. */
  const toastEl = $('#toast');
  let toastT = 0;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3600); }

  const form = $('#anfrageForm'), note = $('#anfrageNote');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const need = ['name', 'email'];
    for (const k of need) { if (!String(f.get(k) || '').trim()) { const el = form.querySelector('[name="' + k + '"]'); if (el) el.focus(); if (note) note.textContent = 'Bitte Name und E-Mail ausfüllen.'; return; } }
    if (!form.querySelector('[name="datenschutz"]').checked) { if (note) note.textContent = 'Bitte AGB und Datenschutz bestätigen.'; return; }
    const lines = [
      'Anrede: ' + (f.get('anrede') || '–'),
      'Name: ' + f.get('name'),
      'E-Mail: ' + f.get('email'),
      'Telefon: ' + (f.get('telefon') || '–'),
      'Datum der Veranstaltung: ' + (f.get('datum') || '–'),
      'Anlass: ' + (f.get('anlass') || '–'),
      'Gästezahl: ' + (f.get('gaeste') || '–'),
      'Ort: ' + (f.get('ort') || '–'),
      '',
      'Wünsche:',
      String(f.get('nachricht') || '–'),
    ];
    const href = 'mailto:info@omahelga.de?subject=' + encodeURIComponent('Catering-Anfrage: ' + (f.get('anlass') || 'Feier') + (f.get('datum') ? ' am ' + f.get('datum') : '')) + '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
    if (note) note.textContent = 'Dein E-Mail-Programm öffnet sich mit der vorausgefüllten Anfrage. In der finalen Website landet die Anfrage direkt im Postfach von Oma Helga.';
    toast('Anfrage vorbereitet — danke!');
  });
})();
