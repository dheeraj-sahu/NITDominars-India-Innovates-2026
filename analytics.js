/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Analytics View
   Builds and renders all analytics content
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.analytics = {
  rendered: false,

  render() {
    if (this.rendered) return;
    this.rendered = true;

    const s = FS.store.summary;
    const u = FS.utils;
    const el = u.el('view-analytics');

    el.innerHTML = `
    <div class="analytics-header">
      <div>
        <div class="analytics-title">Flood Risk Analytics <span style="color:var(--teal)">— Delhi 2026</span></div>
        <div class="analytics-sub">Data-driven insights across ${s.total} wards, ${s.totalHotspots} hotspots, 10 zones</div>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-row">
      <div class="kpi-card c-critical">
        <div class="kpi-val c-critical">${s.critical}</div>
        <div class="kpi-lbl">CRITICAL WARDS</div>
        <div class="kpi-sub c-critical" style="font-size:10px">Immediate intervention</div>
      </div>
      <div class="kpi-card c-high">
        <div class="kpi-val c-high">${s.high}</div>
        <div class="kpi-lbl">HIGH RISK</div>
        <div class="kpi-sub c-high" style="font-size:10px">Pre-monsoon action</div>
      </div>
      <div class="kpi-card c-moderate">
        <div class="kpi-val c-moderate">${s.moderate}</div>
        <div class="kpi-lbl">MODERATE</div>
        <div class="kpi-sub" style="font-size:10px;color:var(--text-muted)">Monitor closely</div>
      </div>
      <div class="kpi-card c-teal">
        <div class="kpi-val c-teal">${s.totalHotspots}</div>
        <div class="kpi-lbl">TOTAL HOTSPOTS</div>
        <div class="kpi-sub" style="font-size:10px;color:var(--text-muted)">Mapped locations</div>
      </div>
      <div class="kpi-card c-teal" style="">
        <div class="kpi-val" style="color:${u.readinessColor(s.avgReadiness)}">${s.avgReadiness}</div>
        <div class="kpi-lbl">AVG READINESS</div>
        <div class="kpi-sub" style="font-size:10px;color:var(--text-muted)">City average / 100</div>
      </div>
    </div>

    <!-- Row 1: Scatter + Historical -->
    <div class="charts-grid">
      <div class="ana-card">
        <div class="ana-card-title">CORRELATION ANALYSIS</div>
        <div class="ana-card-sub">Flood Probability vs Drainage Capacity</div>
        <div class="ana-chart-box" style="height:220px"><canvas id="chart-scatter"></canvas></div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:8px">
          Each dot = 1 ward. Colour = risk level. Strong inverse correlation confirms drainage as primary driver.
        </div>
      </div>
      <div class="ana-card">
        <div class="ana-card-title">HISTORICAL TREND</div>
        <div class="ana-card-sub">Flood Losses & Impact 2019–2023</div>
        <div class="ana-chart-box" style="height:220px"><canvas id="chart-historical"></canvas></div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:8px">
          2023 monsoon was worst on record — ₹820 Cr loss, 28 deaths, 89 wards affected.
        </div>
      </div>
    </div>

    <!-- Row 2: Three charts -->
    <div class="charts-grid-3">
      <div class="ana-card">
        <div class="ana-card-title">IMPERVIOUS SURFACE</div>
        <div class="ana-card-sub">Ward Distribution by Coverage %</div>
        <div class="ana-chart-box" style="height:160px"><canvas id="chart-impervious"></canvas></div>
      </div>
      <div class="ana-card">
        <div class="ana-card-title">DRAIN INFRASTRUCTURE AGE</div>
        <div class="ana-card-sub">Wards by Drain Age (years)</div>
        <div class="ana-chart-box" style="height:160px"><canvas id="chart-drain-age"></canvas></div>
      </div>
      <div class="ana-card">
        <div class="ana-card-title">POPULATION DENSITY</div>
        <div class="ana-card-sub">Average Density by Risk Level</div>
        <div class="ana-chart-box" style="height:160px"><canvas id="chart-pop-risk"></canvas></div>
      </div>
    </div>

    <!-- Row 3: Capacity Gap + Zone table -->
    <div class="charts-grid">
      <div class="ana-card">
        <div class="ana-card-title">CAPACITY GAP ANALYSIS</div>
        <div class="ana-card-sub">Top 8 Wards — Peak Rainfall vs Drain Capacity</div>
        <div class="ana-chart-box" style="height:200px"><canvas id="chart-cap-gap"></canvas></div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:8px">
          Red bars = rainfall the drain cannot handle. Gap = immediate infrastructure upgrade priority.
        </div>
      </div>
      <div class="ana-card">
        <div class="ana-card-title">ZONE-WISE SUMMARY</div>
        <div class="ana-card-sub">Risk & Readiness by Zone</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr style="color:var(--text-muted);font-family:'JetBrains Mono';font-size:9px;letter-spacing:1px">
                <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)">ZONE</th>
                <th style="padding:6px 8px;border-bottom:1px solid var(--border)">WARDS</th>
                <th style="padding:6px 8px;border-bottom:1px solid var(--border)">CRITICAL</th>
                <th style="padding:6px 8px;border-bottom:1px solid var(--border)">AVG RISK</th>
                <th style="padding:6px 8px;border-bottom:1px solid var(--border)">READINESS</th>
                <th style="padding:6px 8px;border-bottom:1px solid var(--border)">HOTSPOTS</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(FS.store.zones).map(z => `
                <tr style="border-bottom:1px solid rgba(26,46,74,0.3)">
                  <td style="padding:7px 8px">
                    <span style="display:inline-block;width:8px;height:8px;background:${z.color};border-radius:50%;margin-right:6px;vertical-align:middle"></span>
                    ${z.name}
                  </td>
                  <td style="text-align:center;padding:7px 8px;color:var(--text-secondary)">${z.count}</td>
                  <td style="text-align:center;padding:7px 8px">
                    <span style="color:${z.critical>0?'var(--critical)':'var(--low)'};font-weight:700">${z.critical}</span>
                  </td>
                  <td style="text-align:center;padding:7px 8px">
                    <span style="color:${u.fpColor(z.avgFP)};font-weight:700">${(z.avgFP*100).toFixed(0)}%</span>
                  </td>
                  <td style="text-align:center;padding:7px 8px">
                    <span style="color:${u.readinessColor(z.avgReady)};font-weight:700">${z.avgReady}</span>
                  </td>
                  <td style="text-align:center;padding:7px 8px;color:var(--teal);font-weight:600">${z.hotspots}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

    FS.charts.initAnalytics();
  },
};
