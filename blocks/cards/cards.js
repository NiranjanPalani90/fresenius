/*
 * Cards. Rows: [image or palette name] | content   (first cell optional)
 * Variants: audience, teaser, story, image, tile, tint, year, panel.
 * A link in the content makes the whole card clickable (stretched link).
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { buildFlow, isPalette } from '../../scripts/flow.js';
import { buildListRows } from '../../scripts/scripts.js';

const RIBBON = {
  audience: 0.3, teaser: 0.45, image: 0.4,
};

export default function decorate(block) {
  const variant = ['audience', 'teaser', 'story', 'image', 'tile', 'tint', 'year', 'panel']
    .find((v) => block.classList.contains(v)) || 'story';
  const ul = document.createElement('ul');
  [...block.children].forEach((row, i) => {
    const li = document.createElement('li');
    li.className = 'cards-card';
    const cells = [...row.children];
    const body = cells[cells.length - 1];
    const mediaCell = cells.length > 1 ? cells[0] : null;
    body.className = 'cards-card-body';
    body.querySelectorAll(':scope > ul').forEach((list) => {
      if ([...list.children].every((item) => item.querySelector(':scope > strong'))) list.replaceWith(buildListRows(list));
    });

    // media: authored picture or Fresenius Flow palette
    const seed = i * 1.7 + (variant === 'image' ? 0.4 : 0);
    if (mediaCell) {
      const pic = mediaCell.querySelector('picture');
      const name = mediaCell.textContent.trim().toLowerCase();
      if (pic || isPalette(name)) {
        const media = document.createElement('div');
        media.className = 'cards-card-image';
        if (pic) {
          const img = pic.querySelector('img');
          media.append(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
        } else media.append(buildFlow(name, seed, RIBBON[variant] || 0.4));
        if (variant === 'teaser') {
          media.classList.add('flow');
          li.append(media);
        } else {
          li.classList.add('flow');
          li.append(...media.childNodes);
        }
      }
    }

    // panels behave like glass sections: standalone plain links are ghost buttons
    if (variant === 'panel') {
      body.querySelectorAll('p > a[href]:not(.button)').forEach((a) => {
        const p = a.parentElement;
        if (p.textContent.trim() !== a.textContent.trim()) return;
        a.className = 'button ghost';
        const group = p.previousElementSibling;
        if (group && group.matches('.button-group')) {
          p.className = 'button-wrapper';
          group.append(p);
        }
      });
    }

    // whole-card link: a standalone link becomes the "more" label
    const links = variant === 'panel' ? [] : [...body.querySelectorAll('a[href]:not(.button)')];
    const main = links.find((a) => a.closest('h3')) || links.find((a) => {
      const p = a.closest('p');
      return p && p.textContent.trim() === a.textContent.trim();
    });
    if (main) {
      main.classList.add('cards-card-link');
      const p = main.closest('p');
      if (p && !main.closest('h3')) {
        p.className = 'cards-card-more';
        main.className = 'cards-card-link';
        main.textContent = `${main.textContent.trim()} →`;
      }
      li.classList.add('linked');
      // whole card is clickable; the link itself stays the keyboard target
      li.addEventListener('click', (e) => {
        if (e.target.closest('a, button') || window.getSelection().toString()) return;
        main.click();
      });
    }
    if (variant === 'tile') {
      const go = document.createElement('span');
      go.className = 'go2';
      go.setAttribute('aria-hidden', 'true');
      body.append(go);
    }
    li.append(body);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
