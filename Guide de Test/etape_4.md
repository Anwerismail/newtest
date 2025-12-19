# ✅ ÉTAPE 4 : Système de Tickets - Guide de Test

## 📦 Fichiers Créés

### ✅ Nouveaux fichiers
- ✅ `src/models/Ticket.model.js` - Modèle Ticket complet
- ✅ `src/controllers/tickets.controller.js` - Logique tickets
- ✅ `src/controllers/admin/tickets.controller.js` - Stats et métriques
- ✅ `src/routes/tickets.routes.js` - Routes tickets

### ✅ Fichiers modifiés
- ✅ `src/app.js` - Ajout routes tickets

---

## 🚀 Démarrage

```bash
cd backend
npm run dev
```

Le serveur devrait afficher :
```
🚀 EVOLYTE API STARTED
```

---

## 🧪 Tests API - Scénario Complet

### 🔑 Préparation : Se connecter avec différents rôles

#### 1. Connexion CLIENT

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@evolyte.com",
    "password": "Client@123"
  }'
```

Copier le token → `CLIENT_TOKEN`

#### 2. Connexion MANAGER

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@evolyte.com",
    "password": "Manager@123"
  }'
```

Copier le token → `MANAGER_TOKEN`

#### 3. Connexion WORKER

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@evolyte.com",
    "password": "Worker@123"
  }'
```

Copier le token → `WORKER_TOKEN`

#### 4. Connexion ADMIN

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

Copier le token → `ADMIN_TOKEN`

---

## 📝 Scénario 1 : CLIENT crée un ticket NEW_PROJECT

### Test 1 : Créer un ticket (CLIENT)

```bash
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NEW_PROJECT",
    "category": "FRONTEND",
    "priority": "HIGH",
    "urgency": "NORMAL",
    "title": "Créer mon site portfolio professionnel",
    "description": "Je souhaite un site portfolio moderne pour présenter mes projets de design. Le site doit être responsive et avoir une section blog.",
    "details": {
      "siteName": "Portfolio Sarah Design",
      "domain": "sarahdesign.com",
      "deadline": "2025-02-15"
    },
    "tags": ["portfolio", "design", "blog"]
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Ticket créé avec succès",
  "data": {
    "ticket": {
      "_id": "...",
      "ticketNumber": "EVO-2025-0001",
      "type": "NEW_PROJECT",
      "status": "PENDING",
      "title": "Créer mon site portfolio professionnel",
      "reporter": {
        "_id": "...",
        "profile": {
          "firstName": "Test",
          "lastName": "Client"
        },
        "email": "client@evolyte.com"
      },
      "workflow": [
        {
          "status": "PENDING",
          "changedBy": "...",
          "comment": "Ticket créé",
          "changedAt": "2025-01-18T..."
        }
      ]
    }
  }
}
```

Copier le `_id` du ticket → `TICKET_ID`

### Test 2 : CLIENT voit ses tickets

```bash
curl http://localhost:5000/api/v1/tickets/my \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

### Test 3 : CLIENT ajoute un commentaire

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/comments \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "J'\''ai oublié de préciser : je voudrais aussi une galerie photo pour mes projets."
  }'
```

---

## 👔 Scénario 2 : MANAGER assigne le ticket

### Test 4 : MANAGER voit tous les tickets

```bash
curl http://localhost:5000/api/v1/tickets \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### Test 5 : MANAGER voit les tickets PENDING

```bash
curl "http://localhost:5000/api/v1/tickets?status=PENDING" \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### Test 6 : Récupérer les workers disponibles

```bash
curl http://localhost:5000/api/v1/admin/users/workers/available \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

Copier le `_id` d'un worker → `WORKER_ID`

### Test 7 : MANAGER assigne le ticket au WORKER

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/assign \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "WORKER_ID"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Ticket assigné avec succès",
  "data": {
    "ticket": {
      "ticketNumber": "EVO-2025-0001",
      "status": "ASSIGNED",
      "assignedTo": {
        "_id": "...",
        "profile": {
          "firstName": "Test",
          "lastName": "Worker"
        }
      },
      "assignedBy": {
        "_id": "...",
        "profile": {
          "firstName": "Project",
          "lastName": "Manager"
        }
      },
      "metrics": {
        "responseTime": 5  // minutes depuis création
      }
    }
  }
}
```

---

## 👷 Scénario 3 : WORKER travaille sur le ticket

### Test 8 : WORKER voit ses tickets assignés

```bash
curl http://localhost:5000/api/v1/tickets/my \
  -H "Authorization: Bearer WORKER_TOKEN"
