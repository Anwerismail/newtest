/**
 * Test Helper Functions
 * Shared utilities for tests
 */

/**
 * Create a test user and return auth token
 */
export const createTestUser = async (app, request, userData = {}) => {
  const defaultData = {
    email: `test${Date.now()}@example.com`,
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'User',
    role: 'CLIENT',
    ...userData,
  };

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(defaultData);

  return {
    user: response.body.data.user,
    token: response.body.data.token,
    password: defaultData.password,
  };
};

/**
 * Login and get token
 */
export const loginUser = async (app, request, email, password) => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  return {
    user: response.body.data.user,
    token: response.body.data.token,
  };
};

/**
 * Create admin user
 */
export const createAdminUser = async (app, request) => {
  return createTestUser(app, request, {
    role: 'ADMIN',
    email: `admin${Date.now()}@example.com`,
  });
};

/**
 * Create super admin user
 */
export const createSuperAdminUser = async (app, request) => {
  return createTestUser(app, request, {
    role: 'SUPER_ADMIN',
    email: `superadmin${Date.now()}@example.com`,
  });
};

/**
 * Create project manager user
 */
export const createManagerUser = async (app, request) => {
  return createTestUser(app, request, {
    role: 'PROJECT_MANAGER',
    email: `manager${Date.now()}@example.com`,
  });
};

/**
 * Create worker user
 */
export const createWorkerUser = async (app, request) => {
  return createTestUser(app, request, {
    role: 'WORKER',
    email: `worker${Date.now()}@example.com`,
  });
};

/**
 * Create a test template
 */
export const createTestTemplate = async (Template) => {
  const template = await Template.create({
    name: `Test Template ${Date.now()}`,
    slug: `test-template-${Date.now()}`,
    description: 'Test template description',
    category: 'PORTFOLIO',
    type: 'static',
    status: 'published',
    visibility: 'free',
    structure: {
      html: '<h1>Test</h1>',
      css: 'h1 { color: red; }',
      js: 'console.log("test");',
    },
    metadata: {
      downloads: 0,
      rating: 0,
      reviewCount: 0,
    },
  });

  return template;
};

/**
 * Create a test project
 */
export const createTestProject = async (Project, userId, templateId = null) => {
  const project = await Project.create({
    name: `Test Project ${Date.now()}`,
    slug: `test-project-${Date.now()}`,
    description: 'Test project description',
    owner: userId,
    template: templateId,
    status: 'DRAFT',
    content: {
      html: '<h1>Test Project</h1>',
      css: 'h1 { color: blue; }',
      js: '',
      assets: [],
    },
    pages: [{
      path: '/',
      title: 'Home',
      content: { html: '<h1>Home</h1>' },
    }],
    deployment: {
      status: 'NOT_DEPLOYED',
    },
  });

  return project;
};

/**
 * Create a test ticket
 */
export const createTestTicket = async (Ticket, reporterId, projectId = null) => {
  const ticket = await Ticket.create({
    type: 'SUPPORT',
    title: `Test Ticket ${Date.now()}`,
    description: 'Test ticket description',
    priority: 'MEDIUM',
    status: 'OPEN',
    reporter: reporterId,
    project: projectId,
  });

  return ticket;
};

/**
 * Wait for a condition to be true
 */
export const waitFor = (conditionFn, timeout = 5000, interval = 100) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = async () => {
      try {
        const result = await conditionFn();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(checkCondition, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    checkCondition();
  });
};

/**
 * Generate random email
 */
export const randomEmail = () => {
  return `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Generate random string
 */
export const randomString = (length = 10) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Clean up test data
 */
export const cleanupTestData = async (models) => {
  for (const model of models) {
    await model.deleteMany({});
  }
};

export default {
  createTestUser,
  loginUser,
  createAdminUser,
  createSuperAdminUser,
  createManagerUser,
  createWorkerUser,
  createTestTemplate,
  createTestProject,
  createTestTicket,
  waitFor,
  randomEmail,
  randomString,
  cleanupTestData,
};
