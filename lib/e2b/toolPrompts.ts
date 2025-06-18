import type { TemplatesDataObject, TemplateId } from "@/lib/templates"
import type { ProjectStructure } from "@/lib/project-analyzer"

export interface E2BToolConfig {
  name: string
  description: string
  parameters: Record<string, any>
  returns: Record<string, any>
}

export interface ToolPromptContext {
  userInput: string
  template: TemplatesDataObject
  projectContext?: ProjectStructure
  sessionId?: string
  userID?: string
  teamID?: string
}

export interface ToolPromptResponse {
  prompt: string
  toolConfig: E2BToolConfig
  sandboxConfig: {
    template: TemplateId
    timeout: number
    constraints: Record<string, any>
  }
}

export class E2BToolPromptGenerator {
  
  static generateNewTaskPrompt(context: ToolPromptContext): ToolPromptResponse {
    const { userInput, template, projectContext } = context

    const prompt = `# CodinIT.dev E2B Task Execution

## System Context
You are an expert software engineer operating within the CodinIT.dev E2B sandbox environment. You must deliver production-ready, fully functional code that meets enterprise standards.

## E2B Execution Constraints
- **Timeout**: 10-minute maximum execution window
- **File Operations**: Full write permissions only (no diffs/patches)
- **Performance Target**: Sub-10 second response times
- **Package Managers**: bun (preferred), npm, pip, poetry
- **Security**: Validate all inputs, implement proper error handling
- **Compatibility**: Maintain E2B WebContainer compatibility

## Task Requirements
\`\`\`
${userInput}
\`\`\`

## Project Context Analysis
${projectContext ? this.formatProjectContext(projectContext) : 'No existing project context - create from template standards'}

## Template Configuration
${this.formatTemplateInstructions(template)}

## Critical Success Criteria
1. **Production-Ready Code**: No placeholders, demos, or incomplete features
2. **Complete Implementation**: All files must be fully written with complete content
3. **Error Handling**: Comprehensive validation and error management
4. **Performance Optimized**: Sub-10 second execution targets
5. **Security Compliant**: Input validation, secure patterns, no hardcoded secrets
6. **Framework Adherence**: Follow detected stack patterns and conventions
7. **E2B Compatibility**: Ensure all code works within sandbox constraints

## Output Format
Provide complete, executable code with:
- Full file contents (no partial implementations)
- Proper dependency management
- Production-grade error handling
- Performance optimization
- Security best practices
- Comprehensive documentation

## Execution Plan
1. Analyze requirements and detect technology stack
2. Generate complete, production-ready implementation
3. Ensure E2B sandbox compatibility
4. Validate security and performance requirements
5. Output complete files with full content

Begin implementation immediately. Deliver enterprise-grade results.`

    return {
      prompt,
      toolConfig: {
        name: "new_task_execution",
        description: "Execute complex development tasks in E2B sandbox with production-grade results",
        parameters: {
          type: "object",
          properties: {
            task_description: { type: "string" },
            template_id: { type: "string" },
            project_context: { type: "object" },
            performance_requirements: { type: "object" },
            security_requirements: { type: "array" }
          },
          required: ["task_description", "template_id"]
        },
        returns: {
          type: "object",
          properties: {
            files: { type: "array", items: { type: "object" } },
            execution_result: { type: "object" },
            performance_metrics: { type: "object" },
            security_validation: { type: "object" }
          }
        }
      },
      sandboxConfig: {
        template: this.selectOptimalTemplate(userInput, template),
        timeout: 600000, // 10 minutes
        constraints: {
          max_file_size: "50MB",
          allowed_operations: ["read", "write", "execute"],
          security_level: "strict"
        }
      }
    }
  }

