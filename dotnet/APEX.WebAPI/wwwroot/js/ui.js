/**
 * APEX — ui.js  v4.0
 * ───────────────────
 * INTÉGRATIONS :
 *  · Job Panel détaillé avec SEO (openJob → SEO.setJob)
 *  · Chat Bot avec EventBus & analyse NLP locale
 *  · Apply Modal + submitApplication (France Travail URL bridge)
 *  · Salary Modals
 *  · Command Palette  (Ctrl+K, ninja-keys-inspired)
 *  · micromodal-inspired focus trap sur toutes les modales
 *  · Analyse IA (score badge, EventBus)
 */
'use strict';

// ══════════════════════════════════════════════════════
//  A. COMMAND PALETTE  (ninja-keys inspired, Ctrl+K)
// ══════════════════════════════════════════════════════
class CommandPalette {
  constructor() {
    this.el    = null;
    this.inp   = null;
    this.list  = null;
    this._all  = [];
    this._flt  = [];
    this._idx  = -1;
    this._init();
    EventBus.on(EV.CMD_PALETTE, ({open}) => open ? this.open() : this.close());
  }

  _init() {
    // Inject CSS
    const s = document.createElement('style');
    s.id = '_cpCSS';
    s.textContent = `
      #cmd-palette{position:fixed;inset:0;z-index:99998;display:flex;align-items:flex-start;justify-content:center;padding-top:120px;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .2s}
      #cmd-palette.open{opacity:1;pointer-events:all}
      #cmd-palette .cp-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;width:min(560px,90vw);box-shadow:0 24px 80px rgba(0,0,0,.3);overflow:hidden;transform:translateY(-12px);transition:transform .2s}
      #cmd-palette.open .cp-box{transform:translateY(0)}
      #cmd-inp-wrap{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border)}
      #cmd-inp-wrap i{width:18px;height:18px;color:var(--muted);flex-shrink:0}
      #cmd-inp{flex:1;border:none;outline:none;background:transparent;font-size:16px;color:var(--text);font-family:var(--font)}
      #cmd-inp::placeholder{color:var(--muted)}
      #cmd-list{max-height:340px;overflow-y:auto}
      .cp-section{padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-top:4px}
      .cp-item{display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;transition:background .12s}
      .cp-item:hover,.cp-item.active{background:var(--surface2)}
      .cp-item-icon{width:32px;height:32px;border-radius:8px;background:var(--tag-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--orange)}
      .cp-item-icon i{width:16px;height:16px}
      .cp-item-text{flex:1;min-width:0}
      .cp-item-title{font-size:14px;font-weight:600;color:var(--text)}
      .cp-item-sub{font-size:12px;color:var(--muted)}
      .cp-kbd{font-size:11px;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:2px 7px;color:var(--muted);font-family:monospace;flex-shrink:0}
      #cmd-palette .cp-footer{padding:8px 16px;border-top:1px solid var(--border);display:flex;gap:16px;font-size:11px;color:var(--muted)}`;
    document.head.appendChild(s);

    // Inject HTML
    const div = document.createElement('div');
    div.id = 'cmd-palette';
    div.setAttribute('role','dialog');
    div.setAttribute('aria-modal','true');
    div.setAttribute('aria-label','Palette de commandes');
    div.innerHTML = `
      <div class="cp-box">
        <div id="cmd-inp-wrap">
          <i data-lucide="search"></i>
          <input id="cmd-inp" type="text" placeholder="Rechercher une action, une offre, un outil…" aria-label="Commande" autocomplete="off">
        </div>
        <div id="cmd-list" role="listbox"></div>
        <div class="cp-footer">
          <span>↑↓ Naviguer</span><span>↵ Sélectionner</span><span>Esc Fermer</span>
        </div>
      </div>`;
    document.body.appendChild(div);
    div.addEventListener('click', e => { if(e.target===div) this.close(); });

    this.el   = div;
    this.inp  = div.querySelector('#cmd-inp');
    this.list = div.querySelector('#cmd-list');
    forceLucide(div);

    this._buildCommands();
    this.inp.addEventListener('input', () => { this._filter(this.inp.value); });
    this.inp.addEventListener('keydown', e => this._onKey(e));
  }

