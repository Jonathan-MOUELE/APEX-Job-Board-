/**
 * APEX — swipe-page.js
 * Standalone high-performance swipe interface
 */
'use strict';

// ── POOL DE VIDÉOS PAR SECTEUR (sans remise, Fisher-Yates) ─────────────────────────
// Placez vos vidéos dans /videos/ ou utilisez des URLs Pexels HD (format MP4 direct)
const VIDEO_POOLS = {
    // ─ IT / Développement ──────────────────────────────────────────────────
    it: [
        // Coverr — gratuit, pas de compte
        'https://coverr.co/videos/typing-on-a-laptop--7oNX6sLJp/download',
        'https://coverr.co/videos/a-coder-types-on-a-computer/download',
        // Pexels MP4 direct — chercher sur pexels.com/videos/ : coding, developer
        // Remplacez ces URLs par les liens "Download Free Video" (bouton HD) de Pexels
        // Ex: 'https://videos.pexels.com/video-files/XXXXX/XXXXX-hd_1920_1080_25fps.mp4'
        // Pixabay (no-auth)
        'https://cdn.pixabay.com/video/2022/08/17/128183-740860699_large.mp4', // code écran
    ],
    // ─ Générique professionnel ───────────────────────────────────────────
    general: [
        'https://cdn.pixabay.com/video/2020/04/03/35025-405715685_large.mp4', // bureau
        'https://cdn.pixabay.com/video/2020/09/03/49289-456906888_large.mp4', // réunion
        // Ajoutez vos vidéos ici : 'videos/mon-fichier.mp4'
    ],
};

// Fisher-Yates shuffle (in-place)
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Géreur de pool sans remise par secteur
const VideoQueue = {
    queues: {},
    get(sector) {
        const pool = VIDEO_POOLS[sector] || VIDEO_POOLS.general;
        if (!pool.length) return null;
        if (!this.queues[sector] || this.queues[sector].length === 0) {
            // Re-remplir et shuffler
            this.queues[sector] = shuffleArray([...pool]);
        }
        return this.queues[sector].pop();
    }
};

// Détecte le secteur pour le pool vidéo
function getSectorKey(title) {
    const t = (title || '').toLowerCase();
    if (/développeur|developer|informatique|syst[eè]me|réseau|devops|cloud|data|ia|web|front|back|full.?stack|php|java|python|react|node|sql/.test(t)) return 'it';
    return 'general';
}

class SwipeStandalone {
    constructor() {
        // Support both old id and new id
        this.container = document.getElementById('reel-viewport') || document.getElementById('swipe-container');
        this.jobs = [];
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
        this.query = new URLSearchParams(window.location.search).get('q') || 'développeur';
        this.location = '';       // champ ville
        this.currentFilter = '';   // compat legacy
        this.activeFilters = new Set(); // multi-select

        this.init();
        this.setupKeyboard();
    }



    async init() {
        await this.loadMore();
        this.setupInfiniteScroll();
        
        // Hide loader
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }, 800);
        }
    }

    async loadMore(reset = false) {
        if (this.loading || (!this.hasMore && !reset)) return;
        this.loading = true;

        if (reset) {
            this.container.innerHTML = '';
            this.jobs = [];
            this.page = 1;
            this.hasMore = true;
            this.initDots(0);
        }

        try {
            const params = new URLSearchParams({
                keyword: this.query,
                range: `${(this.page - 1) * 15}-${this.page * 15 - 1}`
            });
            if (this.location) params.set('location', this.location);
            // Multi-filtres : France Travail n'accepte qu'une valeur par appel,
            // on envoie le 1er filtre actif ; le reste est filtré côté client dans buildCard
            const af = [...this.activeFilters];
            if (af.length === 1) params.set('contract', af[0]);
            else if (af.length === 0 && this.currentFilter) params.set('contract', this.currentFilter);

            const res = await apiFetch(`/api/jobs/search?${params}`);
            if (!res.ok) throw new Error('API Error');

            const data = await res.json();
            const raw = Array.isArray(data) ? data : (data.resultats ?? data.results ?? []);

            if (raw.length === 0) {
                this.hasMore = false;
                if (this.jobs.length === 0) this.renderEmpty();
                return;
            }

            const processedJobs = await DataWorker.process(raw);
            this.jobs.push(...processedJobs);

            processedJobs.forEach((job, idx) => {
                const card = this.buildCard(job, this.jobs.length - processedJobs.length + idx);
                this.container.appendChild(card);
            });

            lucide.createIcons();
            this.initDots(Math.min(this.jobs.length, 8));
            this.page++;
        } catch (err) {
            console.error('Swipe Load Error:', err);
            if (this.jobs.length === 0) this.renderEmpty();
        } finally {
            this.loading = false;
        }
    }

    initDots(count) {
        const el = document.getElementById('progress-dots');
        if (!el) return;
        el.innerHTML = Array.from({ length: count }, (_, i) =>
            `<div class="progress-dot${i === 0 ? ' active' : ''}"></div>`
        ).join('');
    }


    setupInfiniteScroll() {
        window.createSentinel?.(this.container, () => this.loadMore(), '500px');
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                this.container.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
            }
        });
    }

    setupWheel() {
        let lastTime = 0;
        this.container.addEventListener('wheel', (e) => {
            const now = Date.now();
            if (now - lastTime < 500) return;
            if (Math.abs(e.deltaY) > 10) {
                e.preventDefault();
                this.container.scrollBy({ top: e.deltaY > 0 ? innerHeight : -innerHeight, behavior: 'smooth' });
                lastTime = now;
            }
        }, { passive: false });
    }

    // Removed legacy setupAutoHide (handled inline in HTML)

    async search() {
        const inp = document.getElementById('swipe-search-input');
        const cityInp = document.getElementById('swipe-city-input');
        if (!inp) return;
        this.query    = inp.value.trim() || 'développeur';
        this.location = cityInp ? cityInp.value.trim() : '';
        window.SwipeAutocomplete?.hide();
        await this.loadMore(true);
    }

    onSearchInput(value) {
        window.SwipeAutocomplete?.show(value);
    }

    selectSuggestion(text) {
        const inp = document.getElementById('swipe-search-input');
        if (inp) inp.value = text;
        window.SwipeAutocomplete?.hide();
        this.query = text;
        this.loadMore(true);
    }

    async setFilter(btn, filter) {
        if (!filter) {
            // "Toutes" → réinitialiser
            this.activeFilters.clear();
            this.currentFilter = '';
            document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');
        } else {
            // Toggle
            if (this.activeFilters.has(filter)) {
                this.activeFilters.delete(filter);
                if (btn) btn.classList.remove('active');
            } else {
                this.activeFilters.add(filter);
                if (btn) btn.classList.add('active');
            }
            // Désactiver "Toutes" dès qu'un filtre est actif
            const toutesBtn = document.querySelector('.chip[data-filter-all]');
            if (toutesBtn) toutesBtn.classList.toggle('active', this.activeFilters.size === 0);
            // Compat legacy
            this.currentFilter = this.activeFilters.size > 0 ? [...this.activeFilters][0] : '';
        }
        await this.loadMore(true);
    }



    buildCard(job, globalIdx) {
        const section = document.createElement('section');
        section.className = 'reel-unit' + (globalIdx === 0 ? ' active' : '');

        // ── Détection du secteur pour choisir une image pertinente ────────────
        const sectorImg = (function(title) {
            const t = (title || '').toLowerCase();

            // IT / Développement / Numérique
            if (/développeur|developer|informatique|syst[eè]me|réseau|devops|cloud|data|ia|intelligence artificielle|cyberse|web|front|back|full.?stack|php|java|python|react|angular|node|sql|linux|windows|serveur|infrastructure|télécom/.test(t)) {
                const itImgs = [
                    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80', // code sur écran
                    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=1200&q=80', // clavier + code
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80', // laptop code
                    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80', // écran code coloré
                    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80', // laptop dark code
                ];
                return itImgs[globalIdx % itImgs.length];
            }

            // Santé / Médical / Pharmacie
            if (/santé|médecin|infirmi|aide.?soignant|pharmacien|kisiné|kinesith|chirurgi|médical|paramédical|bloc|urgence|hôpital|clinique|soins|radiol|biolog|laborat/.test(t)) {
                const santeImgs = [
                    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1200&q=80', // personnel médical
                    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1200&q=80', // docteur bureau
                    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80', // infirmierère
                ];
                return santeImgs[globalIdx % santeImgs.length];
            }

            // Commerce / Vente / Retail
            if (/commercial|vendeur|vente|account.?manager|business.?developer|chargé.de.clientele|clientele|boutique|magasin|grande.?surface|retail|caissier|conseiller.?vente/.test(t)) {
                const commerceImgs = [
                    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80', // caisse boutique pro
                    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', // équipe bureau dynamique
                    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80', // réunion commerciale
                ];
                return commerceImgs[globalIdx % commerceImgs.length];
            }

            // Finance / Comptabilité / Audit
            if (/comptab|financ|audit|contrôleur|contrôle.de.gestion|tresorier|fiscal|bilan|expert.?comptable|analyste.financ|banque|assurance|credit/.test(t)) {
                const finImgs = [
                    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80', // calculatrice + documents
                    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80', // bureau analyse
                    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80', // graphiques écran (pro)
                ];
                return finImgs[globalIdx % finImgs.length];
            }

            // BTP / Construction / Architecture
            if (/bâtiment|btp|construction|maçon|électrici|plombier|charpenti|conducteur.de.travaux|métreur|génie.civil|architecte|rénovation/.test(t)) {
                const btpImgs = [
                    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80', // chantier construction
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80', // casque chantier
                ];
                return btpImgs[globalIdx % btpImgs.length];
            }

            // Transport / Logistique / Magasin
            if (/transport|logistique|chauffeur|livreur|cariste|magasini|prep.commande|supply.chain|entrepot|gestionnaire.stock/.test(t)) {
                const logImgs = [
                    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', // camion route
                    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80', // entrepot logistique
                ];
                return logImgs[globalIdx % logImgs.length];
            }

            // Restauration / Hôtellerie
            if (/restauration|cuisinier|serveur|chef|pâtissi|boulang|bar|hotel|hôtelier|réceptionniste|plongeur/.test(t)) {
                const restaImgs = [
                    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', // restaurant élégant
                    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80', // chef cuisine
                ];
                return restaImgs[globalIdx % restaImgs.length];
            }

            // Militaire / Défense / Sécurité
            if (/militaire|armée|défense|gendarm|police|pompier|gardien|sécurité|agent.de.surveillance|aps/.test(t)) {
                const secImgs = [
                    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80', // sécurité pro
                    'https://images.unsplash.com/photo-1612838320302-4b3b3996e9e4?auto=format&fit=crop&w=1200&q=80', // cyber / défense
                ];
                return secImgs[globalIdx % secImgs.length];
            }

            // RH / Recrutement
            if (/ressources.humaines|rh|recrutement|recruteur|drh|chargé.de.rh|gestionnaire.de.paie|paie/.test(t)) {
                const rhImgs = [
                    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80', // entretien RH
                    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80', // réunion RH
                ];
                return rhImgs[globalIdx % rhImgs.length];
            }

            // Communication / Marketing / Design
            if (/marketing|communication|rédacteur|content|seo|graphiste|designer|webdesign|chargé.de.comm|digital/.test(t)) {
                const mkImgs = [
                    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80', // réunion marketing
                    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80', // pitch présentation
                ];
                return mkImgs[globalIdx % mkImgs.length];
            }

            // Enseignement / Formation
            if (/enseignant|professeur|formateur|éducateur|animateur|moniteur|précept|pédagog|institu/.test(t)) {
                return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80';
            }

            // Fallback : pool professionnel générique (bureau / meeting / laptop)
            const fallback = [
                'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80', // laptop open space
                'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', // bureau moderne
                'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80', // coworking
                'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80', // réunion pro
                'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80', // pitch
            ];
            return fallback[globalIdx % fallback.length];
        })(job.intitule);

        const bgImg = sectorImg;

        const companyName = job.entreprise?.nom || '';
        const color       = getCompanyColor(companyName);
        const init        = getCompanyInitials(companyName);
        const logo        = getCompanyLogoUrl(companyName);
        const salary      = job.salaire?.libelle ? formatSalary(job.salaire.libelle) : '';
        const dateStr     = job.dateCreation ? relativeDate(job.dateCreation) : '';
        const lieuLabel   = job.lieuTravail?.libelle || '';
        const linkedInQ   = encodeURIComponent((companyName + ' ' + (job.intitule || '')).trim());
        const safeTitle   = esc(job.intitule || '').replace(/'/g, '&#39;');

        const sectorKey = getSectorKey(job.intitule);
        const videoUrl  = VideoQueue.get(sectorKey);
        // Start aléatoire (entre 0 et 20s) pour varier les plans même avec la même vidéo
        const videoStart = Math.floor(Math.random() * 20);

        section.innerHTML = `
            <div class="reel-bg">
                ${videoUrl ? `
                <video
                    autoplay muted loop playsinline
                    preload="none"
                    poster="${bgImg}"
                    style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0"
                    oncanplay="this.currentTime=${videoStart}"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
                >
                    <source src="${videoUrl}" type="video/mp4">
                </video>
                <img src="${bgImg}" alt="" loading="lazy" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0">
                ` : `<img src="${bgImg}" alt="" loading="lazy">`}
            </div>
            <div class="reel-overlay"></div>

            <div class="reel-body">
                <div class="job-meta">
                    <div class="job-company" style="display:flex; align-items:center; gap:10px;">
                        <div style="width:28px; height:28px; flex-shrink:0;">
                            ${window.renderCompanyLogo ? window.renderCompanyLogo(companyName) : `<i data-lucide="building-2" style="width:14px;height:14px"></i>`}
                        </div>
                        ${esc(companyName || 'Entreprise')}
                    </div>
                    <h2 class="job-title">${esc(job.intitule || "Offre d'emploi")}</h2>
                    <div class="job-tags">
                        ${job.typeContrat ? `<span class="jtag type">${esc(job.typeContrat)}</span>` : ''}
                        ${lieuLabel ? `<span class="jtag"><i data-lucide="map-pin" style="width:10px;height:10px;vertical-align:middle;margin-right:3px"></i>${esc(lieuLabel)}</span>` : ''}
                        ${salary ? `<span class="jtag salary">${esc(salary)}</span>` : ''}
                    </div>
                    <p class="job-desc">${esc(cleanDesc(job.description || '', 280))}</p>
                    ${dateStr ? `<div class="job-date">Publié ${esc(dateStr)}</div>` : ''}
                </div>

                <div class="sidebar-actions">
                    <button class="action-btn" onclick="window.likeStandalone(${globalIdx}, this)" aria-label="Sauvegarder">
                        <div class="action-circle"><i data-lucide="heart" style="width:21px;height:21px"></i></div>
                        <span class="action-label">Sauver</span>
                    </button>
                    <button class="action-btn" onclick="window.applyStandalone('${safeTitle}', '${job.id}')" aria-label="Postuler">
                        <div class="action-circle apply pulse"><i data-lucide="send" style="width:21px;height:21px"></i></div>
                        <span class="action-label">Postuler</span>
                    </button>
                    <button class="action-btn" onclick="window.safeOpenUrl('https://www.linkedin.com/search/results/all/?keywords=${linkedInQ}')" aria-label="LinkedIn">
                        <div class="action-circle" style="background:#fff"><img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LI" style="width:24px;height:24px;border-radius:4px;"></div>
                        <span class="action-label" style="text-transform:none;font-weight:700">LinkedIn</span>
                    </button>
                </div>
            </div>
        `;

        return section;
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-reel">
                <i data-lucide="search-x" style="width:48px;height:48px"></i>
                <h2>Aucune offre trouvée</h2>
                <p>Essayez de modifier vos critères de recherche.</p>
                <a href="index.html">Retour à l'accueil</a>
            </div>
        `;
        lucide.createIcons();
    }
}


// ── GLOBAL ACTIONS ──────────────────────────────────────────────────────

window.likeStandalone = async function(idx, btn) {
    const job = window._swipeApp?.jobs[idx];
    if (!job) return;

    const circle = btn?.querySelector('.action-circle');
    if (circle) {
        const isSaved = circle.classList.toggle('saved');
        const starIcon = btn.querySelector('i[data-lucide="heart"]');
        showToast(
            isSaved ? `⭐ Ajouté au Board : ${job.intitule}` : 'Retiré du Board',
            isSaved ? 'success' : 'info'
        );
    }

    const token = localStorage.getItem('apex_token');
    if (token) {
        apiFetch('/api/jobs/bookmark', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ jobId: job.id })
        }).catch(() => {});
    }
};

window.triggerVerdictAI = async function(idx, btn) {
    const job = window._swipeApp?.jobs[idx];
    if (!job) return;

    const circle = btn?.querySelector('.action-circle');
    if (circle) {
        circle.style.animation = 'spin 0.8s linear infinite';
        circle.style.borderColor = 'var(--brand, #f97316)';
    }

    const prompt = `Analyse ce poste pour un candidat : "${job.intitule}" chez ${job.entreprise?.nom || 'une entreprise'} (${job.typeContrat || 'contrat non précisé'}, ${job.lieuTravail?.libelle || ''}). Description : ${(job.description || '').slice(0, 400)}. Donne un verdict court (3 phrases max) sur l'attractivité du poste.`;

    try {
        const verdict = await (window.askApexBot?.(prompt, 'flash') ?? Promise.resolve(null));
        if (circle) {
            circle.style.animation = '';
            circle.style.background = 'rgba(168,85,247,0.25)';
        }
        showToast(verdict || 'Poste analysé — IA indisponible en mode local.', 'info', 6000);
    } catch {
        if (circle) circle.style.animation = '';
        showToast('Analyse IA indisponible.', 'warn');
    }
};

window.applyStandalone = function(title, id) {
    const job = window._swipeApp.jobs.find(j => j.id === id);
    if (job && (job.url || job.applyUrl || job.origineOffre?.urlOrigine)) {
        showToast(`Redirection vers l'offre : ${title}`, 'info');
        setTimeout(() => {
            window.safeOpenUrl(job.url || job.applyUrl || job.origineOffre.urlOrigine);
        }, 800);
    } else {
        showToast(`Redirection pour postuler à : ${title}`, 'info');
        setTimeout(() => {
            window.location.href = `index.html?apply=${id}`;
        }, 1500);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window._swipeApp = new SwipeStandalone();
});
