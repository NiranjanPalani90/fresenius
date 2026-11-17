/*
 * Line chart for quarterly KPIs (e.g. EBIT margin by segment).
 * Rows: header row (label | series… | Source), one row per period,
 * optional "Corridor" row (min–max per series) and "Highlight" row (periods to mark).
 * The first two series are drawn; further series appear in the tooltip only.
 * Listens to "chart:toggle" events (from the Tags block) to show/hide series.
 */
const COLORS = ['#002b8f', '#00875f'];
const LEGEND_COLORS = ['var(--brand)', 'var(--helios)'];
const NS = 'http://www.w3.org/2000/svg';

const num = (t) => parseFloat(String(t).replace(',', '.'));
const range = (t) => (t || '').split(/[–-]/).map(num).filter((n) => !Number.isNaN(n));

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function readData(block) {
  const rows = [...block.children].map((r) => [...r.children].map((c) => c.textContent.trim()));
  const [header, ...body] = rows;
  const srcIdx = header.findIndex((h) => /^source$/i.test(h));
  const seriesNames = header.slice(1, srcIdx > 0 ? srcIdx : undefined);
  const corridorRow = body.find((r) => /^corridor$/i.test(r[0]));
  const highlightRow = body.find((r) => /^highlight$/i.test(r[0]));
  const data = body.filter((r) => r !== corridorRow && r !== highlightRow);
  return {
    header,
    rows: data,
    periods: data.map((r) => r[0]),
    sources: data.map((r) => (srcIdx > 0 ? r[srcIdx] : '')),
    highlight: highlightRow ? highlightRow[1].split(',').map((s) => s.trim()) : [],
    series: seriesNames.map((name, i) => ({
      name,
      key: name.replace(/^fresenius\s+/i, '').toLowerCase(),
      values: data.map((r) => num(r[i + 1])),
      corridor: corridorRow ? range(corridorRow[i + 1]) : [],
      drawn: i < 2,
      visible: i < 2,
      color: COLORS[i],
    })),
  };
}

function draw(block, data) {
  const box = block.querySelector('.chart-box');
  const W = 820; const H = 360; const L = 48; const R = 20; const T = 16; const B = 40;
  const drawn = data.series.filter((s) => s.drawn);
  const all = drawn.flatMap((s) => [...s.values, ...s.corridor]);
  const ymin = Math.floor(Math.min(...all) / 2) * 2;
  const ymax = Math.ceil(Math.max(...all) / 2) * 2;
  const n = data.periods.length;
  const x = (i) => L + 20 + (i * (W - L - R - 40)) / Math.max(n - 1, 1);
  const y = (v) => T + ((ymax - v) / (ymax - ymin)) * (H - T - B);

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': block.dataset.title || 'Chart' });
  for (let g = ymin; g <= ymax; g += 2) {
    svg.append(svgEl('line', {
      x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: '#fff', 'stroke-width': 1.2,
    }));
    const t = svgEl('text', {
      x: L - 10, y: y(g) + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#667085',
    });
    t.textContent = `${g}%`;
    svg.append(t);
  }
  data.periods.forEach((p, i) => {
    if (!data.highlight.includes(p)) return;
    svg.append(svgEl('rect', {
      x: x(i) - 24, y: T, width: 48, height: H - T - B, rx: 10, fill: '#b2bfd1', opacity: 0.22,
    }));
  });
  drawn.forEach((s) => {
    if (!s.visible || s.corridor.length !== 2) return;
    const [lo, hi] = s.corridor;
    svg.append(svgEl('rect', {
      x: L, y: y(hi), width: W - L - R, height: y(lo) - y(hi), fill: s.color, opacity: 0.15,
    }));
  });
  const hits = [];
  drawn.forEach((s, si) => {
    if (!s.visible) return;
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const path = svgEl('path', {
      d: `M${pts.map((p) => p.join(' ')).join(' L')}`, fill: 'none', stroke: s.color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: 'ln',
    });
    svg.append(path);
    pts.forEach((p, i) => {
      svg.append(svgEl('circle', {
        cx: p[0], cy: p[1], r: 5, fill: s.color, stroke: '#fff', 'stroke-width': 2,
      }));
      const label = svgEl('text', {
        x: p[0], y: p[1] + (si === 0 ? -12 : 22), 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: s.color,
      });
      label.textContent = s.values[i].toFixed(1);
      svg.append(label);
      const hit = svgEl('circle', {
        cx: p[0], cy: p[1], r: 16, fill: 'transparent', tabindex: 0, class: 'hit',
      });
      hit.dataset.s = data.series.indexOf(s);
      hit.dataset.i = i;
      svg.append(hit);
      hits.push(hit);
    });
  });
  data.periods.forEach((p, i) => {
    const hl = data.highlight.includes(p);
    const t = svgEl('text', {
      x: x(i), y: H - 12, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': hl ? 600 : 400, fill: hl ? '#002b8f' : '#667085',
    });
    t.textContent = p;
    svg.append(t);
  });

  box.textContent = '';
  box.append(svg);
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('role', 'tooltip');
  box.append(tip);

  svg.querySelectorAll('.ln').forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    p.getBoundingClientRect();
    p.style.transition = 'stroke-dashoffset 1.1s ease-out';
    p.style.strokeDashoffset = 0;
  });

  const show = (hit) => {
    const s = data.series[+hit.dataset.s];
    const i = +hit.dataset.i;
    const extra = data.series.filter((o) => !o.drawn)
      .map((o) => `${o.name}: ${o.values[i].toFixed(1)}%`).join('<br>');
    const corr = s.corridor.length === 2 ? `Corridor: ${s.corridor[0].toFixed(1)}–${s.corridor[1].toFixed(1)}%<br>` : '';
    tip.innerHTML = `<b style="color:${s.color}">${s.name} · ${data.periods[i]}</b><br><span class="tv">${s.values[i].toFixed(1)}%</span> ${block.dataset.unit || ''}<br><span class="tm">${corr}${extra}${extra ? '<br>' : ''}${data.sources[i] ? `Source: ${data.sources[i]}` : ''}</span>`;
    const r = box.getBoundingClientRect();
    const b = hit.getBoundingClientRect();
    tip.style.left = `${Math.min(b.left - r.left + 20, r.width - 200)}px`;
    tip.style.top = `${b.top - r.top - 10}px`;
    tip.classList.add('show');
  };
  hits.forEach((hit) => {
    hit.addEventListener('mouseenter', () => show(hit));
    hit.addEventListener('focus', () => show(hit));
    hit.addEventListener('mouseleave', () => tip.classList.remove('show'));
    hit.addEventListener('blur', () => tip.classList.remove('show'));
  });
}

