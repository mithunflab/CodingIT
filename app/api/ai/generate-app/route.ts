import { NextRequest, NextResponse } from 'next/server';
import { 
  generateDevelopmentPrompt, 
  getFrameworkPatterns,
  AppGenerationContext 
} from '@/lib/ai/developement-prompts';
import { generateApplication } from '@/lib/ai/generate-application';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/utils/rate-limit';

// Enhanced interface for app generation requests
interface AppGenerationRequest {
  userPrompt: string;
  framework: 'nextjs' | 'vue' | 'streamlit' | 'gradio' | 'react' | 'vanilla';
  appType: 'web-app' | 'api' | 'dashboard' | 'tool' | 'game' | 'landing-page' | 'e-commerce';
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  features: string[];
  designSystem?: 'minimal' | 'modern' | 'corporate' | 'creative' | 'dark';
  integrations?: string[];
  performance?: 'standard' | 'optimized' | 'enterprise';
  projectName: string;
  includeTests?: boolean;
  includeDocumentation?: boolean;
}

// AI Model configuration for different complexity levels
const AI_MODEL_CONFIG = {
  simple: {
    model: 'claude-3-sonnet-20240229',
    maxTokens: 8000,
    temperature: 0.3
  },
  medium: {
    model: 'claude-3-sonnet-20240229',
    maxTokens: 16000,
    temperature: 0.3
  },
  complex: {
    model: 'claude-3-opus-20240229',
    maxTokens: 24000,
    temperature: 0.2
  },
  enterprise: {
    model: 'claude-3-opus-20240229',
    maxTokens: 32000,
    temperature: 0.1
  }
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit.check(request, 'ai-generation', {
      max: 5,
      window: 3600000 // 1 hour
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication check
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body: AppGenerationRequest = await request.json();
    
    const validation = validateAppGenerationRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400 }
      );
    }

    // Create generation context
    const context: AppGenerationContext = {
      framework: body.framework,
      appType: body.appType,
      complexity: body.complexity,
      features: body.features,
      userPrompt: body.userPrompt,
      designSystem: body.designSystem || 'modern',
      integrations: body.integrations || [],
      performance: body.performance || 'standard'
    };

    // Generate the comprehensive prompt
    const developmentPrompt = generateDevelopmentPrompt(context);
    const frameworkPatterns = getFrameworkPatterns(body.framework);

    // Create project structure prompt
    const structurePrompt = generateProjectStructurePrompt(body, frameworkPatterns);

    // Combine prompts for AI generation
    const fullPrompt = `${developmentPrompt}

${structurePrompt}

## Project Name: ${body.projectName}

## Additional Requirements:
${body.includeTests ? '- Include comprehensive test suite' : ''}
${body.includeDocumentation ? '- Include detailed documentation' : ''}

## Generation Instructions:
1. Create a complete, production-ready application
2. Generate all necessary files with full implementations
3. Include proper project structure and organization
4. Ensure all code is functional and deployable
5. Follow the specified framework conventions
6. Include proper error handling and validation
7. Implement responsive design with accessibility
8. Add appropriate comments and documentation
9. Include deployment configuration files
10. Ensure security best practices are followed

Please generate the complete application code structure with all files and implementations.`;

    // Get AI model configuration
    const modelConfig = AI_MODEL_CONFIG[body.complexity];

    // Call AI service to generate the application
    const generatedApp = await generateApplicationWithAI(fullPrompt, modelConfig);

    // Process and structure the generated code
    const processedCode = await processGeneratedCode(generatedApp, body);

    // Save project to database
    const projectData = await saveProjectToDatabase(user.id, body, processedCode);

    // Return the generated application
    return NextResponse.json({
      success: true,
      project: projectData,
      generatedCode: processedCode,
      framework: body.framework,
      complexity: body.complexity,
      estimatedTime: calculateEstimatedTime(body.complexity),
      recommendations: generateRecommendations(body)
    });

  } catch (error) {
    console.error('App generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate application' },
      { status: 500 }
    );
  }
}

function validateAppGenerationRequest(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.userPrompt || typeof body.userPrompt !== 'string' || body.userPrompt.trim().length < 10) {
    errors.push('User prompt must be at least 10 characters long');
  }

  const validFrameworks = ['nextjs', 'vue', 'streamlit', 'gradio', 'react', 'vanilla'];
  if (!validFrameworks.includes(body.framework)) {
    errors.push('Invalid framework specified');
  }

  const validAppTypes = ['web-app', 'api', 'dashboard', 'tool', 'game', 'landing-page', 'e-commerce'];
  if (!validAppTypes.includes(body.appType)) {
    errors.push('Invalid app type specified');
  }

  const validComplexity = ['simple', 'medium', 'complex', 'enterprise'];
  if (!validComplexity.includes(body.complexity)) {
    errors.push('Invalid complexity level specified');
  }

  if (!body.projectName || typeof body.projectName !== 'string' || body.projectName.trim().length < 3) {
    errors.push('Project name must be at least 3 characters long');
  }

  if (!Array.isArray(body.features)) {
    errors.push('Features must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function generateProjectStructurePrompt(request: AppGenerationRequest, patterns: any): string {
  return `
## Project Structure Requirements

### Framework: ${request.framework}
### File Extensions: ${patterns.extensions.join(', ')}
### Main Entry File: ${patterns.mainFile}
### Required Folders: ${patterns.folders.join(', ')}

### Project Organization:
- Follow ${request.framework} best practices for folder structure
- Create modular, reusable components
- Separate business logic from UI components
- Include proper configuration files
- Organize assets and static files appropriately
- Include environment configuration examples
- Create proper build and deployment scripts

### Code Quality Requirements:
- Use TypeScript where applicable for type safety
- Include proper ESLint and Prettier configuration
- Follow consistent naming conventions
- Include proper error boundaries and error handling
- Implement proper logging and debugging capabilities
- Include performance optimization techniques
- Add proper security measures and validation

### Testing Requirements:
${request.includeTests ? `
- Include unit tests for components and utilities
- Add integration tests for critical user flows
- Include end-to-end test examples
- Set up proper testing configuration and scripts
- Include test coverage reporting
` : '- Focus on production code, minimal testing setup'}

### Documentation Requirements:
${request.includeDocumentation ? `
- Include comprehensive README with setup instructions
- Add API documentation where applicable
- Include component documentation and examples
- Add deployment guides and configuration notes
- Include troubleshooting and FAQ sections
` : '- Include basic README and essential documentation'}
`;
}

async function generateApplicationWithAI(prompt: string, config: any): Promise<any> {
  // This would integrate with your AI service (Claude, GPT, etc.)
  // For now, returning a structured response format
  
  // In a real implementation, you would call your AI service here
  // const response = await callAIService(prompt, config);
  
  // Mock response structure for demonstration
  return {
    files: [],
    structure: {},
    dependencies: [],
    buildScripts: {},
    documentation: ''
  };
}

async function processGeneratedCode(generatedApp: any, request: AppGenerationRequest): Promise<any> {
  // Process and validate the generated code
  // Ensure file structure is correct
  // Validate syntax and dependencies
  // Add any missing configuration files
  
  return {
    files: generatedApp.files || [],
    projectStructure: generatedApp.structure || {},
    packageJson: generatePackageJson(request),
    dockerFile: generateDockerFile(request),
    readmeContent: generateReadmeContent(request),
    deploymentConfig: generateDeploymentConfig(request)
  };
}

async function saveProjectToDatabase(userId: string, request: AppGenerationRequest, code: any) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from('ai_generated_projects')
    .insert({
      user_id: userId,
      project_name: request.projectName,
      framework: request.framework,
      app_type: request.appType,
      complexity: request.complexity,
      features: request.features,
      generated_code: code,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to save project to database');
  }

  return data;
}

function generatePackageJson(request: AppGenerationRequest): object {
  const basePackages = {
    nextjs: {
      "next": "^14.0.0",
      "react": "^18.0.0",
      "react-dom": "^18.0.0",
      "typescript": "^5.0.0",
      "@types/react": "^18.0.0",
      "@types/node": "^20.0.0"
    },
    vue: {
      "vue": "^3.3.0",
      "typescript": "^5.0.0",
      "vite": "^5.0.0",
      "@vitejs/plugin-vue": "^4.0.0"
    },
    streamlit: {
      "streamlit": "^1.28.0",
      "pandas": "^2.0.0",
      "numpy": "^1.24.0"
    },
    gradio: {
      "gradio": "^4.0.0",
      "numpy": "^1.24.0"
    }
  };

  const frameworkPackages = basePackages[request.framework as keyof typeof basePackages] || {};

  return {
    name: request.projectName.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    description: `AI-generated ${request.appType} built with ${request.framework}`,
    scripts: generateBuildScripts(request.framework),
    dependencies: frameworkPackages,
    devDependencies: generateDevDependencies(request.framework)
  };
}

function generateBuildScripts(framework: string): object {
  const scripts = {
    nextjs: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    },
    vue: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    streamlit: {
      "start": "streamlit run app.py",
      "dev": "streamlit run app.py --server.runOnSave true"
    },
    gradio: {
      "start": "python app.py",
      "dev": "python app.py"
    }
  };

  return scripts[framework as keyof typeof scripts] || {};
}

function generateDevDependencies(framework: string): object {
  const devDeps = {
    nextjs: {
      "eslint": "^8.0.0",
      "eslint-config-next": "^14.0.0",
      "prettier": "^3.0.0",
      "tailwindcss": "^3.3.0"
    },
    vue: {
      "eslint": "^8.0.0",
      "prettier": "^3.0.0",
      "@typescript-eslint/parser": "^6.0.0"
    }
  };

  return devDeps[framework as keyof typeof devDeps] || {};
}

function generateDockerFile(request: AppGenerationRequest): string {
  const dockerConfigs = {
    nextjs: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`,
    
    streamlit: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]`
  };

  return dockerConfigs[request.framework as keyof typeof dockerConfigs] || '';
}

function generateReadmeContent(request: AppGenerationRequest): string {
  return `# ${request.projectName}

AI-generated ${request.appType} application built with ${request.framework}.

## Features
${request.features.map(feature => `- ${feature}`).join('\n')}

## Getting Started

### Prerequisites
- Node.js 18+ (for JavaScript frameworks)
- Python 3.11+ (for Python frameworks)

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${request.projectName.toLowerCase().replace(/\s+/g, '-')}

# Install dependencies
npm install  # for JS frameworks
# or
pip install -r requirements.txt  # for Python frameworks
\`\`\`

### Development

\`\`\`bash
npm run dev  # for JS frameworks
# or
python app.py  # for Python frameworks
\`\`\`

### Production Build

\`\`\`bash
npm run build && npm start  # for JS frameworks
\`\`\`

## Project Structure

Generated with AI following ${request.framework} best practices and ${request.complexity} complexity level.

## Deployment

This application is ready for deployment on modern hosting platforms.

## License

MIT License
`;
}

function generateDeploymentConfig(request: AppGenerationRequest): object {
  return {
    vercel: request.framework === 'nextjs' ? {
      "builds": [
        {
          "src": "next.config.js",
          "use": "@vercel/next"
        }
      ]
    } : null,
    
    heroku: {
      "web": request.framework === 'streamlit' ? "streamlit run app.py --server.port=$PORT --server.address=0.0.0.0" : "npm start"
    },
    
    docker: {
      "build": ".",
      "ports": request.framework === 'nextjs' ? ["3000:3000"] : ["8501:8501"]
    }
  };
}

function calculateEstimatedTime(complexity: string): string {
  const timeEstimates = {
    simple: "5-10 minutes",
    medium: "15-30 minutes", 
    complex: "45-60 minutes",
    enterprise: "2-3 hours"
  };

  return timeEstimates[complexity as keyof typeof timeEstimates] || "15-30 minutes";
}

function generateRecommendations(request: AppGenerationRequest): string[] {
  const recommendations = [];

  if (request.complexity === 'enterprise') {
    recommendations.push("Consider implementing comprehensive monitoring and logging");
    recommendations.push("Set up automated testing and CI/CD pipelines");
    recommendations.push("Implement proper security auditing and compliance measures");
  }

  if (request.appType === 'e-commerce') {
    recommendations.push("Integrate with a secure payment processor");
    recommendations.push("Implement proper inventory management");
    recommendations.push("Add comprehensive analytics and reporting");
  }

  if (request.framework === 'nextjs') {
    recommendations.push("Consider implementing Next.js App Router for better performance");
    recommendations.push("Use Next.js Image optimization for better loading times");
  }

  recommendations.push("Test the application thoroughly before deployment");
  recommendations.push("Set up proper environment variables for production");
  recommendations.push("Consider implementing error tracking and monitoring");

  return recommendations;
}
