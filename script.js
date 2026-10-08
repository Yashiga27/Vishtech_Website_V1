/* =========================================================
   VISHTECH MX SDN BHD — script.js
   Vanilla JS, no dependencies.
========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------
     1. PRELOADER
  --------------------------------------------------- */
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => { if (preloader) preloader.classList.add('is-hidden'); };
  window.addEventListener('load', () => setTimeout(hidePreloader, 250));
  setTimeout(hidePreloader, 2500); // safety net

  /* ---------------------------------------------------
     2. NAVIGATION — scroll state, mobile drawer, dropdowns
  --------------------------------------------------- */
  const siteNav   = document.getElementById('siteNav');
  const navLinks  = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');
  const navClose  = document.getElementById('navClose');

  function updateNavScrollState(){
    if (!siteNav) return;
    siteNav.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  updateNavScrollState();
  window.addEventListener('scroll', updateNavScrollState, { passive: true });

  // dimmed backdrop behind the mobile drawer
  let navScrim = document.querySelector('.nav-scrim');
  if (!navScrim && navLinks){
    navScrim = document.createElement('div');
    navScrim.className = 'nav-scrim';
    document.body.appendChild(navScrim);
  }

  const openNav  = () => {
    navLinks.classList.add('is-open');
    navToggle.setAttribute('aria-expanded','true');
    siteNav.classList.add('is-nav-open');
    if (navScrim) navScrim.classList.add('is-open');
    document.body.classList.add('is-nav-locked');
  };
  const closeNav = () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded','false');
    siteNav.classList.remove('is-nav-open');
    if (navScrim) navScrim.classList.remove('is-open');
    document.body.classList.remove('is-nav-locked');
  };
  if (navToggle) navToggle.addEventListener('click', openNav);
  if (navClose)  navClose.addEventListener('click', closeNav);
  if (navScrim)  navScrim.addEventListener('click', closeNav);
  if (navLinks)  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1024) closeNav(); });

  // Mega-menu accordions on mobile
  document.querySelectorAll('.nav-drop__trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth > 1024) return;
      e.preventDefault();
      trigger.parentElement.classList.toggle('is-open');
    });
  });

  /* ---------------------------------------------------
     3. LANGUAGE TOGGLE — single icon button, EN / BM
  --------------------------------------------------- */
  (function(){
    const btn = document.getElementById('langToggle');
    if (!btn) return;

    const codeEl = btn.querySelector('.lang-toggle__code');
    const nodes = document.querySelectorAll('[data-bm]');
    nodes.forEach(el => { if (!el.dataset.en) el.dataset.en = el.innerHTML; });

    function applyLang(lang){
      nodes.forEach(el => { el.innerHTML = (lang === 'bm') ? el.dataset.bm : el.dataset.en; });
      document.documentElement.lang = (lang === 'bm') ? 'ms' : 'en';
      btn.dataset.langCurrent = lang;
      if (codeEl) codeEl.textContent = lang === 'bm' ? 'BM' : 'EN';
      btn.setAttribute('aria-label', lang === 'bm' ? 'Switch to English' : 'Tukar ke Bahasa Malaysia');
      try { localStorage.setItem('vishtech-lang', lang); } catch(e){}
    }

    let saved = 'en';
    try { saved = localStorage.getItem('vishtech-lang') || 'en'; } catch(e){}
    applyLang(saved);

    btn.addEventListener('click', () => {
      applyLang(btn.dataset.langCurrent === 'en' ? 'bm' : 'en');
    });
  })();

  /* ---------------------------------------------------
     4. HERO BANNER SLIDER
  --------------------------------------------------- */
  (function(){
    const slides = Array.from(document.querySelectorAll('.hero__slide'));
    if (slides.length < 2) return;

    const dotsWrap = document.getElementById('heroDots');
    const prevBtn  = document.getElementById('heroPrev');
    const nextBtn  = document.getElementById('heroNext');
    let index = 0, timer = null;

    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(d);
      return d;
    });

    function go(i){
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
      dots.forEach((d, n) => d.classList.toggle('is-active', n === index));
    }
    function restart(){
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => go(index + 1), 6000);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { go(index - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { go(index + 1); restart(); });

    go(0);
    restart();
  })();

  /* ---------------------------------------------------
     5. SCROLL REVEAL
  --------------------------------------------------- */
  if (!reduceMotion && 'IntersectionObserver' in window){
    const revealTargets = document.querySelectorAll('[data-reveal-fade], [data-stagger]');
    revealTargets.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity .6s cubic-bezier(.16,.8,.24,1), transform .6s cubic-bezier(.16,.8,.24,1)';
    });

    const groups = new Map();
    revealTargets.forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = groups.get(entry.target.parentElement) || [entry.target];
        const i = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, Math.max(0, i) * 80);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealTargets.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------
     6. SERVICES SLIDER — paginated cards
  --------------------------------------------------- */
  (function(){
    const track = document.getElementById('servicesTrack');
    const viewport = track ? track.parentElement : null;
    if (!track || !viewport) return;

    const cards   = Array.from(track.children);
    const prevBtn = document.getElementById('servicesPrev');
    const nextBtn = document.getElementById('servicesNext');
    const dotsWrap= document.getElementById('servicesDots');
    const gap = 22;
    let perView = 3, page = 0;

    const getPerView = () => {
      const w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 1000) return 2;
      return 3;
    };
    const totalPages = () => Math.max(1, Math.ceil(cards.length / perView));

    function layout(){
      const vw = viewport.getBoundingClientRect().width;
      const cardWidth = (vw - (perView - 1) * gap) / perView;
      cards.forEach(c => { c.style.flex = `0 0 ${cardWidth}px`; });
      track.style.transform = `translateX(-${page * (vw + gap)}px)`;
    }
    function buildDots(){
      dotsWrap.innerHTML = '';
      for (let i = 0; i < totalPages(); i++){
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'services-section__dot';
        dot.setAttribute('aria-label', 'Go to services page ' + (i + 1));
        dot.addEventListener('click', () => { page = i; refresh(); });
        dotsWrap.appendChild(dot);
      }
    }
    function updateState(){
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('is-active', i === page));
      prevBtn.disabled = page === 0;
      nextBtn.disabled = page >= totalPages() - 1;
    }
    function refresh(){
      if (page > totalPages() - 1) page = totalPages() - 1;
      layout(); updateState();
    }
    function init(){
      const next = getPerView();
      if (next !== perView){ perView = next; page = 0; buildDots(); }
      refresh();
    }

    prevBtn.addEventListener('click', () => { if (page > 0){ page--; refresh(); } });
    nextBtn.addEventListener('click', () => { if (page < totalPages() - 1){ page++; refresh(); } });
    window.addEventListener('resize', init);

    buildDots();
    init();
  })();

  /* ---------------------------------------------------
     7. STAT COUNTERS
  --------------------------------------------------- */
  (function(){
    const nums = document.querySelectorAll('.stats-section__num');
    if (!nums.length) return;

    function animateCount(el){
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const start = performance.now();

      if (reduceMotion){ el.textContent = target + suffix; return; }

      (function tick(now){
        const p = Math.min(1, ((now || performance.now()) - start) / duration);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }

    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting){ animateCount(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      nums.forEach(el => io.observe(el));
    } else {
      nums.forEach(animateCount);
    }
  })();

  /* ---------------------------------------------------
     8. BACK TO TOP
  --------------------------------------------------- */
  const toTop = document.getElementById('toTop');
  if (toTop){
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('is-visible', window.scrollY > 500);
    }, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------------------------------------------------
     9. CONTACT FORM
        No backend is wired up. Point the <form> at your
        mailer/API, or swap the block below for a fetch().
  --------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const note = document.getElementById('contactFormNote');
  if (contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const honeypot = contactForm.querySelector('#cfWebsite');
      if (honeypot && honeypot.value) return; // silently drop bots

      const notRobot = contactForm.querySelector('#cfNotRobot');
      if (notRobot && !notRobot.checked){
        note.textContent = 'Please confirm the "I\'m not a robot" checkbox before sending.';
        note.className = 'contact-form__note is-error';
        return;
      }

      note.textContent = 'Thanks — your message is ready to send. Connect this form to your email or API to go live.';
      note.className = 'contact-form__note is-success';
      contactForm.reset();
    });
  }

  /* ---------------------------------------------------
     10. SERVICES TABS — show one service section at a time
  --------------------------------------------------- */
  (function(){
    const blocks = Array.from(document.querySelectorAll('.svc-block[id]'));
    const rail = document.querySelector('.svc-rail');
    if (!blocks.length || !rail) return;
    const railLinks = Array.from(rail.querySelectorAll('a'));

    function activate(id, scroll){
      const target = blocks.find(b => b.id === id) || blocks[0];
      blocks.forEach(b => b.classList.toggle('is-active', b === target));
      railLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + target.id));
      if (scroll){
        const y = target.getBoundingClientRect().top + window.scrollY - (rail.offsetHeight + 76);
        window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }

    railLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        history.replaceState(null, '', '#' + id);
        activate(id, true);
      });
    });

    window.addEventListener('hashchange', () => activate(location.hash.slice(1), true));

    if (location.hash) {
      // Arriving here with a hash (e.g. from a nav link on another page) — show the
      // right block AND scroll to it, once the section has laid itself out.
      activate(location.hash.slice(1), false);
      requestAnimationFrame(() => requestAnimationFrame(() => activate(location.hash.slice(1), true)));
    } else {
      activate(blocks[0].id, false);
    }
  })();

  /* ---------------------------------------------------
     11. AI CHAT WIDGET
        Front-end only: canned/keyword replies, no server.
        To wire up a real AI backend later, replace the
        getReply() function with a fetch() call to your API.
  --------------------------------------------------- */
  (function(){
    const toggle = document.getElementById('aiChatToggle');
    const panel  = document.getElementById('aiChatPanel');
    const closeBtn = document.getElementById('aiChatClose');
    const body   = document.getElementById('aiChatBody');
    const form   = document.getElementById('aiChatForm');
    const input  = document.getElementById('aiChatInput');
    const quick  = document.getElementById('aiChatQuick');
    if (!toggle || !panel || !form) return;

    let greeted = false;

    function scrollToEnd(){ body.scrollTop = body.scrollHeight; }

    function addMsg(text, who){
      const div = document.createElement('div');
      div.className = 'ai-chat__msg ai-chat__msg--' + who;
      div.textContent = text;
      body.appendChild(div);
      scrollToEnd();
    }

    function openPanel(){
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (!greeted){
        greeted = true;
        addMsg("Hi! I'm the VISHTECH assistant. Ask me about our services, pricing packages, or how to reach the team \u2014 or tap a quick question below.", 'bot');
      }
      input && input.focus();
    }
    function closePanel(){
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      panel.classList.contains('is-open') ? closePanel() : openPanel();
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    const KB = [
      { k: ['price','pricing','cost','package','rm','budget','quote'], a: "We have three web design packages \u2014 Econo (from RM2,400), Premium (from RM4,800) and Prestige (from RM8,800). Every package includes CMS, hosting, a free domain and corporate email. Check the Services page for the full comparison." },
      { k: ['service','services','what do you do','offer'], a: "We handle web design, eCommerce, mobile apps, corporate branding, digital marketing (SEO, SMM, paid ads), domains, hosting and ongoing maintenance \u2014 all delivered in-house. See the Services page for details." },
      { k: ['contact','call','phone','email','reach','talk to','human','agent'], a: "You can reach our team at +6016-5541 233 / +606-3171 287, email sales@vishtech.com.my, or use the Contact Us page to send your details \u2014 we'll get back with a free quote." },
      { k: ['hour','open','time','office'], a: "Our in-house team is on hand during regular Malaysian business hours. Send us a message anytime and we'll reply as soon as we're back online." },
      { k: ['portfolio','work','example','client'], a: "Take a look at the Portfolio page for recent projects, including KTMB MMC Cargo, Tanjung Bruas Port and Dominant Opto Technologies." },
      { k: ['hosting','domain'], a: "We offer TLD/MYNIC domain registration, shared hosting, dedicated servers and hosting reseller plans \u2014 see the Hosting & Domain sections on our Services page." },
      { k: ['whatsapp'], a: "Tap the \"Contact WhatsApp\" option below any time \u2014 that goes straight to our team." },
      { k: ['thank','thanks'], a: "You're welcome! Anything else I can help with?" },
      { k: ['hi','hello','hey'], a: "Hello! How can I help \u2014 services, pricing, or getting in touch with the team?" },
    ];

    function getReply(msg){
      const m = msg.toLowerCase();
      for (const row of KB){
        if (row.k.some(kw => m.includes(kw))) return row.a;
      }
      return "Thanks for the message! For anything specific like this, it's best to talk to our team directly \u2014 tap \"Contact WhatsApp\" below or visit the Contact Us page and we'll follow up personally.";
    }

    function send(text){
      text = (text || '').trim();
      if (!text) return;
      addMsg(text, 'user');
      if (input) input.value = '';
      setTimeout(() => addMsg(getReply(text), 'bot'), 450);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      send(input ? input.value : '');
    });

    const WA_LINK = 'https://wa.me/601655412330';

    if (quick){
      quick.querySelectorAll('button').forEach(btn => {
        if (btn.hasAttribute('data-wa')){
          btn.addEventListener('click', () => {
            addMsg(btn.textContent, 'user');
            setTimeout(() => {
              addMsg("Opening WhatsApp now \u2014 you'll be chatting with our team directly.", 'bot');
              window.open(WA_LINK, '_blank', 'noopener');
            }, 350);
          });
        } else {
          btn.addEventListener('click', () => send(btn.textContent));
        }
      });
    }
  })();

  /* ---------------------------------------------------
     MASCOT — live background removal for avatar.mp4
     Keys out the near-white/grey backing of the video so
     only the character renders, on a transparent canvas.
  --------------------------------------------------- */
  (() => {
    const canvas   = document.getElementById('mascotCanvas');
    const video    = document.getElementById('mascotVideo');
    const fallback = document.getElementById('mascotFallback');
    if (!canvas || !video) return;

    function useFallback(){
      canvas.style.display = 'none';
      if (fallback) fallback.style.display = 'block';
    }

    // If the video file 404s or otherwise fails, show a static
    // image instead of leaving the widget blank.
    video.addEventListener('error', useFallback);
    setTimeout(() => { if (video.readyState === 0) useFallback(); }, 4000);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const SIZE = 320;
    canvas.width = SIZE;
    canvas.height = SIZE;

    let running = true;

    function draw(){
      if (running && video.readyState >= 2){
        ctx.drawImage(video, 0, 0, SIZE, SIZE);
        const frame = ctx.getImageData(0, 0, SIZE, SIZE);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4){
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          // Backing is a near-white/grey, low-saturation colour —
          // keep anything with real colour or that's clearly darker.
          if (max > 200 && (max - min) < 18){
            d[i + 3] = 0;
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
      requestAnimationFrame(draw);
    }

    video.addEventListener('loadeddata', () => requestAnimationFrame(draw));
    video.play().catch(() => {});

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) video.play().catch(() => {});
    });
  })();

  /* ---------------------------------------------------
     WHAT WE DO — white spotlight follows the cursor
     over the video background
  --------------------------------------------------- */
  (() => {
    const section = document.getElementById('what-we-do');
    if (!section || reduceMotion) return;
    section.addEventListener('pointermove', (e) => {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      section.style.setProperty('--mx', x + '%');
      section.style.setProperty('--my', y + '%');
    });
  })();

});
/* =========================================================
   VISHTECH MX — Hot Deals "poster stack" carousel
   ---------------------------------------------------------
   Drives the effect seen in the reference clip: whichever
   card sits closest to the centre of the track is scaled up,
   brightened and wrapped in its own coloured glow ring; the
   further a card drifts from centre, the smaller / dimmer it
   gets. Everything is computed from real scroll position, so
   it tracks a mouse drag or a touch swipe identically — no
   separate "modes" to keep in sync.

   The slider also advances itself on a timer (no prev/next
   buttons needed). Autoplay pauses the moment someone touches
   it — hovers, drags, or swipes — and quietly resumes a few
   seconds after they let go.
========================================================= */
(function () {
  var poster = document.getElementById('dealsPoster');
  if (!poster) return;

  var track = document.getElementById('dealsPosterTrack');
  var cards = Array.prototype.slice.call(track.querySelectorAll('.deal-poster'));
  var dotsWrap = document.getElementById('dealsPosterDots');
  if (!cards.length) return;

  /* ---- build the dot indicators ---- */
  var dots = cards.map(function (card, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to ' + (card.getAttribute('data-title') || 'deal ' + (i + 1)));
    b.addEventListener('click', function () {
      pauseAutoplay();
      scrollToCard(i);
      scheduleResume();
    });
    dotsWrap.appendChild(b);
    return b;
  });

  /* ---- core: measure every card's distance from the track centre ---- */
  var ticking = false;

  function update() {
    ticking = false;
    var trackRect = track.getBoundingClientRect();
    var centerX = trackRect.left + trackRect.width / 2;
    var closestIndex = 0;
    var closestDist = Infinity;

    cards.forEach(function (card, i) {
      var r = card.getBoundingClientRect();
      var cardCenter = r.left + r.width / 2;
      var delta = Math.abs(cardCenter - centerX);
      var normalized = delta / (r.width + 22); /* 22 = track gap */
      card.style.setProperty('--dist', normalized.toFixed(3));

      if (delta < closestDist) {
        closestDist = delta;
        closestIndex = i;
      }
    });

    cards.forEach(function (card, i) {
      card.classList.toggle('is-active', i === closestIndex);
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === closestIndex);
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  track.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---- scroll a given card to the centre ---- */
  function scrollToCard(i) {
    var card = cards[i];
    if (!card) return;
    var trackRect = track.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var offset = (cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2);
    track.scrollTo({ left: track.scrollLeft + offset, behavior: 'smooth' });
  }

  function closestIndexNow() {
    var trackRect = track.getBoundingClientRect();
    var centerX = trackRect.left + trackRect.width / 2;
    var best = 0, bestDist = Infinity;
    cards.forEach(function (card, i) {
      var r = card.getBoundingClientRect();
      var d = Math.abs((r.left + r.width / 2) - centerX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  /* ---- autoplay: advance to the next card on a timer, looping at the end ---- */
  var AUTOPLAY_MS = 3200;
  var RESUME_AFTER_MS = 4000;
  var autoplayTimer = null;
  var resumeTimer = null;

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(function () {
      var next = (closestIndexNow() + 1) % cards.length;
      scrollToCard(next);
    }, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }
  function pauseAutoplay() {
    stopAutoplay();
    if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
  }
  function scheduleResume() {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAutoplay, RESUME_AFTER_MS);
  }

  /* pause on hover/focus so it never fights someone reading a card */
  poster.addEventListener('mouseenter', pauseAutoplay);
  poster.addEventListener('mouseleave', scheduleResume);
  poster.addEventListener('focusin', pauseAutoplay);
  poster.addEventListener('focusout', scheduleResume);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAutoplay(); else scheduleResume();
  });

  /* ---- desktop mouse drag-to-scroll (touch already works natively) ---- */
  var isDown = false, startX = 0, startScroll = 0, moved = false;

  track.addEventListener('pointerdown', function (e) {
    pauseAutoplay();
    if (e.pointerType === 'touch') return; /* let native touch scrolling handle it */
    isDown = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', function (e) {
    if (!isDown) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
    onScroll();
  });

  function endDrag() {
    if (isDown) {
      isDown = false;
      track.classList.remove('is-dragging');
      /* settle on the nearest card once released */
      scrollToCard(closestIndexNow());
    }
    scheduleResume();
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointerleave', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('touchend', scheduleResume, { passive: true });

  /* prevent the trailing click-through after a real drag */
  track.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);

  /* ---- initial paint + settle the middle card into view, then start autoplay ---- */
  requestAnimationFrame(function () {
    update();
    scrollToCard(Math.floor(cards.length / 2));
    requestAnimationFrame(update);
    startAutoplay();
  });
})();
