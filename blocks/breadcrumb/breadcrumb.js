/*
 * Breadcrumb. One row: section | page (each cell may contain a link).
 * The first crumb links to the section's overview page from the nav when not linked.
 */
import { sitePath } from '../../scripts/scripts.js';

const SECTIONS = {
  investors: '/investors',
  'about fresenius': '/about',
  about: '/about',
  'our businesses': '/our-businesses',
  impact: '/impact',
  newsroom: '/newsroom',
  careers: '/careers',
};

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const nav = document.createElement('nav');
  nav.className = 'crumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const home = document.createElement('a');
  home.href = sitePath('/');
  home.setAttribute('aria-label', 'Home');
  home.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 7L8 2.5 13.5 7v6.5h-11z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  nav.append(home);
  cells.forEach((cell, i) => {
    const sep = document.createElement('span');
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '›';
    nav.append(sep);
    const label = cell.textContent.trim();
    const last = i === cells.length - 1;
    const link = cell.querySelector('a');
    let el;
    if (last) {
      el = document.createElement('b');
      el.setAttribute('aria-current', 'page');
      el.textContent = label;
    } else {
      el = document.createElement('a');
      el.href = link ? link.getAttribute('href') : sitePath(SECTIONS[label.toLowerCase()] || '/');
      el.textContent = label;
    }
    nav.append(el);
  });
  block.textContent = '';
  block.append(nav);
}
