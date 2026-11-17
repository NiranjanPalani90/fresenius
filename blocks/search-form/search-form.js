/*
 * Search form (job search, country finder).
 * Rows: label | placeholder | "search" (optional icon) — one per field; last row: button label.
 * Prototype only: submitting shows a note instead of searching.
 */
import { toast } from '../../scripts/demo.js';

const SEARCH = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

export default function decorate(block) {
  const form = document.createElement('form');
  form.className = 'search-form-fields';
  let button = 'Search';
  [...block.children].forEach((row, i) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    if (cells.length < 2 || !cells[1]) {
      [button] = cells;
      return;
    }
    const [label, placeholder, icon] = cells;
    const id = `sf-${Math.random().toString(36).slice(2, 7)}-${i}`;
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `<label for="${id}"></label><span class="input">${icon ? SEARCH : ''}<input id="${id}" name="f${i}" autocomplete="off"></span>`;
    field.querySelector('label').textContent = label;
    field.querySelector('input').placeholder = placeholder;
    form.append(field);
  });
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button primary';
  submit.textContent = button;
  form.append(submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Search is not connected in this prototype');
  });
  block.textContent = '';
  block.append(form);
}
