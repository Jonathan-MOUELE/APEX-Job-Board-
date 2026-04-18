/**
 * APEX — app.js  v1.0
 * Vanilla JS Module Pattern — NO framework
 * Port API : http://localhost:5191
 */
'use strict';

const APEX = (() => {
  // ─────────────────────────────────────────────
  //  Config
  // ─────────────────────────────────────────────
  const API = 'http://localhost:5191';
  const PAGE_SIZE = 5;

  // ─────────────────────────────────────────────
  //  State
  // ─────────────────────────────────────────────
  let _allJobs = [];
  let _currentJob = null;   // currently open job object
  let _currentJobIdx = -1;
  let _currentPage = 1;
  let _activeFilter = null;
  let _activeTabGroup = {}; // { groupId: activePanel }

  // ─────────────────────────────────────────────
  //  UTILS
  // ─────────────────────────────────────────────
  function esc(str) {
    if (str === null || str === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function formatSalary(label) {
    if (!label) return '';
    const cleaned = String(label)
      .replace(/euros?/gi, '€')
      .replace(/à/gi, '–')
      .replace(/\s+/g, ' ')
      .trim();
    // "44000 – 75000 €" → "44 000 – 75 000 €/an"
    return cleaned.replace(/(\d{4,})/g, n =>
      parseInt(n, 10).toLocaleString('fr-FR')
    ).replace(/€(?!\/)/g, '€/an');
  }

  function cleanDesc(raw, max = 120) {
    if (!raw) return '';
    return raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max) + (raw.length > max ? '…' : '');
  }

  function decodeUtf8Safe(str) {
    if (!str || typeof str !== 'string') return str || '';
    try { return decodeURIComponent(escape(str)); } catch (e) { }
    return str
      .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ã¦/g, 'æ')
      .replace(/Ã /g, 'à').replace(/Ã¢/g, 'â').replace(/Ã®/g, 'î')
      .replace(/Ã´/g, 'ô').replace(/Ã¹/g, 'ù').replace(/Ã»/g, 'û')
      .replace(/Ã§/g, 'ç').replace(/Ã‰/g, 'É').replace(/Ãª/g, 'ê')
      .replace(/Ã¼/g, 'ü').replace(/Ã«/g, 'ë').replace(/Ã¯/g, 'ï')
      .replace(/Ã¶/g, 'ö').replace(/Ã±/g, 'ñ')
      .replace(/â€™/g, "'").replace(/â€"/g, '–').replace(/â€"/g, '—')
      .replace(/â€œ/g, '"').replace(/â€/g, '"')
      .replace(/Ã¢â€šÂ¬/g, '€').replace(/â‚¬/g, '€')
      .replace(/Â°/g, '°').replace(/Â«/g, '«').replace(/Â»/g, '»')
      .replace(/Ã‚Â /g, ' ').replace(/\u00A0/g, ' ');
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToResults() {
    const el = document.getElementById('search-results');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function safeOpenUrl(url) {
    if (/^https:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // Lucide icon loader — appel immédiat + rattrapage dynamique 300ms
  function forceIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
      setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 300);
    } else {
      setTimeout(forceIcons, 80);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateAuthUI();
    forceIcons();

    // ... reste de ton init (IntersectionObserver, etc.)
  });
  // ─────────────────────────────────────────────
  //  SECURE FETCH (JWT + HttpOnly refresh)
  // ─────────────────────────────────────────────
  async function apiFetch(path, opts = {}) {
    opts.credentials = 'include';
    opts.headers = opts.headers || {};
    const token = localStorage.getItem('apex_token');
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (opts.body && !opts.headers['Content-Type']) {
      opts.headers['Content-Type'] = 'application/json';
    }

    let res = await fetch(API + path, opts);

    // Token expiry → try refresh
    if (res.status === 401) {
      try {
        const rr = await fetch(API + '/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (rr.ok) {
          const data = await rr.json();
          const newToken = data.accessToken || data.token;
          if (newToken) {
            localStorage.setItem('apex_token', newToken);
            opts.headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(API + path, opts);
          }
        } else {
          localStorage.removeItem('apex_token');
          localStorage.removeItem('apex_user');
          updateAuthUI();
        }
      } catch (_) { /* network error */ }
    }
    return res;
  }

  // ─────────────────────────────────────────────
  //  TOAST
  // ─────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const existing = document.getElementById('apex-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'apex-toast';
    const colors = { success: '#22c55e', warn: '#f59e0b', info: 'var(--orange)', error: '#ef4444' };
    const icons = { success: '✓', warn: '⚠', info: 'ℹ', error: '✕' };
    const c = colors[type] || colors.info;
    const ic = icons[type] || icons.info;
    t.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);
      background:var(--surface);border:1.5px solid ${c};color:var(--text);
      padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:99999;
      display:flex;align-items:center;gap:10px;max-width:90vw;
      opacity:0;transition:opacity .25s,transform .25s;
    `;
    t.innerHTML = `<span style="color:${c};font-size:16px">${ic}</span>${msg}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(12px)';
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }

  // ─────────────────────────────────────────────
  //  THEME
  // ─────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('apex_theme') || localStorage.getItem('apex-theme');
    const preferDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', preferDark);
    _updateThemeIcon(preferDark);
    forceIcons();
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('apex_theme', isDark ? 'dark' : 'light');
    localStorage.removeItem('apex-theme');
    _updateThemeIcon(isDark);
  }

  function _updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    if (window.lucide) lucide.createIcons({ nodes: [icon] });
  }

  // ─────────────────────────────────────────────
  //  AUTH
  // ─────────────────────────────────────────────
  function isLoggedIn() {
    return !!localStorage.getItem('apex_token');
  }

  function updateAuthUI() {
    const loginLink = document.getElementById('login-link');
    const authLoginBtn = document.getElementById('auth-login-btn');
    const authRegBtn = document.getElementById('auth-register-btn');
    const authProfileBtn = document.getElementById('auth-profile-btn');
    const avatarBtn = document.getElementById('avatar-btn');
    const avatarInit = document.getElementById('avatar-initials');
    const aiPill = document.getElementById('pill-ai');

    if (isLoggedIn()) {
      const user = _getUser();
      const initials = _makeInitials(user?.name || user?.email || 'U');
      if (loginLink) loginLink.classList.add('hidden');
      if (authLoginBtn) authLoginBtn.style.display = 'none';
      if (authRegBtn) authRegBtn.style.display = 'none';
      if (authProfileBtn) authProfileBtn.style.display = 'flex';
      if (avatarBtn) { avatarBtn.classList.remove('hidden'); }
      if (avatarInit) avatarInit.textContent = initials;
      if (aiPill) aiPill.classList.remove('hidden');
    } else {
      if (loginLink) loginLink.classList.remove('hidden');
      if (authLoginBtn) authLoginBtn.style.display = 'flex';
      if (authRegBtn) authRegBtn.style.display = 'flex';
      if (authProfileBtn) authProfileBtn.style.display = 'none';
      if (avatarBtn) avatarBtn.classList.add('hidden');
      if (aiPill) aiPill.classList.add('hidden');
    }
  }

  function _getUser() {
    try { return JSON.parse(localStorage.getItem('apex_user') || 'null'); }
    catch (_) { return null; }
  }

  function _makeInitials(str) {
    if (!str) return 'U';
    return String(str).split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function initialsColor(str) {
    const colors = [
      '#6366f1', '#f59e0b', '#10b981', '#ef4444',
      '#a855f7', '#ec4899', '#06b6d4', '#8b5cf6'
    ];
    let hash = 0;
    if (!str) return colors[0];
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function openLoginModal() {
    const m = document.getElementById('login-modal');
    if (m) m.classList.add('open');
    showBackdrop();
  }

  function closeLoginModal() {
    const m = document.getElementById('login-modal');
    if (m) m.classList.remove('open');
    hideBackdrop();
  }

  function openForgotModal() {
    closeLoginModal();
    const m = document.getElementById('forgot-modal');
    if (m) m.classList.add('open');
    showBackdrop();
    _setForgotStep(0);
  }

  function closeForgotModal() {
    const m = document.getElementById('forgot-modal');
    if (m) m.classList.remove('open');
    hideBackdrop();
  }

  async function handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email')?.value?.trim();
    const pwd = document.getElementById('login-pwd')?.value;
    const errEl = document.getElementById('login-error');
    const btnEl = document.getElementById('login-btn');

    if (!email || !pwd) {
      if (errEl) { errEl.textContent = 'Veuillez remplir tous les champs.'; errEl.classList.remove('hidden'); }
      return;
    }

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Connexion…'; }
    if (errEl) errEl.classList.add('hidden');

    try {
      const res = await fetch(API + '/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || data?.error || 'Email ou mot de passe incorrect.';
        if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
        return;
      }

      const token = data.accessToken || data.token;
      if (token) localStorage.setItem('apex_token', token);
      if (data.user) localStorage.setItem('apex_user', JSON.stringify(data.user));

      // Accès test Plan Ultra
      if (email.toLowerCase() === 'jonathanmouele42@gmail.com') {
        localStorage.setItem('apex_role', 'Admin');
        setTimeout(() => {
          const t = document.createElement('div');
          t.className = 'toast toast-success';
          t.textContent = '⚡ Mode Ultra activé — Bienvenue, Admin.';
          document.body.appendChild(t);
          setTimeout(() => t.remove(), 4000);
        }, 400);
      }

      closeLoginModal();
      updateAuthUI();
    } catch (_) {
      if (errEl) { errEl.textContent = 'Erreur réseau. Réessayez.'; errEl.classList.remove('hidden'); }
    } finally {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = '<i data-lucide="log-in" style="width:1rem;height:1rem;vertical-align:middle;display:inline-flex"></i> Se connecter'; if (window.lucide) lucide.createIcons({ nodes: [btnEl] });
      }
    }
  }

  async function handleRegister(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('reg-name')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const pwd = document.getElementById('reg-pass')?.value;

    if (!name || !email || !pwd) {
      showToast('Veuillez remplir tous les champs.', 'warn');
      return;
    }

    try {
      const res = await fetch(API + '/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pwd }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'Erreur lors de l’inscription.', 'error');
        return;
      }

      showToast('Inscription réussie ! Connectez-vous.', 'success');
      closeRegisterModal();
      openLoginModal();
    } catch (_) {
      showToast('Erreur réseau.', 'error');
    }
  }

  function openRegisterModal() {
    const m = document.getElementById('register-modal');
    if (m) m.classList.add('open');
    showBackdrop();
  }

  function closeRegisterModal() {
    const m = document.getElementById('register-modal');
    if (m) m.classList.remove('open');
    hideBackdrop();
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) { }
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    updateAuthUI();
    location.reload();
  }

  const SALARY_DATA = [
    { sector: 'Tech & IT', icon: 'laptop', junior: '2 666 €', confirme: '3 750 €', senior: '5 833 €' },
    { sector: 'Santé', icon: 'heart-pulse', junior: '2 000 €', confirme: '2 833 €', senior: '4 333 €' },
    { sector: 'BTP', icon: 'hard-hat', junior: '2 333 €', confirme: '3 166 €', senior: '4 833 €' },
    { sector: 'Commerce', icon: 'shopping-bag', junior: '1 833 €', confirme: '2 333 €', senior: '3 500 €' },
    { sector: 'Finance', icon: 'landmark', junior: '2 833 €', confirme: '4 000 €', senior: '6 666 €' },
    { sector: 'Logistique', icon: 'truck', junior: '2 000 €', confirme: '2 500 €', senior: '3 666 €' },
    { sector: 'Restauration', icon: 'utensils', junior: '1 666 €', confirme: '2 166 €', senior: '3 166 €' },
    { sector: 'Marketing', icon: 'trending-up', junior: '2 333 €', confirme: '3 166 €', senior: '4 833 €' },
    { sector: 'Juridique', icon: 'scale', junior: '2 666 €', confirme: '3 750 €', senior: '6 250 €' },
    { sector: 'Éducation', icon: 'graduation-cap', junior: '1 833 €', confirme: '2 333 €', senior: '3 500 €' },
    { sector: 'Environnement', icon: 'leaf', junior: '2 166 €', confirme: '2 833 €', senior: '4 166 €' },
    { sector: 'Hôtellerie', icon: 'bed', junior: '1 666 €', confirme: '2 166 €', senior: '3 333 €' },
  ];

  function openSalaryModal() {
    const rows = document.getElementById('salary-rows');
    if (!rows) return;
    rows.innerHTML = SALARY_DATA.map((d, i) => `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;align-items:center;padding:10px 4px;border-radius:8px;background:${i % 2 === 0 ? 'var(--surface2)' : 'transparent'}">
        <span style="font-size:13px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:8px">
          <i data-lucide="${d.icon}" style="width:14px;height:14px;color:var(--orange)"></i> ${d.sector}
        </span>
        <span style="font-size:13px;color:var(--muted);font-weight:500">${d.junior}</span>
        <span style="font-size:13px;color:var(--blue);font-weight:600">${d.confirme}</span>
        <span style="font-size:13px;color:var(--orange);font-weight:700">${d.senior}</span>
      </div>`).join('');
    document.getElementById('salary-modal')?.classList.add('open');
    showBackdrop();
    forceIcons();
  }

  function closeSalaryModal() {
    document.getElementById('salary-modal')?.classList.remove('open');
    hideBackdrop();
  }

  async function handleForgotPassword() {
    const email = document.getElementById('forgot-email')?.value?.trim();
    const errEl = document.getElementById('forgot-error');
    if (!email || !email.includes('@')) {
      if (errEl) { errEl.textContent = 'Email invalide.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (errEl) errEl.classList.add('hidden');

    try {
      await fetch(API + '/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (_) { }
    _setForgotStep(1);
  }

  async function handleResetPassword() {
    const pwd = document.getElementById('forgot-new-pwd')?.value;
    const confirm = document.getElementById('forgot-confirm-pwd')?.value;
    if (!pwd || pwd !== confirm) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || '';
    try {
      await fetch(API + '/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pwd }),
      });
    } catch (_) { }
    closeForgotModal();
    openLoginModal();
  }

  function _setForgotStep(n) {
    [0, 1, 2].forEach(i => {
      const p = document.getElementById(`forgot-step-${i}`);
      const d = document.getElementById(`fdot-${i}`);
      if (p) p.classList.toggle('active', i === n);
      if (d) {
        d.classList.toggle('active', i === n);
        d.classList.toggle('done', i < n);
      }
    });
  }

  // Auto-refresh on boot
  (async function autoRefreshToken() {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(API + '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const t = data.accessToken || data.token;
        if (t) localStorage.setItem('apex_token', t);
      }
    } catch (_) { }
  })();

  // ─────────────────────────────────────────────
  //  SEARCH & SUGGEST
  // ─────────────────────────────────────────────
  const SUGGEST_TERMS = [
    'Développeur web', 'Développeur full stack', 'Développeur React',
    'Développeur .NET', 'Développeur Python', 'Data Scientist',
    'Data Analyst', 'Data Engineer', 'Machine Learning Engineer',
    'DevOps', 'SysAdmin', 'Architecte cloud', 'Ingénieur cybersécurité',
    'Chef de projet IT', 'Chef de projet MOA', 'Scrum Master', 'Product Owner',
    'Infirmier', 'Aide-soignant', 'Médecin généraliste', 'Pharmacien',
    'Kinésithérapeute', 'Psychologue', 'Orthophoniste',
    'Comptable', 'Expert-comptable', 'Contrôleur de gestion', 'DAF',
    'Commercial', 'Commercial terrain', 'Business Developer', 'Account Manager',
    'Responsable marketing', 'Community Manager', 'Traffic Manager', 'SEO',
    'Juriste', 'Avocat', 'Paralégiste', 'Compliance Officer',
    'Recruteur', 'Responsable RH', 'Gestionnaire paie',
    'Logisticien', 'Gestionnaire de stocks', 'Chauffeur SPL',
    'Conducteur de travaux', 'Chef de chantier', 'Plombier', 'Électricien',
    'Cuisinier', 'Chef de cuisine', 'Barman', 'Serveur',
    'Enseignant', 'Formateur', 'Educateur spécialisé',
  ];

  let _suggestTimeout = null;

  function onSuggest(val) {
    clearTimeout(_suggestTimeout);
    const dd = document.getElementById('suggest-dropdown');
    if (!dd) return;
    if (!val || val.length < 2) { hideSuggest(); return; }

    _suggestTimeout = setTimeout(() => {
      const lv = val.toLowerCase();
      const matches = SUGGEST_TERMS
        .filter(t => t.toLowerCase().includes(lv))
        .slice(0, 8);

      if (!matches.length) { hideSuggest(); return; }

      dd.innerHTML = '';
      matches.forEach(term => {
        const div = document.createElement('div');
        div.className = 'suggest-item';
        div.setAttribute('role', 'option');
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'search');
        icon.style.cssText = 'width:14px;height:14px;flex-shrink:0;color:var(--muted)'
        const txt = document.createElement('span');
        txt.textContent = term;
        div.appendChild(icon);
        div.appendChild(txt);
        if (window.lucide) lucide.createIcons({ nodes: [div] });
        div.addEventListener('mousedown', e => {
          e.preventDefault();
          triggerSearch(term);
        });
        dd.appendChild(div);
      });
      dd.classList.add('visible');
    }, 120);
  }

  function hideSuggest() {
    const dd = document.getElementById('suggest-dropdown');
    if (dd) dd.classList.remove('visible');
  }

  function syncKw(val) {
    const kw = document.getElementById('kw-input');
    if (kw && kw.value !== val) kw.value = val;
  }

  function syncNavKw(val) {
    const nav = document.getElementById('nav-kw');
    if (nav && nav.value !== val) nav.value = val;
  }

  function syncNavCity(val) {
    // no separate nav city field but keep in sync if added
  }

  function triggerSearch(kw) {
    const kwEl = document.getElementById('kw-input');
    if (kwEl) kwEl.value = kw;
    syncNavKw(kw);
    hideSuggest();
    performSearch();
  }

  function triggerSearchCity(city) {
    const locEl = document.getElementById('sq-city') || document.getElementById('loc-input');
    if (locEl) locEl.value = city;
    performSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setFilter(btn, val) {
    _activeFilter = val;
    _currentPage = 1;
    _allJobs = [];
    const grid = document.getElementById('jobs-grid');
    if (grid) grid.innerHTML = '';
    document.querySelectorAll('.filter-pill[id^="pill-"]').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderPage();
  }

  async function performSearch() {
    const kwEl = document.getElementById('input-keywords-inline')
      || document.getElementById('sq-job')
      || document.getElementById('kw-input')
      || document.getElementById('input-keywords');
    const locEl = document.getElementById('input-city')
      || document.getElementById('sq-city')
      || document.getElementById('loc-input');
    const kw = (kwEl?.value || '').trim();
    const loc = (locEl?.value || '').trim();

    // Switch to results view
    document.getElementById('initial-state')?.classList.add('hidden');
    document.getElementById('search-results')?.classList.remove('hidden');
    document.getElementById('empty-state')?.classList.add('hidden');

    const titleEl = document.getElementById('results-title');
    const subtitleEl = document.getElementById('results-subtitle');
    if (titleEl) titleEl.textContent = kw ? `Offres pour « ${kw} »` : 'Toutes les offres';
    if (subtitleEl) subtitleEl.textContent = 'Recherche en cours…';

    showSkeletons();

    try {
      const params = new URLSearchParams();
      if (kw) params.set('keyword', kw);
      if (loc) params.set('location', loc);
      if (typeof _activeFilter !== 'undefined' && _activeFilter) params.set('contract', _activeFilter);

      const res = await apiFetch(`/api/jobs/search?${params}`);
      const data = await res.json().catch(() => []);

      const raw = Array.isArray(data) ? data : (data.resultats || data.results || data.items || data.offres || []);
      _allJobs = raw.map(j => ({
        ...j,
        intitule: decodeUtf8Safe(j.intitule || j.title || ''),
        description: decodeUtf8Safe(j.description || j.desc || ''),
        entreprise: { ...(j.entreprise || {}), nom: decodeUtf8Safe(j.entreprise?.nom || j.company || '') },
        salaire: { ...(j.salaire || {}), libelle: decodeUtf8Safe(j.salaire?.libelle || j.salary || '') },
        lieuTravail: { ...(j.lieuTravail || {}), libelle: decodeUtf8Safe(j.lieuTravail?.libelle || j.location || '') },
      }));
      _currentPage = 1;

      if (subtitleEl) {
        subtitleEl.textContent = `${_allJobs.length.toLocaleString('fr-FR')} offre${_allJobs.length !== 1 ? 's' : ''} trouvée${_allJobs.length !== 1 ? 's' : ''}`;
      }

      const sector = typeof detectSector === 'function' ? detectSector(kw) : null;
      if (sector && typeof fetchFormations === 'function') fetchFormations(sector);

      renderPage(true);
    } catch (err) {
      console.error('[APEX] performSearch error:', err);
      const grid = document.getElementById('jobs-grid');
      if (grid) grid.innerHTML = '';
      document.getElementById('empty-state')?.classList.remove('hidden');
    }

    scrollToResults();
  }

  function showSkeletons() {
    const grid = document.getElementById('jobs-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const card = document.createElement('div');
      card.className = 'sk-card';
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = `
        <div class="flex gap-3 items-start">
          <div class="sk" style="width:2.75rem;height:2.75rem;border-radius:.875rem;flex-shrink:0"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="sk" style="height:1rem;width:70%"></div>
            <div class="sk" style="height:.75rem;width:45%"></div>
          </div>
        </div>
        <div class="sk" style="height:.75rem;width:100%"></div>
        <div class="sk" style="height:.75rem;width:80%"></div>
        <div class="flex gap-2 mt-1">
          <div class="sk" style="height:1.5rem;width:4rem;border-radius:9999px"></div>
          <div class="sk" style="height:1.5rem;width:4rem;border-radius:9999px"></div>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  let _observer = null;

  function renderPage(reset = false) {
    if (reset) {
      _currentPage = 1;
      const grid = document.getElementById('jobs-grid');
      if (grid) grid.innerHTML = '';
      if (_observer) _observer.disconnect();
    }

    let jobs = _allJobs;
    if (_activeFilter) {
      jobs = jobs.filter(j => {
        const ct = (j.typeContrat || j.contractType || '').toUpperCase();
        return ct.includes(_activeFilter.toUpperCase());
      });
    }

    const total = jobs.length;
    const start = (_currentPage - 1) * PAGE_SIZE;
    const slice = jobs.slice(start, start + PAGE_SIZE);

    const grid = document.getElementById('jobs-grid');
    const emptyEl = document.getElementById('empty-state');

    if (!total) {
      if (grid) grid.innerHTML = '';
      emptyEl?.classList.remove('hidden');
    } else {
      emptyEl?.classList.add('hidden');
      _appendResults(slice);

      if (start + PAGE_SIZE < total) {
        _setupInfiniteScroll();
      }
    }
  }

  function _appendResults(jobs) {
    const grid = document.getElementById('jobs-grid');
    if (!grid) return;

    jobs.forEach((job, idx) => {
      const globalIdx = (_currentPage - 1) * PAGE_SIZE + idx;
      const card = _buildJobCard(job, globalIdx);
      grid.appendChild(card);
    });

    forceLucide();
    updateCompanyStrip(_allJobs.slice(0, 50));
  }

  function _setupInfiniteScroll() {
    const grid = document.getElementById('jobs-grid');
    if (!grid || !grid.lastElementChild) return;

    if (_observer) _observer.disconnect();

    _observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        _observer.disconnect();
        _currentPage++;
        renderPage(false);
      }
    }, { threshold: 0.1 });

    _observer.observe(grid.lastElementChild);
  }

  function gotoPage(p) {
    _currentPage = p;
    renderPage(true);
    scrollToResults();
  }

  // ─────────────────────────────────────────────
  //  RENDER RESULTS
  // ─────────────────────────────────────────────


  function _buildJobCard(job, idx) {
    const title = job.intitule || job.title || 'Offre sans titre';
    const company = job.entreprise?.nom || job.company || '';
    const city = job.lieuTravail?.libelle || job.location || '';
    const salary = job.salaire?.libelle || job.salary || '';
    const contract = job.typeContratLibelle || job.contractType || '';
    const desc = cleanDesc(job.description || job.desc || '');
    const source = job.source || (job.id?.startsWith('ft_') ? 'FT' : 'EU');
    const score = job.matchScore || job.match_score || null;

    const card = document.createElement('article');
    card.className = 'job-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', title);
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openJob(idx));

    // Header: logo + title
    const header = document.createElement('div');
    header.className = 'flex items-start gap-3';

    const logoWrap = document.createElement('div');
    logoWrap.className = 'job-logo-wrap'; // Uses style.css class

    const domain = (company || '').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    const logoImg = document.createElement('img');
    if (job.companyLogoUrl) {
      logoImg.src = job.companyLogoUrl;
      logoImg.alt = company;
      logoImg.onerror = () => {
        logoImg.style.display = 'none';
        const initials = document.createElement('div');
        initials.className = 'initials';
        initials.style.background = initialsColor(company || title);
        initials.textContent = _makeInitials(company || title);
        logoWrap.appendChild(initials);
      };
      logoWrap.appendChild(logoImg);
    } else {
      const initials = document.createElement('div');
      initials.className = 'initials';
      initials.style.background = initialsColor(company || title);
      initials.textContent = _makeInitials(company || title);
      logoWrap.appendChild(initials);
    }

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex-1 min-w-0';
    const titleH = document.createElement('h3');
    titleH.className = 'job-title'; // Uses style.css class
    titleH.textContent = title;
    const companyP = document.createElement('p');
    companyP.className = 'job-company'; // Uses style.css class
    companyP.textContent = [company, city].filter(Boolean).join(' · ');
    titleWrap.append(titleH, companyP);
    header.append(logoWrap, titleWrap);

    // Score ring (if available)
    if (score !== null && isLoggedIn()) {
      const scoreBadge = _buildScoreRingDOM(score);
      header.appendChild(scoreBadge);
    } else if (!isLoggedIn()) {
      const lockEl = document.createElement('div');
      lockEl.className = 'flex-shrink-0 text-center';
      lockEl.innerHTML = `
        <i data-lucide="lock" style="width:1.2rem;height:1.2rem;color:var(--muted);display:inline-flex"></i>
        <p class="text-[.6rem] text-[var(--muted)] leading-tight mt-0.5">Profil<br>requis</p>`;
      header.appendChild(lockEl);
    }

    card.appendChild(header);

    // Description
    if (desc) {
      const descEl = document.createElement('p');
      descEl.className = 'text-sm text-[var(--text-2)] truncate-2';
      descEl.textContent = desc;
      card.appendChild(descEl);
    }

    // Badges
    const badges = document.createElement('div');
    badges.className = 'flex flex-wrap gap-1.5 items-center';

    if (contract) {
      const b = _badge(contract, 'var(--elevated-2)', 'var(--text-2)');
      badges.appendChild(b);
    }
    if (salary) {
      const b = _badge(formatSalary(salary), 'rgba(34,197,94,.08)', 'var(--success)');
      badges.appendChild(b);
    }
    // Source flag
    const srcBadge = document.createElement('span');
    srcBadge.className = 'chip ml-auto';
    const srcIcon = document.createElement('i');
    srcIcon.setAttribute('data-lucide', source === 'FT' ? 'flag' : 'globe');
    srcIcon.style.cssText = 'width:13px;height:13px;flex-shrink:0';
    const srcTxt = document.createTextNode(source === 'FT' ? 'France Travail' : 'EU');
    srcBadge.append(srcIcon, srcTxt);
    badges.appendChild(srcBadge);

    card.appendChild(badges);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'flex gap-2 mt-auto';

    const btnAnalyze = document.createElement('button');
    btnAnalyze.className = 'btn btn-secondary btn-sm flex-1';
    const aiIconEl = document.createElement('i');
    aiIconEl.setAttribute('data-lucide', 'brain');
    aiIconEl.style.cssText = 'width:1rem;height:1rem;flex-shrink:0';
    btnAnalyze.append(aiIconEl, document.createTextNode(' Analyser IA'));
    btnAnalyze.addEventListener('click', e => { e.stopPropagation(); _analyzeFromCard(idx); });

    const btnView = document.createElement('button');
    btnView.className = 'btn btn-ghost btn-sm';
    const viewTxt = document.createTextNode('Voir →');
    btnView.appendChild(viewTxt);
    btnView.addEventListener('click', e => { e.stopPropagation(); openJob(idx); });

    actions.append(btnAnalyze, btnView);
    card.appendChild(actions);

    if (window.lucide) lucide.createIcons({ nodes: [card] });
    return card;
  }

  function _badge(text, bg, color) {
    const span = document.createElement('span');
    span.style.cssText = `display:inline-flex;align-items:center;padding:.25rem .6rem;border-radius:9999px;font-size:.75rem;background:${bg};color:${color};font-weight:500;white-space:nowrap`;
    span.textContent = text;
    return span;
  }

  function renderScoreBadge(scoreData) {
    const score = parseInt(scoreData?.match_score ?? scoreData ?? 0, 10);
    let cfg;
    if (score >= 85) cfg = { icon: 'mouse-pointer-click', label: 'PERFECT FIT', cls: 'score-perfect', verdict: 'GO' };
    else if (score >= 65) cfg = { icon: 'check-circle-2', label: 'STRONG MATCH', cls: 'score-strong', verdict: 'GO' };
    else if (score >= 45) cfg = { icon: 'zap', label: 'PARTIAL MATCH', cls: 'score-partial', verdict: 'NO-GO' };
    else cfg = { icon: 'x-circle', label: 'NO-GO', cls: 'score-nogo', verdict: 'NO-GO' };

    const offset = 100 - score;

    const wrap = document.createElement('div');
    wrap.className = 'glass-card p-4 mb-5';

    wrap.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="relative flex-shrink-0" style="width:3.5rem;height:3.5rem">
          <svg viewBox="0 0 36 36" class="score-ring w-full h-full">
            <circle cx="18" cy="18" r="15.9155" class="score-ring-track"/>
            <circle cx="18" cy="18" r="15.9155" class="${cfg.cls} score-ring-fill" data-offset="${offset}" style="stroke-dashoffset:100"/>
          </svg>
          <span class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-sm ${cfg.cls}">${score}</span>
        </div>
        <div>
          <div class="flex items-center gap-1.5 font-bold text-sm ${cfg.cls}">
            <i data-lucide="${cfg.icon}" style="width:1rem;height:1rem;display:inline-flex;flex-shrink:0"></i>
            ${cfg.label}
          </div>
          <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.verdict === 'GO' ? 'verdict-go' : 'verdict-nogo'}">${cfg.verdict}</span>
        </div>
      </div>`;

    if (scoreData?.analytical_justification) {
      const just = document.createElement('p');
      just.className = 'text-sm text-[var(--text-2)] mt-3 leading-relaxed';
      just.textContent = scoreData.analytical_justification;
      wrap.appendChild(just);
    }

    if (scoreData?.validated_skills?.length) {
      const section = document.createElement('div');
      section.className = 'mt-3';
      const lbl = document.createElement('p');
      lbl.className = 'text-[.7rem] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5';
      lbl.textContent = 'Compétences validées';
      section.appendChild(lbl);
      const chips = document.createElement('div');
      chips.className = 'flex flex-wrap gap-1.5';
      scoreData.validated_skills.forEach(s => {
        const c = document.createElement('span');
        c.className = 'chip';
        c.style.color = 'var(--success)';
        c.style.borderColor = 'rgba(34,197,94,.2)';
        c.style.background = 'rgba(34,197,94,.06)';
        c.textContent = s;
        chips.appendChild(c);
      });
      section.appendChild(chips);
      wrap.appendChild(section);
    }

    if (scoreData?.missing_skills?.length) {
      const section = document.createElement('div');
      section.className = 'mt-3';
      const lbl = document.createElement('p');
      lbl.className = 'text-[.7rem] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5';
      lbl.textContent = 'Compétences manquantes';
      section.appendChild(lbl);
      const chips = document.createElement('div');
      chips.className = 'flex flex-wrap gap-1.5';
      scoreData.missing_skills.forEach(s => {
        const c = document.createElement('span');
        c.className = 'chip';
        c.style.color = 'var(--error)';
        c.style.borderColor = 'rgba(239,68,68,.2)';
        c.style.background = 'rgba(239,68,68,.06)';
        c.textContent = s;
        chips.appendChild(c);
      });
      section.appendChild(chips);
      wrap.appendChild(section);
    }

    // Animate ring
    requestAnimationFrame(() => {
      setTimeout(() => {
        wrap.querySelectorAll('.score-ring-fill[data-offset]').forEach(path => {
          path.style.strokeDashoffset = path.getAttribute('data-offset');
        });
      }, 50);
    });

    if (window.lucide) lucide.createIcons({ nodes: [wrap] });
    return wrap;
  }

  function _buildScoreRingDOM(score) {
    score = parseInt(score, 10);
    let cls = 'score-nogo';
    if (score >= 85) cls = 'score-perfect';
    else if (score >= 65) cls = 'score-strong';
    else if (score >= 45) cls = 'score-partial';

    const wrap = document.createElement('div');
    wrap.className = 'relative flex-shrink-0';
    wrap.style.cssText = 'width:2.5rem;height:2.5rem';
    wrap.innerHTML = `
      <svg viewBox="0 0 36 36" class="score-ring w-full h-full">
        <circle cx="18" cy="18" r="15.9155" class="score-ring-track"/>
        <circle cx="18" cy="18" r="15.9155" class="${cls} score-ring-fill" data-offset="${100 - score}" style="stroke-dashoffset:100"/>
      </svg>
      <span class="absolute inset-0 flex items-center justify-center font-display font-bold text-[.6rem] ${cls}">${score}</span>`;
    return wrap;
  }

  // Infinite scroll handles pagination now
  function renderPagination(total) {
    // Infinite scroll handles pagination now
    return;
  }

  // ─────────────────────────────────────────────
  //  JOB PANEL
  // ─────────────────────────────────────────────
  function openJob(idx) {
    const job = _allJobs[idx];
    if (!job) return;
    _currentJob = job;
    _currentJobIdx = idx;

    const content = document.getElementById('job-panel-content');
    const aiResult = document.getElementById('panel-ai-result');
    if (!content) return;

    if (aiResult) aiResult.innerHTML = '';

    const title = job.intitule || job.title || '';
    const company = job.entreprise?.nom || job.company || '';
    const city = job.lieuTravail?.libelle || job.location || '';
    const salary = job.salaire?.libelle || job.salary || '';
    const contract = job.typeContratLibelle || job.contractType || '';
    const desc = job.description || job.desc || '';

    content.innerHTML = '';

    // Title block
    const hdr = document.createElement('div');
    hdr.className = 'mb-5';
    const h2 = document.createElement('h2');
    h2.className = 'font-display font-extrabold text-xl leading-tight mb-1';
    h2.textContent = title;
    const sub = document.createElement('p');
    sub.className = 'text-sm text-[var(--text-2)]';
    sub.textContent = [company, city].filter(Boolean).join(' · ');
    hdr.append(h2, sub);
    content.appendChild(hdr);

    // Meta badges
    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap gap-2 mb-5';
    if (contract) meta.appendChild(_badge(contract, 'var(--elevated-2)', 'var(--text-2)'));
    if (salary) meta.appendChild(_badge(formatSalary(salary), 'rgba(34,197,94,.08)', 'var(--success)'));
    content.appendChild(meta);

    // Description
    if (desc) {
      const descEl = document.createElement('div');
      descEl.className = 'text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-wrap';
      descEl.textContent = desc.replace(/<[^>]+>/g, ' ').trim();
      content.appendChild(descEl);
    }

    openPanel('job-panel');
  }

  function closePanel(id) {
    const p = document.getElementById(id);
    if (p) p.classList.remove('open');
    _checkBackdrop();
  }

  function applyJob() {
    if (!_currentJob) return;
    const url = _currentJob.origineOffre?.urlOrigine || _currentJob.applyUrl || _currentJob.url || '';
    if (url) safeOpenUrl(url);
  }

  async function analyzeJob(btn) {
    // Si appelé depuis une carte (btn = élément HTML), ouvre le drawer bot
    if (btn instanceof Element) {
      const card = btn.closest('[data-job-title]') || btn.closest('.job-card');
      const title = card ? (card.dataset.jobTitle || card.querySelector('.job-title')?.textContent || 'cette offre') : 'cette offre';
      openChat();
      appendUser(`Analyse de l'offre : ${title}. Donne un verdict GO/NO-GO avec justification.`);
      appendTyping();
      try {
        const res = await apiFetch('/api/jobs/chat', {
          method: 'POST',
          body: JSON.stringify({ message: `Analyse détaillée de l'offre : ${title}. Répond en JSON : match_score (0-100), verdict (GO/NO-GO), analytical_justification, validated_skills[], missing_skills[].` }),
        });
        const data = await res.json().catch(() => ({}));
        const reply = data.message || data.reply || data.response || 'Analyse terminée.';
        appendAgent(reply);
      } catch (_) {
        appendAgent('Impossible de contacter le serveur. Vérifiez votre connexion.');
      }
      return;
    }

    if (!_currentJob) return;
    const aiResult = document.getElementById('panel-ai-result');
    if (!aiResult) return;

    aiResult.innerHTML = '';

    // Typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-dots my-4';
    typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    aiResult.appendChild(typingDiv);

    try {
      let res;
      if (isLoggedIn()) {
        res = await apiFetch('/api/jobs/analyze', {
          method: 'POST',
          body: JSON.stringify({
            jobId: _currentJob.id,
            jobTitle: _currentJob.intitule || _currentJob.title || '',
            jobDescription: _currentJob.description || '',
          }),
        });
      } else {
        res = await apiFetch('/api/jobs/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: `Analyse rapide de cette offre : ${_currentJob.intitule || ''}. Donne un verdict GO/NO-GO en JSON avec match_score (0-100), verdict, analytical_justification, validated_skills, missing_skills.`,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));
      typingDiv.remove();

      const scoreData = data.analysis || data.result || data;
      aiResult.appendChild(renderScoreBadge(scoreData));
    } catch (err) {
      typingDiv.remove();
      const errEl = document.createElement('p');
      errEl.className = 'text-sm text-[var(--error)]';
      errEl.textContent = 'Erreur lors de l\'analyse. Réessayez.';
      aiResult.appendChild(errEl);
    }
  }

  async function _analyzeFromCard(idx) {
    // Open panel then analyze
    openJob(idx);
    await new Promise(r => setTimeout(r, 200));
    analyzeJob();
  }

  // ─────────────────────────────────────────────
  //  CHAT
  // ─────────────────────────────────────────────
  function openChat() {
    openPanel('chat-overlay');
  }

  function closeChat() {
    closePanel('chat-overlay');
  }

  function appendUser(text) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'chat-msg-user';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function appendAgent(text) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'chat-msg-agent';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function appendTyping() {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return null;
    const el = document.createElement('div');
    el.className = 'typing-dots';
    el.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function handleChat() {
    const inputEl = document.getElementById('chat-inp') || document.getElementById('chat-input');
    if (!inputEl) return;
    const msg = inputEl.value.trim();
    if (!msg) return;
    inputEl.value = '';

    appendUser(msg);
    const typingEl = appendTyping();

    try {
      const res = await apiFetch('/api/jobs/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json().catch(() => ({}));
      typingEl?.remove();
      appendAgent(data.reply || data.message || data.content || 'Je n\'ai pas compris votre demande.');
    } catch (_) {
      typingEl?.remove();
      appendAgent('Erreur de connexion. Vérifiez que l\'API est démarrée sur le port 5191.');
    }
  }

  function sendQuick(text) {
    const inputEl = document.getElementById('chat-inp') || document.getElementById('chat-input');
    if (inputEl) inputEl.value = text;
    handleChat();
  }

  function chatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }
  }

  function handleChatSend() { handleChat(); }

  function onChatFileAttached(file) {
    if (!file) return;
    appendUser(`[Fichier joint : ${file.name}]`);
    const typingEl = appendTyping();
    setTimeout(() => {
      typingEl?.remove();
      appendAgent(`J'ai bien reçu votre fichier "${file.name}". Analyse en cours — mais l'upload de fichiers via le chat est disponible uniquement avec un compte connecté et le CV uploadé dans votre profil.`);
    }, 1200);
  }

  // ─────────────────────────────────────────────
  //  PROFILE
  // ─────────────────────────────────────────────
  let _techSkills = [];
  let _softSkills = [];

  function openProfilePanel() {
    if (!isLoggedIn()) { openLoginModal(); return; }
    openPanel('profile-panel');
    loadProfilePanel();
  }

  function closeProfilePanel() {
    closePanel('profile-panel');
  }

  async function loadProfilePanel() {
    try {
      const res = await apiFetch('/api/profile');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));

      const nameEl = document.getElementById('profile-name-display');
      const emailEl = document.getElementById('profile-email-display');
      const bioEl = document.getElementById('profile-bio');
      const avatarEl = document.getElementById('profile-avatar-lg');
      const initBig = _makeInitials(data.name || data.email || 'U');

      if (nameEl) nameEl.querySelector('p')?.textContent && (nameEl.querySelector('p').textContent = data.name || 'Mon profil');
      if (emailEl) emailEl.textContent = data.email || '';
      if (bioEl) bioEl.value = data.bio || '';
      if (avatarEl) avatarEl.textContent = initBig;

      _techSkills = data.techSkills || [];
      _softSkills = data.softSkills || [];
      renderChips('tech-chips', _techSkills, 'tech');
      renderChips('soft-chips', _softSkills, 'soft');
    } catch (_) { }
  }

  function renderChips(containerId, skills, type) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';
    skills.forEach((s, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const txt = document.createTextNode(s);
      const rm = document.createElement('span');
      rm.className = 'chip-remove';
      rm.setAttribute('aria-label', `Supprimer ${s}`);
      rm.textContent = '×';
      rm.addEventListener('click', () => removeChip(type, i));
      chip.append(txt, rm);
      cont.appendChild(chip);
    });
  }

  function removeChip(type, idx) {
    if (type === 'tech') { _techSkills.splice(idx, 1); renderChips('tech-chips', _techSkills, 'tech'); }
    else { _softSkills.splice(idx, 1); renderChips('soft-chips', _softSkills, 'soft'); }
  }

  function addTech() {
    const el = document.getElementById('tech-input');
    const val = el?.value?.trim();
    if (val && !_techSkills.includes(val)) {
      _techSkills.push(val);
      renderChips('tech-chips', _techSkills, 'tech');
    }
    if (el) el.value = '';
  }

  function addSoft() {
    const el = document.getElementById('soft-input');
    const val = el?.value?.trim();
    if (val && !_softSkills.includes(val)) {
      _softSkills.push(val);
      renderChips('soft-chips', _softSkills, 'soft');
    }
    if (el) el.value = '';
  }

  async function saveBio() {
    const bio = document.getElementById('profile-bio')?.value?.trim() || '';
    try {
      await apiFetch('/api/profile/bio', {
        method: 'PATCH',
        body: JSON.stringify({ bio }),
      });
    } catch (_) { }
  }

  async function saveTechs() {
    try {
      await apiFetch('/api/profile/skills', {
        method: 'PATCH',
        body: JSON.stringify({ techSkills: _techSkills }),
      });
    } catch (_) { }
  }

  async function saveSofts() {
    try {
      await apiFetch('/api/profile/skills', {
        method: 'PATCH',
        body: JSON.stringify({ softSkills: _softSkills }),
      });
    } catch (_) { }
  }

  function onCvDropped(e) {
    e.preventDefault();
    document.getElementById('cv-drop-zone')?.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) profUploadCv(file);
  }

  async function profUploadCv(file) {
    if (!file) return;
    const statusEl = document.getElementById('cv-status');
    if (statusEl) statusEl.textContent = 'Upload en cours…';

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch('/api/profile/upload-cv', {
        method: 'POST',
        body: fd,
        // Don't set Content-Type — FormData sets it automatically
        headers: (() => {
          const token = localStorage.getItem('apex_token');
          return token ? { 'Authorization': `Bearer ${token}` } : {};
        })(),
      });
      if (res.ok) {
        if (statusEl) statusEl.textContent = `CV "${file.name}" importé avec succès.`;
      } else {
        if (statusEl) statusEl.textContent = 'Erreur lors de l\'upload.';
      }
    } catch (_) {
      if (statusEl) statusEl.textContent = 'Erreur réseau.';
    }
  }

  // ─────────────────────────────────────────────
  //  SUIVI (Kanban → "Suivi des candidatures")
  // ─────────────────────────────────────────────
  const SUIVI_COLS = [
    { id: 'todo', label: 'À postuler', color: 'var(--muted)' },
    { id: 'applied', label: 'Postulé', color: 'var(--accent)' },
    { id: 'interview', label: 'Entretien', color: '#a855f7' },
    { id: 'offer', label: 'Offre reçue', color: 'var(--success)' },
    { id: 'rejected', label: 'Refusé', color: 'var(--error)' },
  ];

  let _suivi = {};

  function openSuiviPanel() {
    if (!isLoggedIn()) { openLoginModal(); return; }
    openPanel('suivi-panel');
    loadSuivi();
  }

  function closeSuiviPanel() {
    closePanel('suivi-panel');
  }

  async function loadSuivi() {
    try {
      const res = await apiFetch('/api/applications');
      if (!res.ok) { _renderEmptySuivi(); return; }
      const data = await res.json().catch(() => []);
      // Group by status
      _suivi = {};
      SUIVI_COLS.forEach(c => { _suivi[c.id] = []; });
      (Array.isArray(data) ? data : []).forEach(app => {
        const col = app.status || 'todo';
        if (!_suivi[col]) _suivi[col] = [];
        _suivi[col].push(app);
      });
      renderSuiviBoard();
    } catch (_) {
      _renderEmptySuivi();
    }
  }

  function _renderEmptySuivi() {
    SUIVI_COLS.forEach(c => { _suivi[c.id] = []; });
    renderSuiviBoard();
  }

  function renderSuiviBoard() {
    const board = document.getElementById('suivi-board');
    if (!board) return;
    board.innerHTML = '';

    SUIVI_COLS.forEach(col => {
      const cards = _suivi[col.id] || [];
      const colEl = document.createElement('div');
      colEl.className = 'suivi-col';

      const header = document.createElement('div');
      header.className = 'suivi-col-header';
      header.style.color = col.color;
      header.innerHTML = `<span>${col.label}</span><span class="text-[var(--muted)] text-xs">${cards.length}</span>`;

      const body = document.createElement('div');
      body.className = 'suivi-col-body';
      body.setAttribute('data-col', col.id);
      body.addEventListener('dragover', e => {
        e.preventDefault();
        body.classList.add('drag-over');
      });
      body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
      body.addEventListener('drop', e => _onSuiviDrop(e, col.id, body));

      cards.forEach(app => {
        const card = _buildSuiviCard(app, col.id);
        body.appendChild(card);
      });

      if (!cards.length) {
        const empty = document.createElement('p');
        empty.className = 'text-[.75rem] text-[var(--muted)] text-center py-4';
        empty.textContent = 'Glissez ici';
        body.appendChild(empty);
      }

      colEl.append(header, body);
      board.appendChild(colEl);
    });
  }

  function _buildSuiviCard(app, colId) {
    const card = document.createElement('div');
    card.className = 'suivi-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', app.id || '');
    card.setAttribute('data-col', colId);

    const title = document.createElement('p');
    title.className = 'font-semibold text-sm';
    title.textContent = app.jobTitle || app.title || 'Candidature';
    const company = document.createElement('p');
    company.className = 'text-xs text-[var(--muted)] mt-0.5';
    company.textContent = app.company || '';
    card.append(title, company);

    card.addEventListener('dragstart', e => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify({ id: app.id, fromCol: colId }));
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    return card;
  }

  async function _onSuiviDrop(e, targetCol, bodyEl) {
    e.preventDefault();
    bodyEl.classList.remove('drag-over');
    try {
      const { id, fromCol } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (fromCol === targetCol) return;

      // Optimistic UI
      const app = (_suivi[fromCol] || []).find(a => a.id === id);
      if (!app) return;
      _suivi[fromCol] = _suivi[fromCol].filter(a => a.id !== id);
      app.status = targetCol;
      if (!_suivi[targetCol]) _suivi[targetCol] = [];
      _suivi[targetCol].push(app);
      renderSuiviBoard();

      // Persist
      await apiFetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetCol }),
      });
    } catch (_) { }
  }

  // ─────────────────────────────────────────────
  //  FORMATIONS
  // ─────────────────────────────────────────────
  const SECTOR_KEYWORDS = {
    numerique: ['développeur', 'dev', 'frontend', 'backend', 'fullstack', 'react', 'angular', 'vue', 'python', 'java', 'dotnet', '.net', 'javascript', 'typescript', 'cloud', 'devops', 'data', 'ia', 'ml', 'machine learning', 'cyber', 'infra', 'réseau'],
    sante: ['infirmier', 'médecin', 'aide-soignant', 'pharmacien', 'kiné', 'orthophoniste', 'paramédical', 'santé', 'hôpital', 'clinique', 'ehpad'],
    restauration: ['cuisinier', 'chef', 'serveur', 'barman', 'restauration', 'hôtellerie', 'cuisine', 'hôtel', 'pâtissier'],
    logistique: ['logistique', 'logisticien', 'chauffeur', 'livreur', 'stock', 'magasinier', 'supply chain', 'transport'],
    btp: ['btp', 'conducteur de travaux', 'chantier', 'bâtiment', 'électricien', 'plombier', 'maçon', 'charpentier', 'génie civil'],
    finance: ['comptable', 'contrôleur de gestion', 'expert-comptable', 'audit', 'banque', 'assurance', 'finance', 'daf', 'trésorier'],
    marketing: ['marketing', 'communication', 'community manager', 'seo', 'sea', 'traffic', 'brand', 'product marketing'],
    rh: ['rh', 'recruteur', 'ressources humaines', 'formation', 'talent', 'drh', 'gestionnaire de paie'],
    juridique: ['juriste', 'avocat', 'paralégiste', 'compliance', 'droit', 'contrats', 'contentieux'],
    commerce: ['commercial', 'vente', 'account manager', 'business developer', 'retail', 'sales', 'négociateur', 'e-commerce'],
  };

  function detectSector(kw) {
    if (!kw) return null;
    const lkw = kw.toLowerCase();
    for (const [sector, terms] of Object.entries(SECTOR_KEYWORDS)) {
      if (terms.some(t => lkw.includes(t))) return sector;
    }
    return null;
  }

  async function fetchFormations(sector) {
    try {
      const res = await apiFetch(`/api/formations?sector=${encodeURIComponent(sector)}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : (data.items || []);
      if (!list.length) return;

      document.getElementById('formations-section')?.classList.remove('hidden');
      const grid = document.getElementById('formations-grid');
      if (!grid) return;
      grid.innerHTML = '';
      list.slice(0, 4).forEach(f => {
        const card = document.createElement('div');
        card.className = 'formation-card';
        card.innerHTML = `
          <i data-lucide="graduation-cap" style="width:1.5rem;height:1.5rem;color:var(--accent)"></i>
          <h4 class="font-display font-bold text-base">${esc(f.title || f.intitule || '')}</h4>
          <p class="text-sm text-[var(--text-2)] truncate-2">${esc(cleanDesc(f.description || '', 100))}</p>`;
        grid.appendChild(card);
      });
      if (window.lucide) lucide.createIcons({ nodes: [grid] });
    } catch (_) { }
  }

  async function loadAiSuggestions() {
    if (!isLoggedIn()) { openLoginModal(); return; }
    try {
      const res = await apiFetch('/api/jobs/suggestions');
      if (!res.ok) return;
      const data = await res.json().catch(() => []);
      if (Array.isArray(data) && data.length) {
        _allJobs = data;
        _currentPage = 1;
        document.getElementById('initial-state')?.classList.add('hidden');
        document.getElementById('search-results')?.classList.remove('hidden');
        const t = document.getElementById('results-title');
        if (t) t.textContent = 'Suggestions IA pour vous';
        renderPage();
      }
    } catch (_) { }
  }

  // ─────────────────────────────────────────────
  //  PANEL / BACKDROP HELPERS
  // ─────────────────────────────────────────────
  const PANEL_IDS = ['job-panel', 'chat-overlay', 'profile-panel', 'suivi-panel', 'swipe-modal'];

  function openPanel(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isModal = el.classList.contains('modal-overlay');
    if (isModal) { el.classList.add('open'); }
    else { el.classList.add('open'); }
    showBackdrop();
  }

  function showBackdrop() {
    document.getElementById('backdrop')?.classList.add('visible');
  }

  function hideBackdrop() {
    // Only hide if no panel/modal is open
    const anyOpen = PANEL_IDS.some(id => {
      const el = document.getElementById(id);
      return el && el.classList.contains('open');
    });
    const modalOpen = ['login-modal', 'forgot-modal'].some(id => {
      const el = document.getElementById(id);
      return el && el.classList.contains('open');
    });
    if (!anyOpen && !modalOpen) {
      document.getElementById('backdrop')?.classList.remove('visible');
    }
  }

  function _checkBackdrop() {
    hideBackdrop();
  }

  function closeAll() {
    PANEL_IDS.forEach(id => {
      document.getElementById(id)?.classList.remove('open');
    });
    ['login-modal', 'forgot-modal'].forEach(id => {
      document.getElementById(id)?.classList.remove('open');
    });
    document.getElementById('backdrop')?.classList.remove('visible');
  }

  // ─────────────────────────────────────────────
  //  TABS
  // ─────────────────────────────────────────────
  function switchTab(group, panelId) {
    // Find parent panel and switch tabs
    const panel = document.getElementById(panelId)?.closest('.panel');
    const panels = (panel || document).querySelectorAll('.tab-panel');
    const btns = (panel || document).querySelectorAll('.tab-btn');
    panels.forEach(p => p.classList.remove('active'));
    btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    const target = document.getElementById(panelId);
    if (target) target.classList.add('active');
    // find corresponding button
    const btnIdx = Array.from(panels).indexOf(target);
    if (btns[btnIdx]) { btns[btnIdx].classList.add('active'); btns[btnIdx].setAttribute('aria-selected', 'true'); }
  }

  // ─────────────────────────────────────────────
  //  MOBILE
  // ─────────────────────────────────────────────
  function showMobileHome() {
    document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('mnav-home')?.classList.add('active');
    scrollToTop();
  }

  function openMobileSearch() {
    document.getElementById('mobile-search')?.classList.remove('hidden');
    document.getElementById('mobile-kw')?.focus();
    document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('mnav-search')?.classList.add('active');
  }

  function closeMobileSearch() {
    document.getElementById('mobile-search')?.classList.add('hidden');
  }

  function openMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'true');
    if (window.lucide) lucide.createIcons({ nodes: [menu] });
  }
  function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'false');
  }
  function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
  }

  function syncCityVal() {
    const loc = document.getElementById('loc-input');
    const navCity = document.getElementById('nav-city');
    if (navCity && loc) navCity.value = loc.value;
  }

  function showJobs() {
    scrollToResults();
  }

  // ─────────────────────────────────────────────
  //  INIT
  // ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateAuthUI();

    // Scroll-morphing: reveal nav search bar when hero search scrolls out of view
    const _heroSearch = document.getElementById('hero-search');
    const _navWrap = document.getElementById('nav-search-wrap');
    if (_heroSearch && _navWrap) {
      new IntersectionObserver(([entry]) => {
        _navWrap.classList.toggle('visible', !entry.isIntersecting);
      }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' }).observe(_heroSearch);
    }

    // Escape closes everything
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeAll();
        hideSuggest();
      }
    });

    // Close suggest on outside click
    document.addEventListener('click', e => {
      const heroSearch = document.getElementById('hero-search');
      if (heroSearch && !heroSearch.contains(e.target)) hideSuggest();
    });

    // Bento cards keyboard nav
    document.querySelectorAll('.bento-card[tabindex]').forEach(card => {
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    // If URL has ?reset_token, open forgot step 2
    if (new URLSearchParams(location.search).has('reset_token')) {
      openForgotModal();
      _setForgotStep(2);
    }
  });

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────
  const publicApi = {
    // Thème
    toggleTheme,
    // Auth
    openLoginModal, closeLoginModal,
    openForgotModal, closeForgotModal,
    handleLogin, handleLogout,
    handleForgotPassword, handleResetPassword,
    // Recherche
    syncKw, syncNavKw, syncNavCity,
    onSuggest, hideSuggest,
    triggerSearch, triggerSearchCity, performSearch,
    setFilter, gotoPage,
    showJobs,
    loadAiSuggestions,
    decodeUtf8Safe,
    // Panneaux
    openPanel, closePanel, closeAll,
    // Offre
    openJob, applyJob, analyzeJob,
    renderScoreBadge,
    // Chat bot
    openChat, closeChat,
    handleChat, sendQuick, onChatFileAttached,
    // Profil
    openProfilePanel, closeProfilePanel,
    addTech, addSoft, removeChip,
    saveBio, saveTechs, saveSofts,
    profUploadCv, onCvDropped,
    // Suivi candidatures
    openSuiviPanel, closeSuiviPanel,
    // Formations
    fetchFormations, detectSector,
    // Mobile
    showMobileHome, openMobileSearch, closeMobileSearch, syncCityVal,
    openMobileMenu, closeMobileMenu, toggleMobileMenu,
    // Divers
    scrollToTop,
    switchTab,
    // ─── Nouvelles fonctions B2C / Landing Page ───
    openDrawer: () => openChat(),
    closeDrawer: () => closeChat(),
    openCvCanvas: () => (typeof openCvCanvas === 'function' ? openCvCanvas() : null),
    closeCvCanvas: () => (typeof closeCvCanvas === 'function' ? closeCvCanvas() : null),
    openApplyModal: (title, loc) => {
      const el = document.getElementById('modal-offer-name');
      if (el) el.textContent = `${title || ''} · ${loc || ''}`;
      openPanel('apply-modal');
    },
    closeModal: () => closePanel('apply-modal'),
    switchContractTab: (btn, id) => {
      document.querySelectorAll('.ct-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      ['stage', 'alternance', 'interim'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.style.display = (t === id) ? 'flex' : 'none';
      });
      if (window.lucide) lucide.createIcons();
    },
    toggleFontSize: () => document.body.classList.toggle('large-text'),
    imgFallback: (img, domain) => {
      img.style.display = 'none';
      const sib = img.nextElementSibling;
      if (sib && sib.classList.contains('initials')) sib.style.display = 'flex';
    },
    openSalaryCalcModal: () => {
      document.getElementById('salary-calc-modal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (window.lucide) lucide.createIcons();
    },
    closeSalaryCalcModal: () => {
      document.getElementById('salary-calc-modal')?.classList.remove('open');
      document.body.style.overflow = '';
    },
    calcSalary: () => {
      const raw = parseFloat(document.getElementById('sc-brut')?.value) || 0;
      const resEl = document.getElementById('sc-result');
      if (!raw) { resEl?.classList.remove('show'); return; }
      const period = document.getElementById('sc-period')?.value;
      const statut = document.getElementById('sc-statut')?.value;
      const brutAnnuel = period === 'monthly' ? raw * 12 : raw;
      const brutMensuel = brutAnnuel / 12;
      const rate = statut === 'cadre' ? 0.75 : 0.78;
      const fmt = v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
      const elBrutM = document.getElementById('sc-brut-m');
      const elNetM = document.getElementById('sc-net-m');
      const elBrutA = document.getElementById('sc-brut-a');
      const elNetA = document.getElementById('sc-net-a');
      const elNote = document.getElementById('sc-note');
      if (elBrutM) elBrutM.textContent = fmt(brutMensuel);
      if (elNetM) elNetM.textContent = fmt(brutMensuel * rate);
      if (elBrutA) elBrutA.textContent = fmt(brutAnnuel);
      if (elNetA) elNetA.textContent = fmt(brutAnnuel * rate);
      if (elNote) elNote.textContent = statut === 'cadre' ? 'Taux ~25% (cadre)' : 'Taux ~22% (non-cadre)';
      resEl?.classList.add('show');
    },
    showToast,
    openRegisterModal,
    closeRegisterModal,
    handleRegister,
    handleSearch,
    openExploration,
    getCityImage,
    updateCompanyStrip,
    forceLucide,
    searchChip,
    openCitiesOverlay,
    openProfileMenu,
    openSwipeJob,
    closeSwipeModal,
    swipeLeft,
    swipeRight,
    profUploadCv,
    openJobDetails,
    checkout,
    sendQuickMessage: (msg) => sendQuick(msg),
    triggerSearchCity,
    initSwipe: () => openSwipeJob(),
    checkout: (planId) => handleCheckout(planId),
    openSwipeJob,
    closeSwipeModal,
    swipeRight,
    openSalaryModal,
    openSalaryCalcModal: () => document.getElementById('salary-calc-modal')?.classList.add('open'),
    forceLucide: forceIcons,
    openCitiesOverlay: () => document.getElementById('cities-overlay')?.classList.add('open'),
    openProfileMenu: () => document.getElementById('apex-account-panel')?.classList.toggle('open'),
    openJob: (idx) => {
        _currentJob = _allJobs[idx];
        if (_currentJob) {
            const titleEl = document.getElementById('modal-title');
            const companyEl = document.getElementById('modal-offer-name');
            if (titleEl) titleEl.textContent = _currentJob.intitule || _currentJob.title;
            if (companyEl) companyEl.textContent = _currentJob.entreprise?.nom || _currentJob.company;
            document.getElementById('job-panel')?.classList.add('open');
        }
    }
  };

  // ─────────────────────────────────────────────
  //  SWIPE n' JOB (Vertical Scroll Mode)
  // ─────────────────────────────────────────────
  async function openSwipeJob() {
    const modal = document.getElementById('swipe-modal');
    const container = document.getElementById('swipe-card-container');
    const emptyEl = document.getElementById('swipe-empty');
    if (!modal || !container) return;

    if (!_allJobs.length) {
      showToast('Chargement des offres...', 'info');
      await performSearch();
    }

    if (!_allJobs.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      modal.classList.add('open');
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    container.innerHTML = '';

    _allJobs.forEach((job, idx) => {
      const card = document.createElement('div');
      card.className = 'swipe-card';
      card.style.position = 'relative';
      card.style.marginBottom = '20px';
      
      const title = job.intitule || job.title || 'Offre';
      const company = job.entreprise?.nom || job.company || 'Entreprise';
      const city = job.lieuTravail?.libelle || job.location || '';
      
      card.innerHTML = `
        <div style="font-weight:800;font-size:18px;margin-bottom:8px">${esc(title)}</div>
        <div style="color:var(--orange);font-weight:700;font-size:14px;margin-bottom:12px">${esc(company)}</div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <span class="chip-sm" style="background:var(--tag-bg);padding:4px 10px;border-radius:20px;font-size:12px">${esc(city)}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:20px">
          ${esc(cleanDesc(job.description, 200))}
        </div>
        <div style="display:flex;gap:10px;margin-top:auto">
          <button class="btn-solid-sm" onclick="APEX.openJob(${idx})">Voir plus</button>
          <button class="btn-ghost-sm" onclick="APEX.swipeRight()">Sauver</button>
        </div>
      `;
      container.appendChild(card);
    });

    modal.classList.add('open');
    forceIcons();
  }

  function closeSwipeModal() {
    document.getElementById('swipe-modal')?.classList.remove('open');
  }

  function swipeRight() {
    showToast('Offre sauvegardée !', 'success');
  }

  // ─────────────────────────────────────────────
  //  STRIPE Tunnel Payment
  // ─────────────────────────────────────────────
  async function handleCheckout(planId) {
    if (!isLoggedIn()) {
      showToast('Connectez-vous pour passer Premium.', 'warn');
      openLoginModal();
      return;
    }

    try {
      showToast('Préparation du paiement...', 'info');
      const res = await apiFetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error('[STRIPE] Error:', err);
      showToast('Erreur lors du lancement de Stripe.', 'error');
    }
  }

  async function checkPaymentSuccess() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      // Remove params to avoid re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
      
      try {
        const res = await apiFetch(`/api/stripe/success?session_id=${sessionId}`);
        const data = await res.json();
        if (data.success) {
          showToast(`⚡ Plan ${data.plan} activé ! Merci de votre soutien.`, 'success');
          // Update local user object
          const user = _getUser();
          if (user) {
            user.subscriptionStatus = data.plan;
            localStorage.setItem('apex_user', JSON.stringify(user));
            updateAuthUI();
          }
        }
      } catch (e) {
        console.error('[STRIPE] Success verification failed:', e);
      }
    }
  }

  // Hook into DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    checkPaymentSuccess();
  });

  Object.assign(window, publicApi);
  window.APEX = publicApi;
  return publicApi;
})();
