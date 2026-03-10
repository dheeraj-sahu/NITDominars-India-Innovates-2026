/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Sidebar Module
   Overview / Ward List / Ward Detail panels
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.sidebar = {
  activeTab:    'overview',
  selectedWard: null,
  searchQuery:  '',
  zoneFilter:   'ALL',

  // ── Init ──────────────────────────────────────────────────────
  init() {
    this.bindTabs();
    this.render();
  },

  bindTabs() {
    ['overview', 'wards', 'detail'].forEach(tab => {
      const btn = FS.utils.el(`s-tab-${tab}`);
      if (btn) btn.addEventListener('click', () => this.setTab(tab));
    });
  },

  setTab(tab) {
    this.activeTab = tab;
    ['overview', 'wards', 'detail'].forEach(t => {
      FS.utils.el(`s-tab-${t}`)?.classList.toggle('active', t === tab);
    });
    this.render();
  },

  render() {
    const body = FS.utils.el('sidebar-body');
    if (!body) return;
    body.innerHTML = '';
    if (this.activeTab === 'overview') this.renderOverview(body);
    else if (this.activeTab === 'wards') this.renderWardList(body);
    else this.renderDetail(body);
  },

  // ── SELECT WARD (called from map or list) ─────────────────────
  selectWard(id) {
    this.selectedWard = FS.store.getWard(id);
    this.setTab('detail');
    // Fly map
    if (FS.map && this.selectedWard) {
      FS.map.flyToWard(this.selectedWard);
    }
  },

  // ── OVERVIEW TAB ─────────────────────────────────────────────
  renderOverview(container) {
    const s   = FS.store.summary;
    const u   = FS.utils;
    const top = FS.store.topCritical.slice(0, 6);

    container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-val c-critical">${s.critical}</div>
        <div class="stat-label">CRITICAL WARDS</div>
        <div class="stat-trend c-critical" style="font-size:10px">⚡ Immediate action</div>
      </div>
      <div class="stat-card">
        <div class="stat-val c-high">${s.high}</div>
        <div class="stat-label">HIGH RISK</div>
        <div class="stat-trend c-high" style="font-size:10px">⚠ Monitor closely</div>
      </div>
      <div class="stat-card">
        <div class="stat-val c-teal">${s.totalHotspots}</div>
        <div class="stat-label">FLOOD HOTSPOTS</div>
        <div class="stat-trend c-muted" style="font-size:10px">Across ${s.total} wards</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:${u.readinessColor(s.avgReadiness)}">${s.avgReadiness}</div>
        <div class="stat-label">AVG READINESS</div>
        <div class="stat-trend c-muted" style="font-size:10px">Out of 100</div>
      </div>
    </div>

    <div style="padding:0 12px 4px">
      <div class="section-title">TOP RISK WARDS</div>
      ${top.map(w => `
        <div class="ward-item ${this.selectedWard?.id === w.id ? 'active' : ''}"
             onclick="FS.sidebar.selectWard(${w.id})">
          <div class="w-risk-bar" style="background:${u.riskColor(w.risk_level)}"></div>
          <div class="w-info">
            <div class="w-name">${w.name}</div>
            <div class="w-zone">${w.zone}</div>
          </div>
          <div class="w-right">
            <div class="w-pct" style="color:${u.fpColor(w.flood_probability)}">${u.pct(w.flood_probability)}</div>
            <div class="w-ready">Ready: ${w.readiness_score.toFixed(0)}</div>
          </div>
        </div>`).join('')}
    </div>

    <div class="divider" style="margin:8px 12px"></div>

    <div style="padding:0 12px 12px">
      <div class="section-title">HISTORICAL FLOODS</div>
      ${FS.store.historical.map(e => `
        <div class="hist-item">
          <div class="hist-year">${e.year}</div>
          <div class="hist-body">
            <div class="hist-title">${e.month} — ${e.peak_mm}mm peak · ${e.duration_hrs}h</div>
            <div class="hist-stats">${e.wards_affected} wards · ${e.deaths} deaths</div>
          </div>
          <div class="hist-loss">${u.crore(e.loss_cr)}</div>
        </div>`).join('')}
    </div>`;
  },

  // ── WARD LIST TAB ─────────────────────────────────────────────
  renderWardList(container) {
    const zones = Object.keys(FS.store.zones);

    container.innerHTML = `
    <div class="ward-search-wrap">
      <input type="text" id="ward-search" placeholder="Search ward or zone…" value="${this.searchQuery}">
    </div>
    <div class="zone-filter" id="zone-filter-bar">
      <button class="zone-chip ${this.zoneFilter==='ALL'?'active':''}" onclick="FS.sidebar.setZone('ALL')">All</button>
      ${zones.map(z => `
        <button class="zone-chip ${this.zoneFilter===z?'active':''}"
                style="${this.zoneFilter===z?`border-color:${FS.store.zones[z].color};color:${FS.store.zones[z].color}`:''};"
                onclick="FS.sidebar.setZone('${z}')">${z}</button>`).join('')}
    </div>
    <div class="ward-list" id="ward-list-items"></div>`;

    FS.utils.el('ward-search').addEventListener('input', e => {
      this.searchQuery = e.target.value;
      this.refreshList();
    });

    this.refreshList();
  },

  setZone(zone) {
    this.zoneFilter = zone;
    this.renderWardList(FS.utils.el('sidebar-body'));
  },

  refreshList() {
    const el = FS.utils.el('ward-list-items');
    if (!el) return;
    const results = FS.store.filterWards({ search: this.searchQuery, zone: this.zoneFilter });
    const sorted  = [...results].sort((a, b) => b.flood_probability - a.flood_probability);
    if (!sorted.length) {
      el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:11px">No wards match your filter</div>`;
      return;
    }
    el.innerHTML = sorted.map(w => `
      <div class="ward-item ${this.selectedWard?.id === w.id ? 'active' : ''}"
           onclick="FS.sidebar.selectWard(${w.id})">
        <div class="w-risk-bar" style="background:${FS.utils.riskColor(w.risk_level)}"></div>
        <div class="w-info">
          <div class="w-name">${w.name}</div>
          <div class="w-zone">${w.zone} Zone</div>
        </div>
        <div class="w-right">
          <div class="w-pct" style="color:${FS.utils.fpColor(w.flood_probability)}">${FS.utils.pct(w.flood_probability)}</div>
          ${FS.utils.riskChip(w.risk_level)}
        </div>
      </div>`).join('');
  },

  // ── DETAIL TAB ────────────────────────────────────────────────
  renderDetail(container) {
    if (!this.selectedWard) {
      container.innerHTML = `
        <div class="detail-empty">
          <div class="de-icon">🗺️</div>
          <p>Click any ward on the map<br>or select from the ward list<br>to view detailed flood analysis.</p>
        </div>`;
      return;
    }
    const w = this.selectedWard;
    const u = FS.utils;

    const readiness_factors = [
      { label: 'Drain Capacity',     val: Math.min(100, w.drainage_capacity / 55 * 100) },
      { label: 'Infrastructure Age', val: Math.max(0, 100 - w.drain_age_yrs * 2.1) },
      { label: 'Emergency Response', val: w.readiness_score * 0.92 + 4 },
      { label: 'Early Warning Sys',  val: w.readiness_score * 0.78 + 8 },
    ];

    const alertHTML = (() => {
      if (w.risk_level === 'CRITICAL') return `
        <div class="alert-box crit">
          <span class="alert-icon">⚡</span>
          <div class="alert-body">
            <div class="alert-title">CRITICAL — Immediate Intervention</div>
            <div class="alert-text">Drain capacity (${w.drainage_capacity} mm/hr) insufficient for ${w.avg_rainfall_peak} mm/hr peak. Deploy pumps before monsoon onset.</div>
          </div>
        </div>`;
      if (w.risk_level === 'HIGH') return `
        <div class="alert-box high">
          <span class="alert-icon">⚠️</span>
          <div class="alert-body">
            <div class="alert-title">HIGH RISK — Pre-Monsoon Action</div>
            <div class="alert-text">Drain de-silting and pump pre-positioning recommended within 4 weeks.</div>
          </div>
        </div>`;
      return `
        <div class="alert-box info">
          <span class="alert-icon">ℹ️</span>
          <div class="alert-body">
            <div class="alert-title">MODERATE — Routine Monitoring</div>
            <div class="alert-text">Continue standard inspection schedule. No emergency action required.</div>
          </div>
        </div>`;
    })();

    container.innerHTML = `
    <div class="detail-wrap fade-in">
      <div class="detail-hero">
        <div class="detail-hero-top">
          <div>
            <div class="detail-ward-name">${w.name}</div>
            <div class="detail-zone-name">${w.zone} Zone · Ward #${w.id}</div>
            <div style="margin-top:8px">${u.riskChip(w.risk_level)}</div>
          </div>
          <div class="readiness-badge">
            <div class="rb-val" style="color:${u.readinessColor(w.readiness_score)}">${w.readiness_score.toFixed(0)}</div>
            <div class="rb-label">READINESS</div>
          </div>
        </div>
        ${alertHTML}
      </div>

      <div class="metrics-4">
        <div class="m-card">
          <div class="m-val" style="color:${u.fpColor(w.flood_probability)}">${u.pct(w.flood_probability)}</div>
          <div class="m-label">FLOOD PROB</div>
        </div>
        <div class="m-card">
          <div class="m-val c-teal">${w.drainage_capacity} mm/hr</div>
          <div class="m-label">DRAIN CAP</div>
        </div>
        <div class="m-card">
          <div class="m-val">${w.avg_rainfall_peak} mm/hr</div>
          <div class="m-label">PEAK RAIN</div>
        </div>
        <div class="m-card">
          <div class="m-val">${w.elevation}m</div>
          <div class="m-label">ELEVATION</div>
        </div>
        <div class="m-card">
          <div class="m-val">${w.impervious_pct}%</div>
          <div class="m-label">IMPERVIOUS</div>
        </div>
        <div class="m-card">
          <div class="m-val">${w.drain_age_yrs}yr</div>
          <div class="m-label">DRAIN AGE</div>
        </div>
        <div class="m-card">
          <div class="m-val">${u.lakhs(w.population_density)}/km²</div>
          <div class="m-label">POP DENSITY</div>
        </div>
        <div class="m-card">
          <div class="m-val">${w.pump_count}</div>
          <div class="m-label">PUMPS</div>
        </div>
      </div>

      <div class="readiness-factors">
        <div class="section-title">READINESS BREAKDOWN</div>
        ${readiness_factors.map(rf => `
          <div class="rf-row">
            <div class="rf-labels">
              <span class="rf-name">${rf.label}</span>
              <span class="rf-val" style="color:${u.readinessColor(rf.val)}">${rf.val.toFixed(0)}/100</span>
            </div>
            <div class="rf-bar">
              <div class="rf-fill" style="width:${rf.val}%;background:${u.readinessColor(rf.val)}"></div>
            </div>
          </div>`).join('')}
      </div>

      <div class="divider"></div>

      <div>
        <div class="section-title" style="margin-bottom:6px">
          FLOOD HOTSPOTS (${w.hotspots.length})
        </div>
        <div class="hotspot-list">
          ${w.hotspots.map(h => `
            <div class="hs-item">
              <div class="hs-dot" style="background:${u.fpColor(h.severity)}"></div>
              <span class="hs-type">${h.type}</span>
              <span class="hs-residents c-muted">${h.residents_at_risk} residents</span>
              <span class="hs-sev" style="color:${u.fpColor(h.severity)}">${u.pct(h.severity)}</span>
            </div>`).join('')}
        </div>
      </div>

      <div style="margin-top:12px;background:var(--bg-raised);border-radius:8px;padding:10px 12px;">
        <div class="section-title">OTHER INFO</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;color:var(--text-secondary)">
          <div>Area: <b>${w.area_sqkm} km²</b></div>
          <div>Green Cover: <b>${w.green_cover_pct}%</b></div>
          <div>Drain Cleaned: <b>${w.drain_cleaned_pct}%</b></div>
          <div>Last Flood: <b>${w.last_flooded}</b></div>
        </div>
      </div>
    </div>`;
  },
};
