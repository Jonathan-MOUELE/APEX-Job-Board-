# CAHIER DES CHARGES — APEX by AVERS
**Plateforme d'emploi augmentée par l'IA pour le marché français**
Version 1.0 — Avril 2026 — Confidentiel

---

## 1. PRÉSENTATION DU PROJET

### 1.1 Contexte
APEX est un SaaS d'emploi développé sous l'entité AVERS (Entrepreneur Individuel) ciblant l'intégralité du marché français de l'emploi, tous secteurs et tous niveaux de qualification confondus. La cible principale est le demandeur d'emploi ordinaire — pas uniquement les profils tech. La plateforme se positionne entre HelloWork (UX de référence) et une couche IA propriétaire apportant une valeur différenciante réelle.

### 1.2 Problèmes résolus
- Les job boards existants obligent l'utilisateur à quitter la plateforme pour postuler
- Le suivi des candidatures est inexistant ou minimal
- Les offres France Travail sont brutes et peu lisibles pour le grand public
- Aucune aide à la progression de carrière (certifications, projets, compétences)
- L'IA est soit absente, soit présentée de façon intrusive et technique

### 1.3 Vision produit
APEX est un **sensei de carrière** : il guide, conseille, corrige, forme et aide à postuler — sans jamais remplacer le jugement humain. Accessible, chaleureux, utile.

### 1.4 Valeurs produit
Utilité · Convivialité · Discipline · Aide · Progression · Support

---

## 2. UTILISATEURS CIBLES

### 2.1 Personas
| Persona | Description | Besoins prioritaires |
|---|---|---|
| **Léa, 22 ans** | Étudiante en fin de BTS, cherche alternance | Stage/alternance, aide CV, préparation entretien |
| **Marc, 38 ans** | Cadre en reconversion | Analyse de compatibilité, certifications, bilan de compétences |
| **Fatima, 45 ans** | Ouvrière cherchant emploi proche de chez elle | Interface simple, offres locales, pas de jargon |
| **Théo, 27 ans** | Dev junior cherchant CDI | Filtre tech, analyse IA, LinkedIn des entreprises |
| **Claire, 55 ans** | Cadre RH — recruteur | Publication d'offres, accès profils, outil de sélection |

### 2.2 Compte de test
- Email : Jonathanmouele42@Gmail.com
- Plan : Ultra (accès complet à toutes les fonctionnalités)
- Rôle : Admin/Test

---

## 3. FONCTIONNALITÉS — DÉTAIL PAR PLAN

### 3.1 Plan Gratuit (0€)
- Recherche d'offres (source France Travail v2)
- Filtres : type de contrat, secteur, ville, salaire, télétravail
- Alertes emploi par e-mail
- Accès aux articles et conseils
- Voir le profil des entreprises (avec logo Clearbit)
- Lien LinkedIn entreprise
- Outils de lecture (mode clair/sombre, accessibilité taille police)

### 3.2 Plan Essentiel (4,99€/mois)
Tout Gratuit +
- **Candidature directe** : envoi CV + lettre sans quitter APEX
- **Suivi des candidatures** (Kanban : Envoyée / En attente / Entretien / Réponse / Archivée)
- **Analyse IA basique** : score de compatibilité offre/profil (3 analyses/jour)
- Alertes enrichies avec score de matching
- Historique des 30 derniers jours

### 3.3 Plan Pro (8,99€/mois)
Tout Essentiel +
- **Analyse IA avancée** : score détaillé, compétences manquantes, points forts, score illimité
- **Coach entretien IA** : questions simulées par métier, feedback sur les réponses
- **CV builder** : outil de création avec modèles, export PDF
- **Lettre de motivation** : génération assistée, correction, variantes
- **Modèles de relance** : après candidature, après entretien
- **Panoramas salaires** : données détaillées par poste et région

### 3.4 Plan Ultra Bêta (11,99€/mois)
Tout Pro +
- **Agent IA autonome** : candidature automatique sur critères définis (avec validation humaine)
- **Support prioritaire** : réponse sous 24h
- **Accès bêta anticipé** : nouvelles fonctionnalités en avant-première
- **Tableau de bord analytique avancé** : statistiques candidatures, taux de réponse
- Accompagnement personnalisé (1 session APEX/mois)

