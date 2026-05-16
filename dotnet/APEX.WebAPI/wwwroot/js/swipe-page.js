/**
 * APEX — swipe-page.js
 * Standalone high-performance swipe interface
 */
'use strict';

class SwipeStandalone {
    constructor() {
        this.container = document.getElementById('swipe-container');
        this.jobs = [];
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
        this.query = new URLSearchParams(window.location.search).get('q') || 'développeur';
        
        this.init();
        this.setupKeyboard();
        this.setupWheel();
        this.setupAutoHide();
        
        this.currentFilter = '';
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
            this.page++;
        } catch (err) {
            console.error('Swipe Load Error:', err);
            if (this.jobs.length === 0) this.renderEmpty();
        } finally {
            this.loading = false;
        }
    }


    setupInfiniteScroll() {
        const sentinel = document.getElementById('infinite-sentinel');
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.loading) {
                this.loadMore();
            }
        }, { rootMargin: '400px' });
        
        if (sentinel) observer.observe(sentinel);
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
            if (now - lastTime < 500) return; // Throttle 500ms
            
            if (Math.abs(e.deltaY) > 10) {
                e.preventDefault();
                if (e.deltaY > 0) {
                    this.container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
                } else if (e.deltaY < 0) {
                    this.container.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
                }
                lastTime = now;
            }
        }, { passive: false });
    }

    setupAutoHide() {
        const header = document.getElementById('swipe-header');
        if (!header) return;
        
        let timeout;
        this.container.addEventListener('scroll', () => {
            header.classList.add('hidden');
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                header.classList.remove('hidden');
            }, 1000); // Reappear after 1s of no scroll
        });
    }

    async search() {
        const inp = document.getElementById('swipe-search-input');
        if (!inp) return;
        this.query = inp.value || 'développeur';
        await this.loadMore(true);
    }

    async setFilter(btn, filter) {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = filter;
        await this.loadMore(true);
    }



    buildCard(job, globalIdx) {
        const section = document.createElement('section');
        section.className = 'swipe-card-section';
        
        const imgs = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80'
        ];
        const bgImg = imgs[globalIdx % imgs.length];
        
        const color = getCompanyColor(job.entreprise?.nom);
        const init = getCompanyInitials(job.entreprise?.nom);
        const logo = getCompanyLogoUrl(job.entreprise?.nom);

        section.innerHTML = `
            <div class="card-bg">
                <img src="${bgImg}" alt="">
            </div>
            <div class="card-overlay"></div>
            
            <div class="bottom-info">
                <div class="company-name">${esc(job.entreprise?.nom || 'Entreprise')}</div>
                <h2 class="job-title">${esc(job.intitule || 'Sans titre')}</h2>
                
                <div class="tag-row">
                    ${job.typeContrat ? `<span class="swipe-tag">${esc(job.typeContrat)}</span>` : ''}
                    ${job.lieuTravail?.libelle ? `<span class="swipe-tag"><i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:middle;margin-right:4px"></i>${esc(job.lieuTravail.libelle)}</span>` : ''}
                </div>

                <div class="job-desc">
                    ${esc(cleanDesc(job.description || '', 250))}
                </div>
            </div>

            <div class="side-actions">
                <button class="action-item" onclick="window.likeStandalone(${globalIdx}, this)">
                    <div class="action-circle"><i data-lucide="heart"></i></div>
                    <span class="action-label">Sauver</span>
                </button>
                <button class="action-item" onclick="window.applyStandalone('${esc(job.intitule).replace(/'/g, "\\'")}', '${job.id}')">
                    <div class="action-circle btn-apply-circle"><i data-lucide="send"></i></div>
                    <span class="action-label">Postuler</span>
                </button>
                <div class="action-item">
                    <div class="action-circle" style="background:#fff">
                         ${logo ? `<img src="${logo}" alt="" style="width:32px;height:32px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
                         <span style="color:${color};font-weight:800;font-size:14px;display:${logo ? 'none' : 'flex'}">${init}</span>
                    </div>
                </div>
            </div>
        `;
        
        return section;
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i data-lucide="frown"></i></div>
                <h2>Aucune offre trouvée</h2>
                <p>Essayez de changer vos critères de recherche.</p>
                <a href="index.html" class="btn-solid" style="margin-top:20px; text-decoration:none">Retour à l'accueil</a>
            </div>
        `;
        lucide.createIcons();
    }
}

// Global Actions
window.likeStandalone = async function(idx, btn) {
    const job = window._swipeApp.jobs[idx];
    if (!job) return;
    
    const circle = btn?.querySelector('.action-circle');
    if (circle) {
        circle.classList.toggle('active');
        if (circle.classList.contains('active')) {
            circle.style.color = '#ef4444';
            showToast(`♥ Sauvegardé : ${job.intitule}`, 'success');
        } else {
            circle.style.color = '';
        }
    }
    
    // Save to server if logged in
    const token = localStorage.getItem('apex_token');
    if (token) {
        apiFetch('/api/jobs/bookmark', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ jobId: job.id })
        }).catch(() => {});
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
