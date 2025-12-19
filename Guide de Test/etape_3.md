# ✅ ÉTAPE 3 : Système de Templates - Guide de Test

## 📦 Fichiers Créés

### ✅ Nouveaux fichiers
- ✅ `src/models/Template.model.js` - Modèle Template complet
- ✅ `src/controllers/templates.controller.js` - Logique CRUD templates
- ✅ `src/routes/templates.routes.js` - Routes templates
- ✅ `src/database/seeds/templates.seed.js` - Seed templates par défaut

### ✅ Fichiers modifiés
- ✅ `src/app.js` - Ajout routes templates
- ✅ `package.json` - Nouveau script `seed:templates`

---

## 🚀 Démarrage

### 1. Seed les Templates

```bash
cd backend
npm run seed:templates
```

Vous devriez voir :

```
✅ Connected to MongoDB
🗑️  Existing templates cleared
✅ 5 templates créés avec succès
   📄 Portfolio Minimaliste (PORTFOLIO)
   📄 Landing Page Startup (BUSINESS)
   📄 Boutique E-commerce (ECOMMERCE)
   📄 Blog Personnel (BLOG)
   📄 Restaurant Élégant (RESTAURANT)
```

### 2. Lancer le serveur

```bash
npm run dev
```

---

## 🧪 Tests API - Templates Publiques

### Test 1 : Récupérer tous les templates

```bash
curl http://localhost:5000/api/v1/templates
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "...",
        "name": "Portfolio Minimaliste",
        "slug": "portfolio-minimaliste",
        "description": "Portfolio épuré et moderne...",
        "type": "static",
        "category": "PORTFOLIO",
        "complexity": "simple",
        "preview": {
          "thumbnail": "https://images.unsplash.com/...",
          "demoUrl": "https://demo.siteforge.com/portfolio-minimaliste"
        },
        "features": ["Design minimaliste", "Responsive", ...],
        "technologies": ["HTML5", "CSS3", "JavaScript"],
        "tags": ["portfolio", "minimal", "modern"],
        "pricing": {
          "free": true,
          "premium": false,
          "price": 0
        },
        "metadata": {
          "downloads": 0,
          "rating": 5
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 12,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### Test 2 : Filtrer par catégorie

```bash
# Templates PORTFOLIO
curl "http://localhost:5000/api/v1/templates?category=PORTFOLIO"

# Templates BUSINESS
curl "http://localhost:5000/api/v1/templates?category=BUSINESS"

# Templates ECOMMERCE (premium)
curl "http://localhost:5000/api/v1/templates?category=ECOMMERCE"

# Templates BLOG
curl "http://localhost:5000/api/v1/templates?category=BLOG"

# Templates RESTAURANT
curl "http://localhost:5000/api/v1/templates?category=RESTAURANT"
```

---

### Test 3 : Filtrer par type

```bash
# Templates statiques
curl "http://localhost:5000/api/v1/templates?type=static"

# Templates React
curl "http://localhost:5000/api/v1/templates?type=react"

# Templates Next.js
curl "http://localhost:5000/api/v1/templates?type=nextjs"
```

---

### Test 4 : Filtrer par complexité

```bash
# Templates simples
curl "http://localhost:5000/api/v1/templates?complexity=simple"

# Templates medium
curl "http://localhost:5000/api/v1/templates?complexity=medium"

# Templates avancés
curl "http://localhost:5000/api/v1/templates?complexity=advanced"
```

---

### Test 5 : Filtrer par pricing

```bash
# Templates gratuits
curl "http://localhost:5000/api/v1/templates?pricing=free"

# Templates premium
curl "http://localhost:5000/api/v1/templates?pricing=premium"
```

---

### Test 6 : Recherche textuelle

```bash
# Rechercher "portfolio"
curl "http://localhost:5000/api/v1/templates?search=portfolio"

# Rechercher "restaurant"
curl "http://localhost:5000/api/v1/templates?search=restaurant"

# Rechercher "modern"
curl "http://localhost:5000/api/v1/templates?search=modern"
```

---

### Test 7 : Filtrer par tags

```bash
# Par tag "responsive"
curl "http://localhost:5000/api/v1/templates?tags=responsive"

# Par tags multiples
curl "http://localhost:5000/api/v1/templates?tags=portfolio,modern"
```

---

### Test 8 : Tri et pagination

```bash
# Trier par downloads (décroissant)
curl "http://localhost:5000/api/v1/templates?sortBy=metadata.downloads&order=desc"