---

## 4. ARCHITECTURE TECHNIQUE

### 4.1 Stack technique
| Couche | Technologie | Justification |
|---|---|---|
| Frontend | HTML5/CSS3/JS ES2026 (Vanilla) | Légèreté, pas de framework lourd |
| Icons | Lucide Icons v0.383.0 (CDN fixe) | Cohérence, pas d'émoji |
| Fonts | DM Sans (Google Fonts) | Lisibilité, modernité |
| Backend | ASP.NET Core 9 — Minimal APIs | Performance, écosystème Microsoft gratuit |
| ORM | Entity Framework Core 9 (Code-First) | Migrations faciles, SQL Server |
| Base de données | SQL Server Express 2022 | Gratuit, robuste, 10 Go |
| IA principale | Google Gemini Flash (gemini-1.5-flash) | Gratuit (quota), rapide |
| IA fallback | Gemini Pro (gemini-1.5-pro) | Qualité supérieure si nécessaire |
| Source offres | France Travail API v2 | Officielle, RGPD, Etalab-2.0 |
| Logos entreprises | Clearbit Logo API (GET logo.clearbit.com/{domain}) | Gratuit, pas de stockage local |
| Paiements | Stripe Checkout + Billing | Standard SaaS |
| Emails | Resend (custom domain) | Simple, quota gratuit |
| Hébergement | Railway | < 5€/mois pour .NET + SQL |
| CI/CD | GitHub Actions | Gratuit |

### 4.2 Architecture logicielle
```
APEX/
├── apex-frontend/          → Static HTML/CSS/JS
├── apex-api/               → ASP.NET Core 9
│   ├── Controllers/        → Endpoints Minimal API
│   ├── Services/
│   │   ├── JobService      → France Travail API v2
│   │   ├── AiService       → Gemini Flash/Pro
│   │   ├── AuthService     → JWT + Refresh tokens (SHA-256)
│   │   ├── LogoService     → Clearbit proxy cache
│   │   └── MailService     → Resend
│   ├── Models/             → Entités EF Core
│   └── Data/               → DbContext + Migrations
└── apex-db/                → SQL Server Express
```

### 4.3 Note critique sur Gemini
⚠️ **NE PAS modifier** les valeurs `FlashModel` et `ProModel` dans la configuration. Antigravity et Copilot tentent régulièrement de les écraser avec des versions dépréciées. Les valeurs correctes sont définies dans `appsettings.json` et ne doivent pas changer sans validation manuelle.

---

## 5. MODÈLE DE DONNÉES (MCD résumé)

### 5.1 Entités principales
- **Utilisateur** : id, email, nom, prenom, role (candidat/recruteur/admin), plan, date_inscription, derniere_connexion
- **CV** : id, utilisateur_id, nom_fichier, stockage_path, date_upload, est_public
- **Offre** : id, titre, entreprise_nom, entreprise_domaine, ville, departement, type_contrat, salaire_min, salaire_max, teletravail, description, date_publication, source_id (FT), url_ft, est_active
- **Candidature** : id, utilisateur_id, offre_id, statut (enum), date_postulation, cv_id, lettre_motivation, notes
- **Entreprise** : id, nom, domaine_web, secteur, description, linkedin_url, logo_url (Clearbit), nb_offres_actives
- **MessageBot** : id, utilisateur_id, contenu, role (user/assistant), date, session_id
- **Abonnement** : id, utilisateur_id, plan (enum), date_debut, date_fin, stripe_subscription_id, est_actif
- **Alerte** : id, utilisateur_id, mots_cles, localisation, type_contrat, frequence, derniere_execution
- **AnalyseIA** : id, utilisateur_id, offre_id, cv_id, score, verdict, competences_ok, competences_manquantes, justification, date_analyse

### 5.2 Relations clés
- Utilisateur 1—N Candidature
- Offre 1—N Candidature
- Utilisateur 1—N CV
- Utilisateur 1—N MessageBot
- Utilisateur 1—1 Abonnement
- Entreprise 1—N Offre
- Utilisateur 1—N AnalyseIA

