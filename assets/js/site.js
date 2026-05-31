/* Swarag Thaikkandi — site interactions
   Theme · mobile nav · scroll reveal · active nav · progress · back-to-top
   · pointer light · brain dynamics field */
(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.setAttribute("data-theme", "light");
  }

  function bindThemeToggle() {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- Mobile nav ---------- */
  function bindNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  function bindHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Scroll progress + back-to-top ---------- */
  function bindProgress() {
    var bar = document.querySelector(".scroll-progress");
    var toTop = document.querySelector(".to-top");
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar) bar.style.width = pct + "%";
      if (toTop) toTop.classList.toggle("show", h.scrollTop > 500);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  function bindReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Active nav (scroll spy) ---------- */
  function bindScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav a[href*="#"]')
    );
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").split("#")[1];
      if (id && document.getElementById(id)) map[id] = a;
    });
    var sections = Object.keys(map).map(function (id) {
      return document.getElementById(id);
    });
    if (!sections.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("active"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Pointer-following light (hero glow + card sheen) ---------- */
  function bindPointerLight() {
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
    var hero = document.querySelector(".hero");
    var glow = document.querySelector(".hero-glow");
    if (hero && glow) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        glow.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        glow.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    }
    var cards = document.querySelectorAll(".card, .contact-card, .post-card");
    cards.forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        c.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ---------- Brain dynamics field ----------
     Nodes sampled inside a brain silhouette, linked into a graph.
     Activation pulses travel the edges = dynamic brain activity.
     Colour blends teal -> amber across the cortex.                    */
  function brainField() {
    var canvas = document.querySelector(".hero-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var w = 0, h = 0, S = 0, cx = 0, cy = 0, tms = 0;
    var nodes = [], edges = [], pulses = [], raf = null, running = false;

    // brain = union of overlapping lumps (side profile, bilobed cortex)
    var LUMPS = [
      [-0.05, -0.02, 0.62],
      [-0.55, -0.12, 0.40],
      [-0.28, -0.42, 0.38],
      [ 0.12, -0.46, 0.40],
      [ 0.50, -0.20, 0.40],
      [ 0.55,  0.12, 0.36],
      [ 0.20,  0.32, 0.40],
      [-0.20,  0.34, 0.40],
      [-0.55,  0.20, 0.36],
      [-0.74,  0.36, 0.22],   // cerebellum
      [-0.60,  0.60, 0.13]    // brainstem
    ];

    function inBrain(nx, ny) {
      for (var i = 0; i < LUMPS.length; i++) {
        var dx = nx - LUMPS[i][0], dy = ny - LUMPS[i][1];
        if (dx * dx + dy * dy < LUMPS[i][2] * LUMPS[i][2]) {
          if (Math.abs(nx) < 0.045 && ny < -0.05) return false; // midline fissure
          return true;
        }
      }
      return false;
    }

    // teal (121,214,196) -> amber (224,147,95)
    function tint(t, a) {
      var r = Math.round(121 + 103 * t);
      var g = Math.round(214 - 67 * t);
      var b = Math.round(196 - 101 * t);
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    function px(n) { return cx + n.nx * S + Math.sin(tms * 0.0011 + n.ph) * n.amp; }
    function py(n) { return cy + n.ny * S + Math.cos(tms * 0.0013 + n.ph) * n.amp; }

    function build() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = Math.min(w, h) * 0.46;
      cx = w * 0.5;
      cy = h * 0.47;

      var target = Math.round(Math.min(150, Math.max(70, (S * S) / 380)));
      nodes = [];
      var tries = 0;
      while (nodes.length < target && tries < target * 80) {
        tries++;
        var nx = Math.random() * 2.2 - 1.1;
        var ny = Math.random() * 2.0 - 1.0;
        if (!inBrain(nx, ny)) continue;
        nodes.push({
          nx: nx, ny: ny,
          t: Math.min(1, Math.max(0, (nx + 1) / 2)),
          ph: Math.random() * 6.2832,
          amp: 2 + Math.random() * 3
        });
      }

      edges = [];
      var R = 0.30, R2 = R * R;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].nx - nodes[j].nx, dy = nodes[i].ny - nodes[j].ny;
          var d2 = dx * dx + dy * dy;
          if (d2 < R2) edges.push({ a: i, b: j, w: 1 - Math.sqrt(d2) / R });
        }
      }

      pulses = [];
      var want = Math.min(28, Math.round(edges.length / 12));
      for (var k = 0; k < want && edges.length; k++) {
        pulses.push({
          e: (Math.random() * edges.length) | 0,
          t: Math.random(),
          sp: 0.004 + Math.random() * 0.011
        });
      }
    }

    function render(animate) {
      ctx.clearRect(0, 0, w, h);
      var k, e, A, B, ax, ay, bx, by;

      for (k = 0; k < edges.length; k++) {
        e = edges[k]; A = nodes[e.a]; B = nodes[e.b];
        ax = px(A); ay = py(A); bx = px(B); by = py(B);
        ctx.strokeStyle = tint((A.t + B.t) / 2, 0.13 * e.w + 0.05);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      for (k = 0; k < pulses.length; k++) {
        var pu = pulses[k];
        e = edges[pu.e];
        if (!e) { pulses.splice(k, 1); k--; continue; }
        A = nodes[e.a]; B = nodes[e.b];
        ax = px(A); ay = py(A); bx = px(B); by = py(B);
        var x = ax + (bx - ax) * pu.t, y = ay + (by - ay) * pu.t;
        var c = tint(A.t + (B.t - A.t) * pu.t, 0.95);
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, 6.2832);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (animate) {
          pu.t += pu.sp;
          if (pu.t > 1) {
            pu.e = (Math.random() * edges.length) | 0;
            pu.t = 0;
            pu.sp = 0.004 + Math.random() * 0.011;
          }
        }
      }

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        ctx.fillStyle = tint(n.t, 0.85);
        ctx.beginPath();
        ctx.arc(px(n), py(n), 1.7, 0, 6.2832);
        ctx.fill();
      }
    }

    function loop(ts) {
      tms = ts || 0;
      render(true);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { build(); if (reduce) render(false); }, 200);
    });

    build();
    if (!nodes.length) { return; }
    if (reduce) { render(false); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.01 }).observe(hero);
    } else {
      start();
    }
  }

  /* ---------- Footer year ---------- */
  function setYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  function init() {
    bindThemeToggle();
    bindNav();
    bindHeader();
    bindProgress();
    bindReveal();
    bindScrollSpy();
    bindPointerLight();
    brainField();
    setYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
