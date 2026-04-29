/**
 * APEX — core.js  v4.0  (Production / Silicon Valley Grade)
 * ─────────────────────────────────────────────────────────
 * INTÉGRATIONS :
 *  · EventBus   (inspiré de developit/mitt)        — communication découplée entre modules
 *  · Sanitizer  (inspiré de cure53/DOMPurify)       — anti-XSS sur toute injection innerHTML
 *  · classNames (inspiré de lukeed/clsx)            — gestion propre des classes CSS
 *  · Telemetry  (inspiré de plausible/analytics)    — tracking privacy-first via sendBeacon
 *  · SEO Manager (logique inspirée de react-helmet) — meta tags dynamiques
 *  · Feature Flags                                  — A/B testing sans redéploiement
 *  · PWA / SW registration                          — mode hors-ligne, install prompt
 *  · Web Worker bridge                              — parsing JSON off-thread
 * ─────────────────────────────────────────────────────────
 */
'use strict';

// ════════════════════════════════════════════════════════
//  A. CONFIG
// ════════════════════════════════════════════════════════
window._API = 'http://localhost:5191';

// ════════════════════════════════════════════════════════
//  B. STATE GLOBAL (single source of truth)
// ════════════════════════════════════════════════════════
window._state = {
  jobs:         [],
  currentJob:   null,
  currentJobIdx: -1,
  page:         1,
  filter:       null,
  query:        '',
  location:     '',
  chatHistory:  [],
  isLoading:    false,
  appMode:      'CANDIDATE',   // 'CANDIDATE' | 'RECRUITER'
  plan:         'free',        // 'free' | 'essentiel' | 'pro' | 'ultra'
};
// Compat aliases
Object.defineProperties(window, {
  _allJobs:       {get:()=>_state.jobs,        set:v=>{_state.jobs=v;},configurable:true},
  _currentJob:    {get:()=>_state.currentJob,  set:v=>{_state.currentJob=v;},configurable:true},
  _currentJobIdx: {get:()=>_state.currentJobIdx,set:v=>{_state.currentJobIdx=v;},configurable:true},
  _currentPage:   {get:()=>_state.page,        set:v=>{_state.page=v;},configurable:true},
  _activeFilter:  {get:()=>_state.filter,      set:v=>{_state.filter=v;},configurable:true},
  _chatHistory:   {get:()=>_state.chatHistory, set:v=>{_state.chatHistory=v;},configurable:true},
  _isLoading:     {get:()=>_state.isLoading,   set:v=>{_state.isLoading=v;},configurable:true},
  _PAGE_SIZE:     {get:()=>10,configurable:true},
});

// ════════════════════════════════════════════════════════
//  C. EVENT BUS  (mitt-inspired, ultra-léger)
// ════════════════════════════════════════════════════════
window.EventBus = (() => {
  const _map = Object.create(null);
  return {
    on(ev,fn)  { (_map[ev]||(_map[ev]=[])).push(fn); },
    off(ev,fn) { if(_map[ev]) _map[ev]=_map[ev].filter(f=>f!==fn); },
    emit(ev,d) { (_map[ev]||[]).forEach(fn=>{ try{fn(d);}catch(e){console.warn('[EventBus]',ev,e);} }); },
    once(ev,fn){ const w=d=>{fn(d);this.off(ev,w);}; this.on(ev,w); },
  };
})();

// Événements canoniques
window.EV = Object.freeze({
  SEARCH_START:   'search:start',
  SEARCH_DONE:    'search:done',
  SEARCH_ERROR:   'search:error',
  FILTER_CHANGE:  'filter:change',
  JOB_OPEN:       'job:open',
  JOB_SWIPE_L:    'job:swipe_left',
  JOB_SWIPE_R:    'job:swipe_right',
  APPLY_CLICK:    'apply:click',
  DRAWER_OPEN:    'drawer:open',
  DRAWER_CLOSE:   'drawer:close',
  THEME_CHANGE:   'theme:change',
  AUTH_LOGIN:     'auth:login',
  AUTH_LOGOUT:    'auth:logout',
  CMD_PALETTE:    'cmd:palette',
  PLAN_UPGRADED:  'plan:upgraded',
});