  _buildCommands() {
    this._all = [
      // Navigation
      {cat:'Navigation', icon:'home',        title:'Accueil',           sub:'Retourner à l\'accueil',          action:()=>scrollToTop()},
      {cat:'Navigation', icon:'briefcase',   title:'Offres d\'emploi',  sub:'Voir toutes les offres',          action:()=>{document.getElementById('offres')?.scrollIntoView({behavior:'smooth'});}},
      {cat:'Navigation', icon:'wrench',      title:'Outils',            sub:'Créateur CV, calculateur…',       action:()=>{document.getElementById('outils')?.scrollIntoView({behavior:'smooth'});}},
      {cat:'Navigation', icon:'credit-card', title:'Tarifs',            sub:'Nos formules d\'abonnement',      action:()=>{document.getElementById('tarifs')?.scrollIntoView({behavior:'smooth'});}},
      // Outils
      {cat:'Outils', icon:'file-text',   title:'Créer mon CV',          sub:'Éditeur live avec export PDF',    action:()=>openCvCanvas()},
      {cat:'Outils', icon:'calculator',  title:'Calculateur de salaire',sub:'Brut → Net instantané',           action:()=>openSalaryCalcModal()},
      {cat:'Outils', icon:'layers',      title:'Swipe n\' Job',         sub:'Mode découverte TikTok-style',    action:()=>openSwipeJob()},
      {cat:'Outils', icon:'bot',         title:'APEX IA',               sub:'Ouvrir l\'assistant',             action:()=>openDrawer()},
      {cat:'Outils', icon:'clipboard-list',title:'Suivi candidatures',  sub:'Mon tableau Kanban',              action:()=>openSuiviPanel()},
      // Compte
      {cat:'Compte', icon:'log-in',      title:'Se connecter',          sub:'Accéder à mon espace',            action:()=>openLoginModal(), visible:()=>!isLoggedIn()},
      {cat:'Compte', icon:'user-plus',   title:'Créer un compte',       sub:'Inscription gratuite',            action:()=>openRegisterModal(), visible:()=>!isLoggedIn()},
      {cat:'Compte', icon:'user',        title:'Mon profil',            sub:'Gérer mes informations',          action:()=>openProfilePanel(), visible:()=>isLoggedIn()},
      {cat:'Compte', icon:'log-out',     title:'Déconnexion',           sub:'',                                action:()=>handleLogout(), visible:()=>isLoggedIn()},
      // Thème
      {cat:'Paramètres', icon:'moon',    title:'Mode sombre',           sub:'Basculer le thème',               action:()=>toggleTheme()},
      {cat:'Paramètres', icon:'type',    title:'Agrandir le texte',     sub:'Accessibilité',                   action:()=>toggleFontSize()},
      // Recherches rapides
      {cat:'Recherches', icon:'zap',     title:'CDI Développeur',       sub:'Rechercher des offres CDI dev',   action:()=>searchChip('développeur','','CDI')},
      {cat:'Recherches', icon:'zap',     title:'Alternance IT',         sub:'Alternance informatique',         action:()=>searchChip('informatique','','ALT')},
      {cat:'Recherches', icon:'zap',     title:'Stage Paris',           sub:'Stages à Paris',                  action:()=>searchChip('','Paris','SAI')},
      // Légal
      {cat:'Légal', icon:'shield',       title:'Mentions légales',      sub:'',                                action:()=>safeOpenUrl('legal.html')},
      {cat:'Légal', icon:'file',         title:'Politique de confidentialité', sub:'RGPD',                     action:()=>safeOpenUrl('legal.html#rgpd')},
    ];
    this._filter('');
  }

