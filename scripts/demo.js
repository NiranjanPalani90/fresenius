/*
 * Conversational layer of the Fresenius relaunch prototype:
 * ask bar flow (pipeline overlay -> generated view), AskFRE panel + FAB,
 * page actions (CSV, share, save) and toasts. Scripted demo behaviour.
 */
import { sitePath } from './paths.js';

export const Q_EX = 'How did the EBIT margins of Kabi and Helios develop over the last 8 quarters against the FY/26 target corridors, and is the Helios Q3 dip a trend or seasonality?';
export const Q_EMP = 'What does #FutureFresenius mean for us at Helios?';
const FOLLOW_EX = 'What supports Helios reimbursement in 2027?';
const STORE = 'fre-last-question';
const PREFILL = 'fre-prefill';

const SPARK = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2l1.6 4.4L16 8l-4.4 1.6L10 14l-1.6-4.4L4 8l4.4-1.6L10 2zM15.5 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" fill="currentColor"/></svg>';

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
}[c]));

const isEbit = (q) => /ebit|margin|marge|kabi.*helios|helios.*kabi|quarter|quartal|seasonal/i.test(q);
const isEmp = (q) => /futurefresenius|for us|employee|mitarbeit|frontline|production|produktion|plant|werk|what does .* mean/i.test(q);

/* ---------- storage helpers ---------- */
export function lastQuestion(kind) {
  try {
    const v = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    return v && v.kind === kind ? v.q : '';
  } catch (e) { return ''; }
}

function remember(q, kind) {
  try { sessionStorage.setItem(STORE, JSON.stringify({ q, kind })); } catch (e) { /* ignore */ }
}

export function setPrefill(q) {
  try { sessionStorage.setItem(PREFILL, q); } catch (e) { /* ignore */ }
}

export function takePrefill() {
  try {
    const q = sessionStorage.getItem(PREFILL);
    sessionStorage.removeItem(PREFILL);
    return q || '';
  } catch (e) { return ''; }
}

