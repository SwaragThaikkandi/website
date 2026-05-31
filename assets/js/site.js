/* Swarag Thaikkandi — site interactions
   Theme toggle · mobile nav · scroll reveal · active nav · scroll progress · back-to-top */
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

  /* ---------- Footer year ---------- */
  function setYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
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

  /* ---------- Diffusion field — drifting nodes that link & lean toward you ---------- */
  function diffusionField() {
    var canvas = document.querySelector(".hero-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], raf = null, running = false;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 130;

    function resize() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(72, Math.max(26, (w * h) / 15000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        });
      }
    }

    function render(animate) {
      ctx.clearRect(0, 0, w, h);
      var i, j, p;
      if (animate) {
        for (i = 0; i < nodes.length; i++) {
          p = nodes[i];
          p.vx += (Math.random() - 0.5) * 0.04;   // brownian jitter — diffusion
          p.vy += (Math.random() - 0.5) * 0.04;
          p.vx *= 0.96; p.vy *= 0.96;
          var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
          if (d2 < 26000) { p.vx += dx * 0.0005; p.vy += dy * 0.0005; } // lean toward cursor
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
          if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
        }
      }
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          var ax = nodes[i].x - nodes[j].x, ay = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(ax * ax + ay * ay);
          if (dist < LINK) {
            ctx.strokeStyle = "rgba(121,214,196," + (0.16 * (1 - dist / LINK)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        ctx.fillStyle = "rgba(224,147,95,0.7)";
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 1.7, 0, 6.2832);
        ctx.fill();
      }
    }

    function loop() {
      render(true);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; loop(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });

    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { resize(); if (reduce) render(false); }, 200);
    });

    resize();
    if (reduce) { render(false); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.02 }).observe(hero);
    } else {
      start();
    }
  }

  function init() {
    bindThemeToggle();
    bindNav();
    bindHeader();
    bindProgress();
    bindReveal();
    bindScrollSpy();
    bindPointerLight();
    diffusionField();
    setYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
