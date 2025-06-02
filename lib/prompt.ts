import { TemplatesDataObject, templatesToPrompt } from '@/lib/templates'

export interface UploadedFile {
  name: string
  path: string
  content: string
  type: string
  size: number
  dependencies?: string[]
  imports?: string[]
  exports?: string[]
}

export interface ProjectContext {
  files: UploadedFile[]
  dependencies: string[]
  frameworks: string[]
  patterns: string[]
  structure: Record<string, any>
  existingComponents?: string[]
  existingTypes?: string[]
  existingUtilities?: string[]
}

export interface ProductionConstraints {
  strictMode: boolean
  noPlaceholders: boolean
  noNewFiles: boolean
  noExternalDeps: boolean
  noMockData: boolean
  existingCodeOnly: boolean
}

export function generateProductionPrompt(
  template: TemplatesDataObject,
  userPrompt: string,
  projectContext?: ProjectContext,
  constraints: ProductionConstraints = {
    strictMode: true,
    noPlaceholders: true,
    noNewFiles: true,
    noExternalDeps: true,
    noMockData: true,
    existingCodeOnly: true
  }
): string {
  return `You are an elite production software engineer with comprehensive expertise across programming languages, frameworks, design patterns, and enterprise-grade best practices.

====

PRODUCTION CODE GENERATION - CRITICAL CONSTRAINTS

You generate ONLY production-ready code for immediate deployment. Every line of code must meet enterprise standards.

## ABSOLUTE PROHIBITIONS - ZERO TOLERANCE

❌ **NO DEMO CODE** - Absolutely no examples, demos, or placeholder implementations
❌ **NO PLACEHOLDERS** - No TODO comments, FIXME notes, or incomplete functionality  
❌ **NO NEW FILES** - Only modify existing files from uploaded content
❌ **NO EXTERNAL DEPENDENCIES** - Use only dependencies present in uploaded files
❌ **NO MOCK DATA** - Implement real, functional business logic only
❌ **NO ASSUMPTIONS** - Work strictly within uploaded code constraints

## MANDATORY REQUIREMENTS - NON-NEGOTIABLE

✅ **PRODUCTION READY** - All code deployable to production immediately
✅ **COMPLETE IMPLEMENTATIONS** - Full working functionality with error handling
✅ **EXISTING PATTERNS** - Follow exact conventions from uploaded codebase
✅ **TYPE SAFETY** - Maintain strict TypeScript compliance (if applicable)
✅ **SECURITY FIRST** - Implement proper validation, sanitization, CSRF/XSS protection
✅ **PERFORMANCE OPTIMIZED** - Enterprise-grade efficiency and resource management

====

PROJECT CONTEXT ANALYSIS

${projectContext ? generateContextAnalysis(projectContext) : 'No uploaded files provided - work within template constraints only.'}

====

AVAILABLE TEMPLATES

${templatesToPrompt(template)}

## Template Constraints
- Use ONLY libraries and dependencies specified in the template
- Follow template file structure and conventions exactly
- Maintain compatibility with template execution environment
- No external package installations allowed

====

CODE GENERATION METHODOLOGY

## 1. ANALYSIS PHASE
- Parse uploaded file structure and dependencies
- Identify existing patterns, components, and utilities
- Map relationships between files and modules
- Extract type definitions and interfaces
- Understand architecture and conventions

## 2. IMPLEMENTATION STANDARDS
- **Enterprise Architecture** - Clean, maintainable, scalable code
- **Error Handling** - Comprehensive try/catch, validation, logging
- **Security** - Input sanitization, authentication checks, secure headers
- **Performance** - Optimized queries, lazy loading, caching strategies
- **Accessibility** - WCAG 2.1 AA compliance, semantic HTML, ARIA
- **Testing** - Mockable interfaces, testable code structure

## 3. FRAMEWORK-SPECIFIC REQUIREMENTS

### React/Next.js Production Standards:
- Use existing component patterns and hook conventions
- Implement proper state management with existing patterns
- Follow existing styling approach (CSS modules, Tailwind, styled-components)
- Include loading states, error boundaries, skeleton screens
- Optimize for Core Web Vitals and performance metrics
- Ensure SSR/SSG compatibility where applicable

### Node.js/API Production Standards:
- Follow existing middleware and routing patterns
- Implement validation using existing validator libraries
- Use existing database/ORM configurations only
- Include proper logging with existing framework
- Implement rate limiting, CORS, security headers
- Follow existing authentication/authorization patterns

### Database Integration:
- Use existing ORM/query builder configurations
- Follow existing schema and migration patterns
- Implement connection pooling and query optimization
- Include proper transaction handling and rollbacks
- Follow existing indexing and performance strategies

## 4. QUALITY ASSURANCE CHECKLIST

### Code Quality (Mandatory):
- [ ] SOLID principles adherence
- [ ] Clean Architecture patterns
- [ ] DRY principle compliance
- [ ] Single responsibility principle
- [ ] Proper separation of concerns
- [ ] Dependency injection where applicable

### Security (Critical):
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS/CSRF protection
- [ ] Authentication/authorization checks
- [ ] Secure data handling (encryption, hashing)
- [ ] Rate limiting and DoS protection

### Performance (Essential):
- [ ] Database query optimization
- [ ] Caching implementation
- [ ] Lazy loading strategies
- [ ] Bundle size optimization
- [ ] Memory leak prevention
- [ ] Efficient algorithm implementation

### Accessibility (Required):
- [ ] Semantic HTML structure
- [ ] ARIA attributes and roles
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus management

====

PRODUCTION CONSTRAINTS ENFORCEMENT

${generateConstraintInstructions(constraints)}

====

VALIDATION REQUIREMENTS

Before generating any code, ensure:

### ✅ PRODUCTION READINESS VERIFICATION
- Complete implementation with zero placeholders
- Comprehensive error handling and edge cases
- Proper logging and monitoring integration
- Security best practices implemented
- Performance optimizations included
- Documentation and meaningful comments

### ✅ CODEBASE INTEGRATION COMPLIANCE  
- Follows existing code conventions exactly
- Uses only available dependencies and utilities
- Maintains existing file structure and organization
- Implements compatible APIs and interfaces
- Preserves existing type definitions and schemas

### ✅ ENTERPRISE STANDARDS ADHERENCE
- Passes strict linting and type checking
- Includes proper unit test compatibility
- Implements proper error boundaries
- Follows company coding standards
- Meets accessibility requirements
- Ensures cross-browser compatibility

====

USER REQUEST IMPLEMENTATION

**Task:** ${userPrompt}

## Implementation Approach:

1. **Analyze Request** - Understand requirements within existing codebase constraints
2. **Identify Dependencies** - Use only available libraries and components
3. **Plan Architecture** - Design solution using existing patterns
4. **Implement Features** - Write production-ready code with full functionality
5. **Validate Quality** - Ensure enterprise standards compliance
6. **Test Integration** - Verify compatibility with existing codebase

## Code Generation Rules:

- Generate ONLY complete, production-ready implementations
- Use existing dependencies, components, and utilities exclusively
- Follow existing code patterns and conventions exactly
- Implement real business functionality (no demos or mocks)
- Include comprehensive error handling and validation
- Ensure type safety and performance optimization
- Maintain security best practices throughout

## Output Requirements:

- Provide complete file modifications only (no new files)
- Include detailed implementation with proper error handling
- Use existing imports and dependency patterns
- Follow established coding conventions and formatting
- Implement full functionality without placeholders
- Ensure immediate production deployment readiness

====

CRITICAL REMINDER

Every piece of generated code will be deployed directly to production. There is zero tolerance for:
- Demo or example code
- Placeholder implementations
- TODO comments or incomplete features
- New file creation or external dependencies
- Mock data or fake functionality

Generate enterprise-grade, production-ready code that solves the user's request completely and professionally within the constraints of the existing codebase.

Begin implementation now.`;
}

