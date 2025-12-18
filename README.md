# 🚀 Evolyte Backend

Backend API pour Evolyte - Plateforme de création de sites web avec système de tickets.

## 📦 Technologies

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Cache**: Redis (Upstash)
- **Auth**: JWT
- **Storage**: Cloudinary

## 🚀 Démarrage Rapide

### 1. Installation

```bash
cd backend
npm install
```

### 2. Configuration

Créer un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Configurer les variables d'environnement (au minimum) :

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### 3. Seed Database (Créer admin)

```bash
npm run seed
```

Ceci va créer :
- ✅ Super Admin : `admin@evolyte.com` / `Admin@123`
- ✅ Manager : `manager@evolyte.com` / `Manager@123`
- ✅ Worker : `worker@evolyte.com` / `Worker@123`
- ✅ Client : `client@evolyte.com` / `Client@123`

**⚠️ IMPORTANT : Changez ces mots de passe en production !**

### 4. Lancer le serveur

```bash
# Development
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Inscription | ❌ |
| POST | `/api/v1/auth/login` | Connexion | ❌ |
| GET | `/api/v1/auth/me` | Profil utilisateur | ✅ |
| PUT | `/api/v1/auth/profile` | Modifier profil | ✅ |
| PUT | `/api/v1/auth/password` | Changer mot de passe | ✅ |
| POST | `/api/v1/auth/logout` | Déconnexion | ✅ |

### Exemples de requêtes

#### 1. Inscription

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password@123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT"
  }'
```

#### 2. Connexion

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

Réponse :
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Récupérer profil (avec token)

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔐 Rôles et Permissions

| Rôle | Description | Niveau |
|------|-------------|--------|
| `SUPER_ADMIN` | Accès total | 4 |
| `ADMIN` | Administration | 3 |
| `PROJECT_MANAGER` | Gestion projets & tickets | 2 |
| `WORKER` | Développement | 1 |
| `CLIENT` | Utilisateur final | 0 |

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── config/           # Configuration (DB, env, etc.)
│   ├── models/           # Modèles MongoDB
│   ├── controllers/      # Logique métier
│   ├── routes/           # Routes API
│   ├── middlewares/      # Middlewares (auth, validation, etc.)
│   ├── services/         # Services (email, storage, etc.)
│   ├── utils/            # Utilitaires
│   └── app.js           # Application Express
├── .env                  # Variables d'environnement
├── .env.example          # Template .env
└── package.json
```

## 🔄 Prochaines Étapes

- [ ] CRUD Users (admin)
- [ ] Système de Templates
- [ ] Système de Tickets
- [ ] Gestion de Projets
- [ ] Éditeur de sites
- [ ] Déploiement Vercel
- [ ] Analytics
- [ ] Notifications

## 🐛 Debugging

Si le serveur ne démarre pas, vérifier :

1. MongoDB est connecté (`✅ MongoDB Connected`)
2. Variables d'environnement sont définies
3. Port 5000 n'est pas déjà utilisé
4. Node.js version >= 20

## 📝 Logs

Les logs en développement affichent :
- ✅ Succès en vert
- ⚠️ Warnings en jaune
- ❌ Erreurs en rouge

## 🤝 Contribution

1. Créer une branche (`git checkout -b feature/AmazingFeature`)
2. Commit (`git commit -m 'Add AmazingFeature'`)
3. Push (`git push origin feature/AmazingFeature`)
4. Ouvrir une Pull Request