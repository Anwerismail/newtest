# ✅ ÉTAPE 1 COMPLÉTÉE : Setup Backend & Authentication

## 📦 Ce qui a été créé

### ✅ Configuration
- ✅ `package.json` - Dépendances et scripts
- ✅ `.env.example` - Template variables d'environnement
- ✅ `src/config/env.js` - Gestion configuration
- ✅ `src/config/database.js` - Connexion MongoDB

### ✅ Modèles
- ✅ `src/models/User.model.js` - Modèle utilisateur complet avec tous les rôles

### ✅ Authentification
- ✅ `src/middlewares/auth.middleware.js` - Protection routes + autorisation par rôle
- ✅ `src/controllers/auth.controller.js` - Logique auth (register, login, profile, etc.)
- ✅ `src/routes/auth.routes.js` - Routes auth

### ✅ Application
- ✅ `src/app.js` - Serveur Express configuré
- ✅ `src/utils/constants.js` - Constantes (rôles, statuts, etc.)

### ✅ Seed
- ✅ `src/database/seeds/admin.seed.js` - Création admin et users de test

---

## 🚀 COMMENT TESTER (Étape par Étape)

### 1️⃣ Installation

```bash
cd backend
npm install
```

### 2️⃣ Configuration MongoDB

**Option A : MongoDB Atlas (Recommandé)**

1. Aller sur https://www.mongodb.com/cloud/atlas
2. Créer un compte gratuit
3. Créer un cluster
4. Cliquer "Connect" → "Connect your application"
5. Copier l'URI de connexion

**Option B : MongoDB Local**

```bash
# Installer MongoDB localement
# URI: mongodb://localhost:27017/siteforge
```

### 3️⃣ Créer fichier .env

```bash
# Dans /backend créer un fichier .env
cp .env.example .env
```

Éditer `.env` avec vos vraies valeurs :

```env
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# ⚠️ IMPORTANT : Remplacer avec votre URI MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/siteforge

# ⚠️ IMPORTANT : Changer en production !
JWT_SECRET=super_secret_key_change_in_production_123456789
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=refresh_secret_key_change_in_production
JWT_REFRESH_EXPIRE=30d
```

### 4️⃣ Seed la Database (Créer admin)

```bash
npm run seed
```

Vous devriez voir :

```
✅ Connected to MongoDB
✅ Super Admin created successfully
📧 Email: admin@siteforge.com
🔑 Password: Admin@123
✅ Test users created successfully
```

**Utilisateurs créés :**
- Super Admin : `admin@siteforge.com` / `Admin@123`
- Manager : `manager@siteforge.com` / `Manager@123`
- Worker : `worker@siteforge.com` / `Worker@123`
- Client : `client@siteforge.com` / `Client@123`

### 5️⃣ Lancer le serveur

```bash
npm run dev
```

Vous devriez voir :

```
╔═══════════════════════════════════════════╗
║                                           ║
║       🚀 SITEFORGE API STARTED           ║
║                                           ║
║  Environment: development                 ║
║  Port: 5000                              ║
║  URL: http://localhost:5000              ║
║                                           ║
╚═══════════════════════════════════════════╝

✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

## 🧪 TESTER L'API

### Méthode 1 : Avec cURL

#### Test 1 : Health Check

```bash
curl http://localhost:5000/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "environment": "development"
}
```

#### Test 2 : Connexion Admin

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@siteforge.com",
    "password": "Admin@123"
  }'
```

Réponse (copier le `token`) :
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@siteforge.com",
      "role": "SUPER_ADMIN",
      "profile": {
        "firstName": "Super",
        "lastName": "Admin"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Test 3 : Récupérer profil (avec token)

```bash
# Remplacer YOUR_TOKEN par le token obtenu ci-dessus
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 4 : Inscription nouveau client

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveauclient@test.com",
    "password": "Test@123",
    "firstName": "Nouveau",
    "lastName": "Client",
    "role": "CLIENT"
  }'
```

### Méthode 2 : Avec Postman

1. **Importer Collection** (créer ces requêtes) :

```
GET     http://localhost:5000/health
POST    http://localhost:5000/api/v1/auth/register
POST    http://localhost:5000/api/v1/auth/login
GET     http://localhost:5000/api/v1/auth/me (Auth: Bearer Token)
PUT     http://localhost:5000/api/v1/auth/profile (Auth: Bearer Token)
PUT     http://localhost:5000/api/v1/auth/password (Auth: Bearer Token)
```

2. **Tester la séquence** :
    - Login → Copier token
    - Utiliser token dans Header : `Authorization: Bearer <token>`
    - Tester GET /me
    - Tester PUT /profile

### Méthode 3 : Avec Thunder Client (VS Code Extension)

1. Installer Thunder Client dans VS Code
2. Créer une nouvelle collection "SiteForge"
3. Ajouter les requêtes ci-dessus

---

## ✅ VALIDATION DE L'ÉTAPE 1

Vérifier que tout fonctionne :

- [ ] ✅ Le serveur démarre sans erreur
- [ ] ✅ MongoDB connecté (`✅ MongoDB Connected`)
- [ ] ✅ Health check retourne `status: ok`
- [ ] ✅ Login admin fonctionne
- [ ] ✅ Token est retourné
- [ ] ✅ GET /me avec token fonctionne
- [ ] ✅ Inscription nouveau client fonctionne
- [ ] ✅ Changer mot de passe fonctionne

---

## 🐛 PROBLÈMES COURANTS

### Erreur : "Cannot connect to MongoDB"
- Vérifier l'URI dans `.env`
- Vérifier que l'IP est whitelistée sur MongoDB Atlas
- Vérifier les credentials

### Erreur : "JWT_SECRET is not defined"
- Vérifier que le fichier `.env` existe
- Vérifier que `JWT_SECRET` est défini dans `.env`

### Erreur : "Port 5000 already in use"
- Changer le PORT dans `.env` : `PORT=5001`
- Ou tuer le processus : `lsof -ti:5000 | xargs kill`

### Erreur : "Super Admin already exists"
- Normal si vous avez déjà run le seed
- Pour recommencer à zéro : supprimer la database et refaire seed

---

## 📊 STRUCTURE DE DONNÉES

### User créé après registration :

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "client@test.com",
  "role": "CLIENT",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://via.placeholder.com/150",
    "timezone": "UTC",
    "language": "fr"
  },
  "clientProfile": {
    "subscription": {
      "plan": "FREE",
      "status": "ACTIVE",
      "maxProjects": 1
    },
    "stats": {
      "totalProjects": 0,
      "activeProjects": 0,
      "totalSpent": 0
    }
  },
  "notifications": {
    "email": true,
    "push": true,
    "preferences": {
      "ticketUpdates": true,
      "projectMilestones": true,
      "systemUpdates": true,
      "marketing": false
    }
  },
  "status": "ACTIVE",
  "createdAt": "2025-01-18T10:30:00.000Z",
  "updatedAt": "2025-01-18T10:30:00.000Z"
}
```

---

## 🎯 PROCHAINE ÉTAPE : ÉTAPE 2

Une fois que tout est validé ✅, on passe à :

**ÉTAPE 2 : CRUD Users & Gestion des Rôles**
- Routes admin pour gérer les utilisateurs
- Lister tous les users
- Créer/Modifier/Supprimer users
- Assigner des rôles
- Filtrer par rôle
- Statistiques users

Prêt pour l'étape 2 ? 🚀