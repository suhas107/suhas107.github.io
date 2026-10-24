/* Suhas Nethi portfolio: curtain, smooth scroll, reveals, pinned gallery, reels. */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';

  root.classList.add('anim');

  /* ---------- hero intro (set before the curtain opens) ---------- */
  const heroBits = $$('.hero__eyebrow, .hero__tag, .hero__sub, .hero__cta, .quicklinks');
  if (hasGsap && !reduced) {
    gsap.set('.hero__name .word', { yPercent: 115 });
    gsap.set(heroBits, { opacity: 0, y: 26 });
    gsap.set('.hero__media video', { scale: 1.25, opacity: 0 });
  }
  const playHero = () => {
    if (!hasGsap || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.hero__media video', { scale: 1, opacity: 1, duration: 2.2, ease: 'power2.out' }, 0)
      .to('.hero__name .word', { yPercent: 0, duration: 1.3, stagger: .14 }, .15)
      .to(heroBits, { opacity: 1, y: 0, duration: 1, stagger: .09 }, .6);
  };

  /* ---------- curtain ---------- */
  const curtain = $('.curtain');
  let seen = false;
  try { seen = sessionStorage.getItem('sn-curtain') === '1'; sessionStorage.setItem('sn-curtain', '1'); } catch (e) {}
  const minWait = reduced ? 0 : (seen ? 350 : 1700);
  const started = performance.now();
  let opened = false;
  const openCurtain = () => {
    if (opened) return;
    opened = true;
    const wait = Math.max(0, minWait - (performance.now() - started));
    setTimeout(() => {
      curtain.style.animation = 'none';
      curtain.classList.add('is-open');
      setTimeout(playHero, 350);
      setTimeout(() => curtain.classList.add('is-gone'), 1400);
    }, wait);
  };
  const heroVideo = $('.hero__media video');
  if (reduced) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
  if (heroVideo.readyState >= 2) openCurtain();
  else { heroVideo.addEventListener('loadeddata', openCurtain, { once: true }); heroVideo.addEventListener('error', openCurtain, { once: true }); }
  setTimeout(openCurtain, 2600);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && hasST && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- nav + menu ---------- */
  const nav = $('.nav');
  const burger = $('.nav__burger');
  const closeMenu = () => {
    root.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    $('.menu').setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
  };
  burger.addEventListener('click', () => {
    const open = !root.classList.contains('menu-open');
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    $('.menu').setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > 500 && y > lastY && !root.classList.contains('menu-open'));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav__links a');
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionIO.observe(s));

  /* ---------- reveal on scroll ---------- */
  const groups = new Map();
  $$('[data-reveal]').forEach(el => {
    const list = groups.get(el.parentElement) || [];
    el.style.setProperty('--d', Math.min(list.length * 0.08, 0.48) + 's');
    list.push(el);
    groups.set(el.parentElement, list);
  });
  // A fully clipped element never reports as intersecting, so clip reveals watch their parent.
  const revealTargets = new Map();
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      revealTargets.get(en.target).classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('[data-reveal]').forEach(el => {
    const watch = el.dataset.reveal === 'clip' ? el.parentElement : el;
    revealTargets.set(watch, el);
    revealIO.observe(watch);
  });

  /* ---------- count-up stats ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1600;
      countIO.unobserve(el);
      if (reduced) return;
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- inline clips play only while on screen ---------- */
  if (!reduced) {
    const clipIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) en.target.play().catch(() => {});
        else en.target.pause();
      });
    }, { threshold: .25 });
    $$('.chapter__media video').forEach(v => clipIO.observe(v));
  }

  /* ---------- spotlight cursor ---------- */
  if (finePointer && !reduced) {
    const spot = $('.spotlight');
    let x = innerWidth * .7, y = innerHeight * .3, raf = 0;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        spot.style.setProperty('--x', x + 'px');
        spot.style.setProperty('--y', y + 'px');
        raf = 0;
      });
      root.classList.add('has-spot');
    }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('has-spot'));
  }

  /* ---------- tilt on project screenshots ---------- */
  if (finePointer && !reduced) {
    $$('.project__shot').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(1000px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- scroll-driven scenes ---------- */
  if (hasST && !reduced) {
    gsap.to('.hero__media video', {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__copy', {
      y: -80, opacity: .2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true }
    });

    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const strip = $('.reel-strip');
      const track = $('.reel-strip__track');
      strip.classList.add('is-pinned');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: strip, start: 'top top', end: () => '+=' + dist(),
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      return () => { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); gsap.set(track, { clearProps: 'x' }); strip.classList.remove('is-pinned'); };
    });

    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