// ════════════════════════════════════════════════════════
//  D. DOM SANITIZER  (DOMPurify-inspired, anti-XSS)
// ════════════════════════════════════════════════════════
window.sanitizeHTML = (function(){
  const ALLOWED = new Set(['P','BR','B','STRONG','I','EM','U','SPAN','DIV',
    'UL','OL','LI','H3','H4','A','SMALL','S']);
  const SAFE_ATTRS = new Set(['class','href','target','rel']);
  const SAFE_PROTO = /^(https?|mailto):/i;
  const tmp = document.createElement('div');
  const walk = node => {
    node.childNodes.forEach(c => {
      if (c.nodeType===3) return; // text node OK
      if (c.nodeType!==1) { c.remove(); return; }
      if (!ALLOWED.has(c.tagName)) { c.replaceWith(document.createTextNode(c.textContent)); return; }
      Array.from(c.attributes).forEach(a=>{
        if (!SAFE_ATTRS.has(a.name)) { c.removeAttribute(a.name); return; }
        if (a.name==='href' && !SAFE_PROTO.test(a.value)) { c.removeAttribute('href'); return; }
        if (a.name==='target') c.setAttribute('rel','noopener noreferrer');
      });
      walk(c);
    });
  };
  return function(dirty){
    if (!dirty || typeof dirty!=='string') return '';
    tmp.innerHTML = dirty;
    walk(tmp);
    const r = tmp.innerHTML;
    tmp.innerHTML = '';
    return r;
  };
})();

// ════════════════════════════════════════════════════════
//  E. UTILS
// ════════════════════════════════════════════════════════
window.esc = function(str){
  if (str==null) return '';
  const d=document.createElement('div'); d.textContent=String(str); return d.innerHTML;
};

window.decodeUtf8Safe = function(str){
  if (!str||typeof str!=='string') return str||'';
  try{return decodeURIComponent(escape(str));}catch(_){}
  return str
    .replace(/Ã©/g,'é').replace(/Ã¨/g,'è').replace(/Ã /g,'à').replace(/Ã¢/g,'â')
    .replace(/Ã®/g,'î').replace(/Ã´/g,'ô').replace(/Ã¹/g,'ù').replace(/Ã»/g,'û')
    .replace(/Ã§/g,'ç').replace(/Ã‰/g,'É').replace(/Ãª/g,'ê').replace(/Ã¼/g,'ü')
    .replace(/â€™/g,"'").replace(/â€"/g,'–').replace(/Ã¢â€šÂ¬/g,'€').replace(/â‚¬/g,'€')
    .replace(/Â°/g,'°').replace(/Â«/g,'«').replace(/Â»/g,'»');
};

window.formatSalary = function(label){
  if (!label) return '';
  const s=decodeUtf8Safe(label);
  const m=s.match(/(\d[\d\s]*)[\s\S]*?[Ee]uros?\s*[àa]\s*(\d[\d\s]*)/i);
  if (m){
    const min=parseInt(m[1].replace(/\s/g,'')),max=parseInt(m[2].replace(/\s/g,''));
    if (!isNaN(min)&&!isNaN(max)) return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} €/${/mois/i.test(s)?'mois':'an'}`;
  }
  return s.replace(/Euros?/gi,'€').replace(/â‚¬/g,'€').trim();
};

window.cleanDesc = function(raw,max=180){
  if (!raw) return '';
  const s=decodeUtf8Safe(raw).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max)+'…':s;
};

/** Formatage date relative "il y a 2h" (dayjs-inspired) */
window.relativeDate = function(dateStr){
  if (!dateStr) return '';
  const d=new Date(dateStr); if (isNaN(d)) return '';
  const m=Math.floor((Date.now()-d)/60000);
  if (m<1)   return 'À l\'instant';
  if (m<60)  return `${m} min`;
  const h=Math.floor(m/60);
  if (h<24)  return `${h}h`;
  const j=Math.floor(h/24);
  if (j<30)  return `${j}j`;
  return `${Math.floor(j/30)} mois`;
};

/** classNames utility (clsx-inspired) */
window.cx = (...args) => args.filter(Boolean).flat().join(' ').trim();

window.scrollToTop     = ()=>window.scrollTo({top:0,behavior:'smooth'});
window.scrollToResults = ()=>{
  document.getElementById('search-results')?.scrollIntoView({behavior:'smooth',block:'start'});
};
window.safeOpenUrl = url=>{if(url&&/^https?:\/\//.test(url))window.open(url,'_blank','noopener,noreferrer');};

window.forceLucide = function(node){
  if (!window.lucide) return;
  try{node?lucide.createIcons({nodes:[node]}):lucide.createIcons();}catch(_){}
};

window.getCompanyColor = function(name){
  if (!name) return '#f97316';
  const p=['#e11d48','#7c3aed','#0284c7','#059669','#d97706','#dc2626','#2563eb','#16a34a','#9333ea','#0891b2','#be185d','#0f766e'];
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffffffff;
  return p[Math.abs(h)%p.length];
};
window.getCompanyInitials = n=>(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
window.getCompanyLogoUrl = name=>{
  if (!name) return null;
  const s=name.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,24);
  return s?`https://logo.clearbit.com/${s}.com`:null;
};
window.toggleFontSize = ()=>{
  document.body.classList.toggle('large-text');
  localStorage.setItem('apex_font_large',String(document.body.classList.contains('large-text')));
};

// ════════════════════════════════════════════════════════
//  F. TOAST  (animé, Sweetalert2-inspired)
// ════════════════════════════════════════════════════════
window.showToast = function(msg, type='info', duration=3500){
  document.getElementById('apex-toast-el')?.remove();
  const C={success:{c:'#22c55e',i:'check-circle'},warn:{c:'#f59e0b',i:'alert-triangle'},info:{c:'#f97316',i:'info'},error:{c:'#ef4444',i:'x-circle'}};
  const {c,i}=C[type]||C.info;
  const t=document.createElement('div');
  t.id='apex-toast-el';
  t.setAttribute('role','alert');
  t.style.cssText=`position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(16px) scale(.95);
    background:var(--surface,#fff);border:1.5px solid ${c};color:var(--text,#111);
    padding:12px 20px;border-radius:14px;font-size:14px;font-weight:600;
    box-shadow:0 8px 40px rgba(0,0,0,.15);z-index:99999;
    display:flex;align-items:center;gap:10px;opacity:0;max-width:min(420px,90vw);
    transition:all .32s cubic-bezier(.34,1.56,.64,1);font-family:var(--font,'DM Sans',sans-serif);cursor:pointer`;
  t.innerHTML=`<i data-lucide="${i}" style="color:${c};width:18px;height:18px;flex-shrink:0"></i><span>${esc(msg)}</span>`;
  document.body.appendChild(t);
  forceLucide(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0) scale(1)';
  }));
  const dismiss=()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(12px) scale(.95)'; setTimeout(()=>t.remove(),350); };
  const timer=setTimeout(dismiss,duration);
  t.addEventListener('click',()=>{clearTimeout(timer);dismiss();},{once:true});
};

