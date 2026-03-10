/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Actions View
   AI-generated pre-monsoon action plan & recommendations
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.actions = {
  rendered: false,

  render() {
    if (this.rendered) return;
    this.rendered = true;

    const u = FS.utils;
    const s = FS.store.summary;
    const el = u.el('view-actions');

    const critical = FS.store.topCritical.slice(0, 6);
    const lowReady = FS.store.lowestReady.slice(0, 6);
    const capGaps  = FS.store.capacityGaps().slice(0, 5);

    // Build citizen alert targets (high pop + high risk)
    const citizenTargets = [...FS.store.wards]
      .filter(w => w.risk_level === 'CRITICAL' || w.risk_level === 'HIGH')
      .sort((a, b) => (b.population_density * b.area_sqkm) - (a.population_density * a.area_sqkm))
      .slice(0, 5);

    el.innerHTML = `
    <div class="actions-header">
      <div class="actions-title">Pre-Monsoon <em>Action Plan 2026</em></div>
      <div class="actions-meta">AI-generated · Based on flood probability, drainage capacity, readiness scores & population exposure · Delhi MCD</div>
    </div>

    <!-- Summary strip -->
    <div class="action-summary" style="margin-bottom:16px">
      <div class="summary-kpis">
        <div class="sk-item">
          <div class="sk-val c-critical">${s.critical}</div>
          <div class="sk-lbl">CRITICAL WARDS</div>
        </div>
        <div class="sk-item">
          <div class="sk-val c-high">${s.high}</div>
          <div class="sk-lbl">HIGH RISK</div>
        </div>
        <div class="sk-item">
          <div class="sk-val c-teal">${s.totalHotspots}</div>
          <div class="sk-lbl">HOTSPOTS</div>
        </div>
        <div class="sk-item">
          <div class="sk-val" style="color:var(--yellow)">${FS.store.wards.reduce((a,w)=>a+w.pump_count,0)}</div>
          <div class="sk-lbl">PUMPS DEPLOYED</div>
        </div>
        <div class="sk-item">
          <div class="sk-val" style="color:var(--purple)">${Math.round(s.totalPopAtRisk/1e5)}L+</div>
          <div class="sk-lbl">POP AT RISK</div>
        </div>
        <div class="sk-item">
          <div class="sk-val" style="color:${u.readinessColor(s.avgReadiness)}">${s.avgReadiness}</div>
          <div class="sk-lbl">AVG READINESS</div>
        </div>
      </div>
    </div>

    <div class="action-sections">

      <!-- 1. Immediate Drain Intervention -->
      <div class="action-card">
        <div class="action-card-head">
          <div class="action-icon" style="background:rgba(255,61,90,0.12)">🚨</div>
          <div>
            <div class="action-card-title">Immediate Drain Intervention</div>
            <div class="action-card-count">Target: Critical wards — within 2 weeks</div>
          </div>
        </div>
        <div class="action-items">
          ${critical.map((w, i) => `
            <div class="action-item">
              <div class="ai-priority p${Math.min(i+1,4)}">${i+1}</div>
              <div class="ai-body">
                <div class="ai-text">
                  De-silt main nala and clear ${w.hotspots.filter(h=>h.type.includes('Drain')||h.type.includes('Nala')).length || 'all'} blocked drains.
                  Pre-position ${Math.ceil(w.flood_probability*4)} high-capacity pumps (capacity gap: <b>${(w.avg_rainfall_peak-w.drainage_capacity).toFixed(0)} mm/hr</b>).
                </div>
                <div class="ai-meta">
                  ${w.name}
                  <span class="ai-tag">${(w.flood_probability*100).toFixed(0)}% risk</span>
                  <span class="ai-tag">Cap: ${w.drainage_capacity} mm/hr</span>
                  <span class="ai-tag">${w.hotspots.length} hotspots</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 2. Readiness Improvement -->
      <div class="action-card">
        <div class="action-card-head">
          <div class="action-icon" style="background:rgba(245,197,24,0.12)">📋</div>
          <div>
            <div class="action-card-title">Readiness Improvement</div>
            <div class="action-card-count">Target: Lowest-readiness wards — 4 weeks</div>
          </div>
        </div>
        <div class="action-items">
          ${lowReady.map((w, i) => `
            <div class="action-item">
              <div class="ai-priority p${Math.min(i+1,4)}">${i+1}</div>
              <div class="ai-body">
                <div class="ai-text">
                  Conduct emergency preparedness drill. Install ${Math.ceil(2 + (100-w.readiness_score)/20)} temporary flood
                  sensors. Ensure 24/7 MCD control room coverage.
                  ${w.drain_cleaned_pct < 50 ? `<b>Only ${w.drain_cleaned_pct}% drains cleaned</b> — immediate clearance required.` : ''}
                </div>
                <div class="ai-meta">
                  ${w.name}
                  <span class="ai-tag">Readiness: ${w.readiness_score.toFixed(0)}/100</span>
                  <span class="ai-tag">Cleaned: ${w.drain_cleaned_pct}%</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 3. Infrastructure Upgrades -->
      <div class="action-card">
        <div class="action-card-head">
          <div class="action-icon" style="background:rgba(0,229,255,0.10)">🔧</div>
          <div>
            <div class="action-card-title">Infrastructure Upgrades</div>
            <div class="action-card-count">Target: Highest capacity-gap wards — 3 months</div>
          </div>
        </div>
        <div class="action-items">
          ${capGaps.map((w, i) => `
            <div class="action-item">
              <div class="ai-priority p${Math.min(i+1,4)}">${i+1}</div>
              <div class="ai-body">
                <div class="ai-text">
                  Upgrade drain cross-section to handle <b>${w.avg_rainfall_peak.toFixed(0)} mm/hr</b>.
                  Current capacity: ${w.drainage_capacity} mm/hr. Deficit: <b>${w.gap.toFixed(0)} mm/hr</b>.
                  ${w.drain_age_yrs > 25 ? `Drain age ${w.drain_age_yrs.toFixed(0)}yr — full replacement recommended.` : 'Partial reinforcement sufficient.'}
                </div>
                <div class="ai-meta">
                  ${w.name}
                  <span class="ai-tag">Gap: +${w.gap.toFixed(0)} mm/hr needed</span>
                  <span class="ai-tag">${w.drain_age_yrs.toFixed(0)}yr old drains</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 4. Citizen Alerts -->
      <div class="action-card">
        <div class="action-card-head">
          <div class="action-icon" style="background:rgba(0,200,150,0.10)">📱</div>
          <div>
            <div class="action-card-title">Citizen Alert Deployment</div>
            <div class="action-card-count">Target: High-density risk wards — before June 2026</div>
          </div>
        </div>
        <div class="action-items">
          ${citizenTargets.map((w, i) => `
            <div class="action-item">
              <div class="ai-priority p${Math.min(i+1,4)}">${i+1}</div>
              <div class="ai-body">
                <div class="ai-text">
                  Register ~<b>${Math.round(w.population_density * w.area_sqkm / 1000)}K residents</b> for
                  Hindi+English SMS flood alerts. Mark ${w.hotspots.length} hotspot zones on local boards.
                  Identify ${Math.ceil(w.hotspots.length / 3)} evacuation shelters.
                </div>
                <div class="ai-meta">
                  ${w.name}
                  <span class="ai-tag">${Math.round(w.population_density*w.area_sqkm/1000)}K pop</span>
                  <span class="ai-tag">${w.hotspots.length} hotspots</span>
                  <span class="ai-tag">${(w.flood_probability*100).toFixed(0)}% risk</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

    </div>

    <!-- PWD Drain Priority Table -->
    <div class="action-summary">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <div class="ana-card-title">PWD / MCD DRAIN PRIORITY LIST</div>
          <div style="font-size:12px;font-weight:600;color:var(--text-primary)">Top 10 Wards — Ranked by Overflow Risk Score</div>
        </div>
        <div style="font-family:var(--font-code);font-size:9px;color:var(--text-muted)">Generated: March 2026</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="color:var(--text-muted);font-family:'JetBrains Mono';font-size:9px;letter-spacing:1px">
            <th style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border)">#</th>
            <th style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border)">WARD</th>
            <th style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border)">ZONE</th>
            <th style="text-align:center;padding:7px 10px;border-bottom:1px solid var(--border)">FLOOD PROB</th>
            <th style="text-align:center;padding:7px 10px;border-bottom:1px solid var(--border)">DRAIN CAP</th>
            <th style="text-align:center;padding:7px 10px;border-bottom:1px solid var(--border)">PEAK RAIN</th>
            <th style="text-align:center;padding:7px 10px;border-bottom:1px solid var(--border)">GAP</th>
            <th style="text-align:center;padding:7px 10px;border-bottom:1px solid var(--border)">READINESS</th>
            <th style="text-align:center;padding:7px 10px;border-bottom:1px solid var(--border)">ACTION</th>
          </tr>
        </thead>
        <tbody>
          ${FS.store.byRisk.slice(0, 10).map((w, i) => {
            const gap = w.avg_rainfall_peak - w.drainage_capacity;
            const action = w.risk_level === 'CRITICAL' ? 'EMERGENCY' : w.risk_level === 'HIGH' ? 'PRIORITY' : 'ROUTINE';
            const actionColor = w.risk_level === 'CRITICAL' ? 'var(--critical)' : w.risk_level === 'HIGH' ? 'var(--high)' : 'var(--moderate)';
            return `
            <tr style="border-bottom:1px solid rgba(26,46,74,0.3)">
              <td style="padding:8px 10px;color:var(--text-muted);font-family:var(--font-code)">${String(i+1).padStart(2,'0')}</td>
              <td style="padding:8px 10px;font-weight:600">${w.name}</td>
              <td style="padding:8px 10px;color:var(--text-muted)">${w.zone}</td>
              <td style="text-align:center;padding:8px 10px"><span style="color:${u.fpColor(w.flood_probability)};font-weight:700">${(w.flood_probability*100).toFixed(0)}%</span></td>
              <td style="text-align:center;padding:8px 10px;color:var(--teal);font-family:var(--font-code)">${w.drainage_capacity}</td>
              <td style="text-align:center;padding:8px 10px;font-family:var(--font-code)">${w.avg_rainfall_peak}</td>
              <td style="text-align:center;padding:8px 10px"><span style="color:var(--critical);font-weight:700;font-family:var(--font-code)">+${gap.toFixed(0)}</span></td>
              <td style="text-align:center;padding:8px 10px"><span style="color:${u.readinessColor(w.readiness_score)};font-weight:700">${w.readiness_score.toFixed(0)}</span></td>
              <td style="text-align:center;padding:8px 10px">
                <span style="font-size:9px;padding:2px 8px;border-radius:4px;font-weight:700;font-family:var(--font-code);
                  background:${actionColor}22;color:${actionColor};border:1px solid ${actionColor}44">${action}</span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  },
};