# Trier par rating
curl "http://localhost:5000/api/v1/templates?sortBy=metadata.rating&order=desc"

# Pagination
curl "http://localhost:5000/api/v1/templates?page=1&limit=3"

# Combinaison
curl "http://localhost:5000/api/v1/templates?category=PORTFOLIO&sortBy=metadata.rating&page=1&limit=5"
```

---

### Test 9 : Récupérer un template par ID

```bash
# Remplacer TEMPLATE_ID
curl http://localhost:5000/api/v1/templates/TEMPLATE_ID
```

---

### Test 10 : Récupérer un template par slug

```bash
# Par slug
curl http://localhost:5000/api/v1/templates/portfolio-minimaliste

curl http://localhost:5000/api/v1/templates/landing-page-startup

curl http://localhost:5000/api/v1/templates/boutique-ecommerce
```

**Réponse complète avec le code :**
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "...",
      "name": "Portfolio Minimaliste",
      "slug": "portfolio-minimaliste",
      "description": "...",
      "structure": {
        "html": "<!DOCTYPE html>...",
        "css": "* { margin: 0; ... }",
        "js": ""
      },
      "blocks": [
        {
          "id": "hero",
          "name": "Section Hero",
          "fields": [
            {
              "name": "heroTitle",
              "type": "text",
              "label": "Titre principal",
              "default": "Bonjour, je suis Designer"
            }
          ]
        }
      ],
      "config": {
        "colors": {
          "primary": "#3B82F6",
          "secondary": "#10B981"
        },
        "fonts": {
          "heading": "Poppins",
          "body": "Inter"
        }
      }
    }
  }
}
```

---

### Test 11 : Récupérer les catégories

```bash
curl http://localhost:5000/api/v1/templates/categories
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "PORTFOLIO",
        "count": 1,
        "topTemplates": [ /* 3 premiers templates */ ]
      },
      {
        "category": "BUSINESS",
        "count": 1,
        "topTemplates": []
      },
      {
        "category": "ECOMMERCE",
        "count": 1,
        "topTemplates": []
      },
      {
        "category": "BLOG",
        "count": 1,
        "topTemplates": []
      },
      {
        "category": "RESTAURANT",
        "count": 1,
        "topTemplates": []
      }
    ]
  }
}
```

---

### Test 12 : Templates populaires

```bash
# Top 6 par défaut
curl http://localhost:5000/api/v1/templates/popular

# Top 3
curl "http://localhost:5000/api/v1/templates/popular?limit=3"

# Top 10
curl "http://localhost:5000/api/v1/templates/popular?limit=10"
```

---

## 🔐 Tests API - Templates Authentifiés

### Test 13 : Cloner un template (requiert auth)

```bash
# 1. Se connecter
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@siteforge.com","password":"Client@123"}'

# 2. Cloner un template
curl -X POST http://localhost:5000/api/v1/templates/TEMPLATE_ID/clone \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Template cloné avec succès",
  "data": {
    "template": {
      /* Template complet avec tout le code */
      "structure": {
        "html": "...",
        "css": "...",
        "js": "..."
      },
      "metadata": {
        "downloads": 1  // Incrémenté
      }
    }
  }
}
```

---

### Test 14 : Templates recommandés (requiert auth)

```bash
curl http://localhost:5000/api/v1/templates/recommended \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Test 15 : Ajouter une review (requiert auth)

```bash
curl -X POST http://localhost:5000/api/v1/templates/TEMPLATE_ID/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent template, très facile à personnaliser !"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Review ajoutée avec succès",
  "data": {
    "template": {
      "metadata": {
        "rating": 5,
        "reviews": [
          {
            "user": "...",
            "rating": 5,
            "comment": "Excellent template...",
            "createdAt": "2025-01-18T..."
          }
        ]
      }
    }
  }
}
```

---

## 🔒 Tests API - Admin

### Test 16 : Se connecter en admin

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@siteforge.com","password":"Admin@123"}'
```

---

### Test 17 : Statistiques templates (admin)