  _filter(q) {
    const v = q.trim().toLowerCase();
    this._flt = v
      ? this._all.filter(c => !c.visible || c.visible()).filter(c =>
          c.title.toLowerCase().includes(v) || c.sub?.toLowerCase().includes(v) || c.cat.toLowerCase().includes(v))
      : this._all.filter(c => !c.visible || c.visible());
    this._render();
  }

  _render() {
    this.list.innerHTML = '';
    this._idx = -1;
    const byCat = {};
    this._flt.forEach(c => { (byCat[c.cat]||(byCat[c.cat]=[])).push(c); });
    Object.entries(byCat).forEach(([cat, cmds]) => {
      const sec = document.createElement('div');
      sec.className='cp-section'; sec.textContent=cat;
      this.list.appendChild(sec);
      cmds.forEach((cmd, i) => {
        const el = document.createElement('div');
        el.className='cp-item'; el.setAttribute('role','option');
        el.dataset.idx=this._flt.indexOf(cmd);
        el.innerHTML=`<div class="cp-item-icon"><i data-lucide="${esc(cmd.icon)}"></i></div>
          <div class="cp-item-text">
            <div class="cp-item-title">${esc(cmd.title)}</div>
            ${cmd.sub?`<div class="cp-item-sub">${esc(cmd.sub)}</div>`:''}
          </div>`;
        el.addEventListener('mouseenter',()=>this._activate(parseInt(el.dataset.idx)));
        el.addEventListener('click',()=>this._execute(cmd));
        this.list.appendChild(el);
      });
    });
    forceLucide(this.list);
  }

  _activate(globalIdx) {
    this._idx = globalIdx;
    this.list.querySelectorAll('.cp-item').forEach(el=>{
      el.classList.toggle('active', parseInt(el.dataset.idx)===globalIdx);
    });
  }

  _execute(cmd) {
    this.close();
    setTimeout(()=>{ try{cmd.action();}catch(e){console.warn('[CMD]',e);} }, 80);
    telemetry.track('cmd_palette', {cmd: cmd.title});
  }

  _onKey(e) {
    const len = this._flt.length;
    if (e.key==='ArrowDown') { e.preventDefault(); this._activate((this._idx+1)%len); }
    else if (e.key==='ArrowUp') { e.preventDefault(); this._activate((this._idx-1+len)%len); }
    else if (e.key==='Enter') { e.preventDefault(); if(this._idx>=0) this._execute(this._flt[this._idx]); }
    else if (e.key==='Escape') { e.preventDefault(); this.close(); }
  }

  open() {
    this.el.classList.add('open');
    this.inp.value=''; this._filter('');
    this.inp.focus();
  }
  close() {
    this.el.classList.remove('open');
    EventBus.emit(EV.CMD_PALETTE, {open:false});
  }
}

let _cmdPalette = null;

