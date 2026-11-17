/*
 * Hero: dark brand panel with overline, title, lead, buttons and an optional ask bar.
 * Variants: (none) brand gradient with glow · "flow, <palette>" Fresenius Flow imagery.
 * Rows: 1) content  2) optional "Ask" | placeholder
 */
import { buildFlow } from '../../scripts/flow.js';
import { buildAskForm, applyPrefill, DEFAULT_EXAMPLES } from '../ask/ask.js';

export default function decorate(block) {
  const rows = [...block.children];
  const content = document.createElement('div');
  content.className = 'hero-content';
  let ask = null;
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length > 1 && /^ask$/i.test(cells[0].textContent.trim())) {
      ask = buildAskForm(cells[1].textContent.trim(), DEFAULT_EXAMPLES, { glassy: true });
    } else cells.forEach((c) => content.append(...c.childNodes));
  });
  block.textContent = '';
  block.classList.add('on-dark');
  if (block.classList.contains('flow')) {
    const palette = [...block.classList].find((c) => !['hero', 'flow', 'block', 'on-dark'].includes(c));
    block.append(buildFlow(palette || 'blue', 1.3, 0.35));
  } else {
    const glow = document.createElement('div');
    glow.className = 'glow';
    block.append(glow);
  }
  block.append(content);
  if (ask) {
    block.append(ask);
    applyPrefill(ask);
  }
}
