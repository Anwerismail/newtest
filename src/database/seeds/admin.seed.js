import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import User from '../../models/User.model.js';
import { ROLES } from '../../utils/constants.js';

const seedAdmin = async () => {
    try {
        // Connect to DB
        await mongoose.connect(config.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const adminExists = await User.findOne({ role: ROLES.SUPER_ADMIN });

        if (adminExists) {
            console.log('⚠️  Super Admin already exists');
            process.exit(0);
        }

        // Create Super Admin
        const admin = await User.create({
            email: 'admin@evolyte.com',
            password: 'Admin@123',
            profile: {
                firstName: 'Super',
                lastName: 'Admin'
            },
            role: ROLES.SUPER_ADMIN,
            status: 'ACTIVE'
        });

        console.log('✅ Super Admin created successfully');
        console.log('📧 Email: admin@evolyte.com');
        console.log('🔑 Password: Admin@123');
        console.log('⚠️  Please change the password after first login!');

        // Create test users for each role
        const testUsers = [
            {
                email: 'manager@evolyte.com',
                password: 'Manager@123',
                profile: { firstName: 'Project', lastName: 'Manager' },
                role: ROLES.PROJECT_MANAGER
            },
            {
                email: 'worker@evolyte.com',
                password: 'Worker@123',
                profile: { firstName: 'Test', lastName: 'Worker' },
                role: ROLES.WORKER,
                workerProfile: {
                    skills: ['React', 'Node.js', 'MongoDB'],
                    specialization: 'fullstack',
                    level: 'SENIOR',
                    availability: {
                        status: 'AVAILABLE',
                        hoursPerWeek: 40
                    }
                }
            },
            {
                email: 'client@evolyte.com',
                password: 'Client@123',
                profile: { firstName: 'Test', lastName: 'Client' },
                role: ROLES.CLIENT,
                clientProfile: {
                    company: 'Test Company',
                    subscription: {
                        plan: 'PRO',
                        status: 'ACTIVE',
                        maxProjects: 20
                    }
                }
            }
        ];

        await User.insertMany(testUsers);
        console.log('✅ Test users created successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedAdmin();