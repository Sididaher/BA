# BacEnglish

Projet d'apprentissage de l'anglais pour le Bac, structuré avec un Backend Supabase et un Frontend Next.js.

## Structure du Projet

Le projet est divisé en deux répertoires principaux :

- **`/backend`** : Contient toute la configuration Supabase.
  - `supabase/schema.sql` : Schéma de base de données d'origine.
  - `supabase/migrations/` : Scripts SQL de migration (à exécuter dans l'ordre).
  - `supabase/functions/` : Edge Functions (Auth, OTP).
- **`/frontend`** : Contient l'application Next.js.
  - `src/` : Code source de l'application (Actions, Components, App).
  - `public/` : Assets statiques.

## Installation et Développement

### 1. Frontend
Naviguez vers le dossier frontend pour lancer l'application :
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend (Supabase)
Toutes les commandes Supabase CLI doivent être exécutées depuis la racine ou en spécifiant le chemin :
```bash
# Exemple pour lancer les fonctions localement
supabase functions serve --project-ref your-project-id
```

## Migrations SQL (Ordre d'exécution)

Pour mettre à jour votre base de données Supabase, exécutez les fichiers suivants dans l'**Editeur SQL** de Supabase, dans cet ordre :

1. `backend/supabase/migrations/20260425000000_refactor_profiles.sql` (Refonte des profils)
2. `backend/supabase/migrations/20260425010000_rpc_layer.sql` (Couche API RPC)
3. `backend/supabase/migrations/20260425020000_rls_cleanup.sql` (Sécurité RLS et Performance)

## Sécurité

Le projet utilise un système d'authentification personnalisé. Les politiques RLS sont configurées pour restreindre l'accès direct via le client Supabase et privilégier les appels via les **Server Actions** et les **fonctions RPC** (utilisant la clé `service_role`).
