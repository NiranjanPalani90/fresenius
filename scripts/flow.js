/**
 * "Fresenius Flow" stand-in imagery: a brand gradient with soft animated ribbons.
 * Used by blocks when no photo is authored, keyed by a palette name.
 */
export const PALETTES = {
  blue: ['#00285f', '#0063af', '#9ed1f5'],
  light: ['#0d408c', '#408cd9', '#cce6ff'],
  kabi: ['#003373', '#005ac8', '#99ccfa'],
  helios: ['#004033', '#00967d', '#99ebd1'],
  teal: ['#003359', '#00738c', '#99e0eb'],
};

let flowId = 0;

/**
 * Builds the flow background element.
 * @param {string} name palette name (blue, light, kabi, helios, teal)
 * @param {number} seed phase offset so neighbouring tiles differ
 * @param {number} ribbon vertical position of the ribbons (0..1)
 * @returns {HTMLDivElement}
 */
export function buildFlow(name = 'blue', seed = 0, ribbon = 0.42) {
  const [d, m, g] = PALETTES[name] || PALETTES.blue;
  flowId += 1;
  const id = `flow${flowId}`;
  const paths = [];
  for (let i = 0; i < 4; i += 1) {
    const amp = 18 + i * 7;
    const ph = seed + i * 1.3;
    const y0 = ribbon * 100 + (i - 1.5) * 6;
    let dstr = '';
    for (let x = 0; x <= 120; x += 4) {
      const y = y0 + Math.sin(x / 16 + ph) * amp * 0.35 + Math.sin(x / 7 + ph * 2) * amp * 0.12;
      dstr += `${x ? 'L' : 'M'}${x} ${y.toFixed(2)} `;
    }
    paths.push(`<path d="${dstr}" stroke="${g}" stroke-width="${i % 2 ? 0.35 : 0.6}" fill="none" opacity="${0.35 + i * 0.12}" filter="url(#${id}b)"/>`);
  }
  const bg = document.createElement('div');
  bg.className = 'flow-bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.style.background = `linear-gradient(135deg, ${d} 10%, ${m} 100%)`;
  bg.innerHTML = `<svg viewBox="0 0 120 100" preserveAspectRatio="none"><defs><filter id="${id}b" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation=".6"/></filter><radialGradient id="${id}r" cx="80%" cy="0%" r="70%"><stop offset="0" stop-color="${g}" stop-opacity=".35"/><stop offset="1" stop-color="${g}" stop-opacity="0"/></radialGradient></defs><rect width="120" height="100" fill="url(#${id}r)"/><g>${paths.join('')}</g></svg>`;
  return bg;
}

/** true if the text is a known palette name */
export const isPalette = (text) => Object.keys(PALETTES).includes((text || '').trim().toLowerCase());
