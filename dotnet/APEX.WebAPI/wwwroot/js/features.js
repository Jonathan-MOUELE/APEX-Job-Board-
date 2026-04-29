/**
 * APEX — features.js  v4.0
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * INTÉGRATIONS :
 *   · CV Builder (filepond-inspired drag&drop, photo, preview live)
 *   · Swipe n' Job VIRTUAL DOM (card recycling, Hammerjs-inspired touch)
 *    — IntersectionObserver sentinelle pour chargement infini silencieux
 *    — EventBus JOB_SWIPE_L / JOB_SWIPE_R
 *   · profUploadCv (drag & drop zone)
 */
'use strict';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  A. CV BUILDER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    <textarea class="form-textarea" rows="2" style="min-height:56px" placeholder="Description des missionsâ€¦" oninput="_updateCvExp('${id}','desc',this.value)"></textarea>
    <button type="button" onclick="_removeCvExp('${id}')" style="font-size:11px;color:#ef4444;background:none;border:none;cursor:pointer;text-align:left;padding:0">Ã— Supprimer</button>`;
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
    <button type="button" onclick="_removeCvEdu('${id}')" style="font-size:11px;color:#ef4444;background:none;border:none;cursor:pointer;text-align:left;padding:0">Ã— Supprimer</button>`;
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
    p.innerHTML='<p style="color:var(--muted);text-align:center;padding:2rem">Remplissez le formulaire Ã  gauche pour voir l\'aperçu.</p>'; return;
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
      ${d.email   ?`<span>âœ‰ ${esc(d.email)}</span>`:''}${d.phone?`<span>âœ† ${esc(d.phone)}</span>`:''}
      ${d.city    ?`<span>ðŸ“ ${esc(d.city)}</span>`:''}${d.linkedin?`<span>in ${esc(d.linkedin)}</span>`:''}
    </div>
    ${d.bio?`<div style="margin-bottom:12px"><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:5px">Profil</p><p style="font-size:9.5pt;color:#374151;line-height:1.6">${esc(d.bio)}</p></div>`:''}
    ${d.experiences.length?`<div style="margin-bottom:12px"><p style="font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${c};margin-bottom:8px">Expériences</p>
    ${d.experiences.map(e=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between">
      <span style="font-weight:700;font-size:10pt">${esc(e.role||'Poste')}</span>
      <span style="font-size:8pt;color:#94a3b8">${esc(e.period||'')}</span></div>
      <p style="font-size:9pt;color:#64748b;margin:1px 0 3px">${esc(e.company||'')}${e.city?'  · '+esc(e.city):''}</p>
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
  setTimeout(()=>sendQuickMessage('Aide-moi Ã  remplir mon CV professionnel. Pose-moi 3 questions clés pour commencer.'),400);
};

window.cvDownload = function(){
  _syncCvFields();
  const p=document.getElementById('cv-preview'); if(!p){showToast('Aperçu indisponible.','error');return;}
  if(typeof window.html2pdf!=='undefined'){
    window.html2pdf().set({margin:0,filename:`CV_${(_cv.data.name||'APEX').replace(/\s+/g,'_')}.pdf`,html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(p).save();
  }else{window.print();showToast('Ctrl+P pour exporter en PDF.','info');}
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  B. SWIPE N' JOB  (virtual card recycling)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class SwipeEngine {
  constructor() {
    this.jobs     = [];
    this.idx      = 0;
    this.liked    = [];
    this.container= null;
    this.apiPage  = 1;
    this._sentinel= null;
    this._sentinelObserver= null;
    this._loading = false;
  }

  async open() {
    this.container = document.getElementById('swipe-card-container');
    openModal('swipe-modal');

    if(window._state.jobs.length > 0) {
      this.jobs = [...window._state.jobs];
    } else {
      await this._loadPage(1);
    }
    this._renderAll();
    this._attachSentinel();
  }

  async _loadPage(p) {
    if (this._loading) return;
    this._loading = true;
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
    }catch(_){}finally{
      this._loading = false;
    }
  }

  _attachSentinel() {
    if(!this.container||this._sentinelObserver) return;
    const sentinelEl = document.getElementById('infinite-scroll-sentinel-swipe');
    if (!sentinelEl) return;
    
    sentinelEl.style.display = 'block';
    this._sentinelObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMoreSwipe();
      }
    }, { rootMargin: '300px' });
    this._sentinelObserver.observe(sentinelEl);
    this._sentinel = sentinelEl;
  }

  async loadMoreSwipe() {
    const prevLen = this.jobs.length;
    await this._loadPage(this.apiPage+1);
    if (this.jobs.length > prevLen) {
      for (let i = prevLen; i < this.jobs.length; i++) {
        const card = this._buildCard(this.jobs[i], i);
        // Insert before the sentinel
        this.container.insertBefore(card, this._sentinel);
      }
      forceLucide(this.container);
    } else {
      // no more jobs
      if (this._sentinel) this._sentinel.style.display = 'none';
      const empty = document.getElementById('swipe-empty');
      if (empty) empty.style.display = 'block';
    }
  }

  _renderAll() {
    if(!this.container) return;
    // Clear previous cards but keep sentinel and empty state
    this.container.querySelectorAll('.swipe-card').forEach(c=>c.remove());
    
    const empty = document.getElementById('swipe-empty');
    if (empty) empty.style.display = 'none';

    if(this.jobs.length === 0){
      if (empty) empty.style.display = 'block';
      return;
    }

    this.jobs.forEach((job, i) => {
      const card = this._buildCard(job, i);
      this.container.insertBefore(card, this._sentinel);
    });
    
    forceLucide(this.container);
  }

      _buildCard(job, idx) {
      const card=document.createElement('div');
      card.className='swipe-card';
      card.style.cssText=`background:var(--surface);border:1px solid var(--border);
        border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:16px;
        margin-bottom:20px; min-height:80vh; scroll-snap-align:start;`;
  
      const color=getCompanyColor(job.entreprise?.nom);
      const init=getCompanyInitials(job.entreprise?.nom);
      const logo=getCompanyLogoUrl(job.entreprise?.nom);
      
      const imgs = [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80'
      ];
      const bgImg = imgs[idx % imgs.length];
  
      card.innerHTML=`
        <div style="height:200px; width:100%; border-radius:14px; overflow:hidden; flex-shrink:0; margin-bottom:-20px;">
          <img loading="lazy" src="${bgImg}" style="width:100%; height:100%; object-fit:cover; transition: transform 0.5s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" alt="">
        </div>
        <div style="display:flex;align-items:center;gap:16px; position:relative; z-index:10; padding:0 16px;">
          <div style="width:64px;height:64px;border-radius:14px;overflow:hidden;flex-shrink:0;border:1px solid var(--border);background:${color}15;display:flex;align-items:center;justify-content:center">
            ${logo?`<img loading="lazy" src="${esc(logo)}" alt="" style="width:100%;height:100%;object-fit:contain;transition:transform .3s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span style="display:none;color:${color};font-weight:800;font-size:16px">${esc(init)}</span>`
            :`<span style="color:${color};font-weight:800;font-size:16px">${esc(init)}</span>`}
          </div>
          <div style="min-width:0; flex:1;">
            <p style="font-size:14px;font-weight:600;color:var(--muted);margin-bottom:4px">${esc(job.entreprise?.nom||'')}</p>
            <h3 style="font-weight:800;font-size:20px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(job.intitule||'')}</h3>
          </div>
          ${job.entreprise?.nom ? `<button onclick="window.open('https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.entreprise.nom)}', '_blank')" title="Chercher sur LinkedIn" style="background:none;border:none;color:#0A66C2;cursor:pointer;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></button>` : ''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${[job.lieuTravail?.libelle,job.typeContrat,formatSalary(job.salaire?.libelle||'')].filter(Boolean).map(t=>`<span class="job-tag" style="padding:6px 12px;font-size:13px">${esc(t)}</span>`).join('')}
        </div>
        <div style="font-size:15px;color:var(--text);line-height:1.6;flex:1;overflow-y:auto;margin:8px 0;position:relative;">
          <p id="desc-${idx}" style="margin:0;">
            ${esc(cleanDesc(job.description||'',300))}
            ${(job.description && job.description.length > 300) ? `<a href="javascript:void(0)" onclick="this.parentElement.innerHTML=unescape(\'${escape(job.description)}\');" style="color:var(--orange);font-weight:bold;text-decoration:none;">... Voir tout</a>` : ''}
          </p>
        </div>
        <div style="display:flex;gap:12px;margin-top:auto">
          <button onclick="window.swipeRight(${idx})" class="btn-swipe-action like" style="flex:1;height:48px;border-radius:12px;background:var(--green-light);color:var(--green);border:1px solid var(--green);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> Sauvegarder
          </button>
          <button onclick="openApplyModal('${esc(job.intitule||'').replace(/'/g,"\\'")}','')" style="flex:2;height:48px;border-radius:12px;background:var(--orange);color:#fff;border:none;font-weight:800;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Postuler
          </button>
        </div>`;
      return card;
    }

  likeJob(idx) {
    const job = this.jobs[idx];
    if(job){
      this.liked.push(job);
      showToast(`â™¥ "${(job.intitule||'Offre').slice(0,40)}" sauvegardée`,'success');
      EventBus.emit(EV.JOB_SWIPE_R, {title:job.intitule, company:job.entreprise?.nom});
      if(isLoggedIn()) apiFetch('/api/jobs/bookmark',{method:'POST',body:JSON.stringify({jobId:job.id})}).catch(()=>{});
    }
  }

  close() {
    closeModal_id('swipe-modal');
    if (this._sentinelObserver) {
      this._sentinelObserver.disconnect();
    }
    this._sentinelObserver=null;
    if (this._sentinel) {
      this._sentinel.style.display = 'none';
    }
    this._sentinel=null;
  }
}

const _swipeEngine = new SwipeEngine();

window.openSwipeJob = () => {
  const q = (window._state && window._state.query) ? window._state.query : 'développeur';
  window.location.href = `swipe-n-job.html?q=${encodeURIComponent(q)}`;
};
window.closeSwipeModal = ()=>_swipeEngine.close();
window.swipeRight      = (idx)=>_swipeEngine.likeJob(idx);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  C. PROFIL UPLOAD CV
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
window.profUploadCv = async function(file){
  if(!file) return;
  if(file.size>5*1024*1024){showToast('Fichier trop grand (max 5 Mo).','error');return;}
  const ext='.'+file.name.split('.').pop().toLowerCase();
  if(!['.pdf','.doc','.docx','.odt'].includes(ext)){showToast('Format PDF, Word ou ODT uniquement.','error');return;}
  showToast('Envoi du CVâ€¦','info');
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  D. INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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




