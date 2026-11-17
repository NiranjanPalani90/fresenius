/*
 * Key figures. Rows: label | value | caption | source (optional)
 * An italic value marks the highlighted (brand) tile.
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [label, value, caption, source] = [...row.children];
    const li = document.createElement('li');
    li.className = 'kpi-col';
    const kpi = document.createElement('div');
    kpi.className = 'kpi';
    if (value && value.querySelector('em')) kpi.classList.add('brand');
    kpi.innerHTML = '<span class="o"></span><span class="v"></span><span class="c"></span>';
    kpi.querySelector('.o').textContent = label ? label.textContent.trim() : '';
    kpi.querySelector('.v').textContent = value ? value.textContent.trim() : '';
    kpi.querySelector('.c').textContent = caption ? caption.textContent.trim() : '';
    li.append(kpi);
    const src = source && source.textContent.trim();
    if (src) {
      const s = document.createElement('p');
      s.className = 'src';
      s.textContent = src;
      li.append(s);
    }
    list.append(li);
  });
  block.textContent = '';
  block.append(list);
}
