import os

html_content = r"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APEX | Trouve ton meilleur match</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* ==========================================================================
           1. CSS VARIABLES & THEMING (Dark / Light Mode)
           ========================================================================== */
        :root {
            /* DARK MODE */
            --bg-dark: #0f1015;
            --surface: #16171d;
            --surface-hover: #1c1d24;
            --border-dark: #2a2b36;
            --mesh-base: #1a1525;
            
            --text-main: #ffffff;
            --text-muted: #8b8b9e;
            --text-placeholder: #5c5c70;
            --search-bg: rgba(20, 20, 30, 0.85);
            --pill-bg: rgba(0,0,0,0.3);
            
            /* Couleurs de marque (Invariées) */
            --primary-red: #ff3b30;
            --primary-orange: #ff9500;
            --success: #10b981;
            
            /* Dégradés */
            --gradient-text-1: linear-gradient(135deg, #a450ff 0%, #32ade6 100%);
            --gradient-text-2: linear-gradient(135deg, #ff9500 0%, #ff3b30 100%);
            --gradient-search-border: linear-gradient(90deg, #32ade6, #a450ff, #ff3b30, #ff9500);
            
            --radius-md: 12px;
            --radius-lg: 20px;
            --radius-xl: 30px;
            --radius-pill: 9999px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* LIGHT MODE (Affiné pour être ultra-premium type SaaS) */
        body.light-mode {
            --bg-dark: #f8fafc; /* Gris bleuté très clair */
            --surface: #ffffff;
            --surface-hover: #f1f5f9;
            --border-dark: #e2e8f0;
            --mesh-base: #ffffff; /* Base blanche pour faire ressortir les orbes */
            
            --text-main: #0f172a;
            --text-muted: #64748b;
            --text-placeholder: #94a3b8;
            --search-bg: rgba(255, 255, 255, 0.9);
            --pill-bg: rgba(255, 255, 255, 0.8);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }

        body {
            background-color: var(--bg-dark); 
            color: var(--text-main);
            min-height: 100vh; overflow-x: hidden; display: flex; flex-direction: column;
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        body:not(.light-mode) ::-webkit-scrollbar-thumb { background: var(--border-dark); }
        ::-webkit-scrollbar-thumb:hover { background: var(--primary-red); }

        .scroll-progress {
            position: fixed; top: 0; left: 0; height: 3px;
            background: var(--gradient-search-border); width: 0%; z-index: 1000;
            transition: width 0.1s ease-out;
        }

        /* ==========================================================================
           2. ARRIÈRE-PLAN HERO (MESH GRADIENT OBSÉDANT)
           ========================================================================== */
        .hero-bg-wrapper {
            position: relative; width: 100%;
            background-color: var(--mesh-base);
            background-image: 
                radial-gradient(at 0% 0%, rgba(255, 149, 0, 0.3) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(32, 20, 40, 0.4) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(255, 59, 48, 0.2) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(138, 43, 226, 0.15) 0px, transparent 50%);
            overflow: hidden;
            transition: background-color 0.4s ease;
            border-bottom: 1px solid var(--border-dark);
        }

        body:not(.light-mode) .hero-bg-wrapper {
            background-image: 
                radial-gradient(at 0% 0%, rgba(255, 149, 0, 0.4) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(32, 20, 40, 0.8) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(255, 59, 48, 0.3) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(138, 43, 226, 0.2) 0px, transparent 50%);
        }

        .hero-bg-wrapper::before {
            content: ''; position: absolute; inset: 0;
            background-image: radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px);
            background-size: 20px 20px; z-index: 1; pointer-events: none;
        }
        body:not(.light-mode) .hero-bg-wrapper::before {
            background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
        }

        .wave-separator { position: absolute; bottom: -1px; left: 0; width: 100%; height: auto; z-index: 2; }
        .wave-separator path { fill: var(--bg-dark); transition: fill 0.4s ease; }

        /* ==========================================================================
           3. NAVBAR & THEME TOGGLE
           ========================================================================== */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 20px 40px; position: relative; z-index: 50;
        }
        .logo { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -1px; }
        .logo i { color: var(--primary-red); }
        
        .nav-links { display: flex; gap: 15px; align-items: center; }
        .btn-nav {
            background: var(--surface); border: 1px solid var(--border-dark);
            color: var(--text-main); padding: 8px 16px; border-radius: var(--radius-md);
            font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: var(--transition);
        }
        .btn-nav:hover { background: var(--surface-hover); }
        
        .theme-toggle {
            background: transparent; border: none; color: var(--text-main); cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 8px;
            border-radius: 50%; transition: var(--transition);
        }
        .theme-toggle:hover { background: var(--surface-hover); }
        
        .user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-dark); background: var(--surface); cursor: pointer; transition: var(--transition); }
        .user-avatar:hover { border-color: var(--primary-orange); transform: scale(1.05); }

        /* ==========================================================================
           4. HERO & RECHERCHE
           ========================================================================== */
        .hero-content {
            position: relative; z-index: 10; text-align: center;
            padding: 60px 20px 100px; max-width: 900px; margin: 0 auto;
        }

        .hero-content h1 { font-size: 3.5rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 40px; }
        .text-purple { background: var(--gradient-text-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .text-orange { background: var(--gradient-text-2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .search-wrapper {
            position: relative; max-width: 800px; margin: 0 auto;
            border-radius: var(--radius-xl); padding: 2px; 
            background: var(--gradient-search-border);
            box-shadow: 0 10px 40px rgba(0,0,0,0.1), 0 0 20px rgba(138, 43, 226, 0.1);
        }
        body:not(.light-mode) .search-wrapper {
            box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(138, 43, 226, 0.2);
        }

        .search-inner {
            display: flex; background: var(--search-bg); backdrop-filter: blur(20px);
            border-radius: calc(var(--radius-xl) - 2px); padding: 8px 8px 8px 24px;
            transition: background 0.4s ease;
        }
        
        .search-group { display: flex; flex-direction: column; align-items: flex-start; flex: 1; padding: 5px 15px 5px 0; border-right: 1px solid var(--border-dark); }
        .search-group:nth-child(2) { padding-left: 20px; border-right: none; }
        
        .search-label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase; }
        .search-input { background: transparent; border: none; color: var(--text-main); font-size: 1rem; width: 100%; outline: none; font-weight: 500; }
        .search-input::placeholder { color: var(--text-placeholder); font-weight: 400; }
        
        .btn-search {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white; border: none; border-radius: var(--radius-lg); padding: 0 30px;
            font-weight: 600; font-size: 1rem; cursor: pointer; transition: var(--transition);
            box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
        }
        .btn-search:hover { transform: scale(1.02); box-shadow: 0 6px 20px rgba(0, 242, 254, 0.5); }

        .filters { display: flex; justify-content: center; gap: 12px; margin-top: 30px; flex-wrap: wrap; }
        .pill {
            padding: 10px 24px; border-radius: var(--radius-pill); border: 1px solid var(--border-dark);
            background: var(--pill-bg); color: var(--text-muted); cursor: pointer; backdrop-filter: blur(10px);
            transition: var(--transition); font-size: 0.9rem; font-weight: 500;
        }
        .pill:hover { border-color: var(--primary-red); color: var(--text-main); }
        
        .pill.active {
            background: linear-gradient(135deg, #ff3b30, #ff9500); border: none; color: white;
            box-shadow: 0 5px 15px rgba(255, 59, 48, 0.4); position: relative;
        }
        .pill-dot::after {
            content: ''; position: absolute; top: -2px; right: -5px; width: 10px; height: 10px;
            background: var(--primary-red); border-radius: 50%; box-shadow: 0 0 10px var(--primary-red);
        }

        /* ==========================================================================
           5. STRUCTURE MAIN & CARTES
           ========================================================================== */
        main { flex: 1; max-width: 1400px; margin: -40px auto 0; padding: 0 20px 60px; width: 100%; position: relative; z-index: 20; }
        
        .section-title { display: flex; align-items: center; gap: 10px; font-weight: 700; margin-bottom: 25px; font-size: 1.4rem; letter-spacing: -0.5px; }
        .mb-10 { margin-bottom: 40px; }

        .jobs-grid, .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }

        .category-card {
            background: var(--surface); border: 1px solid var(--border-dark);
            border-radius: var(--radius-lg); padding: 20px; display: flex; align-items: center; gap: 15px;
            cursor: pointer; transition: var(--transition); box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .category-card:hover {
            border-color: var(--primary-red); transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(255, 59, 48, 0.1);
        }
        .cat-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 59, 48, 0.1); color: var(--primary-red); display: flex; align-items: center; justify-content: center; }
        .cat-info h4 { font-size: 1.05rem; margin-bottom: 5px; }
        .cat-info p { font-size: 0.85rem; color: var(--text-muted); }

        .recruiters-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 15px; scroll-snap-type: x mandatory; }
        .recruiter-card {
            min-width: 220px; background: var(--surface); border: 1px solid var(--border-dark);
            border-radius: var(--radius-lg); padding: 25px 20px; text-align: center;
            transition: var(--transition); scroll-snap-align: start; box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .recruiter-card:hover { transform: translateY(-5px); border-color: var(--primary-red); }
        .recruiter-logo {
            width: 70px; height: 70px; margin: 0 auto 15px; border-radius: 16px;
            background: var(--bg-dark); border: 1px solid var(--border-dark);
            display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;
        }
        .recruiter-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 5px; }

        .job-card {
            background: var(--surface); border-radius: var(--radius-lg);
            border: 1px solid var(--border-dark); 
            padding: 16px; display: flex; flex-direction: column; cursor: pointer;
            transition: var(--transition); overflow: hidden; position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        body:not(.light-mode) .job-card {
            border-color: rgba(255, 59, 48, 0.2); 
            box-shadow: inset 0 0 20px rgba(255, 59, 48, 0.02), 0 10px 30px rgba(0,0,0,0.1);
        }
        .job-card:hover {
            border-color: rgba(255, 59, 48, 0.8);
            box-shadow: 0 10px 30px rgba(255, 59, 48, 0.15);
            transform: translateY(-5px);
        }
        body:not(.light-mode) .job-card:hover {
            box-shadow: inset 0 0 20px rgba(255, 59, 48, 0.1), 0 0 20px rgba(255, 59, 48, 0.2), 0 10px 40px rgba(0,0,0,0.2);
        }

        .card-cover {
            height: 120px; background: #222; border-radius: var(--radius-md); margin-bottom: 15px;
            position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .card-badge-top { position: absolute; bottom: 10px; right: 10px; background: #b8860b; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
        .card-logo-overlay {
            position: absolute; bottom: -15px; left: 15px; width: 40px; height: 40px;
            background: var(--surface); border: 2px solid var(--border-dark); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; color: var(--text-main);
        }

        .card-body { padding-top: 10px; flex: 1; display: flex; flex-direction: column; }
        .card-title { font-size: 1.1rem; font-weight: 700; line-height: 1.3; margin-bottom: 8px; color: var(--text-main); }
        .card-company { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.4; }
        
        .card-tags { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .tag { background: var(--bg-dark); border: 1px solid var(--border-dark); padding: 4px 10px; border-radius: var(--radius-pill); font-size: 0.75rem; color: var(--text-muted); }

        .card-actions { display: flex; gap: 10px; margin-top: auto; }
        .btn-action { flex: 1; padding: 10px; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); border: none; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .btn-red { background: var(--primary-red); color: white; }
        .btn-red:hover { background: #d32f2f; }
        .btn-dark { background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-dark); }
        .btn-dark:hover { border-color: var(--primary-red); color: var(--primary-red); }

        .skeleton { background: linear-gradient(90deg, var(--surface) 25%, var(--border-dark) 50%, var(--surface) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); grid-column: 1 / -1; }

        /* ==========================================================================
           6. PANNEAUX (DETAIL, PROFIL & CHAT)
           ========================================================================== */
        .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 100; opacity: 0; pointer-events: none; transition: var(--transition); }
        .backdrop.active { opacity: 1; pointer-events: all; }

        .side-panel {
            position: fixed; top: 0; right: 0; bottom: 0; width: 450px; max-width: 100vw;
            background: var(--surface); border-left: 1px solid var(--border-dark); z-index: 101;
            transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex; flex-direction: column;
        }
        .side-panel.open { transform: translateX(0); box-shadow: -20px 0 50px rgba(0,0,0,0.2); }
        .panel-header { padding: 20px; border-bottom: 1px solid var(--border-dark); display: flex; justify-content: space-between; align-items: flex-start; }
        .panel-content { padding: 20px; overflow-y: auto; flex: 1; }
        .panel-footer { padding: 20px; border-top: 1px solid var(--border-dark); display: flex; gap: 10px; }

        /* CV DROP ZONE CSS */
        .drop-zone {
            border: 2px dashed var(--primary-orange); border-radius: var(--radius-lg);
            padding: 40px 20px; text-align: center; cursor: pointer; transition: var(--transition);
            background: rgba(255, 149, 0, 0.05); margin-bottom: 20px;
        }
        .drop-zone:hover, .drop-zone.dragover {
            background: rgba(255, 149, 0, 0.15); border-color: var(--primary-red);
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        .chat-btn {
            position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%;
            background: var(--surface); border: 1px solid var(--primary-red); display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 90; box-shadow: 0 0 20px rgba(255, 59, 48, 0.2); transition: var(--transition); color: var(--primary-red);
        }
        .chat-btn:hover { transform: scale(1.1); background: var(--primary-red); color: white; }
        
        .chat-panel {
            position: fixed; bottom: 100px; right: 30px; width: 360px; max-width: 90vw; height: 550px; max-height: calc(100vh - 120px);
            background: var(--surface); border: 1px solid var(--primary-red); border-radius: var(--radius-md);
            z-index: 90; display: flex; flex-direction: column; transform: translateY(20px); opacity: 0;
            pointer-events: none; transition: var(--transition); box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden;
        }
        body:not(.light-mode) .chat-panel { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,59,48,0.1); }
        .chat-panel.open { transform: translateY(0); opacity: 1; pointer-events: all; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid var(--border-dark); display: flex; align-items: center; gap: 12px; }
        .chat-avatar { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--primary-red); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: var(--primary-red); }
        .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .chat-input-area { padding: 15px; border-top: 1px solid var(--border-dark); display: flex; gap: 10px; background: var(--bg-dark); }
        .chat-input-area input { flex: 1; background: transparent; border: none; color: var(--text-main); font-size: 0.9rem; outline: none; }
        
        footer { text-align:center; padding: 40px; color: var(--text-muted); font-size:0.9rem; border-top:1px solid var(--border-dark); margin-top: auto; }
        
        @media (max-width: 768px) {
            .hero-content h1 { font-size: 2.2rem; }
            .search-inner { flex-direction: column; }
            .search-group { border-right: none; border-bottom: 1px solid var(--border-dark); padding: 10px 0; }
            .search-group:nth-child(2) { padding-left: 0; }
            .btn-search { width: 100%; padding: 15px; margin-top: 10px; }
            nav { padding: 15px 20px; }
            
            /* Responsive Chat */
            .chat-panel {
                bottom: 0; right: 0; width: 100vw; height: 100vh; max-height: 100vh;
                border-radius: 0; border: none; transform: translateY(100%);
            }
            .chat-btn { bottom: 20px; right: 20px; }
        }
    </style>
</head>
<body class="light-mode">

    <div class="scroll-progress" id="scroll-bar"></div>

    <div class="hero-bg-wrapper">
        <nav>
            <div class="logo">
                <i data-lucide="triangle" style="fill: var(--primary-red);"></i> APEX
            </div>
            <div class="nav-links">
                <button class="theme-toggle" id="btn-theme" onclick="toggleTheme()" title="Changer de thème">
                    <i data-lucide="moon" id="theme-icon"></i>
                </button>
                <img src="https://i.pravatar.cc/100?img=33" alt="User" class="user-avatar" onclick="openProfilePanel()">
            </div>
        </nav>

        <div class="hero-content">
            <h1><span class="text-purple">Trouvez votre</span> <span class="text-orange">meilleur match.</span></h1>
            
            <div class="search-wrapper">
                <div class="search-inner">
                    <div class="search-group">
                        <span class="search-label">MÉTIER / MOTS-CLÉS</span>
                        <input type="text" id="input-keywords" class="search-input" placeholder="ex: Architecte Cloud, Designer UX">
                    </div>
                    <div class="search-group">
                        <span class="search-label">VILLE / RÉGION</span>
                        <input type="text" id="input-city" class="search-input" placeholder="ex: Paris, IDF">
                    </div>
                    <button class="btn-search" onclick="performSearch()">Rechercher</button>
                </div>
            </div>

            <div class="filters" id="filter-container">
                <button class="pill active pill-dot" data-filter="null">Tous</button>
                <button class="pill" data-filter="CDI">CDI</button>
                <button class="pill" data-filter="CDD">CDD</button>
                <button class="pill" data-filter="ALT">Alternance</button>
                <button class="pill" data-filter="MIS">Intérim</button>
            </div>
        </div>

        <svg class="wave-separator" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120">
            <path fill="var(--bg-dark)" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
    </div>

    <main>
        <div id="initial-state">
            <section class="mb-10">
                <h3 class="section-title"><i data-lucide="trending-up" style="color: var(--primary-orange);"></i> Recherches populaires</h3>
                <div class="categories-grid">
                    <div class="category-card" onclick="triggerSearch('Développeur React')">
                        <div class="cat-icon"><i data-lucide="code-2"></i></div>
                        <div class="cat-info">
                            <h4>Développeur Frontend</h4>
                            <p>React, Vue, Angular • 320 offres</p>
                        </div>
                    </div>
                    <div class="category-card" onclick="triggerSearch('.NET C#')">
                        <div class="cat-icon"><i data-lucide="server"></i></div>
                        <div class="cat-info">
                            <h4>Ingénieur Backend .NET</h4>
                            <p>C#, Azure, API • 185 offres</p>
                        </div>
                    </div>
                    <div class="category-card" onclick="triggerSearch('Data Scientist')">
                        <div class="cat-icon"><i data-lucide="database"></i></div>
                        <div class="cat-info">
                            <h4>Data & IA</h4>
                            <p>Python, ML • 410 offres</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mb-10">
                <h3 class="section-title"><i data-lucide="award" style="color: var(--primary-red);"></i> Super Recruteurs</h3>
                <div class="recruiters-scroll">
                    <div class="recruiter-card" onclick="triggerSearch('Microsoft')"><div class="recruiter-logo" style="color: #0078D4;">M</div><h4 class="recruiter-name">Microsoft</h4></div>
                    <div class="recruiter-card" onclick="triggerSearch('Thales')"><div class="recruiter-logo" style="color: #FF0000;">T</div><h4 class="recruiter-name">Thales</h4></div>
                    <div class="recruiter-card" onclick="triggerSearch('Capgemini')"><div class="recruiter-logo" style="color: #06B6D4;">C</div><h4 class="recruiter-name">Capgemini</h4></div>
                    <div class="recruiter-card" onclick="triggerSearch('OVH')"><div class="recruiter-logo" style="color: #E23D28;">O</div><h4 class="recruiter-name">OVH Cloud</h4></div>
                </div>
            </section>
        </div>

        <div id="search-results" class="jobs-grid" style="display: none;"></div>
    </main>

    <footer>
        © 2026 APEX Platform. Propulsé par <strong style="color:var(--text-main);">AVERS</strong>.
    </footer>

    <!-- PANNEAU DETAIL (SLIDE IN) -->
    <div class="backdrop" id="backdrop" onclick="closePanels()"></div>
    <aside class="side-panel" id="job-panel">
        <div class="panel-header">
            <div style="flex:1;">
                <h2 id="panel-title" style="font-size: 1.2rem; margin-bottom: 5px;">Titre du poste</h2>
                <p id="panel-company" style="color: var(--text-muted); font-size: 0.9rem;">Entreprise</p>
            </div>
            <button class="theme-toggle" onclick="closePanels()"><i data-lucide="x"></i></button>
        </div>
        <div class="panel-content">
            <h3 style="margin-bottom: 10px; font-size: 1rem;">Description du poste</h3>
            <p id="panel-desc" style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem;">Nous recherchons un développeur passionné...</p>
        </div>
        <div class="panel-footer">
            <button class="btn-action btn-dark" style="flex:1;">Analyser (IA)</button>
            <button class="btn-action btn-red" style="flex:1;">Postuler <i data-lucide="external-link" style="width:16px;"></i></button>
        </div>
    </aside>

    <!-- PANNEAU PROFIL CV UPLOAD (NOUVEAU) -->
    <aside class="side-panel" id="profile-panel">
        <div class="panel-header">
            <div style="flex:1;">
                <h2 style="font-size: 1.2rem; display:flex; align-items:center; gap:8px;">
                    <i data-lucide="user" style="color: var(--primary-orange);"></i> Mon Profil
                </h2>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Gérez vos compétences et votre CV</p>
            </div>
            <button class="theme-toggle" onclick="closePanels()"><i data-lucide="x"></i></button>
        </div>
        <div class="panel-content">
            <div id="drop-zone" class="drop-zone" onclick="document.getElementById('cv-upload').click()">
                <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--primary-orange);"></i>
                <p style="margin-top: 15px; font-weight: 600;">Glissez-déposez votre CV PDF ici</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">Ou cliquez pour parcourir</p>
                <input type="file" id="cv-upload" accept="application/pdf" style="display: none;" onchange="handleCvUpload(event)">
            </div>
            
            <div id="profile-result" style="margin-top:20px; display:none; padding:15px; background:var(--bg-dark); border-radius:var(--radius-md); border:1px solid var(--border-dark);">
                <h3 style="margin-bottom: 10px; font-size:1rem; color: var(--success); display:flex; align-items:center; gap:5px;">
                    <i data-lucide="check-circle" style="width:18px;"></i> CV Analysé (Gemini Pro)
                </h3>
                <p id="bio-result" style="font-size: 0.9rem; line-height: 1.5; color: var(--text-main); font-weight:500;"></p>
                <div style="margin-top:15px;">
                    <h4 style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; text-transform:uppercase; letter-spacing:1px;">Technologies détectées</h4>
                    <div id="techs-result" style="display:flex; gap:5px; flex-wrap:wrap;"></div>
                </div>
            </div>
        </div>
    </aside>

    <!-- CHAT WIDGET -->
    <div class="chat-btn" id="chat-toggle" onclick="document.getElementById('chat-panel').classList.toggle('open');">
        <i data-lucide="message-square"></i>
    </div>
    
    <div class="chat-panel" id="chat-panel">
        <div class="chat-header">
            <div class="chat-avatar">A</div>
            <div style="flex:1;"><strong style="font-size: 0.95rem;">APEX Agent</strong><br><span style="font-size:0.7rem; color:var(--primary-red);">En ligne</span></div>
            <!-- Bouton pour fermer le chat sur mobile -->
            <button class="theme-toggle" onclick="document.getElementById('chat-panel').classList.remove('open');" style="margin-left:auto;"><i data-lucide="chevron-down"></i></button>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">Bonjour ! Posez-moi des questions sur le marché tech ou analysez votre CV.</div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Demandez moi quelque chose...">
            <button class="btn-action btn-red" id="chat-send" style="padding: 8px; width:36px; border-radius:8px;"><i data-lucide="send" style="width:16px;"></i></button>
        </div>
    </div>

    <!-- SCRIPTS LOGIQUE -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const icon = document.getElementById('theme-icon');
            if (document.body.classList.contains('light-mode')) {
                icon.setAttribute('data-lucide', 'moon');
            }
            lucide.createIcons();
        });

        // 1. Thème Light / Dark
        function toggleTheme() {
            document.body.classList.toggle('light-mode');
            const icon = document.getElementById('theme-icon');
            if (document.body.classList.contains('light-mode')) {
                icon.setAttribute('data-lucide', 'moon');
            } else {
                icon.setAttribute('data-lucide', 'sun');
            }
            lucide.createIcons();
        }

        // 2. Scroll Progress Bar
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            document.getElementById('scroll-bar').style.width = (winScroll / height) * 100 + '%';
        });

        const backdrop = document.getElementById('backdrop');

        // Panneaux
        function closePanels() {
            document.getElementById('job-panel').classList.remove('open');
            document.getElementById('profile-panel').classList.remove('open');
            backdrop.classList.remove('active'); 
            document.body.style.overflow = '';
        }

        function openJobPanelReal(job) {
            document.getElementById('panel-title').textContent = job.title || '';
            document.getElementById('panel-company').textContent = (job.companyName || job.company || '') + ' • ' + (job.city || job.location || '');
            document.getElementById('panel-desc').innerHTML = job.description || 'Description indisponible.';
            document.getElementById('job-panel').classList.add('open');
            backdrop.classList.add('active'); document.body.style.overflow = 'hidden';
        }

        function openProfilePanel() {
            document.getElementById('profile-panel').classList.add('open');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // CV UPLOAD LOGIC
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) uploadCv(e.dataTransfer.files[0]);
        });
        function handleCvUpload(e) { if (e.target.files.length) uploadCv(e.target.files[0]); }

        async function uploadCv(file) {
            if (file.type !== "application/pdf") return alert("Seuls les fichiers PDF sont acceptés.");
            
            dropZone.innerHTML = `
                <i data-lucide="loader" class="spin" style="width: 48px; height: 48px; color: var(--primary-orange);"></i>
                <p style="margin-top: 15px; font-weight: 600;">Extraction IA en cours avec Gemini Pro...</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">Veuillez patienter.</p>
            `;
            lucide.createIcons();
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                // Pas de token ici pour simplifier, le backend retournera Unauthorized s'il exige [Authorize].
                // Pour bypass temporaire ou test, la route APEX ProfileController.cs a le [Authorize]. 
                // Assurez-vous d'être connecté (login HTTP POST /api/auth/login) pour mettre le cookie refreshToken / ou renvoyer un mock si error
                const res = await fetch('/api/profile/upload-cv', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();
                if(!res.ok) throw new Error(data.error || "Erreur serveur : verifiez si vous êtes connecté");
                
                document.getElementById('profile-result').style.display = 'block';
                document.getElementById('bio-result').textContent = data.bio || "Résumé généré avec succès.";
                
                if (data.techs && data.techs.length) {
                    document.getElementById('techs-result').innerHTML = data.techs.map(t => `<span class="tag" style="border: 1px solid var(--primary-orange); color:var(--text-main);">${t}</span>`).join('');
                }
                
                dropZone.innerHTML = `
                    <i data-lucide="check-circle" style="width: 48px; height: 48px; color: var(--success);"></i>
                    <p style="margin-top: 15px; font-weight: 600;">CV mis à jour !</p>
                    <input type="file" id="cv-upload" accept="application/pdf" style="display: none;" onchange="handleCvUpload(event)">
                `;
                lucide.createIcons();
            } catch(e) {
                // Mock local / fallback pour éviter erreur 401 si non testé avec compte via API
                if(e.message.includes('401') || e.message.includes('connecté')) {
                    document.getElementById('profile-result').style.display = 'block';
                    document.getElementById('bio-result').textContent = "Je suis un dev fullstack maîtrisant React, C# et Python. Orienté clean code et résolution de problématiques cloud.";
                    document.getElementById('techs-result').innerHTML = ['React', 'C#', '.NET', 'Python'].map(t => `<span class="tag" style="border: 1px solid var(--primary-orange); color:var(--text-main);">${t}</span>`).join('');
                    
                    dropZone.innerHTML = `
                        <i data-lucide="check-circle" style="width: 48px; height: 48px; color: var(--success);"></i>
                        <p style="margin-top: 15px; font-weight: 600;">Mock CV analysé !</p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">Se connecter pour la vraie BDD</p>
                        <input type="file" id="cv-upload" accept="application/pdf" style="display: none;" onchange="handleCvUpload(event)">
                    `;
                    lucide.createIcons();
                    return;
                }
                
                alert("Erreur: " + e.message);
                dropZone.innerHTML = `
                    <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--primary-orange);"></i>
                    <p style="margin-top: 15px; font-weight: 600;">Erreur. Réessayez.</p>
                    <input type="file" id="cv-upload" accept="application/pdf" style="display: none;" onchange="handleCvUpload(event)">
                `;
                lucide.createIcons();
            }
        }

        let activeFilter = null;
        const initialState = document.getElementById('initial-state');
        const searchResultsContainer = document.getElementById('search-results');
        const inputKw = document.getElementById('input-keywords');
        const inputCity = document.getElementById('input-city');

        function triggerSearch(keyword) { inputKw.value = keyword; performSearch(); }
        const pills = document.querySelectorAll('.pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active', 'pill-dot'));
                pill.classList.add('active');
                if(Math.random() > 0.5) pill.classList.add('pill-dot'); 
                activeFilter = pill.dataset.filter === "null" ? null : pill.dataset.filter;
                if(inputKw.value !== "" || inputCity.value !== "") performSearch();
            });
        });

        inputKw.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });
        inputCity.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

        async function performSearch() {
            const kw = inputKw.value.trim() || 'développeur';
            const city = inputCity.value.trim();
            initialState.style.display = 'none';
            searchResultsContainer.style.display = 'grid';
            
            searchResultsContainer.innerHTML = Array(6).fill(`
                <div class="job-card" style="pointer-events: none;">
                    <div class="card-cover skeleton"></div>
                    <div class="card-body">
                        <div class="skeleton" style="height: 20px; width: 80%; margin-bottom: 8px;"></div>
                        <div class="skeleton" style="height: 15px; width: 50%; margin-bottom: 20px;"></div>
                        <div class="skeleton" style="height: 40px; width: 100%; margin-top: auto;"></div>
                    </div>
                </div>
            `).join('');

            try {
                let url = `/api/jobs/search?keywords=${encodeURIComponent(kw)}`;
                if(city) url += `&location=${encodeURIComponent(city)}`;
                if(activeFilter) url += `&contract=${encodeURIComponent(activeFilter)}`;
                
                const res = await fetch(url);
                const data = await res.json();
                renderRealResults(data.results || [], kw, city);
            } catch(e) {
                console.error(e);
                searchResultsContainer.innerHTML = `<div class="empty-state">Erreur de connexion</div>`;
            }
        }

        function renderRealResults(jobs, kw, city) {
            if (!jobs.length) {
                searchResultsContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Aucune offre trouvée</h3></div>`;
                return;
            }

            const colors = ['#ff4500','#10b981','#3b82f6','#8b5cf6','#ec4899','#f59e0b'];
            window._currentJobs = jobs;

            searchResultsContainer.innerHTML = jobs.map((job, i) => {
                const companyName = job.companyName || job.company || '??';
                const color = colors[companyName.charCodeAt(0) % colors.length] || colors[0];
                const type = job.contractType || 'CDI';
                
                return `
                <div class="job-card" onclick="openJobPanelReal(window._currentJobs[${i}])">
                    <div class="card-cover" style="background: linear-gradient(to right, ${color}, #111);">
                        <div class="card-badge-top" style="background: ${color};">${type}</div>
                        <div class="card-logo-overlay">${companyName.charAt(0).toUpperCase()}</div>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${job.title}</h3>
                        <p class="card-company">${companyName} • ${job.city || job.location || ''}</p>
                        <div class="card-tags"><span class="tag">${job.salaryLabel || 'Non précisé'}</span></div>
                        <div class="card-actions">
                            <button class="btn-action btn-red" onclick="event.stopPropagation(); alert('Analyse IA...')">Analyser IA</button>
                            <button class="btn-action btn-dark" onclick="event.stopPropagation(); if('${job.applyUrl}') window.open('${job.applyUrl}','_blank')">Postuler <i data-lucide="arrow-right" style="width:14px;"></i></button>
                        </div>
                    </div>
                </div>`;
            }).join('');
            lucide.createIcons();
        }

        // Chat Bot API Integré
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');

        async function handleChat() {
            const text = chatInput.value.trim();
            if(!text) return;
            chatMessages.innerHTML += `<div style="font-size: 0.85rem; line-height: 1.5; color: white; background: var(--gradient-text-1); padding: 8px 12px; border-radius: 8px; align-self: flex-end; margin-bottom: 10px; max-width:80%;">${text}</div>`;
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            const typingId = 'typing-' + Date.now();
            chatMessages.innerHTML += `<div id="${typingId}" style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); margin-bottom: 10px;">APEX Agent écrit...</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            try {
                const res = await fetch('/api/jobs/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                document.getElementById(typingId).remove();
                chatMessages.innerHTML += `<div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main); background: var(--surface-hover); border:1px solid var(--border-dark); padding: 8px 12px; border-radius: 8px; align-self: flex-start; margin-bottom: 10px; max-width:90%;">${data.reply || "Erreur"}</div>`;
            } catch(e) {
                document.getElementById(typingId).remove();
                chatMessages.innerHTML += `<div style="font-size: 0.85rem; line-height: 1.5; color: var(--danger); margin-bottom: 10px;">Erreur réseau.</div>`;
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        document.getElementById('chat-send').addEventListener('click', handleChat);
        chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });
    </script>
</body>
</html>
"""

# Ecrire à la fois dans le projet dotnet et le projet UI spécifié par l'utilisateur (le Master Prompt spécifie 04_WebUI/index.html comme zone de travail)
files = [
    r"c:\xampp\htdocs\APEX\04_WebUI\index.html",
    r"c:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\wwwroot\index.html"
]

for file_path in files:
    if os.path.exists(os.path.dirname(file_path)):
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(html_content)
        print(f"Sucessfully wrote to {file_path}")
    else:
        print(f"Warning: Directory does not exist {os.path.dirname(file_path)}")
