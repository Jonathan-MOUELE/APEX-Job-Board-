/**
 * APEX — service-worker.js
 * ────────────────────────
 * Stratégies de cache (Workbox-inspired) :
 *  · Cache First    → assets statiques (JS, CSS, fonts, images)
 *  · Network First  → appels API France Travail / backend .NET
 *  · Stale-While-Revalidate → pages HTML
 */

const VERSION    = 'apex-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE   = `${VERSION}-api`;

// Assets critiques à précacher au premier install
const PRECACHE = [
  '/',
  '/index.html',
  '/legal.html',
  '/entreprises.html',
  '/js/core.js',
  '/js/auth.js',
  '/js/search.js',
  '/js/ui.js',
  '/js/features.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,800&display=swap',
  'https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js',
];

// Durée de vie du cache API (5 minutes)
const API_TTL_MS = 5 * 60 * 1000;

// ─────────────────────────────────
//  INSTALL — précachage du shell
// ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => {
        // Ignore les erreurs de précachage (réseau indispo, chemin relatif)
        return Promise.allSettled(
          PRECACHE.map(url => cache.add(url).catch(() => {}))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────
//  ACTIVATE — nettoyage ancien cache
// ─────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== SHELL_CACHE && k !== API_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────
//  FETCH — routage des stratégies
// ─────────────────────────────────
self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);

  // Ignorer POST, extensions de navigateur, etc.
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Stratégie 1 : Network First → API backend
  if (url.port === '5191' || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stratégie 2 : Cache First → assets JS/CSS/fonts/images
  if (_isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stratégie 3 : Stale-While-Revalidate → HTML pages
  event.respondWith(staleWhileRevalidate(request));
});

// ─────────────────────────────────
//  STRATÉGIES
// ─────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', {status: 503, statusText: 'Offline'});
  }
}

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cloned = response.clone();
      // Ajoute un timestamp pour expiration
      const headers = new Headers(cloned.headers);
      headers.set('sw-fetched-at', Date.now().toString());
      const body = await cloned.arrayBuffer();
      cache.put(request, new Response(body, {status: response.status, headers}));
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const fetchedAt = parseInt(cached.headers.get('sw-fetched-at')||'0');
      if (Date.now() - fetchedAt < API_TTL_MS) return cached;
    }
    // Réponse offline générique pour l'API
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'APEX est hors-ligne. Reconnectez-vous pour accéder aux offres.',
    }), {status: 503, headers: {'Content-Type':'application/json'}});
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// ─────────────────────────────────
//  HELPERS
// ─────────────────────────────────
function _isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|webp|ico|gif)(\?.*)?$/i.test(url.pathname)
    || url.hostname.includes('fonts.googleapis')
    || url.hostname.includes('fonts.gstatic')
    || url.hostname.includes('unpkg.com')
    || url.hostname.includes('logo.clearbit.com');
}

// ─────────────────────────────────
//  MESSAGE — skip waiting manuellement
// ─────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') self.skipWaiting();
});
