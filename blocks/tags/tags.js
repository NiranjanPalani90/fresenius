/*
 * Tags (chips). Rows: optional label row, then a list of tags.
 * Plain item = selected tag, italic item = subtle tag, links are kept.
 * Items "Segment: <name>" toggle the matching chart series.
 * Variant "filter": filters the list rows of the same section by company / type.
 */
const X = '<svg class="x" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

function filterRows(block, value) {
  const section = block.closest('.section');
  section.querySelectorAll('.lrow').forEach((row) => {
    const meta = (row.querySelector('.m') || {}).textContent || '';
    const parts = meta.split('·').map((s) => s.trim());
    row.hidden = !(value === 'All' || parts.includes(value));
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const listRow = rows.find((r) => r.querySelector('ul')) || rows[rows.length - 1];
  const labelRow = rows.find((r) => r !== listRow);
  const filter = block.classList.contains('filter');
  const wrap = document.createElement('div');
  wrap.className = 'tags';
  if (filter) wrap.setAttribute('role', 'toolbar');
  if (labelRow) {
    const label = document.createElement('span');
    label.className = 'tags-label';
    label.textContent = labelRow.textContent.trim();
    wrap.append(label);
  }
  const items = listRow.querySelectorAll('li');
  items.forEach((li, i) => {
    const link = li.querySelector('a');
    const subtle = !!li.querySelector('em') || (filter && !li.querySelector('strong'));
    const text = li.textContent.trim();
    let tag;
    if (link) {
      tag = document.createElement('a');
      tag.href = link.getAttribute('href');
      if (!subtle) tag.setAttribute('aria-current', 'page');
    } else if (filter || /^segment:/i.test(text)) {
      tag = document.createElement('button');
      tag.type = 'button';
    } else tag = document.createElement('span');
    tag.className = `tag ${subtle ? 'subtle' : 'selected'}`;
    tag.textContent = text;
    if (/^segment:/i.test(text) && !filter) {
      const key = text.replace(/^segment:\s*/i, '').toLowerCase();
      tag.setAttribute('aria-pressed', 'true');
      tag.insertAdjacentHTML('beforeend', X);
      tag.addEventListener('click', () => {
        const pressed = wrap.querySelectorAll('[aria-pressed="true"]');
        const on = tag.getAttribute('aria-pressed') !== 'true';
        if (!on && pressed.length === 1) return; // keep at least one series
        tag.setAttribute('aria-pressed', on);
        tag.classList.toggle('off', !on);
        tag.querySelector('.x').replaceWith(document.createRange().createContextualFragment(on ? X : '<span class="x plus" aria-hidden="true">+</span>'));
        document.dispatchEvent(new CustomEvent('chart:toggle', { detail: { key, visible: on } }));
      });
    }
    if (filter) {
      tag.setAttribute('aria-pressed', i === 0 || !subtle);
      tag.addEventListener('click', () => {
        wrap.querySelectorAll('.tag').forEach((t) => {
          t.className = `tag ${t === tag ? 'selected' : 'subtle'}`;
          t.setAttribute('aria-pressed', t === tag);
        });
        filterRows(block, text);
      });
    }
    wrap.append(tag);
  });
  block.textContent = '';
  block.append(wrap);
}