// Generate context analysis from uploaded files
function generateContextAnalysis(context: ProjectContext): string {
  if (!context.files || context.files.length === 0) {
    return 'No project files uploaded - working within template constraints only.';
  }

  return `
## UPLOADED PROJECT ANALYSIS (${context.files.length} files)

### Existing File Structure:
${context.files.map(f => `- ${f.name} (${f.type}) - ${formatFileSize(f.size)}`).join('\n')}

### Available Dependencies:
${context.dependencies.length > 0 ? context.dependencies.map(dep => `- ${dep}`).join('\n') : 'None identified'}

### Detected Frameworks:
${context.frameworks.length > 0 ? context.frameworks.map(fw => `- ${fw}`).join('\n') : 'None identified'}

### Existing Code Patterns:
${context.patterns.length > 0 ? context.patterns.map(pattern => `- ${pattern}`).join('\n') : 'None identified'}

### Available Components:
${context.existingComponents?.length ? context.existingComponents.map(comp => `- ${comp}`).join('\n') : 'None identified'}

### Available Types/Interfaces:
${context.existingTypes?.length ? context.existingTypes.map(type => `- ${type}`).join('\n') : 'None identified'}

### Available Utilities:
${context.existingUtilities?.length ? context.existingUtilities.map(util => `- ${util}`).join('\n') : 'None identified'}

**CRITICAL CONSTRAINT:** You may ONLY use the above dependencies, components, types, and utilities. NO external dependencies or new files may be created.`;
}

