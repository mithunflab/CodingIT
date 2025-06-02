import templatesData from './templates.json';

export type TemplatesDataObject = typeof templatesData;

export type TemplateId = keyof TemplatesDataObject;

export type BaseTemplateConfig = TemplatesDataObject[TemplateId];

export interface EnhancedTemplate {
  id: TemplateId;
  name: string;
  lib: string[];
  file: string | null;
  instructions: string;
  port: number | null;
  category: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  technologies: string[];
  aiCapabilities: {
    type: string;
    enabled: boolean;
    description?: string;
  }[];
  features: string[];
  architecture: {
    pattern: string;
    description?: string;
  };
}

export default templatesData;

export function templatesToPrompt(templates: TemplatesDataObject): string {
  return `${Object.entries(templates).map(([id, t], index) => `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`).join('\n')}`
}

// Note on data transformation:
// To obtain an array of EnhancedTemplate (i.e., EnhancedTemplate[]),
// the raw data from templatesData (or templates.json) needs to be transformed.
// This transformation process must add or map the necessary fields (id, category,
// complexity, description, technologies, aiCapabilities, features, architecture)
// to each template object. This typically happens in the part of your application
// logic that prepares data for the UI components.
//
// Example of how such a transformation might look (conceptual):
export function convertToEnhancedTemplates(data: TemplatesDataObject): EnhancedTemplate[] {
  return Object.entries(data).map(([id, baseConfig]) => {
    const templateId = id as TemplateId;
    let category = 'general';
    let complexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    let architecture = { pattern: 'standalone', description: 'A standalone application or script.' };

    switch (templateId) {
      case 'nextjs-developer':
        category = 'web';
        complexity = 'intermediate';
        architecture = { pattern: 'full-stack-framework', description: 'Next.js application structure.' };
        break;
      case 'vue-developer':
        category = 'web';
        complexity = 'intermediate';
        architecture = { pattern: 'component-based', description: 'Vue.js application structure.' };
        break;
      case 'streamlit-developer':
        category = 'data-visualization';
        complexity = 'beginner';
        architecture = { pattern: 'script-based', description: 'Streamlit application.' };
        break;
      case 'gradio-developer':
        category = 'ml-demo';
        complexity = 'beginner';
        architecture = { pattern: 'script-based', description: 'Gradio application for ML demos.' };
        break;
      case 'code-interpreter-v1':
        category = 'data-analysis';
        complexity = 'intermediate';
        architecture = { pattern: 'script-based', description: 'Python script for data analysis.' };
        break;
      case 'codinit-engineer':
        category = 'development-tool';
        complexity = 'advanced';
        architecture = { pattern: 'agentic', description: 'AI agent with tool use capabilities.' };
        break;
    }

    return {
      id: templateId,
      name: baseConfig.name,
      lib: baseConfig.lib,
      file: baseConfig.file,
      instructions: baseConfig.instructions,
      port: baseConfig.port,
      category,
      complexity,
      description: baseConfig.instructions || baseConfig.name || 'No description available.',
      technologies: baseConfig.lib || [],
      aiCapabilities: templateId === 'codinit-engineer'
        ? [{ type: 'tool-use', enabled: true, description: 'Can use various development tools.' }]
        : [],
      features: [],
      architecture,
    };
  });
}