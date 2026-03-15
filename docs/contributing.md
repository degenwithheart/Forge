# Contributing to FORGE

Thank you for your interest in contributing to FORGE! This guide will help you get started with development.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Development Workflow](#development-workflow)

## Getting Started

### Prerequisites

- **Node.js 18+** and **npm** for frontend development
- **Python 3.8+** for backend development
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/hugging-hub-local.git
cd hugging-hub-local

# Add upstream remote
git remote add upstream https://github.com/degenwithheart/Forge.git
```

## Development Setup

### Frontend Setup

```bash
cd src
npm install
npm run dev
```

The frontend will start at http://localhost:8080

### Backend Setup

```bash
cd server
pip install -r requirements.txt
python model-server.py
```

The backend will start at http://localhost:5000

### Development Environment

```bash
# Terminal 1: Backend
cd server
python model-server.py

# Terminal 2: Frontend
cd src
npm run dev

# Terminal 3: Tests (optional)
cd src
npm run test:watch
```

## Code Standards

### TypeScript Standards

#### Use Strict TypeScript
```typescript
// Good - Explicit types
interface ModelLoadState {
  modelId: string;
  status: 'idle' | 'downloading' | 'loaded' | 'error';
  progress?: number;
}

// Avoid - Implicit types
const modelState = {
  modelId: 'test',
  status: 'loaded'  // TypeScript can't infer this is a specific string
};
```

#### Prefer Interfaces over Types
```typescript
// Good
interface ModelConfig {
  name: string;
  provider: Provider;
  modality: Modality;
}

// Acceptable for simple cases
type ModelStatus = 'loading' | 'loaded' | 'error';
```

#### Use Enums for Fixed Sets
```typescript
// Good
enum Provider {
  Local = 'local',
  OpenAI = 'openai',
  HuggingFace = 'huggingface'
}

// Avoid
const PROVIDERS = {
  LOCAL: 'local',
  OPENAI: 'openai',
  HUGGINGFACE: 'huggingface'
} as const;
```

### React Patterns

#### Functional Components with Hooks
```typescript
// Good
const ModelCard: React.FC<ModelCardProps> = ({ model, onLoad, onUnload }) => {
  const [isLoading, setIsLoading] = useState(false);
  const cache = useModelCache();
  
  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    await cache.addToCache(model);
    await onLoad(model);
    setIsLoading(false);
  }, [model, onLoad, cache]);
  
  return (
    <div className="model-card">
      {/* JSX content */}
    </div>
  );
};
```

#### Custom Hooks for Complex Logic
```typescript
// Good - Extract complex logic
const useModelLoading = (modelId: string) => {
  const [state, setState] = useState<ModelLoadState>();
  const cache = useModelCache();
  
  const loadModel = useCallback(async () => {
    setState({ status: 'downloading', progress: 0 });
    try {
      await cache.loadModel(modelId);
      setState({ status: 'loaded' });
    } catch (error) {
      setState({ status: 'error', error: error.message });
    }
  }, [modelId, cache]);
  
  return { state, loadModel };
};
```

#### Use React Query for Server State
```typescript
// Good
const useModels = (modality: Modality) => {
  return useQuery({
    queryKey: ['models', modality],
    queryFn: () => fetchModels(modality),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### File Organization

```
src/src/
├── components/          # React components
│   ├── ui/              # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── DesktopLayout.tsx
│   ├── MobileLayout.tsx
│   └── ModelCard.tsx
├── hooks/               # Custom React hooks
│   ├── useForgeEngine.ts
│   ├── useModelCache.ts
│   └── useProviders.ts
├── lib/                 # Utility libraries
│   ├── cache-db.ts
│   ├── model-loader.ts
│   └── streaming.ts
├── types/               # TypeScript definitions
│   ├── models.ts
│   └── api.ts
└── pages/               # Route components
    ├── Index.tsx
    └── NotFound.tsx
```

### Code Quality Principles

#### No Placeholders
```typescript
// Bad - TODO comment
const loadModel = async (modelId: string) => {
  // TODO: Implement model loading
  throw new Error('Not implemented');
};

// Good - Full implementation
const loadModel = async (modelId: string) => {
  try {
    const hasPython = await checkPythonServer();
    if (!hasPython) {
      throw new Error('Python server not running');
    }
    
    const response = await fetch('http://localhost:5000/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: modelId }),
    });
    
    if (!response.ok) {
      throw new Error(`Load failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to load model:', error);
    throw error;
  }
};
```

#### Production-Ready Error Handling
```typescript
// Good - Comprehensive error handling
const runInference = async (prompt: string, params: InferenceParams) => {
  try {
    if (!activeModel) {
      throw new Error('No model loaded');
    }
    
    const provider = getProviderForModel(activeModel);
    const result = await provider.runInference(activeModel.modelId, prompt, params);
    
    return result;
  } catch (error) {
    // Log error for debugging
    console.error('Inference failed:', error);
    
    // Show user-friendly error
    if (error.code === 'MODEL_NOT_LOADED') {
      toast.error('Please load a model first');
    } else if (error.code === 'RATE_LIMITED') {
      toast.error('Rate limit exceeded. Please try again later');
    } else {
      toast.error('Inference failed. Please try again');
    }
    
    // Re-throw for error boundaries
    throw error;
  }
};
```

#### Maintain Mobile + Desktop Separation
```typescript
// Good - Separate layouts
const Index = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileLayout />;
  }
  
  return <DesktopLayout />;
};