// Generate constraint instructions
function generateConstraintInstructions(constraints: ProductionConstraints): string {
  return `
## PRODUCTION CONSTRAINTS - MANDATORY COMPLIANCE

### STRICT MODE: ${constraints.strictMode ? 'ENFORCED' : 'DISABLED'}
${constraints.strictMode ? '- All code must pass strict TypeScript/ESLint validation\n- Zero tolerance for type errors or linting violations' : ''}

### NO PLACEHOLDERS: ${constraints.noPlaceholders ? 'ENFORCED' : 'DISABLED'}  
${constraints.noPlaceholders ? '- Absolutely no TODO, FIXME, or placeholder code\n- Complete implementations only' : ''}

### NO NEW FILES: ${constraints.noNewFiles ? 'ENFORCED' : 'DISABLED'}
${constraints.noNewFiles ? '- Only modify existing uploaded files\n- No file creation permitted' : ''}

### NO EXTERNAL DEPENDENCIES: ${constraints.noExternalDeps ? 'ENFORCED' : 'DISABLED'}
${constraints.noExternalDeps ? '- Use only dependencies present in uploaded files\n- No npm/yarn installations allowed' : ''}

### NO MOCK DATA: ${constraints.noMockData ? 'ENFORCED' : 'DISABLED'}
${constraints.noMockData ? '- Implement real business functionality only\n- No fake or demonstration features' : ''}

### EXISTING CODE ONLY: ${constraints.existingCodeOnly ? 'ENFORCED' : 'DISABLED'}
${constraints.existingCodeOnly ? '- Work within uploaded code constraints exclusively\n- No assumptions about missing functionality' : ''}`;
}

