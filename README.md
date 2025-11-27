# Clipboard Sync

Une application simple pour partager du texte entre plusieurs appareils en temps réel, même sur des réseaux différents.

## Fonctionnalités

- Synchronisation en temps réel du texte entre appareils
- Système de code unique pour sécuriser le partage
- Interface simple et intuitive
- Stockage temporaire (24h) via Supabase
- Déploiement facile sur Vercel

## Configuration

### 1. Configuration Supabase

1. Créez un compte gratuit sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Dans l'éditeur SQL (SQL Editor), exécutez ce script pour créer la table :

```sql
-- Créer la table clipboards
CREATE TABLE clipboards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text UNIQUE NOT NULL,
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS (Row Level Security)
ALTER TABLE clipboards ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre à tous de lire et écrire
CREATE POLICY "Permettre lecture pour tous" ON clipboards FOR SELECT USING (true);
CREATE POLICY "Permettre insertion pour tous" ON clipboards FOR INSERT WITH CHECK (true);
CREATE POLICY "Permettre mise à jour pour tous" ON clipboards FOR UPDATE USING (true);

-- Créer un index pour améliorer les performances
CREATE INDEX idx_room_code ON clipboards(room_code);

-- Fonction pour supprimer les anciennes entrées (24h)
CREATE OR REPLACE FUNCTION delete_old_clipboards()
RETURNS void AS $$
BEGIN
  DELETE FROM clipboards
  WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Créer une extension pour les cron jobs (optionnel, nécessite pg_cron)
-- Si vous voulez automatiser le nettoyage, vous pouvez utiliser Supabase Edge Functions
```

4. Activez Realtime pour la table :
   - Allez dans Database > Replication
   - Activez la réplication pour la table `clipboards`

5. Récupérez vos clés API :
   - Allez dans Settings > API
   - Copiez l'URL du projet (Project URL)
   - Copiez la clé `anon` `public` (Public anon key)

### 2. Configuration du projet local

1. Clonez le projet et installez les dépendances :

```bash
npm install
```

2. Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.example .env.local
```

3. Remplissez vos clés Supabase dans `.env.local` :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
```

4. Lancez le serveur de développement :

```bash
npm run dev
```

### 3. Déploiement sur Vercel

#### Option A : Via l'interface Vercel (recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Cliquez sur "Import Project"
3. Importez votre repository GitHub
4. Configurez les variables d'environnement :
   - `VITE_SUPABASE_URL` : votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` : votre clé anon Supabase
5. Cliquez sur "Deploy"

#### Option B : Via CLI Vercel

1. Installez Vercel CLI :

```bash
npm install -g vercel
```

2. Déployez :

```bash
vercel
```

3. Suivez les instructions et ajoutez vos variables d'environnement quand demandé

## Utilisation

1. Ouvrez l'application sur le premier appareil
2. Cliquez sur "Créer une nouvelle session"
3. Copiez le code de session généré
4. Sur le deuxième appareil, ouvrez l'application et entrez le même code
5. Le texte sera synchronisé en temps réel entre les deux appareils

## Architecture technique

- **Frontend** : Vue 3 + Vite
- **Backend** : Supabase (PostgreSQL + Realtime)
- **Déploiement** : Vercel
- **Synchronisation** : Realtime subscriptions de Supabase
- **Sécurité** : Codes de session uniques, Row Level Security

## Améliorations futures possibles

- Chiffrement end-to-end du contenu
- Support de fichiers (images, documents)
- Historique des clipboards
- Durée de vie configurable
- Thème sombre
- Partage via QR code
- Notifications push

## License

MIT