  /**
   * Generate context condensation prompt for large conversations
   */
  static generateCondensePrompt(context: ToolPromptContext): ToolPromptResponse {
    const { userInput } = context

    const prompt = `# CodinIT.dev Context Condensation

## Objective
Intelligently condense and optimize conversation context while preserving critical development information and maintaining E2B sandbox execution continuity.

## Input Context
\`\`\`
${userInput}
\`\`\`

## Condensation Rules
1. **Preserve Critical Information**: Keep all technical specifications, requirements, and implementation details
2. **Maintain Code Integrity**: Retain essential code snippets, file structures, and configuration details
3. **Optimize for E2B**: Focus on information relevant to sandbox execution and project development
4. **Security Retention**: Keep security requirements, authentication patterns, and validation rules
5. **Performance Context**: Maintain performance targets and optimization requirements

## Output Format
Provide condensed context in structured format:

### Technical Requirements
[Consolidated technical specifications]

### Project Structure
[Essential file structure and component relationships]

### Development Context
[Key development decisions and patterns]

### E2B Execution Context
[Sandbox-specific requirements and constraints]

### Next Actions
[Prioritized development tasks]

## Execution Target
Reduce context size by 70% while retaining 100% of critical development information.

Execute condensation with production-grade precision.`

    return {
      prompt,
      toolConfig: {
        name: "context_condensation",
        description: "Intelligently condense conversation context for optimal E2B execution",
        parameters: {
          type: "object",
          properties: {
            original_context: { type: "string" },
            compression_ratio: { type: "number", minimum: 0.1, maximum: 0.9 },
            preserve_categories: { type: "array", items: { type: "string" } }
          },
          required: ["original_context"]
        },
        returns: {
          type: "object",
          properties: {
            condensed_context: { type: "string" },
            compression_achieved: { type: "number" },
            preserved_elements: { type: "array" },
            execution_continuity: { type: "boolean" }
          }
        }
      },
      sandboxConfig: {
        template: "code-interpreter-v1",
        timeout: 60000, // 1 minute
        constraints: {
          memory_limit: "1GB",
          operation_type: "text_processing"
        }
      }
    }
  }

  /**
   * Generate rule creation prompt for project-specific guidelines
   */
  static generateNewRulePrompt(context: ToolPromptContext): ToolPromptResponse {
    const { userInput, projectContext } = context

    const prompt = `# CodinIT.dev Rule Generation System

## Context
Generate production-grade development rules and guidelines that enhance project quality, maintain consistency, and ensure E2B sandbox compatibility.

## Rule Creation Request
\`\`\`
${userInput}
\`\`\`

## Project Analysis
${projectContext ? this.formatProjectContext(projectContext) : 'No existing project - create universal rules'}

## Rule Generation Framework
1. **Technical Consistency**: Coding standards, patterns, and architectural guidelines
2. **Security Requirements**: Authentication, authorization, input validation rules
3. **Performance Standards**: Optimization targets, resource usage limits
4. **E2B Compatibility**: Sandbox execution constraints and requirements
5. **Quality Assurance**: Testing standards, documentation requirements
6. **Deployment Standards**: Production deployment and monitoring rules

## Output Format
Generate rules in structured format:

### Rule Category: [Category Name]
**Rule ID**: [Unique identifier]
**Description**: [Clear rule description]
**Implementation**: [Specific implementation guidelines]
**Validation**: [How to verify compliance]
**E2B Impact**: [Sandbox execution considerations]
**Examples**: [Code examples demonstrating compliance]

## Rule Validation
- Ensure rules are enforceable and measurable
- Provide clear implementation guidance
- Include E2B sandbox compatibility checks
- Define violation consequences and remediation

Generate comprehensive, actionable rules that enhance development quality.`

    return {
      prompt,
      toolConfig: {
        name: "rule_generation",
        description: "Generate project-specific development rules and guidelines",
        parameters: {
          type: "object",
          properties: {
            rule_category: { type: "string" },
            scope: { type: "string", enum: ["project", "team", "organization"] },
            enforcement_level: { type: "string", enum: ["warning", "error", "blocking"] },
            project_context: { type: "object" }
          },
          required: ["rule_category", "scope"]
        },
        returns: {
          type: "object",
          properties: {
            rules: { type: "array", items: { type: "object" } },
            validation_criteria: { type: "object" },
            implementation_guide: { type: "string" },
            e2b_compatibility: { type: "boolean" }
          }
        }
      },
      sandboxConfig: {
        template: "codinit-engineer",
        timeout: 120000, // 2 minutes
        constraints: {
          operation_type: "rule_generation",
          output_format: "structured"
        }
      }
    }
  }

  /**
   * Generate bug report and resolution prompt
   */
  static generateBugReportPrompt(context: ToolPromptContext): ToolPromptResponse {
    const { userInput, projectContext } = context

    const prompt = `# CodinIT.dev Bug Analysis and Resolution System

## Bug Report Analysis
Analyze and provide production-grade solutions for reported issues with comprehensive debugging and resolution strategies.

## Bug Description
\`\`\`
${userInput}
\`\`\`

## Project Context
${projectContext ? this.formatProjectContext(projectContext) : 'No project context - analyze in isolation'}

## Analysis Framework
1. **Issue Classification**: Categorize bug type (UI, API, logic, performance, security)
2. **Root Cause Analysis**: Identify underlying causes and contributing factors
3. **Impact Assessment**: Evaluate severity, scope, and user impact
4. **E2B Compatibility**: Check for sandbox-specific issues
5. **Resolution Strategy**: Develop comprehensive fix approach
6. **Prevention Measures**: Implement safeguards against recurrence

## Diagnostic Process
### Initial Assessment
- Bug severity level (Critical/High/Medium/Low)
- Affected components and dependencies
- Reproduction steps and conditions
- Error patterns and symptoms

### Technical Analysis
- Code review of affected areas
- Dependency conflict analysis
- Performance impact evaluation
- Security vulnerability assessment

### E2B Sandbox Considerations
- Execution environment compatibility
- Timeout and resource constraints
- File system and permission issues
- Inter-service communication problems

## Resolution Output
Provide complete fix implementation:
- **Root Cause**: Detailed explanation of the underlying issue
- **Fix Implementation**: Complete code changes with full file content
- **Testing Strategy**: Comprehensive test cases to verify resolution
- **Prevention Measures**: Code improvements to prevent recurrence
- **Monitoring**: Metrics and alerts to detect similar issues

## Quality Assurance
- Ensure fix maintains E2B compatibility
- Validate performance impact
- Verify security implications
- Test edge cases and error conditions

Deliver production-ready bug resolution with enterprise-grade quality.`

    return {
      prompt,
      toolConfig: {
        name: "bug_analysis_resolution",
        description: "Comprehensive bug analysis and resolution for E2B applications",
        parameters: {
          type: "object",
          properties: {
            bug_description: { type: "string" },
            severity_level: { type: "string", enum: ["critical", "high", "medium", "low"] },
            affected_components: { type: "array", items: { type: "string" } },
            reproduction_steps: { type: "array", items: { type: "string" } },
            project_context: { type: "object" }
          },
          required: ["bug_description", "severity_level"]
        },
        returns: {
          type: "object",
          properties: {
            root_cause_analysis: { type: "object" },
            resolution_plan: { type: "object" },
            code_changes: { type: "array", items: { type: "object" } },
            test_cases: { type: "array", items: { type: "object" } },
            prevention_measures: { type: "array", items: { type: "string" } }
          }
        }
      },
      sandboxConfig: {
        template: "codinit-engineer",
        timeout: 300000, // 5 minutes
        constraints: {
          operation_type: "debugging",
          analysis_depth: "comprehensive"
        }
      }
    }
  }

  /**
   * Generate documentation creation prompt
   */
  static generateDocumentationPrompt(context: ToolPromptContext): ToolPromptResponse {
    const { userInput, projectContext } = context

    const prompt = `# CodinIT.dev Documentation Generation System

## Documentation Request
Generate comprehensive, production-grade documentation that enhances project maintainability and supports E2B sandbox development workflows.

## Documentation Scope
\`\`\`
${userInput}
\`\`\`

## Project Analysis
${projectContext ? this.formatProjectContext(projectContext) : 'No existing project - create template documentation'}

## Documentation Standards
1. **Technical Accuracy**: Precise, up-to-date technical information
2. **Clarity**: Clear explanations accessible to different skill levels
3. **Completeness**: Comprehensive coverage of all relevant aspects
4. **Actionability**: Specific, executable instructions and examples
5. **E2B Integration**: Sandbox-specific guidance and constraints
6. **Maintainability**: Structured for easy updates and version control

## Documentation Types
### API Documentation
- Endpoint specifications with examples
- Authentication and authorization guides
- Error handling and status codes
- Rate limiting and usage guidelines

### Development Guide
- Setup and installation instructions
- Development workflow and best practices
- E2B sandbox configuration and usage
- Testing strategies and frameworks

### Architecture Documentation
- System design and component relationships
- Data flow and integration patterns
- Security architecture and considerations
- Performance optimization strategies

### User Guide
- Feature explanations and usage instructions
- Troubleshooting and FAQ sections
- Configuration options and customization
- Migration and upgrade procedures

## Output Format
Generate documentation with:
- Clear hierarchical structure
- Code examples and snippets
- Visual diagrams where appropriate
- Cross-references and links
- Version information and update history

## Quality Requirements
- Technical accuracy verified
- Examples tested and functional
- Consistent formatting and style
- Accessible language and structure
- Regular update procedures defined

Create enterprise-grade documentation that accelerates development and reduces support overhead.`

    return {
      prompt,
      toolConfig: {
        name: "documentation_generation",
        description: "Generate comprehensive technical documentation for E2B projects",
        parameters: {
          type: "object",
          properties: {
            documentation_type: { 
              type: "string", 
              enum: ["api", "development", "architecture", "user", "deployment"] 
            },
            scope: { type: "string" },
            target_audience: { 
              type: "string", 
              enum: ["developer", "user", "admin", "mixed"] 
            },
            project_context: { type: "object" },
            include_examples: { type: "boolean", default: true }
          },
          required: ["documentation_type", "scope"]
        },
        returns: {
          type: "object",
          properties: {
            documentation: { type: "string" },
            structure: { type: "object" },
            examples: { type: "array", items: { type: "object" } },
            maintenance_plan: { type: "object" }
          }
        }
      },
      sandboxConfig: {
        template: "codinit-engineer",
        timeout: 180000, // 3 minutes
        constraints: {
          operation_type: "documentation",
          output_format: "markdown"
        }
      }
    }
  }