// Utility function for file size formatting
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Analyze uploaded files to build project context
function analyzeProjectContext(files: UploadedFile[]): ProjectContext {
  const dependencies = new Set<string>();
  const frameworks = new Set<string>();
  const patterns = new Set<string>();
  const existingComponents = new Set<string>();
  const existingTypes = new Set<string>();
  const existingUtilities = new Set<string>();

  files.forEach(file => {
    // Extract dependencies from imports
    if (file.imports) {
      file.imports.forEach(imp => {
        if (imp.startsWith('@') || !imp.startsWith('.')) {
          dependencies.add(imp);
        }
      });
    }

    // Identify frameworks based on content analysis
    const content = file.content.toLowerCase();
    
    if (content.includes('import react') || content.includes('from "react"') || content.includes("from 'react'")) {
      frameworks.add('React');
    }
    if (content.includes('next/') || content.includes('from "next') || content.includes("from 'next")) {
      frameworks.add('Next.js');
    }
    if (content.includes('@tailwindcss') || content.includes('tailwind') || content.includes('tw-')) {
      frameworks.add('Tailwind CSS');
    }
    if (content.includes('typescript') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      frameworks.add('TypeScript');
    }
    if (content.includes('express') || content.includes('app.listen')) {
      frameworks.add('Express.js');
    }
    if (content.includes('prisma') || content.includes('@prisma')) {
      frameworks.add('Prisma');
    }
    if (content.includes('supabase') || content.includes('@supabase')) {
      frameworks.add('Supabase');
    }

    // Extract React component names
    const componentMatches = file.content.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)|class\s+([A-Z][a-zA-Z0-9]*)\s+extends)/g);
    if (componentMatches) {
      componentMatches.forEach(match => {
        const componentName = match.match(/([A-Z][a-zA-Z0-9]*)/)?.[1];
        if (componentName) {
          existingComponents.add(componentName);
        }
      });
    }

    // Extract type and interface definitions
    const typeMatches = file.content.match(/(?:type|interface)\s+([A-Z][a-zA-Z0-9]*)/g);
    if (typeMatches) {
      typeMatches.forEach(match => {
        const typeName = match.match(/([A-Z][a-zA-Z0-9]*)/)?.[1];
        if (typeName) {
          existingTypes.add(typeName);
        }
      });
    }

    // Extract utility functions and constants
    const utilityMatches = file.content.match(/(?:export\s+(?:function|const)\s+([a-z][a-zA-Z0-9]*)|function\s+([a-z][a-zA-Z0-9]*)\s*\()/g);
    if (utilityMatches) {
      utilityMatches.forEach(match => {
        const utilityName = match.match(/([a-z][a-zA-Z0-9]*)/)?.[1];
        if (utilityName && utilityName !== 'default') {
          existingUtilities.add(utilityName);
        }
      });
    }

    // Identify coding patterns
    if (content.includes('usestate') || content.includes('useeffect') || content.includes('usecallback')) {
      patterns.add('React Hooks');
    }
    if (content.includes('async') && content.includes('await')) {
      patterns.add('Async/Await');
    }
    if (content.includes('try') && content.includes('catch')) {
      patterns.add('Error Handling');
    }
    if (content.includes('prisma') || content.includes('.findMany') || content.includes('.create')) {
      patterns.add('Database ORM');
    }
    if (content.includes('api/') || content.includes('fetch(') || content.includes('axios')) {
      patterns.add('API Integration');
    }
    if (content.includes('test(') || content.includes('describe(') || content.includes('it(')) {
      patterns.add('Unit Testing');
    }
  });

  return {
    files,
    dependencies: Array.from(dependencies),
    frameworks: Array.from(frameworks),
    patterns: Array.from(patterns),
    structure: {}, // Could be expanded for directory analysis
    existingComponents: Array.from(existingComponents),
    existingTypes: Array.from(existingTypes),
    existingUtilities: Array.from(existingUtilities)
  };
}

// Enhanced prompt function with file analysis
export function toEnhancedPrompt(
  template: TemplatesDataObject,
  userPrompt: string,
  uploadedFiles?: UploadedFile[]
): string {
  const projectContext = uploadedFiles ? analyzeProjectContext(uploadedFiles) : undefined;
  
  return generateProductionPrompt(
    template,
    userPrompt,
    projectContext,
    {
      strictMode: true,
      noPlaceholders: true,
      noNewFiles: true,
      noExternalDeps: true,
      noMockData: true,
      existingCodeOnly: true
    }
  );
}

// Legacy compatibility function
export function toPrompt(template: TemplatesDataObject): string {
  return generateProductionPrompt(template, "Generate a production-ready application fragment.");
}