# 👷 Worker Role - Permissions & Access Guide

## Overview

The **WORKER** role is designed for developers, designers, and technical staff who execute tasks and work on projects. They have focused permissions for completing assigned work without administrative access.

---

## 🔐 Role Level: 1 (out of 4)

```
SUPER_ADMIN (4) → ADMIN (3) → PROJECT_MANAGER (2) → WORKER (1) → CLIENT (0)
```

---

## ✅ What Workers CAN Do

### 🎫 **Tickets** (Primary Responsibility)

#### View Access
- ✅ **View all tickets assigned to them**
  - `GET /api/v1/tickets/my` - See their assigned tickets
  - `GET /api/v1/tickets/:id` - View ticket details
  - `GET /api/v1/tickets/:id/history` - View ticket history

#### Ticket Actions
- ✅ **Create tickets** 
  - `POST /api/v1/tickets` - Report bugs, request features
  
- ✅ **Update tickets**
  - `PUT /api/v1/tickets/:id` - Update ticket details
  - `PUT /api/v1/tickets/:id/status` - Change status (OPEN → IN_PROGRESS → IN_REVIEW → RESOLVED)
  
- ✅ **Add comments**
  - `POST /api/v1/tickets/:id/comments` - Communicate progress, ask questions
  
- ✅ **Track time** (Important!)
  - `POST /api/v1/tickets/:id/time` - Log hours worked on tickets
  - Required for billing and performance tracking

#### Restrictions
- ❌ Cannot assign tickets to others
- ❌ Cannot view admin statistics
- ❌ Cannot see all tickets (only assigned ones)
- ❌ Cannot delete tickets

---

### 📦 **Projects** (Limited Access)

#### View Access
- ✅ **View projects they're working on**
  - `GET /api/v1/projects/my` - See their projects
  - `GET /api/v1/projects/:id` - View project details if assigned

#### Project Actions
- ✅ **Update project content** (if assigned as collaborator)
  - `PUT /api/v1/projects/:id` - Make changes to project
  
- ✅ **Upload assets**
  - `POST /api/v1/projects/:id/assets/upload` - Upload images, files
  - `POST /api/v1/projects/:id/assets` - Add asset references
  
- ✅ **View revisions**
  - `GET /api/v1/projects/:id/revisions` - See project history

#### Restrictions
- ❌ Cannot create new projects
- ❌ Cannot delete projects
- ❌ Cannot deploy projects (only Manager/Admin)
- ❌ Cannot manage domains
- ❌ Cannot add/remove collaborators
- ❌ Limited to projects where they are collaborators

---

### 🎨 **Templates** (Full Create Access!)

#### View Access
- ✅ **Browse all templates**
  - `GET /api/v1/templates` - List all templates
  - `GET /api/v1/templates/:id` - View template details
  - `GET /api/v1/templates/categories` - Browse categories
  - `GET /api/v1/templates/popular` - See popular templates
  - `GET /api/v1/templates/recommended` - Get recommendations

#### Template Actions
- ✅ **Create templates** (NEW!)
  - `POST /api/v1/templates` - Create new templates
  - Workers can now contribute templates to the library!
  
- ✅ **Clone templates** (for assigned projects)
  - `POST /api/v1/templates/:id/clone` - Use template for project
  
- ✅ **Review templates**
  - `POST /api/v1/templates/:id/review` - Add rating and feedback

#### Restrictions
- ❌ Cannot modify other users' templates
- ❌ Cannot delete templates (only Super Admin)
- ❌ Cannot access template admin statistics

---

### 👤 **Account Management** (Personal Only)

#### Personal Actions
- ✅ **View own profile**
  - `GET /api/v1/auth/me` - Get profile details
  
- ✅ **Update own profile**
  - `PUT /api/v1/auth/profile` - Change personal info
  
- ✅ **Change own password**
  - `PUT /api/v1/auth/password` - Update password
  
- ✅ **Logout**
  - `POST /api/v1/auth/logout` - End session

#### Restrictions
- ❌ Cannot view other users
- ❌ Cannot create users
- ❌ Cannot modify other users
- ❌ Cannot access admin panel
- ❌ Cannot view user statistics

---

## ❌ What Workers CANNOT Do

### 🚫 **Administrative Functions**
- ❌ Access `/api/v1/admin/*` endpoints
- ❌ View system statistics
- ❌ Manage users
- ❌ View financial data
- ❌ Change system settings

### 🚫 **Project Management**
- ❌ Create new projects independently
- ❌ Delete projects
- ❌ Deploy to production (requires Manager/Admin)
- ❌ Configure custom domains
- ❌ Manage project collaborators
- ❌ Force deployments

### 🚫 **Ticket Management**
- ❌ Assign tickets to others
- ❌ View all tickets in system
- ❌ Delete tickets
- ❌ Access ticket analytics/metrics
- ❌ View Kanban board (admin feature)

