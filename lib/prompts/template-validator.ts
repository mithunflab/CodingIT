import templates, { templatesToPrompt } from '@/lib/templates';

export const VALID_TEMPLATES = [
  'code-interpreter-v1',
  'nextjs-developer', 
  'vue-developer',
  'streamlit-developer',
  'gradio-developer'
] as const;

export type ValidTemplate = typeof VALID_TEMPLATES[number];

// Template mapping for common aliases
export const TEMPLATE_ALIASES: Record<string, ValidTemplate> = {
  'next-js': 'nextjs-developer',
  'nextjs': 'nextjs-developer',
  'next': 'nextjs-developer',
  'react': 'nextjs-developer',
  'typescript': 'nextjs-developer',
  'vue': 'vue-developer',
  'vue-js': 'vue-developer',
  'nuxt': 'vue-developer',
  'python': 'code-interpreter-v1',
  'data': 'code-interpreter-v1',
  'analysis': 'code-interpreter-v1',
  'pandas': 'code-interpreter-v1',
  'streamlit': 'streamlit-developer',
  'dashboard': 'streamlit-developer',
  'gradio': 'gradio-developer',
  'ml': 'gradio-developer',
  'ai': 'gradio-developer'
};

/**
 * Validates and corrects template names
 */
export function validateTemplate(templateName: string): ValidTemplate {
  // Check if it's already a valid template
  if (VALID_TEMPLATES.includes(templateName as ValidTemplate)) {
    return templateName as ValidTemplate;
  }

  // Check aliases
  const normalized = templateName.toLowerCase().replace(/[-_]/g, '');
  for (const [alias, validTemplate] of Object.entries(TEMPLATE_ALIASES)) {
    if (normalized.includes(alias.replace(/[-_]/g, ''))) {
      return validTemplate;
    }
  }

  // Default fallback
  console.warn(`Unknown template "${templateName}", falling back to nextjs-developer`);
  return 'nextjs-developer';
}

/**
 * Get template recommendation based on user input
 */
export function getTemplateFromInput(userInput: string): ValidTemplate {
  const input = userInput.toLowerCase();

  // Mobile app detection (Note: no mobile template available, fallback to nextjs)
  if (input.includes('mobile') || input.includes('react native') || input.includes('expo')) {
    console.warn('Mobile development not directly supported, using nextjs-developer');
    return 'nextjs-developer';
  }

  // Data analysis detection
  if (input.includes('data') || input.includes('analysis') || 
      input.includes('pandas') || input.includes('matplotlib') ||
      input.includes('jupyter') || input.includes('csv') ||
      input.includes('plot') || input.includes('chart')) {
    return 'code-interpreter-v1';
  }

  // Streamlit detection
  if (input.includes('streamlit') || input.includes('dashboard') ||
      input.includes('interactive') && input.includes('python')) {
    return 'streamlit-developer';
  }

  // Gradio detection  
  if (input.includes('gradio') || input.includes('demo') ||
      input.includes('ml') || input.includes('machine learning') ||
      input.includes('ai interface')) {
    return 'gradio-developer';
  }

  // Vue detection
  if (input.includes('vue') || input.includes('nuxt') || 
      input.includes('composition api')) {
    return 'vue-developer';
  }

  // Default to Next.js for web applications
  return 'nextjs-developer';
}

/**
 * Get template configuration
 */
export function getTemplateConfig(template: ValidTemplate) {
  const configs = {
    'code-interpreter-v1': {
      name: 'Python Data Analysis',
      description: 'Python environment with pandas, numpy, matplotlib',
      port: null,
      file: 'script.py',
      language: 'python',
      framework: 'python'
    },
    'nextjs-developer': {
      name: 'Next.js Developer',
      description: 'Next.js 14+ with TypeScript, Tailwind CSS, shadcn/ui',
      port: 3000,
      file: 'pages/index.tsx',
      language: 'typescript',
      framework: 'nextjs'
    },
    'vue-developer': {
      name: 'Vue Developer', 
      description: 'Vue 3 with Nuxt, Composition API, Tailwind CSS',
      port: 3000,
      file: 'app.vue',
      language: 'typescript',
      framework: 'vue'
    },
    'streamlit-developer': {
      name: 'Streamlit Developer',
      description: 'Python Streamlit for interactive web apps',
      port: 8501,
      file: 'app.py',
      language: 'python',
      framework: 'streamlit'
    },
    'gradio-developer': {
      name: 'Gradio Developer',
      description: 'Python Gradio for ML/AI demos and interfaces',
      port: 7860,
      file: 'app.py', 
      language: 'python',
      framework: 'gradio'
    }
  };

  return configs[template];
}
export function isValidTemplate(template: string): template is ValidTemplate {
  return VALID_TEMPLATES.includes(template as ValidTemplate);
}

{templatesToPrompt(templates)}