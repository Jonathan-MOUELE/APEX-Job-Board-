/**
 * APEX — search.js  v4.0
 * ────────────────────────
 * INTÉGRATIONS :
 *  · SearchBar class     (inspiré de TarekRaafat/autoComplete.js + algolia/autocomplete)
 *    — debounce, dropdown flottant, keyboard nav, highlight
 *  · IntersectionObserver Infinite Scroll  (W3C/IntersectionObserver)
 *    — sentinelle en bas du feed, zéro listener scroll, chargement silencieux
 *  · EventBus           (developit/mitt) — search:start/done/error, filter:change
 *  · DataWorker bridge  — parsing JSON off-thread (core.js)
 *  · HubSpot/pace style — barre de progression fetch
 *  · Lazy logo loading  (aFarkas/lazysizes inspired) — logos chargés à l'entrée dans viewport
 */
'use strict';

// ══════════════════════════════════════════════════════
//  A. PROGRESS BAR  (pace.js-inspired)
// ══════════════════════════════════════════════════════
const ProgressBar = (() => {
  let _el = null, _timer = null;
  const _ensure = () => {
    if (_el) return;
    _el = document.createElement('div');
    _el.id = '_apex_progress';
    _el.style.cssText = `
      position:fixed;top:0;left:0;height:3px;width:0;z-index:99990;
      background:var(--orange,#f97316);
      transition:width .25s ease,opacity .3s ease;
      border-radius:0 2px 2px 0;pointer-events:none;
      box-shadow:0 0 8px var(--orange,#f97316)`;
    document.body.appendChild(_el);
  };
  return {
    start() { _ensure(); clearTimeout(_timer); _el.style.opacity='1'; _el.style.width='30%'; _timer=setTimeout(()=>{ _el.style.width='75%'; },400); },
    done()  { _ensure(); clearTimeout(_timer); _el.style.width='100%'; _timer=setTimeout(()=>{ _el.style.opacity='0'; setTimeout(()=>{ if(_el)_el.style.width='0'; },300); },200); },
    error() { if(_el){_el.style.background='#ef4444';this.done();setTimeout(()=>{if(_el)_el.style.background='var(--orange,#f97316)';},600);} },
  };
})();

// ══════════════════════════════════════════════════════
//  B. SEARCH BAR CLASS  (autoComplete.js + Algolia inspired)
// ══════════════════════════════════════════════════════

// SearchBar logic replaced by dynamic async autoComplete.js

// ══════════════════════════════════════════════════════
//  C. INFINITE SCROLL ENGINE  (IntersectionObserver)
// ══════════════════════════════════════════════════════
class InfiniteScrollFeed {
  constructor(gridId) {
    this.grid      = document.getElementById(gridId);
    this._sentinel = null;
    this._apiPage  = 1;
    this._query    = '';
    this._location = '';
    this._filter   = null;
    this._loading  = false;
    this._exhausted= false;
  }

  init(query, location, filter) {
    this._query    = query;
    this._location = location;
    this._filter   = filter;
    this._apiPage  = 1;
    this._exhausted= false;
    this._detachSentinel();
    this._attachSentinel();
  }

