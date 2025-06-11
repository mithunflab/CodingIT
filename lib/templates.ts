import templatesData from './templates.json';

export type TemplatesDataObject = typeof templatesData;

// Allow 'codinit-engineer' as a possible TemplateId even if not always in templates.json
export type TemplateId = keyof TemplatesDataObject | 'codinit-engineer';

export type BaseTemplateConfig = TemplatesDataObject[keyof TemplatesDataObject];

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
    // After the type guard, t is known to be an object.
    // Defensively access instructions and port, accounting for potential nesting in t.files (for gradio-developer)
    const t_any = t as any;
    const currentInstructions = (('instructions' in t_any && typeof t_any.instructions === 'string') ? t_any.instructions :
                                (t_any.files && typeof t_any.files === 'object' && 'instructions' in t_any.files && typeof t_any.files.instructions === 'string') ? t_any.files.instructions : "");

    const currentPortRaw = (('port' in t_any && (typeof t_any.port === 'number' || t_any.port === null)) ? t_any.port :
                           (t_any.files && typeof t_any.files === 'object' && 'port' in t_any.files && (typeof t_any.files.port === 'number' || t_any.files.port === null)) ? t_any.files.port : null);
    const portDisplay = (currentPortRaw !== undefined && currentPortRaw !== null) ? currentPortRaw : 'none';

    const mainFile = (t_any.files && typeof t_any.files === 'object' && Object.keys(t_any.files).length > 0) ? Object.keys(t_any.files)[0] : 'none';
    
    return `${index + 1}. ${id}: "${currentInstructions}". File: ${mainFile}. Dependencies installed: ${t_any.lib ? t_any.lib.join(', ') : 'none'}. Port: ${portDisplay}.`;
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

    const bc_any = baseConfig as any;

    const actualInstructions = (('instructions' in bc_any && typeof bc_any.instructions === 'string') ? bc_any.instructions :
                                (bc_any.files && typeof bc_any.files === 'object' && 'instructions' in bc_any.files && typeof bc_any.files.instructions === 'string') ? bc_any.files.instructions : "");

    const actualPort = (('port' in bc_any && (typeof bc_any.port === 'number' || bc_any.port === null)) ? bc_any.port :
                        (bc_any.files && typeof bc_any.files === 'object' && 'port' in bc_any.files && (typeof bc_any.files.port === 'number' || bc_any.files.port === null)) ? bc_any.files.port : null);

    const mainFileFromBC = (bc_any.files && typeof bc_any.files === 'object' && Object.keys(bc_any.files).length > 0) ? Object.keys(bc_any.files)[0] : null;

    return {
      id: templateId,
      name: bc_any.name || 'Unnamed Template',
      lib: bc_any.lib || [],
      file: mainFileFromBC,
      instructions: actualInstructions,
      port: actualPort,
      category,
      complexity,
      description: actualInstructions || bc_any.name || 'No description available.',
      technologies: bc_any.lib || [],
      aiCapabilities: templateId === 'codinit-engineer'
        ? [{ type: 'tool-use', enabled: true, description: 'Can use various development tools.' }]
        : [],
      features: [],
      architecture,
    };
  });
}
