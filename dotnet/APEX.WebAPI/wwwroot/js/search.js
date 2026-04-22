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

const SUGGESTIONS = [
  'Développeur React','Développeur Vue.js','Développeur .NET','Développeur Python',
  'Développeur Full Stack','Développeur Node.js','Développeur iOS','Développeur Android',
  'Data Analyst','Data Scientist','Machine Learning','DevOps','Cloud Engineer',
  'Cybersécurité','UX Designer','Product Manager','Chef de projet',
  'Infirmier','Aide-soignant','Médecin généraliste','Pharmacien','Kinésithérapeute',
  'Comptable','Auditeur','Contrôleur de gestion','Analyste financier',
  'Commercial B2B','Technico-commercial','Chargé de recrutement','Community Manager',
  'Logisticien','Cariste','Chef cuisinier','Serveur','Maçon','Électricien',
  'Plombier','Mécanicien','Juriste','Formateur','Business Analyst','Agent immobilier',
  'Responsable RH','Gestionnaire paie','Alternance Développeur','Stage Ingénieur',
];

class SearchBar {
  constructor(inputId, dropdownId) {
    this.input    = document.getElementById(inputId);
    this.dropdown = document.getElementById(dropdownId);
    if (!this.input || !this.dropdown) return;
    this._debounceTimer = null;
    this._activeIdx     = -1;
    this._items         = [];
    this._init();
  }

  _init() {
    // Position dropdown relative to input
    this.dropdown.style.cssText = `
      position:absolute;top:calc(100% + 6px);left:0;right:0;
      background:var(--surface);border:1px solid var(--border);
      border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);
      z-index:500;overflow:hidden;display:none;
      animation:_ddFadeIn .15s ease`;
    if (!document.getElementById('_ddFadeCSS')) {
      const s=document.createElement('style'); s.id='_ddFadeCSS';
      s.textContent='@keyframes _ddFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}';
      document.head.appendChild(s);
    }
    // Make input parent relative
    const wrap = this.input.closest('.search-wrap,.search-field') || this.input.parentElement;
    if (wrap) wrap.style.position='relative';

    this.input.setAttribute('autocomplete','off');
    this.input.setAttribute('role','combobox');
    this.input.setAttribute('aria-autocomplete','list');
    this.input.setAttribute('aria-expanded','false');

    this.input.addEventListener('input', () => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => this._suggest(), 180);
    });
    this.input.addEventListener('keydown', e => this._onKey(e));
    this.input.addEventListener('blur', () => setTimeout(() => this.close(), 200));
  }

  _suggest() {
    const val = this.input.value.trim();
    if (!val || val.length < 2) { this.close(); return; }
    const q = val.toLowerCase();
    this._items = SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 7);
    if (!this._items.length) { this.close(); return; }
    this._render(val);
  }

  _highlight(text, query) {
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return esc(text).replace(re, '<mark style="background:var(--orange-light,#fff7ed);color:var(--orange,#f97316);border-radius:2px;padding:0 1px">$1</mark>');
  }

  _render(val) {
    this.dropdown.innerHTML = '';
    this._activeIdx = -1;
    this._items.forEach((item, i) => {
      const d = document.createElement('div');
      d.className  = 'dd-item';
      d.style.cssText = 'padding:10px 14px;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .12s';
      d.innerHTML  = `<i data-lucide="search" style="width:14px;height:14px;color:var(--muted);flex-shrink:0"></i><span>${this._highlight(item, val)}</span>`;
      d.addEventListener('mouseenter', () => this._activate(i));
      d.addEventListener('mousedown',  e => { e.preventDefault(); this._select(item); });
      this.dropdown.appendChild(d);
    });
    forceLucide(this.dropdown);
    this.dropdown.style.display = '';
    this.input.setAttribute('aria-expanded','true');
  }

  _activate(idx) {
    const items = this.dropdown.querySelectorAll('.dd-item');
    items.forEach((d,i) => d.style.background = i===idx ? 'var(--surface2)' : '');
    this._activeIdx = idx;
  }

  _onKey(e) {
    const items = this.dropdown.querySelectorAll('.dd-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); this._activate(Math.min(this._activeIdx+1, items.length-1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); this._activate(Math.max(this._activeIdx-1, 0));
    } else if (e.key === 'Enter' && this._activeIdx >= 0) {
      e.preventDefault(); this._select(this._items[this._activeIdx]);
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  _select(item) {
    this.input.value = item;
    this.close();
    window.triggerSearch?.(item);
  }

  close() {
    this.dropdown.style.display = 'none';
    this.input.setAttribute('aria-expanded','false');
    this._activeIdx = -1;
  }
}

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
    this._sentinel = createSentinel(this.grid, () => this._loadMore(), '300px');
  }

  _detachSentinel() {
    this._sentinel?.disconnect();
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
        // Déplacer la sentinelle en insérant avant elle
        this.grid.insertBefore(card, this._sentinel?.sentinel || null);
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
  document.querySelectorAll('.qtag').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  window._state.filter = val||null;
  window._state.page   = 1;
  EventBus.emit(EV.FILTER_CHANGE, {filter: val});
  telemetry.track('filter', {filter: val});
  if(window._state.jobs.length) renderPage(true);
  else performSearch();
};

