import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../../models/Project.model.js';
import Template from '../../models/Template.model.js';
import User from '../../models/User.model.js';
import Ticket from '../../models/Ticket.model.js';
import { connectDB } from '../../config/database.js';

dotenv.config();

const seedProjects = async () => {
    try {
        console.log('🌱 Starting project seeding...\n');

        // Connecter à la DB
        await connectDB();

        // Trouver les utilisateurs et templates nécessaires
        const client = await User.findOne({ email: 'client@evolyte.com' });
        const admin = await User.findOne({ email: 'admin@evolyte.com' });
        const worker = await User.findOne({ email: 'worker@evolyte.com' });
        
        const portfolioTemplate = await Template.findOne({ slug: 'portfolio-minimaliste' });
        const landingTemplate = await Template.findOne({ slug: 'landing-page-startup' });
        const blogTemplate = await Template.findOne({ slug: 'blog-personnel' });

        if (!client || !admin || !worker) {
            console.log('❌ Users not found. Please run admin seed first: npm run seed');
            process.exit(1);
        }

        if (!portfolioTemplate || !landingTemplate || !blogTemplate) {
            console.log('❌ Templates not found. Please run template seed first: npm run seed:templates');
            process.exit(1);
        }

        // Nettoyer les projets existants
        await Project.deleteMany({});
        console.log('🗑️  Existing projects cleared\n');

        // ========================================
        // Projet 1 : Portfolio Client (DEPLOYED)
        // ========================================
        const project1 = await Project.create({
            name: 'Mon Portfolio Pro',
            slug: 'mon-portfolio-pro',
            description: 'Portfolio professionnel pour présenter mes projets de design',
            owner: client._id,
            template: portfolioTemplate._id,
            status: 'DEPLOYED',
            content: {
                blocks: [
                    {
                        blockId: 'hero',
                        fields: {
                            heroTitle: 'Designer & Créatif',
                            heroSubtitle: 'Je crée des expériences digitales uniques',
                            heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
                        }
                    },
                    {
                        blockId: 'about',
                        fields: {
                            aboutTitle: 'À propos',
                            aboutText: 'Designer passionné avec 5 ans d\'expérience dans le design UI/UX'
                        }
                    }
                ],
                config: {
                    colors: {
                        primary: '#3B82F6',
                        secondary: '#10B981',
                        accent: '#F59E0B',
                        background: '#FFFFFF',
                        text: '#1F2937'
                    },
                    fonts: {
                        heading: 'Poppins',
                        body: 'Inter'
                    },
                    seo: {
                        title: 'Mon Portfolio Pro - Designer UI/UX',
                        description: 'Portfolio professionnel de designer créatif',
                        keywords: ['portfolio', 'design', 'ui', 'ux']
                    }
                },
                pages: [],
                assets: []
            },
            domain: {
                subdomain: 'mon-portfolio-pro',
                deploymentUrl: 'https://mon-portfolio-pro.evolyte.app'
            },
            deployment: {
                status: 'DEPLOYED',
                provider: 'vercel',
                lastDeployment: {
                    deployedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
                    deployedBy: worker._id,
                    version: '1.0',
                    buildTime: 45000
                }
            },
            stats: {
                totalVisits: 245,
                uniqueVisitors: 87,
                lastVisit: new Date(),
                totalEdits: 3,
                deployments: 1
            },
            launchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        });

        // Créer première révision
        await project1.createRevision(client._id, 'Version initiale - Portfolio créé');

        console.log('✅ Projet 1 créé: Mon Portfolio Pro (DEPLOYED)');

        // ========================================
        // Projet 2 : Site Startup (IN_PROGRESS)
        // ========================================
        const project2 = await Project.create({
            name: 'Landing Page TechStart',
            slug: 'landing-page-techstart',
            description: 'Landing page pour startup SaaS',
            owner: client._id,
            template: landingTemplate._id,
            status: 'IN_PROGRESS',
            content: {
                blocks: [
                    {
                        blockId: 'hero',
                        fields: {
                            heroTitle: 'Révolutionnez votre workflow',
                            heroSubtitle: 'La solution SaaS qui transforme votre productivité',
                            ctaText: 'Démarrer gratuitement'
                        }
                    },
                    {
                        blockId: 'features',
                        fields: {
                            featuresTitle: 'Fonctionnalités',
                            feature1: 'Automatisation intelligente',
                            feature2: 'Collaboration en temps réel',
                            feature3: 'Analytics avancées'
                        }
                    }
                ],
                config: {
                    colors: {
                        primary: '#6366F1',
                        secondary: '#8B5CF6',
                        accent: '#EC4899',
                        background: '#FFFFFF',
                        text: '#111827'
                    },
                    fonts: {
                        heading: 'Space Grotesk',
                        body: 'Inter'
                    },
                    seo: {
                        title: 'TechStart - Révolutionnez votre workflow',
                        description: 'Solution SaaS pour améliorer votre productivité',
                        keywords: ['saas', 'productivity', 'automation']
                    }
                },
                pages: [],
                assets: []
            },
            domain: {
                subdomain: 'techstart-landing',
                customDomain: {
                    domain: 'techstart.io',
                    verified: false,
                    verificationToken: 'evolyte-verify-abc123def456',
                    dnsRecords: [
                        {
                            type: 'A',
                            name: '@',
                            value: '76.76.21.21',
                            verified: false
                        },
                        {
                            type: 'CNAME',
                            name: 'www',
                            value: 'cname.evolyte.app',
                            verified: false
                        }
                    ],
                    sslEnabled: false
                }
            },
            deployment: {
                status: 'NOT_DEPLOYED',
                provider: null
            },
            stats: {
                totalVisits: 0,
                uniqueVisitors: 0,
                totalEdits: 5,
                deployments: 0
            },
            collaborators: [
                {
                    user: worker._id,
                    role: 'EDITOR',
                    addedBy: client._id
                }
            ]
        });

        await project2.createRevision(client._id, 'Version initiale');
        await project2.createRevision(worker._id, 'Ajout section features');

        console.log('✅ Projet 2 créé: Landing Page TechStart (IN_PROGRESS)');

        // ========================================
        // Projet 3 : Blog Personnel (COMPLETED)
        // ========================================
        const project3 = await Project.create({
            name: 'Blog Tech & Innovation',
            slug: 'blog-tech-innovation',
            description: 'Blog personnel sur la tech et l\'innovation',
            owner: client._id,
            template: blogTemplate._id,
            status: 'COMPLETED',
            content: {
                blocks: [
                    {
                        blockId: 'header',
                        fields: {
                            blogTitle: 'Tech & Innovation',
                            blogSubtitle: 'Articles sur le développement web et les nouvelles technologies'
                        }
                    },
                    {
                        blockId: 'posts',
                        fields: {
                            postsLayout: 'grid'
                        }
                    }
                ],
                config: {
                    colors: {
                        primary: '#0EA5E9',
                        secondary: '#06B6D4',
                        accent: '#14B8A6',
                        background: '#FFFFFF',
                        text: '#0F172A'
                    },
                    fonts: {
                        heading: 'Merriweather',
                        body: 'Open Sans'
                    },
                    seo: {
                        title: 'Tech & Innovation - Blog',
                        description: 'Blog sur le développement web et les technologies émergentes',
                        keywords: ['tech', 'innovation', 'web', 'development']
                    }
                },
                pages: [
                    {
                        name: 'About',
                        slug: 'about',
                        title: 'À propos',
                        content: {
                            text: 'Développeur passionné partageant ses connaissances'
                        },
                        isPublished: true
                    }
                ],
                assets: []
            },
            domain: {
                subdomain: 'blog-tech-innovation'
            },
            deployment: {
                status: 'NOT_DEPLOYED',
                provider: null
            },
            stats: {
                totalVisits: 0,
                uniqueVisitors: 0,
                totalEdits: 8,
                deployments: 0
            },
            metadata: {
                visibility: 'public',
                estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
                tags: ['blog', 'tech', 'innovation']
            }
        });

        await project3.createRevision(client._id, 'Version initiale');
        await project3.createRevision(worker._id, 'Ajout page About');
        await project3.createRevision(worker._id, 'Finalisation du design');

        console.log('✅ Projet 3 créé: Blog Tech & Innovation (COMPLETED)');

        // ========================================
        // Projet 4 : Site Admin Test (PENDING)
        // ========================================
        const project4 = await Project.create({
            name: 'Test Portfolio Minimal',
            slug: 'test-portfolio-minimal',
            description: 'Projet de test pour validation',
            owner: admin._id,
            template: portfolioTemplate._id,
            status: 'PENDING',
            content: {
                blocks: portfolioTemplate.blocks.map(block => ({
                    blockId: block.id,
                    fields: block.fields.reduce((acc, field) => {
                        acc[field.name] = field.default;
                        return acc;
                    }, {})
                })),
                config: {
                    colors: portfolioTemplate.config.colors,
                    fonts: portfolioTemplate.config.fonts,
                    seo: {
                        title: 'Test Portfolio',
                        description: 'Test',
                        keywords: []
                    }
                },
                pages: [],
                assets: []
            },
            domain: {
                subdomain: 'test-portfolio-minimal'
            },
            deployment: {
                status: 'NOT_DEPLOYED',
                provider: null
            },
            stats: {
                totalVisits: 0,
                uniqueVisitors: 0,
                totalEdits: 1,
                deployments: 0
            }
        });

        await project4.createRevision(admin._id, 'Version initiale de test');

        console.log('✅ Projet 4 créé: Test Portfolio Minimal (PENDING)');

        console.log('\n✅ Projects seeded successfully!\n');
        console.log('📊 Summary:');
        console.log('   - 4 projects created');
        console.log('   - 1 DEPLOYED (Mon Portfolio Pro)');
        console.log('   - 1 IN_PROGRESS (Landing Page TechStart)');
        console.log('   - 1 COMPLETED (Blog Tech & Innovation)');
        console.log('   - 1 PENDING (Test Portfolio Minimal)');
        console.log('\n💡 Test with:');
        console.log('   GET /api/v1/projects/my (as client@evolyte.com)');
        console.log('   GET /api/v1/projects/admin/stats (as admin@evolyte.com)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding projects:', error);
        process.exit(1);
    }
};

seedProjects();
