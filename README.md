<div align="center">

# ▲ APEX

### **Automated Placement & Experience**

*Plus qu'un tracker. Un agent de représentation.*

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Status](https://img.shields.io/badge/Status-MVP-blueviolet?style=for-the-badge)
![Agents](https://img.shields.io/badge/Agents-3_Active-00d4aa?style=for-the-badge)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

---

**APEX ne suit pas tes candidatures. Il les pilote.**

Un écosystème d'agents IA autonomes qui source, analyse et relance pour toi.
Tu ne cherches plus un job — ton agent te trouve les bons.

</div>

---

##  Concept

Les job boards sont des cimetières à CV. Les recruteurs ghostent. Le marché est un jeu — et il faut un système pour le jouer.

**APEX** est un framework d'agents Python conçu pour :
- **Sourcer** les offres pertinentes automatiquement.
- **Scorer** chaque offre vs ton profil réel (techs + soft skills).
- **Rédiger** des candidatures ciblées et des relances calibrées.
- **Décider** GO ou NO-GO — sans émotion, avec de la data.

> *"Pas de sentiment, que de la data."*

---

## 🏗 Architecture des Sous-Agents

```
┌─────────────────────────────────────────────┐
│              APEX ORCHESTRATOR              │
│                                             │
│  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │  SCRAPER  │──│  ANALYST  │──│  GHOST  │ │
│  │  Agent    │  │  Agent    │  │  WRITER │ │
│  │           │  │           │  │  Agent  │ │
│  │ Sourcing  │  │ Matching  │  │ Relance │ │
│  │ d'offres  │  │ & Scoring │  │ & Msg   │ │
│  └───────────┘  └───────────┘  └─────────┘ │
│       │              │              │       │
│       └──── Context Pipeline ───────┘       │
└─────────────────────────────────────────────┘
```

| Agent | Rôle | Status |
|-------|------|--------|
| **[SCRAPER]** | Source les offres (LinkedIn, Indeed, WttJ) | 🟡 Stub (démo) |
| **[ANALYST]** | Compare offre vs profil, calcule Match Score | 🟢 Fonctionnel |
| **[GHOST-WRITER]** | Génère messages de candidature/relance | 🟡 Template |
| **Orchestrator** | Pipeline SCRAPER → ANALYST → GHOST-WRITER | 🟢 Fonctionnel |

---

## 📂 Structure du Projet

```
APEX/
├── main.py                  # Point d'entrée CLI
├── README.md
├── config/
│   └── profile.json         # Profil candidat (techs, soft skills)
├── core/
│   ├── models.py            # Dataclasses (JobPosting, Profile, MatchResult)
│   └── orchestrator.py      # Pipeline inter-agents
├── agents/
│   ├── base_agent.py        # Classe abstraite BaseAgent
│   ├── scraper_agent.py     # [SCRAPER] — Sourcing
│   ├── analyst_agent.py     # [ANALYST] — Scoring engine
│   └── ghostwriter_agent.py # [GHOST-WRITER] — Relances
└── ui/
    └── dashboard.html       # Interface web (dark/cyberpunk)
```

---

## 🚀 Quick Start

```bash
# Clone & run
cd c:\xampp\htdocs\APEX
python main.py
```

Le moteur va :
1. Charger ton profil depuis `config/profile.json`
2. Sourcer des offres (mode démo)
3. Analyser chaque offre et sortir un score + verdict
4. Générer des messages de relance pour les matchs GO

---

## 🗺 Roadmap

### Phase 1 — MVP ✅ (Current)
- [x] Architecture agents modulaire
- [x] Agent ANALYST fonctionnel (scoring tech + soft skills)
- [x] Pipeline Orchestrator
- [x] CLI avec affichage stylé
- [x] Dashboard HTML statique

### Phase 2 — Agentic Workflow
- [ ] Scraping réel (LinkedIn, Indeed, WelcomeToTheJungle)
- [ ] Intégration API Claude / Gemini pour l'Analyst
- [ ] Ghost-Writer intelligent (personnalisation IA)
- [ ] Base de données SQLite pour historique
- [ ] Système de notifications (email / Discord)

### Phase 3 — Full Autonomy
- [ ] Agents auto-déclenchés (CRON / scheduler)
- [ ] Candidature semi-automatique
- [ ] Dashboard temps réel (WebSocket)
- [ ] Apprentissage des préférences (feedback loop)
- [ ] Multi-profils / multi-utilisateurs

---

## ⚡ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Backend / Agents | Python 3.10+ |
| Data Models | Dataclasses |
| CLI | ANSI Terminal Colors |
| Dashboard | HTML / CSS / JS (Vanilla) |
| IA (roadmap) | Claude 4.6 / Gemini 3 Pro |
| Desktop (optionnel) | C# / .NET |

---

<div align="center">

**Built by Jonathan** — *BTS SIO, mentalité compétitive.*

*APEX Engine v0.1 — "On ne cherche pas un emploi, on l'acquiert."*

</div>
