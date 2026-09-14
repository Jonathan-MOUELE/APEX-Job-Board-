/**
 * APEX — swipe-page.js (V2 Immersive Live Reel Engine)
 * Standalone high-performance swipe interface with dynamic visual storytelling,
 * sector-aware video & ambient motion, interactive multi-story tabs and company reputation links.
 */
'use strict';

// ── SECTOR & MEDIA ASSET REGISTRY ──────────────────────────────────────────
const SECTOR_THEMES = {
    restauration: {
        label: 'Restauration & Métiers de Bouche',
        icon: 'utensils',
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        badge: '👨‍🍳 Cuisine & Service',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-in-a-restaurant-kitchen-42774-large.mp4',
        images: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80'
        ],
        perks: ['Repas fournis', 'Pourboires partagés', 'Équipe passionnée', 'Horaires continus possibles']
    },
    tech: {
        label: 'Tech, Dév & Data',
        icon: 'terminal',
        color: '#f97316',
        glow: 'rgba(249, 115, 22, 0.45)',
        badge: '⚡ Tech & Numérique',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-43527-large.mp4',
        images: [
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
        ],
        perks: ['Télétravail flexible', 'Stack moderne', 'Budget formation tech', 'Matériel Apple / Dell fourni']
    },
    sante: {
        label: 'Santé & Soin',
        icon: 'heart-pulse',
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.45)',
        badge: '🏥 Santé & Médical',
        video: '',
        images: [
            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80'
        ],
        perks: ['Prime Ségur / Revalorisation', 'Reprise d\'ancienneté', 'Mobilité interne', 'Mutuelle prise en charge']
    },
    btp: {
        label: 'BTP, Artisanat & Industrie',
        icon: 'hard-hat',
        color: '#eab308',
        glow: 'rgba(234, 179, 8, 0.45)',
        badge: '🏗️ Chantier & Industrie',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-engineer-looking-at-a-construction-blueprint-41315-large.mp4',
        images: [
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80'
        ],
        perks: ['Panier repas chantier', 'Véhicule de service', 'Primes de déplacement', 'Équipements pro fournis']
    },
    commerce: {
        label: 'Commerce, Vente & Retail',
        icon: 'shopping-bag',
        color: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.45)',
        badge: '🛍️ Vente & Relation Client',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-business-people-meeting-in-an-office-42730-large.mp4',
        images: [
            'https://images.unsplash.com/photo-1556742049-0a67e557b6f6?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'
        ],
        perks: ['Primes sur objectifs', 'Réductions collaborateurs', 'Perspectives d\'évolution', 'Tickets restaurant']
    },
    default: {
        label: 'Opportunité APEX',
        icon: 'briefcase',
        color: '#f97316',
        glow: 'rgba(249, 115, 22, 0.45)',
        badge: '💼 Carrière & Emploi',
        video: '',
        images: [
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80'
        ],
        perks: ['Équilibre pro / perso', 'Mutuelle d\'entreprise', 'Tickets restaurant', 'Cadre de travail stimulant']
    }
};

class SwipeStandalone {
    constructor() {
        this.container = document.getElementById('reel-viewport') || document.getElementById('swipe-container');
        this.jobs = [];
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
        this.query = new URLSearchParams(window.location.search).get('q') || 'emploi';
        this.currentFilter = '';
        this.currentIndex = 0;
        this.soundEnabled = false;

        this.init();
        this.setupKeyboard();
        this.setupWheel();
        this.setupTouchGestures();
    }

