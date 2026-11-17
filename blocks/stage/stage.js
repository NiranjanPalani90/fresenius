/*
 * Stage (homepage): rotating top stories with tabs and an ask bar.
 * Rows: image (optional) | content | tab label — one row per story.
 * Last row (optional): "Ask" | placeholder
 */
import { buildAskForm, applyPrefill, DEFAULT_EXAMPLES } from '../ask/ask.js';

export default function decorate(block) {
  const slides = [];
  let ask = null;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (/^ask$/i.test(cells[0] ? cells[0].textContent.trim() : '') && !cells[0].querySelector('picture')) {
      ask = buildAskForm(cells[1].textContent.trim(), DEFAULT_EXAMPLES, { glassy: true });
      return;
    }
    const [imgCell, contentCell, tabCell] = cells.length >= 3 ? cells : [null, ...cells];
    slides.push({
      picture: imgCell && imgCell.querySelector('picture'),
      content: contentCell,
      tab: tabCell ? tabCell.textContent.trim() : '',
    });
  });

  block.textContent = '';
  block.classList.add('on-dark');
  const media = document.createElement('div');
  media.className = 'stage-media';
  const copy = document.createElement('div');
  copy.className = 'stage-copy';
  copy.setAttribute('aria-live', 'polite');
  const bottom = document.createElement('div');
  bottom.className = 'stage-bottom';
  const tabs = document.createElement('div');
  tabs.className = 'stage-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Top stories');

  const panels = slides.map((s, i) => {
    const panel = document.createElement('div');
    panel.className = 'stage-slide';
    panel.id = `stage-slide-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.append(...s.content.childNodes);
    panel.hidden = i > 0;
    if (s.picture) {
      s.picture.classList.add('stage-img');
      s.picture.dataset.slide = i;
      const img = s.picture.querySelector('img');
      if (img && i === 0) { img.loading = 'eager'; img.fetchPriority = 'high'; }
      media.append(s.picture);
    }
    copy.append(panel);
    return panel;
  });

  const select = (idx) => {
    panels.forEach((p, i) => { p.hidden = i !== idx; });
    tabs.querySelectorAll('[role="tab"]').forEach((t, i) => {
      t.classList.toggle('on', i === idx);
      t.setAttribute('aria-selected', i === idx);
      t.tabIndex = i === idx ? 0 : -1;
    });
    const hasImg = !!slides[idx].picture;
    block.classList.toggle('has-img', hasImg);
    media.querySelectorAll('.stage-img').forEach((p) => { p.hidden = +p.dataset.slide !== idx; });
  };

  slides.forEach((s, i) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'stab';
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', `stage-slide-${i}`);
    t.innerHTML = `<i></i><span>0${i + 1}&nbsp;&nbsp; </span>`;
    t.querySelector('span').append(s.tab);
    t.addEventListener('click', () => select(i));
    tabs.append(t);
  });
  tabs.addEventListener('keydown', (e) => {
    const all = [...tabs.children];
    const idx = all.indexOf(document.activeElement);
    if (idx < 0 || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const next = (idx + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length;
    select(next);
    all[next].focus();
  });

  bottom.append(tabs);
  if (ask) bottom.append(ask);
  block.append(media, copy, bottom);
  if (slides.length) select(0);
  if (ask) applyPrefill(ask);
}
