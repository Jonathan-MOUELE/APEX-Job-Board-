/**
 * APEX — swipe-page.js
 * Standalone high-performance swipe interface
 */
'use strict';

class SwipeStandalone {
    constructor() {
        // Support both old id and new id
        this.container = document.getElementById('reel-viewport') || document.getElementById('swipe-container');
        this.jobs = [];
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
        this.query = new URLSearchParams(window.location.search).get('q') || 'développeur';
        this.currentFilter = '';

        this.init();
        this.setupKeyboard();
        this.setupWheel();
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
        if (!inp) return;
        this.query = inp.value.trim() || 'développeur';
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
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = filter;
        await this.loadMore(true);
    }



    buildCard(job, globalIdx) {
        const section = document.createElement('section');
        section.className = 'reel-unit' + (globalIdx === 0 ? ' active' : '');

        const imgs = [
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80'
        ];
        const bgImg = imgs[globalIdx % imgs.length];

        const companyName = job.entreprise?.nom || '';
        const color       = getCompanyColor(companyName);
        const init        = getCompanyInitials(companyName);
        const logo        = getCompanyLogoUrl(companyName);
        const salary      = job.salaire?.libelle ? formatSalary(job.salaire.libelle) : '';
        const dateStr     = job.dateCreation ? relativeDate(job.dateCreation) : '';
        const lieuLabel   = job.lieuTravail?.libelle || '';
        const linkedInQ   = encodeURIComponent((companyName + ' ' + (job.intitule || '')).trim());
        const safeTitle   = esc(job.intitule || '').replace(/'/g, '&#39;');

        section.innerHTML = `
            <div class="reel-bg"><img src="${bgImg}" alt="" loading="lazy"></div>
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
