import { getMetadata } from '../../scripts/aem.js';
import { getContentRoot, sitePath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { buildFlow } from '../../scripts/flow.js';

/*
 * Nav fragment structure (sections):
 *  1. brand link
 *  2. list of main links
 *  3. tools: search, language, primary contact button
 *  4+ flyouts (style "flyout, <palette>"): overline = label of the nav link it belongs to,
 *     h3 + text + button (intro), h4 + list per column (link<br>description),
 *     overline + h5 + text + link (promo tile)
 */

const ICONS = {
  search: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  globe: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h14M9 2c2 2 2.8 4.4 2.8 7S11 14 9 16c-2-2-2.8-4.4-2.8-7S7 4 9 2z" stroke="currentColor" stroke-width="1.5"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const isDesktop = window.matchMedia('(min-width: 1000px)');

function buildFlyout(section, index) {
  const wrapper = section.querySelector('.default-content-wrapper') || section;
  const fly = document.createElement('div');
  fly.className = 'fly';
  fly.id = `nav-fly-${index}`;
  const head = document.createElement('div');
  head.className = 'fhead';
  let col = null;
  let promo = null;
  [...wrapper.children].forEach((el) => {
    if (el.tagName === 'H4') {
      col = document.createElement('div');
      col.className = 'fcol';
      const h = document.createElement('p');
      h.className = 'fcol-title';
      h.textContent = el.textContent;
      col.append(h);
      fly.append(col);
    } else if (el.tagName === 'UL' && col) {
      el.querySelectorAll(':scope > li').forEach((li) => {
        const link = li.querySelector('a');
        if (!link) return;
        const a = document.createElement('a');
        a.className = 'fl';
        a.href = link.getAttribute('href');
        const b = document.createElement('b');
        b.textContent = link.textContent;
        a.append(b);
        if (!a.href.startsWith(window.location.origin)) {
          a.classList.add('ext');
          a.target = '_blank';
          a.rel = 'noopener';
        }
        const desc = [...li.childNodes].filter((n) => n !== link && n.nodeType === 3).map((n) => n.textContent).join(' ').trim();
        if (desc) {
          const s = document.createElement('span');
          s.textContent = desc;
          a.append(s);
        }
        col.append(a);
      });
    } else if (col && el.matches('.overline')) {
      promo = document.createElement('a');
      promo.className = 'fpromo flow';
      promo.append(el);
      fly.append(promo);
    } else if (promo) {
      const link = el.querySelector('a');
      if (link) {
        promo.href = link.getAttribute('href');
        const l = document.createElement('span');
        l.className = 'fpromo-more';
        l.textContent = `${link.textContent} →`;
        promo.append(l);
      } else promo.append(el);
    } else head.append(el);
  });
  fly.prepend(head);
  if (promo) {
    const palette = [...section.classList].find((c) => !['section', 'flyout'].includes(c) && !c.includes('-'));
    promo.prepend(buildFlow(palette || 'blue', 1.1 + index * 1.3, 0.3));
  }
  return fly;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : `${getContentRoot()}/nav`;
  const fragment = await loadFragment(navPath);
  if (!fragment) return;
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const [brandSec, linksSec, toolsSec, ...flySecs] = sections;

  const wrap = document.createElement('div');
  wrap.className = 'nav-wrap';
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'Main');

  // brand
  const brandLink = brandSec && brandSec.querySelector('a');
  const logo = document.createElement('a');
  logo.className = 'logo';
  logo.href = brandLink ? brandLink.getAttribute('href') : sitePath('/');
  logo.setAttribute('aria-label', `${brandLink ? brandLink.textContent.trim() : 'Fresenius'} home`);
  logo.innerHTML = `<img src="${window.hlx.codeBasePath}/icons/fresenius-logo.svg" alt="Fresenius" width="140" height="22">`;
  nav.append(logo);

  // hamburger (mobile)
  const burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Open navigation');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span>';
  nav.append(burger);

  // links + flyouts
  const flyouts = {};
  flySecs.forEach((sec, i) => {
    const label = sec.querySelector('.overline');
    if (label) flyouts[label.textContent.trim().toLowerCase()] = buildFlyout(sec, i);
  });
  const links = document.createElement('ul');
  links.className = 'links';
  const path = window.location.pathname.replace(/^\/content/, '').replace(/\/index$/, '/');
  const activeFor = (href) => {
    const p = new URL(href, window.location).pathname.replace(/^\/content/, '');
    if (p === '/' || p === '/index') return false;
    if (p === '/about' && /^\/explain\//.test(path)) return true;
    return path === p || path.startsWith(`${p}/`);
  };
  let flyOpen = null;
  let flyTimer;
  const scrim = document.createElement('div');
  scrim.className = 'fly-scrim';

  const closeFly = () => {
    clearTimeout(flyTimer);
    wrap.querySelectorAll('.fly.show').forEach((f) => f.classList.remove('show'));
    links.querySelectorAll('a[aria-expanded="true"]').forEach((a) => a.setAttribute('aria-expanded', 'false'));
    scrim.classList.remove('show');
    flyOpen = null;
  };
  const openFly = (a, fly) => {
    if (flyOpen === fly) return;
    closeFly();
    fly.classList.add('show');
    a.setAttribute('aria-expanded', 'true');
    scrim.classList.add('show');
    flyOpen = fly;
  };

  (linksSec ? [...linksSec.querySelectorAll('li > a')] : []).forEach((src) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    a.textContent = src.textContent.trim();
    if (activeFor(a.href)) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
    const fly = flyouts[a.textContent.toLowerCase()];
    if (fly) {
      a.insertAdjacentHTML('beforeend', ICONS.chev);
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');
      a.setAttribute('aria-controls', fly.id);
      a.addEventListener('mouseenter', () => { if (isDesktop.matches) { clearTimeout(flyTimer); openFly(a, fly); } });
      a.addEventListener('mouseleave', () => { flyTimer = setTimeout(closeFly, 250); });
      a.addEventListener('click', (e) => {
        if (!isDesktop.matches) return;
        e.preventDefault();
        if (flyOpen === fly) closeFly(); else openFly(a, fly);
      });
      fly.addEventListener('mouseenter', () => clearTimeout(flyTimer));
      fly.addEventListener('mouseleave', () => { flyTimer = setTimeout(closeFly, 250); });
      fly.addEventListener('click', (e) => { if (e.target.closest('a')) closeFly(); });
      wrap.append(fly);
    } else a.addEventListener('mouseenter', closeFly);
    li.append(a);
    links.append(li);
  });
  nav.append(links);

  // tools
  const actions = document.createElement('div');
  actions.className = 'actions';
  (toolsSec ? [...toolsSec.querySelectorAll('a')] : []).forEach((src) => {
    const href = src.getAttribute('href');
    const label = src.textContent.trim();
    if (src.classList.contains('primary')) {
      const btn = document.createElement('a');
      btn.className = 'button primary m';
      btn.href = href;
      btn.textContent = label;
      actions.append(btn);
      return;
    }
    const a = document.createElement('a');
    a.className = 'icon-btn';
    a.href = href;
    if (/search/i.test(label)) {
      a.innerHTML = ICONS.search;
      a.setAttribute('aria-label', label);
    } else {
      a.innerHTML = `${ICONS.globe}<span>${label}</span>`;
      a.setAttribute('aria-label', `Language: ${label}`);
    }
    actions.append(a);
  });
  nav.append(actions);
  wrap.prepend(nav);

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  scrim.addEventListener('click', closeFly);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFly(); });
  isDesktop.addEventListener('change', () => { closeFly(); nav.classList.remove('open'); });

  block.textContent = '';
  block.append(scrim, wrap);
}
