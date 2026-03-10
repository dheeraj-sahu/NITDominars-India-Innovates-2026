/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — App Controller
   Initialises all modules and controls view routing
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.app = {
  currentView: 'map',

  // ── Bootstrap ────────────────────────────────────────────────
  async init() {
    this._showLoader(true);
    try {
      await FS.store.load();
      this._buildShell();
      FS.map.init();
      FS.sidebar.init();
      FS.charts.initRainfallChart();
      FS.charts.initRiskDonut();
      FS.charts.initZoneReadiness();
      this._bindNav();
    } catch (err) {
      console.error('FloodSense init error:', err);
      document.body.innerHTML = `<div style="padding:40px;font-family:monospace;color:#ff3d5a">
        <h2>⚠ Load Error</h2><pre>${err.message}</pre>
        <p style="color:#7a9bbb">Ensure delhi_data.json is in the data/ folder.</p>
      </div>`;
    } finally {
      this._showLoader(false);
    }
  },

  // ── Navigation ────────────────────────────────────────────────
  _bindNav() {
    ['map', 'analytics', 'actions'].forEach(view => {
      FS.utils.el(`nav-${view}`)?.addEventListener('click', () => this.showView(view));
    });
  },

  showView(view) {
    if (this.currentView === view) return;
    this.currentView = view;

    // Toggle nav tabs
    ['map', 'analytics', 'actions'].forEach(v => {
      FS.utils.el(`nav-${v}`)?.classList.toggle('active', v === view);
    });

    // Toggle views
    FS.utils.el('view-map').style.display       = view === 'map'       ? 'flex' : 'none';
    FS.utils.el('view-analytics').style.display = view === 'analytics' ? 'block': 'none';
    FS.utils.el('view-actions').style.display   = view === 'actions'   ? 'block': 'none';

    if (view === 'map')       { FS.map.invalidate(); }
    if (view === 'analytics') { FS.analytics.render(); }
    if (view === 'actions')   { FS.actions.render(); }
  },

  // ── Build static shell HTML ──────────────────────────────────
  _buildShell() {
    const s = FS.store.summary;

    // Header status pills
    FS.utils.el('status-wards').textContent = `${s.total} Wards`;
    FS.utils.el('status-hotspots').textContent = `${s.totalHotspots} Hotspots`;

    // Map toolbar
    const toolbar = FS.utils.el('map-toolbar');
    if (toolbar) {
      toolbar.innerHTML = `
        <button class="map-tool-btn active" id="ml-risk"      onclick="FS.map.setLayer('risk')">RISK</button>
        <button class="map-tool-btn"        id="ml-readiness" onclick="FS.map.setLayer('readiness')">READINESS</button>
        <button class="map-tool-btn"        id="ml-hotspots"  onclick="FS.map.setLayer('hotspots')">HOTSPOTS</button>`;
    }
  },

  _showLoader(show) {
    const l = FS.utils.el('loader');
    if (l) l.style.display = show ? 'flex' : 'none';
  },
};

// ── Entry point ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => FS.app.init());