function buildLegend(data) {
  const legend = document.createElement('div');
  legend.className = 'legend';
  const drawn = data.series.filter((s) => s.drawn);
  drawn.forEach((s, i) => { legend.insertAdjacentHTML('beforeend', `<span><i style="background:${LEGEND_COLORS[i]}"></i>${s.name.replace(/^Fresenius\s+/, '')}</span>`); });
  drawn.forEach((s, i) => {
    if (s.corridor.length !== 2) return;
    legend.insertAdjacentHTML('beforeend', `<span><i class="band" style="background:${LEGEND_COLORS[i]}"></i>${s.name.replace(/^Fresenius\s+/, '')} corridor ${s.corridor[0].toFixed(1)}–${s.corridor[1].toFixed(1)}%</span>`);
  });
  return legend;
}

export default function decorate(block) {
  const data = readData(block);
  block.chartData = data;
  // the heading right before the chart becomes its title, next to the legend
  const wrapper = block.parentElement;
  const prev = wrapper.previousElementSibling;
  const title = prev && prev.lastElementChild && /^H[2-4]$/.test(prev.lastElementChild.tagName)
    ? prev.lastElementChild : null;
  block.dataset.title = title ? title.textContent.trim() : '';
  block.dataset.unit = /margin/i.test(block.dataset.title) ? 'EBIT margin' : '';

  const head = document.createElement('div');
  head.className = 'chart-head';
  if (title) {
    head.append(title);
    if (!prev.children.length) prev.remove();
  }
  head.append(buildLegend(data));

  // accessible fallback: the data as a table
  const table = document.createElement('table');
  table.className = 'chart-table';
  table.innerHTML = `<caption>${block.dataset.title || 'Chart data'}</caption><thead><tr>${data.header.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${data.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;

  const box = document.createElement('div');
  box.className = 'chart-box';
  block.textContent = '';
  block.append(head, box, table);
  draw(block, data);

  document.addEventListener('chart:toggle', (e) => {
    const s = data.series.find((o) => o.key === e.detail.key);
    if (!s) return;
    s.visible = e.detail.visible;
    draw(block, data);
  });
}
