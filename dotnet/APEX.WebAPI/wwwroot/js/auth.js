/**
 * APEX — auth.js  v4.0
 * ────────────────────
 * INTÉGRATIONS :
 *  · apiFetch robuste (retry sur 401, refresh token)
 *  · Auth UI (login, register, logout, profil, suivi)
 *  · Stripe checkout
 *  · Plan feature gating
 */
'use strict';

// ─────────────────────────────────
//  A. API FETCH  (ky-inspired robustesse)
// ─────────────────────────────────
window.apiFetch = async function(path, opts={}, retry=true){
  opts.credentials='include';
  opts.headers=opts.headers||{};
  const tok=localStorage.getItem('apex_token');
  if(tok) opts.headers['Authorization']=`Bearer ${tok}`;
  if(opts.body&&!opts.headers['Content-Type']) opts.headers['Content-Type']='application/json';

  let res;
  try{res=await fetch(window._API+path,opts);}
  catch(e){throw new Error('Serveur inaccessible sur le port 5191 — vérifiez que dotnet run tourne.');}

  if(res.status===401&&retry){
    try{
      const rr=await fetch(window._API+'/api/auth/refresh',{method:'POST',credentials:'include'});
      if(rr.ok){
        const d=await rr.json();
        const t=d.accessToken||d.token;
        if(t){localStorage.setItem('apex_token',t);opts.headers['Authorization']=`Bearer ${t}`;return apiFetch(path,opts,false);}
      } else { _clearAuth(); }
    }catch(_){}
  }
  return res;
};

function _clearAuth(){
  localStorage.removeItem('apex_token');
  localStorage.removeItem('apex_user');
  window._state.plan='free';
}

// ─────────────────────────────────
//  B. AUTH STATE
// ─────────────────────────────────
window.isLoggedIn=()=>!!localStorage.getItem('apex_token');

window.updateAuthUI=function(){
  const tok=localStorage.getItem('apex_token');
  document.getElementById('auth-login-btn')  ?.style && (document.getElementById('auth-login-btn').style.display  =tok?'none':'');
  document.getElementById('auth-register-btn')?.style && (document.getElementById('auth-register-btn').style.display=tok?'none':'');
  document.getElementById('auth-profile-btn')?.style && (document.getElementById('auth-profile-btn').style.display =tok?''   :'none');
  if(tok){
    try{
      const p=JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const name=p.name||p.email||p.sub||'?';
      const init=name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')||'?';
      const el=document.getElementById('avatar-initials');
      if(el){el.textContent=init;el.style.background=getCompanyColor(name);}
      // Restore plan from token
      if(p.plan) window._state.plan=p.plan;
    }catch(_){}
  }
};

window.isPlanAllowed=function(required){
  const rank={free:0,essentiel:1,pro:2,ultra:3};
  return (rank[window._state.plan]||0) >= (rank[required]||0);
};

window.requirePlan=function(required,msg){
  if(isPlanAllowed(required)) return true;
  showToast(msg||`Cette fonctionnalité nécessite le plan ${required}.`,'warn');
  setTimeout(()=>{ document.getElementById('tarifs')?.scrollIntoView({behavior:'smooth'}); },600);
  return false;
};

// ─────────────────────────────────
//  C. MODAL OPENERS
// ─────────────────────────────────
window.openLoginModal    =()=>openModal('login-modal');
window.closeLoginModal   =()=>closeModal_id('login-modal');
window.openRegisterModal =()=>openModal('register-modal');
window.closeRegisterModal=()=>closeModal_id('register-modal');
window.openForgotModal   =()=>{ closeModal_id('login-modal'); openModal('forgot-modal'); _setForgotStep(1); };
window.closeForgotModal  =()=>closeModal_id('forgot-modal');
window.openProfilePanel  =()=>{ if(!isLoggedIn()){openLoginModal();return;} openModal('profile-modal'); _loadProfile(); };
window.closeProfilePanel =()=>closeModal_id('profile-modal');
window.openProfileMenu   =()=>document.getElementById('apex-account-panel')?.classList.toggle('open');

