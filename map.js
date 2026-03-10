/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Map Module
   Leaflet map, ward markers, hotspot layer, popups
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.map = {
  instance: null,
  layer: 'risk',          // 'risk' | 'readiness' | 'hotspots'
  wardLayer:    null,
  hotspotLayer: null,
  _wardCircles: {},       // id → L.circleMarker
  _hotspotCircles: [],

  // ── Init ──────────────────────────────────────────────────────
  init() {
    const map = L.map('map', {
      center: [28.644, 77.210],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });
    this.instance = map;

    // Dark CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: '© OpenStreetMap © CartoDB' }).addTo(map);

    this.wardLayer    = L.layerGroup().addTo(map);
    this.hotspotLayer = L.layerGroup();

    this.drawWards();
    this.bindToolbar();
  },

  // ── DRAW WARDS ───────────────────────────────────────────────
  drawWards() {
    this.wardLayer.clearLayers();
    this._wardCircles = {};

    FS.store.wards.forEach(w => {
      const color  = this.layer === 'readiness'
        ? FS.utils.readinessColor(w.readiness_score)
        : FS.utils.riskColor(w.risk_level);
      const radius = this.layer === 'readiness'
        ? 9
        : 9 + w.flood_probability * 8;

      const marker = L.circleMarker([w.lat, w.lon], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.8,
      });

      marker.bindPopup(this._makePopup(w), { maxWidth: 280 });
      marker.on('click', () => {
        FS.sidebar.selectWard(w.id);
        this._highlightMarker(w.id);
      });

      marker._wardId = w.id;
      this._wardCircles[w.id] = marker;
      this.wardLayer.addLayer(marker);
    });
  },

  // ── DRAW HOTSPOTS ────────────────────────────────────────────
  drawHotspots() {
    this.hotspotLayer.clearLayers();
    this._hotspotCircles = [];

    FS.store.wards.forEach(w => {
      w.hotspots.forEach(h => {
        const marker = L.circleMarker([h.lat, h.lon], {
          radius: 4 + h.severity * 9,
          fillColor: FS.utils.fpColor(h.severity),
          color: 'rgba(255,255,255,0.4)',
          weight: 0.5,
          opacity: 0.9,
          fillOpacity: 0.65,
        });

        marker.bindTooltip(`
          <b>${h.type}</b><br>
          ${w.name} · Severity: ${FS.utils.pct(h.severity)}<br>
          ~${h.residents_at_risk} residents at risk
        `, { sticky: true });

        this.hotspotLayer.addLayer(marker);
        this._hotspotCircles.push(marker);
      });
    });
  },

  // ── SET LAYER ────────────────────────────────────────────────
  setLayer(layer) {
    this.layer = layer;

    // Update toolbar buttons
    ['risk', 'readiness', 'hotspots'].forEach(l => {
      FS.utils.el(`ml-${l}`)?.classList.toggle('active', l === layer);
    });

    if (layer === 'hotspots') {
      this.wardLayer.remove();
      if (!this._hotspotCircles.length) this.drawHotspots();
      this.hotspotLayer.addTo(this.instance);
    } else {
      this.hotspotLayer.remove();
      this.drawWards();
      this.wardLayer.addTo(this.instance);
    }

    // Update legend
    this._updateLegend(layer);
  },

  // ── HIGHLIGHT MARKER ─────────────────────────────────────────
  _highlightMarker(id) {
    Object.entries(this._wardCircles).forEach(([wid, m]) => {
      const isSelected = parseInt(wid) === id;
      m.setStyle({ weight: isSelected ? 3 : 1, opacity: isSelected ? 1 : 0.85 });
      m.setRadius(isSelected ? (9 + FS.store.getWard(parseInt(wid)).flood_probability * 8 + 4) : (9 + FS.store.getWard(parseInt(wid)).flood_probability * 8));
    });
  },

  // ── FLY TO WARD ──────────────────────────────────────────────
  flyToWard(ward) {
    this.instance.flyTo([ward.lat, ward.lon], 14, { duration: 1.1, easeLinearity: 0.5 });
    this._highlightMarker(ward.id);
    setTimeout(() => {
      const m = this._wardCircles[ward.id];
      if (m) m.openPopup();
    }, 1200);
  },

  // ── POPUP HTML ───────────────────────────────────────────────
  _makePopup(w) {
    const u = FS.utils;
    return `
    <div class="popup-name">${w.name}</div>
    <div style="font-size:10px;color:#4a6080;margin-bottom:8px">${w.zone} Zone ${u.riskChip(w.risk_level)}</div>
    <div class="popup-grid">
      <div class="popup-stat">
        <div class="popup-stat-val" style="color:${u.fpColor(w.flood_probability)}">${u.pct(w.flood_probability)}</div>
        <div class="popup-stat-lbl">FLOOD PROB</div>
      </div>
      <div class="popup-stat">
        <div class="popup-stat-val" style="color:${u.readinessColor(w.readiness_score)}">${w.readiness_score.toFixed(0)}</div>
        <div class="popup-stat-lbl">READINESS</div>
      </div>
      <div class="popup-stat">
        <div class="popup-stat-val c-teal">${w.drainage_capacity}</div>
        <div class="popup-stat-lbl">DRAIN mm/hr</div>
      </div>
      <div class="popup-stat">
        <div class="popup-stat-val">${w.hotspots.length}</div>
        <div class="popup-stat-lbl">HOTSPOTS</div>
      </div>
    </div>
    <button class="popup-btn" onclick="FS.sidebar.selectWard(${w.id})">View Full Analysis →</button>`;
  },

  // ── LEGEND ───────────────────────────────────────────────────
  _updateLegend(layer) {
    const el = FS.utils.el('map-legend-body');
    if (!el) return;

    if (layer === 'readiness') {
      el.innerHTML = `
        <div class="legend-row"><div class="legend-dot" style="background:#00c896"></div>High (&gt;70)</div>
        <div class="legend-row"><div class="legend-dot" style="background:#f5c518"></div>Medium (45–70)</div>
        <div class="legend-row"><div class="legend-dot" style="background:#ff3d5a"></div>Low (&lt;45)</div>`;
    } else if (layer === 'hotspots') {
      el.innerHTML = `
        <div class="legend-row"><div class="legend-dot" style="background:#ff3d5a"></div>High severity</div>
        <div class="legend-row"><div class="legend-dot" style="background:#f5c518"></div>Medium</div>
        <div class="legend-row"><div class="legend-dot" style="background:#00c896"></div>Low severity</div>`;
    } else {
      el.innerHTML = `
        <div class="legend-row"><div class="legend-dot" style="background:#ff3d5a"></div>Critical (&gt;68%)</div>
        <div class="legend-row"><div class="legend-dot" style="background:#ff7b2e"></div>High (48–68%)</div>
        <div class="legend-row"><div class="legend-dot" style="background:#f5c518"></div>Moderate (28–48%)</div>
        <div class="legend-row"><div class="legend-dot" style="background:#00c896"></div>Low (&lt;28%)</div>`;
    }
  },

  // ── TOOLBAR BINDING ──────────────────────────────────────────
  bindToolbar() {
    ['risk', 'readiness', 'hotspots'].forEach(l => {
      FS.utils.el(`ml-${l}`)?.addEventListener('click', () => this.setLayer(l));
    });
    this._updateLegend('risk');
  },

  // ── INVALIDATE ON RESIZE ─────────────────────────────────────
  invalidate() {
    setTimeout(() => this.instance?.invalidateSize(), 60);
  },
};
