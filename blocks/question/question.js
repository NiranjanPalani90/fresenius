/*
 * Question of a generated view. Rows: 1) default question  2) "Edit question" link
 * Shows the question the visitor asked (kept for the session) instead of the default
 * when it matches the kind of view (investor dashboard or employee explainer).
 */
import { lastQuestion, setPrefill } from '../../scripts/demo.js';

export default function decorate(block) {
  const [qRow, linkRow] = [...block.children];
  const fallback = qRow ? qRow.textContent.trim() : '';
  const link = linkRow && linkRow.querySelector('a');
  const kind = /explain\//.test(window.location.pathname) ? 'employee' : 'investor';
  let q = lastQuestion(kind) || fallback;
  if (kind === 'employee' && /kabi/.test(window.location.pathname) && !/kabi|production|produktion|plant|werk/i.test(q)) {
    q = fallback;
  }
  const p = document.createElement('p');
  p.className = 'question-text';
  p.textContent = `“${q}”`;
  block.textContent = '';
  block.append(p);
  if (link) {
    link.className = 'button ghost m';
    link.addEventListener('click', () => setPrefill(q));
    block.append(link);
  }
}