/* ---------- toast ---------- */
export function toast(message) {
  let t = document.querySelector('.demo-toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'demo-toast';
    t.setAttribute('role', 'status');
    document.body.append(t);
  }
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(t.timer);
  t.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- pipeline overlay ---------- */
const STEPS = {
  investor: () => ['Understand the question and map it to parameters', 'Retrieve published figures (4 Investor News releases)', 'Compose the dashboard from approved building blocks', 'Check guardrails: published figures only, verbatim statements, no assessment'],
  employee: (unit) => [`Understand the question: topic #FutureFresenius, ${unit === 'kabi' ? 'Fresenius Kabi, production' : 'Fresenius Helios, employees'}`, 'Retrieve public sources: strategy page, news, stories', 'Compose the explainer from approved building blocks', 'Check guardrails: verbatim quotes, public facts only, internal details stay on the intranet'],
};

function runPipeline(q, kind, target, unit) {
  const pipe = document.createElement('div');
  pipe.className = 'demo-pipe';
  pipe.setAttribute('role', 'dialog');
  pipe.setAttribute('aria-live', 'polite');
  pipe.innerHTML = `<div class="demo-pipe-card"><p class="overline">Conversational layer · composing your view</p><p class="demo-pipe-q"></p>${STEPS[kind](unit).map((s) => `<div class="demo-step"><span class="dot"></span><span>${s}</span></div>`).join('')}</div>`;
  pipe.querySelector('.demo-pipe-q').textContent = `“${q}”`;
  document.body.append(pipe);
  const steps = [...pipe.querySelectorAll('.demo-step')];
  let i = 0;
  const tick = () => {
    if (i > 0) steps[i - 1].className = 'demo-step done';
    if (i < steps.length) {
      steps[i].className = 'demo-step on';
      i += 1;
      setTimeout(tick, 520);
    } else {
      setTimeout(() => { window.location.href = sitePath(target); }, 250);
    }
  };
  tick();
}

/**
 * Handles a question typed into any ask bar.
 * @param {string} question the question
 * @param {HTMLInputElement} [input] the input, to insert the example question
 */
export function handleAsk(question, input) {
  const q = question.trim();
  if (!q) return;
  if (isEbit(q) && !/futurefresenius|for us/i.test(q)) {
    remember(q, 'investor');
    runPipeline(q, 'investor', '/investors/dashboard');
  } else if (isEmp(q)) {
    const unit = /kabi|production|produktion|plant|werk/i.test(q) ? 'kabi' : 'helios';
    remember(q, 'employee');
    runPipeline(q, 'employee', `/explain/${unit}`, unit);
  } else {
    toast('This prototype composes two example views (investor and employee). An example question has been inserted.');
    if (input) input.value = Q_EX;
  }
}

/* ---------- AskFRE panel ---------- */
const onDashboard = () => /\/investors\/dashboard$/.test(window.location.pathname);

function closePanel() {
  document.querySelectorAll('.demo-panel, .demo-scrim').forEach((el) => el.classList.remove('show'));
  document.body.classList.remove('ask-open');
  if (window.location.hash === '#askfre') window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

function answer(q) {
  const pb = document.querySelector('.demo-panel .pb');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = q;
  const a = document.createElement('div');
  a.className = 'answer';
  a.innerHTML = '<div class="typing" aria-label="AskFRE is typing"><span></span><span></span><span></span></div>';
  pb.append(bubble, a);
  pb.scrollTop = pb.scrollHeight;
  setTimeout(() => {
    const known = /reimburse|2027|drg|surcharge|verg[uü]t|helios.*2027/i.test(q);
    a.innerHTML = known ? `<p class="label">From Fresenius disclosures (verbatim)</p>
      <p class="muted">“The 2027 DRG inflator was set at 4.85% confirming a supportive reimbursement environment. It includes a 3.42% base wage rate net of the statutory deduction, an additional 0.29% tariff effect and an 1.14% one-time base effect.”</p><p class="src">Investor News Q3/26, p.7</p>
      <p class="muted">“As part of the emergency care reform, in October, the Bundestag has adopted a draft bill introducing a surcharge per inpatient case from 1 January 2027, providing €450 million in additional funding to non-university hospitals.”</p><p class="src">Investor News Q3/26, p.7</p>
      <p class="muted">Context: the surcharge on invoices of publicly insured patients in Germany “expired at the end of October 2026”.</p><div class="src-group"><p class="src">Investor News Q3/26, p.4</p><p class="src">Market Briefing – DRG Inflator 2027</p></div>
      <div class="button-group"><a class="button secondary m" href="${sitePath('/investors/dashboard')}" data-toast="Added to your view">Add to my view</a><a class="button ghost m" href="#copy-answer">Copy answer</a></div>`
      : `<p class="label">Prototype</p><p class="muted">In this prototype AskFRE answers one example follow-up. The live AskFRE answers any IR question from the last five years with document and page references.</p><button type="button" class="tag subtle" data-ask="${esc(FOLLOW_EX)}">${FOLLOW_EX}</button>`;
    pb.scrollTop = pb.scrollHeight;
  }, 1100);
}

export function openPanel() {
  let scrim = document.querySelector('.demo-scrim');
  let panel = document.querySelector('.demo-panel');
  if (!panel) {
    scrim = document.createElement('div');
    scrim.className = 'demo-scrim';
    scrim.addEventListener('click', closePanel);
    panel = document.createElement('aside');
    panel.className = 'demo-panel';
    panel.setAttribute('aria-label', 'AskFRE, your IR assistant');
    document.body.append(scrim, panel);
  }
  const dash = onDashboard();
  const pageName = (document.querySelector('meta[property="og:title"]') || {}).content || document.title || 'Fresenius.com';
  panel.innerHTML = `<div class="ph"><div class="ph-text"><p class="overline">AskFRE · your IR assistant</p><h2>${dash ? 'Follow-up on this view' : 'How can I help?'}</h2></div><button type="button" class="button ghost m demo-close">Close</button></div>
  <div class="pb"><div class="tags"><span class="tags-label">Context from this page:</span>${dash ? '<span class="tag selected">Helios</span><span class="tag selected">Q4/24–Q3/26</span>' : `<span class="tag selected">${esc(pageName)}</span>`}</div>
  <p class="faint">AskFRE answers from publicly available Fresenius Investor Relations content (HTML pages and PDF documents) of the last five years; each answer includes the exact source reference.</p></div>
  <div class="pf"><p class="faint">AI generated responses may be incomplete or contain inaccuracies. For more information, please refer to the Terms of Use.</p>
  <div class="tags"><button type="button" class="tag subtle" data-ask="${esc(FOLLOW_EX)}">${FOLLOW_EX}</button><button type="button" class="tag subtle" data-ask="Helios Spain margin by quarter">Helios Spain margin by quarter</button></div>
  <form class="demo-ask"><input name="q" placeholder="Ask a follow-up…" autocomplete="off" aria-label="Ask a follow-up"><button class="button primary m" type="submit">Ask</button></form></div>`;
  panel.querySelector('.demo-close').addEventListener('click', closePanel);
  panel.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = e.target.q.value.trim();
    if (v) { answer(v); e.target.q.value = ''; }
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ask]');
    if (b) answer(b.dataset.ask);
  });
  scrim.classList.add('show');
  panel.classList.add('show');
  document.body.classList.add('ask-open');
  panel.querySelector('input').focus();
}

