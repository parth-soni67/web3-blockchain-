/**
 * main.js — Shared JavaScript for BlockChain Explorer
 * Handles: Navigation toggle, active link detection, animated background canvas
 * Author: Parth Soni
 */

'use strict';

/* =====================================================
   1. MOBILE NAVIGATION TOGGLE
   ===================================================== */
(function initNav() {
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when a link is clicked (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* =====================================================
   2. INTERSECTION OBSERVER — Trigger fade-in animations
   ===================================================== */
(function initScrollAnimations() {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length) return;

  // Elements in viewport immediately should animate
  // Others animate on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  fadeEls.forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
})();

/* =====================================================
   3. ANIMATED BLOCKCHAIN BACKGROUND CANVAS
   ===================================================== */
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, nodes, animId;

  /* ---------- Node definition ---------- */
  class Node {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2.5 + 1;
      // Type: 0 = dot node, 1 = block node
      this.type = Math.random() > 0.7 ? 1 : 0;
      this.size = this.type === 1 ? (Math.random() * 14 + 8) : this.radius;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }
    update(t) {
      this.x += this.vx;
      this.y += this.vy;
      // Bounce off edges
      if (this.x < 0 || this.x > width)  this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      // Pulse alpha
      this.currentAlpha = this.alpha + Math.sin(t * this.pulseSpeed + this.pulsePhase) * 0.08;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, this.currentAlpha));
      if (this.type === 1) {
        // Draw a small glowing square "block"
        const s = this.size;
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#06B6D4';
        ctx.strokeRect(this.x - s / 2, this.y - s / 2, s, s);
        ctx.fillStyle = 'rgba(59,130,246,0.07)';
        ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
      } else {
        // Draw a dot
        ctx.fillStyle = '#06B6D4';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#06B6D4';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------- Setup ---------- */
  function setup() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(60, Math.floor((width * height) / 18000));
    nodes = Array.from({ length: count }, () => new Node());
  }

  /* ---------- Draw connecting lines ---------- */
  function drawEdges() {
    const maxDist = 160;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  /* ---------- Animation loop ---------- */
  let t = 0;
  function loop() {
    t++;
    ctx.clearRect(0, 0, width, height);
    drawEdges();
    nodes.forEach(n => { n.update(t); n.draw(); });
    animId = requestAnimationFrame(loop);
  }

  /* ---------- Resize handler ---------- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animId);
      setup();
      loop();
    }, 200);
  });

  setup();
  loop();
})();

/* =====================================================
   4. SMOOTH PAGE TRANSITION
   ===================================================== */
(function initPageTransitions() {
  // Add a subtle fade-in on page load
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });
  // Instant fallback
  setTimeout(() => { document.body.style.opacity = '1'; }, 600);
})();

/* =====================================================
   5. UTILITY HELPERS (shared across pages)
   ===================================================== */

/**
 * Format a number as USD currency string.
 * @param {number} val
 * @returns {string}
 */
function formatUSD(val) {
  if (val === undefined || val === null || isNaN(val)) return '$—';
  if (val >= 10000) {
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (val >= 1) {
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return '$' + val.toFixed(6);
}

/**
 * Format a timestamp as a human-readable "last updated" string.
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