// Bad - Responsive design replacing distinct layouts
const Layout = () => {
  return (
    <div className={`layout ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Complex responsive logic */}
    </div>
  );
};
```

## Testing

### Required Test Coverage

#### Unit Tests
```typescript
// Test: useModelCache.ts
describe('useModelCache', () => {
  it('should add model to cache', async () => {
    const { result } = renderHook(() => useModelCache());
    
    await act(async () => {
      await result.current.addToCache(mockModel);
    });
    
    expect(result.current.cachedModels).toContain(mockModel);
  });
  
  it('should enforce storage limit', async () => {
    const { result } = renderHook(() => useModelCache());
    
    // Add models beyond limit
    await act(async () => {
      for (const model of largeModelList) {
        await result.current.addToCache(model);
      }
    });
    
    // Should have pruned old models
    expect(result.current.cachedModels.length).toBeLessThanOrEqual(limit);
  });
});
```

#### Component Tests
```typescript
// Test: ModelCard.tsx
describe('ModelCard', () => {
  it('should show load button when model not loaded', () => {
    const mockOnLoad = jest.fn();
    
    render(
      <ModelCard 
        model={mockModel} 
        onLoad={mockOnLoad}
        onUnload={jest.fn()}
        isLoaded={false}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('Load')).toBeInTheDocument();
  });
  
  it('should call onLoad when load button clicked', async () => {
    const mockOnLoad = jest.fn();
    
    render(
      <ModelCard 
        model={mockModel} 
        onLoad={mockOnLoad}
        onUnload={jest.fn()}
        isLoaded={false}
        isLoading={false}
      />
    );
    
    fireEvent.click(screen.getByText('Load'));
    
    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledWith(mockModel);
    });
  });
});
```

#### Integration Tests
```typescript
// Test: Provider integration
describe('Provider Integration', () => {
  it('should fallback to next provider when primary fails', async () => {
    const mockLocalProvider = {
      isAvailable: jest.fn().mockResolvedValue(false),
      runInference: jest.fn().mockRejectedValue(new Error('Unavailable'))
    };
    
    const mockOpenAIProvider = {
      isAvailable: jest.fn().mockResolvedValue(true),
      runInference: jest.fn().mockResolvedValue({ output: 'test response' })
    };
    
    const result = await runInferenceWithFallback(
      'test-model', 
      'test prompt', 
      mockParams,
      [mockLocalProvider, mockOpenAIProvider]
    );
    
    expect(result.output).toBe('test response');
    expect(mockOpenAIProvider.runInference).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Component tests
npm run test:components
```

### Testing Standards

- **Coverage**: Maintain >80% test coverage
- **All public APIs**: Must have tests
- **Error paths**: Test both success and failure cases
- **Edge cases**: Test boundary conditions
- **Integration**: Test component interactions

## Pull Request Process

### Before Submitting

1. **Run Tests**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

2. **Manual Testing**
   - Test your changes in the browser
   - Verify both mobile and desktop layouts
   - Test with different models and providers

3. **Update Documentation**
   - Update relevant documentation files
   - Add comments for complex logic
   - Update API documentation if needed

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## Screenshots (if applicable)
Add screenshots to illustrate changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**
   - Tests must pass
   - Linting must pass
   - TypeScript compilation must pass

2. **Code Review**
   - At least one maintainer review required
   - Focus on code quality and architecture
   - Verify test coverage

3. **Testing Review**
   - Verify test quality and coverage
   - Check for edge cases
   - Ensure integration tests are included

4. **Documentation Review**
   - Ensure docs are updated
   - Check API documentation
   - Verify README changes if needed

## Development Workflow

### Feature Development

1. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Changes**
   - Follow coding standards
   - Add tests as you go
   - Update documentation

3. **Test Changes**
   ```bash
   npm run test:watch
   npm run dev
   ```

4. **Submit PR**
   - Fill out PR template
   - Request review from maintainers

### Bug Fixes

1. **Create Bugfix Branch**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **Add Failing Test**
   ```typescript
   it('should reproduce the bug', () => {
     // Test that demonstrates the issue
     expect(true).toBe(false); // This should fail
   });
   ```

3. **Implement Fix**
   - Make minimal changes to fix the issue
   - Ensure test passes

4. **Verify Fix**
   - Test manually
   - Check for regressions

### Refactoring

1. **Plan Changes**
   - Identify what needs refactoring
   - Ensure test coverage exists

2. **Refactor Incrementally**
   - Make small, focused changes
   - Run tests after each change

3. **Verify Behavior**
   - Ensure no functional changes
   - Update tests if needed

## Commit Style

### Conventional Commits

Use conventional commit format:

```bash
feat: add streaming inference for local models
fix: resolve memory leak in model unloading
refactor: simplify cache management logic
docs: update API documentation
test: add unit tests for telemetry client
chore: upgrade dependencies
```

### Commit Message Structure

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code refactoring without feature changes
- **docs**: Documentation changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples

```bash
feat(engine): add real-time TPS calculation
fix(mobile): resolve swipe gesture conflicts
refactor(cache): simplify storage operations
docs(readme): update installation instructions
test(providers): add API key validation tests
chore(deps): upgrade React to 18.3.1
```

## Getting Help

### Resources

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Complete guides in `/docs`
- **Code Comments**: Inline documentation for complex logic

### Community Guidelines

- **Be respectful**: In all interactions
- **Be constructive**: In feedback and reviews
- **Be helpful**: To new contributors
- **Be patient**: With review process

---

Thank you for contributing to FORGE! Your contributions help make this project better for everyone.
