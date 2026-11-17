/* eslint-disable */
/* global WebImporter */
/**
 * Import script for the Fresenius.com relaunch prototype (static snapshots of each view).
 * Sections and blocks are detected purely from the DOM (prototype component classes);
 * nothing depends on the URL, the page type or the order of components.
 *
 * Section model (section metadata "Style"):
 *  - glass            section rendered as a glass panel
 *  - inline           glass panel laid out as one row (text left, actions right)
 *  - column / new-row consecutive "column" sections form a row; "new-row" starts a new row
 *  - fixed            fixed-width (sidebar) column
 *  - heading-bar      page title with the primary action aligned right
 *  - narrow           860px reading width
 * Section metadata "Id" sets the anchor used by the Section Nav block.
 */
import {
  h, block, text, mapHref, palette, flowContent, listRows, keyFigures, contactBlock, cardsBlock,
  askBlock, searchFormBlock, tagsBlock, noticeBlock, sectionNavBlock, breadcrumbBlock,
  questionBlock, heroBlock, stageBlock,
} from './content.js';

class Sections {
  constructor(document) { this.document = document; this.list = []; this.cur = null; }

  open(meta = {}) { this.cur = { nodes: [], meta }; this.list.push(this.cur); return this.cur; }

  add(...nodes) { if (!this.cur) this.open(); this.cur.nodes.push(...nodes.filter(Boolean)); }

  close() { this.cur = null; }

  own(meta, ...nodes) { this.close(); this.open(meta); this.add(...nodes); this.close(); }

  render(main) {
    const { document } = this;
    const out = this.list.filter((s) => s.nodes.length);
    out.forEach((s, i) => {
      main.append(...s.nodes);
      const meta = {};
      if (s.meta.style && s.meta.style.length) meta.Style = [...new Set(s.meta.style)].join(', ');
      if (s.meta.id) meta.Id = s.meta.id;
      if (Object.keys(meta).length) main.append(block(document, 'Section Metadata', meta));
      if (i < out.length - 1) main.append(document.createElement('hr'));
    });
  }
}

const styleOf = (el) => (el.getAttribute('style') || '').replace(/\s/g, '');
const isNarrow = (el) => /max-width:860px/.test(styleOf(el));
const isInline = (el) => /flex-direction:row/.test(styleOf(el));
const isFixed = (el) => /\bfixed-\d+/.test(el.className);
const isTint = (el) => /brand-tint/.test(styleOf(el));

const CARD_ROWS = [
  ['.aud-card', 'audience'], ['.teaser', 'teaser'], ['.glass.story', 'story'],
  ['.img-card', 'image'], ['.tile', 'tile'],
];

/** a glass panel (or other container) as a section with its content flow */
function glassSection(S, el, extra = []) {
  const { document } = S;
  const style = ['glass', ...extra];
  if (isInline(el)) style.push('inline');
  if (isNarrow(el)) style.push('narrow');
  if (el.querySelector('[data-edit], [data-edit2]')) {
    S.own({ style: isNarrow(el) ? ['narrow'] : [] }, questionBlock(document, el));
    return;
  }
  if (el.querySelector(':scope > [data-tag=label] .ask')) {
    S.own({ style: style.filter((s) => s !== 'inline') }, searchFormBlock(document, el));
    return;
  }
  S.own({ style }, ...flowContent(document, el));
}

/** content of one column inside a mixed row */
function columnContent(document, col) {
  if (col.matches('.glass')) return flowContent(document, col);
  if (col.matches('.kpi-col')) return [keyFigures(document, [col])];
  if (col.matches('.tgrid')) return [cardsBlock(document, 'tile', [...col.querySelectorAll(':scope > .tile')])];
  const out = [];
  [...col.children].forEach((n) => {
    if (n.matches('.glass')) out.push(block(document, 'Cards (panel)', [[flowContent(document, n)]]));
    else if (n.matches('.contact')) out.push(contactBlock(document, [n]));
    else if (n.matches('.tile')) {
      // consecutive tiles share one block (merged below)
      out.push(n);
    } else if (n.matches('.tgrid')) out.push(cardsBlock(document, 'tile', [...n.querySelectorAll(':scope > .tile')]));
    else out.push(...flowContent(document, h(document, 'div', n.cloneNode(true))));
  });
  // consecutive tiles -> one Cards (tile) block
  const merged = [];
  out.forEach((n) => {
    if (n.matches && n.matches('.tile')) {
      const last = merged[merged.length - 1];
      if (Array.isArray(last)) last.push(n); else merged.push([n]);
    } else merged.push(n);
  });
  return merged.map((n) => (Array.isArray(n) ? cardsBlock(document, 'tile', n) : n));
}

function handleRow(S, row) {
  const { document } = S;
  const kids = [...row.children];
  const narrow = isNarrow(row);
  for (const [sel, variant] of CARD_ROWS) {
    if (kids.length && kids.every((k) => k.matches(sel))) { S.add(cardsBlock(document, variant, kids)); return; }
  }
  if (kids.every((k) => k.matches('.kpi-col'))) { S.add(keyFigures(document, kids)); return; }
  if (kids.every((k) => k.matches('.contact'))) { S.add(contactBlock(document, kids)); return; }
  if (kids.every(isTint)) { S.add(cardsBlock(document, 'tint', kids)); return; }
  if (kids.every((k) => k.matches('.glass') && k.querySelector(':scope > .h2'))) { S.add(cardsBlock(document, 'year', kids)); return; }
  if (kids.every((k) => k.matches('.img-card'))) { S.add(cardsBlock(document, 'image', kids)); return; }
  // mixed row -> one section per column
  S.close();
  kids.forEach((k, i) => {
    const style = ['column'];
    if (i === 0) style.push('new-row');
    if (k.matches('.glass')) style.push('glass');
    if (isFixed(k)) style.push('fixed');
    if (narrow) style.push('narrow');
    S.own({ style }, ...columnContent(document, k));
  });
}

/** sec()/section.col containers: heading + inner components */
function container(S, el, meta = {}) {
  const { document } = S;
  S.close();
  S.open({ ...meta, style: isNarrow(el) ? ['narrow'] : [] });
  [...el.children].forEach((n) => {
    if (n.matches('.srcnote')) return;
    if (n.matches('.row')) { handleRow(S, n); return; }
    if (n.matches('.tgrid')) { S.add(cardsBlock(document, 'tile', [...n.children])); return; }
    if (n.matches('.glass')) { glassSection(S, n); return; }
    if (n.matches('.tags') && n.querySelector('[data-filter]')) {
      const ul = document.createElement('ul');
      n.querySelectorAll('[data-filter]').forEach((b, i) => ul.append(h(document, 'li', i ? text(b) : h(document, 'strong', text(b)))));
      S.add(block(document, 'Tags (filter)', [[ul]]));
      return;
    }
    if (n.matches('.img-card')) { S.add(cardsBlock(document, 'image', [n])); return; }
    if (n.matches('.kpi-col')) { S.add(keyFigures(document, [n])); return; }
    S.add(...flowContent(document, h(document, 'div', n.cloneNode(true))));
  });
  S.close();
}

function walkMain(S, main) {
  const { document } = S;
  [...main.children].forEach((n) => {
    if (n.matches('.crumb')) S.own({}, breadcrumbBlock(document, n));
    else if (n.matches('.hero.stage')) S.own({}, stageBlock(document, n));
    else if (n.matches('.hero')) S.own({}, heroBlock(document, n));
    else if (n.matches('.ask-form')) S.own({}, askBlock(document, n));
    else if (n.matches('.secnav')) S.own({}, sectionNavBlock(document, n));
    else if (n.matches('section.tsec')) container(S, n, { id: n.id });
    else if (n.matches('section.row')) {
      S.close();
      if (isNarrow(n)) S.open({ style: ['narrow'] });
      handleRow(S, n);
      S.close();
    } else if (n.matches('.glass')) glassSection(S, n);
    else if (n.matches('section.col')) container(S, n);
    else if (n.matches('section') && /align-items:flex-end/.test(styleOf(n))) S.own({ style: ['heading-bar'] }, ...flowContent(document, n));
    else if (n.matches('.tags')) S.own({ style: isNarrow(n) ? ['narrow'] : [] }, tagsBlock(document, n));
    else if (n.matches('.notice')) S.own({ style: isNarrow(n) ? ['narrow'] : [] }, noticeBlock(document, n));
    else if (n.matches('.contact')) S.own({}, contactBlock(document, [n]));
    else if (n.matches('.img-card')) S.own({ style: isNarrow(n) ? ['narrow'] : [] }, cardsBlock(document, 'image', [n]));
    else if (n.matches('.srcnote')) { /* internal prototype note, hidden on the source */ } else if (n.matches('p.faint')) S.own({ style: isNarrow(n) ? ['narrow'] : [] }, h(document, 'p', h(document, 'em', text(n))));
    else S.own({}, ...flowContent(document, h(document, 'div', n.cloneNode(true))));
  });
}

/* ---------- navigation and footer fragments ---------- */
const FLY_PALETTE = { about: 'blue', businesses: 'kabi' };