---

## 6. INTÉGRATIONS API

### 6.1 France Travail API v2
- Endpoint : `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search`
- Auth : OAuth2 (client credentials)
- Usage : Recherche, détail offre, mise à jour quotidienne
- Mention obligatoire : Licence Etalab-2.0 (footer uniquement, pas en avant-scène)
- Limite : 500 requêtes/heure (plan partenaire)

### 6.2 Clearbit Logo API
- URL : `https://logo.clearbit.com/{domain}`
- Gratuit pour usage non commercial < 10k req/mois
- Fallback : initiales du nom de l'entreprise si logo absent
- Cache côté serveur : TTL 7 jours pour limiter les appels

### 6.3 Google Gemini
- Flash (gemini-1.5-flash-latest) : analyses IA rapides, chat bot
- Pro (gemini-1.5-pro-latest) : analyse approfondie CV/offre (plan Pro+)
- Quota gratuit : 60 req/min Flash, 2 req/min Pro
- Fallback : si quota dépassé, réponse générique sans IA

### 6.4 LinkedIn (liens uniquement)
- Pas d'API LinkedIn (nécessite partenariat $$$)
- Implémenter via liens de recherche : `https://www.linkedin.com/search/results/companies/?keywords={nom_entreprise}`
- Mentionner en tooltip : "Voir sur LinkedIn"

### 6.5 Stripe
- Checkout : paiement ponctuel ou abonnement mensuel
- Billing : gestion des abonnements récurrents
- Webhook : mise à jour du plan en BDD à chaque événement Stripe
- E-invoicing 2027 : prévoir intégration PDP avant septembre 2027

---

## 7. CONFORMITÉ LÉGALE

### 7.1 RGPD
- Consentement explicite avant tout traitement de données personnelles
- Politique de confidentialité accessible depuis toutes les pages
- Droit à l'effacement : suppression compte + données dans les 72h
- Conservation CV non retenus : 24 mois maximum puis suppression automatique
- DPO : aversreply@gmail.com
- Hébergement données : France (LWS, Paris)

### 7.2 AI Act (applicable depuis août 2025)
- Système classifié **à haut risque** (emploi + IA de scoring)
- Transparence obligatoire : informer l'utilisateur que l'IA est une aide à la décision, pas une décision finale
- Droit de recours humain : toujours permettre de contester une analyse IA
- AIPD réalisée avant déploiement
- Zéro retention chez Gemini (configurer `generationConfig.maxOutputTokens` et vérifier les ToS)

### 7.3 Logos et marques tierces
- Les logos récupérés via Clearbit sont propriété de leurs titulaires
- Mention obligatoire en footer : "Les logos des entreprises sont la propriété de leurs titulaires respectifs. APEX n'est pas partenaire officiel de ces entreprises."
- Pas de modification des logos (couleur, forme)
- Retrait immédiat si demande d'une entreprise

### 7.4 Licence Etalab-2.0
- Mention en footer uniquement (discrète)
- Page dédiée `/legal/etalab` expliquant la licence
- Ne pas présenter APEX comme affilié à France Travail

---

## 8. SÉCURITÉ

### 8.1 Authentification
- JWT access token (15 min) + Refresh token (7 jours, SHA-256 haché en BDD)
- Cookie HttpOnly/Secure/SameSite=Strict pour le refresh token
- Rotation systématique du refresh token à chaque usage
- Rate limiting : 5 tentatives de connexion max / 15 min par IP

