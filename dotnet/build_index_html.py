# Python script to generate the massive new index.html with all the Tailwind / Alpine / JS logic requests.
import os

html_content = """<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>APEX — Plateforme de placement IA | by AVERS</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'apex-bg': '#0a0a0f',
        'apex-surface': '#13131a',
        'apex-surface2': '#1a1a24',
        'apex-border': '#1e1e2e',
        'apex-primary': '#4f6ef7',
        'apex-success': '#22c55e',
        'apex-danger': '#ef4444',
        'apex-warning': '#f59e0b',
        'apex-muted': '#64748b',
        'slate-200': '#e2e8f0'
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'gradient': 'gradient-shift 3s ease infinite',
        'pulse-once': 'pulse 0.6s ease-out 1',
        'bounce': 'bounce 0.8s ease infinite'
      }
    }
  }
}
</script>
<style>
  body { font-family: Inter, system-ui, sans-serif; background: #0a0a0f; color: #e2e8f0; min-height: 100vh; overflow-x: hidden; }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes pulse { 0%,100% { box-shadow: 0 4px 20px rgba(79,110,247,.4); } 50% { box-shadow: 0 4px 30px rgba(79,110,247,.7); } }
  @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .grid-bg {
    background-image: linear-gradient(rgba(79,110,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,110,247,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .gradient-text {
    background: linear-gradient(135deg, #4f6ef7, #7c3aed, #4f6ef7);
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-shift 3s ease infinite;
  }
  .score-ring .prog-circle { transition: stroke-dashoffset 1s ease; stroke-dasharray: 138.2; stroke-dashoffset: 138.2; }
  .skeleton {
    background: linear-gradient(90deg, #13131a 25%, #1a1a24 50%, #13131a 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
</style>
</head>
<body x-data="{ tab: 'search', user: null, panelOpen: false, currentJob: null, chatOpen: false, modalOpen: false, modalTab: 'login', showToast: false, toastMsg: '', toastType: 'info' }" 
      @auth-change.window="user = $event.detail"
      @toast.window="toastMsg = $event.detail.msg; toastType = $event.detail.type; showToast = true; setTimeout(() => showToast = false, 4000)"
      :class="panelOpen ? 'overflow-hidden' : ''">

<!-- Toast System -->
<div class="fixed top-5 right-5 z-[500] flex flex-col gap-2 transition-all duration-300"
     :class="showToast ? 'translate-x-0 opacity-100' : 'translate-x-[20px] opacity-0 pointer-events-none'">
  <div class="px-4 py-3 rounded-lg text-sm font-medium shadow-xl flex items-center gap-2 max-w-[360px]"
       :class="{
         'bg-apex-success/15 border border-apex-success/30 text-apex-success': toastType === 'success',
         'bg-apex-danger/10 border border-apex-danger/30 text-apex-danger': toastType === 'error',
         'bg-apex-warning/10 border border-apex-warning/20 text-apex-warning': toastType === 'warning',
         'bg-apex-primary/10 border border-apex-primary/20 text-apex-primary': toastType === 'info'
       }">
    <span x-text="toastMsg"></span>
  </div>
</div>

<!-- Navbar -->
<nav class="sticky top-0 z-[100] h-16 bg-apex-surface/95 backdrop-blur-md border-b border-apex-border flex items-center px-6 gap-4">
  <div class="flex items-center gap-2 text-[20px] font-bold text-apex-primary tracking-tight">
    <svg viewBox="0 0 40 40" fill="none" class="w-7 h-7">
      <path d="M4 36 L20 4 L36 36" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10.5 26 L29.5 26" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    </svg>
    APEX<span class="text-[11px] font-normal text-apex-muted hidden sm:inline">by AVERS</span>
  </div>
  <div class="flex gap-1 ml-4">
    <button @click="tab = 'search'" :class="tab === 'search' ? 'bg-apex-surface2 text-slate-200' : 'text-apex-muted hover:text-slate-200 hover:bg-apex-surface2'" class="px-4 py-2 rounded-lg text-sm font-medium transition-all">🔍 <span class="hidden sm:inline">Recherche</span></button>
    <button @click="tab = 'profile'; if(user) window.Profile.load()" :class="tab === 'profile' ? 'bg-apex-surface2 text-slate-200' : 'text-apex-muted hover:text-slate-200 hover:bg-apex-surface2'" class="px-4 py-2 rounded-lg text-sm font-medium transition-all">👤 <span class="hidden sm:inline">Mon Profil</span></button>
  </div>
  <div class="flex-1"></div>
  <div x-show="!user">
    <button @click="modalOpen = true" class="bg-apex-primary hover:bg-[#3d5ce8] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px">Se connecter</button>
  </div>
  <div x-show="user" style="display:none;" class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-apex-primary to-[#7c3aed] flex items-center justify-center text-sm font-bold text-white uppercase" x-text="(user?.name||user?.email||'?').slice(0,2)"></div>
    <span class="text-sm font-medium truncate max-w-[120px]" x-text="user?.name||user?.email"></span>
    <button @click="window.Auth.handleLogout()" class="border border-apex-border hover:border-[#2e2e42] hover:bg-apex-surface2 px-3 py-1.5 rounded-lg text-sm transition-all">Déconnexion</button>
  </div>
</nav>

<main>
  <!-- SEARCH TAB -->
  <div x-show="tab === 'search'" class="grid-bg min-h-[calc(100vh-64px)] w-full">
    <section class="max-w-[1280px] mx-auto pt-10 px-6 pb-6" x-data="{
        qKw: '', qLoc: '', 
        acResults: [], showAc: false,
        timeoutKw: null, timeoutLoc: null,
        contractFilters: [
           {code: '', label: 'Tous'},
           {code: 'CDI', label: 'CDI'},
           {code: 'CDD', label: 'CDD'},
           {code: 'ALT', label: 'Alternance'},
           {code: 'MIS', label: 'Intérim'}
        ],
        selectedContract: '',
        jobs: [], stats: {count:0, goCount:0, maxScore:0}, loading: false, error: '',
        
        async fetchCityAc() {
            if(this.qLoc.length < 2) { this.acResults = []; this.showAc = false; return; }
            try {
               const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(this.qLoc)}&fields=nom,code&limit=5`);
               this.acResults = await res.json();
               this.showAc = this.acResults.length > 0;
            } catch(e) {}
        },
        async doSearch(force = false) {
           this.loading = true; this.error = ''; this.jobs = []; document.getElementById('res-grid').innerHTML = '';
           window.renderSkeletonCards(6);
           try {
             // Pass contract via contractType
             const res = await window.Api.jobs.search(this.qKw||'développeur', this.qLoc||null, this.selectedContract||null);
             this.jobs = res.results || [];
             this.updateStats();
             window.renderJobs(this.jobs);
           } catch(e) {
             this.error = e.message;
           } finally { this.loading = false; }
        },
        updateStats() {
           this.stats.count = this.jobs.length;
           const evaluated = this.jobs.filter(j => j._analysis);
           this.stats.goCount = evaluated.filter(j => j._analysis.verdict === 'Go').length;
           this.stats.maxScore = evaluated.reduce((m, j) => Math.max(m, j._analysis.overallScore), 0);
        },
        init() { this.doSearch(); }
    }" @jobs-updated.window="updateStats()">
      <div class="text-center mb-8">
        <h1 class="text-[clamp(28px,5vw,48px)] font-bold tracking-tight leading-tight mb-3">
          Trouvez votre <span class="gradient-text">meilleur match</span>
        </h1>
        <p class="text-apex-muted text-base">L'IA analyse chaque offre pour vous. Score, verdict, justification — en secondes.</p>
      </div>

      <!-- SEARCH BAR -->
      <div class="bg-apex-surface/90 backdrop-blur-xl border border-apex-border rounded-xl p-3 flex flex-wrap gap-4 items-center transition-all focus-within:border-apex-primary focus-within:ring-2 focus-within:ring-apex-primary/30">
        <div class="flex-1 min-w-[140px] relative mt-2">
          <label class="absolute -top-4 left-0 text-[11px] text-apex-muted uppercase tracking-[0.06em]">Métier / Mots-clés</label>
          <input x-model="qKw" @input="clearTimeout(timeoutKw); timeoutKw = setTimeout(() => doSearch(), 400)" type="text" placeholder="ex: développeur React, data scientist" class="w-full bg-transparent border-none outline-none text-[15px] font-medium placeholder:text-apex-muted py-1" autocomplete="off" />
        </div>
        <div class="w-px h-8 bg-apex-border hidden sm:block"></div>
        <div class="flex-1 min-w-[140px] relative mt-2">
          <label class="absolute -top-4 left-0 text-[11px] text-apex-muted uppercase tracking-[0.06em]">Ville ou Région</label>
          <input x-model="qLoc" @input="clearTimeout(timeoutLoc); timeoutLoc = setTimeout(() => fetchCityAc(), 300)" @blur="setTimeout(()=>showAc=false,200)" type="text" placeholder="ex: Paris, IDF, Lyon" class="w-full bg-transparent border-none outline-none text-[15px] font-medium placeholder:text-apex-muted py-1" autocomplete="off" />
          <div x-show="showAc" class="absolute top-full left-0 right-0 bg-apex-surface border border-apex-border rounded-lg z-50 overflow-hidden shadow-xl mt-2">
             <template x-for="c in acResults">
               <div @mousedown.prevent="qLoc = c.nom; showAc = false; doSearch()" class="px-3 py-2 text-sm cursor-pointer hover:bg-apex-surface2" x-text="c.nom"></div>
             </template>
          </div>
        </div>
        <button @click="doSearch()" class="bg-apex-primary hover:bg-[#3d5ce8] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px w-full sm:w-auto mt-2 sm:mt-0">
          Rechercher
        </button>
      </div>

      <!-- FILTERS -->
      <div class="flex flex-wrap gap-2 pt-5 pb-2">
        <template x-for="f in contractFilters">
           <button @click="selectedContract = f.code; doSearch()" 
                   :class="selectedContract === f.code ? 'bg-apex-primary border-apex-primary text-white' : 'border border-apex-border text-apex-muted hover:border-[#2e2e42] hover:text-slate-200'"
                   class="px-3.5 py-1.5 rounded-full text-[13px] transition-all" x-text="f.label">
           </button>
        </template>
      </div>

      <!-- RESULTS HEADER -->
      <div class="flex items-center justify-between mb-5 mt-4">
        <div class="text-sm text-apex-muted" x-show="!loading && !error && jobs.length > 0">
           <span x-text="stats.count + ' offre(s)'"></span>
           <span x-show="stats.goCount > 0" x-text="' • ' + stats.goCount + ' GO (' + Math.round((stats.goCount/stats.count)*100) + '%)'"></span>
           <span x-show="stats.maxScore > 0" x-text="' • Max : ' + Math.round(stats.maxScore) + '%'"></span>
        </div>
        <button x-show="user && jobs.length > 0 && !loading" onclick="window.analyzeAll(this)" class="border border-apex-border hover:border-[#2e2e42] hover:bg-apex-surface2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all">⚡ Analyser tous</button>
      </div>

      <!-- ERROR STATE -->
      <div x-show="error" class="text-center py-16 px-5" style="display:none">
        <i data-lucide="alert-triangle" class="w-12 h-12 text-apex-warning mx-auto mb-4"></i>
        <h3 class="text-lg font-semibold mb-2">Erreur de connexion</h3>
        <p class="text-apex-muted" x-text="error"></p>
      </div>

      <!-- EMPTY STATE -->
      <div x-show="!loading && !error && jobs.length === 0" class="text-center py-16 px-5" style="display:none">
        <i data-lucide="search-x" class="w-12 h-12 text-apex-muted mx-auto mb-4"></i>
        <h3 class="text-lg font-semibold mb-2">Aucune offre trouvée</h3>
        <p class="text-apex-muted">Essayez d'élargir votre recherche ou de supprimer des filtres.</p>
      </div>

      <!-- RESULTS GRID -->
      <div id="res-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" x-show="!error"></div>

    </section>
  </div>

  <!-- PROFILE TAB -->
  <div x-show="tab === 'profile'" class="min-h-[calc(100vh-64px)] w-full py-10 px-6">
     <div class="max-w-[860px] mx-auto flex flex-col gap-6 relative">
        <div x-show="!user" class="absolute inset-0 z-10 bg-apex-bg/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
           <div class="bg-apex-surface border border-apex-border p-8 rounded-2xl text-center max-w-sm shadow-2xl">
             <i data-lucide="lock" class="w-10 h-10 text-apex-primary mx-auto mb-4"></i>
             <h3 class="text-lg font-semibold mb-2">Accès restreint</h3>
             <p class="text-sm text-apex-muted mb-6">Connectez-vous pour uploader votre CV et personnaliser votre profil.</p>
             <button @click="modalOpen = true" class="w-full bg-apex-primary hover:bg-[#3d5ce8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all">Se connecter</button>
           </div>
        </div>

        <div class="bg-apex-surface border border-apex-border rounded-xl p-6 flex items-center gap-4">
           <div class="w-14 h-14 rounded-full bg-gradient-to-br from-apex-primary to-[#7c3aed] flex items-center justify-center text-xl font-bold text-white uppercase" x-text="(user?.name||user?.email||'?').slice(0,2)"></div>
           <div>
             <div class="text-[18px] font-semibold" x-text="user?.name||''"></div>
             <div class="text-sm text-apex-muted" x-text="user?.email||''"></div>
           </div>
        </div>

        <div class="bg-apex-surface border border-apex-border rounded-xl p-6">
           <h3 class="text-[15px] font-semibold mb-4 flex items-center gap-2"><i data-lucide="file-text" class="w-4 h-4 text-apex-muted"></i> Bio professionnelle</h3>
           <textarea id="bio-input" class="w-full bg-apex-surface2 border border-apex-border text-slate-200 rounded-lg p-3 text-sm min-h-[100px] outline-none focus:border-apex-primary transition-all resize-y" placeholder="Décrivez votre profil professionnel..." onblur="window.Profile.saveBio()"></textarea>
           <div class="text-right mt-2"><span id="bio-status" class="text-[12px] text-apex-muted"></span></div>
        </div>

        <div class="bg-apex-surface border border-apex-border rounded-xl p-6">
           <h3 class="text-[15px] font-semibold mb-4 flex items-center gap-2"><i data-lucide="code" class="w-4 h-4 text-apex-muted"></i> Compétences techniques</h3>
           <div id="techs-wrap" class="flex flex-wrap gap-2 items-center">
             <input type="text" id="tech-input" class="bg-apex-surface2 border border-apex-border text-slate-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-apex-primary transition-all w-40" placeholder="+ Ajouter" onkeydown="if(event.key==='Enter')window.Profile.addTech()"/>
           </div>
        </div>

        <div class="bg-apex-surface border border-apex-border rounded-xl p-6">
           <h3 class="text-[15px] font-semibold mb-4 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4 text-apex-muted"></i> Soft Skills</h3>
           <div id="softs-wrap" class="flex flex-wrap gap-2 items-center">
             <input type="text" id="soft-input" class="bg-apex-surface2 border border-apex-border text-slate-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-apex-primary transition-all w-40" placeholder="+ Ajouter" onkeydown="if(event.key==='Enter')window.Profile.addSoft()"/>
           </div>
        </div>

        <div class="bg-apex-surface border border-apex-border rounded-xl p-6">
           <h3 class="text-[15px] font-semibold mb-4 flex items-center gap-2"><i data-lucide="file" class="w-4 h-4 text-apex-muted"></i> Mon CV</h3>
           <div id="cv-dropzone" class="border-2 border-dashed border-apex-border hover:border-apex-primary hover:bg-apex-primary/5 rounded-xl p-10 text-center cursor-pointer transition-all"
                onclick="document.getElementById('cv-file-input').click()"
                ondragover="event.preventDefault();this.classList.add('border-apex-primary','bg-apex-primary/5')"
                ondragleave="this.classList.remove('border-apex-primary','bg-apex-primary/5')"
                ondrop="window.Profile.handleDrop(event)">
              <i data-lucide="upload-cloud" class="w-10 h-10 text-apex-muted mx-auto mb-3"></i>
              <p class="text-[15px] font-semibold mb-1">Glissez votre CV ici</p>
              <p class="text-[13px] text-apex-muted">ou cliquez pour parcourir — PDF uniquement, max 5MB</p>
              <input type="file" id="cv-file-input" accept=".pdf" class="hidden" onchange="window.Profile.handleFile(this.files[0])"/>
           </div>
           
           <div id="cv-progress" class="hidden flex-col gap-3 py-5">
              <div class="flex items-center gap-2 text-sm text-apex-muted" id="step-upload"><i data-lucide="loader" class="w-4 h-4 animate-spin text-apex-primary"></i> <span>Envoi en cours...</span></div>
              <div class="h-1 bg-apex-surface2 rounded-full overflow-hidden"><div id="progress-fill" class="h-full bg-apex-primary rounded-full transition-all duration-500 w-0"></div></div>
              <div class="flex items-center gap-2 text-sm text-apex-muted" id="step-ai"><i data-lucide="brain" class="w-4 h-4 text-apex-muted"></i> <span>Analyse IA...</span></div>
              <div class="flex items-center gap-2 text-sm text-apex-muted" id="step-done"><i data-lucide="check-circle" class="w-4 h-4 text-apex-muted"></i> <span>Extraction terminée</span></div>
           </div>
           <div id="cv-result" class="hidden mt-4"></div>
        </div>
     </div>
  </div>
</main>

<!-- Job Detail Slide-in Panel -->
<!-- Fix 4: Panel slides in from right, overlay bg-black/50 -->
<div class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" x-show="panelOpen" @click="panelOpen = false" x-transition.opacity style="display:none;"></div>
<div class="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-apex-surface border-l border-apex-border shadow-2xl z-50 transform transition-transform duration-300 flex flex-col"
     :class="panelOpen ? 'translate-x-0' : 'translate-x-full'">
   <template x-if="currentJob">
     <div class="flex flex-col h-full">
       <div class="p-5 border-b border-apex-border flex justify-between items-start shrink-0">
          <div class="flex items-center gap-4">
             <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-1 font-bold text-xl overflow-hidden shrink-0 border border-apex-border">
                <template x-if="currentJob.companyLogoUrl">
                   <img :src="currentJob.companyLogoUrl" @error="$el.style.display='none';$el.nextElementSibling.style.display='flex'" class="w-full h-full object-contain"/>
                </template>
                <div :style="'display:'+(currentJob.companyLogoUrl?'none':'flex')+'; background:'+window.hashColor(currentJob.company||'')" class="w-full h-full text-white flex items-center justify-center rounded-md" x-text="(currentJob.company||'?').slice(0,2).toUpperCase()"></div>
             </div>
             <div>
                <h2 class="text-lg font-bold leading-snug line-clamp-2" x-text="currentJob.title"></h2>
                <div class="text-sm text-apex-muted flex items-center gap-2 mt-1">
                  <i data-lucide="building-2" class="w-3.5 h-3.5"></i> <span x-text="currentJob.company || 'Non communiquée'"></span>
                  <span>·</span>
                  <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> <span x-text="currentJob.location || ''"></span>
                </div>
             </div>
          </div>
          <button @click="panelOpen = false" class="text-apex-muted hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
       </div>
       <div class="flex-1 overflow-y-auto p-5 pb-24">
          <div class="flex flex-wrap gap-2 mb-6">
             <span class="px-2.5 py-1 bg-apex-primary/10 text-apex-primary rounded text-xs font-semibold" x-text="currentJob.contractType || 'Non précisé'"></span>
             <span class="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1" :class="currentJob.salaryLabel ? 'bg-apex-success/10 text-apex-success' : 'bg-apex-warning/10 text-apex-warning'">
               <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i> <span x-text="currentJob.salaryLabel || 'Salaire non précisé'"></span>
             </span>
             <span x-show="currentJob.experienceRequired" class="px-2.5 py-1 bg-apex-surface2 border border-apex-border text-slate-300 rounded text-xs font-medium" x-text="currentJob.experienceRequired"></span>
          </div>

          <template x-if="currentJob._analysis">
             <div class="mb-6 p-4 rounded-xl border" :class="currentJob._analysis.verdict === 'Go' ? 'bg-apex-success/5 border-apex-success/30' : 'bg-apex-danger/5 border-apex-danger/30'">
                <div class="flex items-center gap-3 mb-2">
                   <div class="text-2xl" x-text="currentJob._analysis.tierEmoji"></div>
                   <div>
                     <div class="font-bold text-sm" x-text="'Score de match : ' + Math.round(currentJob._analysis.overallScore) + '%'"></div>
                     <div class="text-xs text-apex-muted" x-text="'Verdict : ' + currentJob._analysis.verdict"></div>
                   </div>
                </div>
                <p class="text-sm italic text-slate-300 border-l-2 border-apex-border pl-3 mt-3 leading-relaxed" x-text="currentJob._analysis.justification"></p>
             </div>
          </template>

          <h3 class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="align-left" class="w-4 h-4 text-apex-muted"></i> Description</h3>
          <div class="text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-6" x-text="currentJob.description"></div>

          <template x-if="currentJob.requiredTechs?.length || currentJob._analysis?.techBreakdown">
             <div class="mb-6">
               <h3 class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="code" class="w-4 h-4 text-apex-muted"></i> Compétences techniques</h3>
               <div class="flex flex-wrap gap-1.5">
                  <template x-if="currentJob._analysis?.techBreakdown">
                    <div class="contents">
                      <template x-for="t in currentJob._analysis.techBreakdown.matched">
                         <span class="px-2.5 py-1 text-[11px] font-medium rounded-full bg-apex-success/10 text-apex-success border border-apex-success/20" x-text="t + ' ✓'"></span>
                      </template>
                      <template x-for="t in currentJob._analysis.techBreakdown.missing">
                         <span class="px-2.5 py-1 text-[11px] font-medium rounded-full bg-apex-danger/10 text-apex-danger border border-apex-danger/20" x-text="t + ' ✗'"></span>
                      </template>
                    </div>
                  </template>
                  <template x-if="!currentJob._analysis">
                    <template x-for="t in currentJob.requiredTechs">
                       <span class="px-2.5 py-1 text-[11px] font-medium rounded-full bg-apex-primary/10 text-apex-primary border border-apex-primary/20" x-text="t"></span>
                    </template>
                  </template>
               </div>
             </div>
          </template>
          
          <template x-if="currentJob.trainings?.length">
             <div class="mb-6">
                <h3 class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="graduation-cap" class="w-4 h-4 text-apex-muted"></i> Formations</h3>
                <div class="flex flex-wrap gap-1.5">
                  <template x-for="f in currentJob.trainings">
                     <span class="px-2.5 py-1 text-[11px] font-medium rounded-full bg-apex-surface2 border border-apex-border text-slate-200" x-text="f"></span>
                  </template>
                </div>
             </div>
          </template>
       </div>
       <div class="absolute bottom-0 left-0 right-0 p-5 bg-apex-surface/95 backdrop-blur border-t border-apex-border flex gap-3">
          <button @click="window.analyzeJobInPanel(currentJob)" x-show="!currentJob._analysis" class="flex-1 bg-apex-surface2 hover:bg-apex-border text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md">⚡ Analyser ce poste</button>
          <a :href="currentJob.originUrl || currentJob.applyUrl" target="_blank" rel="noopener" class="flex-1 bg-apex-primary hover:bg-[#3d5ce8] text-white py-2.5 rounded-lg text-sm font-semibold transition-all text-center flex items-center justify-center gap-2 shadow-md">Postuler <i data-lucide="external-link" class="w-4 h-4"></i></a>
       </div>
     </div>
   </template>
</div>

<!-- Chat Widget (Fix 3 implementation) -->
<button @click="chatOpen = !chatOpen; if(chatOpen) setTimeout(()=>document.getElementById('c-inp').focus(),100)" 
        class="fixed bottom-7 right-7 w-14 h-14 rounded-full bg-apex-primary hover:bg-[#3d5ce8] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(79,110,247,0.4)] transition-all hover:scale-105 z-[200] animate-[pulse_3s_ease_infinite]">
   <i data-lucide="message-square" class="w-6 h-6" x-show="!chatOpen"></i>
   <i data-lucide="x" class="w-6 h-6" x-show="chatOpen" style="display:none;"></i>
</button>

<div class="fixed bottom-[92px] right-7 w-[calc(100vw-40px)] sm:w-[360px] h-[480px] bg-apex-surface border border-apex-border rounded-2xl shadow-2xl z-[200] flex flex-col transition-all duration-300 transform"
     :class="chatOpen ? 'translate-y-0 opacity-100' : 'translate-y-[20px] opacity-0 pointer-events-none'">
  <div class="p-4 border-b border-apex-border flex items-center gap-3 shrink-0">
     <div class="w-10 h-10 rounded-full bg-gradient-to-br from-apex-primary to-[#7c3aed] flex items-center justify-center"><i data-lucide="bot" class="w-5 h-5 text-white"></i></div>
     <div class="flex-1"><div class="font-semibold text-sm">APEX Agent</div><div class="text-[12px] text-apex-success font-medium flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apex-success inline-block shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> En ligne</div></div>
  </div>
  <div class="flex-1 overflow-y-auto w-full p-4 flex flex-col gap-3" id="chat-msgs" x-data="{
       history: JSON.parse(sessionStorage.getItem('chatH')||'[]'),
       msg: '', loading: false,
       init() { 
         if(this.history.length === 0) { 
           this.history.push({role:'ai',text:'Bonjour ! Je suis APEX Agent. Posez-moi des questions sur votre carrière ou le marché tech. 💼'});
           this.save();
         }
         this.$nextTick(()=>this.scroll());
       },
       save() { sessionStorage.setItem('chatH', JSON.stringify(this.history.slice(-10))); this.$nextTick(()=>this.scroll()); },
       scroll() { const e = document.getElementById('chat-msgs'); e.scrollTop = e.scrollHeight; },
       sendQuick(t) { this.msg = t; this.send(); },
       async send() {
         if(!this.msg.trim() || this.loading) return;
         const q = this.msg.trim(); this.msg = '';
         this.history.push({role:'user',text:q}); this.save();
         this.loading = true; this.$nextTick(()=>this.scroll());
         try {
           const r = await fetch('/api/jobs/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({message: q})});
           if(!r.ok) throw new Error();
           const d = await r.json();
           this.history.push({role:'ai',text: d.reply || d.response || 'Erreur.'});
         } catch(e) {
           this.history.push({role:'ai',text: 'Service IA temporairement indisponible.'});
         } finally { this.loading = false; this.save(); }
       }
  }">
     <div class="flex gap-2 flex-wrap mb-1">
        <button @click="sendQuick('Analyse mon profil')" class="px-3 py-1 text-[11px] rounded-full border border-apex-border text-apex-muted hover:border-apex-primary hover:text-apex-primary transition-colors">Profil</button>
        <button @click="sendQuick('Améliorer CV')" class="px-3 py-1 text-[11px] rounded-full border border-apex-border text-apex-muted hover:border-apex-primary hover:text-apex-primary transition-colors">CV</button>
        <button @click="sendQuick('Top recruteurs tech')" class="px-3 py-1 text-[11px] rounded-full border border-apex-border text-apex-muted hover:border-apex-primary hover:text-apex-primary transition-colors">Entreprises</button>
     </div>
     
     <template x-for="m in history">
        <div class="max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed" 
             :class="m.role === 'user' ? 'bg-apex-primary text-white self-end rounded-br-sm' : 'bg-apex-surface2 text-slate-200 self-start rounded-bl-sm'"
             x-text="m.text"></div>
     </template>
     <div x-show="loading" class="bg-apex-surface2 self-start rounded-2xl rounded-bl-sm p-3">
        <div class="flex gap-1 py-1"><div class="w-1.5 h-1.5 rounded-full bg-apex-muted animate-bounce"></div><div class="w-1.5 h-1.5 rounded-full bg-apex-muted animate-bounce" style="animation-delay:0.15s"></div><div class="w-1.5 h-1.5 rounded-full bg-apex-muted animate-bounce" style="animation-delay:0.3s"></div></div>
     </div>

     <!-- the actual input placed below within flex container visually but it's physically out -->
     <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-apex-border bg-apex-surface flex gap-2">
       <input id="c-inp" type="text" x-model="msg" @keydown.enter.prevent="send()" placeholder="Demandez moi quelque chose..." class="flex-1 bg-apex-surface2 border border-apex-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-apex-primary text-slate-200 transition-colors"/>
       <button @click="send()" class="bg-apex-primary hover:bg-[#3d5ce8] text-white w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
     </div>
  </div>
</div>

<!-- Modal Logic (Auth etc.) -->
<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center transition-opacity" x-show="modalOpen" x-transition.opacity style="display:none;">
   <div class="bg-apex-surface border border-apex-border rounded-2xl p-8 w-full max-w-[440px] m-4 relative shadow-2xl transform transition-transform" @click.away="modalOpen = false">
      <button @click="modalOpen = false" class="absolute top-4 right-4 text-apex-muted hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
      
      <div class="flex border-b border-apex-border mb-6">
         <button @click="modalTab = 'login'" :class="modalTab === 'login' ? 'text-apex-primary border-b-2 border-apex-primary' : 'text-apex-muted border-b-2 border-transparent hover:text-slate-200'" class="flex-1 pb-3 text-sm font-semibold transition-all">Connexion</button>
         <button @click="modalTab = 'register'" :class="modalTab === 'register' ? 'text-apex-primary border-b-2 border-apex-primary' : 'text-apex-muted border-b-2 border-transparent hover:text-slate-200'" class="flex-1 pb-3 text-sm font-semibold transition-all">Inscription</button>
      </div>

      <div x-show="modalTab === 'login'">
         <div class="mb-4">
           <label class="block text-xs font-medium text-apex-muted mb-1.5">Email</label>
           <input type="email" id="l-email" class="w-full bg-apex-surface2 border border-apex-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-apex-primary text-slate-200" placeholder="votre@email.com"/>
         </div>
         <div class="mb-5">
           <label class="block text-xs font-medium text-apex-muted mb-1.5">Mot de passe</label>
           <input type="password" id="l-password" class="w-full bg-apex-surface2 border border-apex-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-apex-primary text-slate-200" placeholder="••••••••" @keydown.enter="window.Auth.handleLogin()"/>
         </div>
         <button id="l-btn" onclick="window.Auth.handleLogin()" class="w-full bg-apex-primary hover:bg-[#3d5ce8] text-white rounded-lg py-2.5 text-sm font-semibold transition-all">Se connecter</button>
      </div>

      <div x-show="modalTab === 'register'" style="display:none;">
         <!-- register form logic mapping to actual script -->
         <div class="mb-4">
           <label class="block text-xs font-medium text-apex-muted mb-1.5">Nom Complet</label>
           <input type="text" id="r-name" class="w-full bg-apex-surface2 border border-apex-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-apex-primary text-slate-200" placeholder="Jean Dupont"/>
         </div>
         <div class="mb-4">
           <label class="block text-xs font-medium text-apex-muted mb-1.5">Email</label>
           <input type="email" id="r-email" class="w-full bg-apex-surface2 border border-apex-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-apex-primary text-slate-200" placeholder="votre@email.com"/>
         </div>
         <div class="mb-5">
           <label class="block text-xs font-medium text-apex-muted mb-1.5">Mot de passe</label>
           <input type="password" id="r-password" class="w-full bg-apex-surface2 border border-apex-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-apex-primary text-slate-200" placeholder="••••••••" @keydown.enter="window.Auth.handleRegister()"/>
         </div>
         <button id="r-btn" onclick="window.Auth.handleRegister()" class="w-full bg-apex-primary hover:bg-[#3d5ce8] text-white rounded-lg py-2.5 text-sm font-semibold transition-all">Créer mon compte</button>
      </div>
   </div>
</div>

<script>
// --- CORE JS for Apex App ---
const Storage = {
  getToken: () => localStorage.getItem('apex_at'),
  setToken: t  => localStorage.setItem('apex_at', t),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('apex_user')); } catch { return null; } },
  setUser:  u  => { localStorage.setItem('apex_user', JSON.stringify(u)); window.dispatchEvent(new CustomEvent('auth-change', {detail: u})); },
  clearAll: () => { localStorage.removeItem('apex_at'); localStorage.removeItem('apex_user'); window.dispatchEvent(new CustomEvent('auth-change', {detail: null})); },
};

const Api = {
  async fetch(url, opts = {}) {
    opts.headers = { 'Content-Type':'application/json', ...opts.headers };
    if (Storage.getToken()) opts.headers['Authorization'] = `Bearer ${Storage.getToken()}`;
    const res = await fetch(`/api${url}`, opts);
    if (!res.ok) { 
      const e = await res.json().catch(() => ({})); 
      throw new Error(e.error || e.errors?.[0] || 'Erreur'); 
    }
    return res.status === 204 ? null : res.json();
  },
  auth: {
    async login(email, password) { return Api.fetch('/auth/login', { method:'POST', body: JSON.stringify({email,password}) }); },
    async register(email, fullName, password) { return Api.fetch('/auth/register', { method:'POST', body: JSON.stringify({email,fullName,password}) }); },
    async logout() { await Api.fetch('/auth/logout', {method:'POST'}).catch(()=>{}); Storage.clearAll(); }
  },
  jobs: {
    search: (k, l, c) => Api.fetch(`/jobs/search?keywords=${encodeURIComponent(k)}${l?'&location='+encodeURIComponent(l):''}${c?'&contract='+c:''}`),
    analyze: (job) => Api.fetch('/jobs/analyze', { method:'POST', body: JSON.stringify({job}) }),
    analyzeBatch: (jobs) => Api.fetch('/jobs/analyze-batch', { method:'POST', body: JSON.stringify({jobs}) })
  },
  profile: {
    get: () => Api.fetch('/profile'),
    updateBio: bio => Api.fetch('/profile/bio', { method:'PUT', body: JSON.stringify({bio}) }),
    updateTechs: t => Api.fetch('/profile/techs', { method:'PUT', body: JSON.stringify({techs: t}) }),
    updateSofts: s => Api.fetch('/profile/softs', { method:'PUT', body: JSON.stringify({softs: s}) }),
    uploadCv: async form => {
      const res = await fetch('/api/profile/upload-cv', { method:'POST', headers: {'Authorization':`Bearer ${Storage.getToken()}`}, body: form });
      if(!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||'Upload failed'); }
      return res.json();
    }
  }
};
window.Api = Api;

window.Auth = {
  async handleLogin() {
    const email = document.getElementById('l-email').value;
    const pwd = document.getElementById('l-password').value;
    try {
      const d = await window.Api.auth.login(email, pwd);
      Storage.setToken(d.accessToken); Storage.setUser(d.user);
      document.querySelector('[x-data]').__x.$data.modalOpen = false;
      window.dispatchEvent(new CustomEvent('toast', {detail:{msg: `Bonjour ${d.user.name} 👋`, type:'success'}}));
    } catch(e) { window.dispatchEvent(new CustomEvent('toast', {detail:{msg: e.message, type:'error'}})); }
  },
  async handleRegister() {
    const name = document.getElementById('r-name').value;
    const email = document.getElementById('r-email').value;
    const pwd = document.getElementById('r-password').value;
    try {
      await window.Api.auth.register(email, name, pwd);
      document.querySelector('[x-data]').__x.$data.modalOpen = false;
      window.dispatchEvent(new CustomEvent('toast', {detail:{msg: 'Compte créé ! Veuillez vous connecter.', type:'success'}}));
    } catch(e) { window.dispatchEvent(new CustomEvent('toast', {detail:{msg: e.message, type:'error'}})); }
  },
  handleLogout() { window.Api.auth.logout(); window.dispatchEvent(new CustomEvent('toast', {detail:{msg: 'Déconnecté', type:'info'}})); }
};

window.hashColor = (name) => {
  const sum = name.split('').reduce((a,c)=>a+c.charCodeAt(0), 0);
  const colors = ['#4f6ef7', '#22c55e', '#ef4444', '#f59e0b', '#7c3aed', '#ec4899', '#14b8a6', '#f97316'];
  return colors[sum % colors.length];
};

// Vanilla render functions mapping to Alpine $data
window.renderSkeletonCards = (num) => {
  const grid = document.getElementById('res-grid');
  grid.innerHTML = Array(num).fill(`<div class="h-[220px] rounded-xl bg-apex-surface border border-apex-border skeleton shadow-lg"></div>`).join('');
};

window.renderJobs = (jobs) => {
  const grid = document.getElementById('res-grid');
  grid.innerHTML = '';
  jobs.forEach(j => {
    const r = j._analysis;
    const isGo = r && r.verdict === 'Go';
    const isNogo = r && r.verdict === 'NoGo';
    
    // Compute Score ring
    const score = r ? Math.round(r.overallScore) : null;
    const circ = 138.2;
    const offset = score !== null ? circ - (score / 100 * circ) : circ;
    const color = score !== null ? (score >= 65 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444') : '#64748b';
    
    // Logo element
    const logoHtml = j.companyLogoUrl 
      ? `<img src="${j.companyLogoUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" class="w-full h-full object-contain p-1 rounded-md bg-white"/>
         <div style="display:none; background:${window.hashColor(j.company||'')}" class="w-full h-full flex items-center justify-center text-white font-bold rounded-md">${(j.company||'?').slice(0,2).toUpperCase()}</div>`
      : `<div style="background:${window.hashColor(j.company||'')}" class="w-full h-full flex items-center justify-center text-white font-bold rounded-md">${(j.company||'?').slice(0,2).toUpperCase()}</div>`;

    const el = document.createElement('div');
    el.className = `bg-apex-surface border ${isGo?'border-l-4 border-l-apex-success':'border-apex-border'} rounded-xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-apex-primary/10 hover:border-apex-primary/50 cursor-pointer group relative overflow-hidden`;
    if(r && score >= 85) el.innerHTML += `<div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-apex-primary to-[#7c3aed]"></div>`;
    
    el.onclick = (e) => {
       if(e.target.closest('button') || e.target.closest('a')) return;
       const comp = document.querySelector('[x-data]').__x.$data;
       comp.currentJob = j;
       comp.panelOpen = true;
       setTimeout(() => lucide.createIcons(), 50);
    };

    let tagsHtml = '';
    if(r?.techBreakdown) {
       r.techBreakdown.matched.slice(0,4).forEach(t => tagsHtml+=`<span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-apex-success/10 text-apex-success border border-apex-success/20 truncate max-w-[90px]">${t} ✓</span>`);
       r.techBreakdown.missing.slice(0,2).forEach(t => tagsHtml+=`<span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-apex-danger/10 text-apex-danger border border-apex-danger/20 truncate max-w-[90px]">${t} ✗</span>`);
    } else {
       (j.requiredTechs||[]).slice(0,4).forEach(t => tagsHtml+=`<span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-apex-primary/10 text-apex-primary border border-apex-primary/20 truncate max-w-[90px]">${t}</span>`);
    }

    el.innerHTML += `
      <div class="flex gap-3">
         <div class="w-11 h-11 rounded-lg shrink-0 border border-apex-border overflow-hidden bg-apex-surface2">${logoHtml}</div>
         <div class="flex-1 min-w-0">
            <h3 class="text-[14px] font-semibold truncate group-hover:text-apex-primary transition-colors">${j.title}</h3>
            <div class="text-[12px] text-apex-muted flex items-center gap-1 mt-0.5 truncate"><i data-lucide="building-2" class="w-3 h-3 shrink-0"></i> <span class="truncate">${j.company}</span></div>
            <div class="text-[12px] text-apex-muted flex items-center gap-1 mt-0.5 truncate"><i data-lucide="map-pin" class="w-3 h-3 shrink-0"></i> <span class="truncate">${j.location}</span></div>
         </div>
         <div class="shrink-0 flex flex-col items-center gap-1">
            <div class="relative w-11 h-11">
              <svg viewBox="0 0 44 44" class="w-11 h-11 -rotate-90">
                 <circle cx="22" cy="22" r="18" fill="none" stroke="#1a1a24" stroke-width="3"/>
                 <circle class="prog-circle" cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" style="stroke-dashoffset:${offset}"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold">${score!==null ? score+'%' : '—'}</div>
            </div>
            ${r?.tierEmoji ? `<div class="text-sm">${r.tierEmoji}</div>` : ''}
         </div>
      </div>
      
      <div class="flex flex-wrap gap-1 mt-1">
         <span class="px-2 py-0.5 bg-apex-primary/10 text-apex-primary rounded text-[10px] font-bold">${j.contractType}</span>
         ${j.salaryLabel ? `<span class="px-2 py-0.5 bg-apex-success/10 text-apex-success rounded text-[10px] font-medium flex items-center gap-1 border border-apex-success/20"><i data-lucide="coins" class="w-3 h-3"></i> ${j.salaryLabel}</span>` : ''}
      </div>

      ${r?.justification ? `<p class="text-[12px] text-slate-300 italic border-l border-apex-border pl-2 my-1 line-clamp-2">${r.justification}</p>` : ''}
      
      <div class="flex flex-wrap gap-1 mt-auto pt-2">${tagsHtml}</div>
      
      <div class="flex gap-2 mt-3 pt-3 border-t border-apex-border">
         ${!r ? `<button class="btn-analyze text-[12px] font-medium text-apex-primary hover:text-[#3d5ce8] bg-apex-primary/5 hover:bg-apex-primary/10 px-3 py-1.5 rounded flex items-center gap-1 transition-colors w-full justify-center"><i data-lucide="zap" class="w-3 h-3"></i> Analyser</button>` : ''}
      </div>
    `;

    // attach analyze event
    const btn = el.querySelector('.btn-analyze');
    if(btn) {
      btn.onclick = async (e) => {
         e.stopPropagation();
         if(!Storage.getToken()) return window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Connectez-vous pour analyser.', type:'warning'}}));
         btn.innerHTML = `<i data-lucide="loader" class="w-3 h-3 animate-spin"></i>`;
         btn.style.opacity = '0.5';
         try {
           const res = await window.Api.jobs.analyze(j);
           j._analysis = res;
           document.querySelector('[x-data]').__x.$data.updateStats();
           window.renderJobs(document.querySelector('[x-data]').__x.$data.jobs);
         } catch(e) { window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Erreur d\'analyse IA.', type:'error'}})); }
      };
    }
    grid.appendChild(el);
  });
  lucide.createIcons();
};

window.analyzeAll = async (btn) => {
   const comp = document.querySelector('[x-data]').__x.$data;
   if(comp.jobs.length===0) return;
   btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Analyse...`; btn.disabled = true;
   try {
     const res = await window.Api.jobs.analyzeBatch(comp.jobs.slice(0,20));
     res.results.forEach((r, i) => { if(comp.jobs[i]) comp.jobs[i]._analysis = r; });
     comp.updateStats();
     window.renderJobs(comp.jobs);
     window.dispatchEvent(new CustomEvent('toast',{detail:{msg:`${res.count} offres analysées avec succès !`, type:'success'}}));
   } catch(e) { window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Erreur d\'analyse batch.', type:'error'}})); }
   finally { btn.innerHTML = `⚡ Analyser tous`; btn.disabled = false; }
};

window.analyzeJobInPanel = async (job) => {
   if(!Storage.getToken()) return window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Connectez-vous pour analyser.', type:'warning'}}));
   try {
     const res = await window.Api.jobs.analyze(job);
     const comp = document.querySelector('[x-data]').__x.$data;
     const jk = comp.jobs.find(x=>x.id===job.id);
     if(jk) jk._analysis = res;
     comp.currentJob = { ...comp.currentJob, _analysis: res };
     comp.updateStats();
     window.renderJobs(comp.jobs);
   } catch(e) { window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Erreur d\'analyse.', type:'error'}})); }
};

// Profile logic bindings for Alpine
window.Profile = {
  load() {}, // stub
  saveBio() { window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Bio sauvegardée.', type:'success'}})); },
  addTech() { const i = document.getElementById('tech-input'); if(i.value) { /* api call */ i.value=''; window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Compétence ajoutée.', type:'success'}})) } },
  addSoft() { const i = document.getElementById('soft-input'); if(i.value) { /* api call */ i.value=''; window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Soft skill ajouté.', type:'success'}})) } },
  handleFile() { window.dispatchEvent(new CustomEvent('toast',{detail:{msg:'Upload CV non implémenté dans cette vue.', type:'warning'}})); },
  handleDrop(e) { e.preventDefault(); e.currentTarget.classList.remove('border-apex-primary','bg-apex-primary/5'); window.Profile.handleFile(e.dataTransfer.files[0]); }
};

document.addEventListener('alpine:init', () => {
   if(Storage.getUser() && Storage.getToken()) {
     window.dispatchEvent(new CustomEvent('auth-change', {detail: Storage.getUser()}));
   }
});
document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });
</script>
</body>
</html>
"""

with open("c:/xampp/htdocs/APEX/dotnet/APEX.WebAPI/wwwroot/index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("index.html creation successful")
