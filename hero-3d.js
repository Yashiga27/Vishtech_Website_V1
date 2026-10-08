/* ============================================================
   VISHTECH — "Digital World" 3D ambient network
   A lightweight Three.js scene: a glowing wireframe core with
   floating, connected nodes that slowly rotate and drift with
   the cursor, fading as the user scrolls past the banner.

   Works two ways:
   - Homepage: renders into the existing #heroCanvas3D canvas
     inside #heroFlow.
   - Every other page: finds the first .page-hero banner and
     creates a canvas inside it automatically, so every page
     gets the same ambient "futuristic" look with no per-page
     markup changes.

   This file only ever touches the hero / page-hero banner. It
   never reads or modifies the AI chat / mascot widget.
   Fails silently (no console errors, nothing visible) if
   Three.js didn't load, WebGL isn't available, the visitor
   prefers reduced motion, or the screen is small — the banner
   still looks and works exactly as it would without this file.
============================================================ */
(function () {
  "use strict";

  function buildNetwork(container, canvas, opts) {
    if (typeof window.THREE === "undefined") return;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isSmall = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
    if (reduceMotion || isSmall) return;

    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) {
      return; // no WebGL — leave the banner exactly as it was
    }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 17;

    function size() {
      var w = container.clientWidth, h = container.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    var world = new THREE.Group();
    scene.add(world);

    var coreRadius = opts.coreRadius || 3.1;
    var core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(coreRadius, 1),
      new THREE.MeshBasicMaterial({ color: 0x34d3f0, wireframe: true, transparent: true, opacity: 0.32 })
    );
    world.add(core);

    var coreInner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(coreRadius * 0.48, 0),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, wireframe: true, transparent: true, opacity: 0.4 })
    );
    world.add(coreInner);

    function dotTexture() {
      var c = document.createElement("canvas");
      c.width = c.height = 64;
      var ctx = c.getContext("2d");
      var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.4, "rgba(120,190,255,0.8)");
      g.addColorStop(1, "rgba(120,190,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }

    var NODE_COUNT = opts.nodeCount || 46;
    var radius = opts.radius || 6.2;
    var nodePositions = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      var phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
      var theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
      var r = radius * (0.72 + Math.random() * 0.34);
      var x = r * Math.cos(theta) * Math.sin(phi);
      var y = r * Math.sin(theta) * Math.sin(phi);
      var z = r * Math.cos(phi);
      nodePositions.push(x, y, z);
    }
    var nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.Float32BufferAttribute(nodePositions, 3));
    var nodeMat = new THREE.PointsMaterial({
      size: 0.34, map: dotTexture(), transparent: true, depthWrite: false,
      opacity: 0.95, blending: THREE.AdditiveBlending
    });
    world.add(new THREE.Points(nodeGeo, nodeMat));

    var lineVerts = [];
    var maxDist = radius * 0.62;
    for (var a = 0; a < NODE_COUNT; a++) {
      var ax = nodePositions[a * 3], ay = nodePositions[a * 3 + 1], az = nodePositions[a * 3 + 2];
      var linked = 0;
      for (var b = a + 1; b < NODE_COUNT && linked < 2; b++) {
        var bx = nodePositions[b * 3], by = nodePositions[b * 3 + 1], bz = nodePositions[b * 3 + 2];
        var d = Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by) + (az - bz) * (az - bz));
        if (d < maxDist) { lineVerts.push(ax, ay, az, bx, by, bz); linked++; }
      }
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x1739b8, transparent: true, opacity: 0.28 });
    world.add(new THREE.LineSegments(lineGeo, lineMat));

    world.position.y = opts.offsetY || 0;
    world.rotation.x = 0.25;

    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    window.addEventListener("mousemove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    canvas.classList.add("is-ready");
    function updateScrollFade() {
      var rect = container.getBoundingClientRect();
      var visible = Math.max(0, Math.min(1, rect.bottom / (window.innerHeight * 0.9)));
      canvas.style.opacity = visible.toFixed(3);
    }
    window.addEventListener("scroll", updateScrollFade, { passive: true });

    var clock = new THREE.Clock();
    function tick() {
      var t = clock.getElapsedTime();
      world.rotation.y = t * 0.09;
      world.rotation.x = 0.25 + Math.sin(t * 0.15) * 0.05;
      targetX += (mouseY * 0.25 - targetX) * 0.04;
      targetY += (mouseX * 0.35 - targetY) * 0.04;
      camera.position.x = targetY;
      camera.position.y = -targetX;
      camera.lookAt(world.position);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }

    size();
    updateScrollFade();
    window.addEventListener("resize", size);
    tick();
  }

  function init() {
    // Homepage hero — fixed markup already in index.html
    var heroFlow = document.getElementById("heroFlow");
    var heroCanvas = document.getElementById("heroCanvas3D");
    if (heroFlow && heroCanvas) {
      buildNetwork(heroFlow, heroCanvas, { nodeCount: 46, radius: 6.2, coreRadius: 3.1, offsetY: 0.4 });
      return;
    }

    // Every other page — auto-inject a canvas into the page banner
    var pageHero = document.querySelector(".page-hero");
    if (pageHero) {
      var canvas = document.createElement("canvas");
      canvas.className = "hero__canvas-3d page-hero__canvas-3d";
      canvas.setAttribute("aria-hidden", "true");
      pageHero.insertBefore(canvas, pageHero.firstChild);
      buildNetwork(pageHero, canvas, { nodeCount: 30, radius: 5.2, coreRadius: 2.4, offsetY: 0 });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
