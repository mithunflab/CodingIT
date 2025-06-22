// lib/ai/prompt-enhancement.ts

export interface PromptAnalysis {
  clarity: number; // 0-1 scale
  specificity: number; // 0-1 scale
  completeness: number; // 0-1 scale
  feasibility: number; // 0-1 scale
  suggestions: string[];
  enhancedPrompt: string;
  detectedIntents: string[];
  recommendedFramework: string;
  recommendedComplexity: string;
  estimatedFeatures: string[];
}

export class PromptEnhancer {
  private static readonly INTENT_PATTERNS = {
    'e-commerce': [
      'shop', 'store', 'buy', 'sell', 'cart', 'checkout', 'payment', 'product', 'inventory'
    ],
    'dashboard': [
      'analytics', 'metrics', 'chart', 'graph', 'report', 'data', 'visualization', 'kpi'
    ],
    'tool': [
      'calculator', 'converter', 'generator', 'processor', 'utility', 'helper'
    ],
    'game': [
      'game', 'play', 'score', 'level', 'player', 'match', 'puzzle', 'arcade'
    ],
    'api': [
      'api', 'endpoint', 'service', 'backend', 'rest', 'graphql', 'microservice'
    ],
    'landing-page': [
      'landing', 'marketing', 'promotion', 'conversion', 'lead', 'signup'
    ],
    'web-app': [
      'application', 'platform', 'system', 'interface', 'portal', 'management'
    ]
  };

  private static readonly FRAMEWORK_INDICATORS = {
    'nextjs': [
      'react', 'ssr', 'seo', 'full-stack', 'web app', 'e-commerce', 'landing page'
    ],
    'vue': [
      'vue', 'progressive', 'spa', 'interactive', 'modern ui'
    ],
    'streamlit': [
      'data', 'analytics', 'machine learning', 'python', 'dashboard', 'visualization'
    ],
    'gradio': [
      'ml', 'ai', 'model', 'interface', 'demo', 'prototype', 'machine learning'
    ]
  };

  private static readonly COMPLEXITY_INDICATORS = {
    'simple': [
      'basic', 'simple', 'minimal', 'quick', 'prototype', 'demo'
    ],
    'medium': [
      'feature-rich', 'interactive', 'responsive', 'user-friendly'
    ],
    'complex': [
      'advanced', 'sophisticated', 'comprehensive', 'full-featured', 'enterprise'
    ],
    'enterprise': [
      'scalable', 'production', 'multi-tenant', 'enterprise', 'secure', 'compliance'
    ]
  };

  public static analyzePrompt(userPrompt: string): PromptAnalysis {
    const prompt = userPrompt.toLowerCase();
    const words = prompt.split(/\s+/);
    
    // Analyze clarity
    const clarity = this.calculateClarity(prompt, words);
    
    // Analyze specificity
    const specificity = this.calculateSpecificity(prompt, words);
    
    // Analyze completeness
    const completeness = this.calculateCompleteness(prompt);
    
    // Analyze feasibility
    const feasibility = this.calculateFeasibility(prompt);
    
    // Detect intents
    const detectedIntents = this.detectIntents(prompt);
    
    // Recommend framework
    const recommendedFramework = this.recommendFramework(prompt);
    
    // Recommend complexity
    const recommendedComplexity = this.recommendComplexity(prompt);
    
    // Extract features
    const estimatedFeatures = this.extractFeatures(prompt);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(clarity, specificity, completeness, detectedIntents);
    
    // Enhance the prompt
    const enhancedPrompt = this.enhancePrompt(userPrompt, suggestions, detectedIntents, estimatedFeatures);

    return {
      clarity,
      specificity,
      completeness,
      feasibility,
      suggestions,
      enhancedPrompt,
      detectedIntents,
      recommendedFramework,
      recommendedComplexity,
      estimatedFeatures
    };
  }

  private static calculateClarity(prompt: string, words: string[]): number {
    let score = 0.5; // Base score
    
    // Check for clear action words
    const actionWords = ['create', 'build', 'make', 'develop', 'design', 'implement'];
    if (actionWords.some(word => prompt.includes(word))) score += 0.2;
    
    // Check for clear objectives
    if (prompt.includes('that') || prompt.includes('which') || prompt.includes('to')) score += 0.1;
    
    // Penalize vague language
    const vagueness = ['something', 'stuff', 'thing', 'some', 'maybe'].filter(word => prompt.includes(word)).length;
    score -= vagueness * 0.1;
    
    // Check sentence structure
    if (words.length >= 10 && words.length <= 50) score += 0.1;
    if (words.length > 50) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private static calculateSpecificity(prompt: string, words: string[]): number {
    let score = 0.3; // Base score
    
    // Check for specific technologies mentioned
    const technologies = ['react', 'vue', 'python', 'javascript', 'typescript', 'api', 'database'];
    const techMentions = technologies.filter(tech => prompt.includes(tech)).length;
    score += techMentions * 0.1;
    
    // Check for specific features
    const features = ['login', 'search', 'filter', 'dashboard', 'chart', 'form', 'upload'];
    const featureMentions = features.filter(feature => prompt.includes(feature)).length;
    score += featureMentions * 0.08;
    
    // Check for numbers and quantities
    const numberPattern = /\d+/g;
    const numberMatches = prompt.match(numberPattern);
    if (numberMatches && numberMatches.length > 0) score += 0.15;
    
    return Math.max(0, Math.min(1, score));
  }

  private static calculateCompleteness(prompt: string): number {
    let score = 0.4; // Base score
    
    // Check for essential elements
    if (prompt.includes('user') || prompt.includes('customer')) score += 0.1;
    if (prompt.includes('feature') || prompt.includes('function')) score += 0.1;
    if (prompt.includes('data') || prompt.includes('information')) score += 0.1;
    if (prompt.includes('interface') || prompt.includes('ui') || prompt.includes('design')) score += 0.1;
    
    // Check for use cases or examples
    if (prompt.includes('example') || prompt.includes('like') || prompt.includes('such as')) score += 0.1;
    
    // Check for constraints or requirements
    if (prompt.includes('requirement') || prompt.includes('must') || prompt.includes('should')) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private static calculateFeasibility(prompt: string): number {
    let score = 0.8; // Assume feasible by default
    
    // Check for unrealistic expectations
    const unrealistic = ['perfect', 'best', 'ultimate', 'revolutionary', 'world-class'];
    const unrealisticMentions = unrealistic.filter(word => prompt.includes(word)).length;
    score -= unrealisticMentions * 0.1;
    
    // Check for time constraints
    if (prompt.includes('immediately') || prompt.includes('asap') || prompt.includes('urgent')) {
      score -= 0.2;
    }
    
    // Check for scope creep indicators
    if (prompt.includes('everything') || prompt.includes('all features') || prompt.includes('complete')) {
      score -= 0.15;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private static detectIntents(prompt: string): string[] {
    const detectedIntents: string[] = [];
    
    Object.entries(this.INTENT_PATTERNS).forEach(([intent, patterns]) => {
      const matches = patterns.filter(pattern => prompt.includes(pattern)).length;
      if (matches > 0) {
        detectedIntents.push(intent);
      }
    });
    
    return detectedIntents;
  }

  private static recommendFramework(prompt: string): string {
    let bestFramework = 'nextjs';
    let maxScore = 0;
    
    Object.entries(this.FRAMEWORK_INDICATORS).forEach(([framework, indicators]) => {
      const score = indicators.filter(indicator => prompt.includes(indicator)).length;
      if (score > maxScore) {
        maxScore = score;
        bestFramework = framework;
      }
    });
    
    return bestFramework;
  }

  private static recommendComplexity(prompt: string): string {
    let bestComplexity = 'medium';
    let maxScore = 0;
    
    Object.entries(this.COMPLEXITY_INDICATORS).forEach(([complexity, indicators]) => {
      const score = indicators.filter(indicator => prompt.includes(indicator)).length;
      if (score > maxScore) {
        maxScore = score;
        bestComplexity = complexity;
      }
    });
    
    return bestComplexity;
  }

  private static extractFeatures(prompt: string): string[] {
    const features: string[] = [];
    const featurePatterns = {
      'User Authentication': ['login', 'signup', 'register', 'auth', 'account'],
      'Search Functionality': ['search', 'find', 'filter', 'query'],
      'Data Visualization': ['chart', 'graph', 'plot', 'visualization', 'analytics'],
      'File Upload': ['upload', 'file', 'import', 'attach'],
      'Real-time Updates': ['real-time', 'live', 'instant', 'notification'],
      'Mobile Responsive': ['mobile', 'responsive', 'tablet', 'device'],
      'Database Integration': ['database', 'store', 'save', 'persist', 'data'],
      'API Integration': ['api', 'service', 'integration', 'external'],
      'Admin Panel': ['admin', 'management', 'control', 'moderate'],
      'Payment Processing': ['payment', 'checkout', 'billing', 'subscription'],
      'Social Features': ['share', 'comment', 'like', 'social', 'community'],
      'Export/Import': ['export', 'import', 'download', 'csv', 'pdf']
    };
    
    Object.entries(featurePatterns).forEach(([feature, patterns]) => {
      if (patterns.some(pattern => prompt.includes(pattern))) {
        features.push(feature);
      }
    });
    
    return features;
  }

  private static generateSuggestions(
    clarity: number,
    specificity: number,
    completeness: number,
    intents: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (clarity < 0.6) {
      suggestions.push("Consider being more specific about what you want to build");
      suggestions.push("Try using clear action words like 'create', 'build', or 'develop'");
    }
    
    if (specificity < 0.5) {
      suggestions.push("Specify the target users or audience for your application");
      suggestions.push("Mention specific technologies or frameworks you prefer");
      suggestions.push("Include details about the main features you need");
    }
    
    if (completeness < 0.6) {
      suggestions.push("Describe the core functionality in more detail");
      suggestions.push("Mention any design preferences or requirements");
      suggestions.push("Include information about data or content types");
    }
    
    if (intents.length === 0) {
      suggestions.push("Clarify the primary purpose of your application");
      suggestions.push("Specify whether you need a web app, mobile app, or API");
    }
    
    if (intents.length > 3) {
      suggestions.push("Consider focusing on the most important features first");
      suggestions.push("You might want to break this into multiple smaller projects");
    }
    
    return suggestions;
  }

  private static enhancePrompt(
    originalPrompt: string,
    suggestions: string[],
    intents: string[],
    features: string[]
  ): string {
    let enhanced = originalPrompt;
    
    // Add context if missing
    if (!enhanced.toLowerCase().includes('create') && !enhanced.toLowerCase().includes('build')) {
      enhanced = `Create ${enhanced}`;
    }
    
    // Add specific intent clarification
    if (intents.length === 1) {
      enhanced += `\n\nThis should be a ${intents[0]} application.`;
    }
    
    // Add detected features
    if (features.length > 0) {
      enhanced += `\n\nKey features to include: ${features.slice(0, 5).join(', ')}.`;
    }
    
    // Add technical specifications
    enhanced += `\n\nPlease ensure the application is:
- Production-ready and fully functional
- Responsive and mobile-friendly
- Accessible and user-friendly
- Secure and follows best practices
- Well-documented and maintainable`;
    
    return enhanced;
  }
}

// Advanced template system for different app types
export class AppTemplateSystem {
  private static readonly APP_TEMPLATES = {
    'e-commerce': {
      name: 'E-commerce Platform',
      description: 'Full-featured online store with cart, checkout, and admin',
      coreFeatures: [
        'Product catalog with categories',
        'Shopping cart and wishlist',
        'User authentication and profiles',
        'Checkout and payment integration',
        'Order management system',
        'Admin dashboard',
        'Inventory management',
        'Product reviews and ratings'
      ],
      technicalRequirements: [
        'Database for products and orders',
        'Payment gateway integration',
        'Image upload and optimization',
        'Search and filtering',
        'Mobile-responsive design',
        'SEO optimization'
      ],
      complexity: 'complex'
    },
    
    'dashboard': {
      name: 'Analytics Dashboard',
      description: 'Data visualization and analytics platform',
      coreFeatures: [
        'Interactive charts and graphs',
        'Real-time data updates',
        'Customizable widgets',
        'Data filtering and querying',
        'Export and sharing capabilities',
        'User role management',
        'Report generation',
        'Alert and notification system'
      ],
      technicalRequirements: [
        'Data visualization library',
        'Real-time data connections',
        'Database optimization',
        'Responsive chart layouts',
        'Export functionality',
        'Caching for performance'
      ],
      complexity: 'medium'
    },
    
    'tool': {
      name: 'Utility Tool',
      description: 'Focused application for specific tasks',
      coreFeatures: [
        'Core utility functionality',
        'Input validation and processing',
        'Results display and export',
        'Batch processing capability',
        'History and saved results',
        'Keyboard shortcuts',
        'Help and documentation',
        'Mobile optimization'
      ],
      technicalRequirements: [
        'Efficient processing algorithms',
        'Client-side validation',
        'File handling capabilities',
        'Responsive design',
        'Error handling and recovery',
        'Performance optimization'
      ],
      complexity: 'simple'
    },
    
    'landing-page': {
      name: 'Marketing Landing Page',
      description: 'Conversion-optimized marketing page',
      coreFeatures: [
        'Hero section with value proposition',
        'Feature highlights and benefits',
        'Social proof and testimonials',
        'Call-to-action buttons',
        'Contact forms and lead capture',
        'FAQ section',
        'Footer with links and info',
        'Mobile optimization'
      ],
      technicalRequirements: [
        'Fast loading times',
        'SEO optimization',
        'Form handling and validation',
        'Analytics integration ready',
        'A/B testing structure',
        'Social media integration'
      ],
      complexity: 'simple'
    },
    
    'api': {
      name: 'REST API Service',
      description: 'Backend API with comprehensive endpoints',
      coreFeatures: [
        'RESTful endpoint design',
        'Authentication and authorization',
        'Data validation and sanitization',
        'Error handling and responses',
        'Rate limiting and security',
        'API documentation',
        'Logging and monitoring',
        'Testing suite'
      ],
      technicalRequirements: [
        'Database integration',
        'Security middleware',
        'Request/response validation',
        'Performance optimization',
        'Scalable architecture',
        'Deployment configuration'
      ],
      complexity: 'medium'
    }
  };

  public static getTemplate(appType: string): any {
    return this.APP_TEMPLATES[appType as keyof typeof this.APP_TEMPLATES] || null;
  }

  public static getAllTemplates(): any {
    return this.APP_TEMPLATES;
  }

  public static generateTemplatePrompt(appType: string, userRequirements: string): string {
    const template = this.getTemplate(appType);
    if (!template) {
      return userRequirements;
    }

    return `# ${template.name}

## User Requirements
${userRequirements}

## Template Overview
${template.description}

## Core Features to Implement
${template.coreFeatures.map((feature: string) => `- ${feature}`).join('\n')}

## Technical Requirements
${template.technicalRequirements.map((req: string) => `- ${req}`).join('\n')}

## Complexity Level
${template.complexity}

## Implementation Guidelines
- Follow modern development best practices
- Ensure all features are production-ready
- Include proper error handling and validation
- Implement responsive and accessible design
- Add comprehensive documentation
- Include deployment configuration
- Optimize for performance and security

Please create a complete, functional application that incorporates the user requirements with the template structure above.`;
  }
}

// Prompt validation and scoring system
export class PromptValidator {
  public static validateAndScore(prompt: string): {
    isValid: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Length validation
    if (prompt.length < 20) {
      issues.push('Prompt is too short (minimum 20 characters)');
      score -= 30;
    } else if (prompt.length > 2000) {
      issues.push('Prompt is too long (maximum 2000 characters)');
      score -= 10;
    }

    // Content validation
    if (!prompt.toLowerCase().includes('app') && 
        !prompt.toLowerCase().includes('application') && 
        !prompt.toLowerCase().includes('website') &&
        !prompt.toLowerCase().includes('tool')) {
      issues.push('Prompt should clearly indicate what type of application to build');
      score -= 20;
    }

    // Clarity check
    const vagueness = ['something', 'anything', 'stuff', 'thing'].filter(word => 
      prompt.toLowerCase().includes(word)
    ).length;
    if (vagueness > 0) {
      issues.push('Prompt contains vague language');
      score -= vagueness * 10;
      recommendations.push('Be more specific about your requirements');
    }

    // Completeness check
    const hasAction = ['create', 'build', 'make', 'develop', 'design'].some(word =>
      prompt.toLowerCase().includes(word)
    );
    if (!hasAction) {
      recommendations.push('Include a clear action word like "create" or "build"');
      score -= 5;
    }

    // Feasibility check
    const unrealistic = ['perfect', 'best ever', 'revolutionary', 'world-changing'].filter(phrase =>
      prompt.toLowerCase().includes(phrase)
    ).length;
    if (unrealistic > 0) {
      recommendations.push('Focus on realistic and achievable goals');
      score -= unrealistic * 15;
    }

    return {
      isValid: score >= 50 && issues.length === 0,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}