// ════════════════════════════════════════════════════════
//  G. FEATURE FLAGS  (A/B Testing)
// ════════════════════════════════════════════════════════
window.FLAGS = (()=>{
  const DEF={swipe_vertical:true,cmd_palette:true,salary_inline:true,kanban_suivi:true,pwa_prompt:true,new_apply_btn:'orange'};
  let OV={}; try{OV=JSON.parse(localStorage.getItem('apex_flags')||'{}');}catch(_){}
  return{get:k=>k in OV?OV[k]:DEF[k],set(k,v){OV[k]=v;localStorage.setItem('apex_flags',JSON.stringify(OV));},all:()=>({...DEF,...OV})};
})();

// ════════════════════════════════════════════════════════
//  H. TELEMETRY  (privacy-first, sendBeacon)
// ════════════════════════════════════════════════════════
window.telemetry = (()=>{
  const Q=[]; let flushing=false;
  const flush=()=>{
    if(flushing||!Q.length) return; flushing=true;
    const batch=Q.splice(0,10);
    // try{navigator.sendBeacon(window._API+'/api/telemetry',JSON.stringify({events:batch}));}catch(_){}
    flushing=false;
  };
  EventBus.on(EV.SEARCH_DONE,({query,count})=>T.track('search',{q:query?.slice(0,50),count}));
  EventBus.on(EV.JOB_SWIPE_R,({title})=>T.track('swipe_right',{title:title?.slice(0,40)}));
  EventBus.on(EV.APPLY_CLICK,({jobId})=>T.track('apply',{jobId}));
  const T={
    track(ev,props={}){ Q.push({event:ev,url:location.pathname,ts:Date.now(),...props}); if(Q.length>=5)flush(); },
    flush,
  };
  return T;
})();
window.addEventListener('pagehide',()=>telemetry.flush());