  _attachSentinel() {
    if (!this.grid || this._sentinel) return;
    const sentinelEl = document.getElementById('infinite-scroll-sentinel-main');
    if (!sentinelEl) return;
    
    sentinelEl.style.display = 'block';
    this._sentinelObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this._loadMore();
      }
    }, { rootMargin: '300px' });
    this._sentinelObserver.observe(sentinelEl);
    this._sentinel = sentinelEl;
  }

  _detachSentinel() {
    if (this._sentinelObserver && this._sentinel) {
      this._sentinelObserver.disconnect();
      this._sentinel.style.display = 'none';
    }
    this._sentinelObserver = null;
    this._sentinel = null;
  }

  async _loadMore() {
    if (this._loading || this._exhausted) return;
    this._loading = true;
    try {
      this._apiPage++;
      const params = new URLSearchParams();
      if (this._query)    params.set('keyword',  this._query);
      if (this._location) params.set('location', this._location);
      if (this._filter)   params.set('contract', this._filter);
      params.set('range', `${(this._apiPage-1)*window._PAGE_SIZE}-${this._apiPage*window._PAGE_SIZE-1}`);

      const res  = await apiFetch(`/api/jobs/search?${params}`);
      if (!res.ok) { this._exhausted=true; this._detachSentinel(); return; }
      const data = await res.json().catch(()=>[]);
      const raw  = Array.isArray(data)?data:(data.resultats??data.results??[]);

      if (!raw.length) { this._exhausted=true; this._detachSentinel(); return; }

      const jobs = await DataWorker.process(raw);
      // Append to global state
      const baseIdx = window._state.jobs.length;
      window._state.jobs.push(...jobs);
      // Render nouveaux cards avec animation
      jobs.forEach((job, i) => {
        const card = buildJobCard(job, baseIdx+i);
        card.style.cssText += 'animation:_fadeUp .3s ease both;animation-delay:'+Math.min(i*0.05,0.3)+'s';
        // Les cartes sont ajoutées à la grille, la sentinelle est gérée en dessous de la grille dans le html
        this.grid.appendChild(card);
      });
      if(!document.getElementById('_fadeUpCSS')){
        const s=document.createElement('style');s.id='_fadeUpCSS';
        s.textContent='@keyframes _fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}';
        document.head.appendChild(s);
      }
      forceLucide(this.grid);
    } catch(_) {
      this._detachSentinel();
    } finally {
      this._loading = false;
    }
  }

  destroy() { this._detachSentinel(); }
}

let _feed = null; // instance globale

// ══════════════════════════════════════════════════════
//  D. SEARCH STATE & HELPERS
// ══════════════════════════════════════════════════════
window.setFilter = function(btn, val) {
  if (!window._state.filters) window._state.filters = new Set();

  if (!val) {
    // Bouton "Tous" → vider tous les filtres
    window._state.filters.clear();
    document.querySelectorAll('.qtag').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
  } else {
    // Toggle du filtre cliqué
    if (window._state.filters.has(val)) {
      window._state.filters.delete(val);
      if (btn) btn.classList.remove('active');
    } else {
      window._state.filters.add(val);
      if (btn) btn.classList.add('active');
    }
    // Désactiver "Tous" si au moins un filtre est actif
    const tousBtn = document.querySelector('.qtag[data-filter-all]');
    if (tousBtn) tousBtn.classList.toggle('active', window._state.filters.size === 0);
  }

  // Compat legacy : exposer filter comme string (premier filtre ou null)
  window._state.filter = window._state.filters.size > 0
    ? [...window._state.filters].join(',')
    : null;

  window._state.page = 1;
  EventBus.emit(EV.FILTER_CHANGE, {filters: [...window._state.filters]});
  telemetry.track('filter', {filters: [...window._state.filters]});
  if (window._state.jobs.length) renderPage(true);
  else performSearch();
};

