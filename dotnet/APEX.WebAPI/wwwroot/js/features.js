/**
 * APEX — features.js  v4.0
 * ─────────────────────────
 * INTÉGRATIONS :
 *  · CV Builder (filepond-inspired drag&drop, photo, preview live)
 *  · Swipe n' Job VIRTUAL DOM (card recycling, Hammerjs-inspired touch)
 *    — IntersectionObserver sentinelle pour chargement infini silencieux
 *    — EventBus JOB_SWIPE_L / JOB_SWIPE_R
 *  · profUploadCv (drag & drop zone)
 */
'use strict';

// ══════════════════════════════════════════════════════
//  A. CV BUILDER
// ══════════════════════════════════════════════════════
const _cv = {
  data:  {name:'',title:'',email:'',phone:'',city:'',linkedin:'',bio:'',experiences:[],educations:[],skills:'',languages:''},
  color: '#e55a2b',
  photo: null,
  expN:  0,
  eduN:  0,
  _timer: null,
};

window.openCvCanvas  = ()=>{ openModal('cv-canvas'); _renderCvPreview(); };
window.closeCvCanvas = ()=>closeModal_id('cv-canvas');

window.setCvColor = function(color, btn) {
  _cv.color=color;
  document.querySelectorAll('.cv-color-btn').forEach(b=>b.style.border=b===btn?`2px solid ${color}`:'2px solid transparent');
  _renderCvPreview();
};

window.debounceCvPreview = function() {
  clearTimeout(_cv._timer);
  _cv._timer=setTimeout(_renderCvPreview, 220);
};

// EXPÉRIENCES
window.cvAddExp = function() {
  const cont=document.getElementById('cv-exps'); if(!cont) return;
  const id=`exp-${++_cv.expN}`;
  const div=document.createElement('div');
  div.dataset.id=id;
  div.style.cssText='background:var(--surface2);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px';
  div.innerHTML=`
    <div style="display:flex;gap:8px">
      <input class="form-input" style="flex:1;height:36px" placeholder="Poste" oninput="_updateCvExp('${id}','role',this.value)">
      <input class="form-input" style="flex:1;height:36px" placeholder="Entreprise" oninput="_updateCvExp('${id}','company',this.value)">
    </div>
    <div style="display:flex;gap:8px">
      <input class="form-input" style="flex:1;height:36px" placeholder="2022 – 2024" oninput="_updateCvExp('${id}','period',this.value)">
      <input class="form-input" style="flex:1;height:36px" placeholder="Lieu" oninput="_updateCvExp('${id}','city',this.value)">
    </div>
    <textarea class="form-textarea" rows="2" style="min-height:56px" placeholder="Description des missions…" oninput="_updateCvExp('${id}','desc',this.value)"></textarea>
    <button type="button" onclick="_removeCvExp('${id}')" style="font-size:11px;color:#ef4444;background:none;border:none;cursor:pointer;text-align:left;padding:0">× Supprimer</button>`;
  cont.appendChild(div);
  if(!_cv.data.experiences.find(e=>e.id===id)) _cv.data.experiences.push({id,role:'',company:'',period:'',city:'',desc:''});
};
window._updateCvExp=(id,f,v)=>{ const e=_cv.data.experiences.find(e=>e.id===id); if(e){e[f]=v;debounceCvPreview();} };
window._removeCvExp=(id)=>{ _cv.data.experiences=_cv.data.experiences.filter(e=>e.id!==id); document.querySelector(`[data-id="${id}"]`)?.remove(); _renderCvPreview(); };

