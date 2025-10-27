# Contributing to AnomFIN

> *Ship clean. Ship bold.*

Thank you for your interest in contributing to AnomFIN! We embrace the hacker spirit with enterprise polish.

## 🎯 Philosophy

Before contributing, understand our core principles:

1. **Minimalism**: Less is more. Remove until only essence remains.
2. **Performance**: Fast by default, optimized by design.
3. **Security**: Secure by default, validated always.
4. **Clarity**: Code should be self-documenting.
5. **Resilience**: Fail gracefully, recover automatically.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Git
- A passion for clean code

### Setup Development Environment

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/.github.git
cd .github

# Run tests
npm start
npm test

# Run examples
node examples.js
```

## 📝 Code Style

### JavaScript/Node.js Standards

```javascript
// ✓ Good: Async/await, descriptive names
async function processUserData(user) {
  const validated = await validateUser(user);
  return transformData(validated);
}

// ✗ Bad: Callbacks, unclear names
function proc(u, cb) {
  validate(u, function(err, v) {
    cb(transform(v));
  });
}
```

### Naming Conventions

- **Functions**: `camelCase`, verb-first (e.g., `getUserData`, `validateEmail`)
- **Classes**: `PascalCase` (e.g., `DataProcessor`, `APIOrchestrator`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Private methods**: Prefix with `_` (e.g., `_processInternal`)

### Documentation

Always document public APIs with JSDoc:

```javascript
/**
 * Process data with validation and caching
 * @param {Object} data - Data to process
 * @param {Object} options - Processing options
 * @param {boolean} options.skipCache - Skip cache lookup
 * @returns {Promise<Object>} Processed result
 * @throws {ValidationError} If validation fails
 */
async function process(data, options = {}) {
  // Implementation
}
```

## 🔧 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/amazing-feature
```

### 2. Make Changes

- Keep commits small and focused
- Write clear commit messages
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run the demo
npm start

# Run examples
node examples.js

# Manual testing
node src/utils/validator.js
```

### 4. Commit

```bash
git add .
git commit -m "feat: add amazing feature

- Implement feature X
- Add validation for Y
- Update documentation"
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### 5. Submit Pull Request

- Push your branch
- Create a pull request
- Describe your changes clearly
- Link any related issues

## 🧪 Testing Guidelines

### Unit Tests

```javascript
// Test individual functions
import { validateEmail } from './src/utils/validator.js';

try {
  validateEmail('test@example.com');
  console.log('✓ Test passed');
} catch (error) {
  console.error('✗ Test failed:', error);
}
```

### Integration Tests

```javascript
// Test complete workflows
const anomfin = new AnomFIN();
await anomfin.initialize();
const result = await anomfin.execute('process', data);
assert(result.success === true);
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Node.js version, OS, etc.
6. **Code Sample**: Minimal reproducible example

Example:

```markdown
## Bug: Validation fails for valid email

**Steps to Reproduce:**
1. Import validateEmail
2. Call with 'user+tag@example.com'
3. Observe error

**Expected:** Should accept email with + sign
**Actual:** Throws ValidationError

**Environment:** Node.js 18.0.0, Ubuntu 22.04

**Code:**
\`\`\`javascript
validateEmail('user+tag@example.com');
\`\`\`
```

## 💡 Feature Requests

We welcome innovative ideas! When proposing features:

1. **Problem**: Describe the problem you're solving
2. **Solution**: Propose your solution
3. **Alternatives**: Consider alternative approaches
4. **Impact**: How does this benefit users?
5. **Implementation**: Rough implementation plan

## 🔒 Security

Found a security vulnerability?

**DO NOT** create a public issue. Instead:

1. Email security concerns to the maintainers
2. Include detailed description
3. Provide proof of concept if possible
4. Allow time for patch before disclosure

## 📚 Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [JavaScript Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [Async/Await Guide](https://javascript.info/async-await)

## ✅ Checklist Before Submitting

- [ ] Code follows style guidelines
- [ ] Changes are tested and working
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Breaking changes are documented

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards others

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AnomFIN!**

*The Neural Network of Innovation* 🚀
