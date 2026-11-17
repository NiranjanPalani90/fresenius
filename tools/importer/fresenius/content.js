/* eslint-disable */
/* global WebImporter */
/**
 * Content converters for the Fresenius prototype.
 * Each converter receives a source element and returns authored nodes
 * (default content and/or block tables). Detection is purely class/DOM based.
 */

// prototype routes -> site paths
const ROUTES = {
  home: '/',
  investors: '/investors',
  results: '/investors/results-q3-2026',
  dashboard: '/investors/dashboard',
  'dashboard/askfre': '/investors/dashboard#askfre',
  about: '/about',
  businesses: '/our-businesses',
  impact: '/impact',
  newsroom: '/newsroom',
  careers: '/careers',
  fhs: '/newsroom/fresenius-reorganizes-hospital-services',
  explain: '/explain/helios',
  'explain/helios': '/explain/helios',
  'explain/kabi': '/explain/kabi',
  howitworks: '/about/ai-assisted-views',
  'howitworks/ir': '/about/ai-assisted-views',
  'howitworks/emp': '/about/ai-assisted-views-employees',
};

// prototype data-* actions -> authorable action links handled by the site code
const ACTIONS = {
  'data-askfre': '#askfre',
  'data-csv': '#download-csv',
  'data-share': '#copy-share-link',
  'data-save': '#save-view',
  'data-sharepage': '#share-page',
  'data-one': '#open-intranet',
};

const PALETTES = {
  '#00285f': 'blue', '#0d408c': 'light', '#003373': 'kabi', '#004033': 'helios', '#003359': 'teal',
};

export function mapHref(a) {
  if (!a) return '#';
  const action = Object.keys(ACTIONS).find((k) => a.hasAttribute(k));
  if (action) return ACTIONS[action];
  if (a.hasAttribute('data-scroll2')) return `#${a.getAttribute('data-scroll2')}`;
  const href = a.getAttribute('data-href') || a.getAttribute('href');
  if (!href || href.startsWith('#nohref')) return '#';
  if (!href.startsWith('#')) return href;
  const [route, anchor] = href.slice(1).split('@');
  const path = ROUTES[route];
  if (!path) return '#';
  return anchor ? `${path}#${anchor}` : path;
}

/** true when a prototype element links somewhere (or triggers an action) */
export const linked = (a) => Object.keys(ACTIONS).some((k) => a.hasAttribute(k)) || mapHref(a) !== '#';

export function palette(el) {
  const bg = el && (el.matches('.flow-bg') ? el : el.querySelector(':scope > .flow-bg, .flow-bg'));
  if (!bg) return '';
  const style = bg.getAttribute('style') || '';
  let hex = (style.match(/#[0-9a-f]{6}/i) || [])[0];
  const rgb = style.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!hex && rgb) hex = `#${rgb.slice(1, 4).map((v) => (+v).toString(16).padStart(2, '0')).join('')}`;
  return (hex && PALETTES[hex.toLowerCase()]) || 'blue';
}

export const text = (el) => {
  if (!el) return '';
  const c = el.cloneNode(true);
  c.querySelectorAll('svg, .srcchips, .urlp, .sc').forEach((n) => n.remove());
  return c.textContent.replace(/\s+/g, ' ').trim();
};

export function h(document, tag, content) {
  const el = document.createElement(tag);
  if (content instanceof Node) el.append(content);
  else if (Array.isArray(content)) el.append(...content);
  else if (content !== undefined) el.textContent = content;
  return el;
}

export const block = (document, name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });

/** a prototype .btn -> <p><strong|em><a></a></strong|em></p> */
export function button(document, btn) {
  const a = h(document, 'a', text(btn));
  a.href = mapHref(btn);
  const cls = btn.className;
  let inner = a;
  if (/\bprimary\b/.test(cls)) inner = h(document, 'strong', a);
  else if (/\bsecondary\b/.test(cls)) inner = h(document, 'em', a);
  return h(document, 'p', inner);
}