window.handleSearch = function(e, clear=false) {
  if(e) e.preventDefault();
  if(clear){
    ['sq-job','sq-city'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    window._state.filter=null;
    window._state.filters = new Set();
    document.querySelectorAll('.qtag').forEach(p=>p.classList.remove('active'));
    document.querySelector('.qtag')?.classList.add('active');
  }
  window._state.page=1;
  performSearch();
};

window.triggerSearch = function(kw) {
  const el=document.getElementById('sq-job'); if(el)el.value=kw||'';
  _searchBar?.close();
  window._state.page=1; performSearch();
};

window.triggerSearchCity = function(city) {
  const el=document.getElementById('sq-city'); if(el)el.value=city||'';
  window._state.page=1; performSearch();
};

window.searchChip = function(kw, city, contract) {
  const kEl=document.getElementById('sq-job'), cEl=document.getElementById('sq-city');
  if(kEl) kEl.value=kw||''; if(cEl) cEl.value=city||'';
  if(contract) window._state.filter=contract;
  window._state.page=1; performSearch();
  const offresSec = document.getElementById('offres');
  if(offresSec) offresSec.scrollIntoView({behavior:'smooth'});
  return false;
};

window.fastSearch = kw => {
  triggerSearch(kw);
  const offresSec = document.getElementById('offres');
  if(offresSec) offresSec.scrollIntoView({behavior:'smooth'});
};

window.closeSearchDropdown = function() {
    // legacy, keep for safety
};

window.scrollToFullResults = function() {
    const offresSec = document.getElementById('offres');
    if(offresSec) offresSec.scrollIntoView({behavior:'smooth'});
};


// ══════════════════════════════════════════════════════
//  E. MAIN SEARCH  (avec DataWorker + ProgressBar)
// ══════════════════════════════════════════════════════
window.performSearch = async function() {
  if(window._state.isLoading) return;

  const kw  = (document.getElementById('sq-job')?.value||'').trim();
  const loc = (document.getElementById('sq-city')?.value||'').trim();

  // Update state
  window._state.query    = kw;
  window._state.location = loc;

  // UI
  document.getElementById('initial-state')?.classList.add('hidden');
  const resultsEl = document.getElementById('search-results');
  if(resultsEl) resultsEl.classList.remove('hidden');
  document.getElementById('empty-state')?.classList.add('hidden');

  const sub = document.getElementById('results-subtitle');
  if(sub) sub.textContent='Recherche en cours…';

  showSkeletons();
  ProgressBar.start();
  window._state.isLoading=true;
  EventBus.emit(EV.SEARCH_START, {query:kw, location:loc});


  try{
    const params = new URLSearchParams();
    if(kw)  params.set('keyword',  kw);
    if(loc) params.set('location', loc);
    // Multi-filtres : on envoie le premier seulement à l'API (France Travail n'accepte qu'une valeur),
    // le filtrage multi côté client se fait dans renderPage
    const activeFilters = window._state.filters?.size > 0
      ? [...window._state.filters]
      : (window._state.filter ? [window._state.filter] : []);
    if (activeFilters.length === 1) params.set('contract', activeFilters[0]);
    params.set('range', `0-${window._PAGE_SIZE-1}`);

    const res = await apiFetch(`/api/jobs/search?${params}`);
    if(!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    const data = await res.json().catch(()=>[]);

    const raw = Array.isArray(data)?data:(data.resultats??data.results??data.items??data.offres??[]);

    // Off-thread processing
    const jobs = await DataWorker.process(raw);

    window._state.jobs = jobs;
    window._state.page = 1;


    if(sub){
      const n=jobs.length;
      sub.textContent=`${n.toLocaleString('fr-FR')} offre${n!==1?'s':''} trouvée${n!==1?'s':''}${kw?' pour « '+kw+' »':''}`;
    }

    SEO.setSearch(kw, loc);

    renderPage(true);


    // Init infinite scroll
    _feed?.destroy();
    _feed = new InfiniteScrollFeed('jobs-grid');
    _feed.init(kw, loc, window._state.filter);

    ProgressBar.done();
    EventBus.emit(EV.SEARCH_DONE, {query:kw, count:jobs.length});
    telemetry.track('search', {q:kw, l:loc, count:jobs.length});

    // Note: Scrolling is now handled by the caller (fastSearch, searchChip, form submit) to prevent auto-scroll on page load.


  }catch(err){
    ProgressBar.error();
    showSkeletons(0);
    const grid = document.getElementById('jobs-grid');
    document.getElementById('empty-state')?.classList.add('hidden');
    if(grid){
      grid.innerHTML='';
      const div=document.createElement('div');
      div.style.cssText='text-align:center;padding:2.5rem;color:var(--muted)';
      div.innerHTML=`<i data-lucide="server-crash" style="width:36px;height:36px;margin:0 auto 12px;display:block;color:var(--muted)"></i>
        <p style="font-weight:600;margin-bottom:6px">Impossible de charger les offres</p>
        <p style="font-size:13px">Vérifiez que <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">dotnet run</code> tourne sur le port 5191</p>
        <p style="font-size:12px;color:#ef4444;margin-top:6px">${esc(err.message)}</p>`;
      grid.appendChild(div);
      forceLucide(div);
    }
    if(sub) sub.textContent='Erreur de connexion';
    EventBus.emit(EV.SEARCH_ERROR, {error:err.message});

  }finally{
    window._state.isLoading=false;
  }
};

// ══════════════════════════════════════════════════════
//  F. SKELETONS
// ══════════════════════════════════════════════════════
window.showSkeletons = function(n=6){
  const grid=document.getElementById('jobs-grid'); if(!grid) return;
  grid.innerHTML='';
  for(let i=0;i<n;i++){
    const c=document.createElement('div');
    c.className='sk-card'; c.setAttribute('aria-hidden','true');
    c.innerHTML=`<div style="display:flex;gap:.75rem;align-items:flex-start">
      <div class="sk" style="width:46px;height:46px;border-radius:10px;flex-shrink:0"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:.5rem">
        <div class="sk" style="height:15px;width:68%"></div><div class="sk" style="height:12px;width:44%"></div>
      </div></div>
      <div style="display:flex;gap:.4rem;margin-top:.5rem">
        <div class="sk" style="height:22px;width:56px;border-radius:100px"></div>
        <div class="sk" style="height:22px;width:80px;border-radius:100px"></div>
      </div>`;
    grid.appendChild(c);
  }
};

// ══════════════════════════════════════════════════════
//  G. JOB CARD BUILDER  (lazysizes lazy logos, premium style)
// ══════════════════════════════════════════════════════
window.buildJobCard = function(job, idx) {
  const card = document.createElement('article');
  card.className = 'job-card';
  card.dataset.jobIdx = idx;

  const title    = job.intitule      || 'Poste non spécifié';
  const company  = job.entreprise?.nom|| 'Entreprise';
  const city     = job.lieuTravail?.libelle||'';
  const salary   = formatSalary(job.salaire?.libelle||'');
  const contract = job.typeContrat   || '';
  const desc     = cleanDesc(job.description||'', 150);
  const color    = getCompanyColor(company);
  const init     = getCompanyInitials(company);
  const logo     = getCompanyLogoUrl(company);
  const date     = relativeDate(job.dateCreation||'');
  const liUrl    = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company)}`;

  // Logo avec lazy loading natif + fallback initiales
  const logoHtml = logo ? `
    <div style="position:relative;width:50px;height:50px;flex-shrink:0">
      <img loading="lazy" src="${esc(logo)}" alt="${esc(company)}"
        style="width:50px;height:50px;border-radius:12px;object-fit:contain;border:1px solid var(--border);
               background:var(--surface2);transition:transform .3s ease"
        onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform=''"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div style="display:none;width:50px;height:50px;border-radius:12px;background:${color}15;color:${color};
        font-weight:800;font-size:14px;align-items:center;justify-content:center;border:1px solid ${color}30">${esc(init)}</div>
    </div>` : `
    <div style="width:50px;height:50px;border-radius:12px;background:${color}15;color:${color};
      display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;
      border:1px solid ${color}30;flex-shrink:0">${esc(init)}</div>`;

  card.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:16px">
      ${logoHtml}
      <div style="flex:1;min-width:0">
        <h3 style="font-size:16px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;letter-spacing:-0.01em;">${esc(title)}</h3>
        <p style="font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px;font-weight:500;">
          ${esc(company)}${city?`<span aria-hidden="true" style="opacity:0.5">·</span>${esc(city)}`:''}
          <a href="${esc(liUrl)}" target="_blank" rel="noopener noreferrer"
             style="color:#0A66C2;text-decoration:none;font-weight:700;font-size:11px;
                    display:inline-flex;align-items:center;gap:4px; margin-left:4px;
                    border:1px solid #0A66C220;border-radius:6px;padding:2px 6px;
                    background:#0A66C208; transition:all .2s ease"
             onmouseover="this.style.background='#0A66C215';this.style.borderColor='#0A66C240'" onmouseout="this.style.background='#0A66C208';this.style.borderColor='#0A66C220'"
             onclick="event.stopPropagation()" title="${esc(company)} sur LinkedIn">
             <i data-lucide="linkedin" style="width:11px;height:11px"></i> LinkedIn
          </a>
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
          ${contract?`<span class="job-tag contract" style="border-radius:6px;padding:3px 8px;font-weight:600;">${esc(contract)}</span>`:''}
          ${salary  ?`<span class="job-tag" style="color:var(--green);border-radius:6px;padding:3px 8px;font-weight:600;background:var(--green-light,#f0fdf4);border:1px solid #bbf7d0">${esc(salary)}</span>`:''}
          ${date    ?`<span class="job-tag" style="border-radius:6px;padding:3px 8px;font-weight:600;">${esc(date)}</span>`:''}
          ${job.origineOffre?.partenaires?.length?'<span class="job-tag" style="color:var(--blue);border-radius:6px;padding:3px 8px;font-weight:600;background:#eff6ff;border:1px solid #bfdbfe">France Travail</span>':''}
        </div>
        ${desc?`<p style="font-size:13px;color:var(--muted);margin-top:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;opacity:0.9;">${esc(desc)}</p>`:''}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:12px;">
      <button class="btn-analyze" onclick="event.stopPropagation();analyzeJob(this,${idx})"
              style="height:34px;padding:0 14px;border-radius:8px;background:transparent;
                     color:var(--muted);font-size:13px;font-weight:600;border:1px solid var(--border);
                     cursor:pointer;display:flex;align-items:center;gap:6px;
                     transition:all .2s ease"
              onmouseover="this.style.color='var(--orange)';this.style.borderColor='var(--orange)';this.style.background='var(--orange-light,#fff7ed)'"
              onmouseout="this.style.color='var(--muted)';this.style.borderColor='var(--border)';this.style.background='transparent'"
              aria-label="Analyser avec APEX">
        <i data-lucide="zap" style="width:14px;height:14px"></i> Analyser
      </button>
      <button onclick="event.stopPropagation();window._currentJob=window._state.jobs[${idx}];openApplyModal('${esc(title).replace(/'/g,"\\'")}','${esc(city).replace(/'/g,"\\'")}')"
              style="height:34px;padding:0 16px;border-radius:8px;background:var(--orange);
                     color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;
                     display:flex;align-items:center;gap:6px;transition:all .2s ease;box-shadow:0 2px 4px rgba(249,115,22,0.2)"
              onmouseover="this.style.transform='translateY(-1px)';this.style.box-shadow='0 4px 6px rgba(249,115,22,0.3)'" 
              onmouseout="this.style.transform='translateY(0)';this.style.box-shadow='0 2px 4px rgba(249,115,22,0.2)'"
              aria-label="Postuler directement">
        <i data-lucide="send" style="width:14px;height:14px"></i> Postuler
      </button>
    </div>`;

  // Click sur la carte ouvre le job (pas sur les boutons)
  card.addEventListener('click', e => {
    if (!e.target.closest('button,a')) openJobPanel(idx);
  });

  return card;
};

// ══════════════════════════════════════════════════════
//  H. RENDER PAGE + PAGINATION
// ══════════════════════════════════════════════════════
window.renderPage = function(reset = false) {
    let jobs = [...window._state.jobs];
    const activeFilters = window._state.filters?.size > 0
      ? [...window._state.filters]
      : (window._state.filter ? [window._state.filter] : []);
    if (activeFilters.length > 0) {
        jobs = jobs.filter(j => {
            const tc  = (j.typeContrat || '').toUpperCase();
            const tcl = (j.typeContratLibelle || '').toUpperCase();
            // L'offre doit correspondre à AU MOINS UN des filtres sélectionnés
            return activeFilters.some(fRaw => {
                const f = fRaw.toUpperCase();
                if (f === 'MIS' || f === 'INTÉRIM' || f === 'INTERIM') {
                    return tc.includes('MIS') || tcl.includes('MIS') || tcl.includes('INTÉRIM') || tcl.includes('INTERIM');
                }
                if (f === 'ALT' || f === 'APP' || f === 'ALTERNANCE') {
                    return tc.includes('ALT') || tc.includes('APP') || tcl.includes('ALT') || tcl.includes('APP') || tcl.includes('APPRENTISSAGE') || tcl.includes('ALTERNANCE');
                }
                return tc.includes(f) || tcl.includes(f);
            });
        });
    }
    const sub = document.getElementById('results-subtitle');
    if (sub && !sub.textContent.includes('cours')) {
        const n = jobs.length;
        sub.textContent = `${n.toLocaleString('fr-FR')} offre${n !== 1 ? 's' : ''}`;
    }
    if (!jobs.length) {
        document.getElementById('jobs-grid')?.replaceChildren();
        const emptyEl = document.getElementById('empty-state');
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.style.display = 'block';
            // Check if this is a real search (not initial load)
            const kw = (document.getElementById('sq-job')?.value||'').trim();
            const loc = (document.getElementById('sq-city')?.value||'').trim();
            if (!kw && !loc) {
                emptyEl.innerHTML = `<div style="padding:40px 20px;text-align:center">
                  <i data-lucide="search" style="width:52px;height:52px;color:var(--orange);margin:0 auto 16px;display:block;opacity:0.7"></i>
                  <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Commencez votre recherche</h3>
                  <p style="color:var(--muted);font-size:14px;line-height:1.6;max-width:340px;margin:0 auto">Entrez un poste ou une ville dans la barre de recherche ci-dessus pour découvrir les offres du moment.</p>
                </div>`;
                forceLucide(emptyEl);
            } else {
                emptyEl.innerHTML = `<div style="padding:40px 20px;text-align:center">
                  <i data-lucide="frown" style="width:48px;height:48px;color:var(--muted);margin:0 auto 16px;display:block"></i>
                  <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">Aucune offre trouvée</h3>
                  <p style="color:var(--muted);font-size:14px">Essayez d'élargir vos critères ou de changer de ville.</p>
                </div>`;
                forceLucide(emptyEl);
            }
        }
        document.getElementById('pagination')?.replaceChildren();
        return;
    }
    const emptyEl = document.getElementById('empty-state');
    if (emptyEl) {
        emptyEl.classList.add('hidden');
        emptyEl.style.display = 'none';
    }
    const start = (window._state.page - 1) * window._PAGE_SIZE;
    const slice = jobs.slice(start, start + window._PAGE_SIZE);
    const grid = document.getElementById('jobs-grid');
    if (!grid) return;
    if (reset) grid.innerHTML = '';
    slice.forEach((job, i) => {
        const card = buildJobCard(job, start + i);
        card.style.animation = '_fadeUp .25s ease both';
        card.style.animationDelay = Math.min(i * 0.04, 0.25) + 's';
        grid.appendChild(card);
    });
    forceLucide(grid);
    renderPagination(jobs.length);
};

window.gotoPage = function(p){
  window._state.page=p; renderPage(true); scrollToResults();
};

window.renderPagination = function(total){
  const el=document.getElementById('pagination'); if(!el) return;
  el.innerHTML='';
  const pages=Math.ceil(total/window._PAGE_SIZE); if(pages<=1) return;
  const mk=(lbl,page,active)=>{
    const b=document.createElement('button');
    b.textContent=lbl;
    b.style.cssText=`height:32px;padding:0 12px;border-radius:8px;
      border:1px solid ${active?'var(--orange)':'var(--border)'};
      background:${active?'var(--orange)':'var(--surface)'};
      color:${active?'#fff':'var(--text)'};
      font-size:13px;font-weight:600;cursor:${active?'default':'pointer'};
      transition:all .15s`;
    b.disabled=active;
    b.addEventListener('mouseenter',()=>{ if(!active) b.style.background='var(--surface2)'; });
    b.addEventListener('mouseleave',()=>{ if(!active) b.style.background='var(--surface)'; });
    b.onclick=()=>gotoPage(page);
    return b;
  };
  if(window._state.page>1) el.appendChild(mk('←',window._state.page-1,false));
  const s=Math.max(1,window._state.page-2), e=Math.min(pages,window._state.page+2);
  for(let p=s;p<=e;p++) el.appendChild(mk(p,p,p===window._state.page));
  if(window._state.page<pages) el.appendChild(mk('→',window._state.page+1,false));
};

// ══════════════════════════════════════════════════════
//  I. DETECT SECTOR + SCORE BADGE
// ══════════════════════════════════════════════════════
window.detectSector = function(kw){
  const k=(kw||'').toLowerCase();
  if(/dev|code|info|data|cyber|cloud|web|ia\b|ml\b/.test(k)) return 'numerique';
  if(/infirm|soign|médec|pharma|santé|kiné/.test(k))         return 'sante';
  if(/cuisi|restau|chef|serveur/.test(k))                     return 'restauration';
  if(/logist|transpo|stock|cariste/.test(k))                  return 'logistique';
  if(/btp|maçon|chantier|électr|plomb/.test(k))              return 'btp';
  if(/compta|finance|banque|audit/.test(k))                   return 'finance';
  return null;
};

window.renderScoreBadge = function(sd){
  if(!sd) return null;
  const score=typeof sd==='number'?sd:(sd.match_score||sd.score||0);
  let color='#22c55e',label='STRONG MATCH';
  if(score>=85){color='#22c55e';label='PERFECT FIT';}
  else if(score>=65){color='#22c55e';label='STRONG MATCH';}
  else if(score>=45){color='#f59e0b';label='PARTIAL';}
  else{color='#ef4444';label='NO GO';}
  const w=document.createElement('div');
  w.style.cssText='display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:10px;margin-top:12px';
  w.innerHTML=`<svg viewBox="0 0 44 44" width="44" height="44" style="flex-shrink:0">
    <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" stroke-width="3"/>
    <circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="3"
      stroke-dasharray="113.1" stroke-dashoffset="${113.1-(score/100*113.1)}"
      stroke-linecap="round" transform="rotate(-90 22 22)"/>
    <text x="22" y="27" text-anchor="middle" fill="${color}" font-size="10" font-weight="800">${score}%</text>
  </svg>
  <div>
    <span style="font-size:.72rem;font-weight:700;color:${color};text-transform:uppercase">${label}</span>
    ${sd.justification?`<p style="font-size:12px;color:var(--muted);margin-top:4px;line-height:1.4">${esc(sd.justification)}</p>`:''}
  </div>`;
  return w;
};

// ══════════════════════════════════════════════════════
//  K. INIT
// ══════════════════════════════════════════════════════
let _searchBar = null;

document.addEventListener('DOMContentLoaded', ()=>{
  // Instancier autoComplete.js
  if (document.getElementById('sq-job') && typeof autoComplete !== 'undefined') {
    window._searchBar = new autoComplete({
        selector: "#sq-job",
        data: {
            src: async (query) => {
                try {
                    const res = await fetch(`/api/jobs/search?keyword=${encodeURIComponent(query)}&range=0-6`);
                    if (!res.ok) return [];
                    const data = await res.json();
                    const raw = Array.isArray(data) ? data : (data.resultats ?? data.results ?? data.items ?? data.offres ?? []);
                    const titles = raw.map(j => j.intitule || j.Title || j.title).filter(t => !!t);
                    return [...new Set(titles)];
                } catch (e) {
                    return [];
                }
            },
            cache: false,
        },
        resultsList: {
            element: (list, data) => {
                if (!data.results.length) {
                    const message = document.createElement("div");
                    message.setAttribute("class", "no_result");
                    message.style.padding = "10px 16px";
                    message.style.color = "var(--muted)";
                    message.innerHTML = `<span>Aucune suggestion pour "${data.query}"</span>`;
                    list.prepend(message);
                }
            },
            noResults: true,
        },
        resultItem: {
            highlight: true
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value;
                    window._searchBar.input.value = selection;
                    window.triggerSearch?.(selection);
                }
            }
        },
        debounce: 300
    });
  }

  // Enter sur inputs de recherche
  ['sq-job','sq-city'].forEach(id=>{
    document.getElementById(id)?.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        handleSearch(e);
        setTimeout(()=>document.getElementById('offres')?.scrollIntoView({behavior:'smooth'}), 100);
      }
    });
  });

  // Boutons de recherche
  document.querySelectorAll('.btn-recherche,.hero-search-btn,.search-go').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      performSearch();
      setTimeout(()=>document.getElementById('offres')?.scrollIntoView({behavior:'smooth'}), 100);
    });
  });

  // URL params → auto-search only if params present
  try{
    const p=new URLSearchParams(location.search);
    const q=p.get('q'),l=p.get('l');
    if(q){const el=document.getElementById('sq-job');if(el)el.value=q;}
    if(l){const el=document.getElementById('sq-city');if(el)el.value=l;}
    if(q||l){
      setTimeout(performSearch,600);
    } else {
      // Show invite to search instead of auto-loading
      const sub = document.getElementById('results-subtitle');
      if(sub) sub.textContent = 'Entrez un poste ou une ville pour commencer';
      // Trigger renderPage with empty state to show the invite message
      window._state.jobs = [];
      renderPage(true);
    }
  }catch(_){ 
    const sub = document.getElementById('results-subtitle');
    if(sub) sub.textContent = 'Entrez un poste ou une ville pour commencer';
    window._state.jobs = [];
    renderPage(true);
  }

  // Animated Placeholder
  const keywords = ['Développeur React', 'Serveur', 'Infirmier', 'Commercial', 'Comptable', 'Vendeur', 'Alternance IT', 'Stage Marketing'];
  let kIdx = 0;
  const sqJob = document.getElementById('sq-job');
  if (sqJob) {
    setInterval(() => {
      sqJob.placeholder = `Ex: ${keywords[kIdx]}`;
      kIdx = (kIdx + 1) % keywords.length;
    }, 3500);
  }

  // EventBus listeners
  EventBus.on(EV.FILTER_CHANGE, ()=>{
    document.getElementById('jobs-grid')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
window.handleAutocomplete = function(e, type) {
  const val = e.target.value.toLowerCase();
  const box = document.getElementById('autocomplete-' + type);
  if (!val) {
    box.style.display = 'none';
    return;
  }
  
  let suggestions = [];
  if (type === 'job') {
    // handled by autoComplete
  } else if (type === 'city') {
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes', 'Lille', 'Rennes', 'Strasbourg', 'Montpellier'];
    suggestions = cities.filter(s => s.toLowerCase().includes(val)).slice(0, 5);
  }
  
  if (suggestions.length === 0) {
    box.style.display = 'none';
    return;
  }
  
  box.innerHTML = suggestions.map(s => `<div class="autocomplete-item" onclick="selectAutocomplete('${type}', '${s.replace(/'/g, "\\'")}');">${s}</div>`).join('');
  box.style.display = 'block';
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-field')) {
    const jobBox = document.getElementById('autocomplete-job');
    if (jobBox) jobBox.style.display = 'none';
    const cityBox = document.getElementById('autocomplete-city');
    if (cityBox) cityBox.style.display = 'none';
  }
});
