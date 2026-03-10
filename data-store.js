/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Data Store
   Central data management and derived calculations
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.store = {
  wards: [],
  forecast: [],
  historical: [],
  loaded: false,

  // ── Load from JSON file ──────────────────────────────────────
  async load() {
    const resp = await fetch('./data/delhi_data.json');
    const raw  = await resp.json();
    this.wards     = raw.wards;
    this.forecast  = raw.forecast;
    this.historical = raw.historical;
    this.loaded    = true;
    this._computeDerived();
    return this;
  },

  // ── Precompute common aggregations ──────────────────────────
  _computeDerived() {
    const w = this.wards;

    this.summary = {
      total:    w.length,
      critical: w.filter(x => x.risk_level === 'CRITICAL').length,
      high:     w.filter(x => x.risk_level === 'HIGH').length,
      moderate: w.filter(x => x.risk_level === 'MODERATE').length,
      low:      w.filter(x => x.risk_level === 'LOW').length,
      totalHotspots: w.reduce((a, x) => a + x.hotspots.length, 0),
      avgReadiness:  +(w.reduce((a, x) => a + x.readiness_score, 0) / w.length).toFixed(1),
      avgDrainCap:   +(w.reduce((a, x) => a + x.drainage_capacity, 0) / w.length).toFixed(1),
      totalPopAtRisk: w.filter(x => x.risk_level === 'CRITICAL' || x.risk_level === 'HIGH')
                       .reduce((a, x) => a + x.population_density * x.area_sqkm, 0),
    };

    // Zone aggregations
    this.zones = {};
    w.forEach(ward => {
      if (!this.zones[ward.zone]) {
        this.zones[ward.zone] = { name: ward.zone, color: ward.zone_color, wards: [] };
      }
      this.zones[ward.zone].wards.push(ward);
    });
    Object.values(this.zones).forEach(z => {
      z.count    = z.wards.length;
      z.avgReady = +(z.wards.reduce((a, w) => a + w.readiness_score, 0) / z.count).toFixed(1);
      z.avgFP    = +(z.wards.reduce((a, w) => a + w.flood_probability, 0) / z.count).toFixed(3);
      z.critical = z.wards.filter(w => w.risk_level === 'CRITICAL').length;
      z.hotspots = z.wards.reduce((a, w) => a + w.hotspots.length, 0);
    });

    // Sorted lists
    this.byRisk      = [...w].sort((a, b) => b.flood_probability - a.flood_probability);
    this.byReadiness = [...w].sort((a, b) => a.readiness_score - b.readiness_score);
    this.topCritical = this.byRisk.slice(0, 10);
    this.lowestReady = this.byReadiness.slice(0, 10);
  },

  // ── Helpers ──────────────────────────────────────────────────
  getWard(id) {
    return this.wards.find(w => w.id === id);
  },

  filterWards({ search = '', zone = 'ALL', risk = 'ALL' } = {}) {
    return this.wards.filter(w => {
      const matchSearch = !search ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.zone.toLowerCase().includes(search.toLowerCase());
      const matchZone = zone === 'ALL' || w.zone === zone;
      const matchRisk = risk === 'ALL' || w.risk_level === risk;
      return matchSearch && matchZone && matchRisk;
    });
  },

  // Scatter data: drainage capacity vs flood prob
  scatterData() {
    return this.wards.map(w => ({
      x: w.drainage_capacity,
      y: +(w.flood_probability * 100).toFixed(1),
      name: w.name,
      zone: w.zone,
      risk: w.risk_level,
    }));
  },

  // Impervious surface buckets
  imperviousBuckets() {
    const edges = [50, 60, 70, 80, 90, 100];
    return edges.slice(0,-1).map((lo, i) => ({
      label: `${lo}–${edges[i+1]}%`,
      count: this.wards.filter(w => w.impervious_pct >= lo && w.impervious_pct < edges[i+1]).length,
    }));
  },

  // Drain age buckets
  drainAgeBuckets() {
    const edges = [0, 10, 20, 30, 40, 50];
    return edges.slice(0,-1).map((lo, i) => ({
      label: `${lo}–${edges[i+1]}yr`,
      count: this.wards.filter(w => w.drain_age_yrs >= lo && w.drain_age_yrs < edges[i+1]).length,
    }));
  },

  // Average population density per risk level
  popDensityByRisk() {
    return ['LOW','MODERATE','HIGH','CRITICAL'].map(r => {
      const ws = this.wards.filter(w => w.risk_level === r);
      return {
        risk: r,
        avg: ws.length ? +(ws.reduce((a,w) => a + w.population_density, 0) / ws.length).toFixed(0) : 0,
        count: ws.length,
      };
    });
  },

  // Top capacity gap wards
  capacityGaps() {
    return [...this.wards]
      .map(w => ({ ...w, gap: w.avg_rainfall_peak - w.drainage_capacity }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8);
  },
};
