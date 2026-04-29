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

    async loadMore() {
        if (this.loading || !this.hasMore) return;
        this.loading = true;

        try {
            const params = new URLSearchParams({
                keyword: this.query,
                range: `${(this.page - 1) * 15}-${this.page * 15 - 1}`
            });
            
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
    // For now, redirect back to index with a param or just open a new tab to the source
    // In a real app, we might open the apply modal here, but since this is a separate page,
    // we'll redirect to index.html with auto-apply if possible or just show info.
    showToast(`Redirection pour postuler à : ${title}`, 'info');
    setTimeout(() => {
        window.location.href = `index.html?apply=${id}`;
    }, 1500);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window._swipeApp = new SwipeStandalone();
});
