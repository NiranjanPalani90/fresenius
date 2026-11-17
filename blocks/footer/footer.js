import { getMetadata } from '../../scripts/aem.js';
import { getContentRoot } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Footer fragment structure:
 *  1. columns: heading + text (one column per heading)
 *  2. disclaimer line
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `${getContentRoot()}/footer`;
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;
  const [colsSec, ...rest] = fragment.querySelectorAll(':scope > .section');

  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  const cols = document.createElement('div');
  cols.className = 'footer-cols';
  let col = null;
  const wrapper = colsSec && (colsSec.querySelector('.default-content-wrapper') || colsSec);
  [...(wrapper ? wrapper.children : [])].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      col = document.createElement('div');
      col.className = 'footer-col';
      const h = document.createElement('h2');
      h.textContent = el.textContent;
      col.append(h);
      cols.append(col);
    } else if (col) col.append(el);
  });
  inner.append(cols);
  rest.forEach((sec) => {
    const bottom = document.createElement('div');
    bottom.className = 'footer-bottom';
    bottom.append(...(sec.querySelector('.default-content-wrapper') || sec).children);
    inner.append(bottom);
  });
  block.textContent = '';
  block.append(inner);
}