/* ---------- page actions (authored as #action links) ---------- */
function chartState() {
  const chart = document.querySelector('.chart.block');
  return chart && chart.chartData;
}

const ACTIONS = {
  askfre: () => openPanel(),
  'download-csv': () => {
    const data = chartState();
    if (!data) return;
    const csv = [data.header, ...data.rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'fresenius_ebit_margin_q4-24_q3-26.csv';
    a.click();
    toast('Series downloaded (published figures, before special items)');
  },
  'copy-share-link': () => {
    const data = chartState();
    const segs = data ? data.series.filter((s) => s.visible).map((s) => s.key).join(',') : 'kabi,helios';
    const url = `${window.location.origin}${window.location.pathname}?kpi=ebit-margin&segments=${segs}&period=q4-24..q3-26&compare=fy26`;
    if (navigator.clipboard) navigator.clipboard.writeText(url);
    toast('Share link copied');
  },
  'save-view': () => toast('View saved: it updates with the next quarterly release'),
  'share-page': () => {
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
    toast('Link copied: share it via messenger, LinkedIn or e-mail');
  },
  'open-intranet': () => toast('Opens the ONE intranet (internal, sign-in required)'),
  'copy-answer': () => toast('Answer copied'),
  search: () => {},
  language: () => {},
};

function onClick(e) {
  const a = e.target.closest('a[href]');
  if (!a) return;
  if (a.dataset.toast) toast(a.dataset.toast);
  const href = a.getAttribute('href');
  if (!href.startsWith('#')) return;
  const key = href.slice(1);
  if (key === '') { e.preventDefault(); return; }
  if (ACTIONS[key]) { e.preventDefault(); ACTIONS[key](); }
}

/* ---------- FAB and prototype guide ---------- */
function buildFab() {
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'demo-fab';
  fab.setAttribute('aria-label', 'Open AskFRE, your IR assistant');
  fab.innerHTML = `<span class="pulse"></span><span class="ic">${SPARK}</span><span class="fab-text">AskFRE<small>Your IR assistant</small></span>`;
  fab.addEventListener('click', () => {
    if (onDashboard()) window.history.replaceState(null, '', '#askfre');
    openPanel();
  });
  document.body.append(fab);
}

const GUIDE = [
  ['Journey 01 · Investor', [['0 · Homepage', '/'], ['1 · Investors overview', '/investors'], ['2 · Results package Q3 2026', '/investors/results-q3-2026'], ['3+4 · Generated dashboard', '/investors/dashboard'], ['5 · AskFRE follow-up', '/investors/dashboard#askfre']]],
  ['Journey 08 · Employees', [['1 · Shared link: brief news', '/newsroom/fresenius-reorganizes-hospital-services'], ['3 · Explainer Helios', '/explain/helios'], ['4 · Explainer Kabi production', '/explain/kabi'], ['5 · Strategy', '/about#strategy'], ['6 · Our people', '/impact#patients'], ['7 · Careers', '/careers#companies']]],
];

function buildGuide() {
  const guide = document.createElement('div');
  guide.className = 'demo-guide';
  guide.innerHTML = `<div class="gp" id="demo-guide-panel"><p class="gp-intro">Start on the homepage, go to Investors and type the question into any ask bar. The example question is prefilled by the chip below each ask bar.</p>${GUIDE.map(([t, links]) => `<p class="gp-title">${t}</p>${links.map(([l, h]) => `<a href="${sitePath(h)}">${l}</a>`).join('')}`).join('')}</div><button type="button" aria-expanded="false" aria-controls="demo-guide-panel">Prototype guide</button>`;
  const btn = guide.querySelector('button');
  btn.addEventListener('click', () => {
    const open = guide.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  document.body.append(guide);
}

export default function initDemo() {
  if (window.freDemoReady) return;
  window.freDemoReady = true;
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
  buildFab();
  buildGuide();
  if (window.location.hash === '#askfre') openPanel();
  window.addEventListener('hashchange', () => { if (window.location.hash === '#askfre') openPanel(); });
}
