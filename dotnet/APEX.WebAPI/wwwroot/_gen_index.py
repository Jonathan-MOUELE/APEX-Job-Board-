"""Generates a clean index.html for APEX. Run: python _gen_index.py"""
from pathlib import Path

HTML = r"""<!DOCTYPE html>
<html class="dark" lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-Content-Type-Options" content="nosniff"/>
  <meta name="referrer" content="strict-origin-when-cross-origin"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:5189 https://localhost:5189 http://localhost:5191 https://localhost:5191 https://geo.api.gouv.fr; frame-ancestors 'none';"/>
  <title>APEX | Recherche d'emploi IA</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: { extend: {
        fontFamily: { display: ['"DM Sans"', 'sans-serif'], sans: ['Inter', 'sans-serif'] }
      }}
    };
  </script>
  <style>
    :root {
      --bg: #09090b; --surface: #111113; --elevated: #1a1a1f;
      --border: rgba(255,255,255,0.07);
      --text: #f4f4f5; --muted: #71717a;
      --accent: #ff8e80; --accent-warm: #fe9400;
    }
    html:not(.dark) {
      --bg: #fafafa; --surface: #ffffff; --elevated: #f4f4f5;
      --border: rgba(0,0,0,0.08);
      --text: #09090b; --muted: #71717a;
      --accent: #e8614f; --accent-warm: #d97706;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: Inter, sans-serif; min-height: 100vh; overflow-x: hidden; }
    .glass { background: color-mix(in srgb, var(--surface) 85%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
    .sector-card { transition: transform .25s ease, box-shadow .25s ease; }
    .sector-card:hover { transform: translateY(-4px); box-shadow: 0 24px 44px rgba(0,0,0,.32); }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    #jobPanel { transition: transform .35s cubic-bezier(.16,1,.3,1); }
    #chatOverlay { display: none; }
    #chatOverlay.visible { display: flex; }
    #loginModal { display: none; }
    #loginModal.visible { display: flex; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .sk { border-radius: 8px; background: linear-gradient(90deg, var(--elevated) 25%, var(--bg) 50%, var(--elevated) 75%); background-size: 200% 100%; animation: shimmer 1.6s infinite; }
    /* Quick-search suggestion dropdown */
    #suggestBox { display: none; position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 100;
      background: var(--elevated); border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }
    #suggestBox.visible { display: block; }
    #suggestBox button { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .6rem 1rem;
      font-size: .83rem; text-align: left; color: var(--text); transition: background .12s; border: none; background: none; cursor: pointer; }
    #suggestBox button:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
  </style>
</head>
<body>

<!-- ═══════════════════ HEADER ═══════════════════ -->
<header class="sticky top-0 z-50 border-b glass" style="border-color:var(--border)">
  <div class="mx-auto max-w-7xl px-6">
    <div class="flex h-20 items-center justify-between gap-4">
      <a href="/" class="flex items-center gap-3 shrink-0">
        <div class="h-10 w-10 rounded-2xl grid place-content-center font-bold text-lg"
             style="background:color-mix(in srgb,var(--accent) 15%,transparent);color:var(--accent)">A</div>
        <div>
          <p class="text-xl font-extrabold leading-none" style="font-family:'DM Sans',sans-serif">APEX</p>
          <p class="text-[10px] uppercase tracking-[0.18em]" style="color:var(--muted)">by AVERS</p>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-7 text-sm font-medium">
        <a class="transition hover:text-[--accent]" style="color:var(--text)"
           href="#" onclick="scrollToResults(); return false;">Jobs</a>
        <a class="transition" style="color:var(--muted)" href="#">Candidatures</a>
        <a class="transition" style="color:var(--muted)" href="#">Suivi</a>
      </nav>
      <div class="flex items-center gap-3">
        <button id="themeToggle" onclick="toggleTheme()"
                class="rounded-xl border p-2 transition hover:opacity-75"
                style="border-color:var(--border)" aria-label="Changer de thème">
          <i id="themeIcon" data-lucide="sun" class="h-4 w-4"></i>
        </button>
        <a href="#" id="loginLink" onclick="openLogin(); return false;"
           class="rounded-xl border px-4 py-2 text-sm transition hover:opacity-80"
           style="border-color:var(--border);color:var(--text)">Se connecter</a>
        <button id="avatarBtn" onclick="openProfilePanel()"
                class="hidden h-10 w-10 rounded-full text-sm font-bold transition hover:opacity-80"
                style="background:color-mix(in srgb,var(--accent) 15%,transparent);color:var(--accent)">JS</button>
      </div>
    </div>
  </div>
</header>

<!-- ═══════════════════ MAIN ═══════════════════ -->
<main>

  <!-- HERO ─────────────────────────────────────── -->
  <section class="mx-auto max-w-7xl px-6 py-24 lg:py-32">
    <div class="max-w-3xl">
      <span class="inline-flex rounded-full px-4 py-2 text-xs uppercase tracking-wider"
            style="background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent)">
        Propulsé par AVERS · IA intégrée
      </span>
      <h1 class="mt-8 text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl"
          style="font-family:'DM Sans',sans-serif">
        Trouvez le poste<br/>
        <span style="color:var(--accent)">qui vous ressemble.</span>
      </h1>
      <p class="mt-6 max-w-lg text-lg" style="color:var(--muted)">
        Des milliers d'offres analysées en temps réel. Filtrées, classées, décryptées selon votre profil.
      </p>

      <!-- Search bar -->
      <div class="mt-9 rounded-3xl border p-3 shadow-2xl"
           style="border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.04)">
        <div class="relative flex flex-col gap-3 sm:flex-row">
          <div class="relative flex-1">
            <input id="heroKeyword" type="search" autocomplete="off"
                   class="h-12 w-full rounded-xl border px-4 text-base outline-none focus:ring-2"
                   style="border-color:var(--border);background:var(--surface);color:var(--text);focus-ring-color:var(--accent)"
                   placeholder="Métier, compétence..."
                   oninput="onKeywordInput(this.value)"
                   onkeydown="if(event.key==='Enter')performSearch()"
                   aria-label="Métier ou compétence" aria-autocomplete="list"/>
            <div id="suggestBox" role="listbox">
              <!-- filled by JS -->
            </div>
          </div>
          <input id="heroLocation" type="text" autocomplete="off"
                 class="sm:w-44 h-12 rounded-xl border px-4 text-base outline-none focus:ring-2"
                 style="border-color:var(--border);background:var(--surface);color:var(--text)"
                 placeholder="Ville"
                 onkeydown="if(event.key==='Enter')performSearch()"
                 aria-label="Ville"/>
          <button onclick="performSearch()"
                  class="h-12 rounded-xl px-6 text-sm font-semibold transition hover:brightness-110 shrink-0"
                  style="background:var(--accent);color:#09090b">
            Rechercher →
          </button>
        </div>
      </div>

      <!-- Quick suggestions -->
      <div class="mt-5 flex flex-wrap gap-2">
        <span class="text-xs self-center" style="color:var(--muted)">Tendances :</span>
        <button onclick="triggerSearch('Dev Full Stack')"
                class="rounded-full border px-4 py-1.5 text-sm transition hover:border-[--accent]"
                style="border-color:var(--border);color:var(--muted)">Dev Full Stack</button>
        <button onclick="triggerSearch('Data Scientist')"
                class="rounded-full border px-4 py-1.5 text-sm transition hover:border-[--accent]"
                style="border-color:var(--border);color:var(--muted)">Data Scientist</button>
        <button onclick="triggerSearch('Designer UX')"
                class="rounded-full border px-4 py-1.5 text-sm transition hover:border-[--accent]"
                style="border-color:var(--border);color:var(--muted)">Designer UX</button>
        <button onclick="triggerSearch('DevOps')"
                class="rounded-full border px-4 py-1.5 text-sm transition hover:border-[--accent]"
                style="border-color:var(--border);color:var(--muted)">DevOps</button>
        <button onclick="triggerSearch('Commercial')"
                class="rounded-full border px-4 py-1.5 text-sm transition hover:border-[--accent]"
                style="border-color:var(--border);color:var(--muted)">Commercial</button>
        <button onclick="triggerSearch('Infirmier')"
                class="rounded-full border px-4 py-1.5 text-sm transition hover:border-[--accent]"
                style="border-color:var(--border);color:var(--muted)">Infirmier</button>
      </div>
    </div>
  </section>

  <!-- TRUST BAR ─────────────────────────────────── -->
  <section class="border-y py-4" style="border-color:var(--border)">
    <div class="mx-auto max-w-7xl px-6">
      <div class="flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-wider" style="color:var(--muted)">
        <span>Offres via France Travail</span>
        <span>IA Gemini</span>
        <span>Données chiffrées</span>
        <span>100% gratuit</span>
      </div>
    </div>
  </section>

  <!-- SECTORS ───────────────────────────────────── -->
  <section class="mx-auto max-w-7xl px-6 py-20">
    <h2 class="text-4xl font-extrabold" style="font-family:'DM Sans',sans-serif">Explorez par secteur</h2>
    <p class="mt-3 text-base" style="color:var(--muted)">Choisissez votre domaine, l'IA fait le reste.</p>

    <div class="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4" style="grid-auto-rows:200px">

      <!-- Featured 2×2 -->
      <article onclick="triggerSearch('développeur informatique')"
               class="sector-card relative col-span-2 row-span-2 rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-7 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">Numérique</span>
          <h3 class="text-2xl font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Ingénierie logicielle</h3>
          <p class="mt-2 text-sm max-w-xs" style="color:var(--muted)">Backend, frontend, cloud, data et IA appliquée.</p>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 28%,transparent 70%)"></div>
      </article>

      <!-- Regular cards -->
      <article onclick="triggerSearch('infirmier aide soignant médecin')"
               class="sector-card relative rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">Santé</span>
          <h3 class="text-lg font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Soins &amp; médical</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

      <article onclick="triggerSearch('cuisinier chef hôtellerie')"
               class="sector-card relative rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">Restauration</span>
          <h3 class="text-lg font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Cuisine &amp; service</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

      <article onclick="triggerSearch('logisticien supply chain transport')"
               class="sector-card relative rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">Logistique</span>
          <h3 class="text-lg font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Supply chain</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

      <article onclick="triggerSearch('conducteur travaux ingénieur BTP')"
               class="sector-card relative rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">BTP</span>
          <h3 class="text-lg font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Construction</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

      <article onclick="triggerSearch('comptable analyste financier audit')"
               class="sector-card relative col-span-2 rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">Finance</span>
          <h3 class="text-xl font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Audit, contrôle, stratégie</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

      <article onclick="triggerSearch('marketing digital SEO communication')"
               class="sector-card relative rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">Marketing</span>
          <h3 class="text-lg font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Acquisition</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

      <article onclick="triggerSearch('recruteur ressources humaines')"
               class="sector-card relative rounded-3xl overflow-hidden border cursor-pointer"
               style="border-color:var(--border);background:var(--surface)">
        <div class="absolute inset-0 p-5 flex flex-col justify-end z-10">
          <span class="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-2 w-fit"
                style="background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)">RH</span>
          <h3 class="text-lg font-bold" style="font-family:'DM Sans',sans-serif;color:var(--text)">Talent &amp; recrutement</h3>
        </div>
        <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,var(--surface) 35%,transparent 75%)"></div>
      </article>

    </div>
  </section>

  <!-- RESULTS ───────────────────────────────────── -->
  <section id="resultsSection" class="hidden mx-auto max-w-7xl px-6 py-16">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h2 id="resultsTitle" class="text-3xl font-extrabold" style="font-family:'DM Sans',sans-serif">0 offres</h2>
      <div class="flex items-center gap-2">
        <select id="sortSelect" onchange="setFilter('sort', this.value)"
                class="h-11 rounded-xl border px-3 text-sm"
                style="border-color:var(--border);background:var(--surface);color:var(--text)">
          <option value="relevance">Trier : Pertinence</option>
          <option value="date">Plus récentes</option>
        </select>
      </div>
    </div>
    <div id="resultsGrid" class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"></div>
    <div id="pagination" class="mt-8 flex flex-wrap gap-2"></div>
    <div id="emptyState" class="hidden mt-12 rounded-3xl border p-12 text-center"
         style="border-color:var(--border);background:var(--surface)">
      <p class="text-2xl font-bold" style="font-family:'DM Sans',sans-serif">Aucune offre trouvée.</p>
      <p class="mt-2 text-sm" style="color:var(--muted)">Essayez un autre métier ou une autre ville.</p>
    </div>
  </section>

  <!-- HOW IT WORKS ──────────────────────────────── -->
  <section class="mx-auto max-w-7xl px-6 py-20">
    <h2 class="text-4xl font-extrabold" style="font-family:'DM Sans',sans-serif">Simple. Rapide. Intelligent.</h2>
    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <article class="rounded-3xl border p-7" style="border-color:var(--border);background:var(--surface)">
        <p class="text-5xl font-extrabold" style="font-family:'DM Sans',sans-serif;color:var(--accent)">01</p>
        <h3 class="mt-4 text-xl font-bold" style="font-family:'DM Sans',sans-serif">Cherchez</h3>
        <p class="mt-2 text-sm" style="color:var(--muted)">Tapez votre métier et votre zone géographique.</p>
      </article>
      <article class="rounded-3xl border p-7" style="border-color:var(--border);background:var(--surface)">
        <p class="text-5xl font-extrabold" style="font-family:'DM Sans',sans-serif;color:var(--accent)">02</p>
        <h3 class="mt-4 text-xl font-bold" style="font-family:'DM Sans',sans-serif">L'IA analyse</h3>
        <p class="mt-2 text-sm" style="color:var(--muted)">Matching personnalisé en quelques secondes.</p>
      </article>
      <article class="rounded-3xl border p-7" style="border-color:var(--border);background:var(--surface)">
        <p class="text-5xl font-extrabold" style="font-family:'DM Sans',sans-serif;color:var(--accent)">03</p>
        <h3 class="mt-4 text-xl font-bold" style="font-family:'DM Sans',sans-serif">Postulez</h3>
        <p class="mt-2 text-sm" style="color:var(--muted)">Accédez directement au lien de candidature.</p>
      </article>
    </div>
  </section>

  <!-- CTA ───────────────────────────────────────── -->
  <section class="mx-auto max-w-7xl px-6 pb-24">
    <div class="rounded-3xl p-10 md:p-14"
         style="background:linear-gradient(135deg,var(--accent),var(--accent-warm));color:#09090b">
      <h2 class="text-4xl font-extrabold" style="font-family:'DM Sans',sans-serif">
        Prêt à trouver votre prochain poste ?
      </h2>
      <p class="mt-3 max-w-lg opacity-80 text-sm">
        Créez votre profil gratuit pour activer le matching IA et suivre vos candidatures.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-4">
        <a href="#" onclick="openLogin(); return false;"
           class="rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-90"
           style="background:#09090b;color:#f4f4f5">Créer mon compte gratuit →</a>
        <button onclick="scrollToResults()"
                class="text-sm font-semibold underline opacity-80 hover:opacity-100">
          Ou explorer sans compte →
        </button>
      </div>
    </div>
  </section>

</main>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="border-t" style="border-color:var(--border)">
  <div class="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
    <div class="col-span-2 md:col-span-1">
      <p class="text-2xl font-extrabold" style="font-family:'DM Sans',sans-serif">APEX</p>
      <p class="mt-3 text-sm" style="color:var(--muted)">Plateforme de recherche d'emploi enrichie par IA.</p>
    </div>
    <div>
      <p class="font-semibold text-sm">Produit</p>
      <ul class="mt-3 space-y-2 text-sm" style="color:var(--muted)">
        <li><a href="#" class="hover:underline">Jobs</a></li>
        <li><a href="#" class="hover:underline">Candidatures</a></li>
        <li><a href="#" class="hover:underline">Suivi</a></li>
      </ul>
    </div>
    <div>
      <p class="font-semibold text-sm">Légal</p>
      <ul class="mt-3 space-y-2 text-sm" style="color:var(--muted)">
        <li><a href="#" class="hover:underline">RGPD</a></li>
        <li><a href="#" class="hover:underline">Confidentialité</a></li>
        <li><a href="#" class="hover:underline">Mentions légales</a></li>
      </ul>
    </div>
    <div>
      <p class="font-semibold text-sm">Contact</p>
      <p class="mt-3 text-sm" style="color:var(--muted)">support@avers.fr</p>
    </div>
  </div>
  <div class="mx-auto max-w-7xl px-6 pb-10 text-xs" style="color:var(--muted)">
    <p>Les offres d'emploi sont fournies par France Travail (Pôle emploi) via l'API Offres d'emploi v2.
       APEX&nbsp;/&nbsp;AVERS n'est pas affilié à France Travail.</p>
    <p class="mt-3">© 2025 AVERS. Tous droits réservés.</p>
  </div>
</footer>

<!-- ═══════════════════ SIDEPANEL – Job detail ═══════════════════ -->
<aside id="jobPanel"
       class="fixed right-0 top-0 z-[70] h-full w-full max-w-xl translate-x-full border-l overflow-y-auto p-6"
       style="border-color:var(--border);background:var(--elevated);transition:transform .35s cubic-bezier(.16,1,.3,1)"
       aria-label="Détails de l'offre">
  <!-- filled by JS -->
</aside>

<!-- ═══════════════════ OVERLAY – AI chat ═══════════════════ -->
<div id="chatOverlay"
     class="fixed inset-0 z-[80] items-end justify-end p-4 sm:p-6 bg-black/60"
     role="dialog" aria-modal="true" aria-label="Agent APEX">
  <div class="flex h-[72vh] w-full max-w-md flex-col rounded-3xl p-5"
       style="background:var(--elevated);border:1px solid var(--border)">
    <div class="mb-4 flex items-center justify-between shrink-0">
      <h3 class="text-xl font-bold" style="font-family:'DM Sans',sans-serif">Agent APEX</h3>
      <button onclick="closeChat()" class="rounded-xl border p-2 transition hover:opacity-70"
              style="border-color:var(--border)" aria-label="Fermer">
        <i data-lucide="x" class="h-4 w-4"></i>
      </button>
    </div>
    <div id="chatBody" class="flex-1 overflow-y-auto text-sm space-y-3 pr-1" style="color:var(--muted)">
      <p>Posez vos questions à l'agent APEX.</p>
    </div>
    <div class="mt-3 flex gap-2 shrink-0">
      <input id="chatInput" type="text"
             class="flex-1 h-11 rounded-xl border px-3 text-sm outline-none"
             style="border-color:var(--border);background:var(--surface);color:var(--text)"
             placeholder="Votre message…"
             onkeydown="if(event.key==='Enter')sendChat()"
             aria-label="Message pour l'agent"/>
      <button onclick="sendChat()"
              class="h-11 rounded-xl px-4 text-sm font-semibold transition hover:brightness-110 shrink-0"
              style="background:var(--accent);color:#09090b">Envoyer</button>
    </div>
  </div>
</div>

<!-- ═══════════════════ MODAL – Login ═══════════════════ -->
<div id="loginModal"
     class="fixed inset-0 z-[90] items-center justify-center bg-black/70 p-4"
     role="dialog" aria-modal="true" aria-label="Connexion">
  <div class="w-full max-w-md rounded-3xl p-6" style="background:var(--elevated);border:1px solid var(--border)">
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-2xl font-bold" style="font-family:'DM Sans',sans-serif">Connexion</h3>
      <button onclick="closeLogin()" class="rounded-xl border p-2 transition hover:opacity-70"
              style="border-color:var(--border)" aria-label="Fermer">
        <i data-lucide="x" class="h-4 w-4"></i>
      </button>
    </div>
    <input id="loginEmail" type="email" autocomplete="email"
           class="h-12 w-full rounded-xl border px-4 text-sm outline-none focus:ring-2"
           style="border-color:var(--border);background:var(--surface);color:var(--text)"
           placeholder="Email"/>
    <input id="loginPassword" type="password" autocomplete="current-password"
           class="mt-3 h-12 w-full rounded-xl border px-4 text-sm outline-none focus:ring-2"
           style="border-color:var(--border);background:var(--surface);color:var(--text)"
           placeholder="Mot de passe"
           onkeydown="if(event.key==='Enter')handleLogin()"/>
    <p id="loginError" class="mt-2 hidden text-xs" style="color:#ef4444"></p>
    <button onclick="handleLogin()"
            class="mt-4 h-12 w-full rounded-xl text-sm font-semibold transition hover:brightness-110"
            style="background:var(--accent);color:#09090b">Se connecter</button>
    <p class="mt-3 text-xs text-center" style="color:var(--muted)">
      Pas encore de compte ? <a href="#" onclick="closeLogin(); return false;" class="underline hover:opacity-80">Créer un compte</a>
    </p>
  </div>
</div>

<!-- ═══════════════════ FAB ═══════════════════ -->
<button onclick="openChat()"
        class="fixed bottom-6 right-6 z-[85] h-14 w-14 rounded-full grid place-content-center shadow-2xl transition hover:brightness-110"
        style="background:var(--accent);color:#09090b"
        aria-label="Ouvrir l'agent IA">
  <i data-lucide="sparkles" class="h-6 w-6"></i>
</button>

<!-- ═══════════════════ SCRIPTS ═══════════════════ -->
<script>
'use strict';
const API_BASE = 'http://localhost:5191';
const pageState = { allJobs: [], page: 1, perPage: 9, query: '' };

/* ── Sanitize (XSS guard) ───────────────────────────── */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = (str == null ? '' : String(str));
  return d.textContent;
}

/* ── Theme ──────────────────────────────────────────── */
function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  document.getElementById('themeIcon').setAttribute('data-lucide', dark ? 'sun' : 'moon');
  lucide.createIcons();
}

/* ── Auth UI ────────────────────────────────────────── */
function updateAuthUI() {
  const token = localStorage.getItem('apex_token');
  document.getElementById('avatarBtn').classList.toggle('hidden', !token);
  document.getElementById('loginLink').classList.toggle('hidden', !!token);
}

/* ── Login modal ────────────────────────────────────── */
function openLogin()  { document.getElementById('loginModal').classList.add('visible'); }
function closeLogin() { document.getElementById('loginModal').classList.remove('visible'); }

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.classList.add('hidden');
  if (!email || !password) {
    errEl.textContent = 'Remplissez tous les champs.';
    errEl.classList.remove('hidden');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Identifiants incorrects.');
    const data = await res.json();
    if (data && data.token) localStorage.setItem('apex_token', data.token);
    closeLogin();
    updateAuthUI();
  } catch (e) {
    errEl.textContent = esc(e.message) || 'Erreur de connexion.';
    errEl.classList.remove('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem('apex_token');
  updateAuthUI();
}

/* ── Profile panel ──────────────────────────────────── */
function openProfilePanel() {
  // placeholder — extend with a real panel when needed
  alert('Profil utilisateur (à implémenter)');
}

/* ── Chat overlay ───────────────────────────────────── */
function openChat()  { document.getElementById('chatOverlay').classList.add('visible'); }
function closeChat() { document.getElementById('chatOverlay').classList.remove('visible'); }

async function sendChat() {
  const input = document.getElementById('chatInput');
  const body  = document.getElementById('chatBody');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';

  const userLine = document.createElement('p');
  userLine.className = 'text-right text-sm font-medium';
  userLine.style.color = 'var(--accent)';
  userLine.textContent = msg;
  body.appendChild(userLine);

  const thinking = document.createElement('p');
  thinking.className = 'text-sm italic opacity-60';
  thinking.textContent = 'Agent APEX réfléchit…';
  body.appendChild(thinking);
  body.scrollTop = body.scrollHeight;

  try {
    const token = localStorage.getItem('apex_token');
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message: msg }),
      credentials: 'include'
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    thinking.classList.remove('italic', 'opacity-60');
    thinking.textContent = esc(data.reply || data.message || 'Réponse reçue.');
  } catch {
    thinking.classList.remove('italic', 'opacity-60');
    thinking.textContent = 'Service IA temporairement indisponible.';
  }
  body.scrollTop = body.scrollHeight;
}

/* ── Search ─────────────────────────────────────────── */
const SUGGEST_POOL = [
  'Développeur Full Stack','Data Scientist','Designer UX/UI','DevOps','Ingénieur Cloud',
  'Chef de projet IT','Commercial B2B','Infirmier','Aide-soignant','Comptable',
  'Contrôleur de gestion','Chef cuisinier','Logisticien','Conducteur de travaux',
  'Chargé de marketing','Recruteur','Community Manager','Product Manager'
];

function onKeywordInput(val) {
  const box = document.getElementById('suggestBox');
  if (!val || val.length < 2) { box.classList.remove('visible'); return; }
  const q = val.toLowerCase();
  const hits = SUGGEST_POOL.filter(s => s.toLowerCase().includes(q)).slice(0, 6);
  if (!hits.length) { box.classList.remove('visible'); return; }
  box.innerHTML = '';
  hits.forEach(h => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.textContent = h; // textContent is XSS-safe
    btn.onclick = () => { triggerSearch(h); };
    box.appendChild(btn);
  });
  box.classList.add('visible');
}

function triggerSearch(keyword) {
  document.getElementById('heroKeyword').value = keyword;
  document.getElementById('suggestBox').classList.remove('visible');
  performSearch();
}

function scrollToResults() {
  document.getElementById('resultsSection').classList.remove('hidden');
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

async function performSearch() {
  const keyword  = document.getElementById('heroKeyword').value.trim();
  const location = document.getElementById('heroLocation').value.trim();
  pageState.query = keyword || 'toutes offres';
  pageState.page  = 1;

  const section = document.getElementById('resultsSection');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showSkeletons();

  try {
    const token  = localStorage.getItem('apex_token');
    const params = new URLSearchParams({ keyword, location });
    const res    = await fetch(`${API_BASE}/api/jobs/search?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include'
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    pageState.allJobs = Array.isArray(data) ? data : (data.items || data.offres || []);
  } catch {
    pageState.allJobs = [];
  }
  renderResults();
}

function showSkeletons() {
  const grid = document.getElementById('resultsGrid');
  grid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('div');
    c.className = 'rounded-3xl border p-5 flex flex-col gap-4';
    c.style.cssText = 'border-color:var(--border);background:var(--surface)';
    c.innerHTML = `
      <div class="flex gap-3">
        <div class="sk shrink-0" style="width:44px;height:44px;border-radius:12px"></div>
        <div class="flex-1 flex flex-col gap-2">
          <div class="sk h-4 w-4/5 rounded"></div>
          <div class="sk h-3 w-3/5 rounded"></div>
        </div>
      </div>
      <div class="sk h-3 rounded"></div>
      <div class="sk h-3 w-4/5 rounded"></div>`;
    grid.appendChild(c);
  }
}

function setFilter(name, val) {
  if (name === 'sort' && val === 'date') {
    pageState.allJobs = [...pageState.allJobs].sort(
      (a, b) => new Date(b.dateCreation || b.date || 0) - new Date(a.dateCreation || a.date || 0)
    );
  }
  pageState.page = 1;
  renderResults();
}

function formatSalary(min, max, currency) {
  if (!min && !max) return 'Salaire NC';
  const fmt = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0
  });
  if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  return min ? `À partir de ${fmt.format(min)}` : `Jusqu'à ${fmt.format(max)}`;
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function renderResults() {
  const total = pageState.allJobs.length;
  document.getElementById('resultsTitle').textContent =
    `${total} offre${total !== 1 ? 's' : ''} pour « ${pageState.query} »`;

  const grid  = document.getElementById('resultsGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (!total) {
    empty.classList.remove('hidden');
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  empty.classList.add('hidden');

  const start = (pageState.page - 1) * pageState.perPage;
  const items = pageState.allJobs.slice(start, start + pageState.perPage);
  const token = localStorage.getItem('apex_token');

  items.forEach((job, idx) => {
    const globalIdx = start + idx;
    const name      = job.company || job.entreprise?.nom || 'Entreprise';
    const city      = job.city || job.lieuTravail?.libelle || 'France';
    const initial   = name.charAt(0).toUpperCase() || 'A';
    const srcFlag   = (job.source === 'fr' || !job.source) ? '🇫🇷' : '🌍';
    const salary    = formatSalary(job.salaryMin, job.salaryMax, job.currency);
    const contract  = job.contractType || job.typeContrat || 'CDI';

    const card = document.createElement('article');
    card.className = 'rounded-3xl border p-5 flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-xl';
    card.style.cssText = 'border-color:var(--border);background:var(--surface)';
    card.addEventListener('click', () => openJob(globalIdx));

    /* Logo row */
    const logoRow = document.createElement('div');
    logoRow.className = 'flex items-start justify-between gap-3';

    const logoLeft = document.createElement('div');
    logoLeft.className = 'flex items-start gap-3 min-w-0';

    const letter = document.createElement('div');
    letter.className = 'shrink-0 h-11 w-11 rounded-xl grid place-content-center font-bold text-lg';
    letter.style.cssText = 'background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)';
    letter.textContent = initial;

    const meta = document.createElement('div');
    meta.className = 'min-w-0';

    const h3 = document.createElement('h3');
    h3.className = 'font-bold text-base line-clamp-2 leading-snug';
    h3.style.cssText = 'font-family:"DM Sans",sans-serif;color:var(--text)';
    h3.textContent = esc(job.title || job.appellation || 'Poste');

    const sub = document.createElement('p');
    sub.className = 'text-xs mt-0.5';
    sub.style.color = 'var(--muted)';
    sub.textContent = `${esc(name)} · ${esc(city)}`;

    meta.appendChild(h3);
    meta.appendChild(sub);
    logoLeft.appendChild(letter);
    logoLeft.appendChild(meta);

    const flag = document.createElement('span');
    flag.className = 'shrink-0 text-base';
    flag.textContent = srcFlag;

    logoRow.appendChild(logoLeft);
    logoRow.appendChild(flag);

    /* Tags */
    const tags = document.createElement('div');
    tags.className = 'flex flex-wrap gap-1.5';
    [contract, salary].forEach(t => {
      const s = document.createElement('span');
      s.className = 'rounded-full border px-3 py-1 text-xs';
      s.style.cssText = 'border-color:var(--border);color:var(--muted)';
      s.textContent = t;
      tags.appendChild(s);
    });
    if (token) {
      const m = document.createElement('span');
      m.className = 'rounded-full px-3 py-1 text-xs font-medium';
      m.style.cssText = 'background:rgba(34,197,94,.1);color:#22c55e';
      m.textContent = '98% Match';
      tags.appendChild(m);
    }

    /* Description snippet */
    const desc = document.createElement('p');
    desc.className = 'text-xs line-clamp-2 leading-relaxed';
    desc.style.color = 'var(--muted)';
    desc.textContent = stripHtml(job.description || job.descriptionOffre || '').slice(0, 180);

    /* Actions */
    const actions = document.createElement('div');
    actions.className = 'flex gap-2 mt-auto pt-1';

    const btnAI = document.createElement('button');
    btnAI.className = 'h-10 rounded-xl border px-3 text-sm transition hover:opacity-80';
    btnAI.style.cssText = 'border-color:var(--border);color:var(--text)';
    btnAI.textContent = 'Analyser IA';
    btnAI.onclick = e => { e.stopPropagation(); analyzeJob(globalIdx); };

    const btnApply = document.createElement('button');
    btnApply.className = 'h-10 flex-1 rounded-xl text-sm font-semibold transition hover:brightness-110';
    btnApply.style.cssText = 'background:var(--accent);color:#09090b';
    btnApply.textContent = "Voir l'offre →";
    btnApply.onclick = e => { e.stopPropagation(); openJob(globalIdx); };

    actions.appendChild(btnAI);
    actions.appendChild(btnApply);

    card.appendChild(logoRow);
    card.appendChild(tags);
    card.appendChild(desc);
    card.appendChild(actions);
    grid.appendChild(card);
  });

  renderPagination(total);
}

function renderPagination(total) {
  const pages = Math.ceil(total / pageState.perPage);
  const el = document.getElementById('pagination');
  el.innerHTML = '';
  if (pages <= 1) return;
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    const active = i === pageState.page;
    btn.className = 'h-10 min-w-[40px] rounded-xl border px-3 text-sm font-medium transition';
    btn.style.cssText = active
      ? 'border-color:transparent;background:var(--accent);color:#09090b'
      : 'border-color:var(--border);color:var(--muted)';
    btn.textContent = i;
    btn.onclick = () => {
      pageState.page = i;
      renderResults();
      document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    };
    el.appendChild(btn);
  }
}

/* ── Job Panel ──────────────────────────────────────── */
function openJob(index) {
  const job = pageState.allJobs[index];
  if (!job) return;
  const panel = document.getElementById('jobPanel');
  panel.innerHTML = '';

  /* Close btn */
  const closeBtn = document.createElement('button');
  closeBtn.className = 'mb-5 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition hover:opacity-70';
  closeBtn.style.cssText = 'border-color:var(--border);color:var(--muted)';
  closeBtn.textContent = '\u2190 Retour';
  closeBtn.onclick = closeJobPanel;

  /* Title block */
  const title = document.createElement('h2');
  title.className = 'text-2xl font-bold leading-tight';
  title.style.cssText = 'font-family:"DM Sans",sans-serif;color:var(--text)';
  title.textContent = esc(job.title || job.appellation || 'Poste');

  const company = document.createElement('p');
  company.className = 'mt-1 mb-5 text-sm';
  company.style.color = 'var(--muted)';
  company.textContent = `${esc(job.company || job.entreprise?.nom || '')} · ${esc(job.city || job.lieuTravail?.libelle || '')}`;

  /* Tags */
  const tags = document.createElement('div');
  tags.className = 'flex flex-wrap gap-2 mb-6';
  [job.contractType || job.typeContrat || 'CDI',
   formatSalary(job.salaryMin, job.salaryMax, job.currency)].forEach(t => {
    const s = document.createElement('span');
    s.className = 'rounded-full border px-3 py-1 text-xs';
    s.style.cssText = 'border-color:var(--border);color:var(--muted)';
    s.textContent = t;
    tags.appendChild(s);
  });

  /* Description */
  const descEl = document.createElement('p');
  descEl.className = 'text-sm leading-relaxed whitespace-pre-line';
  descEl.style.color = 'var(--muted)';
  descEl.textContent = stripHtml(job.description || job.descriptionOffre || 'Pas de description disponible.');

  /* Apply button */
  const applyBtn = document.createElement('a');
  applyBtn.className = 'mt-6 flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition hover:brightness-110';
  applyBtn.style.cssText = 'background:var(--accent);color:#09090b';
  const url = job.url || job.origineOffre?.urlOrigine;
  if (url && /^https:\/\//.test(url)) {
    applyBtn.href = url;
    applyBtn.target = '_blank';
    applyBtn.rel = 'noopener noreferrer';
  } else {
    applyBtn.href = '#';
  }
  applyBtn.textContent = "Postuler sur le site de l'entreprise →";

  panel.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(company);
  panel.appendChild(tags);
  panel.appendChild(descEl);
  panel.appendChild(applyBtn);

  panel.classList.remove('translate-x-full');
}

function closeJobPanel() {
  document.getElementById('jobPanel').classList.add('translate-x-full');
}

/* ── Analyze job via AI ─────────────────────────────── */
async function analyzeJob(index) {
  const job = pageState.allJobs[index];
  if (!job) return;
  openChat();
  const body = document.getElementById('chatBody');
  body.innerHTML = '';

  const msg = document.createElement('p');
  msg.className = 'text-sm italic opacity-60';
  msg.textContent = `Analyse IA en cours pour : ${esc(job.title || 'ce poste')}…`;
  body.appendChild(msg);

  try {
    const token = localStorage.getItem('apex_token');
    const res = await fetch(`${API_BASE}/api/ai/analyze-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        jobId: job.id || job.identifiant,
        title: job.title || job.appellation,
        description: stripHtml(job.description || job.descriptionOffre || '')
      }),
      credentials: 'include'
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    msg.classList.remove('italic', 'opacity-60');
    msg.textContent = esc(data.analysis || data.message || 'Analyse terminée.');
  } catch {
    msg.classList.remove('italic', 'opacity-60');
    msg.textContent = 'Service IA temporairement indisponible.';
  }
  body.scrollTop = body.scrollHeight;
}

/* ── Init ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  updateAuthUI();

  /* Close panels & modals on Escape */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeJobPanel();
    closeChat();
    closeLogin();
  });

  /* Close job panel when clicking outside (on mobile backdrop) */
  document.getElementById('chatOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeChat();
  });
  document.getElementById('loginModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLogin();
  });

  /* Hide suggest box on outside click */
  document.addEventListener('click', e => {
    if (!e.target.closest('#heroKeyword') && !e.target.closest('#suggestBox')) {
      document.getElementById('suggestBox').classList.remove('visible');
    }
  });
});
</script>
</body>
</html>
"""

out = Path(r"c:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\wwwroot\index.html")
out.write_text(HTML, encoding="utf-8")
print(f"Written: {out} ({out.stat().st_size:,} bytes)")
