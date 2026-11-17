/*
 * Ask bar: question input with example chips. Submitting runs the scripted
 * "composing your view" flow of the prototype (see scripts/demo.js).
 * Rows: 1) placeholder  2+) chip label | question to insert
 */
import { loadCSS } from '../../scripts/aem.js';
import {
  handleAsk, takePrefill, Q_EX, Q_EMP,
} from '../../scripts/demo.js';

const SPARK = '<svg class="spark" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2l1.6 4.4L16 8l-4.4 1.6L10 14l-1.6-4.4L4 8l4.4-1.6L10 2zM15.5 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" fill="currentColor"/></svg>';

/** default example chips when none are authored (hero and stage ask bars) */
export const DEFAULT_EXAMPLES = [
  ['EBIT margins Kabi vs. Helios, last 8 quarters', Q_EX],
  ['#FutureFresenius for us at Helios', Q_EMP],
];

/**
 * Builds an ask form.
 * @param {string} placeholder input placeholder
 * @param {Array<[string,string]>} examples chip label + question
 * @param {object} [opts] { glassy }
 * @returns {HTMLFormElement}
 */
export function buildAskForm(placeholder, examples, { glassy = false } = {}) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/ask/ask.css`);
  const form = document.createElement('form');
  form.className = 'ask-form';
  form.setAttribute('role', 'search');
  form.innerHTML = `<div class="ask-bar${glassy ? ' glassy' : ''}">${SPARK}<input name="q" autocomplete="off"><button class="button primary m" type="submit">Ask</button></div>`;
  const input = form.querySelector('input');
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  if (examples.length) {
    const hint = document.createElement('div');
    hint.className = 'ask-hint';
    hint.append('Try: ');
    examples.forEach(([label, question]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => { input.value = question; input.focus(); });
      hint.append(b);
    });
    form.append(hint);
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAsk(input.value, input);
  });
  return form;
}

/** Puts a question handed over by "Edit question" into the first ask bar. */
export function applyPrefill(form) {
  if (document.querySelector('.ask-form.prefilled')) return;
  const q = takePrefill();
  if (!q) return;
  const input = form.querySelector('input');
  input.value = q;
  form.classList.add('prefilled');
  setTimeout(() => input.focus(), 60);
}

export default function decorate(block) {
  const rows = [...block.children];
  const placeholder = rows[0] ? rows[0].textContent.trim() : 'Ask a question';
  const examples = rows.slice(1).map((r) => [...r.children].map((c) => c.textContent.trim()))
    .filter(([label, q]) => label && q);
  const form = buildAskForm(placeholder, examples, { glassy: block.classList.contains('glassy') });
  block.textContent = '';
  block.append(form);
  applyPrefill(form);
}
