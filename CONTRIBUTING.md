# Contributing to NyayaSankalan

First off, thank you for considering contributing to NyayaSankalan! We're building a system that can genuinely improve the justice delivery process in India, and your contributions can make a real difference.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. By participating, you're expected to uphold these standards:

- Be respectful and inclusive
- Focus on what's best for the community and the justice system
- Show empathy towards other contributors
- Accept constructive criticism gracefully
- Respect privacy and confidentiality given the sensitive nature of legal data

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear descriptive title**
- **Steps to reproduce** - Be specific
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Screenshots** - If applicable
- **Environment details** - OS, Node version, browser, etc.
- **Role context** - Which user role were you testing as?

### Suggesting Features

Feature suggestions are welcome! Before submitting:

- Check if the feature already exists or is being worked on
- Consider if it aligns with the project's goals
- Provide clear use cases and benefits
- Think about the impact on different user roles (Police, SHO, Court, Judge)

### Code Contributions

We accept contributions in these areas:

- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- UI/UX enhancements
- Security improvements
- Test coverage
- Accessibility improvements

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nyayasankalan.git
   cd nyayasankalan
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npx prisma migrate dev
   npm run db:seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with backend URL
   npm run dev
   ```

4. **Verify Setup**
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173
   - Login with seed credentials from terminal output

### Development Workflow

1. Create a new branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes and test thoroughly

3. Commit your changes (see commit guidelines below)

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated if needed
- [ ] No console errors or warnings
- [ ] Tested on multiple user roles where applicable
- [ ] Database migrations are included if schema changed
- [ ] Environment variables documented if added

### PR Guidelines

1. **Title**: Clear and descriptive
   - Good: "Add witness statement validation"
   - Bad: "Fixed stuff"

2. **Description**: Include
   - What changes were made and why
   - Related issue numbers (#123)
   - Screenshots/videos for UI changes
   - Testing steps
   - Any breaking changes

3. **Size**: Keep PRs focused and reasonably sized
   - Large features should be split into multiple PRs
   - Each PR should address one concern

4. **Review**: Be responsive to feedback
   - Address review comments promptly
   - Ask questions if something is unclear
   - Don't take criticism personally

### Review Process

- At least one maintainer approval required
- All CI checks must pass
- No merge conflicts
- Documentation updated
- Changes tested by reviewer

## Coding Standards

### TypeScript/JavaScript

```typescript
// Use explicit types
function getCaseById(caseId: string): Promise<Case> {
  // implementation
}

// Prefer async/await over promises
async function fetchData() {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    handleError(error);
  }
}

// Use meaningful variable names
const investigationCompleted = true; // Good
const flag = true; // Bad
```

### React Components

```tsx
// Functional components with TypeScript
export const CaseDetails: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Event handlers prefixed with 'handle'
  const handleSubmit = async () => {
    // implementation
  };
  
  return (
    <div className="container">
      {/* Clear JSX structure */}
    </div>
  );
};
```

### Backend API

```typescript
// Use async handlers
export const getCases = asyncHandler(async (req, res) => {
  const cases = await caseService.getCases();
  res.json({ success: true, data: cases });
});

// Validate inputs
router.post(
  '/cases',
  authenticate,
  [body('firNumber').notEmpty(), validate],
  createCase
);
```

### File Structure

- **Components**: PascalCase (`CaseCard.tsx`)
- **Utilities**: camelCase (`caseState.ts`)
- **Types**: PascalCase interfaces (`Case`, `User`)
- **API files**: camelCase with `.api.ts` suffix

### Comments

```typescript
// Good: Explain WHY, not WHAT
// Calculate penalty days excluding weekends and holidays
const penaltyDays = calculateBusinessDays(startDate, endDate);

// Bad: State the obvious
// Loop through cases
cases.forEach(c => { ... });
```

## Testing Guidelines

### Backend Tests

```typescript
describe('Case Service', () => {
  it('should create case when FIR is registered', async () => {
    const result = await caseService.createCase(mockData);
    expect(result).toHaveProperty('id');
  });
});
```

### Frontend Tests

```tsx
describe('CaseDetails Component', () => {
  it('renders case information correctly', () => {
    render(<CaseDetails />);
    expect(screen.getByText(/FIR Number/i)).toBeInTheDocument();
  });
});
```

### Test User Roles

Always test with different roles:
- Police Officer (investigation)
- SHO (supervision, submission)
- Court Clerk (intake)
- Judge (court actions)

## Commit Message Guidelines

We follow conventional commits for clarity:

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(police): add witness statement recording

Add ability for officers to record detailed witness statements
with file attachments and timestamps.

Closes #45

fix(court): correct case state transition validation

SHO was unable to submit cases after investigation completion
due to incorrect state check in court service.

Fixes #67

docs(api): update authentication endpoints documentation

refactor(utils): simplify date formatting helpers

test(case): add integration tests for case creation flow
```

### Scope Guidelines

- `police`: Police module
- `sho`: SHO features
- `court`: Court clerk features
- `judge`: Judge features
- `api`: Backend API
- `ui`: UI components
- `db`: Database changes
- `auth`: Authentication/authorization

## Documentation

When contributing, update documentation:

- **README.md**: User-facing features and setup
- **API docs**: New endpoints or changes
- **Code comments**: Complex logic
- **Type definitions**: New interfaces
- **Environment variables**: New config

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Reach out to maintainers

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- GitHub contributor graph

---

Thank you for contributing to NyayaSankalan and helping improve the justice delivery system!
