# ✅ ÉTAPE 5 : Gestion de Projets - Guide de Test

## 📦 Fichiers Créés

### ✅ Nouveaux fichiers
- ✅ `src/models/Project.model.js` - Modèle Project complet avec versioning
- ✅ `src/controllers/projects.controller.js` - Logique CRUD projets
- ✅ `src/controllers/admin/projects.controller.js` - Stats et métriques admin
- ✅ `src/routes/projects.routes.js` - Routes projets
- ✅ `src/database/seeds/projects.seed.js` - Seed projets d'exemple

### ✅ Fichiers modifiés
- ✅ `src/app.js` - Ajout routes projets
- ✅ `package.json` - Nouveau script `seed:projects`

---

## 🚀 Démarrage

### 1. Seed les données (si pas déjà fait)

```bash
cd backend

# Seed users
npm run seed

# Seed templates
npm run seed:templates

# Seed projects
npm run seed:projects
```

Vous devriez voir :
```
✅ Projects seeded successfully!
📊 Summary:
   - 4 projects created
   - 1 DEPLOYED (Mon Portfolio Pro)
   - 1 IN_PROGRESS (Landing Page TechStart)
   - 1 COMPLETED (Blog Tech & Innovation)
   - 1 PENDING (Test Portfolio Minimal)
```

### 2. Lancer le serveur

```bash
npm run dev
```

---

## 🧪 Tests API - Projets CLIENT

### 🔑 Étape 1 : Se connecter en tant que CLIENT

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@evolyte.com",
    "password": "Client@123"
  }'
```

Copier le `token` → `CLIENT_TOKEN`

---

### 📝 Test 1 : Créer un nouveau projet

```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Site E-commerce",
    "description": "Boutique en ligne pour mes produits artisanaux",
    "templateId": "TEMPLATE_ID_ECOMMERCE"
  }'
```

**Note :** Récupérer le `TEMPLATE_ID` depuis `/api/v1/templates?category=ECOMMERCE`

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Projet créé avec succès",
  "data": {
    "project": {
      "_id": "...",
      "name": "Mon Site E-commerce",
      "slug": "mon-site-ecommerce-xyz",
      "status": "PENDING",
      "owner": {
        "_id": "...",
        "email": "client@evolyte.com",
        "profile": {
          "firstName": "Test",
          "lastName": "Client"
        }
      },
      "template": {
        "name": "Boutique E-commerce",
        "category": "ECOMMERCE"
      },
      "domain": {
        "subdomain": "mon-site-ecommerce-xyz"
      },
      "currentRevision": "1.0",
      "createdAt": "2025-01-18T..."
    }
  }
}
```

Copier le `_id` du projet → `PROJECT_ID`

---

### 📋 Test 2 : Récupérer mes projets

```bash
curl http://localhost:5000/api/v1/projects/my \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "...",
        "name": "Mon Portfolio Pro",
        "status": "DEPLOYED",
        "template": {
          "name": "Portfolio Minimaliste"
        },
        "url": "https://mon-portfolio-pro.evolyte.app",
        "progress": 100,
        "createdAt": "..."
      },
      {
        "_id": "...",
        "name": "Landing Page TechStart",
        "status": "IN_PROGRESS",
        "url": "https://techstart-landing.evolyte.app",
        "progress": 40
      }
    ],
    "total": 4
  }
}
```

---

### 🔍 Test 3 : Récupérer un projet spécifique

```bash
curl http://localhost:5000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Réponse complète avec toutes les données :**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "...",
      "name": "Mon Portfolio Pro",
      "slug": "mon-portfolio-pro",
      "description": "Portfolio professionnel",
      "status": "DEPLOYED",
      "owner": { /* ... */ },
      "template": { /* ... */ },
      "content": {
        "blocks": [
          {
            "blockId": "hero",
            "fields": {
              "heroTitle": "Designer & Créatif",
              "heroSubtitle": "Je crée des expériences digitales"
            }
          }
        ],
        "config": {
          "colors": {
            "primary": "#3B82F6"
          },
          "fonts": {
            "heading": "Poppins"
          }
        }
      },
      "domain": {
        "subdomain": "mon-portfolio-pro",
        "deploymentUrl": "https://mon-portfolio-pro.evolyte.app"
      },
      "deployment": {
        "status": "DEPLOYED",
        "lastDeployment": {
          "deployedAt": "...",
          "version": "1.0",
          "buildTime": 45000
        }
      },
      "revisions": [ /* ... */ ],
      "stats": {
        "totalVisits": 245,
        "uniqueVisitors": 87
      }
    },
    "url": "https://mon-portfolio-pro.evolyte.app",
    "progress": 100,
    "canEdit": true
  }
}
```

