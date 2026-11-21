/* Terra — datos, gráfica y tabla. JavaScript sin dependencias. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var nf = new Intl.NumberFormat('es-MX');
  var nf1 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* Generador determinista: mismos datos en cada visita. */
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var rand = mulberry32(202611);
  var MONTHS = ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'];
  var FARM_NAMES = ['La Esperanza', 'El Mirador', 'Las Palmas', 'Cerro Alto'];
  var FARM_FACTOR = [1.08, 0.96, 1.02, 0.91];
  var VARIETIES = ['Bourbon', 'Typica', 'Caturra', 'Geisha'];
  var VARIETY_COLORS = ['#2f5b45', '#7fa88e', '#c39a3c', '#bd6540'];

  /* Serie mensual. */
  var months = MONTHS.map(function (name, i) {
    var season = Math.sin((i / 12) * Math.PI * 2 - 1.15) * 235;
    var yieldKg = Math.round(1755 + season + (rand() - 0.5) * 120);
    var tons = Math.round((8.4 + season / 120 + (rand() - 0.5) * 1.9) * 10) / 10;
    var humidity = Math.round((11.7 + (rand() - 0.5) * 1.1) * 10) / 10;
    var price = Math.round((67 + (rand() - 0.5) * 4 + (i / 12) * 2.4) * 100) / 100;
    return { name: name, yield: yieldKg, tons: tons, humidity: humidity, price: price };
  });

  var state = { range: 12, variety: 'Todas', sortKey: 'id', sortDir: 1 };

  function sum(list, key) {
    return list.reduce(function (total, item) { return total + item[key]; }, 0);
  }
  function avg(list, key) {
    return sum(list, key) / list.length;
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function signed(value, digits) {
    var formatted = digits === 2 ? nf2.format(Math.abs(value)) : nf1.format(Math.abs(value));
    return (value >= 0 ? '+' : '−') + formatted;
  }

  /* Indicadores ---------------------------------------------------------- */
  var kpiHost = document.getElementById('kpis');
  var firstHalf = months.slice(0, 6);
  var secondHalf = months.slice(6);

  var kpis = [
    {
      label: 'Producción total',
      value: nf1.format(sum(months, 'tons')),
      unit: 't',
      delta: ((sum(secondHalf, 'tons') / sum(firstHalf, 'tons')) - 1) * 100,
      series: months.map(function (m) { return m.tons; }),
      good: 1
    },
    {
      label: 'Rendimiento medio',
      value: nf.format(Math.round(avg(months, 'yield'))),
      unit: 'kg/ha',
      delta: ((avg(secondHalf, 'yield') / avg(firstHalf, 'yield')) - 1) * 100,
      series: months.map(function (m) { return m.yield; }),
      good: 1
    },
    {
      label: 'Humedad media',
      value: nf1.format(avg(months, 'humidity')),
      unit: '%',
      delta: ((avg(secondHalf, 'humidity') / avg(firstHalf, 'humidity')) - 1) * 100,
      series: months.map(function (m) { return m.humidity; }),
      good: -1
    },
    {
      label: 'Precio medio',
      value: '$' + nf2.format(avg(months, 'price')),
      unit: '/kg',
      delta: ((avg(secondHalf, 'price') / avg(firstHalf, 'price')) - 1) * 100,
      series: months.map(function (m) { return m.price; }),
      good: 1
    }
  ];

  function sparkline(series) {
    var width = 78;
    var height = 26;
    var min = Math.min.apply(null, series);
    var max = Math.max.apply(null, series);
    var span = max - min || 1;
    var points = series.map(function (value, i) {
      return {
        x: (i / (series.length - 1)) * width,
        y: height - 2 - ((value - min) / span) * (height - 4)
      };
    });
    var d = points.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + nf2.format(p.x).replace(/,/g, '.') + ',' + nf2.format(p.y).replace(/,/g, '.');
    }).join(' ');
    var last = points[points.length - 1];
    return '<svg class="kpi__spark" viewBox="0 0 ' + width + ' ' + height + '" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="#2f5b45" stroke-width="1.1"/>' +
      '<circle cx="' + last.x + '" cy="' + last.y + '" r="2" fill="#bd6540"/>' +
      '</svg>';
  }

  if (kpiHost) {
    kpiHost.innerHTML = kpis.map(function (kpi) {
      var isGood = kpi.delta * kpi.good >= 0;
      var arrow = Math.abs(kpi.delta) < 0.05 ? '→' : kpi.delta >= 0 ? '▲' : '▼';
      return '<article class="kpi">' +
        '<p class="kpi__label mono">' + kpi.label + '</p>' +
        '<p class="kpi__value">' + kpi.value + ' <small>' + kpi.unit + '</small></p>' +
        '<div class="kpi__foot">' +
          '<span class="kpi__delta' + (isGood ? '' : ' is-down') + '">' +
            arrow + ' ' + nf1.format(Math.abs(kpi.delta)) + '%' +
            ' <span>vs. semestre previo</span>' +
          '</span>' + sparkline(kpi.series) +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* Gráfica de rendimiento ----------------------------------------------- */
  var chart = document.getElementById('chart');
  var wrap = document.getElementById('chart-wrap');
  var tip = document.getElementById('tip');
  var chartData = [];

  function svgNode(tag, attrs, text) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function smoothPath(points) {
    if (!points.length) return '';
    var d = 'M' + points[0].x + ',' + points[0].y;
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  function drawChart() {
    if (!chart) return;
    var data = months.slice(12 - state.range);
    var W = 880;
    var H = 330;
    var m = { top: 18, right: 16, bottom: 34, left: 48 };
    var plotW = W - m.left - m.right;
    var plotH = H - m.top - m.bottom;
    var yMin = 1400;
    var yMax = 2200;
    var stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

    function xAt(i) { return m.left + i * stepX; }
    function yAt(value) { return m.top + plotH - ((value - yMin) / (yMax - yMin)) * plotH; }

    chart.innerHTML = '';

    var defs = svgNode('defs');
    var grad = svgNode('linearGradient', { id: 'area', x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(svgNode('stop', { offset: '0%', 'stop-color': '#2f5b45', 'stop-opacity': '.16' }));
    grad.appendChild(svgNode('stop', { offset: '100%', 'stop-color': '#2f5b45', 'stop-opacity': '0' }));
    defs.appendChild(grad);
    chart.appendChild(defs);

    for (var value = yMin; value <= yMax; value += 200) {
      var y = yAt(value);
      chart.appendChild(svgNode('line', {
        x1: m.left, y1: y, x2: W - m.right, y2: y,
        stroke: value === 1800 ? '#bd6540' : '#d8d0c0',
        'stroke-width': '1',
        'stroke-dasharray': value === 1800 ? '4 4' : '0',
        opacity: value === 1800 ? '.75' : '.6'
      }));
      chart.appendChild(svgNode('text', {
        x: m.left - 10, y: y + 3,
        'text-anchor': 'end',
        fill: '#9b9588',
        'font-family': "'IBM Plex Mono', monospace",
        'font-size': '8.5',
        'letter-spacing': '.04em'
      }, nf.format(value)));
    }

    var points = data.map(function (item, i) {
      return { x: xAt(i), y: yAt(item.yield), item: item };
    });

    var area = smoothPath(points) + ' L' + points[points.length - 1].x + ',' + (m.top + plotH) +
      ' L' + points[0].x + ',' + (m.top + plotH) + ' Z';
    chart.appendChild(svgNode('path', { d: area, fill: 'url(#area)' }));
    chart.appendChild(svgNode('path', {
      d: smoothPath(points),
      fill: 'none',
      stroke: '#2f5b45',
      'stroke-width': '2',
      'stroke-linecap': 'round'
    }));

    points.forEach(function (point, i) {
      chart.appendChild(svgNode('text', {
        x: point.x,
        y: H - 12,
        'text-anchor': 'middle',
        fill: '#9b9588',
        'font-family': "'IBM Plex Mono', monospace",
        'font-size': '8.5',
        'letter-spacing': '.06em'
      }, data[i].name));
    });

    var hoverLine = svgNode('line', {
      x1: 0, y1: m.top, x2: 0, y2: m.top + plotH,
      stroke: '#1d1c18', 'stroke-width': '1', opacity: '0'
    });
    var hoverDot = svgNode('circle', {
      cx: 0, cy: 0, r: '4', fill: '#faf8f2', stroke: '#2f5b45', 'stroke-width': '2', opacity: '0'
    });
    var overlay = svgNode('rect', {
      x: m.left, y: m.top, width: plotW, height: plotH,
      fill: 'transparent', style: 'cursor: crosshair'
    });
    chart.appendChild(hoverLine);
    chart.appendChild(hoverDot);
    chart.appendChild(overlay);

    chartData = { data: data, points: points, m: m, W: W, H: H, hoverLine: hoverLine, hoverDot: hoverDot };

    function move(event) {
      var rect = chart.getBoundingClientRect();
      var scale = W / rect.width;
      var x = (event.clientX - rect.left) * scale;
      var i = clamp(Math.round((x - m.left) / (stepX || 1)), 0, data.length - 1);
      var point = points[i];
      hoverLine.setAttribute('x1', point.x);
      hoverLine.setAttribute('x2', point.x);
      hoverLine.setAttribute('opacity', '.35');
      hoverDot.setAttribute('cx', point.x);
      hoverDot.setAttribute('cy', point.y);
      hoverDot.setAttribute('opacity', '1');

      var diff = point.item.yield - 1800;
      tip.hidden = false;
      tip.innerHTML = '<strong>' + point.item.name + '</strong> ' + nf.format(point.item.yield) + ' kg/ha<br>' +
        (diff >= 0 ? '+' : '−') + nf.format(Math.abs(diff)) + ' vs. objetivo';
      var wrapRect = wrap.getBoundingClientRect();
      var left = rect.left - wrapRect.left + (point.x / W) * rect.width;
      var top = rect.top - wrapRect.top + (point.y / H) * rect.height;
      tip.style.left = clamp(left, 70, wrapRect.width - 70) + 'px';
      tip.style.top = top + 'px';
    }

    function leave() {
      hoverLine.setAttribute('opacity', '0');
      hoverDot.setAttribute('opacity', '0');
      tip.hidden = true;
    }

    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerleave', leave);
    overlay.addEventListener('pointerdown', move);
  }

  drawChart();

  document.querySelectorAll('[data-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-range]').forEach(function (other) {
        other.classList.toggle('is-active', other === button);
      });
      state.range = Number(button.getAttribute('data-range'));
      drawChart();
    });
  });

  /* Fincas --------------------------------------------------------------- */
  var farmHost = document.getElementById('farms');
  var totalTons = sum(months, 'tons');
  var factorSum = FARM_FACTOR.reduce(function (a, b) { return a + b; }, 0);
  var farmTotals = FARM_FACTOR.map(function (factor) {
    return totalTons * (factor / factorSum);
  });
  var farmSum = totalTons;
  var farmMax = Math.max.apply(null, farmTotals);

  if (farmHost) {
    farmHost.innerHTML = FARM_NAMES.map(function (name, i) {
      var tons = farmTotals[i];
      return '<div class="farm">' +
        '<span class="farm__name">' + name + '</span>' +
        '<span class="farm__value">' + nf1.format(tons) + ' t · ' + Math.round((tons / farmSum) * 100) + '%</span>' +
        '<span class="farm__track"><span class="farm__bar" data-width="' + Math.round((tons / farmMax) * 100) + '"></span></span>' +
      '</div>';
    }).join('');
  }

  /* Variedades ----------------------------------------------------------- */
  var varietyShares = [37.4, 26.8, 23.1, 12.7];
  var stack = document.getElementById('variety-stack');
  var legend = document.getElementById('variety-legend');

  if (stack) {
    stack.innerHTML = varietyShares.map(function (share, i) {
      return '<span data-width="' + share + '" style="background:' + VARIETY_COLORS[i] + '"></span>';
    }).join('');
  }
  if (legend) {
    legend.innerHTML = VARIETIES.map(function (name, i) {
      return '<li><i style="background:' + VARIETY_COLORS[i] + '"></i>' + name +
        '<b>' + nf1.format(varietyShares[i]) + '%</b></li>';
    }).join('');
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.querySelectorAll('[data-width]').forEach(function (node) {
        node.style.width = node.getAttribute('data-width') + '%';
      });
    });
  });

  /* Lotes ---------------------------------------------------------------- */
  var STATUS = [
    { name: 'Listo', className: '' },
    { name: 'En secado', className: 'status--dry' },
    { name: 'Muestra', className: 'status--sample' }
  ];

  var lots = Array.from({ length: 26 }, function (_, i) {
    var farmIndex = Math.floor(rand() * FARM_NAMES.length);
    var varietyIndex = Math.floor(rand() * VARIETIES.length);
    var statusIndex = Math.floor(rand() * STATUS.length);
    return {
      id: 'L-26' + String(i + 1).padStart(2, '0'),
      farm: FARM_NAMES[farmIndex],
      variety: VARIETIES[varietyIndex],
      kg: Math.round(160 + rand() * 1040),
      humidity: Math.round((10.4 + rand() * 2.9) * 10) / 10,
      status: STATUS[statusIndex].name,
      statusClass: STATUS[statusIndex].className
    };
  });

  var chips = document.getElementById('chips');
  var body = document.getElementById('lots-body');
  var empty = document.getElementById('lots-empty');
  var count = document.getElementById('lots-count');

  if (chips) {
    chips.innerHTML = ['Todas'].concat(VARIETIES).map(function (name) {
      return '<button type="button" data-variety="' + name + '"' +
        (name === 'Todas' ? ' class="is-active"' : '') + '>' + name + '</button>';
    }).join('');

    chips.addEventListener('click', function (event) {
      var button = event.target.closest('[data-variety]');
      if (!button) return;
      state.variety = button.getAttribute('data-variety');
      chips.querySelectorAll('button').forEach(function (other) {
        other.classList.toggle('is-active', other === button);
      });
      renderLots();
    });
  }

  document.querySelectorAll('[data-sort]').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.getAttribute('data-sort');
      if (state.sortKey === key) state.sortDir *= -1;
      else {
        state.sortKey = key;
        state.sortDir = 1;
      }
      document.querySelectorAll('thead th').forEach(function (th) { th.removeAttribute('aria-sort'); });
      var th = button.closest('th');
      if (th) th.setAttribute('aria-sort', state.sortDir === 1 ? 'ascending' : 'descending');
      renderLots();
    });
  });

  function visibleLots() {
    var list = state.variety === 'Todas'
      ? lots.slice()
      : lots.filter(function (lot) { return lot.variety === state.variety; });

    list.sort(function (a, b) {
      var av = a[state.sortKey];
      var bv = b[state.sortKey];
      if (typeof av === 'string') return av.localeCompare(bv, 'es') * state.sortDir;
      return (av - bv) * state.sortDir;
    });
    return list;
  }

  function renderLots() {
    if (!body) return;
    var list = visibleLots();

    body.innerHTML = list.map(function (lot) {
      return '<tr>' +
        '<td><span class="lot-id">' + lot.id + '</span></td>' +
        '<td>' + lot.farm + '</td>' +
        '<td>' + lot.variety + '</td>' +
        '<td class="num">' + nf.format(lot.kg) + '</td>' +
        '<td class="num">' + nf1.format(lot.humidity) + '%</td>' +
        '<td><span class="status ' + lot.statusClass + '"><i></i>' + lot.status + '</span></td>' +
      '</tr>';
    }).join('');

    if (empty) empty.hidden = list.length > 0;
    if (count) count.textContent = list.length + ' de ' + lots.length + ' lotes · temporada 2025—26';
  }

  renderLots();

  /* Exportación ---------------------------------------------------------- */
  var exportButton = document.getElementById('export');
  if (exportButton) {
    exportButton.addEventListener('click', function () {
      var rows = [['Lote', 'Finca', 'Variedad', 'kg', 'Humedad', 'Estado']];
      visibleLots().forEach(function (lot) {
        rows.push([lot.id, lot.farm, lot.variety, lot.kg, lot.humidity, lot.status]);
      });
      var csv = rows.map(function (row) {
        return row.map(function (cell) {
          var value = String(cell);
          return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
        }).join(',');
      }).join('\r\n');

      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'terra-lotes.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  /* Navegación lateral --------------------------------------------------- */
  var links = document.querySelectorAll('.side__nav a');
  links.forEach(function (link) {
    link.addEventListener('click', function () {
      links.forEach(function (other) { other.classList.toggle('is-active', other === link); });
    });
  });
})();