### 🚫 **Template Management**
- ❌ Create templates
- ❌ Modify existing templates
- ❌ Delete templates
- ❌ Access template admin panel

---

## 🎯 Typical Worker Workflow

### Daily Tasks

1. **Check Assigned Tickets**
   ```
   GET /api/v1/tickets/my?status=OPEN,IN_PROGRESS
   ```

2. **Start Working on a Ticket**
   ```
   PUT /api/v1/tickets/:id/status
   Body: { "status": "IN_PROGRESS", "comment": "Starting work on this" }
   ```

3. **Update Progress via Comments**
   ```
   POST /api/v1/tickets/:id/comments
   Body: { "content": "Implemented the navigation fix" }
   ```

4. **Track Time Spent**
   ```
   POST /api/v1/tickets/:id/time
   Body: { "duration": 120, "description": "Fixed responsive menu" }
   ```

5. **Upload Work Assets**
   ```
   POST /api/v1/projects/:id/assets/upload
   Body: FormData with file
   ```

6. **Mark Ticket as Complete**
   ```
   PUT /api/v1/tickets/:id/status
   Body: { "status": "IN_REVIEW", "comment": "Ready for review" }
   ```

### Creating Templates (NEW Feature!)

Workers can now contribute templates to the library:

```bash
POST /api/v1/templates
Content-Type: application/json

{
  "name": "E-Commerce Shop Template",
  "description": "A modern e-commerce template with shopping cart and checkout",
  "category": "ECOMMERCE",
  "type": "react",
  "preview": {
    "thumbnail": "https://example.com/thumbnail.jpg",
    "images": [
      "https://example.com/preview1.jpg",
      "https://example.com/preview2.jpg"
    ]
  },
  "tags": ["ecommerce", "shopping", "modern", "responsive"],
  "complexity": "INTERMEDIATE",
  "features": [
    "Product catalog",
    "Shopping cart",
    "Checkout process",
    "Payment integration"
  ],
  "technologies": ["React", "Redux", "Tailwind CSS"],
  "demoUrl": "https://demo.example.com"
}
```

**Benefits:**
- ✅ Build your portfolio by creating reusable templates
- ✅ Get recognition when others use your templates
- ✅ Earn ratings and reviews from users
- ✅ Showcase your technical skills

---

## 📊 Performance Tracking

Workers are evaluated based on:
- ✅ **Time tracking accuracy** - Log hours for all work
- ✅ **Ticket completion rate** - Resolve assigned tickets
- ✅ **Quality of work** - Code reviews, bug-free implementations
- ✅ **Communication** - Regular updates via comments
- ✅ **Response time** - How quickly tickets are addressed

---

## 🔒 Security & Best Practices

### Do's ✅
- ✅ Only access assigned projects
- ✅ Log time accurately for billing
- ✅ Comment on tickets regularly
- ✅ Ask questions if requirements unclear
- ✅ Test work before marking complete

### Don'ts ❌
- ❌ Try to access admin endpoints
- ❌ Modify unassigned projects
- ❌ Share JWT tokens with others
- ❌ Leave tickets without updates for too long
- ❌ Deploy without manager approval

---

## 📈 Career Progression

### Worker → Project Manager
To advance to Project Manager role, workers should:
1. Consistently deliver high-quality work
2. Show leadership on complex tickets
3. Help mentor other workers
4. Demonstrate project planning skills
5. Request promotion from Admin/Super Admin

---

## 🆘 Need Help?

### For Workers:
- **Technical issues**: Create a ticket with type `SUPPORT`
- **Access issues**: Contact your Project Manager
- **Feature requests**: Create ticket with type `MODIFICATION`
- **Questions**: Comment on existing tickets or ask PM

### Escalation Path:
```
Worker → Project Manager → Admin → Super Admin
```

---

## 📝 Summary Table

| Category | Create | Read | Update | Delete | Deploy |
|----------|--------|------|--------|--------|--------|
| **Tickets (Assigned)** | ✅ | ✅ | ✅ | ❌ | - |
| **Tickets (All)** | ✅ | ❌ | ❌ | ❌ | - |
| **Projects (Assigned)** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Projects (All)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Templates** | ✅ | ✅ | ❌ | ❌ | - |
| **Users** | ❌ | ❌ | ❌ | ❌ | - |
| **Own Profile** | - | ✅ | ✅ | ❌ | - |
| **Time Tracking** | ✅ | ✅ | ❌ | ❌ | - |
| **Comments** | ✅ | ✅ | ❌ | ❌ | - |
| **Assets** | ✅ | ✅ | ❌ | ✅ | - |

---

**Role:** WORKER (Level 1)  
**Primary Function:** Execute assigned tasks and tickets  
**Reports To:** Project Manager  
**Can Manage:** Own tickets, assigned projects, personal profile  
**Focus:** Development, implementation, bug fixes, content updates
