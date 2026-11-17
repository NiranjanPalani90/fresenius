/*
 * Table. First row = column headers. Bold cell text is emphasised
 * (variant "guidance": bold in the first column = unit, elsewhere = target value).
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell, c) => {
      const el = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) el.scope = 'col';
      el.innerHTML = cell.innerHTML;
      if (i > 0 && cell.querySelector('strong')) el.classList.add(c === 0 ? 'u' : 't');
      tr.append(el);
    });
    (i === 0 ? thead : tbody).append(tr);
  });
  table.append(thead, tbody);
  const scroller = document.createElement('div');
  scroller.className = 'table-scroll';
  scroller.append(table);
  block.textContent = '';
  block.append(scroller);
}
