/* ============================================================
   VISHTECH — Hero "Digital Flow" motion (GSAP + ScrollTrigger)
   1) Entrance animation for the hero copy/device on load.
   2) A gentle floating loop for the badge chips.
   3) A scroll-scrubbed exit: as the visitor scrolls past the
      hero, the headline/CTAs drift and fade, and the floating
      device "falls" down and away into the next section,
      badges scattering with it — so the hero visibly hands off
      to the rest of the page instead of just cutting away.

   Only ever touches elements inside #heroFlow. Never reads or
   modifies the AI chat / mascot widget.
   Falls back to a plain, fully visible, static hero if GSAP
   (or its ScrollTrigger plugin) didn't load, or the visitor
   prefers reduced motion.
============================================================ */
(function () {
  "use strict";

  function init() {
    var hero = document.getElementById("heroFlow");
    if (!hero) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var revealEls = hero.querySelectorAll("[data-hero-reveal]");
    var badges = hero.querySelectorAll(".hero__badge");
    var device = document.getElementById("heroDevice");

    var gsap = window.gsap;
    if (!gsap || reduceMotion) {
      revealEls.forEach(function (el) { el.style.opacity = 1; });
      return;
    }

    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    gsap.set(revealEls, { opacity: 0, y: 26 });
    gsap.to(revealEls, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
      stagger: 0.12, delay: 0.15
    });

    if (device) {
      gsap.fromTo(device,
        { opacity: 0, y: 40, rotateX: 8, rotateY: -10, scale: 0.94 },
        { opacity: 1, y: 0, rotateX: 8, rotateY: -10, scale: 1, duration: 1.1, ease: "power3.out", delay: 0.55 }
      );
      gsap.to(device, {
        y: -14, duration: 3.2, ease: "sine.inOut",
        repeat: -1, yoyo: true, delay: 1.6
      });
    }

    badges.forEach(function (b, i) {
      gsap.set(b, { opacity: 0, scale: 0.8 });
      gsap.to(b, {
        opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)",
        delay: 1 + i * 0.14
      });
      gsap.to(b, {
        y: (i % 2 === 0 ? -12 : 12), duration: 2.6 + i * 0.3, ease: "sine.inOut",
        repeat: -1, yoyo: true, delay: 1.6 + i * 0.2
      });
    });

    // --- Scroll-scrubbed exit: the device "falls" into the next section ---
    if (window.ScrollTrigger) {
      var copyEls = hero.querySelectorAll(".hero__flow-inner > .tagline, .hero__flow-inner > h1, .hero__flow-inner > p, .hero__flow-inner > .hero__actions");

      var exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.6
        }
      });

      exitTl.to(copyEls, { opacity: 0, y: -60, stagger: 0.05, ease: "none" }, 0);

      if (device) {
        exitTl.to(device, { y: 340, rotateX: -18, rotateZ: 4, scale: 0.82, opacity: 0, ease: "none" }, 0.05);
      }
      badges.forEach(function (b, i) {
        exitTl.to(b, {
          y: 260 + i * 30,
          x: (i % 2 === 0 ? -60 : 60),
          opacity: 0,
          rotate: (i % 2 === 0 ? -20 : 20),
          ease: "none"
        }, 0.05 + i * 0.02);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
