export type Framework = 'nextjs' | 'vue' | 'streamlit' | 'gradio' | 'react' | 'vanilla';
export interface AppGenerationContext {
  framework: 'nextjs' | 'vue' | 'streamlit' | 'gradio' | 'react' | 'vanilla';
  appType: 'web-app' | 'api' | 'dashboard' | 'tool' | 'game' | 'landing-page' | 'e-commerce';
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  features: string[];
  userPrompt: string;
  designSystem?: 'minimal' | 'modern' | 'corporate' | 'creative' | 'dark';
  integrations?: string[];
  performance?: 'standard' | 'optimized' | 'enterprise';
}

export const BASE_DEVELOPMENT_RULES = `
# Core Development Rules
- Write production-ready, fully functional code
- Implement complete features, not placeholders or mockups
- Follow modern best practices and security standards
- Ensure responsive design with light/dark mode support
- Optimize for performance and user experience
- Include proper error handling and loading states
- Write clean, maintainable, and well-documented code
- Use TypeScript for type safety where applicable
- Implement accessibility features (ARIA labels, keyboard navigation)
- Include proper SEO optimization for web applications
`;

export const FRAMEWORK_SPECIFIC_PROMPTS = {
  nextjs: `
# Next.js Application Development

## Architecture Requirements
- Use App Router architecture with TypeScript
- Implement proper file-based routing structure
- Use Server Components by default, Client Components when needed
- Follow Next.js 14+ best practices

## Core Structure
\`\`\`
app/
├── layout.tsx (Root layout with providers)
├── page.tsx (Home page)
├── globals.css (Global styles with CSS variables)
├── api/ (API routes)
│   └── [feature]/route.ts
├── [feature]/ (Feature pages)
│   ├── page.tsx
│   └── components/
└── components/ (Shared components)
\`\`\`

## Implementation Standards
- Use Tailwind CSS for styling
- Implement proper loading.tsx and error.tsx pages
- Use Next.js Image component for optimized images
- Implement proper metadata for SEO
- Use server actions for form handling
- Include proper data fetching patterns
- Implement proper error boundaries

## Performance Optimization
- Use dynamic imports for code splitting
- Implement proper caching strategies
- Optimize images and assets
- Use streaming for better perceived performance
`,

  vue: `
# Vue.js Application Development

## Architecture Requirements
- Use Vue 3 Composition API with TypeScript
- Implement proper component composition patterns
- Use Pinia for state management when needed
- Follow Vue.js best practices

## Core Structure
\`\`\`
src/
├── App.vue (Root component)
├── main.ts (Application entry)
├── router/index.ts (Vue Router configuration)
├── stores/ (Pinia stores)
├── components/ (Reusable components)
├── views/ (Page components)
├── composables/ (Composition functions)
└── assets/ (Static assets)
\`\`\`

## Implementation Standards
- Use single-file components (.vue)
- Implement proper reactivity patterns
- Use Vue Router for navigation
- Include proper prop validation
- Implement proper lifecycle management
- Use composables for reusable logic
`,

  react: `
# React Application Development

## Architecture Requirements
- Use React 18+ with TypeScript
- Implement proper component composition patterns
- Use modern React hooks and patterns
- Follow React best practices

## Core Structure
\`\`\`
src/
├── App.tsx (Root component)
├── index.tsx (Application entry)
├── components/ (Reusable components)
├── pages/ (Page components)
├── hooks/ (Custom hooks)
├── context/ (React contexts)
└── assets/ (Static assets)
\`\`\`

## Implementation Standards
- Use functional components with hooks
- Implement proper state management patterns
- Use React Router for navigation
- Include proper prop types with TypeScript
- Implement proper error boundaries
- Use modern React patterns and best practices
`,

  vanilla: `
# Vanilla JavaScript Application Development

## Architecture Requirements
- Use modern ES6+ JavaScript or TypeScript
- Implement modular code structure
- Use modern web APIs and standards
- Follow clean code principles

## Core Structure
\`\`\`
src/
├── index.html (Main HTML file)
├── main.js/ts (Application entry)
├── components/ (Component modules)
├── utils/ (Utility functions)
├── styles/ (CSS/SCSS files)
└── assets/ (Static assets)
\`\`\`

## Implementation Standards
- Use modern JavaScript features
- Implement proper module system
- Use native web APIs for DOM manipulation
- Include proper event handling
- Implement responsive design with CSS
- Use modern build tools if needed
`,

  streamlit: `
# Streamlit Application Development

## Architecture Requirements
- Build data-driven applications with Python
- Focus on interactive widgets and data visualization
- Implement proper session state management
- Use modern Streamlit features

## Implementation Standards
- Use proper page configuration and layout
- Implement caching for performance (@st.cache_data)
- Create reusable components and functions
- Include proper error handling
- Use columns and containers for layout
- Implement proper data validation
- Include progress indicators for long operations

## Data Handling
- Use pandas for data manipulation
- Implement proper data loading and caching
- Include data validation and cleaning
- Use appropriate visualization libraries (plotly, matplotlib)
`,

  gradio: `
# Gradio Application Development

## Architecture Requirements
- Build ML/AI interface applications with Python
- Focus on user-friendly ML model interfaces
- Implement proper input/output handling
- Use modern Gradio features

## Implementation Standards
- Create intuitive interface layouts
- Implement proper input validation
- Include example inputs and clear descriptions
- Use appropriate interface components
- Implement proper error handling for ML operations
- Include progress indicators for model inference
- Use proper theming and customization
`
};

