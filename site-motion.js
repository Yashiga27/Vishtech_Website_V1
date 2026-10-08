/* ============================================================
   VISHTECH — Sitewide motion polish
   Two small, safe, additive touches used on every page:
   1) A soft blue glow that follows the cursor (desktop only) —
      the same "futuristic" ambient light feel as the hero.
   2) A gentle parallax drift on the page-hero banner text as
      the visitor scrolls, so inner pages feel as alive as the
      homepage.

   Never touches the AI chat / mascot widget, and never runs on
   touch devices or for visitors who prefer reduced motion.
============================================================ */
(function () {
  "use strict";

  function init() {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    // --- 1) Cursor glow ---
    if (!reduceMotion && !isTouch) {
      var glow = document.createElement("div");
      glow.setAttribute("aria-hidden", "true");
      glow.style.cssText = [
        "position:fixed", "top:0", "left:0", "width:520px", "height:520px",
        "margin:-260px 0 0 -260px", "border-radius:50%", "pointer-events:none",
        "z-index:1", "opacity:0", "transition:opacity .4s ease",
        "background:radial-gradient(circle, rgba(52,211,240,.10) 0%, rgba(23,57,184,.06) 45%, transparent 72%)",
        "will-change:transform"
      ].join(";");
      document.body.appendChild(glow);

      var gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy, shown = false;
      window.addEventListener("mousemove", function (e) {
        gx = e.clientX; gy = e.clientY;
        if (!shown) { glow.style.opacity = "1"; shown = true; }
      }, { passive: true });

      function raf() {
        cx += (gx - cx) * 0.12;
        cy += (gy - cy) * 0.12;
        glow.style.transform = "translate(" + cx + "px," + cy + "px)";
        requestAnimationFrame(raf);
      }
      raf();
    }

    // --- 2) Page-hero parallax (every inner page) ---
    var pageHeroInner = document.querySelector(".page-hero__inner");
    if (!reduceMotion && pageHeroInner && window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.gsap.to(pageHeroInner, {
        y: 60, opacity: 0.35, ease: "none",
        scrollTrigger: {
          trigger: pageHeroInner.closest(".page-hero"),
          start: "top top",
          end: "bottom top",
          scrub: 0.6
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
