# 🧪 Evolyte Backend Testing Suite

## Overview

Comprehensive testing suite for the Evolyte backend API with unit tests and integration tests.

---

## 📋 Test Structure

```
tests/
├── setup.js                      # Jest setup & configuration
├── helpers/
│   └── testHelpers.js           # Shared test utilities
├── unit/
│   ├── services/
│   │   ├── logger.service.test.js
│   │   ├── cache.service.test.js
│   │   └── email.service.test.js
│   └── middlewares/
│       ├── auth.middleware.test.js
│       └── rateLimit.middleware.test.js
└── integration/
    ├── auth.test.js             # Authentication API tests
    └── passwordReset.test.js    # Password reset flow tests
```

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

---

## 📊 Test Coverage

After running `npm run test:coverage`, open `coverage/index.html` in your browser to see detailed coverage report.

**Coverage Goals:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## 🧪 Test Categories

### Unit Tests

Test individual functions and modules in isolation:

- **Services Tests**
  - Logger service functionality
  - Cache operations
  - Email sending

- **Middleware Tests**
  - Authentication logic
  - Authorization checks
  - Rate limiting

### Integration Tests

Test complete API workflows:

- **Authentication Flow**
  - User registration
  - Login/logout
  - Profile management
  - Password changes

- **Password Reset Flow**
  - Request reset
  - Token verification
  - Password reset
  - Rate limiting

---

## 🛠️ Test Utilities

### Test Helpers (`tests/helpers/testHelpers.js`)

Useful functions for creating test data:

```javascript
import { createTestUser, createAdminUser, loginUser } from '../helpers/testHelpers.js';

// Create a test user
const { user, token } = await createTestUser(app, request);

// Create admin user
const { user, token } = await createAdminUser(app, request);

// Login existing user
const { user, token } = await loginUser(app, request, email, password);
```

---

## 📝 Writing Tests

### Unit Test Example

```javascript
describe('Service Name', () => {
  let service;

  beforeAll(async () => {
    service = await import('../../../src/services/myservice.js');
  });

  describe('functionName', () => {
    it('should do something', () => {
      const result = service.functionName();
      expect(result).toBe(expected);
    });
  });
});
```

### Integration Test Example

```javascript
describe('API Endpoint', () => {
  let app, authToken;

  beforeAll(async () => {
    app = (await import('../../src/app.js')).default;
  });

  it('should perform action', async () => {
    const response = await request(app)
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ data: 'value' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## 🔍 Test Database

Integration tests use **MongoDB Memory Server** for isolated testing:

- No need for external MongoDB instance
- Fast in-memory database
- Automatic cleanup between tests
- Completely isolated test environment

---

## ⚡ Performance Tips

1. **Run tests in parallel** (default)
2. **Use `--runInBand` for debugging** (runs tests sequentially)
3. **Mock external services** to speed up tests
4. **Clean up test data** after each test

---

## 🐛 Debugging Tests

### Run Single Test File
```bash
npm test -- tests/unit/services/logger.service.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should authenticate user"
```

### Debug with VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

---

## 📚 Best Practices

### 1. Test Naming
```javascript
describe('Feature', () => {
  describe('functionName', () => {
    it('should do X when Y', () => {
      // Test code
    });
  });
});
```

### 2. Arrange-Act-Assert Pattern
```javascript
it('should return user data', async () => {
  // Arrange
  const userId = '123';
  
  // Act
  const result = await getUser(userId);
  
  // Assert
  expect(result).toHaveProperty('email');
});
```

### 3. Clean Up After Tests
```javascript
afterEach(async () => {
  await User.deleteMany({});
});
```

### 4. Test Edge Cases
- Empty inputs
- Invalid inputs
- Boundary conditions
- Error scenarios

### 5. Use Descriptive Test Names
✅ Good: `should return 401 when token is expired`  
❌ Bad: `test login`

---

## 🚫 Common Issues

### Issue: Tests Timeout
**Solution:** Increase timeout in jest.config.js or specific test:
```javascript
jest.setTimeout(30000);
```

### Issue: MongoDB Connection Errors
**Solution:** Ensure MongoDB Memory Server starts properly:
```javascript
mongoServer = await MongoMemoryServer.create();
```

### Issue: Port Already in Use
**Solution:** Tests use in-memory server, no port conflicts should occur

### Issue: Module Mocking Errors
**Solution:** Use `jest.unstable_mockModule()` for ES modules:
```javascript
jest.unstable_mockModule('module-name', () => ({
  default: mockImplementation
}));
```

---

## 📈 Continuous Integration

Add to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## 🎯 Test Coverage Status

| Category | Coverage Target | Current |
|----------|----------------|---------|
| Services | 70%+ | ✅ |
| Middlewares | 70%+ | ✅ |
| Controllers | 70%+ | 🔄 Pending |
| Models | 70%+ | 🔄 Pending |
| **Overall** | **70%+** | **🔄 In Progress** |

---

## 📝 Adding New Tests

When adding new features:

1. **Write tests first** (TDD approach)
2. **Create unit tests** for individual functions
3. **Create integration tests** for API endpoints
4. **Update this README** if needed
5. **Run full test suite** before commit

---

## 🤝 Contributing

When contributing tests:

1. Follow existing test patterns
2. Maintain 70%+ coverage
3. Test happy paths AND edge cases
4. Add descriptive test names
5. Clean up test data properly

---

**Happy Testing! 🧪**

For questions or issues, check the main project README or contact the development team.