### 8.2 API
- HTTPS obligatoire (certificat Let's Encrypt via Railway)
- CORS : domaine APEX uniquement
- Headers de sécurité : CSP, X-Frame-Options, HSTS
- Validation des inputs côté serveur (jamais côté client uniquement)
- Sanitisation des données avant injection en BDD (EF Core protège par défaut)

### 8.3 Fichiers uploadés
- Validation MIME type + extension (PDF, DOCX, ODT uniquement)
- Taille max : 5 Mo par fichier
- Scan antivirus (ClamAV ou équivalent gratuit)
- Stockage isolé du webroot

---

## 9. UX/UI

### 9.1 Design system
- Mode clair par défaut (cohérent avec HelloWork, référence marché)
- Mode sombre disponible (toggle header)
- Couleur principale : Orange `#F97316` (solide, jamais en dégradé)
- Couleur secondaire : Bleu ciel `#0EA5E9`
- Police : DM Sans 400/500/600/800
- Icônes : Lucide Icons uniquement (v0.383.0 fixe)
- Zéro émoji dans l'interface (sauf dans le chat bot si naturel)
- Zéro dégradé CSS

### 9.2 Accessibilité (WCAG 2.1 AA)
- Skip link "Passer au contenu"
- Tous les éléments interactifs focusables au clavier
- Ratio de contraste ≥ 4.5:1
- Bouton A+ dans le header pour agrandir le texte
- `aria-label` sur tous les boutons icônes
- `role="dialog"` + `aria-modal` sur les modales
- `role="tab"` sur les onglets avec gestion clavier

### 9.3 Performance
- Pas de framework JS lourd
- Images Unsplash avec paramètre `?q=75&w=600` pour réduire le poids
- Logos Clearbit cachés côté serveur 7 jours
- Lazy loading sur images hors viewport
- Score Lighthouse cible : > 85

### 9.4 Mobile
- Menu hamburger sur mobile (nav masquée)
- Outils avec icônes uniquement sur petits écrans
- Drawer APEX en plein écran sur mobile
- Touch-friendly : tap targets ≥ 44px

---

## 10. FONCTIONNALITÉS IA — LIMITES ET CONSIDÉRATIONS

### 10.1 Limites actuelles
- **Quota Gemini gratuit** : le plan gratuit Gemini Flash limite à 60 req/min. Avec une croissance rapide, il faudra passer à l'offre payante (env. 0,075$/1M tokens)
- **Hallucinations** : Gemini peut générer des informations incorrectes sur les entreprises ou les compétences requises. Toujours afficher un disclaimer "Aide à la décision — vérifiez avant d'envoyer"
- **Analyse CV** : sans accès à une vraie base de données de compétences normalisées (ROME, ESCO), l'analyse reste approximative
- **Agent autonome** (Ultra) : la candidature automatique comporte des risques légaux (RGPD, consentement) — implémenter une validation obligatoire avant envoi
- **Pas de matching employeur** : APEX ne peut pas garantir que l'employeur voit la candidature en dehors du circuit France Travail

### 10.2 Stratégie de montée en charge IA
1. **Phase 1 (lancement)** : Gemini Flash gratuit, 3 analyses/jour/utilisateur plan Essentiel
2. **Phase 2 (50+ utilisateurs Pro)** : Basculer vers Gemini Pro payant pour le plan Pro
3. **Phase 3 (scale)** : Évaluer OpenRouter + DeepSeek V3 pour réduire les coûts à l'échelle

### 10.3 Ce que l'IA fait / ne fait pas
| IA fait | IA ne fait pas |
|---|---|
| Score de compatibilité offre/profil | Décider du recrutement |
| Suggestions de compétences à acquérir | Garantir l'embauche |
| Générer un brouillon de lettre | Signer à votre place |
| Simuler un entretien | Connaître la culture interne de l'entreprise |
| Analyser les mots-clés d'une offre | Accéder aux données RH de l'entreprise |

---

## 11. MODÈLE ÉCONOMIQUE

### 11.1 Revenus
- Abonnements B2C (Essentiel/Pro/Ultra) via Stripe
- Future offre B2B recruteur (publication d'offres, accès profils) — Phase 2
- Pas de publicité dans APEX (principe fondateur)

### 11.2 Coûts estimés (phase lancement)
| Poste | Coût mensuel estimé |
|---|---|
| Railway (backend + BDD) | 3–5€ |
| Domaine custom | 1€/mois (amorti annuel) |
| Resend emails | Gratuit (< 3000/mois) |
| Gemini API (quota gratuit) | 0€ |
| Clearbit | 0€ (< 10k req/mois) |
| Stripe | 0€ + 1,4% + 0,25€/transaction |
| **Total** | **~5€ + commissions Stripe** |

### 11.3 Seuil de rentabilité
- Avec 3 abonnés Essentiel (4,99€) : coûts couverts
- Avec 5 abonnés Pro (8,99€) : marge positive dès le lancement

### 11.4 Fiscalité
- Régime micro-entreprise (auto-entrepreneur)
- Code APE cible : 6201Z (Programmation) ou 6312Z (Portails Internet) — transition NAF 2025 à suivre
- Immatriculation avant 30 juin 2026 recommandée pour bénéficier de l'ACRE à 50%
- TVA non applicable sous le seuil de franchise (93 000€)
- E-invoicing obligatoire à partir de septembre 2027

---

## 12. PLANNING DE DÉVELOPPEMENT

### Phase 1 — Fondation (1–2 mois)
- [x] Maquette HTML/CSS/JS complète
- [ ] Setup Railway + SQL Server Express
- [ ] ASP.NET Core 9 — Minimal APIs de base
- [ ] Auth JWT + refresh tokens
- [ ] Intégration France Travail API v2 (recherche + détail)
- [ ] Affichage offres avec logos Clearbit
- [ ] Candidature directe (formulaire → email)

### Phase 2 — IA & Suivi (2–3 mois)
- [ ] Intégration Gemini Flash (chat bot APEX)
- [ ] Analyse IA offre/CV (score de compatibilité)
- [ ] Suivi des candidatures (Kanban)
- [ ] Déposer CV
- [ ] Alertes emploi par email

### Phase 3 — Monétisation (1 mois)
- [ ] Intégration Stripe Checkout + Billing
- [ ] Gestion des plans (Gratuit/Essentiel/Pro/Ultra)
- [ ] Dashboard utilisateur
- [ ] Tunnel d'inscription optimisé

### Phase 4 — Outils & Contenu (2 mois)
- [ ] CV builder
- [ ] Lettre de motivation assistée
- [ ] Coach entretien IA
- [ ] Section certifications
- [ ] Articles & conseils (blog)
- [ ] Panoramas salaires

### Phase 5 — Scale (post-lancement)
- [ ] Agent IA autonome (Ultra)
- [ ] Offre B2B recruteurs
- [ ] Application mobile (PWA)
- [ ] Expansion API (Arbeitnow, Himalayas, The Muse)

---

## 13. RISKS & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Dépassement quota Gemini | Moyen | Moyen | Cache des analyses, limites par plan |
| Changement API France Travail | Faible | Élevé | Abstraction service, versioning |
| Plainte marque logo Clearbit | Faible | Moyen | Mention footer, retrait rapide |
| Violation RGPD | Faible | Élevé | AIPD, DPO, minimisation données |
| Dépassement seuil micro-entreprise | Faible (court terme) | Moyen | Prévoir passage en EURL/SASU |
| Qualité IA insuffisante pour utilisateurs | Moyen | Moyen | Disclaimer systématique, amélioration continue |

---

## 14. ANNEXE — CERTIFICATIONS RECOMMANDÉES PAR DOMAINE

### Gratuites & reconnues
| Domaine | Certification | Plateforme |
|---|---|---|
| Numérique général | PIX | pix.fr |
| Data / IT | Google Career Certificates | grow.google |
| Marketing digital | Google Digital Garage | learndigital.withgoogle.com |
| Cloud | AWS Cloud Practitioner (essentials) | aws.amazon.com/training |
| Cybersécurité | Google Cybersecurity Certificate | coursera.org |
| Bureautique | Microsoft Office Specialist (préparation gratuite) | microsoft.com |
| Langues | TOEIC (préparation OpenClassrooms) | openclassrooms.com |
| Développement | freeCodeCamp | freecodecamp.org |
| IA | Elements of AI | elementsofai.com |
| Comptabilité | Sage Academy (bases) | sage.com |

---

*Document confidentiel — APEX by AVERS — aversreply@gmail.com*
*© 2026 AVERS — Entrepreneur Individuel*
