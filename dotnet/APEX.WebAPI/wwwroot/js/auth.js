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

  if(res.status===401&&retry&&tok){
    try{
      const rr=await fetch(window._API+'/api/auth/refresh',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({accessToken:tok}),
        credentials:'include'
      });
      if(rr.ok){
        const d=await rr.json();
        const t=d.accessToken||d.token;
        if(t){
          localStorage.setItem('apex_token',t);
          opts.headers['Authorization']=`Bearer ${t}`;
          return apiFetch(path,opts,false);
        }
      }
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
  // Desktop header buttons
  document.getElementById('auth-login-btn')  ?.style && (document.getElementById('auth-login-btn').style.display  =tok?'none':'');
  document.getElementById('auth-register-btn')?.style && (document.getElementById('auth-register-btn').style.display=tok?'none':'');
  document.getElementById('auth-profile-btn')?.style && (document.getElementById('auth-profile-btn').style.display =tok?''   :'none');
  
  // Mobile menu: toggle login link vs account section
  const mobileLogin   = document.getElementById('mobile-auth-login-btn');
  const mobileSection = document.getElementById('mobile-auth-user-section');
  if(mobileLogin)   mobileLogin.style.display   = tok ? 'none' : '';
  if(mobileSection) mobileSection.style.display = tok ? ''     : 'none';

  if(tok){
    try{
      const p=JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const name =p.name||p.email||p.sub||'Utilisateur';
      const email=p.email||'';
      const init =name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')||'?';
      const color=typeof getCompanyColor==='function' ? getCompanyColor(name) : '#f97316';
      // Desktop header avatar
      const elAvatar=document.getElementById('avatar-initials');
      if(elAvatar){elAvatar.textContent=init;elAvatar.style.background=color;}
      // Desktop dropdown avatar + name + email
      const elAvatarMenu=document.getElementById('avatar-initials-menu');
      if(elAvatarMenu){elAvatarMenu.textContent=init;elAvatarMenu.style.background=color;}
      const elNameMenu=document.getElementById('user-name-menu');
      if(elNameMenu) elNameMenu.textContent=name;
      const elEmailMenu=document.getElementById('user-email-menu');
      if(elEmailMenu) elEmailMenu.textContent=email;
      // Mobile menu avatar + name + email
      const mAvatar=document.getElementById('mobile-avatar-initials');
      if(mAvatar){mAvatar.textContent=init;mAvatar.style.background=color;}
      const mName =document.getElementById('mobile-user-name');
      if(mName) mName.textContent=name;
      const mEmail=document.getElementById('mobile-user-email');
      if(mEmail) mEmail.textContent=email;
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
window.openProfilePanel  =()=>{ 
  if(!isLoggedIn()){openLoginModal();return;} 
  window.location.href = 'user.html'; 
};
window.openProfileMenu   =()=> {
    if (typeof window.closeDrawer === 'function') window.closeDrawer();
    document.getElementById('apex-account-panel')?.classList.toggle('open');
};

// ─────────────────────────────────
//  D. LOGIN
// ─────────────────────────────────
window.handleLogin=async function(e){
  if(e) e.preventDefault();
  const email=document.getElementById('login-email')?.value?.trim();
  const pwd  =document.getElementById('login-pwd')?.value;
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
  const pwd  =document.getElementById('reg-pass')?.value;
  const errEl=document.getElementById('reg-error');
  const btnEl=document.getElementById('reg-submit');
  if(errEl) errEl.textContent='';
  if(!name||!email||!pwd){if(errEl)errEl.textContent='Veuillez remplir tous les champs.';return;}

  if(pwd.length<8){if(errEl)errEl.textContent='Mot de passe trop court (8 car. min).';return;}
  if(btnEl){btnEl.disabled=true;btnEl.textContent='Inscription…';}
  try{
    const res =await apiFetch('/api/auth/register',{method:'POST',body:JSON.stringify({FullName:name,email,password:pwd})});
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

window.profUploadCv = async function(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('Fichier trop volumineux (max 5 Mo).', 'error');
    return;
  }
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!['.pdf', '.doc', '.docx', '.odt'].includes(ext)) {
    showToast('Format PDF, Word ou ODT uniquement.', 'error');
    return;
  }

  const token = localStorage.getItem('apex_token') || sessionStorage.getItem('apex_token');
  if (!token) {
    window._pendingCvFile = file;
    showToast('Connectez-vous ou créez un compte pour analyser et sauvegarder votre CV.', 'warning');
    if (typeof openLoginModal === 'function') openLoginModal();
    else if (typeof openModal === 'function') openModal('login-modal');
    return;
  }

  showToast('Analyse de votre CV par l\'IA en cours…', 'info');
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('cv', file);
    const apiBase = window._API || '';
    const res = await fetch(apiBase + '/api/profile/upload-cv', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: fd
    });

    if (res.status === 401) {
      showToast('Session expirée. Veuillez vous reconnecter.', 'warning');
      if (typeof openLoginModal === 'function') openLoginModal();
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Erreur lors de l'import du CV.", 'error');
      return;
    }

    showToast(data.message || 'CV importé et analysé avec succès !', 'success');
    if (typeof loadUserProfile === 'function') loadUserProfile();
  } catch (err) {
    console.error('Upload CV error:', err);
    showToast("Erreur de connexion lors de l'import.", 'error');
  }
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
//  K. DASHBOARD AUTH GUARD
// ─────────────────────────────────

/**
 * requireAuth(action)
 * Appeler avant toute action réservée aux connectés.
 * Retourne true si connecté, sinon ouvre le modal de connexion et retourne false.
 */
window.requireAuth = function(action) {
  if (isLoggedIn()) return true;
  showToast(action
    ? `Connectez-vous pour ${action}.`
    : 'Connectez-vous pour accéder à cette fonctionnalité.', 'warn');
  setTimeout(openLoginModal, 300);
  return false;
};

/**
 * guardDashboard()
 * Vérifie si l'URL pointe vers un espace reservé (#suivi, #dashboard, #profil)
 * et redirige vers la connexion si non authentifié.
 */
window.guardDashboard = function() {
  const hash = location.hash.toLowerCase();
  const protectedHashes = ['#suivi', '#dashboard', '#profil', '#candidatures', '#alertes'];
  if (protectedHashes.some(h => hash.startsWith(h)) && !isLoggedIn()) {
    history.replaceState({}, document.title, location.pathname);
    showToast('Connectez-vous pour accéder à votre espace personnel.', 'warn');
    setTimeout(openLoginModal, 400);
  }
};

/**
 * Mise à jour du panel compte selon l'état de connexion.
 * Si déconnecté : affiche un CTA connexion au lieu des données.
 */
window.updateAccountPanel = function() {
  const panel = document.getElementById('apex-account-panel');
  if (!panel) return;

  const menu = panel.querySelector('.dashboard-menu');
  const title = panel.querySelector('.account-panel-title');
  if (!menu) return;

  if (isLoggedIn()) {
    // Connecté — affichage normal (l'UI est déjà gérée par updateAuthUI)
    if (title) title.style.display = '';
    menu.style.display = '';
    const logoutBtn = panel.querySelector('.account-logout-btn');
    if (logoutBtn) logoutBtn.style.display = '';
    // Masquer le CTA connexion s'il existe
    const guestCta = panel.querySelector('#panel-guest-cta');
    if (guestCta) guestCta.remove();
  } else {
    // Déconnecté — remplacer le menu par un CTA
    if (title) title.style.display = 'none';
    menu.style.display = 'none';
    const logoutBtn = panel.querySelector('.account-logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';

    if (!panel.querySelector('#panel-guest-cta')) {
      const cta = document.createElement('div');
      cta.id = 'panel-guest-cta';
      cta.style.cssText = 'padding:12px 0;display:flex;flex-direction:column;gap:10px;';
      cta.innerHTML = `
        <p style="font-size:13px;color:var(--muted);line-height:1.5;text-align:center">
          Connectez-vous pour accéder à vos candidatures, alertes et profil.
        </p>
        <button onclick="openProfileMenu();openLoginModal();" style="
          width:100%;padding:10px;border-radius:10px;background:var(--orange);
          color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;">
          Se connecter
        </button>
        <a href="register.html" style="
          width:100%;padding:9px;border-radius:10px;border:1px solid var(--border);
          color:var(--text);font-weight:600;font-size:13px;text-align:center;
          display:block;text-decoration:none;">
          Créer un compte gratuit
        </a>`;
      panel.appendChild(cta);
    }
  }
};

// ─────────────────────────────────
//  L. LITE MODE — Économie données
// ─────────────────────────────────
window.initLiteMode = function() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = conn?.saveData === true;
  const reducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const userPref = localStorage.getItem('apex_lite_mode') === 'true';

  if (saveData || reducedData || userPref) {
    document.documentElement.classList.add('apex-lite');
    document.documentElement.setAttribute('data-lite', 'true');
    // Downgrade les images Unsplash encore en mémoire
    document.querySelectorAll('img[src*="unsplash.com"]').forEach(img => {
      img.src = img.src.replace(/w=\d+/, 'w=200').replace(/q=\d+/, 'q=40');
    });
    // Downgrade les background-image inline
    document.querySelectorAll('[style*="unsplash.com"]').forEach(el => {
      el.style.backgroundImage = el.style.backgroundImage
        .replace(/w=\d+/g, 'w=200').replace(/q=\d+/g, 'q=40');
    });
  }

  if (reducedMotion) {
    document.documentElement.classList.add('apex-lite');
  }
};

// ─────────────────────────────────
//  M. INIT
// ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  updateAccountPanel();
  autoRefreshToken();
  guardDashboard();
  initLiteMode();

  // Lazy-load images hors viewport
  if ('IntersectionObserver' in window) {
    const lazyImgs = document.querySelectorAll('img[data-src]');
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    lazyImgs.forEach(img => obs.observe(img));
  }

  const p = new URLSearchParams(location.search);
  if (p.get('payment') === 'success') {
    history.replaceState({}, document.title, location.pathname);
    showToast('Abonnement activé avec succès !', 'success');
    autoRefreshToken().then(updateAuthUI);
  }

  // Kanban CSS injection
  if (!document.getElementById('_kanbanCSS')) {
    const s = document.createElement('style'); s.id = '_kanbanCSS';
    s.textContent = `
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

  // Sync panel si l'utilisateur se connecte / déconnecte
  window.addEventListener('storage', (e) => {
    if (e.key === 'apex_token') {
      updateAuthUI();
      updateAccountPanel();
    }
  });
});
