# ✅ ÉTAPE 2 : CRUD Users - Guide de Test

## 📦 Fichiers Créés

### ✅ Nouveaux fichiers
- ✅ `src/middlewares/validation.middleware.js` - Validation données
- ✅ `src/controllers/admin/users.controller.js` - Logique CRUD users
- ✅ `src/routes/admin.routes.js` - Routes admin

### ✅ Fichiers modifiés
- ✅ `src/app.js` - Ajout routes admin

---

## 🚀 Démarrage

```bash
cd backend
npm run dev
```

---

## 🧪 Tests API - CRUD Users

### 🔑 Étape 1 : Se connecter en tant qu'ADMIN

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@siteforge.com",
    "password": "Admin@123"
  }'
```

**Copier le `token` retourné** et l'utiliser dans toutes les requêtes suivantes.

---

### 📊 Test 1 : Récupérer les statistiques

```bash
curl -X GET http://localhost:5000/api/v1/admin/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "totalUsers": 4,
    "activeUsers": 4,
    "newUsersThisMonth": 4,
    "availableWorkers": 1,
    "byRole": {
      "SUPER_ADMIN": 1,
      "PROJECT_MANAGER": 1,
      "WORKER": 1,
      "CLIENT": 1
    },
    "byStatus": {
      "ACTIVE": 4
    }
  }
}
```

---

### 📋 Test 2 : Liste tous les utilisateurs

```bash
# Sans filtres
curl -X GET http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Avec pagination
curl -X GET "http://localhost:5000/api/v1/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filtrer par rôle
curl -X GET "http://localhost:5000/api/v1/admin/users?role=WORKER" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filtrer par statut
curl -X GET "http://localhost:5000/api/v1/admin/users?status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Recherche
curl -X GET "http://localhost:5000/api/v1/admin/users?search=worker" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tri
curl -X GET "http://localhost:5000/api/v1/admin/users?sortBy=createdAt&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Combinaison de filtres
curl -X GET "http://localhost:5000/api/v1/admin/users?role=CLIENT&status=ACTIVE&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "...",
        "email": "admin@siteforge.com",
        "role": "SUPER_ADMIN",
        "profile": {
          "firstName": "Super",
          "lastName": "Admin"
        },
        "status": "ACTIVE",
        "createdAt": "2025-01-18T..."
      }
    ],
    "pagination": {
      "total": 4,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 👤 Test 3 : Récupérer un utilisateur spécifique

```bash
# Remplacer USER_ID par un vrai ID
curl -X GET http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "worker@siteforge.com",
      "role": "WORKER",
      "profile": {
        "firstName": "Test",
        "lastName": "Worker"
      },
      "workerProfile": {
        "skills": ["React", "Node.js", "MongoDB"],
        "specialization": "fullstack",
        "level": "SENIOR",
        "availability": {
          "status": "AVAILABLE",
          "hoursPerWeek": 40
        },
        "stats": {
          "totalTickets": 0,
          "completedTickets": 0,
          "rating": 5
        }
      }
    }
  }
}
```

---

### ➕ Test 4 : Créer un nouvel utilisateur

#### Créer un CLIENT

```bash
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveauclient@test.com",
    "password": "Test@123",
    "firstName": "Nouveau",
    "lastName": "Client",
    "role": "CLIENT",
    "phone": "+33612345678",
    "company": "Test Company SARL"
  }'
```

#### Créer un WORKER

```bash
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev1@siteforge.com",
    "password": "Dev@123",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "WORKER",
    "phone": "+33612345678",
    "skills": ["React", "Vue.js", "TailwindCSS"],
    "specialization": "frontend",
    "level": "INTERMEDIATE"
  }'
```

#### Créer un PROJECT_MANAGER

```bash
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pm1@siteforge.com",
    "password": "PM@123",
    "firstName": "Marie",
    "lastName": "Martin",
    "role": "PROJECT_MANAGER",
    "phone": "+33612345678"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": {
      "_id": "...",
      "email": "nouveauclient@test.com",
      "role": "CLIENT",
      "profile": {
        "firstName": "Nouveau",
        "lastName": "Client",
        "phone": "+33612345678"
      },
      "clientProfile": {
        "company": "Test Company SARL",
        "subscription": {
          "plan": "FREE",
          "status": "ACTIVE",
          "maxProjects": 1
        }
      }
    }
  }
}
```

---

### ✏️ Test 5 : Modifier un utilisateur

```bash
# Modifier le profil
curl -X PUT http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean-Michel",
    "lastName": "Dupont-Martin",
    "phone": "+33698765432"
  }'

# Changer le statut
curl -X PUT http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INACTIVE"
  }'

# Changer le rôle (attention aux permissions)
curl -X PUT http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "WORKER"
  }'

# Modifier profil CLIENT
curl -X PUT http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "New Company Name",
    "subscriptionPlan": "PRO"
  }'

# Modifier profil WORKER
curl -X PUT http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["React", "Next.js", "TypeScript", "Node.js"],
    "specialization": "fullstack",
    "level": "SENIOR"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Utilisateur mis à jour",
  "data": {
    "user": { /* utilisateur modifié */ }
  }
}
```

---

### 🗑️ Test 6 : Supprimer un utilisateur (SUPER_ADMIN uniquement)

```bash
curl -X DELETE http://localhost:5000/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note :** Ceci fait un "soft delete" (marque comme DELETED, ne supprime pas vraiment).

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

---

### 👷 Test 7 : Récupérer les workers disponibles

```bash
curl -X GET http://localhost:5000/api/v1/admin/users/workers/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "workers": [
      {
        "_id": "...",
        "profile": {
          "firstName": "Jean",
          "lastName": "Dupont"
        },
        "workerProfile": {
          "skills": ["React", "Vue.js"],
          "specialization": "frontend",
          "level": "INTERMEDIATE",
          "availability": {
            "status": "AVAILABLE",
            "hoursPerWeek": 40
          },
          "stats": {
            "rating": 5
          }
        }
      }
    ]
  }
}
```

---

## 🧪 Tests d'Erreurs

### Test : Email déjà existant

```bash
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@siteforge.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "CLIENT"
  }'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé"
}
```

---

### Test : ID invalide

```bash
curl -X GET http://localhost:5000/api/v1/admin/users/invalid-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "ID invalide : id"
}
```

---

### Test : Validation des champs

```bash
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalide",
    "password": "123",
    "firstName": "",
    "role": "CLIENT"
  }'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    { "field": "email", "message": "Email invalide" },
    { "field": "password", "message": "Mot de passe minimum 6 caractères" },
    { "field": "firstName", "message": "Prénom requis" }
  ]
}
```

---

### Test : Accès non autorisé (CLIENT essaie d'accéder aux routes admin)

```bash
# 1. Se connecter en tant que CLIENT
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@siteforge.com",
    "password": "Client@123"
  }'