---

### ✏️ Test 4 : Mettre à jour le contenu du projet

```bash
curl -X PUT http://localhost:5000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "blocks": [
        {
          "blockId": "hero",
          "fields": {
            "heroTitle": "Designer Créatif & Innovant",
            "heroSubtitle": "Je transforme vos idées en réalité digitale"
          }
        }
      ],
      "config": {
        "colors": {
          "primary": "#6366F1",
          "secondary": "#8B5CF6"
        }
      }
    },
    "changes": "Mise à jour des couleurs et du titre"
  }'
```

**Note :** Ceci crée automatiquement une nouvelle révision (v1.1)

---

### 📜 Test 5 : Récupérer l'historique des révisions

```bash
curl http://localhost:5000/api/v1/projects/PROJECT_ID/revisions \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "revisions": [
      {
        "_id": "...",
        "version": "1.0",
        "createdAt": "2025-01-18T10:00:00Z",
        "createdBy": {
          "profile": {
            "firstName": "Test",
            "lastName": "Client"
          }
        },
        "changes": "Version initiale",
        "isActive": false
      },
      {
        "_id": "...",
        "version": "1.1",
        "createdAt": "2025-01-18T11:30:00Z",
        "changes": "Mise à jour des couleurs et du titre",
        "isActive": true
      }
    ],
    "currentRevision": "1.1"
  }
}
```

---

### ⏪ Test 6 : Restaurer une ancienne révision

```bash
curl -X POST http://localhost:5000/api/v1/projects/PROJECT_ID/revisions/REVISION_ID/restore \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

---

## 🌐 Tests Domaine et Déploiement

### Test 7 : Configurer un sous-domaine

```bash
curl -X PUT http://localhost:5000/api/v1/projects/PROJECT_ID/domain \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "mon-super-portfolio"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Domaine configuré",
  "data": {
    "domain": {
      "subdomain": "mon-super-portfolio"
    },
    "url": "https://mon-super-portfolio.evolyte.app"
  }
}
```

---

### Test 8 : Configurer un domaine personnalisé (nécessite plan STARTER+)

```bash
curl -X PUT http://localhost:5000/api/v1/projects/PROJECT_ID/domain \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customDomain": "monportfolio.com"
  }'
```

**Si compte FREE :**
```json
{
  "success": false,
  "message": "Domaine personnalisé disponible à partir du plan STARTER"
}
```

**Si plan STARTER+ :**
```json
{
  "success": true,
  "message": "Domaine configuré",
  "data": {
    "domain": {
      "customDomain": {
        "domain": "monportfolio.com",
        "verified": false,
        "dnsRecords": [
          {
            "type": "A",
            "name": "@",
            "value": "76.76.21.21",
            "verified": false
          },
          {
            "type": "CNAME",
            "name": "www",
            "value": "cname.evolyte.app",
            "verified": false
          }
        ]
      }
    }
  }
}
```

---

### Test 9 : Vérifier le domaine personnalisé

```bash
curl -X POST http://localhost:5000/api/v1/projects/PROJECT_ID/domain/verify \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

---

### Test 10 : Déployer le projet

```bash
curl -X POST http://localhost:5000/api/v1/projects/PROJECT_ID/deploy \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Déploiement démarré",
  "data": {
    "status": "DEPLOYING",
    "estimatedTime": "5 secondes (simulation)"
  }
}
```

---

### Test 11 : Vérifier le statut du déploiement