```

### Test 9 : WORKER change le statut → IN_PROGRESS

```bash
curl -X PUT http://localhost:5000/api/v1/tickets/TICKET_ID/status \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "comment": "Je commence le développement du portfolio"
  }'
```

### Test 10 : WORKER ajoute un commentaire

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/comments \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "J'\''ai choisi le template Portfolio Minimaliste. Je commence par la page d'\''accueil."
  }'
```

### Test 11 : WORKER track son temps de travail

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/time \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 120,
    "description": "Développement de la page d'\''accueil et intégration du template"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Temps enregistré",
  "data": {
    "timeEntry": {
      "worker": "...",
      "duration": 120,
      "description": "Développement de la page d'accueil...",
      "createdAt": "2025-01-18T..."
    },
    "totalTime": 120
  }
}
```

### Test 12 : WORKER track plus de temps

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/time \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 90,
    "description": "Ajout de la galerie photo et section blog"
  }'
```

### Test 13 : WORKER passe en REVIEW

```bash
curl -X PUT http://localhost:5000/api/v1/tickets/TICKET_ID/status \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REVIEW",
    "comment": "Première version terminée, prête pour validation"
  }'
```

---

## ✅ Scénario 4 : MANAGER valide

### Test 14 : MANAGER vérifie le ticket

```bash
curl http://localhost:5000/api/v1/tickets/TICKET_ID \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### Test 15 : MANAGER ajoute un commentaire

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/comments \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Excellent travail ! Le design est parfait. Validation accordée."
  }'
```

### Test 16 : MANAGER passe en COMPLETED

```bash
curl -X PUT http://localhost:5000/api/v1/tickets/TICKET_ID/status \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "comment": "Travail validé, prêt pour déploiement"
  }'
```

### Test 17 : WORKER déploie et passe en DEPLOYED

```bash
curl -X PUT http://localhost:5000/api/v1/tickets/TICKET_ID/status \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DEPLOYED",
    "comment": "Site déployé sur https://sarahdesign.com"
  }'
```

---

## 📊 Tests Admin - Statistiques

### Test 18 : Statistiques globales

```bash
curl http://localhost:5000/api/v1/tickets/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "totalTickets": 1,
    "ticketsThisMonth": 1,
    "completedThisMonth": 1,
    "overdueTickets": 0,
    "averageResolutionTime": 210,  // minutes
    "averageResponseTime": 5,
    "byStatus": {
      "DEPLOYED": 1
    },
    "byType": {
      "NEW_PROJECT": 1
    },
    "byPriority": {
      "HIGH": 1
    }
  }
}
```

### Test 19 : Board Kanban

```bash
curl http://localhost:5000/api/v1/tickets/admin/board \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "board": {
      "backlog": [],
      "todo": [],
      "inProgress": [],
      "review": [],
      "done": [
        {
          "ticketNumber": "EVO-2025-0001",
          "title": "Créer mon site portfolio professionnel",
          "status": "DEPLOYED",
          "priority": "HIGH",
          "assignedTo": { /* worker info */ }
        }
      ]
    },
    "counts": {
      "backlog": 0,
      "todo": 0,
      "inProgress": 0,
      "review": 0,
      "done": 1
    }
  }
}
```

### Test 20 : Métriques de performance

```bash
# Métriques des 30 derniers jours
curl http://localhost:5000/api/v1/tickets/admin/metrics \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Métriques des 7 derniers jours
curl "http://localhost:5000/api/v1/tickets/admin/metrics?period=7" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 21 : Tickets en retard

```bash
curl http://localhost:5000/api/v1/tickets/admin/overdue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 22 : Historique du ticket

```bash
curl http://localhost:5000/api/v1/tickets/TICKET_ID/history \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "status": "PENDING",
        "changedBy": { /* client */ },
        "changedAt": "2025-01-18T10:00:00Z",
        "comment": "Ticket créé"
      },
      {
        "status": "ASSIGNED",
        "changedBy": { /* manager */ },
        "changedAt": "2025-01-18T10:05:00Z",
        "comment": "Ticket assigné"
      },
      {
        "status": "IN_PROGRESS",
        "changedBy": { /* worker */ },
        "changedAt": "2025-01-18T10:10:00Z",
        "comment": "Je commence le développement"
      },
      {
        "status": "REVIEW",
        "changedBy": { /* worker */ },
        "changedAt": "2025-01-18T13:30:00Z",
        "comment": "Première version terminée"
      },
      {
        "status": "COMPLETED",
        "changedBy": { /* manager */ },
        "changedAt": "2025-01-18T14:00:00Z",
        "comment": "Travail validé"
      },
      {
        "status": "DEPLOYED",
        "changedBy": { /* worker */ },
        "changedAt": "2025-01-18T14:30:00Z",
        "comment": "Site déployé"
      }
    ]
  }
}
```

---

## 🧪 Tests Additionnels

### Test 23 : Créer un ticket BUG_FIX

```bash
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "BUG_FIX",
    "category": "FRONTEND",
    "priority": "CRITICAL",
    "urgency": "URGENT",
    "title": "Menu mobile ne fonctionne pas",
    "description": "Le menu hamburger ne s'\''ouvre pas sur mobile",
    "details": {
      "bugDescription": "Quand je clique sur le menu hamburger, rien ne se passe",
      "stepsToReproduce": [
        "Aller sur le site en mobile",
        "Cliquer sur le menu hamburger",
        "Observer qu'\''il ne s'\''ouvre pas"
      ],
      "expectedBehavior": "Le menu devrait s'\''ouvrir",
      "actualBehavior": "Rien ne se passe",
      "browserInfo": "iPhone Safari",
      "severity": "CRITICAL"
    }
  }'
```

### Test 24 : Filtrer les tickets

```bash
# Par type
curl "http://localhost:5000/api/v1/tickets?type=BUG_FIX" \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Par priorité
curl "http://localhost:5000/api/v1/tickets?priority=CRITICAL" \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Par statut
curl "http://localhost:5000/api/v1/tickets?status=PENDING" \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Combiné
curl "http://localhost:5000/api/v1/tickets?type=BUG_FIX&priority=CRITICAL&status=PENDING" \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Recherche
curl "http://localhost:5000/api/v1/tickets?search=menu" \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### Test 25 : Modifier un ticket

```bash
curl -X PUT http://localhost:5000/api/v1/tickets/TICKET_ID \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "URGENT",
    "dueDate": "2025-01-20"
  }'
```

### Test 26 : CLIENT essaie d'assigner (doit échouer)

```bash
curl -X POST http://localhost:5000/api/v1/tickets/TICKET_ID/assign \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "WORKER_ID"
  }'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Action interdite"
}
```

### Test 27 : WORKER essaie de tracker temps sur ticket non assigné

```bash
curl -X POST http://localhost:5000/api/v1/tickets/OTHER_TICKET_ID/time \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 60,
    "description": "Test"
  }'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Vous ne pouvez tracker le temps que sur vos tickets assignés"
}
```

---

## ✅ Checklist de Validation

- [ ] ✅ CLIENT peut créer NEW_PROJECT, SUPPORT, CONTENT_UPDATE
- [ ] ✅ CLIENT ne peut PAS créer BUG_FIX, MODIFICATION, REDESIGN
- [ ] ✅ CLIENT voit uniquement ses tickets
- [ ] ✅ MANAGER peut assigner tickets
- [ ] ✅ MANAGER voit tous les tickets
- [ ] ✅ WORKER voit ses tickets assignés
- [ ] ✅ WORKER peut changer statut de ses tickets
- [ ] ✅ WORKER peut tracker son temps
- [ ] ✅ Commentaires fonctionnent
- [ ] ✅ Historique complet enregistré
- [ ] ✅ Métriques calculées (responseTime, resolutionTime)
- [ ] ✅ Stats admin fonctionnent
- [ ] ✅ Board Kanban fonctionne
- [ ] ✅ Filtres multiples fonctionnent
- [ ] ✅ Recherche textuelle fonctionne
- [ ] ✅ Pagination fonctionne
- [ ] ✅ Permissions respectées

---

## 🎯 Prochaine Étape

Une fois validé ✅, on passe à :

**ÉTAPE 5 : Gestion de Projets**
- Modèle Project complet
- Lien Projet ↔ Tickets ↔ Templates
- Éditeur de contenu
- Preview en temps réel
- Révisions et versioning
- Gestion du domaine

Prêt ? 🚀