```bash
curl http://localhost:5000/api/v1/templates/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "totalTemplates": 5,
    "publishedTemplates": 5,
    "draftTemplates": 0,
    "totalDownloads": 0,
    "byCategory": {
      "PORTFOLIO": 1,
      "BUSINESS": 1,
      "ECOMMERCE": 1,
      "BLOG": 1,
      "RESTAURANT": 1
    },
    "topTemplates": [
      {
        "_id": "...",
        "name": "Portfolio Minimaliste",
        "metadata": { "downloads": 0 }
      }
    ]
  }
}
```

---

### Test 18 : Créer un template (admin)

```bash
curl -X POST http://localhost:5000/api/v1/templates/admin \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Template Test",
    "description": "Template de test créé par admin",
    "type": "static",
    "category": "PORTFOLIO",
    "complexity": "simple",
    "preview": {
      "thumbnail": "https://via.placeholder.com/800"
    },
    "pricing": {
      "free": true,
      "premium": false,
      "price": 0
    },
    "tags": ["test", "admin"],
    "features": ["Feature 1", "Feature 2"],
    "technologies": ["HTML5", "CSS3"]
  }'
```

---

### Test 19 : Modifier un template (admin)

```bash
curl -X PUT http://localhost:5000/api/v1/templates/admin/TEMPLATE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Nom",
    "description": "Nouvelle description",
    "status": "published",
    "pricing": {
      "free": false,
      "premium": true,
      "price": 29.99
    }
  }'
```

---

### Test 20 : Supprimer un template (super admin)

```bash
curl -X DELETE http://localhost:5000/api/v1/templates/admin/TEMPLATE_ID \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

---

## 🧪 Tests d'Erreurs

### Test : Template premium sans auth

```bash
# Template e-commerce (premium)
curl http://localhost:5000/api/v1/templates/boutique-ecommerce
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Connexion requise pour accéder à ce template"
}
```

---

### Test : Template premium avec compte FREE

```bash
# Se connecter avec un compte FREE
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@siteforge.com","password":"Client@123"}'

# Essayer d'accéder à un template premium
curl http://localhost:5000/api/v1/templates/PREMIUM_TEMPLATE_ID \
  -H "Authorization: Bearer CLIENT_FREE_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Abonnement premium requis"
}
```

---

### Test : Review en double

```bash
# Ajouter une review
curl -X POST http://localhost:5000/api/v1/templates/TEMPLATE_ID/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Super !"}'

# Essayer d'ajouter une autre review
curl -X POST http://localhost:5000/api/v1/templates/TEMPLATE_ID/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "comment": "Encore !"}'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Vous avez déjà noté ce template"
}
```

---

## ✅ Checklist de Validation

Vérifier que :

- [ ] ✅ Les templates sont seedés correctement
- [ ] ✅ Liste de tous les templates fonctionne
- [ ] ✅ Filtres (catégorie, type, complexity) fonctionnent
- [ ] ✅ Recherche textuelle fonctionne
- [ ] ✅ Pagination fonctionne
- [ ] ✅ Tri (downloads, rating) fonctionne
- [ ] ✅ Récupération par ID/slug fonctionne
- [ ] ✅ Catégories avec compteurs fonctionnent
- [ ] ✅ Templates populaires fonctionnent
- [ ] ✅ Clone template fonctionne (incrémente downloads)
- [ ] ✅ Ajout review fonctionne (recalcule rating)
- [ ] ✅ Protection premium fonctionne
- [ ] ✅ Stats admin fonctionnent
- [ ] ✅ Création template (admin) fonctionne
- [ ] ✅ Modification template (admin) fonctionne
- [ ] ✅ Suppression template (super admin) fonctionne

---

## 📊 Collection Postman

Créer une collection avec ces dossiers :

### Folder 1 : Templates - Public
```
1. GET All Templates
2. GET By Category
3. GET By Type
4. GET By Complexity
5. GET Search
6. GET Popular
7. GET Categories
8. GET Template by ID
9. GET Template by Slug
```

### Folder 2 : Templates - Authenticated
```
10. POST Clone Template
11. GET Recommended
12. POST Add Review
```

### Folder 3 : Templates - Admin
```
13. GET Stats
14. POST Create Template
15. PUT Update Template
16. DELETE Delete Template
```

---

## 🎯 Prochaine Étape

Une fois validé ✅, on passe à :

**ÉTAPE 4 : Système de Tickets (Jira-like)**
- Modèle Ticket complet
- Création et assignation
- Workflow et statuts
- Commentaires
- Time tracking
- Board Kanban

Prêt ? 🚀