// ─────────────────────────────────
//  D. LOGIN
// ─────────────────────────────────
window.handleLogin=async function(e){
  if(e) e.preventDefault();
  const email=document.getElementById('login-email')?.value?.trim();
  const pwd  =document.getElementById('login-password')?.value;
  const errEl=document.getElementById('login-error');
  const btnEl=document.getElementById('login-submit');
  if(errEl) errEl.textContent='';
  if(!email||!pwd){if(errEl)errEl.textContent='Veuillez remplir tous les champs.';return;}
  if(btnEl){btnEl.disabled=true;btnEl.textContent='Connexion…';}
  try{
    const res =await apiFetch('/api/auth/login',{method:'POST',body:JSON.stringify({email,password:pwd})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message||data.title||'Identifiants incorrects.');
    const tok=data.accessToken||data.token;
    if(!tok) throw new Error('Token manquant dans la réponse.');
    localStorage.setItem('apex_token',tok);
    if(data.user) localStorage.setItem('apex_user',JSON.stringify(data.user));
    updateAuthUI(); closeLoginModal();
    showToast('Bienvenue !','success');
    EventBus.emit(EV.AUTH_LOGIN,{email});
  }catch(err){if(errEl)errEl.textContent=err.message;}
  finally{if(btnEl){btnEl.disabled=false;btnEl.innerHTML='<i data-lucide="log-in"></i> Se connecter';forceLucide(btnEl);}}
};

// ─────────────────────────────────
//  E. REGISTER
// ─────────────────────────────────
window.handleRegister=async function(e){
  if(e) e.preventDefault();
  const name =document.getElementById('reg-name')?.value?.trim();
  const email=document.getElementById('reg-email')?.value?.trim();
  const pwd  =document.getElementById('reg-password')?.value;
  const errEl=document.getElementById('reg-error');
  const btnEl=document.getElementById('reg-submit');
  if(errEl) errEl.textContent='';
  if(!name||!email||!pwd){if(errEl)errEl.textContent='Veuillez remplir tous les champs.';return;}
  if(pwd.length<8){if(errEl)errEl.textContent='Mot de passe trop court (8 car. min).';return;}
  if(btnEl){btnEl.disabled=true;btnEl.textContent='Inscription…';}
  try{
    const res =await apiFetch('/api/auth/register',{method:'POST',body:JSON.stringify({name,email,password:pwd})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message||data.title||"Erreur lors de l'inscription.");
    const tok=data.accessToken||data.token;
    if(tok) localStorage.setItem('apex_token',tok);
    if(data.user) localStorage.setItem('apex_user',JSON.stringify(data.user));
    updateAuthUI(); closeRegisterModal();
    showToast('Compte créé avec succès !','success');
    EventBus.emit(EV.AUTH_LOGIN,{email,new:true});
  }catch(err){if(errEl)errEl.textContent=err.message;}
  finally{if(btnEl){btnEl.disabled=false;btnEl.innerHTML='<i data-lucide="user-plus"></i> Créer mon compte';forceLucide(btnEl);}}
};

// ─────────────────────────────────
//  F. LOGOUT
// ─────────────────────────────────
window.handleLogout=async function(){
  try{await apiFetch('/api/auth/logout',{method:'POST'});}catch(_){}
  _clearAuth(); updateAuthUI(); closeAll();
  showToast('À bientôt !','info');
  EventBus.emit(EV.AUTH_LOGOUT,{});
};

window.autoRefreshToken=async function(){
  if(!localStorage.getItem('apex_token')) return;
  try{
    const rr=await fetch(window._API+'/api/auth/refresh',{method:'POST',credentials:'include'});
    if(rr.ok){const d=await rr.json();const t=d.accessToken||d.token;if(t)localStorage.setItem('apex_token',t);}
    else _clearAuth();
  }catch(_){}
};

// ─────────────────────────────────
//  G. FORGOT PASSWORD
// ─────────────────────────────────
let _forgotEmail='';
function _setForgotStep(n){document.querySelectorAll('.forgot-step').forEach((el,i)=>{el.style.display=i+1===n?'':'none';});}

window.handleForgotPassword=async function(){
  const email=document.getElementById('forgot-email')?.value?.trim();
  const errEl=document.getElementById('forgot-error');
  const msgEl=document.getElementById('forgot-msg');
  if(errEl)errEl.textContent=''; if(!email){if(errEl)errEl.textContent='Email requis.';return;}
  _forgotEmail=email;
  try{
    await apiFetch('/api/auth/forgot-password',{method:'POST',body:JSON.stringify({email})});
    if(msgEl)msgEl.textContent='Si ce compte existe, un lien vous a été envoyé.'; _setForgotStep(2);
  }catch(_){if(errEl)errEl.textContent='Erreur réseau. Réessayez.';}
};

// ─────────────────────────────────
//  H. PROFIL
// ─────────────────────────────────
async function _loadProfile(){
  try{
    const res=await apiFetch('/api/profile'); if(!res.ok) return;
    const p=await res.json();
    const s=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
    s('profile-name', p.displayName||p.name||'');
    s('profile-email',p.email||'');
    s('profile-bio',  decodeUtf8Safe(p.bio||''));
  }catch(_){}
}

window.saveBio=async function(){
  const el=document.getElementById('profile-bio'); if(!el) return;
  try{await apiFetch('/api/profile/bio',{method:'PUT',body:JSON.stringify({bio:el.value})});showToast('Bio sauvegardée.','success');}
  catch(_){showToast('Erreur de sauvegarde.','error');}
};

window.profUploadCv=async function(file){
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

// ─────────────────────────────────
//  I. SUIVI DES CANDIDATURES
// ─────────────────────────────────
const _COLS=['À postuler','Postulé','Entretien','Offre reçue','Refus'];

window.openSuiviPanel =()=>{ if(!isLoggedIn()){openLoginModal();return;} openModal('suivi-modal'); loadSuivi(); };
window.closeSuiviPanel=()=>closeModal_id('suivi-modal');

window.loadSuivi=async function(){
  const board=document.getElementById('suivi-board'); if(!board) return;
  board.innerHTML=_COLS.map(col=>`
    <div class="kanban-col" data-col="${esc(col)}">
      <div class="kanban-col-hd">
        <span>${esc(col)}</span>
        <span class="kanban-count" id="kcount-${col.replace(/\s+/g,'_')}">0</span>
      </div>
      <div class="kanban-col-body" id="kbody-${col.replace(/\s+/g,'_')}"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="_onKanbanDrop(event,'${esc(col)}',this)"></div>
    </div>`).join('');
  try{
    const res=await apiFetch('/api/applications'); if(!res.ok) return;
    const apps=await res.json().catch(()=>[]);
    (Array.isArray(apps)?apps:[]).forEach(app=>{
      const col=document.getElementById(`kbody-${(app.status||_COLS[0]).replace(/\s+/g,'_')}`)
             || board.querySelector('.kanban-col-body');
      if(col) col.appendChild(_buildKanbanCard(app));
    });
    _updateKanbanCounts();
  }catch(_){ board.innerHTML='<p style="color:var(--muted);padding:1rem;text-align:center">Aucune candidature suivie.</p>'; }
};

function _buildKanbanCard(app){
  const card=document.createElement('div');
  card.className='kanban-card'; card.draggable=true; card.dataset.id=app.id||'';
  const color=getCompanyColor(app.company||'');
  card.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="width:28px;height:28px;border-radius:6px;background:${color}20;color:${color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${esc(getCompanyInitials(app.company||''))}</div>
      <p style="font-weight:600;font-size:13px;line-height:1.2">${esc(decodeUtf8Safe(app.jobTitle||app.title||'Candidature'))}</p>
    </div>
    <p style="font-size:12px;color:var(--muted)">${esc(decodeUtf8Safe(app.company||''))}</p>
    ${app.dateApplied?`<p style="font-size:11px;color:var(--muted);margin-top:4px">${relativeDate(app.dateApplied)}</p>`:''}`;
  card.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('text/plain',card.dataset.id);
    card.style.opacity='.5';
  });
  card.addEventListener('dragend',()=>{ card.style.opacity=''; document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over')); });
  return card;
}

window._onKanbanDrop=async function(e,targetCol,bodyEl){
  e.preventDefault(); bodyEl.classList.remove('drag-over');
  const id=e.dataTransfer.getData('text/plain'); if(!id) return;
  const card=document.querySelector(`.kanban-card[data-id="${id}"]`);
  if(card) bodyEl.appendChild(card);
  _updateKanbanCounts();
  try{await apiFetch(`/api/applications/${id}/status`,{method:'PATCH',body:JSON.stringify({status:targetCol})});}
  catch(_){}
};

function _updateKanbanCounts(){
  _COLS.forEach(col=>{
    const body=document.getElementById(`kbody-${col.replace(/\s+/g,'_')}`);
    const cnt =document.getElementById(`kcount-${col.replace(/\s+/g,'_')}`);
    if(body&&cnt) cnt.textContent=body.children.length||'';
  });
}

// ─────────────────────────────────
//  J. STRIPE
// ─────────────────────────────────
window.checkout=async function(planId){
  if(!isLoggedIn()){openLoginModal();return;}
  showToast('Redirection vers le paiement…','info');
  try{
    const res=await apiFetch('/api/stripe/create-checkout-session',{
      method:'POST',body:JSON.stringify({plan:planId,successUrl:location.origin+'?payment=success',cancelUrl:location.href}),
    });
    if(!res.ok) throw new Error('Erreur Stripe');
    const d=await res.json();
    if(d.url) location.href=d.url;
    else throw new Error('URL de paiement manquante.');
  }catch(err){showToast(err.message,'error');}
};

// ─────────────────────────────────
//  K. INIT
// ─────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  updateAuthUI(); autoRefreshToken();
  const p=new URLSearchParams(location.search);
  if(p.get('payment')==='success'){
    history.replaceState({},document.title,location.pathname);
    showToast('Abonnement activé avec succès !','success');
    autoRefreshToken().then(updateAuthUI);
  }
  // Kanban CSS injection
  if(!document.getElementById('_kanbanCSS')){
    const s=document.createElement('style'); s.id='_kanbanCSS';
    s.textContent=`
      #suivi-board{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;min-height:200px}
      #suivi-board::-webkit-scrollbar{height:4px}
      #suivi-board::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
      .kanban-col{min-width:200px;background:var(--surface2);border-radius:12px;padding:10px}
      .kanban-col-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
      .kanban-count{background:var(--border);border-radius:9999px;padding:1px 7px;font-size:11px;color:var(--muted)}
      .kanban-col-body{display:flex;flex-direction:column;gap:6px;min-height:50px;transition:background .15s;border-radius:8px}
      .kanban-col-body.drag-over{background:var(--orange-light,#fff7ed);outline:2px dashed var(--orange)}
      .kanban-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;cursor:grab;transition:box-shadow .15s;user-select:none}
      .kanban-card:hover{box-shadow:var(--shadow-md)}
      .kanban-card:active{cursor:grabbing}`;
    document.head.appendChild(s);
  }
});
