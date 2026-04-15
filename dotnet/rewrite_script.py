import os

INDEX_PATH = r"C:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\wwwroot\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the entire script block
start_tag = "<!-- SCRIPTS (Vanilla JS) -->"
script_start_idx = html.find(start_tag)

if script_start_idx != -1:
    html_before_script = html[:script_start_idx]
else:
    # Find <script> if start_tag is missing
    s_tag = "<script>"
    script_start_idx = html.rfind(s_tag)
    html_before_script = html[:script_start_idx]

full_script = """<!-- SCRIPTS (Vanilla JS) -->
    <script>
        const API = 'http://localhost:5188';
        let currentToken = localStorage.getItem('apex-token');

        // 1. Initialisation
        lucide.createIcons();

        // NOUVEAU : Scroll Progress Bar Logic
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            const scrollBar = document.getElementById('scroll-bar');
            if (scrollBar) scrollBar.style.width = scrolled + '%';
        });

        // 2. Gestion de l'état UI
        let activeFilter = null;
        const initialState = document.getElementById('initial-state');
        const searchResultsContainer = document.getElementById('search-results');
        const inputKw = document.getElementById('input-keywords');
        const inputCity = document.getElementById('input-city');

        function triggerSearch(keyword) {
            if (inputKw) inputKw.value = keyword;
            performSearch();
        }

        // 3. Gestion des filtres (Pills)
        const pills = document.querySelectorAll('.pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFilter = pill.dataset.filter === "null" ? null : pill.dataset.filter;
                
                if (inputKw && inputCity && (inputKw.value !== "" || inputCity.value !== "")) {
                    performSearch();
                }
            });
        });

        // 4. Logique de Recherche
        const btnSearch = document.getElementById('btn-search');
        if (btnSearch) btnSearch.addEventListener('click', performSearch);
        if (inputKw) inputKw.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });
        if (inputCity) inputCity.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

        async function performSearch() {
            const kw = inputKw ? inputKw.value.trim() : '';
            const city = inputCity ? inputCity.value.trim() : '';
            if (!kw && !city) {
                if(initialState) initialState.style.display = 'block';
                if(searchResultsContainer) searchResultsContainer.style.display = 'none';
                return;
            }
            if(initialState) initialState.style.display = 'none';
            if(searchResultsContainer) searchResultsContainer.style.display = 'grid';
            
            // Skeletons
            searchResultsContainer.innerHTML = Array(6).fill(`
                <div class="job-card" style="pointer-events:none;">
                <div class="card-header">
                    <div class="company-avatar skeleton"></div>
                    <div style="flex:1;">
                    <div class="skeleton" style="height:20px;width:80%;margin-bottom:8px;"></div>
                    <div class="skeleton" style="height:15px;width:50%;"></div>
                    </div>
                </div>
                <div class="skeleton" style="height:25px;width:100%;margin-bottom:20px;"></div>
                <div class="skeleton" style="height:40px;width:100%;"></div>
                </div>
            `).join('');

            const params = new URLSearchParams();
            if (kw) params.set('keywords', kw);
            if (city) params.set('location', city);
            if (activeFilter) params.set('contract', activeFilter); // using 'contract'

            try {
                const res = await fetch(`${API}/api/jobs/search?${params}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const jobs = data.results || data || [];
                renderRealResults(jobs, kw, city);
            } catch (err) {
                console.error('[SEARCH]', err);
                showToast('Erreur serveur — vérifiez que dotnet run est actif', 'error');
                searchResultsContainer.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i data-lucide="wifi-off"></i>
                    <h3>Connexion impossible</h3>
                    <p>Vérifiez que le serveur tourne sur localhost:5188</p>
                </div>`;
                lucide.createIcons();
            }
        }

        function renderRealResults(jobs, kw, city) {
            if (!jobs.length) {
                searchResultsContainer.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i data-lucide="search-x"></i>
                    <h3>Aucune offre trouvée</h3>
                    <p>Essayez d'autres mots-clés${city ? ` ou un rayon plus large autour de ${city}` : ''}</p>
                    <button class="btn" style="margin-top:16px;" 
                    onclick="if(inputKw)inputKw.value='';if(inputCity)inputCity.value='';performSearch()">
                    Réinitialiser
                    </button>
                </div>`;
                lucide.createIcons();
                return;
            }

            const colors = ['#ff4500','#10b981','#3b82f6','#8b5cf6','#ec4899','#f59e0b'];
            
            searchResultsContainer.innerHTML = jobs.map(job => {
                const companyName = job.companyName || job.company || '';
                const color = colors[companyName.charCodeAt(0) % colors.length] || colors[0];
                const initials = (companyName || '??').substring(0,2).toUpperCase();
                const salary = job.salaryLabel || 'Salaire non précisé';
                const isSalaryKnown = job.salaryMin || (salary && salary !== 'Salaire non précisé');
                
                const locStr = job.city || job.location;
                const badgeMap = locStr ? `<span class="badge"><i data-lucide="map-pin" style="width:14px;"></i>${escHtml(locStr)}</span>` : '';
                
                return `
                <div class="job-card" data-job-id="${escHtml(job.id || '')}">
                <div class="card-header">
                    <div class="company-avatar" style="color:${color};border-color:${color}33;">
                    ${job.companyLogoUrl 
                        ? `<img src="${escHtml(job.companyLogoUrl)}" 
                        style="width:100%;height:100%;object-fit:contain;border-radius:10px;padding:3px;background:white"
                        onerror="this.outerHTML='${initials}'">`
                        : initials}
                    </div>
                    <div style="flex:1;">
                    <h3 class="job-title">${escHtml((job.title || 'Poste').substring(0,70))}</h3>
                    <span class="job-company">${escHtml(companyName || 'Entreprise')}</span>
                    </div>
                </div>
                <div class="card-badges">
                    ${badgeMap}
                    ${job.contractType ? `<span class="badge highlight">${escHtml(job.contractLabel || job.contractType)}</span>` : ''}
                    ${isSalaryKnown 
                    ? `<span class="badge success"><i data-lucide="banknote" style="width:14px;"></i>${escHtml(salary)}</span>` 
                    : `<span class="badge" style="opacity:0.5">Salaire non précisé</span>`}
                </div>
                <div class="card-footer">
                    <button class="btn" style="font-size:0.8rem;" 
                    onclick="event.stopPropagation();analyzeJob(this,'${escHtml(job.id || '')}')">
                    Analyser IA
                    </button>
                    ${(job.applyUrl || job.originUrl) 
                    ? `<a href="${escHtml(job.applyUrl || job.originUrl)}" target="_blank" rel="noopener"
                        class="btn btn-primary" style="font-size:0.8rem;padding:6px 12px;"
                        onclick="event.stopPropagation()">
                        Postuler <i data-lucide="arrow-right" style="width:14px;"></i>
                        </a>` 
                    : ''}
                </div>
                </div>`;
            }).join('');
            
            lucide.createIcons();
            
            window._currentJobs = jobs; // Store globally
            searchResultsContainer.querySelectorAll('.job-card').forEach((card, i) => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    openJobPanelReal(window._currentJobs[i]);
                });
            });
        }

        // 5. Gestion du Panneau Latéral
        const panel = document.getElementById('job-panel');
        const backdrop = document.getElementById('backdrop');
        const closeBtn = document.getElementById('close-panel');

        function openJobPanelReal(job) {
            const companyName = job.companyName || job.company || '';
            const color = ['#ff4500','#10b981','#3b82f6','#8b5cf6'][companyName.charCodeAt(0) % 4] || '#ff4500';
            const initials = (companyName || '??').substring(0,2).toUpperCase();
            
            const elTitle = document.getElementById('panel-title');
            if(elTitle) elTitle.textContent = job.title || '';
            const elCompany = document.getElementById('panel-company');
            if(elCompany) elCompany.textContent = companyName;
            const elLoc = document.getElementById('panel-location');
            if(elLoc) elLoc.textContent = job.city || job.location || 'Non précisé';
            const elContract = document.getElementById('panel-contract');
            if(elContract) elContract.textContent = job.contractLabel || job.contractType || '';
            const elSalary = document.getElementById('panel-salary');
            if(elSalary) elSalary.textContent = job.salaryLabel || 'Non précisé';
            
            // Description
            const desc = document.querySelector('#job-panel .panel-content p');
            if (desc) desc.textContent = job.description || 'Pas de description disponible.';
            
            // Badges tech skills
            const techContainer = document.querySelector('#job-panel .panel-content .skills-container');
            if (techContainer) {
                const skills = job.techSkills || job.requiredTechs;
                if (skills && skills.length) {
                    techContainer.innerHTML = skills.map(s => 
                        `<span class="badge highlight" style="margin:2px;">${escHtml(s)}</span>`
                    ).join('');
                } else {
                    techContainer.innerHTML = '';
                }
            }
            
            // Bouton postuler
            const postulerBtn = document.querySelector('#job-panel .panel-footer .btn-primary');
            if (postulerBtn && (job.applyUrl || job.originUrl)) {
                postulerBtn.onclick = () => window.open(job.applyUrl || job.originUrl, '_blank');
            }
            
            if(panel) panel.classList.add('open');
            if(backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeJobPanel() {
            if(panel) panel.classList.remove('open');
            if(backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }

        if(closeBtn) closeBtn.addEventListener('click', closeJobPanel);
        if(backdrop) backdrop.addEventListener('click', closeJobPanel);

        // 6. Gestion du Chat
        const chatToggle = document.getElementById('chat-toggle');
        const chatPanel = document.getElementById('chat-panel');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatMessages = document.getElementById('chat-messages');

        if(chatToggle) {
            chatToggle.addEventListener('click', () => {
                chatPanel.classList.toggle('open');
                if(chatPanel.classList.contains('open') && chatInput) chatInput.focus();
            });
        }

        function appendMessage(text, isUser) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg ${isUser ? 'msg-user' : 'msg-bot'}`;
            msgDiv.textContent = text;
            if(chatMessages) {
                chatMessages.appendChild(msgDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        async function handleChat() {
            if(!chatInput) return;
            const text = chatInput.value.trim();
            if (!text) return;
            
            appendMessage(text, true);
            chatInput.value = '';
            
            const typingDiv = document.createElement('div');
            typingDiv.className = 'msg msg-bot';
            typingDiv.innerHTML = `
                <span style="display:flex;gap:4px;align-items:center;">
                <span style="width:6px;height:6px;background:var(--text-muted);border-radius:50%;
                    animation:pulse 1s infinite;"></span>
                <span style="width:6px;height:6px;background:var(--text-muted);border-radius:50%;
                    animation:pulse 1s infinite 0.15s;"></span>
                <span style="width:6px;height:6px;background:var(--text-muted);border-radius:50%;
                    animation:pulse 1s infinite 0.3s;"></span>
                </span>`;
            if(chatMessages) {
                chatMessages.appendChild(typingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            try {
                const res = await fetch(`${API}/api/jobs/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                typingDiv.remove();
                appendMessage(data.reply || 'Pas de réponse.', false);
            } catch {
                typingDiv.remove();
                appendMessage('Erreur de connexion au service IA.', false);
            }
        }

        if(chatSend) chatSend.addEventListener('click', handleChat);
        if(chatInput) chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });

        // Helpers
        function escHtml(str) {
            const d = document.createElement('div');
            d.textContent = String(str || '');
            return d.innerHTML;
        }

        function showToast(msg, type = 'info') {
            const t = document.createElement('div');
            t.style.cssText = `
                position:fixed;top:20px;right:20px;z-index:999;
                padding:12px 18px;border-radius:12px;font-size:0.88rem;
                font-weight:500;max-width:320px;animation:fadeIn 0.3s ease;
                display:flex;align-items:center;gap:10px;
                box-shadow:0 8px 24px rgba(0,0,0,0.4);font-family:Inter,sans-serif;
                ${type === 'error' 
                ? 'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;'
                : 'background:rgba(255,69,0,0.12);border:1px solid rgba(255,69,0,0.25);color:#ff6a33;'}
            `;
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 4000);
        }

        async function analyzeJob(btn, jobId) {
            if (!currentToken) {
                showToast('Connectez-vous pour analyser cette offre', 'info');
                return;
            }
            btn.textContent = '⏳ Analyse...';
            btn.disabled = true;
            try {
                const res = await fetch(`${API}/api/jobs/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ jobId })
                });
                const d = await res.json();
                if (d.verdict) {
                btn.textContent = `${d.verdict === 'GO' ? '✅' : '❌'} ${Math.round(d.score || 0)}%`;
                btn.style.color = d.verdict === 'GO' ? 'var(--success)' : 'var(--danger)';
                }
            } catch {
                btn.textContent = 'Analyser IA';
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>
"""

new_html = html_before_script + full_script
with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Updated script perfectly")
