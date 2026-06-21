/* ===================================================================
   CHARTS.JS — definitii grafice Chart.js, reutilizabile atat pentru
   afisare live in pagina cat si pentru capturare in raportul PDF.
   =================================================================== */

const ChartsModule = (() => {

  const palette = {
    ink: '#0E1116', accent: '#FF5A1F', ok: '#2B6E5E', warn: '#C23B3B',
    muted: '#6B7280', grid: '#E3DFD2',
    series: ['#FF5A1F','#0E1116','#2B6E5E','#C23B3B','#7A5AF8','#0E7490','#A16207','#9D174D']
  };

  const baseOptions = (overrides = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: { labels: { font: { family: 'IBM Plex Mono', size: 11 }, color: palette.ink } },
      tooltip: { titleFont: { family: 'IBM Plex Mono' }, bodyFont: { family: 'IBM Plex Mono' } }
    },
    scales: {
      x: { grid: { color: palette.grid }, ticks: { font: { family: 'IBM Plex Mono', size: 10 } } },
      y: { grid: { color: palette.grid }, ticks: { font: { family: 'IBM Plex Mono', size: 10 } } }
    },
    ...overrides
  });

  function makeChart(canvas, config) {
    if (canvas._chartInstance) canvas._chartInstance.destroy();
    const c = new Chart(canvas.getContext('2d'), config);
    canvas._chartInstance = c;
    return c;
  }

  function caracteristicaExternaChart(canvas, rows) {
    return makeChart(canvas, {
      type: 'line',
      data: {
        labels: rows.map(r => r.n),
        datasets: [
          { label: 'Pe [kW]', data: rows.map(r => r.Pe), borderColor: palette.series[0], yAxisID: 'y', tension: .3, pointRadius: 0 },
          { label: 'Me [daNm]', data: rows.map(r => r.Me), borderColor: palette.series[1], yAxisID: 'y1', tension: .3, pointRadius: 0 }
        ]
      },
      options: baseOptions({
        scales: {
          x: { title: { display: true, text: 'n [rot/min]', font: { family: 'IBM Plex Mono', size: 11 } }, grid: { color: palette.grid } },
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Pe [kW]' }, grid: { color: palette.grid } },
          y1: { type: 'linear', position: 'right', title: { display: true, text: 'Me [daNm]' }, grid: { drawOnChartArea: false } }
        }
      })
    });
  }

  function fierastrauChart(canvas, treptePopulate) {
    const datasets = treptePopulate.map((t, i) => ({
      label: `Treapta ${i + 1}`,
      data: t.rows.map(r => ({ x: r.n, y: r.v })),
      borderColor: palette.series[i % palette.series.length],
      backgroundColor: 'transparent',
      tension: .15,
      pointRadius: 0
    }));
    return makeChart(canvas, {
      type: 'line',
      data: { datasets },
      options: baseOptions({
        scales: {
          x: { type: 'linear', title: { display: true, text: 'n [rot/min]' }, grid: { color: palette.grid } },
          y: { title: { display: true, text: 'v [m/s]' }, grid: { color: palette.grid } }
        }
      })
    });
  }

  function tractiuneChart(canvas, treptePopulate) {
    const datasets = treptePopulate.map((t, i) => ({
      label: `Treapta ${i + 1}`,
      data: t.rows.map(r => ({ x: r.v, y: r.FR })),
      borderColor: palette.series[i % palette.series.length],
      backgroundColor: 'transparent',
      tension: .25,
      pointRadius: 0
    }));
    return makeChart(canvas, {
      type: 'line',
      data: { datasets },
      options: baseOptions({
        scales: {
          x: { type: 'linear', title: { display: true, text: 'v [m/s]' }, grid: { color: palette.grid } },
          y: { title: { display: true, text: 'FR [N]' }, grid: { color: palette.grid } }
        }
      })
    });
  }

  function putereChart(canvas, treptePopulate) {
    const datasets = treptePopulate.map((t, i) => ({
      label: `Treapta ${i + 1}`,
      data: t.rows.map(r => ({ x: r.v, y: r.PR })),
      borderColor: palette.series[i % palette.series.length],
      backgroundColor: 'transparent',
      tension: .25,
      pointRadius: 0
    }));
    return makeChart(canvas, {
      type: 'line',
      data: { datasets },
      options: baseOptions({
        scales: {
          x: { type: 'linear', title: { display: true, text: 'v [m/s]' } },
          y: { title: { display: true, text: 'PR [W]' } }
        }
      })
    });
  }

  function dinamicaChart(canvas, treptePopulate) {
    const datasets = treptePopulate.map((t, i) => ({
      label: `Treapta ${i + 1}`,
      data: t.rows.map(r => ({ x: r.v, y: r.D })),
      borderColor: palette.series[i % palette.series.length],
      backgroundColor: 'transparent',
      tension: .25,
      pointRadius: 0
    }));
    return makeChart(canvas, {
      type: 'line',
      data: { datasets },
      options: baseOptions({
        scales: {
          x: { type: 'linear', title: { display: true, text: 'v [m/s]' } },
          y: { title: { display: true, text: 'D' } }
        }
      })
    });
  }

  function acceleratieChart(canvas, treptePopulate) {
    const datasets = treptePopulate.map((t, i) => ({
      label: `Treapta ${i + 1}`,
      data: t.rows.filter(r => r.a > 0).map(r => ({ x: r.v, y: r.a })),
      borderColor: palette.series[i % palette.series.length],
      backgroundColor: 'transparent',
      tension: .25,
      pointRadius: 0
    }));
    return makeChart(canvas, {
      type: 'line',
      data: { datasets },
      options: baseOptions({
        scales: {
          x: { type: 'linear', title: { display: true, text: 'v [m/s]' } },
          y: { title: { display: true, text: 'a [m/s²]' } }
        }
      })
    });
  }

  function demarareChart(canvasT, canvasS, demarajRows) {
    const dataT = demarajRows.map(r => ({ x: r.v, y: r.t }));
    const dataS = demarajRows.map(r => ({ x: r.v, y: r.s }));
    makeChart(canvasT, {
      type: 'line',
      data: { datasets: [{ label: 't [s]', data: dataT, borderColor: palette.accent, backgroundColor: 'transparent', pointRadius: 0, tension: .2 }] },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'v [m/s]' } }, y: { title: { display: true, text: 't [s]' } } } })
    });
    makeChart(canvasS, {
      type: 'line',
      data: { datasets: [{ label: 's [m]', data: dataS, borderColor: palette.ok, backgroundColor: 'transparent', pointRadius: 0, tension: .2 }] },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'v [m/s]' } }, y: { title: { display: true, text: 's [m]' } } } })
    });
  }

  function fmt2(n) { return Math.round(n * 100) / 100; }

  function bilantChart(canvasTract, canvasPutere, rows) {
    makeChart(canvasTract, {
      type: 'line',
      data: {
        labels: rows.map(r => fmt2(r.v)),
        datasets: [
          { label: 'FR', data: rows.map(r => r.FR), borderColor: palette.series[0], pointRadius: 0, tension: .2 },
          { label: 'Rr+Rp+Ra', data: rows.map(r => r.sumRez), borderColor: palette.series[2], pointRadius: 0, tension: .2 },
          { label: 'Rp', data: rows.map(r => r.Rp), borderColor: palette.series[3], pointRadius: 0, borderDash: [4,3], tension: .2 },
          { label: 'Rr', data: rows.map(r => r.Rr), borderColor: palette.series[4], pointRadius: 0, borderDash: [2,2], tension: .2 }
        ]
      },
      options: baseOptions({ scales: { x: { title: { display: true, text: 'v [m/s]' } }, y: { title: { display: true, text: 'Forta [N]' } } } })
    });
    makeChart(canvasPutere, {
      type: 'line',
      data: {
        labels: rows.map(r => fmt2(r.v)),
        datasets: [
          { label: 'Pe', data: rows.map(r => r.PR / 0.82), borderColor: palette.series[0], pointRadius: 0, tension: .2 },
          { label: 'PR', data: rows.map(r => r.PR), borderColor: palette.series[1], pointRadius: 0, tension: .2 },
          { label: 'Pr+Pp+Pa', data: rows.map(r => r.sumP), borderColor: palette.series[2], pointRadius: 0, tension: .2 }
        ]
      },
      options: baseOptions({ scales: { x: { title: { display: true, text: 'v [m/s]' } }, y: { title: { display: true, text: 'Putere [W]' } } } })
    });
  }

  function franareChart(canvas, franareRows, opriri) {
    return makeChart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Sf min [m]', data: franareRows.map(r => ({ x: r.v, y: r.Sfmin })), borderColor: palette.accent, backgroundColor:'transparent', tension: .25, pointRadius: 2 },
          { label: 'S oprire [m]', data: opriri.map((o, i) => ({ x: franareRows[i].v, y: o.Sopr })), borderColor: palette.ink, backgroundColor:'transparent', tension: .25, pointRadius: 2 }
        ]
      },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'v [m/s]' } }, y: { title: { display: true, text: 'Distanta [m]' } } } })
    });
  }

  function repartitieFranareChart(canvas, repInc, repDesc) {
    return makeChart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'γ1 incarcat', data: repInc.map(r => ({ x: r.afrel, y: r.gamma1 })), borderColor: palette.series[0], pointRadius: 0, tension: .2 },
          { label: 'γ2 incarcat', data: repInc.map(r => ({ x: r.afrel, y: r.gamma2 })), borderColor: palette.series[1], pointRadius: 0, tension: .2 },
          { label: 'γ1 descarcat', data: repDesc.map(r => ({ x: r.afrel, y: r.gamma1 })), borderColor: palette.series[2], borderDash:[4,3], pointRadius: 0, tension: .2 },
          { label: 'γ2 descarcat', data: repDesc.map(r => ({ x: r.afrel, y: r.gamma2 })), borderColor: palette.series[3], borderDash:[4,3], pointRadius: 0, tension: .2 }
        ]
      },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'a_frel' } }, y: { title: { display: true, text: 'γ' } } } })
    });
  }

  function maniabilitateChart(canvasAngles, canvasBg, rows) {
    makeChart(canvasAngles, {
      type: 'line',
      data: {
        datasets: [
          { label: 'θe', data: rows.map(r => ({ x: r.Rv, y: r.thetaE_deg })), borderColor: palette.series[0], pointRadius: 0, tension: .25 },
          { label: 'θi', data: rows.map(r => ({ x: r.Rv, y: r.thetaI_deg })), borderColor: palette.series[1], pointRadius: 0, tension: .25 },
          { label: 'θ mediu', data: rows.map(r => ({ x: r.Rv, y: r.theta_deg })), borderColor: palette.series[2], pointRadius: 0, tension: .25 }
        ]
      },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'Rv [m]' } }, y: { title: { display: true, text: 'unghi [°]' } } } })
    });
    makeChart(canvasBg, {
      type: 'line',
      data: { datasets: [{ label: 'Fasie gabarit Bg [m]', data: rows.map(r => ({ x: r.Rv, y: r.Bg })), borderColor: palette.accent, pointRadius: 0, tension: .25 }] },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'Rv [m]' } }, y: { title: { display: true, text: 'Bg [m]' } } } })
    });
  }

  function stabilitateChart(canvas, stabRows, betaLabels, key, titleY) {
    const datasets = betaLabels.map((b, bi) => ({
      label: `β=${b}°`,
      data: stabRows.map(r => ({ x: r.Rv, y: r[key][bi] })),
      borderColor: palette.series[bi % palette.series.length],
      pointRadius: 0, tension: .25
    }));
    return makeChart(canvas, {
      type: 'line',
      data: { datasets },
      options: baseOptions({ scales: { x: { type: 'linear', title: { display: true, text: 'Rv [m]' } }, y: { title: { display: true, text: titleY } } } })
    });
  }

  return {
    palette, makeChart, caracteristicaExternaChart, fierastrauChart,
    tractiuneChart, putereChart, dinamicaChart, acceleratieChart,
    demarareChart, bilantChart, franareChart, repartitieFranareChart,
    maniabilitateChart, stabilitateChart
  };
})();