  /**
   * Format project context for prompt inclusion
   */
  private static formatProjectContext(context: ProjectStructure): string {
    return `
### Project Structure
Files: ${context.files?.length || 0}
Dependencies: ${Array.from(context.dependencies).join(', ') || 'None identified'}
Frameworks: ${Array.from(context.frameworks).join(', ') || 'None identified'}
Patterns: ${Array.from(context.patterns).join(', ') || 'None identified'}

### Existing Components
${Array.from(context.components).length ? Array.from(context.components).join(', ') : 'None identified'}

### Architecture
Type: ${context.architecture?.type || 'Unknown'}
Description: ${context.architecture?.description || 'No description available'}
`
  }

  /**
   * Format template instructions for prompt inclusion
   */
  private static formatTemplateInstructions(template: TemplatesDataObject): string {
    const templateEntries = Object.entries(template)
    return templateEntries.map(([id, config]) => {
      const instructions = 'instructions' in config ? config.instructions : 'No specific instructions'
      return `### ${id}
${instructions}`
    }).join('\n\n')
  }

  /**
   * Select optimal template based on user input and available templates
   */
  private static selectOptimalTemplate(userInput: string, template: TemplatesDataObject): TemplateId {
    const input = userInput.toLowerCase()
    
    // Template selection logic based on keywords
    if (input.includes('react') || input.includes('nextjs') || input.includes('next.js')) {
      return 'nextjs-developer'
    }
    if (input.includes('vue') || input.includes('nuxt')) {
      return 'vue-developer'
    }
    if (input.includes('streamlit') || input.includes('data app')) {
      return 'streamlit-developer'
    }
    if (input.includes('gradio') || input.includes('ml demo')) {
      return 'gradio-developer'
    }
    if (input.includes('python') || input.includes('data analysis') || input.includes('script')) {
      return 'code-interpreter-v1'
    }
    
    // Default to universal template
    return 'codinit-engineer'
  }
}

export type E2BToolType = 'new_task' | 'condense' | 'new_rule' | 'report_bug' | 'generate_docs'

/**
 * Tool Registry for E2B Integration
 */
export const E2B_TOOL_REGISTRY = {
  new_task: {
    name: "new_task_execution",
    generator: E2BToolPromptGenerator.generateNewTaskPrompt,
    description: "Execute complex development tasks with production-grade results"
  },
  condense: {
    name: "context_condensation", 
    generator: E2BToolPromptGenerator.generateCondensePrompt,
    description: "Intelligently condense conversation context for optimal execution"
  },
  new_rule: {
    name: "rule_generation",
    generator: E2BToolPromptGenerator.generateNewRulePrompt,
    description: "Generate project-specific development rules and guidelines"
  },
  report_bug: {
    name: "bug_analysis_resolution",
    generator: E2BToolPromptGenerator.generateBugReportPrompt,
    description: "Comprehensive bug analysis and resolution system"
  },
  generate_docs: {
    name: "documentation_generation",
    generator: E2BToolPromptGenerator.generateDocumentationPrompt,
    description: "Generate comprehensive technical documentation"
  }
} as const