# 2. Essayer d'accéder aux stats (avec le token CLIENT)
curl -X GET http://localhost:5000/api/v1/admin/users/stats \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Action interdite"
}
```

---

## 📊 Collection Postman

Créer une collection avec ces requêtes :

### Folder : Admin - Users

```
1. GET Stats                    /api/v1/admin/users/stats
2. GET All Users                /api/v1/admin/users
3. GET All Users (Filtered)     /api/v1/admin/users?role=WORKER&status=ACTIVE
4. GET User by ID               /api/v1/admin/users/:id
5. POST Create CLIENT           /api/v1/admin/users
6. POST Create WORKER           /api/v1/admin/users
7. POST Create MANAGER          /api/v1/admin/users
8. PUT Update User              /api/v1/admin/users/:id
9. PUT Change Status            /api/v1/admin/users/:id
10. DELETE User                 /api/v1/admin/users/:id
11. GET Available Workers       /api/v1/admin/users/workers/available
```

---

## ✅ Checklist de Validation

Vérifier que :

- [ ] ✅ Les stats s'affichent correctement
- [ ] ✅ La liste des users fonctionne
- [ ] ✅ La pagination fonctionne
- [ ] ✅ Les filtres (role, status, search) fonctionnent
- [ ] ✅ Création CLIENT fonctionne
- [ ] ✅ Création WORKER fonctionne
- [ ] ✅ Création MANAGER fonctionne
- [ ] ✅ Modification user fonctionne
- [ ] ✅ Suppression user fonctionne (SUPER_ADMIN only)
- [ ] ✅ Les workers disponibles sont listés
- [ ] ✅ Validation des champs fonctionne
- [ ] ✅ Protection des routes fonctionne (CLIENT ne peut pas accéder)
- [ ] ✅ Protection SUPER_ADMIN fonctionne (on ne peut pas le supprimer)
- [ ] ✅ On ne peut pas se supprimer soi-même

---

## 🎯 Prochaine Étape

Une fois validé ✅, on passe à :

**ÉTAPE 3 : Système de Templates**
- Créer le modèle Template
- Seed templates par défaut
- CRUD templates
- Catégories et preview

Prêt ? 🚀