export const source = (document, el) => h(document, 'p', `Source: ${text(el)}`);

/** list rows -> <ul><li>lead<br><strong><a>title</a></strong><br>meta</li></ul> */
export function listRows(document, rows) {
  const ul = document.createElement('ul');
  rows.forEach((r) => {
    const li = document.createElement('li');
    const lead = r.querySelector('.lead');
    const t = r.querySelector('.t');
    const m = r.querySelector('.m');
    if (lead) li.append(text(lead), document.createElement('br'));
    const title = h(document, 'strong');
    if (linked(r)) {
      const a = h(document, 'a', text(t));
      a.href = mapHref(r);
      title.append(a);
    } else title.textContent = text(t);
    li.append(title);
    if (m && text(m)) li.append(document.createElement('br'), text(m));
    ul.append(li);
  });
  return ul;
}

/** tags row -> source paragraphs, code tags, or a tags block */
function tagsRow(document, el) {
  const out = [];
  const srcs = [...el.querySelectorAll(':scope > .src')];
  if (srcs.length && srcs.length === el.children.length) return srcs.map((s) => source(document, s));
  const label = el.querySelector(':scope > .label');
  const tags = [...el.querySelectorAll(':scope > .tag')];
  const p = document.createElement('p');
  if (label) p.append(`${text(label)} `);
  tags.forEach((t, i) => {
    const code = h(document, 'code', text(t));
    if (i) p.append(' ');
    p.append(t.classList.contains('selected') ? h(document, 'strong', code) : code);
  });
  out.push(p);
  return out;
}

/** KPI tiles -> Key Figures block. Brand-highlighted value in <em>. */
export function keyFigures(document, cols) {
  const cells = cols.map((c) => {
    const k = c.querySelector('.kpi');
    const v = text(k.querySelector('.v'));
    const src = c.querySelector(':scope > .src');
    return [
      text(k.querySelector('.o')),
      k.classList.contains('brand') ? h(document, 'em', v) : v,
      text(k.querySelector('.c')),
      src ? text(src) : '',
    ];
  });
  return block(document, 'Key Figures', cells);
}

export function contactBlock(document, contacts) {
  return block(document, 'Contact', contacts.map((c) => {
    const actions = [...c.querySelectorAll('.btn')].map((b) => {
      const p = button(document, b);
      const a = p.querySelector('a');
      if (/message/i.test(a.textContent)) {
        const mail = text(c.querySelector('.body-s')).match(/[\w.-]+@[\w.-]+/);
        a.href = `mailto:${mail ? mail[0] : 'ir-fre@fresenius.com'}`;
      }
      return p;
    });
    return [
      text(c.querySelector('.overline')),
      text(c.querySelector('.avatar')),
      h(document, 'p', h(document, 'strong', text(c.querySelector('.label')))),
      text(c.querySelector('.body-s')),
      actions,
    ];
  }));
}

/** cards (any flavour) */
export function cardsBlock(document, variant, cards) {
  const rows = cards.map((card) => {
    const content = [];
    const media = card.matches('.flow') ? card : card.querySelector('.media.flow');
    card.querySelectorAll(':scope > *, :scope > .bd > *').forEach((n) => {
      if (n.matches('.flow-bg, .media, .bd, .go2')) return;
      if (n.matches('.overline, .tag')) content.push(h(document, 'h6', text(n)));
      else if (n.matches('.h2, .h4') || (variant === 'tile' && n.matches('.label'))) content.push(h(document, 'h3', text(n)));
      else if (n.matches('.label') && /→/.test(n.textContent)) {
        const a = h(document, 'a', text(n).replace(/\s*→\s*$/, ''));
        a.href = mapHref(card);
        content.push(h(document, 'p', a));
      } else if (n.matches('.label')) content.push(h(document, 'p', h(document, 'strong', text(n))));
      else if (text(n)) content.push(h(document, 'p', text(n)));
    });
    // whole-card link without visible label: link the title
    const hasLink = content.some((n) => n.querySelector && n.querySelector('a'));
    if (!hasLink && linked(card)) {
      const title = content.find((n) => n.tagName === 'H3') || content[0];
      if (title) {
        const a = h(document, 'a', title.textContent);
        a.href = mapHref(card);
        title.textContent = '';
        title.append(a);
      }
    }
    return media ? [palette(media), content] : [content];
  });
  return block(document, `Cards (${variant})`, rows);
}