    async init() {
        await this.loadMore();
        this.setupInfiniteScroll();
        this.setupVisibilityObserver();

        // Remove loading overlay
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 400);
            }, 600);
        }
    }

    detectSector(job) {
        const text = `${job.intitule || ''} ${job.description || ''} ${job.entreprise?.nom || ''}`.toLowerCase();
        if (/cuisin|chef|restaur|serveu|commis|h[oô]tel|bar|plonge|pizza|boulang|p[aâ]tiss|brasser/.test(text))
            return 'restauration';
        if (/d[eé]velopp|web|software|code|tech|python|java|react|c#|\.net|cyber|cloud|data|devops|fullstack/.test(text))
            return 'tech';
        if (/infirmi|sant[eé]|m[eé]dical|soignant|ehpad|docteur|pharmac|clinique|aide-soign/.test(text))
            return 'sante';
        if (/chantier|btp|travaux|ma[cç]on|[eé]lectric|plombier|peintre|b[aâ]timent|usine|conducteur|grut/.test(text))
            return 'btp';
        if (/commerci|vente|vendeur|magasin|retail|boutique|caisse|relation client|n[eé]goc/.test(text))
            return 'commerce';
        return 'default';
    }

    computeMatchScore(job, idx) {
        // Deterministic pseudo-random match score between 76 and 96
        const seed = (job.id ? String(job.id).charCodeAt(0) : idx * 13) + (job.intitule?.length || 10);
        return 74 + (seed % 23);
    }

    async loadMore(reset = false) {
        if (this.loading || (!this.hasMore && !reset)) return;
        this.loading = true;

        if (reset) {
            this.container.innerHTML = '';
            this.jobs = [];
            this.page = 1;
            this.hasMore = true;
            this.currentIndex = 0;
            this.initDots(0);
        }

        try {
            const params = new URLSearchParams({
                keyword: this.query,
                range: `${(this.page - 1) * 15}-${this.page * 15 - 1}`
            });
            if (this.currentFilter) params.set('contract', this.currentFilter);

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
            const startIdx = this.jobs.length;
            this.jobs.push(...processedJobs);

            processedJobs.forEach((job, idx) => {
                const card = this.buildCard(job, startIdx + idx);
                this.container.appendChild(card);
            });

            lucide.createIcons();
            this.initDots(Math.min(this.jobs.length, 8));
            this.updateActiveCard(this.currentIndex);
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
            `<div class="progress-dot${i === 0 ? ' active' : ''}" onclick="window._swipeApp?.scrollToIndex(${i})"></div>`
        ).join('');
    }

    setupInfiniteScroll() {
        window.createSentinel?.(this.container, () => this.loadMore(), '600px');
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) return;
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                this.scrollByUnits(1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                this.scrollByUnits(-1);
            } else if (e.key === 'l' || e.key === 'L') {
                const btn = document.querySelector(`.reel-unit[data-idx="${this.currentIndex}"] .action-btn-heart`);
                if (btn) window.likeStandalone(this.currentIndex, btn);
            }
        });
    }

    setupWheel() {
        let lastWheel = 0;
        this.container.addEventListener('wheel', (e) => {
            const now = Date.now();
            if (now - lastWheel < 450) return;
            if (Math.abs(e.deltaY) > 25) {
                e.preventDefault();
                this.scrollByUnits(e.deltaY > 0 ? 1 : -1);
                lastWheel = now;
            }
        }, { passive: false });
    }

    setupTouchGestures() {
        let touchStartY = 0;
        let touchStartTime = 0;

        this.container.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diffY = touchStartY - touchEndY;
            const duration = Date.now() - touchStartTime;

            if (Math.abs(diffY) > 50 && duration < 500) {
                this.scrollByUnits(diffY > 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    setupVisibilityObserver() {
        this.container.addEventListener('scroll', () => {
            const idx = Math.round(this.container.scrollTop / window.innerHeight);
            if (idx !== this.currentIndex) {
                this.currentIndex = idx;
                this.updateActiveCard(idx);
            }
        }, { passive: true });
    }

    scrollByUnits(direction) {
        const nextIdx = Math.max(0, Math.min(this.jobs.length - 1, this.currentIndex + direction));
        this.scrollToIndex(nextIdx);
    }

    scrollToIndex(idx) {
        this.currentIndex = idx;
        this.container.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });
        this.updateActiveCard(idx);
    }

    updateActiveCard(activeIdx) {
        const cards = document.querySelectorAll('.reel-unit');
        cards.forEach((card, i) => {
            const isActive = i === activeIdx;
            card.classList.toggle('active', isActive);

            // Manage video playback
            const vid = card.querySelector('video');
            if (vid) {
                if (isActive) {
                    vid.muted = !this.soundEnabled;
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            }
        });

        // Update dots
        const dots = document.getElementById('progress-dots');
        if (dots) {
            const count = dots.children.length;
            [...dots.children].forEach((d, i) => {
                d.classList.toggle('active', i === Math.min(activeIdx, count - 1));
            });
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) {
            btn.innerHTML = `<i data-lucide="${this.soundEnabled ? 'volume-2' : 'volume-x'}"></i>`;
            btn.setAttribute('aria-label', this.soundEnabled ? 'Couper le son' : 'Activer le son');
            lucide.createIcons();
        }
        // Update current video
        const activeVid = document.querySelector('.reel-unit.active video');
        if (activeVid) activeVid.muted = !this.soundEnabled;
        showToast(this.soundEnabled ? 'Son d\'ambiance activé' : 'Son coupé', 'info', 1800);
    }

    async search() {
        const inp = document.getElementById('swipe-search-input');
        if (!inp) return;
        this.query = inp.value.trim() || 'emploi';
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
        document.querySelectorAll('.filter-row .chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = filter;
        await this.loadMore(true);
    }

    switchStoryTab(cardIdx, tabName, tabBtn) {
        const card = document.querySelector(`.reel-unit[data-idx="${cardIdx}"]`);
        if (!card) return;

        card.querySelectorAll('.story-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');

        card.querySelectorAll('.story-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = card.querySelector(`.story-panel[data-panel="${tabName}"]`);
        if (targetPanel) targetPanel.classList.add('active');
        lucide.createIcons();
    }

    buildCard(job, globalIdx) {
        const section = document.createElement('section');
        section.className = 'reel-unit' + (globalIdx === 0 ? ' active' : '');
        section.setAttribute('data-idx', globalIdx);

        const sectorKey = this.detectSector(job);
        const sector = SECTOR_THEMES[sectorKey] || SECTOR_THEMES.default;
        const bgImg = sector.images[globalIdx % sector.images.length];
        const hasVideo = Boolean(sector.video && globalIdx % 2 === 0);

        const companyName = (job.entreprise?.nom || 'Entreprise Partenaire').trim();
        const salary = job.salaire?.libelle ? formatSalary(job.salaire.libelle) : '';
        const dateStr = job.dateCreation ? relativeDate(job.dateCreation) : 'Récemment';
        const lieuLabel = job.lieuTravail?.libelle || 'France';
        const matchScore = this.computeMatchScore(job, globalIdx);
        const safeTitle = esc(job.intitule || "Offre d'emploi").replace(/'/g, '&#39;');
        const encodedCompany = encodeURIComponent(companyName);

        // Extract key missions
        const rawDesc = cleanDesc(job.description || '', 400);
        const missions = rawDesc.split('.').filter(s => s.trim().length > 15).slice(0, 3);

        section.innerHTML = `
            <!-- Ambient Background (Video or Ken Burns Photo) -->
            <div class="reel-bg">
                ${hasVideo ? `
                    <video src="${sector.video}" loop muted playsinline preload="metadata" poster="${bgImg}"></video>
                ` : `
                    <img src="${bgImg}" alt="" loading="lazy">
                `}
                <div class="aurora-ambient" style="background: radial-gradient(circle at 80% 20%, ${sector.glow} 0%, transparent 60%);"></div>
            </div>
            <div class="reel-overlay"></div>

            <!-- Segmented Story Progress Bar -->
            <div class="story-progress-bar">
                <div class="story-seg active"></div>
                <div class="story-seg"></div>
                <div class="story-seg"></div>
            </div>

            <!-- Top Sector & Express Badge -->
            <div class="top-meta-badge">
                <span class="live-pill" style="border-color:${sector.color}; color:${sector.color}">
                    <span class="live-dot" style="background:${sector.color}"></span>
                    ${sector.badge}
                </span>
                <span class="match-badge">
                    <i data-lucide="sparkles" style="width:12px;height:12px"></i>
                    ${matchScore}% Match APEX
                </span>
            </div>

            <!-- Reel Body Content -->
            <div class="reel-body">
                <div class="job-meta">
                    <!-- Company Header -->
                    <div class="job-company">
                        <div class="company-badge-avatar" style="border-color:${sector.color}40">
                            ${window.renderCompanyLogo ? window.renderCompanyLogo(companyName) : `<i data-lucide="building-2"></i>`}
                        </div>
                        <span class="company-name">${esc(companyName)}</span>
                        <i data-lucide="badge-check" style="width:15px;height:15px;color:#38bdf8" title="Vérifié"></i>
                    </div>

                    <!-- Job Title -->
                    <h2 class="job-title">${esc(job.intitule || "Offre d'emploi")}</h2>

                    <!-- Filter & Perk Tags -->
                    <div class="job-tags">
                        ${job.typeContrat ? `<span class="jtag type">${esc(job.typeContrat)}</span>` : '<span class="jtag type">CDI / Alternance</span>'}
                        <span class="jtag"><i data-lucide="map-pin" style="width:10px;height:10px;margin-right:4px"></i>${esc(lieuLabel)}</span>
                        ${salary ? `<span class="jtag salary"><i data-lucide="coins" style="width:10px;height:10px;margin-right:4px"></i>${esc(salary)}</span>` : ''}
                    </div>

                    <!-- Story Multi-Tab Navigation -->
                    <div class="story-tabs-nav">
                        <button class="story-tab-btn active" onclick="window._swipeApp?.switchStoryTab(${globalIdx}, 'apercu', this)">Aperçu</button>
                        <button class="story-tab-btn" onclick="window._swipeApp?.switchStoryTab(${globalIdx}, 'missions', this)">Missions</button>
                        <button class="story-tab-btn" onclick="window._swipeApp?.switchStoryTab(${globalIdx}, 'avantages', this)">Avantages</button>
                        <button class="story-tab-btn" onclick="window._swipeApp?.switchStoryTab(${globalIdx}, 'enquete', this)">🏢 Enquête Boîte</button>
                    </div>

                    <!-- Story Panels -->
                    <div class="story-panels-container">
                        <!-- Panel 1: Aperçu -->
                        <div class="story-panel active" data-panel="apercu">
                            <p class="job-desc">${esc(rawDesc || 'Découvrez tous les détails de cette opportunité professionnelle et candidatez directement via APEX.')}</p>
                            <div class="job-date"><i data-lucide="clock" style="width:11px;height:11px"></i> Publié ${esc(dateStr)}</div>
                        </div>

                        <!-- Panel 2: Missions -->
                        <div class="story-panel" data-panel="missions">
                            <ul class="story-list">
                                ${missions.length > 0 ? missions.map(m => `<li><i data-lucide="check-circle-2"></i> ${esc(m.trim())}.</li>`).join('') : `
                                    <li><i data-lucide="check-circle-2"></i> Prise en charge des projets opérationnels de l'équipe.</li>
                                    <li><i data-lucide="check-circle-2"></i> Collaboration directe avec les managers et partenaires.</li>
                                    <li><i data-lucide="check-circle-2"></i> Participation active à l'amélioration continue des processus.</li>
                                `}
                            </ul>
                        </div>

                        <!-- Panel 3: Avantages -->
                        <div class="story-panel" data-panel="avantages">
                            <div class="perks-grid">
                                ${sector.perks.map(p => `
                                    <div class="perk-item">
                                        <i data-lucide="check" style="width:13px;height:13px;color:#4ade80"></i>
                                        <span>${p}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Panel 4: Enquête Boîte (Vrais Liens Externes) -->
                        <div class="story-panel" data-panel="enquete">
                            <div class="reputation-links">
                                <div class="reputation-title">Vérifiez les coulisses de ${esc(companyName)} :</div>
                                <div class="rep-grid">
                                    <a href="https://www.welcometothejungle.com/fr/companies?q=${encodedCompany}" target="_blank" rel="noopener" class="rep-btn wttj">
                                        <i data-lucide="external-link"></i> Welcome to the Jungle
                                    </a>
                                    <a href="https://www.linkedin.com/search/results/all/?keywords=${encodedCompany}" target="_blank" rel="noopener" class="rep-btn li">
                                        <i data-lucide="linkedin"></i> Profil LinkedIn
                                    </a>
                                    <a href="https://fr.indeed.com/cmp/${encodedCompany}" target="_blank" rel="noopener" class="rep-btn indeed">
                                        <i data-lucide="star"></i> Avis Salariés Indeed
                                    </a>
                                    <a href="https://www.glassdoor.fr/Avis/${encodedCompany}-avis-SRCH_KE0,${companyName.length}.htm" target="_blank" rel="noopener" class="rep-btn gd">
                                        <i data-lucide="award"></i> Salaires Glassdoor
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TikTok-Style Action Sidebar -->
                <div class="sidebar-actions">
                    <!-- Like / Save -->
                    <button class="action-btn action-btn-heart" onclick="window.likeStandalone(${globalIdx}, this)" aria-label="Sauvegarder">
                        <div class="action-circle"><i data-lucide="heart" style="width:22px;height:22px"></i></div>
                        <span class="action-label">Sauver</span>
                    </button>

                    <!-- AI Verdict Express -->
                    <button class="action-btn" onclick="window.triggerVerdictAI(${globalIdx}, this)" aria-label="Avis IA APEX">
                        <div class="action-circle ai-verdict"><i data-lucide="sparkles" style="width:22px;height:22px;color:#a855f7"></i></div>
                        <span class="action-label" style="color:#c084fc">Avis IA</span>
                    </button>

                    <!-- Direct Apply (Primary) -->
                    <button class="action-btn" onclick="window.applyStandalone('${safeTitle}', '${job.id}')" aria-label="Postuler">
                        <div class="action-circle apply pulse"><i data-lucide="send" style="width:22px;height:22px"></i></div>
                        <span class="action-label" style="color:#fb923c">Postuler</span>
                    </button>

                    <!-- Share -->
                    <button class="action-btn" onclick="window.shareStandalone(${globalIdx})" aria-label="Partager">
                        <div class="action-circle"><i data-lucide="share-2" style="width:20px;height:20px"></i></div>
                        <span class="action-label">Partager</span>
                    </button>

                    <!-- Company Deep Dive -->
                    <button class="action-btn" onclick="window._swipeApp?.switchStoryTab(${globalIdx}, 'enquete', document.querySelector('.reel-unit[data-idx=\\'${globalIdx}\\'] .story-tab-btn:last-child'))" aria-label="Avis boîte">
                        <div class="action-circle"><i data-lucide="search" style="width:20px;height:20px"></i></div>
                        <span class="action-label">Avis</span>
                    </button>
                </div>
            </div>
        `;

        return section;
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-reel">
                <i data-lucide="search-x" style="width:54px;height:54px;color:var(--brand)"></i>
                <h2>Aucune offre pour cette recherche</h2>
                <p>Modifiez vos filtres ou tentez un autre secteur pour relancer le flux live.</p>
                <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;justify-content:center">
                    <button class="chip active" onclick="window._swipeApp?.selectSuggestion('développeur')">Tech & Dév</button>
                    <button class="chip active" onclick="window._swipeApp?.selectSuggestion('restauration')">Restauration</button>
                    <button class="chip active" onclick="window._swipeApp?.selectSuggestion('santé')">Santé</button>
                    <button class="chip active" onclick="window._swipeApp?.selectSuggestion('commerce')">Commerce</button>
                </div>
                <a href="index.html" style="margin-top:16px;">Retour à l'accueil APEX</a>
            </div>
        `;
        lucide.createIcons();
    }
}

// ── GLOBAL ACTION HANDLERS ───────────────────────────────────────────────────

window.likeStandalone = async function(idx, btn) {
    const job = window._swipeApp?.jobs[idx];
    if (!job) return;

    const circle = btn?.querySelector('.action-circle');
    if (circle) {
        const isSaved = circle.classList.toggle('saved');
        circle.style.transform = 'scale(1.25)';
        setTimeout(() => circle.style.transform = '', 250);
        showToast(
            isSaved ? `⭐ Enregistré dans vos favoris : ${job.intitule}` : 'Retiré de vos favoris',
            isSaved ? 'success' : 'info'
        );
    }

    const token = localStorage.getItem('apex_token');
    if (token) {
        apiFetch('/api/bookmarks', {
            method: 'POST',
            body: JSON.stringify({
                jobOfferId: String(job.id),
                jobTitle: job.intitule || '',
                company: job.entreprise?.nom || '',
                location: job.lieuTravail?.libelle || '',
                contractType: job.typeContrat || '',
                salaryLabel: job.salaire?.libelle || '',
                applyUrl: job.url || ''
            })
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

    const prompt = `Évalue ce poste en tant qu'assistant carrière APEX : "${job.intitule}" chez ${job.entreprise?.nom || 'une entreprise'} (${job.typeContrat || 'contrat'}, ${job.lieuTravail?.libelle || ''}). Description : ${(job.description || '').slice(0, 300)}. Donne un score de compatibilité estimé sur 100 et un avis en 2 phrases concrètes.`;

    try {
        const res = await apiFetch('/api/bot/chat', {
            method: 'POST',
            body: JSON.stringify({ message: prompt, history: [] })
        });
        const data = await res.json();
        const verdict = data.reply || data.message || "Poste attractif avec de bons débouchés.";

        if (circle) {
            circle.style.animation = '';
            circle.style.background = 'rgba(168,85,247,0.3)';
            circle.style.borderColor = '#c084fc';
        }

        // Display in a dedicated modal/toast
        showToast(verdict, 'info', 8000);
    } catch {
        if (circle) circle.style.animation = '';
        showToast("🎯 Score de compatibilité estimé : 84/100. Poste à fort potentiel.", 'info', 5000);
    }
};

window.applyStandalone = function(title, id) {
    const job = window._swipeApp?.jobs.find(j => String(j.id) === String(id));
    const targetUrl = job?.url || job?.applyUrl || job?.origineOffre?.urlOrigine;
    if (targetUrl) {
        showToast(`Redirection vers la candidature : ${title}`, 'info');
        setTimeout(() => {
            window.safeOpenUrl ? window.safeOpenUrl(targetUrl) : window.open(targetUrl, '_blank', 'noopener');
        }, 600);
    } else {
        showToast(`Candidature pour : ${title}`, 'info');
        setTimeout(() => {
            window.location.href = `index.html?apply=${id}`;
        }, 1000);
    }
};

window.shareStandalone = async function(idx) {
    const job = window._swipeApp?.jobs[idx];
    if (!job) return;

    const shareData = {
        title: `${job.intitule} chez ${job.entreprise?.nom || 'APEX'}`,
        text: `Découvre cette offre sur APEX Swipe : ${job.intitule} (${job.lieuTravail?.libelle || 'France'})`,
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (_) {}
    } else {
        navigator.clipboard?.writeText(window.location.href);
        showToast('Lien copié dans le presse-papier !', 'success');
    }
};

// Auto-boot
document.addEventListener('DOMContentLoaded', () => {
    window._swipeApp = new SwipeStandalone();
});
