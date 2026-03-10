/* ═══════════════════════════════════════════════════════════════
   FloodSense AI — Charts Module
   Bottom panel charts + Analytics view charts
   ═══════════════════════════════════════════════════════════════ */

window.FS = window.FS || {};

FS.charts = {
  _instances: {},   // name → Chart instance

  destroy(name) {
    if (this._instances[name]) {
      this._instances[name].destroy();
      delete this._instances[name];
    }
  },

  destroyAll() {
    Object.keys(this._instances).forEach(k => this.destroy(k));
  },

  make(id, cfg) {
    this.destroy(id);
    const canvas = FS.utils.el(id);
    if (!canvas) return null;
    const chart = new Chart(canvas.getContext('2d'), cfg);
    this._instances[id] = chart;
    return chart;
  },

  // ── Shared options builder ───────────────────────────────────
  _opts(overrides = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,18,32,0.96)',
          titleColor: '#ddeeff',
          bodyColor: '#7a9bbb',
          borderColor: '#1a2e4a',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
        ...( overrides.plugins || {} ),
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
        ...( overrides.scales || {} ),
      },
      ...overrides,
      plugins: undefined,
      scales: undefined,
    };
  },

  // ════════════════════════════════════════════════════════════
  // BOTTOM PANEL CHARTS (Map view)
  // ════════════════════════════════════════════════════════════

  initRainfallChart() {
    const d = FS.store.forecast;
    this.make('chart-rainfall', {
      type: 'bar',
      data: {
        labels: d.map(h => h.hour % 6 === 0 ? h.label : ''),
        datasets: [{
          data: d.map(h => h.mm),
          backgroundColor: d.map(h => FS.utils.rainfallColor(h.mm)),
          borderWidth: 0,
          borderRadius: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.96)',
            titleColor: '#ddeeff', bodyColor: '#7a9bbb',
            borderColor: '#1a2e4a', borderWidth: 1,
            callbacks: {
              title: ctx => `Hour ${d[ctx[0].dataIndex].hour} · ${d[ctx[0].dataIndex].intensity}`,
              label: ctx => ` ${ctx.parsed.y.toFixed(1)} mm/hr`,
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#3d5878', font: { size: 8 } } },
          y: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#3d5878', font: { size: 8 } } }
        }
      }
    });
  },

  initRiskDonut() {
    const s = FS.store.summary;
    this.make('chart-risk-donut', {
      type: 'doughnut',
      data: {
        labels: ['Critical','High','Moderate','Low'],
        datasets: [{
          data: [s.critical, s.high, s.moderate, s.low],
          backgroundColor: ['#ff3d5a','#ff7b2e','#f5c518','#00c896'],
          borderColor: '#0a1220',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '62%',
        animation: { duration: 500 },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { color: '#7a9bbb', font: { size: 9, family: "'JetBrains Mono'" }, boxWidth: 9, padding: 6 }
          },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.96)',
            titleColor: '#ddeeff', bodyColor: '#7a9bbb',
            borderColor: '#1a2e4a', borderWidth: 1,
          }
        },
      }
    });
  },

  initZoneReadiness() {
    const zones   = Object.values(FS.store.zones);
    const labels  = zones.map(z => z.name.split(' ')[0]);
    const data    = zones.map(z => z.avgReady);
    const colors  = zones.map(z => FS.utils.readinessColor(z.avgReady));

    this.make('chart-zone-ready', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => c + 'aa'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.96)',
            titleColor: '#ddeeff', bodyColor: '#7a9bbb',
            borderColor: '#1a2e4a', borderWidth: 1,
            callbacks: { label: ctx => ` Readiness: ${ctx.parsed.x.toFixed(1)} / 100` }
          }
        },
        scales: {
          x: { min: 0, max: 100, grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#3d5878', font: { size: 8 } } },
          y: { grid: { display: false }, ticks: { color: '#7a9bbb', font: { size: 8 } } }
        }
      }
    });
  },

  // ════════════════════════════════════════════════════════════
  // ANALYTICS CHARTS
  // ════════════════════════════════════════════════════════════

  initAnalytics() {
    setTimeout(() => {
      this.initScatter();
      this.initHistoricalBar();
      this.initImperviousBar();
      this.initDrainAgeBar();
      this.initPopRisk();
      this.initCapacityGap();
    }, 80);
  },

  initScatter() {
    const data  = FS.store.scatterData();
    const colors = data.map(d => FS.utils.riskColor(d.risk) + 'cc');

    this.make('chart-scatter', {
      type: 'scatter',
      data: {
        datasets: [{
          data: data.map(d => ({ x: d.x, y: d.y })),
          backgroundColor: colors,
          pointRadius: 5,
          pointHoverRadius: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.96)',
            titleColor: '#ddeeff', bodyColor: '#7a9bbb',
            borderColor: '#1a2e4a', borderWidth: 1,
            callbacks: {
              label: ctx => {
                const d = data[ctx.dataIndex];
                return [`${d.name} (${d.zone})`, `Drain: ${d.x} mm/hr · Risk: ${d.y}%`];
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Drainage Capacity (mm/hr)', color: '#3d5878', font: { size: 9 } },
            grid: { color: 'rgba(26,46,74,0.5)' },
            ticks: { color: '#3d5878', font: { size: 9 } }
          },
          y: {
            title: { display: true, text: 'Flood Probability (%)', color: '#3d5878', font: { size: 9 } },
            grid: { color: 'rgba(26,46,74,0.5)' },
            ticks: { color: '#3d5878', font: { size: 9 } }
          }
        }
      }
    });
  },

  initHistoricalBar() {
    const h = FS.store.historical;
    this.make('chart-historical', {
      type: 'bar',
      data: {
        labels: h.map(e => `${e.year}`),
        datasets: [
          {
            label: 'Loss (₹Cr)',
            data: h.map(e => e.loss_cr),
            backgroundColor: 'rgba(255,61,90,0.6)',
            borderColor: '#ff3d5a', borderWidth: 1.5, borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'Wards Affected',
            data: h.map(e => e.wards_affected),
            backgroundColor: 'rgba(255,123,46,0.5)',
            borderColor: '#ff7b2e', borderWidth: 1.5, borderRadius: 4,
            yAxisID: 'y1',
          },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#7a9bbb', font: { size: 9 }, boxWidth: 10, padding: 8 } },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.96)',
            titleColor: '#ddeeff', bodyColor: '#7a9bbb',
            borderColor: '#1a2e4a', borderWidth: 1,
          }
        },
        scales: {
          x: { grid: { color: 'rgba(26,46,74,0.5)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } },
          y:  { position: 'left',  grid: { color: 'rgba(26,46,74,0.3)' }, ticks: { color: '#7a9bbb', font: { size: 9 } }, title: { display: true, text: '₹ Crore', color: '#3d5878', font: { size: 8 } } },
          y1: { position: 'right', grid: { display: false }, ticks: { color: '#7a9bbb', font: { size: 9 } }, title: { display: true, text: 'Wards', color: '#3d5878', font: { size: 8 } } },
        }
      }
    });
  },

  initImperviousBar() {
    const buckets = FS.store.imperviousBuckets();
    this.make('chart-impervious', {
      type: 'bar',
      data: {
        labels: buckets.map(b => b.label),
        datasets: [{
          data: buckets.map(b => b.count),
          backgroundColor: 'rgba(124,77,255,0.6)',
          borderColor: '#7c4dff', borderWidth: 1.5, borderRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: 'rgba(10,18,32,0.96)', titleColor: '#ddeeff', bodyColor: '#7a9bbb',
          borderColor: '#1a2e4a', borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.parsed.y} wards` }
        }},
        scales: {
          x: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } },
          y: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } }
        }
      }
    });
  },

  initDrainAgeBar() {
    const buckets = FS.store.drainAgeBuckets();
    this.make('chart-drain-age', {
      type: 'bar',
      data: {
        labels: buckets.map(b => b.label),
        datasets: [{
          data: buckets.map(b => b.count),
          backgroundColor: 'rgba(0,229,255,0.5)',
          borderColor: '#00e5ff', borderWidth: 1.5, borderRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: 'rgba(10,18,32,0.96)', titleColor: '#ddeeff', bodyColor: '#7a9bbb',
          borderColor: '#1a2e4a', borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.parsed.y} wards` }
        }},
        scales: {
          x: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } },
          y: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } }
        }
      }
    });
  },

  initPopRisk() {
    const data   = FS.store.popDensityByRisk();
    const colors = data.map(d => FS.utils.riskColor(d.risk));
    this.make('chart-pop-risk', {
      type: 'bar',
      data: {
        labels: data.map(d => d.risk),
        datasets: [{
          data: data.map(d => d.avg),
          backgroundColor: colors.map(c => c + 'aa'),
          borderColor: colors, borderWidth: 1.5, borderRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: 'rgba(10,18,32,0.96)', titleColor: '#ddeeff', bodyColor: '#7a9bbb',
          borderColor: '#1a2e4a', borderWidth: 1,
          callbacks: { label: ctx => ` ${Number(ctx.parsed.y).toLocaleString()} /km² (avg)` }
        }},
        scales: {
          x: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } },
          y: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } } }
        }
      }
    });
  },

  initCapacityGap() {
    const data = FS.store.capacityGaps();
    this.make('chart-cap-gap', {
      type: 'bar',
      data: {
        labels: data.map(w => w.name),
        datasets: [
          {
            label: 'Peak Rain',
            data: data.map(w => w.avg_rainfall_peak),
            backgroundColor: 'rgba(255,61,90,0.6)',
            borderColor: '#ff3d5a', borderWidth: 1, borderRadius: 3,
            stack: 'a',
          },
          {
            label: 'Drain Capacity',
            data: data.map(w => w.drainage_capacity),
            backgroundColor: 'rgba(0,220,200,0.5)',
            borderColor: '#00dcc8', borderWidth: 1, borderRadius: 3,
            stack: 'b',
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#7a9bbb', font: { size: 9 }, boxWidth: 10, padding: 8 } },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.96)', titleColor: '#ddeeff', bodyColor: '#7a9bbb',
            borderColor: '#1a2e4a', borderWidth: 1,
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)} mm/hr` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 8 }, maxRotation: 30 } },
          y: { grid: { color: 'rgba(26,46,74,0.4)' }, ticks: { color: '#7a9bbb', font: { size: 9 } }, title: { display: true, text: 'mm/hr', color: '#3d5878', font: { size: 8 } } }
        }
      }
    });
  },
};
