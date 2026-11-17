/*
 * Notice (AI-assisted view label). One row: title | text | link
 */
const SPARK = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2l1.6 4.4L16 8l-4.4 1.6L10 14l-1.6-4.4L4 8l4.4-1.6L10 2zM15.5 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" fill="currentColor"/></svg>';

export default function decorate(block) {
  const [title, text, link] = [...block.querySelectorAll(':scope > div > div')];
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.innerHTML = SPARK;
  const tx = document.createElement('div');
  tx.className = 'tx';
  tx.innerHTML = '<p class="ti"></p><p class="desc"></p>';
  tx.querySelector('.ti').textContent = title ? title.textContent.trim() : '';
  tx.querySelector('.desc').textContent = text ? text.textContent.trim() : '';
  block.textContent = '';
  block.append(badge, tx);
  const a = link && link.querySelector('a');
  if (a) {
    a.className = 'notice-link';
    a.textContent = `${a.textContent.trim()} →`;
    block.append(a);
  }
}