/** Generic content flow inside glass panels, sections and hero copy */
export function flowContent(document, el, out = []) {
  [...el.children].forEach((n) => {
    if (n.matches('.flow-bg, .glow, .srcnote, .go2')) return;
    if (n.matches('.overline')) out.push(h(document, 'h6', text(n)));
    else if (n.matches('.h1, h1')) out.push(h(document, 'h1', text(n)));
    else if (n.matches('.h2, h2')) out.push(h(document, 'h2', text(n)));
    else if (n.matches('.h4')) out.push(h(document, 'h3', text(n)));
    else if (n.matches('.label')) out.push(h(document, 'p', h(document, 'strong', text(n))));
    else if (n.matches('.btn')) out.push(button(document, n));
    else if (n.matches('.src')) out.push(source(document, n));
    else if (n.matches('.tag')) out.push(h(document, 'p', h(document, 'strong', h(document, 'code', text(n)))));
    else if (n.matches('.lrow')) {
      const prev = out[out.length - 1];
      const ul = listRows(document, [n]);
      if (prev && prev.tagName === 'UL' && prev.dataset.rows) prev.append(...ul.children);
      else { ul.dataset.rows = '1'; out.push(ul); }
    } else if (n.matches('.tags')) out.push(...tagsRow(document, n));
    else if (n.matches('.kpi-col')) out.push(keyFigures(document, [n]));
    else if (n.matches('.contact')) out.push(contactBlock(document, [n]));
    else if (n.matches('.tile')) out.push(cardsBlock(document, 'tile', [n]));
    else if (n.matches('table.guid')) out.push(tableBlock(document, n));
    else if (n.matches('.chart-box')) out.push(chartBlock(document, n));
    else if (n.matches('.legend')) { /* legend is generated by the chart block */ } else if (n.matches('.ask-form')) out.push(askBlock(document, n));
    else if (n.matches('.ask')) { /* standalone inputs handled by search-form */ } else if (n.matches('p')) {
      const t = text(n);
      if (!t) return;
      if (n.matches('.body-s.faint')) out.push(h(document, 'p', h(document, 'em', t)));
      else if (/^[“"]/.test(t) && n.matches('.body-l')) out.push(h(document, 'blockquote', h(document, 'p', t)));
      else out.push(h(document, 'p', t));
    } else if (n.matches('div, span, section')) {
      // header rows (title + action), button rows, nested columns
      if (n.matches('.chart-box') || n.id === 'chart') out.push(chartBlock(document, n));
      else flowContent(document, n, out);
    }
  });
  out.forEach((n) => { if (n.dataset) delete n.dataset.rows; });
  return out;
}

export function tableBlock(document, table) {
  const rows = [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => {
    const t = text(c);
    return c.matches('.u, .t') && t ? h(document, 'strong', t) : t;
  }));
  return block(document, 'Table (guidance)', rows);
}

export function chartBlock(document, el) {
  const t = el.querySelector('table.chart-data');
  const rows = [...t.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => text(c)));
  rows.push(['Corridor', t.dataset.corridorKabi, t.dataset.corridorHelios, '', '']);
  rows.push(['Highlight', t.dataset.highlight, '', '', '']);
  return block(document, 'Chart', rows);
}

export function askBlock(document, form) {
  const input = form.querySelector('input');
  const hints = [...form.querySelectorAll('[data-fill]')];
  const glassy = form.querySelector('.ask.glassy');
  const rows = [[input.getAttribute('placeholder')]];
  hints.forEach((b) => rows.push([text(b), decodeURIComponent(b.getAttribute('data-fill'))]));
  return block(document, glassy ? 'Ask (glassy)' : 'Ask', rows);
}