// FORMATIONS
window.cvAddEdu = function() {
  const cont=document.getElementById('cv-edus'); if(!cont) return;
  const id=`edu-${++_cv.eduN}`;
  const div=document.createElement('div');
  div.dataset.id=id;
  div.style.cssText='background:var(--surface2);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px';
  div.innerHTML=`
    <div style="display:flex;gap:8px">
      <input class="form-input" style="flex:1;height:36px" placeholder="Diplôme" oninput="_updateCvEdu('${id}','degree',this.value)">
      <input class="form-input" style="flex:1;height:36px" placeholder="École" oninput="_updateCvEdu('${id}','school',this.value)">
    </div>
    <input class="form-input" style="height:36px" placeholder="2020 – 2022" oninput="_updateCvEdu('${id}','period',this.value)">
    <button type="button" onclick="_removeCvEdu('${id}')" style="font-size:11px;color:#ef4444;background:none;border:none;cursor:pointer;text-align:left;padding:0">× Supprimer</button>`;
  cont.appendChild(div);
  if(!_cv.data.educations.find(e=>e.id===id)) _cv.data.educations.push({id,degree:'',school:'',period:''});
};
window._updateCvEdu=(id,f,v)=>{ const e=_cv.data.educations.find(e=>e.id===id); if(e){e[f]=v;debounceCvPreview();} };
window._removeCvEdu=(id)=>{ _cv.data.educations=_cv.data.educations.filter(e=>e.id!==id); document.querySelector(`[data-id="${id}"]`)?.remove(); _renderCvPreview(); };

function _syncCvFields(){
  const g=id=>document.getElementById(id)?.value||'';
  Object.assign(_cv.data,{name:g('cv-name'),title:g('cv-title'),email:g('cv-email'),phone:g('cv-phone'),city:g('cv-city'),linkedin:g('cv-linkedin'),bio:g('cv-bio'),skills:g('cv-skills'),languages:g('cv-languages')});
}

function _renderCvPreview(){
  _syncCvFields();
  const p=document.getElementById('cv-preview'); if(!p) return;
  const d=_cv.data, c=_cv.color;
  if(!d.name&&!d.title&&!d.bio&&!d.experiences.length&&!d.educations.length){
    p.innerHTML='<p style="color:var(--muted);text-align:center;padding:2rem">Remplissez le formulaire à gauche pour voir l\'aperçu.</p>'; return;
  }
  p.style.cssText='overflow-y:auto;max-height:68vh;border:1px solid var(--border);border-radius:12px;padding:28px;background:#fff;color:#111;font-family:DM Sans,Arial,sans-serif;font-size:10pt;line-height:1.5';
  p.innerHTML=`
    <div style="border-top:5px solid ${c};padding-top:16px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1 style="font-size:22pt;font-weight:800;margin:0 0 3px;color:#0f172a">${esc(d.name||'Votre Nom')}</h1>
          <p style="font-size:11pt;color:${c};font-weight:700;margin:0">${esc(d.title||'Titre du poste visé')}</p>
        </div>
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border:2px solid ${c}20">
          ${_cv.photo?`<img src="${_cv.photo}" style="width:100%;height:100%;object-fit:cover">`:`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px 16px;font-size:9pt;color:#555;padding-bottom:12px;border-bottom:1px solid #e2e8f0;margin-bottom:12px">
      ${d.email   ?`<span>✉ ${esc(d.email)}</span>`:''}${d.phone?`<span>✆ ${esc(d.phone)}</span>`:''}
      ${d.city    ?`<span>📍 ${esc(d.city)}</span>`:''}${d.linkedin?`<span>in ${esc(d.linkedin)}</span>`:''}
    </div>
    ${d.bio?`<div style="margin-bottom:12px"><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:5px">Profil</p><p style="font-size:9.5pt;color:#374151;line-height:1.6">${esc(d.bio)}</p></div>`:''}
    ${d.experiences.length?`<div style="margin-bottom:12px"><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:8px">Expériences</p>
    ${d.experiences.map(e=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between">
      <span style="font-weight:700;font-size:10pt">${esc(e.role||'Poste')}</span>
      <span style="font-size:8pt;color:#94a3b8">${esc(e.period||'')}</span></div>
      <p style="font-size:9pt;color:#64748b;margin:1px 0 3px">${esc(e.company||'')}${e.city?' · '+esc(e.city):''}</p>
      ${e.desc?`<p style="font-size:9pt;color:#374151;line-height:1.5;white-space:pre-wrap">${esc(e.desc)}</p>`:''}</div>`).join('')}
    </div>`:''}
    ${d.educations.length?`<div style="margin-bottom:12px"><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:8px">Formation</p>
    ${d.educations.map(e=>`<div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <div><span style="font-weight:700;font-size:10pt">${esc(e.degree||'Diplôme')}</span><span style="font-size:9pt;color:#64748b;margin-left:8px">${esc(e.school||'')}</span></div>
      <span style="font-size:8pt;color:#94a3b8">${esc(e.period||'')}</span></div>`).join('')}
    </div>`:''}
    ${d.skills?`<div style="margin-bottom:10px"><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:6px">Compétences</p>
    <div style="display:flex;flex-wrap:wrap;gap:4px">${d.skills.split(',').filter(Boolean).map(s=>`<span style="background:${c}12;color:${c};padding:2px 9px;border-radius:9999px;font-size:8pt;font-weight:600">${esc(s.trim())}</span>`).join('')}</div></div>`:''}
    ${d.languages?`<div><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:5px">Langues</p><p style="font-size:9.5pt;color:#374151">${esc(d.languages)}</p></div>`:''}`;
}

