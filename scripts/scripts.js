import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

import { getContentRoot, sitePath } from './paths.js';

export { getContentRoot, sitePath };

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/** Keeps root-relative links working when content is served from a sub-path. */
function localizeLinks(main) {
  if (!getContentRoot()) return;
  main.querySelectorAll('a[href^="/"]').forEach((a) => {
    a.setAttribute('href', sitePath(a.getAttribute('href')));
  });
}

/** Heading 6 is the authoring style for overlines (eyebrows): render as a paragraph. */
function decorateOverlines(main) {
  main.querySelectorAll('h6').forEach((h6) => {
    const p = document.createElement('p');
    p.className = 'overline';
    p.innerHTML = h6.innerHTML;
    h6.replaceWith(p);
  });
}

/** "Source: …" paragraphs become source chips; consecutive chips are grouped. */
function decorateSources(main) {
  main.querySelectorAll('p').forEach((p) => {
    const t = p.textContent.trim();
    if (!/^Source:\s/.test(t) || p.querySelector('img')) return;
    p.classList.add('src');
    p.textContent = t.replace(/^Source:\s*/, '');
  });
  main.querySelectorAll('p.src').forEach((p) => {
    if (p.parentElement.classList.contains('src-group')) return;
    const group = document.createElement('div');
    group.className = 'src-group';
    p.before(group);
    let el = p;
    while (el && el.matches && el.matches('p.src')) {
      const next = el.nextElementSibling;
      group.append(el);
      el = next;
    }
  });
}

/** Paragraphs made of inline code become tag pills (strong = selected). */
function decorateCodeTags(main) {
  main.querySelectorAll('p').forEach((p) => {
    const codes = p.querySelectorAll('code');
    if (!codes.length) return;
    const rest = [...p.childNodes].filter((n) => !(n.nodeType === 1 && (n.tagName === 'CODE' || (n.tagName === 'STRONG' && n.querySelector('code')))));
    const label = rest.map((n) => n.textContent).join('').trim();
    const tags = document.createElement('div');
    tags.className = 'tags';
    if (label) {
      const l = document.createElement('span');
      l.className = 'tags-label';
      l.textContent = label;
      tags.append(l);
    }
    codes.forEach((code) => {
      const tag = document.createElement('span');
      tag.className = `tag ${code.closest('strong') ? 'selected' : 'subtle'}`;
      tag.textContent = code.textContent;
      tags.append(tag);
    });
    p.replaceWith(tags);
  });
}

/** Paragraphs fully in italics (without a link) are fine print. */
function decorateFineprint(main) {
  main.querySelectorAll('p').forEach((p) => {
    const em = p.querySelector(':scope > em');
    if (!em || p.querySelector('a') || p.textContent.trim() !== em.textContent.trim()) return;
    p.classList.add('fineprint');
  });
}

/**
 * List rows: list items with a <strong> title, an optional lead before it
 * and optional meta text after it (lines separated by <br>).
 * @param {Element} ul list element
 * @returns {Element} decorated list
 */