export function searchFormBlock(document, el) {
  const rows = [...el.querySelectorAll('[data-tag=label]')].map((l) => [
    text(l.querySelector('.label')),
    l.querySelector('input').getAttribute('placeholder'),
    l.querySelector('svg') ? 'search' : '',
  ]);
  const btn = el.querySelector(':scope > .btn');
  if (btn) rows.push([text(btn)]);
  return block(document, 'Search Form', rows);
}

export function tagsBlock(document, el, variant) {
  const label = el.querySelector(':scope > .label');
  const ul = document.createElement('ul');
  el.querySelectorAll(':scope > .tag').forEach((t) => {
    const li = document.createElement('li');
    let inner = text(t).replace(/\s*\+$/, '');
    if (t.dataset.tag === 'a' || t.tagName === 'A') {
      const a = h(document, 'a', inner);
      a.href = mapHref(t);
      inner = a;
    }
    li.append(t.classList.contains('subtle') ? h(document, 'em', inner) : inner);
    ul.append(li);
  });
  const rows = [];
  if (label) rows.push([text(label)]);
  rows.push([ul]);
  return block(document, variant ? `Tags (${variant})` : 'Tags', rows);
}

export function noticeBlock(document, el) {
  const link = el.querySelector(':scope > [data-tag=a], :scope > a');
  const a = h(document, 'a', text(link).replace(/\s*→\s*$/, ''));
  a.href = mapHref(link);
  return block(document, 'Notice', [[
    h(document, 'p', h(document, 'strong', text(el.querySelector('.ti')))),
    h(document, 'p', text(el.querySelector('.tx .body-s'))),
    h(document, 'p', a),
  ]]);
}

export function sectionNavBlock(document, nav) {
  const ul = document.createElement('ul');
  nav.querySelectorAll('[data-scroll]').forEach((b) => {
    const a = h(document, 'a', text(b));
    a.href = `#${b.dataset.scroll}`;
    ul.append(h(document, 'li', a));
  });
  return block(document, 'Section Nav', [[ul]]);
}

export function breadcrumbBlock(document, crumb) {
  const parts = text(crumb).split('›').map((t) => t.trim()).filter(Boolean);
  return block(document, 'Breadcrumb', [parts]);
}

export function questionBlock(document, el) {
  const q = text(el.querySelector('p')).replace(/^[“"]|[”"]$/g, '');
  const edit = el.querySelector('[data-edit], [data-edit2]');
  const a = h(document, 'a', text(edit));
  a.href = edit && edit.hasAttribute('data-edit2') ? ROUTES.fhs : ROUTES.investors;
  return block(document, 'Question', [[q], [a]]);
}

export function heroBlock(document, el) {
  const variant = el.matches('.flow') ? `flow, ${palette(el)}` : '';
  const content = [];
  let ask = null;
  [...el.children].forEach((n) => {
    if (n.matches('.ask-form')) ask = n;
    else content.push(...flowContent(document, h(document, 'div', n.cloneNode(true))));
  });
  const rows = [[content]];
  if (ask) {
    rows.push(['Ask', ask.querySelector('input').getAttribute('placeholder')]);
  }
  return block(document, variant ? `Hero (${variant})` : 'Hero', rows);
}

export function stageBlock(document, el) {
  const rows = [...el.querySelectorAll('.stage-slide')].map((s) => {
    const content = flowContent(document, s);
    const img = s.dataset.img === 'yes' ? h(document, 'img') : '';
    if (img) { img.src = './media/fresenius/stage-wuxi.jpg'; img.alt = 'Biopharmaceutical laboratory'; }
    return [img, content, s.dataset.tab];
  });
  const ask = el.querySelector('.ask-form input');
  if (ask) rows.push(['Ask', ask.getAttribute('placeholder'), '']);
  return block(document, 'Stage', rows);
}
