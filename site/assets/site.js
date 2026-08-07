
(() => {
  const ready = (fn) => document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);

  ready(() => {
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasLenis = typeof window.Lenis !== 'undefined';
    const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
    const hasSplitting = typeof window.Splitting !== 'undefined';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Même règle que le slug() du build, pour que ?city=Sainte-Thérèse trouve sa carte
    const slugify = (s) => (s || '').toString().toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Lenis smooth scroll
    let lenis = null;
    if (hasLenis && !reduceMotion) {
      lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
      if (hasGSAP) {
        window.gsap.ticker.add((time) => lenis.raf(time * 1000));
        window.gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }

    if (hasGSAP && hasST) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      if (lenis) lenis.on('scroll', window.ScrollTrigger.update);
    }
    window.__lenis = lenis;

    // Splitting on hero h1
    if (hasSplitting) {
      window.Splitting();
    }

    // Hero h1 char stagger — animate FROM (no initial-hide), so failure is invisible
    if (hasGSAP && !reduceMotion) {
      try {
        const heroH1 = document.querySelector('.hero__h1');
        if (heroH1 && heroH1.querySelector('.char')) {
          window.gsap.fromTo('.hero__h1 .char',
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1, ease: 'back.out(1.2)', stagger: 0.025, delay: 0.2, immediateRender: false }
          );
        }
      } catch (e) { /* fail silent — content stays visible */ }
    }

    // Scroll-triggered reveal — additive only, never hides
    if (hasGSAP && hasST && !reduceMotion) {
      try {
        window.gsap.utils.toArray('.reveal').forEach((el) => {
          window.gsap.fromTo(el,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', immediateRender: false,
              scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
          );
        });
      } catch (e) { /* fail silent */ }
    }

    // Sticky header scrolled state
    const header = document.querySelector('[data-header]');
    if (header) {
      const onScroll = () => {
        if (window.scrollY > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Drawer
    const drawer = document.querySelector('[data-drawer]');
    const drawerToggle = document.querySelector('[data-drawer-toggle]');
    const drawerClose = document.querySelector('[data-drawer-close]');
    const openDrawer = () => {
      if (!drawer) return;
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      drawerToggle?.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      if (!drawer) return;
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      drawerToggle?.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
      document.body.style.overflow = '';
    };
    drawerToggle?.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    drawer?.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

    // Carousel arrows
    document.querySelectorAll('[data-carousel]').forEach((carousel) => {
      const track = carousel.querySelector('.carousel__track');
      const prev = carousel.querySelector('[data-carousel-prev]');
      const next = carousel.querySelector('[data-carousel-next]');
      if (!track) return;
      const stepBy = () => {
        const card = track.querySelector(':scope > *');
        if (!card) return track.clientWidth * 0.8;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || '0');
        return card.getBoundingClientRect().width + gap;
      };
      prev?.addEventListener('click', () => track.scrollBy({ left: -stepBy(), behavior: 'smooth' }));
      next?.addEventListener('click', () => track.scrollBy({ left: stepBy(), behavior: 'smooth' }));
    });

    // ===== Property detail page =====
    const propPage = document.querySelector('[data-prop-page]');
    if (propPage) {
      const toggle = propPage.querySelector('[data-prop-toggle]');
      const mediaPane = propPage.querySelector('#media-pane');
      const mapPane = propPage.querySelector('#map-pane');
      const lat = parseFloat(propPage.dataset.lat);
      const lon = parseFloat(propPage.dataset.lon);
      let mapInited = false;
      let leafletMap = null;

      const initMap = (containerId) => {
        if (typeof window.L === 'undefined' || !isFinite(lat) || !isFinite(lon)) return;
        const el = document.getElementById(containerId);
        if (!el || el._inited) return;
        el._inited = true;
        const map = window.L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lon], 15);
        window.L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);
        const pinHtml = '<div class="prop-pin"><svg viewBox="0 0 24 24" width="36" height="36" fill="#2c4160" stroke="#FBF8F2" stroke-width="1.5"><path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#FBF8F2" stroke="none"/></svg></div>';
        const icon = window.L.divIcon({ html: pinHtml, className: 'prop-pin-wrap', iconSize: [36, 36], iconAnchor: [18, 34] });
        window.L.marker([lat, lon], { icon }).addTo(map);
        return map;
      };

      if (toggle) {
        const btns = toggle.querySelectorAll('button');
        btns.forEach(b => b.addEventListener('click', () => {
          if (b.getAttribute('aria-disabled') === 'true') return;
          const mode = b.dataset.mode;
          toggle.dataset.mode = mode;
          btns.forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === mode ? 'true' : 'false'));
          if (mediaPane && mapPane) {
            mediaPane.setAttribute('aria-hidden', mode === 'photos' ? 'false' : 'true');
            mapPane.setAttribute('aria-hidden', mode === 'map' ? 'false' : 'true');
          }
          if (mode === 'map' && !mapInited) {
            mapInited = true;
            leafletMap = initMap('leaflet-map');
          }
          if (mode === 'map' && leafletMap) {
            setTimeout(() => leafletMap.invalidateSize(), 60);
          }
        }));
      }

      // Lightbox
      const lb = document.querySelector('[data-lightbox]');
      const photos = (() => { try { return JSON.parse(propPage.dataset.photos || '[]'); } catch { return []; } })();
      let lbIdx = 0;
      const lbImg = lb?.querySelector('.lightbox__img');
      const lbCount = lb?.querySelector('.lightbox__count');
      const showAt = (i) => {
        if (!photos.length || !lbImg) return;
        lbIdx = (i + photos.length) % photos.length;
        lbImg.src = photos[lbIdx];
        if (lbCount) lbCount.textContent = (lbIdx + 1) + ' / ' + photos.length;
      };
      const openLb = (i) => {
        if (!lb) return;
        showAt(i || 0);
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
      };
      const closeLb = () => {
        if (!lb) return;
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
      };
      propPage.querySelectorAll('[data-open-lightbox]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openLb(parseInt(el.dataset.openLightbox, 10) || 0);
        });
      });
      lb?.querySelector('[data-lb-close]')?.addEventListener('click', closeLb);
      lb?.querySelector('[data-lb-prev]')?.addEventListener('click', () => showAt(lbIdx - 1));
      lb?.querySelector('[data-lb-next]')?.addEventListener('click', () => showAt(lbIdx + 1));
      lb?.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
      document.addEventListener('keydown', (e) => {
        if (!lb || lb.getAttribute('aria-hidden') !== 'false') return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') showAt(lbIdx - 1);
        if (e.key === 'ArrowRight') showAt(lbIdx + 1);
      });
      // Touch swipe
      let touchX = null;
      const stage = lb?.querySelector('.lightbox__stage');
      stage?.addEventListener('pointerdown', (e) => { touchX = e.clientX; });
      stage?.addEventListener('pointerup', (e) => {
        if (touchX === null) return;
        const dx = e.clientX - touchX;
        if (dx > 50) showAt(lbIdx - 1);
        else if (dx < -50) showAt(lbIdx + 1);
        touchX = null;
      });

      // Description collapsible
      propPage.querySelectorAll('[data-collapsible]').forEach((wrap) => {
        const btn = wrap.querySelector('.desc-wrap__toggle');
        btn?.addEventListener('click', () => {
          wrap.classList.toggle('expanded');
          btn.textContent = wrap.classList.contains('expanded') ? 'Réduire' : 'Lire la suite';
        });
      });

      // Amenities expand
      propPage.querySelectorAll('[data-amenities-toggle]').forEach((btn) => {
        const target = propPage.querySelector(btn.dataset.amenitiesToggle);
        btn.addEventListener('click', () => {
          if (!target) return;
          const isOpen = target.hasAttribute('open');
          if (isOpen) target.removeAttribute('open');
          else target.setAttribute('open', '');
          btn.textContent = isOpen ? btn.dataset.labelMore : btn.dataset.labelLess;
        });
      });

      // Mobile map modal
      const mapModal = document.querySelector('[data-map-modal]');
      let mapModalInited = false;
      let leafletMapModal = null;
      document.querySelectorAll('[data-open-map-modal]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (!mapModal) return;
          mapModal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          if (!mapModalInited) {
            mapModalInited = true;
            leafletMapModal = initMap('leaflet-map-modal');
          }
          if (leafletMapModal) setTimeout(() => leafletMapModal.invalidateSize(), 80);
        });
      });
      mapModal?.querySelector('[data-map-modal-close]')?.addEventListener('click', () => {
        mapModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }

    // ===== Homepage 2026 =====
    const hmHero = document.querySelector('[data-hm-hero]');
    if (hmHero && hasGSAP && !reduceMotion) {
      try {
        // Masked line reveal — animate FROM, so failure leaves content visible
        window.gsap.fromTo('.hm-line__in',
          { yPercent: 110 },
          { yPercent: 0, duration: 1.25, ease: 'power3.out', stagger: 0.12, delay: 0.15, immediateRender: false }
        );
        window.gsap.fromTo(['.hm-hero__eyebrow', '.hm-hero__bar'],
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: 0.65, immediateRender: false }
        );
        if (hasST) {
          const hmVideo = hmHero.querySelector('.hm-hero__video');
          if (hmVideo) {
            window.gsap.to(hmVideo, { yPercent: 12, scale: 1.06, ease: 'none',
              scrollTrigger: { trigger: hmHero, start: 'top top', end: 'bottom top', scrub: true } });
          }
          const hmInner = hmHero.querySelector('.hm-hero__inner');
          if (hmInner) {
            window.gsap.to(hmInner, { yPercent: -16, opacity: 0.25, ease: 'none',
              scrollTrigger: { trigger: hmHero, start: 'top top', end: 'bottom top', scrub: true } });
          }
        }
      } catch (e) { /* fail silent */ }
    }

    // Count-up metrics
    if (hasGSAP && hasST && !reduceMotion) {
      try {
        document.querySelectorAll('[data-count]').forEach((el) => {
          const target = parseFloat(el.dataset.count);
          if (!isFinite(target)) return;
          const pad = parseInt(el.dataset.pad || '0', 10);
          const obj = { v: 0 };
          window.gsap.to(obj, { v: target, duration: 1.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onUpdate: () => {
              const n = Math.round(obj.v);
              let s = n.toLocaleString('fr-CA');
              if (pad) { s = String(n); while (s.length < pad) s = '0' + s; }
              el.textContent = s;
            } });
        });
      } catch (e) { /* fail silent */ }
    }

    // Pinned horizontal property gallery (desktop only — native scroll below 1024px)
    const hmProps = document.querySelector('[data-hm-props]');
    const hmTrack = document.querySelector('[data-hm-props-track]');
    if (hmProps && hmTrack && hasGSAP && hasST && !reduceMotion && typeof window.gsap.matchMedia === 'function') {
      try {
        const hmMM = window.gsap.matchMedia();
        hmMM.add('(min-width: 1024px)', () => {
          const viewport = hmTrack.parentElement;
          const dist = () => Math.max(0, hmTrack.scrollWidth - viewport.clientWidth);
          const tween = window.gsap.to(hmTrack, { x: () => -dist(), ease: 'none',
            scrollTrigger: {
              trigger: hmProps, start: 'top top',
              end: () => '+=' + dist(),
              scrub: true, pin: true, anticipatePin: 1, invalidateOnRefresh: true
            } });
          return () => {
            if (tween.scrollTrigger) tween.scrollTrigger.kill();
            tween.kill();
            window.gsap.set(hmTrack, { clearProps: 'x' });
          };
        });
      } catch (e) { /* fail silent */ }
    }

    // Team image parallax
    const hmTeamImg = document.querySelector('[data-hm-parallax] img');
    if (hmTeamImg && hasGSAP && hasST && !reduceMotion && window.matchMedia('(min-width: 901px)').matches) {
      try {
        window.gsap.fromTo(hmTeamImg,
          { yPercent: -13 },
          { yPercent: 0, ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: hmTeamImg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }
        );
      } catch (e) { /* fail silent */ }
    }

    // Bannières de page — la photo glisse un peu plus lentement que la page.
    // La photo mesure 118 % de la hauteur du cadre : on ne fait que déplacer
    // le surplus, il n'y a jamais de bande vide.
    if (hasGSAP && hasST && !reduceMotion) {
      document.querySelectorAll('[data-parallax] img').forEach((img) => {
        try {
          window.gsap.fromTo(img,
            { yPercent: -15 },
            { yPercent: 0, ease: 'none', immediateRender: false,
              scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }
          );
        } catch (e) { /* fail silent */ }
      });
    }

    // Filtres de la liste de propriétés. Les boutons existaient déjà mais
    // n'étaient reliés à rien : ils ne filtraient rien du tout.
    const filterBar = document.querySelector('.filters');
    const propGrid = document.querySelector('.prop-grid');
    if (filterBar && propGrid) {
      const cards = Array.from(propGrid.querySelectorAll('.prop-card'));
      let emptyMsg = null;

      const apply = (value) => {
        let shown = 0;
        cards.forEach((card) => {
          const [kind, key] = value.split(':');
          const match = value === 'all' || card.dataset[kind === 'type' ? 'type' : 'city'] === key;
          card.hidden = !match;
          if (match) shown++;
        });
        if (!emptyMsg) {
          emptyMsg = document.createElement('p');
          emptyMsg.className = 'filters__empty';
          emptyMsg.textContent = 'Aucune propriété dans cette sélection pour le moment.';
          propGrid.insertAdjacentElement('afterend', emptyMsg);
        }
        emptyMsg.hidden = shown > 0;
      };

      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        filterBar.querySelectorAll('button').forEach((b) => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply(btn.dataset.filter);
        // Garder l'URL partageable : /nos-proprietes/?type=condo
        const [kind, key] = btn.dataset.filter.split(':');
        const url = new URL(location.href);
        url.searchParams.delete('type'); url.searchParams.delete('city');
        if (key) url.searchParams.set(kind, key);
        history.replaceState(null, '', url);
      });

      // Filtre initial depuis l'URL (les fiches lient vers ?city=…)
      const params = new URLSearchParams(location.search);
      const initial = params.get('type') ? 'type:' + params.get('type')
        : params.get('city') ? 'city:' + slugify(params.get('city'))
        : null;
      if (initial) {
        const btn = filterBar.querySelector('button[data-filter="' + initial + '"]');
        if (btn) btn.click();
      }
    }

    // Menu principal — soulignement qui se déploie depuis la gauche au survol
    document.querySelectorAll('.site-nav .nav-item, .site-nav .has-mega > a, .site-nav .has-sub > a').forEach((a) => {
      if (a.querySelector('.nav-underline')) return;
      const u = document.createElement('span');
      u.className = 'nav-underline';
      u.setAttribute('aria-hidden', 'true');
      a.appendChild(u);
    });
  });
})();
