/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Utilities
   Colors, formatters, DOM helpers
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.utils = {

  // ── Color scales ─────────────────────────────────────────────
  riskColor(risk) {
    return { CRITICAL: '#ff3d5a', HIGH: '#ff7b2e', MODERATE: '#f5c518', LOW: '#00c896' }[risk] || '#4a6080';
  },

  fpColor(fp) {
    if (fp > 0.68) return '#ff3d5a';
    if (fp > 0.48) return '#ff7b2e';
    if (fp > 0.28) return '#f5c518';
    return '#00c896';
  },

  readinessColor(score) {
    if (score >= 70) return '#00c896';
    if (score >= 45) return '#f5c518';
    return '#ff3d5a';
  },

  rainfallColor(mm) {
    if (mm > 40) return 'rgba(255,61,90,0.75)';
    if (mm > 15) return 'rgba(255,123,46,0.75)';
    if (mm > 3)  return 'rgba(245,197,24,0.65)';
    return 'rgba(107,155,187,0.4)';
  },

  // ── Formatters ───────────────────────────────────────────────
  pct(fp)     { return `${(fp * 100).toFixed(0)}%`; },
  mm(v)       { return `${v} mm/hr`; },
  score(s)    { return `${s.toFixed(0)}/100`; },
  lakhs(n)    { return n > 1e5 ? `${(n/1e5).toFixed(1)}L` : n.toLocaleString(); },
  crore(n)    { return `₹${n}Cr`; },

  // ── DOM helpers ──────────────────────────────────────────────
  el(id)      { return document.getElementById(id); },
  qs(sel, ctx = document) { return ctx.querySelector(sel); },
  qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

  show(id)    { const e = this.el(id); if (e) e.style.display = 'block'; },
  hide(id)    { const e = this.el(id); if (e) e.style.display = 'none'; },
  showFlex(id){ const e = this.el(id); if (e) e.style.display = 'flex'; },

  // ── Risk chip HTML ───────────────────────────────────────────
  riskChip(risk) {
    return `<span class="risk-chip chip-${risk}">${risk}</span>`;
  },

  // ── Chart.js shared defaults ─────────────────────────────────
  chartDefaults: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,18,32,0.95)',
        titleColor: '#ddeeff',
        bodyColor: '#7a9bbb',
        borderColor: '#1a2e4a',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(26,46,74,0.5)' },
        ticks: { color: '#3d5878', font: { size: 9, family: "'JetBrains Mono'" } },
      },
      y: {
        grid: { color: 'rgba(26,46,74,0.5)' },
        ticks: { color: '#3d5878', font: { size: 9, family: "'JetBrains Mono'" } },
      },
    },
  },

  // Merge chart options deeply
  mergeChart(base, extra) {
    return JSON.parse(JSON.stringify({ ...base, ...extra,
      plugins: { ...base.plugins, ...(extra.plugins || {}) },
      scales:  { ...base.scales,  ...(extra.scales  || {}) },
    }));
  },

  // ── Tiny sparkline using canvas ──────────────────────────────
  drawSparkline(canvas, data, color = '#00dcc8') {
    const ctx  = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    const min = Math.min(...data);
    const max = Math.max(...data) || 1;
    const norm = v => h - ((v - min) / (max - min)) * h * 0.9 - h * 0.05;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      i === 0 ? ctx.moveTo(x, norm(v)) : ctx.lineTo(x, norm(v));
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },
};
