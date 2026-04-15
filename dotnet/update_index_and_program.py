import os
import re

INDEX_PATH = r"C:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\wwwroot\index.html"
PROGRAM_PATH = r"C:\xampp\htdocs\APEX\dotnet\APEX.WebAPI\Program.cs"

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
           1. CSS VARIABLES & THEME (SaaS Sombre + Rouge/Orangé)
           ========================================================================== */
        :root {
            --bg: #0a0a0c;
            --surface: #121216;
            --surface-hover: #1a1a20;
            --border: #262630;
            
            --primary: #ff4500;
            --primary-light: #ff6a33;
            --primary-dark: #cc3700;
            --primary-glow: rgba(255, 69, 0, 0.25);
            --gradient-main: linear-gradient(135deg, #ff0044 0%, #ff6a00 100%);
            
            --text-main: #ffffff;
            --text-muted: #8b8b9e;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            
            --radius-md: 12px;
            --radius-lg: 20px;
            --radius-pill: 9999px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }

        body {
            background-color: var(--bg); color: var(--text-main);
            min-height: 100vh; overflow-x: hidden; display: flex; flex-direction: column;
        }

        /* Scrollbar personnalisée */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        /* Scroll Progress Bar (NOUVEAU) */
        .scroll-progress {
            position: fixed; top: 0; left: 0; height: 3px;
            background: var(--gradient-main); width: 0%; z-index: 1000;
            transition: width 0.1s ease-out;
        }

        /* Arrière-plan dynamique (Grille + Glow + Orbes) */
        .bg-pattern {
            position: absolute; top: 0; left: 0; right: 0; height: 100vh;
            background-image: radial-gradient(var(--border) 1px, transparent 1px);
            background-size: 30px 30px; z-index: -2; opacity: 0.5;
        }
        .orbs-container { position: fixed; inset: 0; overflow: hidden; z-index: -1; pointer-events: none; }
        .orb {
            position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15;
            animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .orb-1 { background: var(--primary); width: 600px; height: 600px; top: -200px; left: 10%; }
        .orb-2 { background: #ff0044; width: 500px; height: 500px; bottom: -100px; right: 5%; animation-delay: -5s; }
        .orb-3 { background: #ff8022; width: 400px; height: 400px; top: 40%; left: 50%; transform: translate(-50%, -50%); animation-duration: 25s; }
        
        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(60px, 40px) scale(1.1); }
        }

        /* Animations Globales (NOUVEAU) */
        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(255, 69, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 69, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 69, 0, 0); }
        }

        /* ==========================================================================
           2. TYPOGRAPHIE & UTILITAIRES
           ========================================================================== */
        .text-gradient {
            background: var(--gradient-main); -webkit-background-clip: text;
            -webkit-text-fill-color: transparent; display: inline-block;
        }
        .mb-4 { margin-bottom: 16px; }
        .mb-10 { margin-bottom: 40px; }
        .section-title {
            display: flex; align-items: center; gap: 10px; font-weight: 700;
            margin-bottom: 25px; font-size: 1.4rem; letter-spacing: -0.5px;
        }

        .btn {
            background: var(--surface); color: var(--text-main); border: 1px solid var(--border);
            padding: 10px 20px; border-radius: var(--radius-md); cursor: pointer;
            font-weight: 500; font-size: 0.9rem; transition: var(--transition);
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            position: relative; overflow: hidden;
        }
        .btn:hover { background: var(--surface-hover); border-color: var(--text-muted); }
        
        /* Effet de lien (NOUVEAU) */
        .nav-link {
            position: relative; padding: 5px 0; color: var(--text-muted);
            text-decoration: none; transition: var(--transition); font-weight: 500;
            display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .nav-link:hover { color: var(--text-main); }
        .nav-link::after {
            content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px;
            background: var(--gradient-main); transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        .btn-primary {
            background: var(--gradient-main); color: white; border: none;
            box-shadow: 0 4px 15px var(--primary-glow);
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #ff1a55 0%, #ff8022 100%);
            box-shadow: 0 6px 25px var(--primary-glow); transform: translateY(-2px);
        }

        /* ==========================================================================
           3. NAVBAR & HERO
           ========================================================================== */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 20px 40px; backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.05); position: sticky; top: 0; z-index: 50;
        }
        .logo { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -1px; }
        .logo i { color: var(--primary); }
        .nav-links { display: flex; gap: 30px; align-items: center; }

        .hero { text-align: center; padding: 60px 20px 40px; max-width: 800px; margin: 0 auto; }
        
        /* Live Badge (NOUVEAU) */
        .live-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(255, 69, 0, 0.05); border: 1px solid rgba(255, 69, 0, 0.2);
            padding: 6px 16px; border-radius: var(--radius-pill);
            font-size: 0.85rem; color: var(--primary-light); margin-bottom: 25px;
            box-shadow: 0 0 15px rgba(255, 69, 0, 0.1);
        }
        .pulse-dot {
            width: 8px; height: 8px; background: var(--primary); border-radius: 50%;
            animation: pulse-ring 2s infinite;
        }

        .hero h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 20px; letter-spacing: -1px; }
        .hero p { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 40px; }

        /* Search Bar */
        .search-container {
            display: flex; background: rgba(18, 18, 22, 0.7); backdrop-filter: blur(12px);
            border: 1px solid var(--border); border-radius: var(--radius-pill);
            padding: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transition: var(--transition);
        }
        .search-container:focus-within { border-color: var(--primary); box-shadow: 0 0 20px var(--primary-glow); }
        .search-input-group {
            display: flex; align-items: center; flex: 1; padding: 0 20px; gap: 10px; border-right: 1px solid var(--border);
            transition: var(--transition);
        }
        .search-input-group:focus-within i { color: var(--primary); } /* NOUVEAU: Icone s'allume au focus */
        .search-input-group:last-of-type { border-right: none; }
        .search-input-group i { color: var(--text-muted); transition: var(--transition); }
        .search-input-group input { background: transparent; border: none; color: white; font-size: 1rem; width: 100%; outline: none; }
        .search-input-group input::placeholder { color: var(--text-muted); }
        
        /* Filtres */
        .filters { display: flex; justify-content: center; gap: 10px; margin-top: 30px; flex-wrap: wrap; }
        .pill {
            padding: 8px 16px; border-radius: var(--radius-pill); border: 1px solid var(--border);
            background: transparent; color: var(--text-muted); cursor: pointer;
            transition: var(--transition); font-size: 0.9rem;
        }
        .pill:hover { border-color: var(--text-main); color: var(--text-main); }
        .pill.active { background: var(--primary); border-color: var(--primary); color: white; box-shadow: 0 0 15px var(--primary-glow); }

        /* ==========================================================================
           4. STRUCTURE PRINCIPALE & COMPOSANTS
           ========================================================================== */
        main { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; }
        
        /* Grille Catégories */
        .categories-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .category-card {
            background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border);
            border-radius: var(--radius-md); padding: 20px; display: flex; align-items: center; gap: 15px;
            cursor: pointer; transition: var(--transition); backdrop-filter: blur(10px);
        }
        .category-card:hover {
            background: rgba(255, 69, 0, 0.05); border-color: var(--primary-light);
            transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.3), 0 0 15px var(--primary-glow);
        }
        .cat-icon {
            width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 69, 0, 0.1);
            color: var(--primary); display: flex; align-items: center; justify-content: center;
        }
        .cat-info h4 { font-size: 1.05rem; margin-bottom: 5px; color: var(--text-main); }
        .cat-info p { font-size: 0.85rem; color: var(--text-muted); }

        /* Super Recruteurs */
        .recruiters-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 15px; scroll-snap-type: x mandatory; }
        .recruiter-card {
            min-width: 220px; background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-lg); padding: 25px 20px; text-align: center;
            transition: var(--transition); scroll-snap-align: start; position: relative; overflow: hidden;
        }
        .recruiter-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
            background: var(--gradient-main); opacity: 0; transition: var(--transition);
        }
        .recruiter-card:hover { transform: translateY(-5px); border-color: var(--primary-dark); }
        .recruiter-card:hover::before { opacity: 1; }
        .recruiter-logo {
            width: 70px; height: 70px; margin: 0 auto 15px; border-radius: 16px;
            background: var(--bg); border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;
        }
        .recruiter-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 5px; }
        .recruiter-count { color: var(--primary); font-size: 0.85rem; font-weight: 600; background: rgba(255,69,0,0.1); padding: 4px 10px; border-radius: var(--radius-pill); display: inline-block; }

        /* Grille Offres */
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .job-card {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-lg); padding: 24px; cursor: pointer;
            transition: var(--transition); position: relative; overflow: hidden; display: flex; flex-direction: column;
        }
        .job-card::before {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
            background: var(--gradient-main); opacity: 0; transition: var(--transition);
        }
        .job-card:hover {
            transform: translateY(-5px); border-color: var(--primary-dark);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow);
        }
        .job-card:hover::before { opacity: 1; }

        .card-header { display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start; }
        .company-avatar {
            width: 48px; height: 48px; border-radius: 12px; background: var(--bg); border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;
        }
        .job-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 5px; line-height: 1.3; }
        .job-company { color: var(--text-muted); font-size: 0.9rem; }
        
        .card-badges { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .badge {
            background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px;
            font-size: 0.8rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; border: 1px solid transparent;
        }
        .badge.highlight { color: var(--primary); background: rgba(255,69,0,0.1); border-color: rgba(255,69,0,0.2); }
        .badge.success { color: var(--success); background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
        
        .card-footer {
            display: flex; justify-content: space-between; align-items: center;
            border-top: 1px solid var(--border); padding-top: 15px; margin-top: auto;
        }

        /* Loading & Empty States */
        .skeleton {
            background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
            background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); grid-column: 1 / -1; }
        .empty-state i { width: 48px; height: 48px; margin-bottom: 15px; opacity: 0.5; }

        /* ==========================================================================
           5. PANNEAUX (DETAIL & CHAT)
           ========================================================================== */
        .backdrop {
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            z-index: 100; opacity: 0; pointer-events: none; transition: var(--transition);
        }
        .backdrop.active { opacity: 1; pointer-events: all; }

        .side-panel {
            position: fixed; top: 0; right: 0; bottom: 0; width: 450px; max-width: 100vw;
            background: var(--bg); border-left: 1px solid var(--border); z-index: 101;
            transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex; flex-direction: column;
        }
        .side-panel.open { transform: translateX(0); box-shadow: -20px 0 50px rgba(0,0,0,0.5); }
        .panel-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
        .panel-content { padding: 20px; overflow-y: auto; flex: 1; }
        .panel-footer { padding: 20px; border-top: 1px solid var(--border); display: flex; gap: 10px; }

        .chat-btn {
            position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%;
            background: var(--gradient-main); display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 90; box-shadow: 0 10px 20px var(--primary-glow); transition: var(--transition);
        }
        .chat-btn:hover { transform: scale(1.1); }
        .chat-panel {
            position: fixed; bottom: 100px; right: 30px; width: 380px; height: 500px;
            background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
            z-index: 90; display: flex; flex-direction: column; transform: translateY(20px); opacity: 0;
            pointer-events: none; transition: var(--transition); box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;
        }
        .chat-panel.open { transform: translateY(0); opacity: 1; pointer-events: all; }
        .chat-header { padding: 15px 20px; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .chat-input-area { padding: 15px; border-top: 1px solid var(--border); display: flex; gap: 10px; }
        .chat-input-area input { flex: 1; background: var(--bg); border: 1px solid var(--border); color: white; padding: 10px 15px; border-radius: var(--radius-md); outline: none; }
        .chat-input-area input:focus { border-color: var(--primary); }
        .msg { max-width: 80%; padding: 12px 16px; border-radius: 12px; font-size: 0.95rem; line-height: 1.4; }
        .msg-bot { background: var(--border); align-self: flex-start; border-bottom-left-radius: 4px; }
        .msg-user { background: var(--gradient-main); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }

        /* ==========================================================================
           6. FOOTER
           ========================================================================== */
        footer {
            border-top: 1px solid var(--border); padding: 40px 20px; margin-top: auto;
            background: rgba(10, 10, 12, 0.8); backdrop-filter: blur(10px);
        }
        .footer-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .footer-text { color: var(--text-muted); font-size: 0.95rem; }
        .footer-links { display: flex; gap: 20px; }
        .footer-links a { color: var(--text-muted); text-decoration: none; transition: var(--transition); font-size: 0.9rem; }
        .footer-links a:hover { color: var(--primary); }

    </style>
</head>
<body>

    <!-- Scroll Progress Bar -->
    <div class="scroll-progress" id="scroll-bar"></div>

    <div class="bg-pattern"></div>
    <div class="orbs-container">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
    </div>

    <!-- NAVBAR -->
    <nav>
        <div class="logo">
            <i data-lucide="triangle"></i>
            APEX
        </div>
        <div class="nav-links">
            <span class="nav-link"><i data-lucide="user" style="width: 18px;"></i> Mon Profil</span>
            <button class="btn btn-primary" onclick="alert('Modal Connexion à implémenter')">Se connecter</button>
        </div>
    </nav>

    <!-- HERO & RECHERCHE -->
    <header class="hero">
        <div class="live-badge">
            <span class="pulse-dot"></span> 1 204 offres analysées par l'IA aujourd'hui
        </div>
        
        <h1>Trouvez votre <span class="text-gradient">meilleur match</span></h1>
        <p>L'IA analyse chaque offre tech pour vous. Score, verdict, justification — en quelques secondes.</p>

        <div class="search-container">
            <div class="search-input-group">
                <i data-lucide="search"></i>
                <input type="text" id="input-keywords" placeholder="Métier, technos (ex: React, Data)">
            </div>
            <div class="search-input-group">
                <i data-lucide="map-pin"></i>
                <input type="text" id="input-city" placeholder="Ville ou région (ex: Paris, IDF)">
            </div>
            <button class="btn btn-primary" style="border-radius: var(--radius-pill); padding: 12px 24px;" id="btn-search">
                Rechercher
            </button>
        </div>

        <div class="filters" id="filter-container">
            <button class="pill active" data-filter="null">Tous</button>
            <button class="pill" data-filter="CDI">CDI</button>
            <button class="pill" data-filter="CDD">CDD</button>
            <button class="pill" data-filter="ALT">Alternance</button>
            <button class="pill" data-filter="MIS">Intérim</button>
        </div>
    </header>

    <!-- MAIN CONTENT -->
    <main>
        
        <!-- ================= ÉTAT INITIAL (AVANT RECHERCHE) ================= -->
        <div id="initial-state">
            
            <!-- 1. Recherches Populaires -->
            <section class="mb-10">
                <h3 class="section-title">
                    <i data-lucide="trending-up" style="color: var(--primary);"></i> Recherches populaires
                </h3>
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
                    <div class="category-card" onclick="triggerSearch('DevOps')">
                        <div class="cat-icon"><i data-lucide="cloud"></i></div>
                        <div class="cat-info">
                            <h4>Cloud & DevOps</h4>
                            <p>Docker, AWS • 250 offres</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 2. Super Recruteurs -->
            <section class="mb-10">
                <h3 class="section-title">
                    <i data-lucide="award" style="color: var(--warning);"></i> Super Recruteurs
                </h3>
                <div class="recruiters-scroll">
                    <div class="recruiter-card">
                        <div class="recruiter-logo" style="color: #0078D4;">M</div>
                        <h4 class="recruiter-name">Microsoft</h4>
                        <span class="recruiter-count">42 offres tech</span>
                    </div>
                    <div class="recruiter-card">
                        <div class="recruiter-logo" style="color: #FF0000;">T</div>
                        <h4 class="recruiter-name">Thales</h4>
                        <span class="recruiter-count">28 offres tech</span>
                    </div>
                    <div class="recruiter-card">
                        <div class="recruiter-logo" style="color: #000000; background: white;">D</div>
                        <h4 class="recruiter-name">Doctolib</h4>
                        <span class="recruiter-count">15 offres tech</span>
                    </div>
                    <div class="recruiter-card">
                        <div class="recruiter-logo" style="color: #E23D28;">O</div>
                        <h4 class="recruiter-name">OVH Cloud</h4>
                        <span class="recruiter-count">34 offres tech</span>
                    </div>
                    <div class="recruiter-card">
                        <div class="recruiter-logo" style="color: #06B6D4;">C</div>
                        <h4 class="recruiter-name">Capgemini</h4>
                        <span class="recruiter-count">112 offres tech</span>
                    </div>
                </div>
            </section>

            <!-- 3. Offres Récentes (Pré-chargées) -->
            <section>
                <h3 class="section-title">
                    <i data-lucide="clock" style="color: var(--success);"></i> Ajoutées récemment
                </h3>
                <div class="jobs-grid">
                    <!-- Offre 1 -->
                    <div class="job-card" onclick="openJobPanel('Ingénieur Cybersécurité', 'DefensIA', 'Paris', 'CDI', '60k - 75k')">
                        <div class="card-header">
                            <div class="company-avatar" style="color: #3b82f6;">D</div>
                            <div style="flex: 1;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <h3 class="job-title">Ingénieur Cybersécurité</h3>
                                    <span class="badge highlight" style="font-size: 0.7rem; padding: 2px 6px;">Nouveau</span>
                                </div>
                                <span class="job-company">DefensIA</span>
                            </div>
                        </div>
                        <div class="card-badges">
                            <span class="badge"><i data-lucide="map-pin" style="width:14px;"></i> Paris</span>
                            <span class="badge"><i data-lucide="file-text" style="width:14px;"></i> CDI</span>
                            <span class="badge"><i data-lucide="clock" style="width:14px;"></i> Il y a 2h</span>
                        </div>
                        <div class="card-footer">
                            <button class="btn" style="font-size: 0.8rem;" onclick="event.stopPropagation(); alert('Analyse IA...')">Analyser IA</button>
                            <button class="btn btn-primary" style="font-size: 0.8rem; padding: 6px 12px;">Postuler <i data-lucide="arrow-right" style="width:14px;"></i></button>
                        </div>
                    </div>
                    
                    <!-- Offre 2 -->
                    <div class="job-card" onclick="openJobPanel('Développeur Vue.js Senior', 'StartUp Studio', 'Remote', 'CDI', '50k - 60k')">
                        <div class="card-header">
                            <div class="company-avatar" style="color: #10b981;">S</div>
                            <div style="flex: 1;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <h3 class="job-title">Développeur Vue.js Senior</h3>
                                    <span class="badge" style="color: var(--warning); background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); font-size: 0.7rem; padding: 2px 6px;">Urgent</span>
                                </div>
                                <span class="job-company">StartUp Studio</span>
                            </div>
                        </div>
                        <div class="card-badges">
                            <span class="badge"><i data-lucide="globe" style="width:14px;"></i> Remote</span>
                            <span class="badge"><i data-lucide="file-text" style="width:14px;"></i> CDI</span>
                            <span class="badge"><i data-lucide="clock" style="width:14px;"></i> Il y a 5h</span>
                        </div>
                        <div class="card-footer">
                            <button class="btn" style="font-size: 0.8rem;" onclick="event.stopPropagation(); alert('Analyse IA...')">Analyser IA</button>
                            <button class="btn btn-primary" style="font-size: 0.8rem; padding: 6px 12px;">Postuler <i data-lucide="arrow-right" style="width:14px;"></i></button>
                        </div>
                    </div>
                </div>
            </section>

        </div>

        <!-- ================= RÉSULTATS DE RECHERCHE DYNAMIQUE ================= -->
        <div id="search-results" class="jobs-grid" style="display: none;">
            <!-- Rempli par le JavaScript -->
        </div>

    </main>

    <!-- FOOTER MODIFIÉ AVEC AVERS -->
    <footer>
        <div class="footer-content">
            <div class="logo" style="font-size: 1.2rem;">
                <i data-lucide="triangle" style="width:20px;"></i> APEX
            </div>
            <div class="footer-text">
                © 2026 APEX Platform. Propulsé par <span class="text-gradient" style="font-weight: 800;">AVERS</span>.
            </div>
            <div class="footer-links">
                <a href="#">Confidentialité</a>
                <a href="#">Conditions</a>
                <a href="#">Contact</a>
            </div>
        </div>
    </footer>

    <!-- PANNEAU DETAIL (SLIDE IN) -->
    <div class="backdrop" id="backdrop"></div>
    <aside class="side-panel" id="job-panel">
        <div class="panel-header">
            <div style="flex:1;">
                <h2 id="panel-title" style="font-size: 1.2rem; margin-bottom: 5px; line-height: 1.3;">Titre du poste</h2>
                <p id="panel-company" style="color: var(--text-muted); font-size: 0.9rem;">Entreprise</p>
            </div>
            <button class="btn" id="close-panel" style="padding: 8px;"><i data-lucide="x"></i></button>
        </div>
        <div class="panel-content">
            <div class="card-badges" style="margin-bottom: 20px;">
                <span class="badge"><i data-lucide="map-pin" style="width:14px;"></i> <span id="panel-location">Paris</span></span>
                <span class="badge"><i data-lucide="file-text" style="width:14px;"></i> <span id="panel-contract">CDI</span></span>
                <span class="badge success"><i data-lucide="banknote" style="width:14px;"></i> <span id="panel-salary">45k - 55k</span></span>
            </div>
            <h3 style="margin-bottom: 10px; font-size: 1rem;">Description du poste</h3>
            <p style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem;">
                Nous recherchons un développeur passionné pour rejoindre notre équipe technique. Vous travaillerez sur des architectures complexes et des interfaces modernes.<br><br>
                Missions :<br>
                - Conception et développement web<br>
                - Optimisation des performances<br>
                - Code review et bonnes pratiques
            </p>
            <div class="skills-container" style="display:flex; gap:4px; flex-wrap:wrap; margin-top:15px; margin-bottom: 15px;"></div>
            <div style="margin-top: 30px; padding: 15px; border-radius: 8px; border: 1px solid var(--primary-glow); background: rgba(255, 69, 0, 0.05);">
                <h4 style="color: var(--primary); display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <i data-lucide="sparkles" style="width:16px;"></i> Analyse APEX IA
                </h4>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Match estimé : 85%. Les compétences demandées correspondent bien à votre profil. Attention cependant à l'expérience requise (3 ans) qui pourrait être un point bloquant.</p>
            </div>
        </div>
        <div class="panel-footer">
            <button class="btn" style="flex:1;">Analyser (IA)</button>
            <button class="btn btn-primary" style="flex:1;">Postuler <i data-lucide="external-link" style="width:16px;"></i></button>
        </div>
    </aside>

    <!-- CHAT WIDGET -->
    <div class="chat-btn" id="chat-toggle">
        <i data-lucide="message-circle" style="color: white;"></i>
    </div>
    
    <div class="chat-panel" id="chat-panel">
        <div class="chat-header">
            <div class="pulse-dot" style="background: var(--success); width: 10px; height: 10px;"></div>
            <strong>APEX Agent</strong>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div class="msg msg-bot">Bonjour ! Je suis APEX Agent, expert emploi tech. Que cherchez-vous aujourd'hui ? 🚀</div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Posez une question...">
            <button class="btn btn-primary" id="chat-send" style="padding: 10px;"><i data-lucide="send" style="width:16px;"></i></button>
        </div>
    </div>

    <!-- SCRIPTS (Vanilla JS) -->
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
            document.getElementById('scroll-bar').style.width = scrolled + '%';
        });

        // 2. Gestion de l'état UI
        let activeFilter = null;
        const initialState = document.getElementById('initial-state');
        const searchResultsContainer = document.getElementById('search-results');
        const inputKw = document.getElementById('input-keywords');
        const inputCity = document.getElementById('input-city');

        function triggerSearch(keyword) {
            inputKw.value = keyword;
            performSearch();
        }

        // 3. Gestion des filtres (Pills)
        const pills = document.querySelectorAll('.pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFilter = pill.dataset.filter === "null" ? null : pill.dataset.filter;
                
                if(inputKw.value !== "" || inputCity.value !== "") {
                    performSearch();
                }
            });
        });

        // 4. Logique de Recherche
        document.getElementById('btn-search').addEventListener('click', performSearch);
        inputKw.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });
        inputCity.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