export const APP_TYPE_PROMPTS = {
  'web-app': `
# Web Application Development

## Core Features to Implement
- User authentication and authorization
- Responsive navigation system
- Main application features as specified
- User profile management
- Settings and preferences
- Search and filtering capabilities
- Real-time updates where appropriate
- Mobile-responsive design

## User Experience
- Intuitive navigation and user flows
- Loading states and error handling
- Form validation and feedback
- Smooth animations and transitions
- Accessibility features
- Offline capabilities where relevant
`,

  'api': `
# API Development

## Core Requirements
- RESTful API design principles
- Proper HTTP status codes and responses
- Request/response validation
- Authentication and authorization
- Rate limiting and security
- Comprehensive error handling
- API documentation
- Proper data models and schemas

## Implementation Standards
- Use proper middleware for cross-cutting concerns
- Implement input validation and sanitization
- Include proper logging and monitoring
- Use appropriate database patterns
- Implement proper caching strategies
- Include API versioning considerations
`,

  'dashboard': `
# Dashboard Application Development

## Core Features
- Data visualization and charts
- Key metrics and KPIs display
- Interactive filters and controls
- Real-time data updates
- Export and sharing capabilities
- Customizable layout options
- User role-based access

## Visualization Standards
- Use appropriate chart types for data
- Implement responsive chart layouts
- Include interactive tooltips and legends
- Use consistent color schemes
- Implement proper loading states for data
- Include data refresh capabilities
`,

  'tool': `
# Tool Application Development

## Core Features
- Focused functionality for specific tasks
- Clean and intuitive user interface
- Input/output handling with validation
- File upload/download capabilities
- Processing status and progress indicators
- Export and sharing options
- Keyboard shortcuts for power users

## User Experience
- Clear instructions and help text
- Example inputs and use cases
- Error prevention and recovery
- Batch processing capabilities where relevant
- Undo/redo functionality where appropriate
`,

  'game': `
# Game Development

## Core Features
- Game mechanics and rules implementation
- User interaction and controls
- Score tracking and progression
- Game state management
- Audio/visual feedback
- Responsive design for different devices
- Save/load game state

## Implementation Standards
- Smooth animations and transitions
- Proper game loop implementation
- Efficient rendering and performance
- Touch and keyboard controls
- Game difficulty progression
- Clear win/lose conditions
`,

  'landing-page': `
# Landing Page Development

## Core Sections
- Hero section with clear value proposition
- Features and benefits showcase
- Social proof and testimonials
- Call-to-action sections
- Contact information and forms
- Footer with important links

## Conversion Optimization
- Clear and compelling headlines
- Strategic placement of CTAs
- Mobile-first responsive design
- Fast loading times
- SEO optimization
- A/B test ready structure
`,

  'e-commerce': `
# E-commerce Application Development

## Core Features
- Product catalog with search and filtering
- Shopping cart and checkout process
- User accounts and order history
- Payment integration ready structure
- Product reviews and ratings
- Inventory management interface
- Admin dashboard for management

## User Experience
- Intuitive product discovery
- Seamless checkout flow
- Mobile commerce optimization
- Product image galleries
- Wishlist and favorites
- Order tracking capabilities
`
};