function buildNav(document, wrap) {
  const S = new Sections(document);
  const brand = h(document, 'a', 'Fresenius');
  brand.href = '/';
  S.own({}, h(document, 'p', brand));
  const ul = document.createElement('ul');
  wrap.querySelectorAll('.nav .links > *').forEach((a) => {
    const link = h(document, 'a', text(a));
    link.href = mapHref(a);
    ul.append(h(document, 'li', link));
  });
  S.own({}, ul);
  const tools = [...wrap.querySelectorAll('.nav .actions > *')].map((t) => {
    const label = text(t) || t.getAttribute('aria-label');
    const a = h(document, 'a', label);
    if (t.matches('.btn')) { a.href = mapHref(t); return h(document, 'p', h(document, 'strong', a)); }
    a.href = /search/i.test(label) ? '#search' : '#language';
    return h(document, 'p', a);
  });
  S.own({}, ...tools);
  wrap.querySelectorAll('.fly').forEach((fly) => {
    const key = fly.id.replace('fly-', '');
    const nodes = [];
    const head = fly.querySelector('.fhead');
    nodes.push(h(document, 'h6', text(head.querySelector('.overline'))));
    nodes.push(h(document, 'h3', text(head.querySelector('.h4'))));
    nodes.push(h(document, 'p', text(head.querySelector('p'))));
    const ov = head.querySelector('.btn');
    const ova = h(document, 'a', text(ov));
    ova.href = mapHref(ov);
    nodes.push(h(document, 'p', h(document, 'em', ova)));
    fly.querySelectorAll('.fcol').forEach((col) => {
      nodes.push(h(document, 'h4', text(col.querySelector('h5'))));
      const list = document.createElement('ul');
      col.querySelectorAll('.fl').forEach((fl) => {
        const li = document.createElement('li');
        const title = text(fl.querySelector('[data-tag=b]'));
        const a = h(document, 'a', title);
        a.href = mapHref(fl);
        const external = { 'helios-gesundheit.de': 'https://www.helios-gesundheit.de/', 'quironsalud.es': 'https://www.quironsalud.com/' }[title];
        if (external) a.href = external;
        li.append(a);
        const desc = text(fl).slice(title.length).trim();
        if (desc) li.append(document.createElement('br'), desc);
        list.append(li);
      });
      nodes.push(list);
    });
    const promo = fly.querySelector('.fpromo');
    nodes.push(h(document, 'h6', text(promo.querySelector('.overline'))));
    nodes.push(h(document, 'h5', text(promo.querySelector('.h4'))));
    promo.querySelectorAll(':scope > .body-s').forEach((p) => nodes.push(h(document, 'p', text(p))));
    const more = h(document, 'a', text(promo.querySelector('.label')).replace(/\s*→\s*$/, ''));
    more.href = mapHref(promo);
    nodes.push(h(document, 'p', more));
    S.own({ style: ['flyout', FLY_PALETTE[key] || 'blue'] }, ...nodes);
  });
  return S;
}

function buildFooter(document, body) {
  const S = new Sections(document);
  const nodes = [];
  body.querySelectorAll('.sfoot > div').forEach((col) => {
    nodes.push(h(document, 'h3', text(col.querySelector('h6'))));
    const p = col.querySelector('p');
    const para = document.createElement('p');
    [...p.childNodes].forEach((c) => {
      if (c.nodeType === 3) para.append(c.textContent);
      else if (c.tagName === 'A') { const a = h(document, 'a', text(c)); a.href = mapHref(c); para.append(a); }
    });
    nodes.push(para);
  });
  S.own({}, ...nodes);
  S.own({}, h(document, 'p', text(body.querySelector('.foot'))));
  return S;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const originalURL = params.originalURL || url;
    const body = document.body;
    const out = document.createElement('div');
    let S;
    const navWrap = body.querySelector('.nav-wrap');
    if (navWrap) S = buildNav(document, navWrap);
    else if (body.querySelector('.sfoot')) S = buildFooter(document, body);
    else {
      S = new Sections(document);
      walkMain(S, body.querySelector('main') || body);
    }
    S.render(out);
    const title = document.title;
    if (!navWrap && !body.querySelector('.sfoot')) {
      const lead = [...out.querySelectorAll('p')].find((p) => !p.closest('table') && p.textContent.length > 60);
      out.append(block(document, 'Metadata', { Title: title, Description: lead ? lead.textContent.trim() : title }));
    }
    body.innerHTML = '';
    body.append(...out.childNodes);
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );
    return [{ element: body, path, report: { title } }];
  },
};
