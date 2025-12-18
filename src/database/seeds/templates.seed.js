import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import Template from '../../models/Template.model.js';

const seedTemplates = async () => {
    try {
        // Connect to DB
        await mongoose.connect(config.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing templates
        await Template.deleteMany({});
        console.log('🗑️  Existing templates cleared');

        // Templates à créer
        const templates = [
            // ====================================
            // PORTFOLIO
            // ====================================
            {
                name: 'Portfolio Minimaliste',
                slug: 'portfolio-minimaliste',
                description: 'Portfolio épuré et moderne pour présenter vos projets avec élégance',
                type: 'static',
                category: 'PORTFOLIO',
                complexity: 'simple',

                structure: {
                    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{siteName}}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">
    <nav class="nav">
      <div class="logo">{{siteName}}</div>
      <ul class="nav-links">
        <li><a href="#about">À propos</a></li>
        <li><a href="#projects">Projets</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section class="hero">
    <h1>{{heroTitle}}</h1>
    <p>{{heroSubtitle}}</p>
    <a href="#projects" class="cta-button">Voir mes projets</a>
  </section>

  <section id="about" class="section">
    <h2>À propos</h2>
    <p>{{aboutText}}</p>
  </section>

  <section id="projects" class="section projects">
    <h2>Mes Projets</h2>
    <div class="projects-grid">
      <!-- Projects will be injected here -->
    </div>
  </section>

  <section id="contact" class="section contact">
    <h2>Contact</h2>
    <form class="contact-form">
      <input type="text" placeholder="Nom" required>
      <input type="email" placeholder="Email" required>
      <textarea placeholder="Message" required></textarea>
      <button type="submit">Envoyer</button>
    </form>
  </section>

  <footer class="footer">
    <p>&copy; 2025 {{siteName}}. Tous droits réservés.</p>
  </footer>
</body>
</html>
          `,
                    css: `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  color: #333;
}

.header {
  position: fixed;
  top: 0;
  width: 100%;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3B82F6;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #3B82F6;
}

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.cta-button {
  display: inline-block;
  padding: 1rem 2rem;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 50px;
  font-weight: bold;
  transition: transform 0.3s;
}

.cta-button:hover {
  transform: translateY(-5px);
}

.section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
}

.section h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.contact-form {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-form input,
.contact-form textarea {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.contact-form button {
  padding: 1rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.contact-form button:hover {
  background: #2563EB;
}

.footer {
  background: #1F2937;
  color: white;
  text-align: center;
  padding: 2rem;
}
          `,
                    js: ''
                },

                blocks: [
                    {
                        id: 'hero',
                        name: 'Section Hero',
                        description: 'En-tête principal avec titre et sous-titre',
                        editable: true,
                        fields: [
                            { name: 'heroTitle', type: 'text', label: 'Titre principal', default: 'Bonjour, je suis Designer' },
                            { name: 'heroSubtitle', type: 'text', label: 'Sous-titre', default: 'Créateur d\'expériences digitales uniques' }
                        ]
                    },
                    {
                        id: 'about',
                        name: 'Section À propos',
                        description: 'Présentation personnelle',
                        editable: true,
                        fields: [
                            { name: 'aboutText', type: 'textarea', label: 'Texte de présentation', default: 'Passionné par le design...' }
                        ]
                    }
                ],

                preview: {
                    thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800',
                    screenshots: [
                        'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200'
                    ],
                    demoUrl: 'https://demo.siteforge.com/portfolio-minimaliste'
                },

                features: [
                    'Design minimaliste',
                    'Responsive',
                    'Animations smooth',
                    'Formulaire de contact',
                    'Section projets'
                ],

                technologies: ['HTML5', 'CSS3', 'JavaScript'],
                tags: ['portfolio', 'minimal', 'modern', 'responsive'],

                pricing: {
                    free: true,
                    premium: false,
                    price: 0
                }
            },

            // ====================================
            // BUSINESS
            // ====================================
            {
                name: 'Landing Page Startup',
                slug: 'landing-page-startup',
                description: 'Landing page moderne pour startups et SaaS avec sections complètes',
                type: 'static',
                category: 'BUSINESS',
                complexity: 'medium',

                structure: {
                    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{siteName}}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">
    <nav class="nav">
      <div class="logo">{{siteName}}</div>
      <ul class="nav-links">
        <li><a href="#features">Fonctionnalités</a></li>
        <li><a href="#pricing">Tarifs</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <button class="cta-nav">Commencer</button>
    </nav>
  </header>

  <section class="hero">
    <div class="hero-content">
      <h1>{{heroTitle}}</h1>
      <p>{{heroSubtitle}}</p>
      <div class="hero-buttons">
        <button class="btn-primary">Essai gratuit</button>
        <button class="btn-secondary">En savoir plus</button>
      </div>
    </div>
    <div class="hero-image">
      <img src="{{heroImage}}" alt="Hero">
    </div>
  </section>

  <section id="features" class="features">
    <h2>Fonctionnalités</h2>
    <div class="features-grid">
      <!-- Features cards -->
    </div>
  </section>

  <section id="pricing" class="pricing">
    <h2>Tarifs</h2>
    <div class="pricing-cards">
      <!-- Pricing cards -->
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2025 {{siteName}}</p>
  </footer>
</body>
</html>
          `,
                    css: `
/* Styles for landing page */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  color: #1F2937;
}

.header {
  position: fixed;
  top: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0,0,0,0.1);
  z-index: 1000;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-content h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.btn-primary {
  padding: 1rem 2rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}
          `,
                    js: ''
                },

                preview: {
                    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
                    screenshots: []
                },

                features: [
                    'Hero section impactante',
                    'Section fonctionnalités',
                    'Pricing cards',
                    'Call-to-action optimisés',
                    'Animations',
                    'Responsive'
                ],

                technologies: ['HTML5', 'CSS3', 'JavaScript'],
                tags: ['business', 'landing', 'saas', 'startup'],

                pricing: {
                    free: true,
                    premium: false,
                    price: 0
                }
            },

            // ====================================
            // E-COMMERCE
            // ====================================
            {
                name: 'Boutique E-commerce',
                slug: 'boutique-ecommerce',
                description: 'Template e-commerce complet avec panier et checkout',
                type: 'react',
                category: 'ECOMMERCE',
                complexity: 'advanced',

                repository: {
                    provider: 'github',
                    url: 'https://github.com/siteforge/template-ecommerce',
                    branch: 'main',
                    framework: 'React 18',
                    language: 'JavaScript',
                    styling: 'TailwindCSS',
                    buildCommand: 'npm run build',
                    outputDir: 'dist'
                },

                envVariables: [
                    { key: 'VITE_STRIPE_PUBLIC_KEY', required: true, description: 'Clé publique Stripe' },
                    { key: 'VITE_API_URL', required: true, description: 'URL de l\'API backend' }
                ],

                preview: {
                    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
                    screenshots: []
                },

                features: [
                    'Catalogue produits',
                    'Panier d\'achat',
                    'Checkout Stripe',
                    'Gestion commandes',
                    'Compte client',
                    'Responsive'
                ],

                technologies: ['React', 'TailwindCSS', 'Stripe', 'React Router'],
                tags: ['ecommerce', 'shop', 'stripe', 'react'],

                pricing: {
                    free: false,
                    premium: true,
                    price: 49.99
                },

                visibility: 'premium'
            },

            // ====================================
            // BLOG
            // ====================================
            {
                name: 'Blog Personnel',
                slug: 'blog-personnel',
                description: 'Blog moderne pour partager vos articles et idées',
                type: 'static',
                category: 'BLOG',
                complexity: 'simple',

                structure: {
                    html: `<!-- Blog HTML -->`,
                    css: `/* Blog CSS */`,
                    js: ''
                },

                preview: {
                    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
                    screenshots: []
                },

                features: [
                    'Liste d\'articles',
                    'Page article',
                    'Catégories',
                    'Recherche',
                    'Commentaires',
                    'RSS feed'
                ],

                technologies: ['HTML5', 'CSS3', 'JavaScript'],
                tags: ['blog', 'articles', 'writing'],

                pricing: {
                    free: true,
                    premium: false,
                    price: 0
                }
            },

            // ====================================
            // RESTAURANT
            // ====================================
            {
                name: 'Restaurant Élégant',
                slug: 'restaurant-elegant',
                description: 'Site vitrine pour restaurant avec menu et réservations',
                type: 'static',
                category: 'RESTAURANT',
                complexity: 'medium',

                structure: {
                    html: `<!-- Restaurant HTML -->`,
                    css: `/* Restaurant CSS */`,
                    js: ''
                },

                preview: {
                    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
                    screenshots: []
                },

                features: [
                    'Menu interactif',
                    'Galerie photos',
                    'Système de réservation',
                    'Google Maps',
                    'Horaires',
                    'Avis clients'
                ],

                technologies: ['HTML5', 'CSS3', 'JavaScript'],
                tags: ['restaurant', 'food', 'menu', 'booking'],

                pricing: {
                    free: true,
                    premium: false,
                    price: 0
                }
            }
        ];

        // Insérer les templates
        await Template.insertMany(templates);
        console.log(`✅ ${templates.length} templates créés avec succès`);

        // Afficher les templates créés
        templates.forEach(template => {
            console.log(`   📄 ${template.name} (${template.category})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedTemplates();