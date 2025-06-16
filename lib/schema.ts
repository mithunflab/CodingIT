// File: lib/schema.ts

import { z } from 'zod'
import templatesData from './templates.json';

const templateIds = Object.keys(templatesData) as [keyof typeof templatesData, ...(keyof typeof templatesData)[]];

export const fragmentSchema = z.object({
  commentary: z.string().describe('Describe what you are doing and the steps you are taking for generating the fragment in great detail.'),
  
  // Enhanced template selection with strict validation
  template: z.enum(templateIds).describe(`
    CRITICAL: Use the EXACT template specified by the user. Available templates:
    - nextjs-developer: For React/Next.js applications
    - vue-developer: For Vue.js/Nuxt applications  
    - streamlit-developer: For Streamlit data applications
    - gradio-developer: For Gradio ML demos
    - code-interpreter-v1: For Python data analysis
    - codinit-engineer: For advanced AI workflows
    
    DO NOT default to nextjs-developer unless explicitly requested.
    RESPECT the user's template selection above all else.
  `),
  
  template_ready: z.boolean().describe('Detect if finished identifying the template.'),
  
  template_selection_reason: z.string().describe('Explain why this specific template was chosen based on user requirements.'),
  
  title: z.string().describe('Short title of the fragment. Max 5 words.'),
  description: z.string().describe('Short description of the fragment. Max 2 sentences.'),
  additional_dependencies: z.array(z.string()).optional().describe('Additional dependencies required by the fragment that are not included in the template.'),
  has_additional_dependencies: z.boolean().describe('Detect if additional dependencies that are not included in the template are required by the fragment.'),
  install_dependencies_command: z.string().optional().describe('Command to install additional dependencies required by the fragment.'),
  install_dependencies_ready: z.boolean().describe('Detect if finished identifying additional dependencies.'),
  port: z.number().nullable().describe('Port number used by the resulted fragment. Null when no ports are exposed.'),
  file_path: z.string().optional().describe('Relative path to the main file, including the file name.'),
  files: z.array(z.object({
    file_name: z.string().describe('Name of the file.'),
    file_path: z.string().describe('Relative path to the file, including the file name.'),
    file_content: z.string().describe('Complete content of the file. ALWAYS provide the FULL content, never truncated.'),
    file_finished: z.boolean().describe('Detect if finished generating this file.'),
  })).describe('Array of files that make up the fragment.'),
  code_finished: z.boolean().describe('Detect if finished generating all code files.'),
  error: z.string().optional().describe('Error message if the fragment generation encountered issues.'),
})

export type FragmentSchema = z.infer<typeof fragmentSchema>

export function validateTemplateSelection(userSelectedTemplate: string): { isValid: boolean; reason: string } {
  if (!templateIds.includes(userSelectedTemplate as any)) {
    return {
      isValid: false,
      reason: `Invalid template "${userSelectedTemplate}". Must be one of: ${templateIds.join(', ')}`
    };
  }
  return { isValid: true, reason: 'Valid template selection' };
}