window.cvFillWithAI = function(){
  if(!isLoggedIn()){showToast('Connectez-vous pour utiliser le remplissage IA.','warn');return;}
  closeCvCanvas(); openDrawer();
  setTimeout(()=>sendQuickMessage('Aide-moi à remplir mon CV professionnel. Pose-moi 3 questions clés pour commencer.'),400);
};

window.cvDownload = function(){
  _syncCvFields();
  const p=document.getElementById('cv-preview'); if(!p){showToast('Aperçu indisponible.','error');return;}
  if(typeof window.html2pdf!=='undefined'){
    window.html2pdf().set({margin:0,filename:`CV_${(_cv.data.name||'APEX').replace(/\s+/g,'_')}.pdf`,html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(p).save();
  }else{window.print();showToast('Ctrl+P pour exporter en PDF.','info');}
};

// ══════════════════════════════════════════════════════
//  B. SWIPE N' JOB  (virtual card recycling)
// ══════════════════════════════════════════════════════
class SwipeEngine {
  constructor() {
    this.jobs     = [];
    this.idx      = 0;
    this.liked    = [];
    this.arena    = null;
    this.dragging = false;
    this.startX   = 0;
    this.apiPage  = 1;
    this._sentinel= null;
    this._topCard = null;
  }

  async open() {
    this.arena = document.getElementById('swipe-arena');
    openModal('swipe-modal');

    if(window._state.jobs.length > 0) {
      this.jobs = [...window._state.jobs];
    } else {
      const cnt=document.getElementById('swipe-counter');
      if(cnt) cnt.textContent='Chargement…';
      await this._loadPage(1);
    }
    this.idx = 0;
    this._render();
    this._attachSentinel();
  }

  async _loadPage(p) {
    try{
      const q=window._state.query||'emploi';
      const params=new URLSearchParams({keyword:q});
      if(window._state.location) params.set('location',window._state.location);
      if(window._state.filter)   params.set('contract',window._state.filter);
      params.set('range',`${(p-1)*window._PAGE_SIZE}-${p*window._PAGE_SIZE-1}`);
      const res=await apiFetch(`/api/jobs/search?${params}`);
      if(!res.ok) return;
      const data=await res.json().catch(()=>[]);
      const raw=Array.isArray(data)?data:(data.resultats??data.results??[]);
      const jobs=await DataWorker.process(raw);
      this.jobs.push(...jobs);
      this.apiPage=p;
    }catch(_){}
  }

  _attachSentinel() {
    if(!this.arena||this._sentinel) return;
    this._sentinel = createSentinel(this.arena, ()=>{ if(this.jobs.length-this.idx<5) this._loadMore(); }, '100px');
  }

  async _loadMore() {
    await this._loadPage(this.apiPage+1);
    this._updateCounter();
  }

  _updateCounter() {
    const cnt=document.getElementById('swipe-counter');
    const rem=this.jobs.length-this.idx;
    if(cnt) cnt.textContent=`${rem} offre${rem!==1?'s':''} restante${rem!==1?'s':''}`;
  }

  _render() {
    if(!this.arena) return;
    // Garder max 3 cards dans le DOM (virtual)
    const existingCards=this.arena.querySelectorAll('.swipe-card');
    existingCards.forEach(c=>c.remove());

    if(this.idx>=this.jobs.length){
      this.arena.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:260px;gap:12px;text-align:center;padding:1.5rem">
        <div style="font-size:3.5rem">🎉</div>
        <h3 style="font-weight:800;font-size:18px">Tout parcouru !</h3>
        <p style="color:var(--muted);font-size:14px">${this.liked.length} offre${this.liked.length!==1?'s':''} sauvegardée${this.liked.length!==1?'s':''}</p>
        <button onclick="closeSwipeModal()" style="background:var(--orange);color:#fff;border:none;border-radius:9999px;padding:10px 24px;font-weight:700;cursor:pointer;font-size:14px">Retour aux offres</button>
      </div>`;
      return;
    }

    this._updateCounter();

    // Cartes empilées (max 3)
    const count=Math.min(3, this.jobs.length-this.idx);
    for(let i=count-1;i>=0;i--){
      const job=this.jobs[this.idx+i];
      const card=this._buildCard(job, i===0);
      card.style.transform=`scale(${1-i*.04}) translateY(${i*8}px)`;
      card.style.zIndex=10-i;
      card.style.opacity=i===0?'1':'.5';
      this.arena.insertBefore(card, this.arena.firstChild);
    }
    this._topCard=this.arena.querySelector('.swipe-card');
    if(this._topCard) this._attachDrag(this._topCard);
    forceLucide(this.arena);
  }

  _buildCard(job, isTop) {
    const card=document.createElement('div');
    card.className='swipe-card';
    card.style.cssText=`position:absolute;inset:0;background:var(--surface);border:1px solid var(--border);
      border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:10px;
      transition:transform .3s cubic-bezier(.25,.46,.45,.94),opacity .3s;user-select:none`;

    const color=getCompanyColor(job.entreprise?.nom);
    const init=getCompanyInitials(job.entreprise?.nom);
    const logo=getCompanyLogoUrl(job.entreprise?.nom);

    card.innerHTML=`
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:54px;height:54px;border-radius:12px;overflow:hidden;flex-shrink:0;border:1px solid var(--border);background:${color}15;display:flex;align-items:center;justify-content:center">
          ${logo?`<img loading="lazy" src="${esc(logo)}" alt="" style="width:100%;height:100%;object-fit:contain;transition:transform .3s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span style="display:none;color:${color};font-weight:800;font-size:14px">${esc(init)}</span>`
          :`<span style="color:${color};font-weight:800;font-size:14px">${esc(init)}</span>`}
        </div>
        <div style="min-width:0">
          <p style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:2px">${esc(job.entreprise?.nom||'')}</p>
          <h3 style="font-weight:800;font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(job.intitule||'')}</h3>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${[job.lieuTravail?.libelle,job.typeContrat,formatSalary(job.salaire?.libelle||'')].filter(Boolean).map(t=>`<span class="job-tag">${esc(t)}</span>`).join('')}
      </div>
      <p style="font-size:13px;color:var(--muted);line-height:1.55;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;flex:1">
        ${esc(cleanDesc(job.description||'',280))}
      </p>
      <div style="display:flex;gap:6px;margin-top:auto">
        <a href="https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.entreprise?.nom||'')}"
           target="_blank" rel="noopener noreferrer"
           style="font-size:12px;color:#0a66c2;text-decoration:none;border:1px solid #0a66c220;border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:4px"
           onclick="event.stopPropagation()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#0a66c2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn
        </a>
        <button onclick="openApplyModal('${esc(job.intitule||'').replace(/'/g,"\\'")}','')"
                style="flex:1;font-size:12px;background:var(--orange);color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:700">
          Postuler
        </button>
      </div>`;
    return card;
  }

  _attachDrag(card) {
    let startX=0, startY=0;

    // Touch
    card.addEventListener('touchstart', e=>{ startX=e.touches[0].clientX; startY=e.touches[0].clientY; card.style.transition='none'; },{passive:true});
    card.addEventListener('touchmove', e=>{
      const dx=e.touches[0].clientX-startX, dy=e.touches[0].clientY-startY;
      if(Math.abs(dx)>Math.abs(dy)){ card.style.transform=`translateX(${dx}px) rotate(${dx*.04}deg)`; this._showHint(card, dx); }
    },{passive:true});
    card.addEventListener('touchend', e=>{
      card.style.transition='';
      const dx=e.changedTouches[0].clientX-startX;
      this._hideHint(card);
      if(dx<-80) this.swipeLeft(); else if(dx>80) this.swipeRight(); else card.style.transform='';
    });

    // Mouse
    card.addEventListener('mousedown', e=>{ startX=e.clientX; this.dragging=true; card.style.cursor='grabbing'; card.style.transition='none'; });
    window.addEventListener('mousemove', e=>{
      if(!this.dragging) return;
      const dx=e.clientX-startX;
      card.style.transform=`translateX(${dx}px) rotate(${dx*.025}deg)`;
      this._showHint(card, dx);
    });
    window.addEventListener('mouseup', e=>{
      if(!this.dragging) return;
      this.dragging=false; card.style.cursor=''; card.style.transition='';
      const dx=e.clientX-startX;
      this._hideHint(card);
      if(dx<-100) this.swipeLeft(); else if(dx>100) this.swipeRight(); else card.style.transform='';
    });
  }

  _showHint(card, dx) {
    let hint=card.querySelector('.swipe-hint-label');
    if(!hint){ hint=document.createElement('div'); hint.className='swipe-hint-label'; hint.style.cssText='position:absolute;top:20px;padding:6px 14px;border-radius:9999px;font-weight:800;font-size:14px;letter-spacing:.04em;transition:opacity .1s;pointer-events:none'; card.style.position='relative'; card.appendChild(hint); }
    if(dx>30){hint.style.background='#22c55e';hint.style.color='#fff';hint.textContent='♥ SAUVER';hint.style.right='16px';hint.style.left='auto';hint.style.opacity=Math.min((dx-30)/80,1).toFixed(2);}
    else if(dx<-30){hint.style.background='#ef4444';hint.style.color='#fff';hint.textContent='✕ PASSER';hint.style.left='16px';hint.style.right='auto';hint.style.opacity=Math.min((-dx-30)/80,1).toFixed(2);}
    else{hint.style.opacity='0';}
  }
  _hideHint(card){ card.querySelector('.swipe-hint-label')?.remove(); }

  swipeLeft() {
    if(this._topCard){ this._animateOut(this._topCard,'left'); }
    const job=this.jobs[this.idx];
    EventBus.emit(EV.JOB_SWIPE_L, {title:job?.intitule, company:job?.entreprise?.nom});
    setTimeout(()=>{ this.idx++; this._render(); }, 320);
  }

  swipeRight() {
    if(this._topCard){ this._animateOut(this._topCard,'right'); }
    const job=this.jobs[this.idx];
    if(job){
      this.liked.push(job);
      showToast(`♥ "${(job.intitule||'Offre').slice(0,40)}" sauvegardée`,'success');
      EventBus.emit(EV.JOB_SWIPE_R, {title:job.intitule, company:job.entreprise?.nom});
      if(isLoggedIn()) apiFetch('/api/jobs/bookmark',{method:'POST',body:JSON.stringify({jobId:job.id})}).catch(()=>{});
    }
    setTimeout(()=>{ this.idx++; this._render(); }, 320);
  }

  _animateOut(card, dir) {
    card.style.transition='transform .32s cubic-bezier(.25,.46,.45,.94),opacity .32s';
    card.style.transform=dir==='left'?'translateX(-140%) rotate(-20deg)':'translateX(140%) rotate(20deg)';
    card.style.opacity='0';
  }

  close() {
    closeModal_id('swipe-modal');
    this._sentinel?.disconnect();
    this._sentinel=null;
    this.dragging=false;
  }
}

const _swipeEngine = new SwipeEngine();

window.openSwipeJob    = ()=>_swipeEngine.open();
window.closeSwipeModal = ()=>_swipeEngine.close();
window.swipeLeft       = ()=>_swipeEngine.swipeLeft();
window.swipeRight      = ()=>_swipeEngine.swipeRight();

// ══════════════════════════════════════════════════════
//  C. PROFIL UPLOAD CV
// ══════════════════════════════════════════════════════
window.profUploadCv = async function(file){
  if(!file) return;
  if(file.size>5*1024*1024){showToast('Fichier trop grand (max 5 Mo).','error');return;}
  const ext='.'+file.name.split('.').pop().toLowerCase();
  if(!['.pdf','.doc','.docx','.odt'].includes(ext)){showToast('Format PDF, Word ou ODT uniquement.','error');return;}
  showToast('Envoi du CV…','info');
  try{
    const fd=new FormData(); fd.append('cv',file);
    const res=await fetch(window._API+'/api/profile/upload-cv',{
      method:'POST',credentials:'include',
      headers:{Authorization:`Bearer ${localStorage.getItem('apex_token')||''}`},
      body:fd,
    });
    if(!res.ok) throw new Error();
    showToast('CV importé avec succès !','success');
  }catch(_){showToast("Erreur lors de l'import.",'error');}
};

// ══════════════════════════════════════════════════════
//  D. INIT
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // Photo CV
  document.getElementById('cv-photo-input')?.addEventListener('change', e=>{
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      _cv.photo=ev.target.result;
      const prev=document.getElementById('cv-photo-preview');
      if(prev) prev.innerHTML=`<img src="${ev.target.result}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">`;
      _renderCvPreview();
    };
    r.readAsDataURL(f);
  });

  // Swipe data-action
  document.querySelectorAll('[data-action="swipe"]').forEach(el=>{
    el.addEventListener('click',e=>{e.preventDefault();openSwipeJob();});
  });

  // CV drop zone
  const dz=document.getElementById('cv-drop-zone');
  if(dz){
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.borderColor='var(--orange)';dz.style.background='var(--orange-light)';});
    dz.addEventListener('dragleave',()=>{dz.style.borderColor='';dz.style.background='';});
    dz.addEventListener('drop',e=>{e.preventDefault();dz.style.borderColor='';dz.style.background='';const f=e.dataTransfer?.files?.[0];if(f)profUploadCv(f);});
  }
  document.getElementById('cv-file-main')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)profUploadCv(f);});

  // CSS injection pour swipe modal
  if(!document.getElementById('_swipeCSS')){
    const s=document.createElement('style'); s.id='_swipeCSS';
    s.textContent=`
      #swipe-arena{position:relative;flex:1;min-height:260px;max-height:480px;margin:12px 0}
      .swipe-card{cursor:grab}
      .swipe-card:active{cursor:grabbing}
      .job-tag{font-size:11px;font-weight:600;color:var(--muted);background:var(--tag-bg);border:1px solid var(--border);padding:2px 8px;border-radius:9999px;white-space:nowrap}
      .job-tag.contract{color:var(--blue,#0ea5e9);background:var(--blue-light,#e0f2fe);border-color:var(--blue-light)}`;
    document.head.appendChild(s);
  }
});
