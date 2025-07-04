import { TemplateConfig, Templates } from '@/lib/templates';
import { discussPrompt } from './discuss-prompt';
import { getFineTunedPrompt } from './new-prompt';
import optimizedPrompt from './optimized';
import { getSystemPrompt } from './prompts';

export type PromptMode = 'discuss' | 'finetuned' | 'optimized' | 'system';

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
      });
    
    case 'system':
      return getSystemPrompt(cwd, supabase, designScheme, template);
    
    default:
      // Default to optimized mode for production usage
      return optimizedPrompt({
        cwd,
        allowedHtmlElements: [
          'a', 'b', 'i', 'strong', 'em', 'code', 'pre', 'blockquote', 
          'ul', 'ol', 'li', 'br', 'hr', 'img'
        ],
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
  
  // Check for complex implementation requests
  if (input.includes('create app') ||
      input.includes('build application') ||
      input.includes('full stack') ||
      input.includes('production ready')) {
    return 'system';
  }
  
  // Check for quick/simple tasks
  if (input.includes('quick') ||
      input.includes('simple') ||
      input.includes('small') ||
      input.length < 50) {
    return 'optimized';
  }
  
  // Default to finetuned for balanced approach
  return 'finetuned';
}

// Export all the new functionality
export * from './template-validator';
export * from './utils';
export * from './new-prompt';
export * from './manager';
