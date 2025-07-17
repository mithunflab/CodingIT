import { TemplateConfig, Templates } from '@/lib/templates';
import { discussPrompt } from './discuss-prompt';
import { getFineTunedPrompt } from './new-prompt';
import optimizedPrompt from './optimized';
import advancedPrompt from './advanced';
import { getSystemPrompt } from './prompts';

export type PromptMode = 'discuss' | 'finetuned' | 'optimized' | 'advanced' | 'system';

export interface PromptConfig {
  mode: PromptMode;
  cwd?: string;
  supabase?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: { anonKey?: string; supabaseUrl?: string };
  };
  designScheme?: any;
  template?: TemplateConfig;
  context?: {
    userLevel?: 'beginner' | 'intermediate' | 'expert';
    projectType?: string;
    projectComplexity?: 'simple' | 'medium' | 'advanced' | 'enterprise';
    previousErrors?: string[];
  };
}

export function generatePrompt(config: PromptConfig): string {
  const { mode, cwd = '', supabase, designScheme, template, context } = config;

  switch (mode) {
    case 'discuss':
      return discussPrompt();
    
    case 'finetuned':
      return getFineTunedPrompt(cwd, supabase, designScheme);
    
    case 'optimized':
      return optimizedPrompt({
        cwd,
        allowedHtmlElements: [
          'a', 'b', 'i', 'strong', 'em', 'code', 'pre', 'blockquote', 
          'ul', 'ol', 'li', 'br', 'hr', 'img'
        ],
        supabase,
      });
    
    case 'advanced':
      return advancedPrompt({
        cwd,
        allowedHtmlElements: [
          'a', 'b', 'i', 'strong', 'em', 'code', 'pre', 'blockquote', 
          'ul', 'ol', 'li', 'br', 'hr', 'img'
        ],
        supabase,
        userLevel: context?.userLevel || 'expert',
        projectComplexity: context?.projectComplexity || 'enterprise',
      });
    
    case 'system':
      return getSystemPrompt(cwd, supabase, designScheme, template);
    
    default:
      // Default to advanced mode for production usage
      return advancedPrompt({
        cwd,
        allowedHtmlElements: [
          'a', 'b', 'i', 'strong', 'em', 'code', 'pre', 'blockquote', 
          'ul', 'ol', 'li', 'br', 'hr', 'img'
        ],
        supabase,
        userLevel: context?.userLevel || 'expert',
        projectComplexity: context?.projectComplexity || 'enterprise',
      });
  }
}

export function selectPromptMode(
  userInput: string,
  context?: PromptConfig['context']
): PromptMode {
  const input = userInput.toLowerCase();
  
  // Check for discussion/planning keywords
  if (input.includes('explain') || 
      input.includes('how does') || 
      input.includes('what is') ||
      input.includes('help me understand') ||
      input.includes('plan') && !input.includes('implement')) {
    return 'discuss';
  }
  
  // Check for enterprise/advanced keywords
  if (input.includes('enterprise') ||
      input.includes('production ready') ||
      input.includes('scalable') ||
      input.includes('advanced') ||
      input.includes('full stack') ||
      input.includes('authentication') ||
      input.includes('database') ||
      input.includes('real-time') ||
      input.includes('api') ||
      input.includes('security') ||
      input.includes('payment') ||
      input.includes('dashboard') ||
      input.includes('analytics')) {
    return 'advanced';
  }
  
  // Check for complex implementation requests
  if (input.includes('create app') ||
      input.includes('build application') ||
      input.includes('management system') ||
      input.includes('platform')) {
    return 'system';
  }
  
  // Check for quick/simple tasks
  if (input.includes('quick') ||
      input.includes('simple') ||
      input.includes('small') ||
      input.includes('basic') ||
      input.length < 50) {
    return 'optimized';
  }
  
  // Default to advanced for comprehensive solutions
  return 'advanced';
}

// Export all the new functionality
export * from './template-validator';
export * from './utils';
export * from './new-prompt';
export * from './manager';
