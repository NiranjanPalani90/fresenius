/*
 * Section nav: sticky in-page navigation. One row with a list of #anchor links
 * (anchors are set with "Id" in the section metadata). Highlights the visible section.
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'secnav';
  nav.setAttribute('aria-label', 'On this page');
  const links = [...block.querySelectorAll('a[href^="#"]')].map((src) => {
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    a.textContent = src.textContent.trim();
    a.addEventListener('click', (e) => {
      const target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', a.hash);
    });
    nav.append(a);
    return a;
  });
  block.textContent = '';
  block.append(nav);

  const observe = () => {
    const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (!targets.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => {
          const on = a.hash.slice(1) === en.target.id;
          a.classList.toggle('on', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-180px 0px -60% 0px' });
    targets.forEach((t) => io.observe(t));
  };
  // sections below are decorated later: observe once the page has settled
  if (document.readyState === 'complete') setTimeout(observe, 500);
  else window.addEventListener('load', () => setTimeout(observe, 500));
}