```bash
curl http://localhost:5000/api/v1/projects/PROJECT_ID/deployment \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Après déploiement (attendre 5 secondes) :**
```json
{
  "success": true,
  "data": {
    "deployment": {
      "status": "DEPLOYED",
      "lastDeployment": {
        "deployedAt": "2025-01-18T...",
        "deployedBy": {
          "profile": {
            "firstName": "Test",
            "lastName": "Client"
          }
        },
        "version": "1.1",
        "buildTime": 45000
      },
      "deploymentUrl": "https://mon-super-portfolio.evolyte.app"
    },
    "url": "https://mon-super-portfolio.evolyte.app",
    "canDeploy": {
      "allowed": true
    }
  }
}
```

---

## 👥 Tests Collaborateurs

### Test 12 : Ajouter un collaborateur

```bash
curl -X POST http://localhost:5000/api/v1/projects/PROJECT_ID/collaborators \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@evolyte.com",
    "role": "EDITOR"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Collaborateur ajouté",
  "data": {
    "collaborators": [
      {
        "user": {
          "email": "worker@evolyte.com",
          "profile": {
            "firstName": "Test",
            "lastName": "Worker"
          }
        },
        "role": "EDITOR",
        "addedAt": "2025-01-18T..."
      }
    ]
  }
}
```

---

### Test 13 : Le WORKER édite le projet

```bash
# 1. Se connecter en tant que WORKER
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@evolyte.com",
    "password": "Worker@123"
  }'

# Copier WORKER_TOKEN

# 2. Éditer le projet
curl -X PUT http://localhost:5000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "config": {
        "colors": {
          "primary": "#10B981"
        }
      }
    },
    "changes": "Amélioration des couleurs par le worker"
  }'
```

---

### Test 14 : Retirer un collaborateur

```bash
curl -X DELETE http://localhost:5000/api/v1/projects/PROJECT_ID/collaborators/WORKER_USER_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

---

## 📁 Tests Assets

### Test 15 : Ajouter un asset

```bash
curl -X POST http://localhost:5000/api/v1/projects/PROJECT_ID/assets \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "logo.png",
    "type": "image",
    "url": "https://example.com/logo.png",
    "size": 45678
  }'
```

---

### Test 16 : Supprimer un asset

```bash
curl -X DELETE http://localhost:5000/api/v1/projects/PROJECT_ID/assets/ASSET_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

---

### Test 17 : Archiver un projet

```bash
curl -X DELETE http://localhost:5000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Note :** Ceci archive le projet (soft delete), ne le supprime pas définitivement.

---

## 👔 Tests Admin - Statistiques

### Test 18 : Se connecter en ADMIN

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

Copier `ADMIN_TOKEN`

---

### Test 19 : Statistiques globales

```bash
curl http://localhost:5000/api/v1/projects/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProjects": 4,
      "projectsThisPeriod": 4,
      "deployedProjects": 1,
      "activeProjects": 2,
      "customDomainProjects": 0,
      "recentDeployments": 1
    },
    "byStatus": {
      "DEPLOYED": 1,
      "IN_PROGRESS": 1,
      "COMPLETED": 1,
      "PENDING": 1
    },
    "topTemplates": [
      {
        "_id": "Portfolio Minimaliste",
        "count": 2
      },
      {
        "_id": "Landing Page Startup",
        "count": 1
      }
    ],
    "storage": {
      "totalSize": 0,
      "totalAssets": 0
    },
    "topProjects": [ /* ... */ ]
  }
}
```

---

### Test 20 : Dashboard admin détaillé

```bash
curl http://localhost:5000/api/v1/projects/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "projectsLast7Days": 4,
      "projectsLast30Days": 4,
      "deploymentsLast7Days": 1,
      "deploymentsLast30Days": 1,
      "deploymentRate": 25.00,
      "avgBuildTime": 45000
    },
    "dailyGrowth": [
      {
        "_id": "2025-01-18",
        "count": 4
      }
    ],
    "topUsers": [
      {
        "_id": {
          "email": "client@evolyte.com",
          "profile": { /* ... */ }
        },
        "projectCount": 3,
        "deployedCount": 1
      }
    ],
    "needsAttention": []
  }
}
```

---

### Test 21 : Liste tous les projets (Admin)