// ════════════════════════════════════════════════════════
//  I. SEO MANAGER  (react-helmet inspired)
// ════════════════════════════════════════════════════════
window.SEO = (()=>{
  const ORIG={title:document.title};
  const meta=(sel,attr,val)=>{
    let el=document.querySelector(sel);
    if(!el){el=document.createElement('meta'); const m=sel.match(/(?:name|property)="([^"]+)"/); if(m){el.setAttribute(m[0].split('=')[0],m[1]);} document.head.appendChild(el);}
    el.setAttribute(attr,val);
  };
  return{
    setJob(j){
      if(!j){this.reset();return;}
      const t=`${j.intitule||''} — ${j.entreprise?.nom||''} — APEX`;
      const d=cleanDesc(j.description||'',160);
      document.title=t;
      meta('meta[name="description"]','content',d);
      meta('meta[property="og:title"]','content',t);
      meta('meta[property="og:description"]','content',d);
      try{const u=new URL(location.href);u.searchParams.set('job',j.id||'');history.replaceState({jobId:j.id},t,u.toString());}catch(_){}
    },
    setSearch(q,l){
      const t=q?`${q}${l?' à '+l:''} — Offres APEX`:'APEX — Trouvez votre emploi';
      document.title=t;
      try{const u=new URL(location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');if(l)u.searchParams.set('l',l);else u.searchParams.delete('l');u.searchParams.delete('job');history.replaceState({q,l},t,u.toString());}catch(_){}
    },
    reset(){document.title=ORIG.title;},
  };
})();

// ════════════════════════════════════════════════════════
//  J. THÈME
// ════════════════════════════════════════════════════════
window.initTheme = function(){
  const saved=localStorage.getItem('apex_theme')||localStorage.getItem('apex-theme');
  const dark=saved?saved==='dark':window.matchMedia('(prefers-color-scheme:dark)').matches;
  document.documentElement.classList.toggle('dark',dark);
  if(localStorage.getItem('apex_font_large')==='true') document.body.classList.add('large-text');
  _updateThemeIcon(dark);
};
window.toggleTheme = function(){
  const dark=document.documentElement.classList.toggle('dark');
  localStorage.setItem('apex_theme',dark?'dark':'light');
  _updateThemeIcon(dark);
  EventBus.emit(EV.THEME_CHANGE,{dark});
};
function _updateThemeIcon(dark){
  const icon=document.getElementById('theme-icon'); if(!icon) return;
  icon.setAttribute('data-lucide',dark?'sun':'moon');
  forceLucide(icon.closest('button')||icon.parentElement);
}

// ════════════════════════════════════════════════════════
//  K. PANELS / MODALS
// ════════════════════════════════════════════════════════
window._openModals = new Set();

window.showBackdrop = ()=>{ const b=document.getElementById('backdrop'); if(b){b.style.display='block';document.body.style.overflow='hidden';} };
window.hideBackdrop = ()=>{ if(_openModals.size>0) return; const b=document.getElementById('backdrop'); if(b) b.style.display='none'; document.body.style.overflow=''; };

window.openModal = function(id){
  const el=document.getElementById(id); if(!el) return;
  el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); _openModals.add(id); showBackdrop(); forceLucide(el);
  requestAnimationFrame(()=>el.querySelector('input,button,[tabindex]:not([tabindex="-1"])')?.focus());
};
window.closeModal_id = function(id){
  const el=document.getElementById(id);
  if(el){ el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); }
  _openModals.delete(id); hideBackdrop();
};
window.closeAll = function(){
  _openModals.forEach(id=>{
    const el=document.getElementById(id);
    if(el){ el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); }
  });
  _openModals.clear();
  document.getElementById('apex-drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
  const b=document.getElementById('backdrop'); if(b) b.style.display='none';
  document.body.style.overflow='';
};

window.switchContractTab = function(btn,id){
  document.querySelectorAll('.ct-tab').forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false');});
  btn.classList.add('active'); btn.setAttribute('aria-selected','true');
  ['stage','alternance','interim'].forEach(t=>{const el=document.getElementById('tab-'+t);if(el)el.style.display=t===id?'flex':'none';});
};
window.toggleMobileMenu = function(){
  const m=document.getElementById('mobile-nav-menu'); if(!m) return;
  const open=m.style.display==='block';
  m.style.display=open?'none':'block';
  document.body.style.overflow=open?'':'hidden';
  if(!open) forceLucide(m);
};
window.closeMobileMenu = ()=>{ const m=document.getElementById('mobile-nav-menu'); if(m)m.style.display='none'; document.body.style.overflow=''; };

