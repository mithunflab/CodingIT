import { FragmentSchema } from './schema'
import { FragmentNode, PortMapping } from './workflow-engine'
import { TemplateId } from './templates'

export interface NodeTemplateConfig {
  inputs: PortMapping[]
  outputs: PortMapping[]
  defaultResources: {
    memory: string
    cpu: string
    timeout: number
  }
  retryPolicy: {
    maxRetries: number
    backoffStrategy: 'linear' | 'exponential'
    initialDelay: number
  }
}

export class FragmentNodeMapper {
  private templateConfigs: Record<TemplateId, NodeTemplateConfig> = {
    'code-interpreter-v1': {
      inputs: [
        {
          id: 'data_input',
          name: 'data',
          type: 'input',
          dataType: 'object',
          required: false,
          defaultValue: null
        }
      ],
      outputs: [
        {
          id: 'result_output',
          name: 'result',
          type: 'output',
          dataType: 'object',
          required: false
        }
      ],
      defaultResources: {
        memory: '512MB',
        cpu: '0.5',
        timeout: 120000 // 2 minutes
      },
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        initialDelay: 1000
      }
    },
    'nextjs-developer': {
      inputs: [
        {
          id: 'config_input',
          name: 'config',
          type: 'input',
          dataType: 'object',
          required: false,
          defaultValue: {}
        }
      ],
      outputs: [
        {
          id: 'url_output',
          name: 'url',
          type: 'output',
          dataType: 'string',
          required: false
        }
      ],
      defaultResources: {
        memory: '1GB',
        cpu: '1.0',
        timeout: 300000 // 5 minutes
      },
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'linear',
        initialDelay: 2000
      }
    },
    'vue-developer': {
      inputs: [
        {
          id: 'config_input',
          name: 'config',
          type: 'input',
          dataType: 'object',
          required: false,
          defaultValue: {}
        }
      ],
      outputs: [
        {
          id: 'url_output',
          name: 'url',
          type: 'output',
          dataType: 'string',
          required: false
        }
      ],
      defaultResources: {
        memory: '1GB',
        cpu: '1.0',
        timeout: 300000 // 5 minutes
      },
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'linear',
        initialDelay: 2000
      }
    },
    'streamlit-developer': {
      inputs: [
        {
          id: 'data_input',
          name: 'data',
          type: 'input',
          dataType: 'object',
          required: false,
          defaultValue: null
        }
      ],
      outputs: [
        {
          id: 'url_output',
          name: 'url',
          type: 'output',
          dataType: 'string',
          required: false
        }
      ],
      defaultResources: {
        memory: '512MB',
        cpu: '0.5',
        timeout: 180000 // 3 minutes
      },
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        initialDelay: 1500
      }
    },
    'gradio-developer': {
      inputs: [
        {
          id: 'config_input',
          name: 'config',
          type: 'input',
          dataType: 'object',
          required: false,
          defaultValue: {}
        }
      ],
      outputs: [
        {
          id: 'url_output',
          name: 'url',
          type: 'output',
          dataType: 'string',
          required: false
        }
      ],
      defaultResources: {
        memory: '512MB',
        cpu: '0.5',
        timeout: 180000 // 3 minutes
      },
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        initialDelay: 1500
      }
    },
    'codinit-engineer': {
      inputs: [
        {
          id: 'task_input',
          name: 'task',
          type: 'input',
          dataType: 'string',
          required: true
        }
      ],
      outputs: [
        {
          id: 'result_output',
          name: 'result',
          type: 'output',
          dataType: 'object',
          required: false
        }
      ],
      defaultResources: {
        memory: '2GB',
        cpu: '2.0',
        timeout: 600000 // 10 minutes
      },
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'linear',
        initialDelay: 5000
      }
    }
  }

  /**
   * Convert a fragment to a workflow node
   */
  fragmentToNode(fragment: FragmentSchema, position: { x: number; y: number }): FragmentNode {
    const templateId = fragment.template as TemplateId
    const templateConfig = this.templateConfigs[templateId]
    if (!templateConfig) {
      throw new Error(`Unsupported template: ${fragment.template}`)
    }

    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    return {
      id: nodeId,
      fragmentId: nodeId,
      position,
      inputs: templateConfig.inputs,
      outputs: templateConfig.outputs,
      config: {
        template: templateId,
        environment: {
          CODE: fragment.code,
          FILE_PATH: fragment.file_path,
          DEPENDENCIES: fragment.additional_dependencies.join(' '),
          INSTALL_COMMAND: fragment.install_dependencies_command,
          PORT: fragment.port?.toString() || '3000',
          TITLE: fragment.title,
          DESCRIPTION: fragment.description
        },
        resources: templateConfig.defaultResources,
        retryPolicy: templateConfig.retryPolicy
      },
      dependencies: []
    }
  }

  /**
   * Convert a workflow node back to a fragment for execution
   */
  nodeToFragment(node: FragmentNode): FragmentSchema {
    const env = node.config.environment

    return {
      commentary: `Executing workflow node: ${node.id}`,
      template: node.config.template,
      title: env.TITLE || `Node ${node.id}`,
      description: env.DESCRIPTION || `Workflow node execution`,
      additional_dependencies: env.DEPENDENCIES ? env.DEPENDENCIES.split(' ').filter(Boolean) : [],
      has_additional_dependencies: Boolean(env.DEPENDENCIES && env.DEPENDENCIES.trim()),
      install_dependencies_command: env.INSTALL_COMMAND || '',
      port: env.PORT ? parseInt(env.PORT, 10) : null,
      file_path: env.FILE_PATH || (this.isTemplateSupported(node.config.template) ? this.getDefaultFilePath(node.config.template) : 'main.py'),
      code: env.CODE || ''
    }
  }

  /**
   * Get template configuration for a given template ID
   */
  getTemplateConfig(templateId: TemplateId): NodeTemplateConfig {
    const config = this.templateConfigs[templateId]
    if (!config) {
      throw new Error(`No configuration found for template: ${templateId}`)
    }
    return config
  }

  /**
   * Get all supported template IDs
   */
  getSupportedTemplates(): TemplateId[] {
    return Object.keys(this.templateConfigs) as TemplateId[]
  }

  /**
   * Validate if a template is supported for workflows
   */
  isTemplateSupported(templateId: string): templateId is TemplateId {
    return templateId in this.templateConfigs
  }

  private getDefaultFilePath(template: TemplateId): string {
    const defaultPaths: Record<TemplateId, string> = {
      'code-interpreter-v1': 'main.py',
      'nextjs-developer': 'pages/index.tsx',
      'vue-developer': 'app.vue',
      'streamlit-developer': 'app.py',
      'gradio-developer': 'app.py',
      'codinit-engineer': 'main.py'
    }
    
    return defaultPaths[template] || 'main.py'
  }
}

export const fragmentNodeMapper = new FragmentNodeMapper()