```bash
# Tous les projets
curl http://localhost:5000/api/v1/projects/admin/all \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Filtrer par statut
curl "http://localhost:5000/api/v1/projects/admin/all?status=DEPLOYED" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Recherche
curl "http://localhost:5000/api/v1/projects/admin/all?search=portfolio" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Pagination
curl "http://localhost:5000/api/v1/projects/admin/all?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Test 22 : Forcer un déploiement (Admin)

```bash
curl -X POST http://localhost:5000/api/v1/projects/admin/PROJECT_ID/deploy \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Test 23 : Mettre à jour un projet (Admin)

```bash
curl -X PUT http://localhost:5000/api/v1/projects/admin/PROJECT_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "MAINTENANCE",
    "metadata": {
      "notes": "En maintenance pour mise à jour"
    }
  }'
```

---

### Test 24 : Supprimer définitivement (SUPER_ADMIN uniquement)

```bash
curl -X DELETE http://localhost:5000/api/v1/projects/admin/PROJECT_ID \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

---

## 🧪 Tests d'Erreurs et Permissions

### Test : Limite de projets atteinte (compte FREE)

```bash
# Essayer de créer plus d'1 projet avec compte FREE
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Projet en trop",
    "templateId": "TEMPLATE_ID"
  }'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Limite de projets atteinte (1). Mettez à jour votre abonnement."
}
```

---

### Test : Éditer un projet sans permission

```bash
# CLIENT essaie d'éditer le projet d'un autre
curl -X PUT http://localhost:5000/api/v1/projects/OTHER_PROJECT_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hack"}'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Permission d'édition requise"
}
```

---

### Test : Déployer sans révision

```bash
# Créer un projet vide et essayer de déployer
curl -X POST http://localhost:5000/api/v1/projects/NEW_PROJECT_ID/deploy \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

---

## 📊 Collection Postman

Créer une collection avec ces dossiers :

### Folder 1 : Projects - CRUD
```
1. POST Create Project
2. GET My Projects
3. GET My Projects (Filtered)
4. GET Project by ID
5. PUT Update Project
6. DELETE Archive Project
```

### Folder 2 : Projects - Revisions
```
7. GET Revisions History
8. POST Restore Revision
```

### Folder 3 : Projects - Collaborators
```
9. POST Add Collaborator
10. DELETE Remove Collaborator
```

### Folder 4 : Projects - Domain & Deploy
```
11. PUT Configure Subdomain
12. PUT Configure Custom Domain
13. POST Verify Domain
14. POST Deploy Project
15. GET Deployment Status
```

### Folder 5 : Projects - Assets
```
16. POST Add Asset
17. DELETE Remove Asset
```

### Folder 6 : Projects - Admin
```
18. GET Stats
19. GET Dashboard
20. GET All Projects
21. POST Force Deploy
22. PUT Update Project (Admin)
23. DELETE Delete Permanently
```

---

## ✅ Checklist de Validation

- [ ] ✅ Création de projet fonctionne
- [ ] ✅ Limite de projets selon abonnement respectée
- [ ] ✅ Template cloning fonctionne
- [ ] ✅ Contenu personnalisé sauvegardé
- [ ] ✅ Révisions créées automatiquement
- [ ] ✅ Restauration de révision fonctionne
- [ ] ✅ Configuration sous-domaine fonctionne
- [ ] ✅ Configuration domaine personnalisé (premium)
- [ ] ✅ Déploiement fonctionne
- [ ] ✅ Stats déploiement enregistrées
- [ ] ✅ Collaborateurs ajoutés/retirés
- [ ] ✅ Permissions EDITOR fonctionnent
- [ ] ✅ Assets ajoutés/supprimés
- [ ] ✅ Archivage (soft delete) fonctionne
- [ ] ✅ Stats admin affichées
- [ ] ✅ Dashboard admin complet
- [ ] ✅ Filtres et recherche fonctionnent
- [ ] ✅ Permissions respectées (Owner, EDITOR, VIEWER)

---

## 🎯 Prochaine Étape

Une fois validé ✅, on peut passer à :

**ÉTAPE 6 : Éditeur de Contenu en Temps Réel**
- Éditeur drag-and-drop
- Preview en temps réel
- WebSocket pour collaboration
- Sauvegarde automatique
- Undo/Redo

**OU**

**ÉTAPE 7 : Déploiement Vercel/Netlify**
- Intégration Vercel API
- Déploiement automatique
- Webhooks
- Logs de build
- SSL automatique

Prêt ? 🚀