// ══════════════════════════════════════════════════════
//  B. JOB PANEL (drawer détaillé + SEO)
// ══════════════════════════════════════════════════════
window.openJobPanel = function(idx) {
  const job=window._state.jobs[idx]; if(!job) return;
  window._state.currentJob=job; window._state.currentJobIdx=idx;
  SEO.setJob(job);
  EventBus.emit(EV.JOB_OPEN, {job, idx});

  openDrawer();
  const msgs=document.getElementById('chat-msgs'); if(!msgs) return;

  const title   =job.intitule||'';
  const company =job.entreprise?.nom||'';
  const city    =job.lieuTravail?.libelle||'';
  const salary  =formatSalary(job.salaire?.libelle||'');
  const contract=job.typeContrat||'';
  const desc    =sanitizeHTML(decodeUtf8Safe(job.description||''));
  const color   =getCompanyColor(company);
  const init    =getCompanyInitials(company);
  const logo    =getCompanyLogoUrl(company);
  const date    =relativeDate(job.dateCreation||'');

  const div=document.createElement('div');
  div.style.cssText='background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:14px;margin:8px 0';
  div.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      ${logo?`<div style="width:44px;height:44px;border-radius:10px;overflow:hidden;border:1px solid var(--border);flex-shrink:0">
        <img loading="lazy" src="${esc(logo)}" alt="${esc(company)}"
          style="width:100%;height:100%;object-fit:contain;background:var(--surface2);transition:transform .3s"
          onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''">
        </div>` : `<div style="width:44px;height:44px;border-radius:10px;background:${color}20;color:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0">${esc(init)}</div>`}
      <div style="min-width:0">
        <p style="font-weight:800;font-size:15px;line-height:1.2;margin-bottom:2px">${esc(title)}</p>
        <p style="font-size:12px;color:var(--muted)">${esc(company)}${city?` · ${esc(city)}`:''}${date?` · ${esc(date)}`:''}</p>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
      ${contract?`<span class="job-tag contract">${esc(contract)}</span>`:''}
      ${salary  ?`<span class="job-tag" style="color:var(--green)">${esc(salary)}</span>`:''}
    </div>
    ${desc?`<div style="font-size:13px;color:var(--muted);line-height:1.6;max-height:140px;overflow:hidden;mask-image:linear-gradient(to bottom,#000 70%,transparent)">${desc}</div>`:''}
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
      <a href="https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company)}"
         target="_blank" rel="noopener noreferrer"
         style="font-size:12px;color:#0a66c2;text-decoration:none;border:1px solid #0a66c220;border-radius:6px;padding:5px 10px;display:flex;align-items:center;gap:4px"
         onclick="event.stopPropagation()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#0a66c2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn
      </a>
      <button onclick="openApplyModal('${esc(title).replace(/'/g,"\\'")}','${esc(city).replace(/'/g,"\\'")}')"
              style="font-size:12px;background:var(--orange);color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:700">
        ✉ Postuler
      </button>
      ${job.url?`<a href="${esc(job.url)}" target="_blank" rel="noopener noreferrer"
        style="font-size:12px;color:var(--orange);text-decoration:none;border:1px solid var(--orange);border-radius:6px;padding:5px 10px">
        France Travail →
      </a>`:''}
    </div>`;

  // Scroll up dans le chat
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;

  setTimeout(()=>sendQuickMessage(`Analyse cette offre : "${title}" chez "${company}". GO ou NO-GO en 3 points clés.`), 500);
};

window.analyzeJob = function(btn, idx) {
  const job=window._state.jobs[idx];
  const title=job?.intitule||'cette offre';
  const company=job?.entreprise?.nom||'';
  openDrawer();
  setTimeout(()=>sendQuickMessage(`Analyse "${title}"${company?' chez '+company:''}. Verdict GO/NO-GO avec 3 points : compétences requises, salaire estimé, conseils candidature.`), 300);
};

// ══════════════════════════════════════════════════════
//  C. CHAT BOT  (drawer APEX)
// ══════════════════════════════════════════════════════
window.openDrawer = function(prefill) {
  const d=document.getElementById('apex-drawer');
  const ov=document.getElementById('drawer-overlay');
  if(d)  { d.classList.add('open'); document.body.style.overflow='hidden'; forceLucide(d); }
  if(ov) ov.classList.add('open');
  if(typeof prefill==='string') { const inp=document.getElementById('chat-inp'); if(inp) inp.value=prefill; }
  EventBus.emit(EV.DRAWER_OPEN, {});
};
window.closeDrawer = function() {
  document.getElementById('apex-drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
  document.body.style.overflow='';
  EventBus.emit(EV.DRAWER_CLOSE, {});
};

function _appendMsg(text, isUser) {
  const box=document.getElementById('chat-msgs'); if(!box) return;
  const w=document.createElement('div');
  w.className=`cmsg ${isUser?'user':'bot'}`;
  if(!isUser){
    w.innerHTML=`<div class="cmsg-av"><i data-lucide="bot"></i></div>
      <div class="cmsg-bubble">${sanitizeHTML(decodeUtf8Safe(String(text)))}</div>`;
    forceLucide(w);
  } else {
    w.innerHTML=`<div class="cmsg-bubble">${esc(String(text))}</div>`;
  }
  box.appendChild(w); box.scrollTop=box.scrollHeight;
  if(isUser) window._state.chatHistory.push({role:'user',content:String(text)});
  else       window._state.chatHistory.push({role:'assistant',content:decodeUtf8Safe(String(text))});
  if(window._state.chatHistory.length>40) window._state.chatHistory=window._state.chatHistory.slice(-40);
}

function _appendTyping() {
  const box=document.getElementById('chat-msgs'); if(!box) return null;
  const id='typ_'+Date.now();
  const w=document.createElement('div');
  w.id=id; w.className='cmsg bot';
  w.innerHTML=`<div class="cmsg-av"><i data-lucide="bot"></i></div>
    <div class="cmsg-bubble" style="min-width:60px"><div style="display:flex;gap:4px;padding:2px 0">
      <span style="width:6px;height:6px;border-radius:50%;background:var(--muted);animation:tdot 1.2s infinite"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:var(--muted);animation:tdot 1.2s .2s infinite"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:var(--muted);animation:tdot 1.2s .4s infinite"></span>
    </div></div>`;
  forceLucide(w);
  box.appendChild(w); box.scrollTop=box.scrollHeight;
  return id;
}

async function _doChat(msg) {
  const typId=_appendTyping();
  const ctrl=new AbortController();
  const to=setTimeout(()=>ctrl.abort(),30000);
  try{
    const res=await apiFetch('/api/jobs/chat',{
      method:'POST', signal:ctrl.signal,
      body:JSON.stringify({message:msg.slice(0,500), history:window._state.chatHistory.slice(-20)}),
    });
    clearTimeout(to); document.getElementById(typId)?.remove();
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const d=await res.json().catch(()=>({}));
    const reply=d.reply||d.message||d.content||d.text||"Je n'ai pas compris.";
    _appendMsg(reply, false);
  }catch(err){
    clearTimeout(to); document.getElementById(typId)?.remove();
    _appendMsg(err.name==='AbortError'?'Délai dépassé. Réessayez.':'Erreur réseau. Le serveur est-il démarré ?', false);
  }
}

window.sendMsg = async function() {
  const inp=document.getElementById('chat-inp'); if(!inp) return;
  const msg=inp.value.trim(); if(!msg) return;
  inp.value=''; inp.style.height='40px'; inp.disabled=true;
  _appendMsg(msg, true);
  await _doChat(msg);
  inp.disabled=false; inp.focus();
};

window.sendQuickMessage = function(text) {
  if(!document.getElementById('apex-drawer')?.classList.contains('open')) openDrawer();
  const inp=document.getElementById('chat-inp'); if(inp) inp.value=text;
  sendMsg();
};

window.chatKey = e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} };

window.handleChatFile = function(input) {
  const f=input?.files?.[0]; if(!f) return;
  if(!['.pdf','.doc','.docx','.odt'].includes('.'+f.name.split('.').pop().toLowerCase())){
    showToast('Format PDF, Word ou ODT uniquement.','error'); return;
  }
  _appendMsg(`[Fichier joint : ${f.name}]`, true);
  setTimeout(()=>_appendMsg(`Fichier "${f.name}" reçu. Uploadez votre CV dans votre profil pour une analyse complète.`, false), 700);
};

// ══════════════════════════════════════════════════════
//  D. APPLY MODAL
// ══════════════════════════════════════════════════════
window.openApplyModal = function(title, loc) {
  const el=document.getElementById('modal-offer-name');
  if(el) el.textContent=`${title||'Offre'}${loc?' · '+loc:''}`;
  openModal('apply-modal');
  EventBus.emit(EV.APPLY_CLICK, {title, loc});
};
window.closeModal = ()=>closeModal_id('apply-modal');

window.submitApplication = async function() {
  if(!isLoggedIn()){closeModal();openLoginModal();return;}
  const name  =document.getElementById('apply-name')?.value?.trim();
  const email =document.getElementById('apply-email')?.value?.trim();
  const cvFile=document.getElementById('apply-cv')?.files?.[0];
  const msg   =document.getElementById('apply-msg')?.value?.trim();
  const errEl =document.getElementById('apply-error');
  const btnEl =document.getElementById('apply-submit');
  if(!name||!email){if(errEl)errEl.textContent='Nom et email requis.';return;}
  if(errEl) errEl.textContent='';
  if(btnEl){btnEl.disabled=true;btnEl.textContent='Envoi…';}
  try{
    const job=window._state.currentJob;
    const url=job?.origineOffre?.urlOrigine||job?.url||'';
    if(url){
      safeOpenUrl(url);
      showToast('Redirection vers France Travail.','info');
    }else{
      const fd=new FormData();
      fd.append('jobId',   job?.id||'');
      fd.append('jobTitle',job?.intitule||'');
      fd.append('name',    name);
      fd.append('email',   email);
      fd.append('letter',  msg||'');
      if(cvFile) fd.append('cv',cvFile);
      const res=await fetch(window._API+'/api/applications/direct',{
        method:'POST',credentials:'include',
        headers:{Authorization:`Bearer ${localStorage.getItem('apex_token')||''}`},
        body:fd,
      });
      if(!res.ok) throw new Error('Erreur lors de la candidature.');
      showToast('Candidature envoyée !','success');
    }
    closeModal();
  }catch(err){if(errEl)errEl.textContent=err.message;}
  finally{if(btnEl){btnEl.disabled=false;btnEl.innerHTML='<i data-lucide="send"></i> Envoyer ma candidature';forceLucide(btnEl);}}
};

// ══════════════════════════════════════════════════════
//  E. SALARY MODALS
// ══════════════════════════════════════════════════════
window.openSalaryCalcModal  = ()=>openModal('salary-calc-modal');
window.closeSalaryCalcModal = ()=>closeModal_id('salary-calc-modal');
window.openSalaryModal      = ()=>openModal('salary-modal');
window.closeSalaryModal     = ()=>closeModal_id('salary-modal');

window.calcSalary = function() {
  // Clamp value to avoid overflow
  const inp=document.getElementById('sc-brut');
  if(!inp) return;
  let raw=parseFloat(inp.value?.replace(/[^\d.]/g,'')||0);
  if(raw>999999){raw=999999;inp.value='999999';}
  const res=document.getElementById('sc-result'); if(!res) return;
  if(!raw){res.classList.remove('show');return;}
  const period=document.getElementById('sc-period')?.value||'annual';
  const statut=document.getElementById('sc-statut')?.value||'non-cadre';
  const brutA=period==='monthly'?raw*12:raw;
  const brutM=brutA/12;
  const rate=statut==='cadre'?.75:.78;
  const fmt=v=>v.toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('sc-net-m', fmt(brutM*rate));  set('sc-brut-m',fmt(brutM));
  set('sc-net-a', fmt(brutA*rate));  set('sc-brut-a',fmt(brutA));
  set('sc-note',  statut==='cadre'?'Taux ~25% (cadre)':'Taux ~22% (non-cadre)');
  res.classList.add('show');
};

// ══════════════════════════════════════════════════════
//  F. INIT
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // Command Palette
  if(FLAGS.get('cmd_palette')) {
    _cmdPalette = new CommandPalette();
  }

  // Auto-resize chat textarea
  const inp=document.getElementById('chat-inp');
  if(inp) inp.addEventListener('input',()=>{
    inp.style.height='40px';
    if(inp.scrollHeight>40) inp.style.height=Math.min(inp.scrollHeight,120)+'px';
  });

  // CV file input
  document.getElementById('cv-file-main')?.addEventListener('change',e=>{
    const f=e.target.files?.[0]; if(f) profUploadCv(f);
  });

  // Drawer overlay
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
});