export function buildListRows(ul) {
  const list = document.createElement('div');
  list.className = 'list-rows';
  [...ul.children].forEach((li) => {
    const strong = li.querySelector('strong');
    const link = strong && strong.querySelector('a');
    const row = document.createElement(link ? 'a' : 'div');
    row.className = 'lrow';
    if (link) row.href = link.getAttribute('href');
    let lead = '';
    let meta = '';
    let seen = false;
    [...li.childNodes].forEach((n) => {
      if (n === strong) { seen = true; return; }
      if (n.nodeType === 1 && n.tagName === 'BR') return;
      if (seen) meta += n.textContent; else lead += n.textContent;
    });
    if (lead.trim()) {
      const l = document.createElement('span');
      l.className = 'lead';
      l.textContent = lead.trim();
      row.append(l);
    }
    const tx = document.createElement('div');
    tx.className = 'tx';
    tx.innerHTML = `<div class="t"></div>${meta.trim() ? '<div class="m"></div>' : ''}`;
    tx.querySelector('.t').textContent = strong ? strong.textContent.trim() : li.textContent.trim();
    if (meta.trim()) tx.querySelector('.m').textContent = meta.trim();
    row.append(tx);
    const go = document.createElement('span');
    go.className = 'go';
    go.setAttribute('aria-hidden', 'true');
    row.append(go);
    if (link && /^#/.test(link.getAttribute('href'))) row.dataset.action = link.getAttribute('href').slice(1);
    list.append(row);
  });
  return list;
}

function decorateListRows(main) {
  main.querySelectorAll('.default-content-wrapper > ul').forEach((ul) => {
    const items = [...ul.children];
    if (items.length && items.every((li) => li.querySelector(':scope > strong'))) ul.replaceWith(buildListRows(ul));
  });
}

/**
 * Decorates formatted links as buttons: bold = primary, italic = secondary,
 * a standalone plain link in default content = ghost.
 * @param {Element} main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    const p = a.closest('p');
    const text = a.textContent.trim();
    if (a.querySelector('img') || p.textContent.trim() !== text || p.classList.contains('src')) return;
    const strong = a.closest('strong');
    const em = a.closest('em');
    const inDefault = p.parentElement.classList.contains('default-content-wrapper')
      || p.parentElement.classList.contains('inline-text');
    if (!strong && !em && !inDefault) return;
    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong) {
      a.classList.add('primary');
      (strong.contains(em) ? strong : (em || strong)).replaceWith(a);
    } else if (em) {
      a.classList.add('secondary');
      em.replaceWith(a);
    } else a.classList.add('ghost');
  });
  main.querySelectorAll('p.button-wrapper').forEach((wrapper) => {
    if (wrapper.parentElement.classList.contains('button-group')) return;
    const group = document.createElement('div');
    group.className = 'button-group';
    wrapper.before(group);
    let el = wrapper;
    while (el && el.classList && el.classList.contains('button-wrapper')) {
      const next = el.nextElementSibling;
      group.append(el);
      el = next;
    }
  });
}

/** Section metadata extras: anchors, inline layouts, panel headers. */
function decorateSectionLayouts(main) {
  main.querySelectorAll(':scope > .section').forEach((section) => {
    if (section.dataset.id) section.id = section.dataset.id;
    const wrapper = section.querySelector(':scope > .default-content-wrapper');
    if (!wrapper) return;
    if (section.matches('.inline, .heading-bar')) {
      const text = document.createElement('div');
      text.className = 'inline-text';
      [...wrapper.children].forEach((c) => { if (!c.matches('.button-group')) text.append(c); });
      wrapper.prepend(text);
    }
    // panel header: heading followed by a single ghost action or tag
    const [first, second] = wrapper.children;
    if (first && second && /^H[2-4]$/.test(first.tagName)
      && (second.matches('.button-group') && second.querySelector('.ghost') && second.children.length === 1)) {
      const head = document.createElement('div');
      head.className = 'panel-head';
      first.before(head);
      head.append(first, second);
    } else if (first && second && /^H[2-4]$/.test(first.tagName) && second.matches('.tags') && second.children.length === 1) {
      const head = document.createElement('div');
      head.className = 'panel-head';
      first.before(head);
      head.append(first, second);
    }
  });
}

/** Groups consecutive "column" sections into rows ("new-row" starts a new row). */
function groupColumns(main) {
  let row = null;
  [...main.querySelectorAll(':scope > .section')].forEach((section) => {
    if (!section.classList.contains('column')) { row = null; return; }
    if (!row || section.classList.contains('new-row') || row.nextElementSibling !== section) {
      row = document.createElement('div');
      row.className = 'section-row';
      section.before(row);
    }
    row.append(section);
    if (section.classList.contains('narrow')) row.classList.add('narrow');
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  localizeLinks(main);
  decorateOverlines(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateSources(main);
  decorateCodeTags(main);
  decorateFineprint(main);
  decorateListRows(main);
  decorateButtons(main);
  decorateSectionLayouts(main);
  groupColumns(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    if (main.querySelector('.hero.helios')) document.body.classList.add('helios-accent');
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 1024 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash && hash.length > 1 ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  // conversational layer of the prototype: AskFRE, ask pipeline, actions, toasts
  import('./demo.js').then(({ default: initDemo }) => initDemo());
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