// ════════════════════════════════════════════════════════
//  L. WEB WORKER BRIDGE  (off-thread data processing)
// ════════════════════════════════════════════════════════
window.DataWorker = (()=>{
  let W=null, id=0;
  const P=new Map();
  const init=()=>{
    if(W) return;
    try{
      W=new Worker('js/data-worker.js');
      W.onmessage=({data})=>{ const cb=P.get(data.id); if(cb){P.delete(data.id);cb(data.result);} };
      W.onerror=()=>{ W=null; }; // fallback silencieux
    }catch(_){ W=null; }
  };
  return{
    process(raw){ return new Promise(res=>{ init(); if(!W){res(_processJobsSync(raw));return;} const i=++id; P.set(i,res); W.postMessage({id:i,jobs:raw}); setTimeout(()=>{if(P.has(i)){P.delete(i);res(_processJobsSync(raw));}},2500); }); },
  };
})();

window._processJobsSync = function(raw){
  if (!Array.isArray(raw)) raw=raw?.resultats??raw?.results??raw?.items??raw?.offres??[];
  return raw.map(j=>({
    ...j,
    id:j.id||j.identifiant||j.jobId||Math.random().toString(36).slice(2),
    intitule:   decodeUtf8Safe(j.intitule||j.title||''),
    description:decodeUtf8Safe(j.description||j.desc||''),
    entreprise: {...(j.entreprise||{}),nom:decodeUtf8Safe(j.entreprise?.nom||j.company||'')},
    salaire:    {...(j.salaire||{}),   libelle:decodeUtf8Safe(j.salaire?.libelle||j.salary||'')},
    lieuTravail:{...(j.lieuTravail||{}),libelle:decodeUtf8Safe(j.lieuTravail?.libelle||j.location||'')},
    typeContrat:j.typeContrat||j.contractType||j.natureContrat||'',
    url:j.url||j.origineOffre?.urlOrigine||j.applyUrl||'',
    dateCreation:j.dateCreation||j.datePublished||'',
    _processed:true,
  }));
};

// ════════════════════════════════════════════════════════
//  M. INTERSECTION OBSERVER HELPER
// ════════════════════════════════════════════════════════
window.createSentinel = function(containerEl, onIntersect, margin='200px'){
  const s=document.createElement('div');
  s.setAttribute('aria-hidden','true');
  s.style.cssText='height:1px;width:100%;pointer-events:none;flex-shrink:0';
  containerEl.appendChild(s);
  const obs=new IntersectionObserver(en=>{ if(en[0].isIntersecting) onIntersect(); },{rootMargin:margin,threshold:0});
  obs.observe(s);
  return {sentinel:s,observer:obs,disconnect(){obs.unobserve(s);s.remove();}};
};

// ════════════════════════════════════════════════════════
//  N. PWA
// ════════════════════════════════════════════════════════
// window._pwaInstallPrompt=null;
// (function(){
//   if(!('serviceWorker' in navigator)) return;
//   navigator.serviceWorker.register('/service-worker.js',{scope:'/'})
//     .then(r=>{ console.log('[PWA] SW scope:',r.scope); })
//     .catch(e=>console.warn('[PWA]',e));
//   window.addEventListener('beforeinstallprompt',e=>{
//     e.preventDefault(); window._pwaInstallPrompt=e;
//   });
// })();

// ════════════════════════════════════════════════════════
//  O. KEYBOARD SHORTCUTS GLOBAL
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  // Lucide retry
  (function R(n){if(window.lucide)lucide.createIcons();else if(n<60)setTimeout(()=>R(n+1),100);})(0);
  // Scroll shadow
  window.addEventListener('scroll',()=>{
    document.getElementById('apex-header')?.classList.toggle('scrolled',window.scrollY>20);
  },{passive:true});
  // Telemetry
  telemetry.track('pageview');
  // Backdrop
  document.getElementById('backdrop')?.addEventListener('click',closeAll);
  // Escape / Ctrl+K
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();EventBus.emit(EV.CMD_PALETTE,{open:true});return;}
    if(e.key==='Escape'){
      const cp=document.getElementById('cmd-palette');
      if(cp?.classList.contains('open')){EventBus.emit(EV.CMD_PALETTE,{open:false});return;}
      closeAll();
    }
    if(document.getElementById('swipe-modal')?.classList.contains('open')){
      if(e.key==='ArrowLeft')  window.swipeLeft?.();
      if(e.key==='ArrowRight') window.swipeRight?.();
    }
  });
  EventBus.emit('app:loaded',{ts:Date.now()});
});