async function performSearch() {
  const kw = inputKw.value.trim();
  const city = inputCity.value.trim();
  if (!kw && !city) {
    initialState.style.display = 'block';
    searchResultsContainer.style.display = 'none';
    return;
  }
  initialState.style.display = 'none';
  searchResultsContainer.style.display = 'grid';
  
  // Skeletons (garde les skeletons existants)
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
  if (activeFilter) params.set('contract', activeFilter);

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
          onclick="inputKw.value='';inputCity.value='';performSearch()">
          Réinitialiser
        </button>
      </div>`;
    lucide.createIcons();
    return;
  }

  const colors = ['#ff4500','#10b981','#3b82f6','#8b5cf6','#ec4899','#f59e0b'];
  
  searchResultsContainer.innerHTML = jobs.map(job => {
    const color = colors[(job.companyName || job.company || '').charCodeAt(0) % colors.length];
    const initials = (job.companyName || job.company || '??').substring(0,2).toUpperCase();
    const salary = job.salaryLabel || 'Salaire non précisé';
    const isSalaryKnown = job.salaryMin || (salary && salary !== 'Salaire non précisé');
    const badgeMap = `<span class="badge"><i data-lucide="map-pin" style="width:14px;"></i>${escHtml(job.city || job.location)}</span>`;
    
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
          <span class="job-company">${escHtml(job.companyName || job.company || 'Entreprise')}</span>
        </div>
      </div>
      <div class="card-badges">
        ${(job.city || job.location) ? badgeMap : ''}
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
  
  // Click handlers pour le panel
  searchResultsContainer.querySelectorAll('.job-card').forEach((card, i) => {
    card.addEventListener('click', () => openJobPanelReal(jobs[i]));
  });
}

        // 5. Gestion du Panneau Latéral
        const panel = document.getElementById('job-panel');
        const backdrop = document.getElementById('backdrop');
        const closeBtn = document.getElementById('close-panel');

function openJobPanelReal(job) {
  const color = ['#ff4500','#10b981','#3b82f6','#8b5cf6'][
    (job.companyName || job.company || '').charCodeAt(0) % 4
  ];
  const initials = (job.companyName || job.company || '??').substring(0,2).toUpperCase();
  
  document.getElementById('panel-title').textContent = job.title || '';
  document.getElementById('panel-company').textContent = job.companyName || job.company || '';
  document.getElementById('panel-location').textContent = job.city || job.location || 'Non précisé';
  document.getElementById('panel-contract').textContent = job.contractLabel || job.contractType || '';
  document.getElementById('panel-salary').textContent = job.salaryLabel || 'Non précisé';
  
  // Description
  const desc = document.querySelector('.panel-content p') || 
               document.querySelector('#job-panel .panel-content p');
  if (desc) desc.textContent = job.description || 'Pas de description disponible.';
  
  // Badges tech skills
  const techContainer = document.querySelector('.panel-content .skills-container');
  if (techContainer) {
    if (job.techSkills?.length || job.requiredTechs?.length) {
      const skills = job.techSkills || job.requiredTechs;
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
    postulerBtn.onclick = () => window.open((job.applyUrl || job.originUrl), '_blank');
  }
  
  panel.classList.add('open');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

        function closeJobPanel() {
            panel.classList.remove('open');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeJobPanel);
        backdrop.addEventListener('click', closeJobPanel);

        // 6. Gestion du Chat
        const chatToggle = document.getElementById('chat-toggle');
        const chatPanel = document.getElementById('chat-panel');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatMessages = document.getElementById('chat-messages');

        chatToggle.addEventListener('click', () => {
            chatPanel.classList.toggle('open');
            if(chatPanel.classList.contains('open')) chatInput.focus();
        });

        function appendMessage(text, isUser) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg ${isUser ? 'msg-user' : 'msg-bot'}`;
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

async function handleChat() {
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
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
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

        chatSend.addEventListener('click', handleChat);
        chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });

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
</html>"""

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(html_content)

with open(PROGRAM_PATH, 'r', encoding='utf-8') as f:
    program_content = f.read()

# Add CORS configuration
cors_config = """
builder.Services.AddCors(options => {
  options.AddPolicy("ApexPolicy", policy => {
    policy
      .WithOrigins(
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://localhost:5188",
        "null"
      )
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials();
  });
});
"""

# Replace existing CORS if any, or insert before builder.Build()
if "AddCors" in program_content:
    program_content = re.sub(r'builder\.Services\.AddCors.*?\}\);', cors_config, program_content, flags=re.DOTALL)
else:
    program_content = program_content.replace('var app = builder.Build();', f'{cors_config}\nvar app = builder.Build();')

# Inject UseCors before app.UseAuthorization
if 'app.UseCors("ApexPolicy");' not in program_content:
    if 'app.UseAuthorization();' in program_content:
        program_content = program_content.replace('app.UseAuthorization();', 'app.UseCors("ApexPolicy");\napp.UseAuthorization();')
    else:
        # Fallback just before MapControllers
        program_content = program_content.replace('app.MapControllers();', 'app.UseCors("ApexPolicy");\napp.MapControllers();')

with open(PROGRAM_PATH, 'w', encoding='utf-8') as f:
    f.write(program_content)

print("Updated perfectly.")