window.handleSearch = function(e, clear=false) {
  if(e) e.preventDefault();
  if(clear){
    ['sq-job','sq-city'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    window._state.filter=null;
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
  window._state.page=1; performSearch(); return false;
};

window.fastSearch = kw => triggerSearch(kw);

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
    if(kw)                      params.set('keyword',  kw);
    if(loc)                     params.set('location', loc);
    if(window._state.filter)    params.set('contract', window._state.filter);
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

    setTimeout(()=>scrollToResults(), 100);

  }catch(err){
    ProgressBar.error();
    showSkeletons(0);
    const grid = document.getElementById('jobs-grid');
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
    <div style="position:relative;width:46px;height:46px;flex-shrink:0">
      <img loading="lazy" src="${esc(logo)}" alt="${esc(company)}"
        style="width:46px;height:46px;border-radius:10px;object-fit:contain;border:1px solid var(--border);
               background:var(--surface2);transition:transform .3s ease"
        onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform=''"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div style="display:none;width:46px;height:46px;border-radius:10px;background:${color}20;color:${color};
        font-weight:800;font-size:13px;align-items:center;justify-content:center;border:1px solid ${color}20">${esc(init)}</div>
    </div>` : `
    <div style="width:46px;height:46px;border-radius:10px;background:${color}20;color:${color};
      display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;
      border:1px solid ${color}20;flex-shrink:0">${esc(init)}</div>`;

  card.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:14px">
      ${logoHtml}
      <div style="flex:1;min-width:0">
        <h3 style="font-size:15px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">${esc(title)}</h3>
        <p style="font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px">
          ${esc(company)}${city?`<span aria-hidden="true">·</span>${esc(city)}`:''}
          <a href="${esc(liUrl)}" target="_blank" rel="noopener noreferrer"
             style="color:#0A66C2;text-decoration:none;font-weight:700;font-size:11px;
                    display:inline-flex;align-items:center;gap:2px;
                    border:1px solid #0A66C220;border-radius:4px;padding:1px 5px;
                    transition:background .15s"
             onmouseover="this.style.background='#e8f0fe'" onmouseout="this.style.background=''"
             onclick="event.stopPropagation()" title="${esc(company)} sur LinkedIn">in</a>
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px">
          ${contract?`<span class="job-tag contract">${esc(contract)}</span>`:''}
          ${salary  ?`<span class="job-tag" style="color:var(--green)">${esc(salary)}</span>`:''}
          ${date    ?`<span class="job-tag">${esc(date)}</span>`:''}
          ${job.origineOffre?.partenaires?.length?'<span class="job-tag" style="color:var(--blue)">France Travail</span>':''}
        </div>
        ${desc?`<p style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5">${esc(desc)}</p>`:''}
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">
      <button class="btn-analyze" onclick="event.stopPropagation();analyzeJob(this,${idx})"
              style="height:32px;padding:0 11px;border-radius:7px;background:var(--tag-bg);
                     color:var(--muted);font-size:12px;font-weight:600;border:1px solid var(--border);
                     cursor:pointer;display:flex;align-items:center;gap:4px;
                     transition:color .15s,border-color .15s"
              onmouseover="this.style.color='var(--orange)';this.style.borderColor='var(--orange)'"
              onmouseout="this.style.color='var(--muted)';this.style.borderColor='var(--border)'"
              aria-label="Analyser avec APEX">
        <i data-lucide="zap" style="width:13px;height:13px"></i> Analyser
      </button>
      <button onclick="event.stopPropagation();openApplyModal('${esc(title).replace(/'/g,"\\'")}','${esc(city).replace(/'/g,"\\'")}');window._currentJob=window._state.jobs[${idx}]"
              style="height:32px;padding:0 14px;border-radius:7px;background:var(--orange);
                     color:#fff;font-size:12px;font-weight:700;border:none;cursor:pointer;
                     display:flex;align-items:center;gap:4px;transition:opacity .15s"
              onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity=''"
              aria-label="Postuler directement">
        <i data-lucide="send" style="width:13px;height:13px"></i> Postuler
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
window.renderPage = function(reset=false) {
  let jobs = [...window._state.jobs];
  if(window._state.filter){
    const f=window._state.filter.toUpperCase();
    jobs=jobs.filter(j=>(j.typeContrat||'').toUpperCase().includes(f)||(j.typeContratLibelle||'').toUpperCase().includes(f));
  }
  const sub=document.getElementById('results-subtitle');
  if(sub&&!sub.textContent.includes('cours')){
    const n=jobs.length;
    sub.textContent=`${n.toLocaleString('fr-FR')} offre${n!==1?'s':''}`;
  }
  if(!jobs.length){
    document.getElementById('jobs-grid')?.replaceChildren();
    document.getElementById('empty-state')?.classList.remove('hidden');
    return;
  }
  document.getElementById('empty-state')?.classList.add('hidden');
  const start=(window._state.page-1)*window._PAGE_SIZE;
  const slice=jobs.slice(start,start+window._PAGE_SIZE);
  const grid=document.getElementById('jobs-grid'); if(!grid) return;
  if(reset) grid.innerHTML='';
  slice.forEach((job,i)=>{
    const card=buildJobCard(job,start+i);
    card.style.animation='_fadeUp .25s ease both';
    card.style.animationDelay=Math.min(i*0.04,0.25)+'s';
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
//  J. FEATURED JOBS (homepage)
// ══════════════════════════════════════════════════════
window.renderFeatured = async function(){
  const c=document.getElementById('featured-jobs'); if(!c) return;
  if(window._state.jobs.length>0){
    c.innerHTML='';
    window._state.jobs.slice(0,4).forEach((job,i)=>{ const card=buildJobCard(job,i); c.appendChild(card); });
    forceLucide(c); return;
  }
  try{
    const res=await apiFetch('/api/jobs/search?keyword=emploi&range=0-3');
    if(!res.ok){ c.innerHTML='<p style="color:var(--muted);text-align:center;padding:1rem">Démarrez le serveur avec <code>dotnet run</code></p>'; return; }
    const data=await res.json().catch(()=>[]);
    const jobs=await DataWorker.process(Array.isArray(data)?data:(data.resultats??data.results??[]));
    c.innerHTML='';
    if(!jobs.length){ c.innerHTML='<p style="color:var(--muted);text-align:center;padding:1rem">Aucune offre disponible.</p>'; return; }
    jobs.slice(0,4).forEach((job,i)=>{ const card=buildJobCard(job,i); c.appendChild(card); });
    forceLucide(c);
  }catch(_){ c.innerHTML='<p style="color:var(--muted);text-align:center;padding:1rem">Serveur non démarré.</p>'; }
};

// ══════════════════════════════════════════════════════
//  K. INIT
// ══════════════════════════════════════════════════════
let _searchBar = null;

document.addEventListener('DOMContentLoaded', ()=>{
  // Instancier SearchBar
  const wrap=document.getElementById('sq-job')?.parentElement;
  if(wrap){
    // Injecter dropdown dans le parent
    const dd=document.createElement('div');
    dd.id='_apex_autocomplete';
    dd.setAttribute('role','listbox');
    wrap.style.position='relative';
    wrap.appendChild(dd);
    _searchBar=new SearchBar('sq-job','_apex_autocomplete');
  }

  // Click hors dropdown
  document.addEventListener('click',e=>{ if(!e.target.closest('.search-wrap')) _searchBar?.close(); });

  // Enter sur inputs de recherche
  ['sq-job','sq-city'].forEach(id=>{
    document.getElementById(id)?.addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();handleSearch(e);}
    });
  });

  // Boutons de recherche
  document.querySelectorAll('.btn-recherche,.hero-search-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{e.preventDefault();performSearch();});
  });

  // URL params → auto-search
  try{
    const p=new URLSearchParams(location.search);
    const q=p.get('q'),l=p.get('l');
    if(q){const el=document.getElementById('sq-job');if(el)el.value=q;}
    if(l){const el=document.getElementById('sq-city');if(el)el.value=l;}
    if(q||l) setTimeout(performSearch,600);
    else     setTimeout(renderFeatured,800);
  }catch(_){ setTimeout(renderFeatured,800); }

  // EventBus listeners
  EventBus.on(EV.FILTER_CHANGE, ()=>{
    document.getElementById('jobs-grid')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