export const COMPLEXITY_MODIFIERS = {
  simple: `
# Simplified Implementation
- Focus on core functionality only
- Minimal feature set
- Clean and straightforward UI
- Basic error handling
- Standard performance expectations
`,

  medium: `
# Standard Implementation
- Include secondary features
- Enhanced user experience
- Comprehensive error handling
- Performance optimizations
- Additional integrations
- Advanced UI components
`,

  complex: `
# Advanced Implementation
- Full feature set with advanced capabilities
- Sophisticated user experience
- Comprehensive testing coverage
- Advanced performance optimizations
- Multiple integrations
- Admin interfaces and analytics
- Advanced security features
`,

  enterprise: `
# Enterprise-Grade Implementation
- Scalable architecture patterns
- Advanced security and compliance
- Multi-tenant capabilities
- Comprehensive monitoring and logging
- Advanced caching and optimization
- Full test coverage
- Documentation and deployment guides
- Role-based access control
`
};

export const DESIGN_SYSTEM_PROMPTS = {
  minimal: `
# Minimal Design System
- Clean typography with plenty of whitespace
- Subtle colors and minimal visual elements
- Focus on content and functionality
- Simple navigation and layouts
- Monochromatic or limited color palette
`,

  modern: `
# Modern Design System
- Contemporary UI patterns and components
- Vibrant colors and gradients
- Smooth animations and micro-interactions
- Card-based layouts
- Modern typography scales
- Interactive elements with hover states
`,

  corporate: `
# Corporate Design System
- Professional and trustworthy appearance
- Conservative color schemes
- Clear information hierarchy
- Business-focused layouts
- Formal typography choices
- Consistent branding elements
`,

  creative: `
# Creative Design System
- Bold and expressive visual elements
- Creative layouts and unique patterns
- Artistic color combinations
- Custom illustrations and graphics
- Experimental typography
- Interactive and engaging animations
`,

  dark: `
# Dark Mode Design System
- Dark background with light text
- High contrast for readability
- Accent colors that work well on dark backgrounds
- Proper color schemes for both modes
- Eye-friendly color choices
- Consistent theming throughout
`
};

export const INTEGRATION_PROMPTS = {
  database: `
## Database Integration
- Implement proper data models and schemas
- Use appropriate ORM or database client
- Include data validation and constraints
- Implement proper indexing strategies
- Include migration scripts if applicable
`,

  authentication: `
## Authentication Integration
- Implement secure user authentication
- Include proper session management
- Use secure password handling
- Implement proper authorization checks
- Include social login options if needed
`,

  payments: `
## Payment Integration Ready
- Structure code for payment provider integration
- Implement secure payment form handling
- Include proper order management
- Implement webhook handling structure
- Include proper error handling for payments
`,

  apis: `
## External API Integration
- Implement proper API client patterns
- Include error handling and retries
- Implement proper caching strategies
- Include rate limiting awareness
- Use proper authentication for external APIs
`
};

