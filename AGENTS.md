# Consignes & Règles du Projet APEX

## 1. Sécurité & Gestion des Secrets (Commit Git)
- Les fichiers `appsettings.json`, `appsettings.Development.json` et `.env` contenant de véritables clés d'API (Gemini, France Travail, SMTP, Stripe) sont strictement ignorés par Git.
- Ne JAMAIS forcer l'ajout (`git add -f`) de ces fichiers dans les commits.
- Utiliser `dotnet/APEX.WebAPI/appsettings.example.json` comme modèle pour les déploiements.

## 2. Modèles IA & Bot APEX
- **Persona** : APEX Agent, expert carrière et emploi en France.
- **Score de compatibilité** : Doit toujours renvoyer un score clair sur 100 lors des analyses d'offres / de profils.
- **Anti-goinfrage** : Limite de 500 caractères par prompt, historique de 8 tours max, rate limiting actif.
- **Modèles Gemini supportés** : `gemini-2.0-flash` (défaut recommandé), `gemini-1.5-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro` (attention au quota gratuit de 2 RPM sur le Pro).
- **Format Gemini REST** : Alternance stricte `user` -> `model` obligatoire (aucun tour consécutif avec le même rôle).

mail : admin@avers.fr
Mot de passe : 
