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
  return `${Object.entries(templates).map(([id, t], index) => {
    // Type guard to ensure t is an object and not null.
    // This addresses errors where t might be inferred as a number or other non-object type.
    if (typeof t !== 'object' || t === null) {
      throw new Error(
        `Invalid template data for ID "${id}" in templatesToPrompt. Expected an object, but received ${typeof t}.`
      );
    }
    // After the type guard, t is known to be an object, so its properties can be safely accessed.
    const portDisplay = ('port' in t && t.port !== undefined && t.port !== null) ? t.port : 'none';
    return `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${portDisplay}.`;
  }).join('\n')}`
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
    let architecture = { pattern: 'standalone', description: '' };

    switch (templateId) {
      case 'nextjs-developer':
        category = 'web';
        complexity = 'intermediate';
        architecture = { pattern: 'full-stack-framework', description: '' };
        break;
      case 'vue-developer':
        category = 'web';
        complexity = 'intermediate';
        architecture = { pattern: 'component-based', description: '' };
        break;
      case 'streamlit-developer':
        category = 'data-visualization';
        complexity = 'beginner';
        architecture = { pattern: 'script-based', description: '' };
        break;
      case 'gradio-developer':
        category = 'ml-demo';
        complexity = 'beginner';
        architecture = { pattern: 'script-based', description: '' };
        break;
      case 'code-interpreter-v1':
        category = 'data-analysis';
        complexity = 'intermediate';
        architecture = { pattern: 'script-based', description: '' };
        break;
      case 'codinit-engineer':
        category = 'development-tool';
        complexity = 'advanced';
        architecture = { pattern: 'agentic', description: 'AI agent with tool use capabilities.' };
        break;
    }

    // Type guard to ensure baseConfig is an object and not null.
    // This addresses errors where baseConfig might be inferred as a number or other non-object type
    // due to the structure of templates.json or TypeScript's type inference.
    if (typeof baseConfig !== 'object' || baseConfig === null) {
      // If baseConfig is not a valid object, it cannot have the expected properties.
      // Throwing an error is appropriate as this indicates invalid input data.
      throw new Error(
        `Invalid template configuration for ID "${templateId}". Expected an object, but received ${typeof baseConfig}.`
      );
    }

    return {
      id: templateId,
      name: baseConfig.name,
      lib: baseConfig.lib,
      file: baseConfig.file,
      instructions: baseConfig.instructions,
      // After the type guard, baseConfig is known to be an object.
      // The 'in' operator is safe, and baseConfig.port can be accessed directly.
      // The type of baseConfig.port (if it exists and is not undefined) is expected to be number | null.
      port: ('port' in baseConfig && baseConfig.port !== undefined) ? baseConfig.port : null,
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
