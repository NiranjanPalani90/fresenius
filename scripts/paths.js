/**
 * Returns the content root of the current page: '/content' when pages are
 * served from the local content folder (/content/...), '' on the live site.
 */
export function getContentRoot() {
  const { pathname } = window.location;
  return pathname === '/content' || pathname.startsWith('/content/') ? '/content' : '';
}

/**
 * Resolves a site path (e.g. '/investors') against the content root.
 * @param {string} path root-relative site path
 */
export function sitePath(path) {
  const root = getContentRoot();
  if (!root || !path.startsWith('/') || path.startsWith(`${root}/`)) return path;
  return path === '/' ? `${root}/index` : `${root}${path}`;
}
