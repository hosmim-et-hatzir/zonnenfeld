// Zonnenfeld Fight — its own (more specific) service worker so the parent site's worker does not control this game.
// Network-first for the page, cache-first for heavy immutable assets (models/portraits) so repeat visits load instantly.
const CACHE = 'zf-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('zf-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const heavy = /\/assets\/(chars|portraits)\//.test(url.pathname) || /\/assets\/.*\.(js|css)$/.test(url.pathname);
  if (heavy) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { c.put(req, res.clone()); c.keys().then(ks => ks.forEach(k => { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); })); }
      return res;
    }))));
  } else {
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => { }); return res; }).catch(() => caches.match(req)));
  }
});