export function generateDevelopmentPrompt(context: AppGenerationContext): string {
  const {
    framework,
    appType,
    complexity,
    features,
    userPrompt,
    designSystem = 'modern',
    integrations = [],
    performance = 'standard'
  } = context;

  let prompt = `# AI-Powered Application Development

${BASE_DEVELOPMENT_RULES}

## User Requirements
${userPrompt}

## Framework Specifications
${FRAMEWORK_SPECIFIC_PROMPTS[framework]}

## Application Type Requirements
${APP_TYPE_PROMPTS[appType]}

## Complexity Level
${COMPLEXITY_MODIFIERS[complexity]}

## Design System
${DESIGN_SYSTEM_PROMPTS[designSystem]}
`;

  // Add integration requirements
  if (integrations.length > 0) {
    prompt += `\n## Integration Requirements\n`;
    integrations.forEach(integration => {
      if (INTEGRATION_PROMPTS[integration as keyof typeof INTEGRATION_PROMPTS]) {
        prompt += INTEGRATION_PROMPTS[integration as keyof typeof INTEGRATION_PROMPTS] + '\n';
      }
    });
  }

  // Add specific features
  if (features.length > 0) {
    prompt += `\n## Specific Features to Implement\n`;
    features.forEach(feature => {
      prompt += `- ${feature}\n`;
    });
  }

  // Add performance requirements
  if (performance === 'optimized') {
    prompt += `
## Performance Optimization Requirements
- Implement advanced caching strategies
- Optimize bundle sizes and loading times
- Use lazy loading and code splitting
- Implement service workers for offline capabilities
- Optimize images and assets
- Use CDN-ready asset structure
`;
  } else if (performance === 'enterprise') {
    prompt += `
## Enterprise Performance Requirements
- Implement scalable architecture patterns
- Advanced caching and CDN integration
- Database query optimization
- Load balancing ready structure
- Monitoring and analytics integration
- Advanced error tracking and logging
`;
  }

  prompt += `
## Final Implementation Requirements
1. Create a complete, production-ready application
2. Include all necessary files and dependencies
3. Implement proper error handling throughout
4. Ensure mobile responsiveness
5. Include proper documentation and comments
6. Follow security best practices
7. Optimize for the specified performance level
8. Include proper testing considerations
9. Ensure accessibility compliance
10. Create deployment-ready code

## Code Quality Standards
- Use consistent code formatting and style
- Implement proper TypeScript types where applicable
- Include JSDoc comments for complex functions
- Follow the framework's best practices and conventions
- Ensure code is maintainable and scalable
- Include proper separation of concerns
- Use proper naming conventions throughout

Generate the complete application based on these requirements, ensuring every aspect is production-ready and fully functional.
`;

  return prompt;
}

// Utility function to get framework-specific file extensions and patterns
export function getFrameworkPatterns(framework: string) {
  const patterns = {
    nextjs: {
      extensions: ['.tsx', '.ts', '.css'],
      mainFile: 'page.tsx',
      configFiles: ['next.config.js', 'tailwind.config.js', 'tsconfig.json'],
      folders: ['app', 'components', 'lib', 'public']
    },
    vue: {
      extensions: ['.vue', '.ts', '.css'],
      mainFile: 'App.vue',
      configFiles: ['vite.config.ts', 'tsconfig.json'],
      folders: ['src', 'public']
    },
    streamlit: {
      extensions: ['.py'],
      mainFile: 'app.py',
      configFiles: ['requirements.txt'],
      folders: ['pages', 'components', 'data']
    },
    gradio: {
      extensions: ['.py'],
      mainFile: 'app.py',
      configFiles: ['requirements.txt'],
      folders: ['components', 'models', 'utils']
    }
  };

  return patterns[framework as keyof typeof patterns] || patterns.nextjs;
}

// Template for generating specific component prompts
export function generateComponentPrompt(
  componentType: string,
  framework: string,
  requirements: string[]
): string {
  return `
# ${componentType} Component Development for ${framework}

## Requirements
${requirements.map(req => `- ${req}`).join('\n')}

## Implementation Standards
${FRAMEWORK_SPECIFIC_PROMPTS[framework as keyof typeof FRAMEWORK_SPECIFIC_PROMPTS]}

## Component Specifications
- Create a reusable, production-ready component
- Include proper prop types and validation
- Implement responsive design
- Include proper accessibility features
- Add loading and error states where applicable
- Follow framework-specific best practices
- Include proper documentation and examples

Generate the complete component implementation with all necessary supporting code.
`;
}