import { BaseTemplateConfig } from '@/lib/templates';
import { generatePrompt, selectPromptMode, PromptConfig, PromptMode } from './index';

export class PromptManager {
  [x: string]: any;
  private defaultConfig: Partial<PromptConfig> = {
    cwd: '/home/project',
    mode: 'optimized'
  };

  constructor(defaultConfig?: Partial<PromptConfig>) {
    if (defaultConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...defaultConfig };
    }
  }

  public getPrompt(
    template: BaseTemplateConfig,
    userInput?: string,
    overrides?: Partial<PromptConfig>
  ): string {
    const mode = userInput ? selectPromptMode(userInput) : this.defaultConfig.mode!;
    
    const config: PromptConfig = {
      ...this.defaultConfig,
      ...overrides,
      mode,
      template
    };

    return generatePrompt(config);
  }

  public updateConfig(newConfig: Partial<PromptConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
  }

  public getConfig(): Partial<PromptConfig> {
    return { ...this.defaultConfig };
  }

  public selectBestPrompt(
    template: BaseTemplateConfig,
    userInput: string,
    context?: {
      projectFiles?: string[];
      userLevel?: 'beginner' | 'intermediate' | 'expert';
      previousErrors?: string[];
    }
  ): string {
    const mode = selectPromptMode(userInput, context);
    
    const config: PromptConfig = {
      ...this.defaultConfig,
      mode,
      template,
      context
    };

    return generatePrompt(config);
  }
}
