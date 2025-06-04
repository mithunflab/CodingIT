// lib/project-analyzer.ts
export interface FileAnalysis {
  name: string
  path: string
  content: string
  type: string
  size: number
  language: string
  imports: string[]
  exports: string[]
  dependencies: string[]
  components?: string[]
  types?: string[]
  functions?: string[]
  patterns: string[]
}

export interface ProjectStructure {
  files: FileAnalysis[]
  dependencies: Set<string>
  frameworks: Set<string>
  patterns: Set<string>
  components: Set<string>
  types: Set<string>
  utilities: Set<string>
  architecture: {
    type: string
    description: string
  }
  entryPoints: string[]
  configFiles: string[]
}

export class ProjectAnalyzer {
  async analyzeProject(files: File[]): Promise<{
    structure: ProjectStructure
    analysis: string
    recommendations: string[]
  }> {
    const fileAnalyses: FileAnalysis[] = []
    const dependencies = new Set<string>()
    const frameworks = new Set<string>()
    const patterns = new Set<string>()
    const components = new Set<string>()
    const types = new Set<string>()
    const utilities = new Set<string>()

    // Analyze each file
    for (const file of files) {
      try {
        const content = await file.text()
        const analysis = this.analyzeFile(file.name, content)
        fileAnalyses.push(analysis)

        // Aggregate data
        analysis.dependencies.forEach(dep => dependencies.add(dep))
        analysis.imports.forEach(imp => {
          if (imp.startsWith('@') || (!imp.startsWith('.') && !imp.startsWith('/'))) {
            dependencies.add(imp)
          }
        })
        analysis.patterns.forEach(pattern => patterns.add(pattern))
        analysis.components?.forEach(comp => components.add(comp))
        analysis.types?.forEach(type => types.add(type))
        analysis.functions?.forEach(func => utilities.add(func))

        // Detect frameworks
        this.detectFrameworks(content, frameworks)
      } catch (error) {
        console.error(`Failed to analyze file ${file.name}:`, error)
      }
    }

    const structure: ProjectStructure = {
      files: fileAnalyses,
      dependencies,
      frameworks,
      patterns,
      components,
      types,
      utilities,
      architecture: this.detectArchitecture(fileAnalyses),
      entryPoints: this.findEntryPoints(fileAnalyses),
      configFiles: this.findConfigFiles(fileAnalyses)
    }

    const analysis = this.generateAnalysisReport(structure)
    const recommendations = this.generateRecommendations(structure)

    return { structure, analysis, recommendations }
  }

  private analyzeFile(fileName: string, content: string): FileAnalysis {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const language = this.detectLanguage(ext)
    
    return {
      name: fileName,
      path: fileName, // In upload context, name is the path
      content,
      type: this.getFileType(ext),
      size: content.length,
      language,
      imports: this.extractImports(content, language),
      exports: this.extractExports(content, language),
      dependencies: this.extractDependencies(content),
      components: this.extractComponents(content, language),
      types: this.extractTypes(content, language),
      functions: this.extractFunctions(content, language),
      patterns: this.detectCodePatterns(content, language)
    }
  }

  private detectLanguage(ext: string): string {
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql'
    }
    return languageMap[ext] || 'text'
  }

  private getFileType(ext: string): string {
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return 'code'
    if (['html', 'css', 'scss'].includes(ext)) return 'web'
    if (['json', 'yaml', 'yml'].includes(ext)) return 'config'
    if (['md', 'txt'].includes(ext)) return 'documentation'
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'asset'
    return 'other'
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = []
    
    if (language === 'typescript' || language === 'javascript') {
      // ES6 imports
      const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g
      let match
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1])
      }
      
      // CommonJS requires
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1])
      }
    } else if (language === 'python') {
      const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g
      let match
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2])
      }
    }
    
    return imports
  }

  private extractExports(content: string, language: string): string[] {
    const exports: string[] = []
    
    if (language === 'typescript' || language === 'javascript') {
      // Named exports
      const namedExportRegex = /export\s+(?:const|function|class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
      let match
      while ((match = namedExportRegex.exec(content)) !== null) {
        exports.push(match[1])
      }
      
      // Export declarations
      const exportRegex = /export\s*\{\s*([^}]+)\s*\}/g
      while ((match = exportRegex.exec(content)) !== null) {
        const exportList = match[1].split(',').map(exp => exp.trim().split(' as ')[0])
        exports.push(...exportList)
      }
      
      // Default export
      if (/export\s+default/.test(content)) {
        exports.push('default')
      }
    }
    
    return exports
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = []
    
    // Package.json dependencies
    if (content.includes('"dependencies"') || content.includes('"devDependencies"')) {
      try {
        const packageJson = JSON.parse(content)
        if (packageJson.dependencies) {
          dependencies.push(...Object.keys(packageJson.dependencies))
        }
        if (packageJson.devDependencies) {
          dependencies.push(...Object.keys(packageJson.devDependencies))
        }
      } catch (error) {
        // Not valid JSON
      }
    }
    
    return dependencies
  }

  private extractComponents(content: string, language: string): string[] {
    const components: string[] = []
    
    if (language === 'typescript' || language === 'javascript') {
      // React components (function components)
      const functionComponentRegex = /(?:export\s+(?:default\s+)?)?function\s+([A-Z][a-zA-Z0-9]*)/g
      let match
      while ((match = functionComponentRegex.exec(content)) !== null) {
        components.push(match[1])
      }
      
      // React components (const components)
      const constComponentRegex = /(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*[=:]/g
      while ((match = constComponentRegex.exec(content)) !== null) {
        components.push(match[1])
      }
      
      // Class components
      const classComponentRegex = /class\s+([A-Z][a-zA-Z0-9]*)\s+extends/g
      while ((match = classComponentRegex.exec(content)) !== null) {
        components.push(match[1])
      }
    }
    
    return components
  }

  private extractTypes(content: string, language: string): string[] {
    const types: string[] = []
    
    if (language === 'typescript') {
      // Type aliases
      const typeRegex = /(?:export\s+)?type\s+([A-Z][a-zA-Z0-9]*)/g
      let match
      while ((match = typeRegex.exec(content)) !== null) {
        types.push(match[1])
      }
      
      // Interfaces
      const interfaceRegex = /(?:export\s+)?interface\s+([A-Z][a-zA-Z0-9]*)/g
      while ((match = interfaceRegex.exec(content)) !== null) {
        types.push(match[1])
      }
      
      // Enums
      const enumRegex = /(?:export\s+)?enum\s+([A-Z][a-zA-Z0-9]*)/g
      while ((match = enumRegex.exec(content)) !== null) {
        types.push(match[1])
      }
    }
    
    return types
  }

  private extractFunctions(content: string, language: string): string[] {
    const functions: string[] = []
    
    if (language === 'typescript' || language === 'javascript') {
      // Function declarations
      const functionRegex = /(?:export\s+)?function\s+([a-z][a-zA-Z0-9]*)/g
      let match
      while ((match = functionRegex.exec(content)) !== null) {
        functions.push(match[1])
      }
      
      // Const functions
      const constFunctionRegex = /(?:export\s+)?const\s+([a-z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)\s*=>|\bfunction\b)/g
      while ((match = constFunctionRegex.exec(content)) !== null) {
        functions.push(match[1])
      }
    }
    
    return functions
  }

  private detectCodePatterns(content: string, language: string): string[] {
    const patterns: string[] = []
    
    if (language === 'typescript' || language === 'javascript') {
      if (content.includes('useState') || content.includes('useEffect')) {
        patterns.push('React Hooks')
      }
      if (content.includes('async') && content.includes('await')) {
        patterns.push('Async/Await')
      }
      if (content.includes('Promise')) {
        patterns.push('Promises')
      }
      if (content.includes('try') && content.includes('catch')) {
        patterns.push('Error Handling')
      }
      if (content.includes('fetch(') || content.includes('axios')) {
        patterns.push('HTTP Requests')
      }
      if (content.includes('useContext') || content.includes('createContext')) {
        patterns.push('Context API')
      }
      if (content.includes('useReducer')) {
        patterns.push('Reducer Pattern')
      }
      if (content.includes('localStorage') || content.includes('sessionStorage')) {
        patterns.push('Local Storage')
      }
    }
    
    return patterns
  }

  private detectFrameworks(content: string, frameworks: Set<string>): void {
    const contentLower = content.toLowerCase()
    
    if (content.includes('from "react"') || content.includes("from 'react'")) {
      frameworks.add('React')
    }
    if (content.includes('next/') || contentLower.includes('nextjs')) {
      frameworks.add('Next.js')
    }
    if (content.includes('vue') || contentLower.includes('nuxt')) {
      frameworks.add('Vue.js')
    }
    if (contentLower.includes('tailwind') || content.includes('@tailwindcss')) {
      frameworks.add('Tailwind CSS')
    }
    if (contentLower.includes('express') || content.includes('app.listen')) {
      frameworks.add('Express.js')
    }
    if (contentLower.includes('prisma') || content.includes('@prisma')) {
      frameworks.add('Prisma')
    }
    if (contentLower.includes('supabase') || content.includes('@supabase')) {
      frameworks.add('Supabase')
    }
    if (contentLower.includes('typescript') || content.includes('.ts')) {
      frameworks.add('TypeScript')
    }
  }

  private detectArchitecture(files: FileAnalysis[]): { type: string; description: string } {
    const hasComponents = files.some(f => f.components && f.components.length > 0)
    const hasApi = files.some(f => f.path.includes('api/') || f.name.includes('api'))
    const hasPages = files.some(f => f.path.includes('pages/') || f.path.includes('app/'))
    const hasDatabase = files.some(f => f.dependencies.some(dep => 
      dep.includes('prisma') || dep.includes('mongodb') || dep.includes('mysql')
    ))
    
    if (hasComponents && hasApi && hasPages) {
      return {
        type: 'Full-Stack Application',
        description: 'Complete web application with frontend components, API routes, and routing'
      }
    } else if (hasComponents && hasPages) {
      return {
        type: 'Frontend Application',
        description: 'Client-side application with component-based architecture'
      }
    } else if (hasApi) {
      return {
        type: 'API Service',
        description: 'Backend service with API endpoints'
      }
    } else if (hasDatabase) {
      return {
        type: 'Data Layer',
        description: 'Database schemas and data access patterns'
      }
    } else {
      return {
        type: 'Library/Utility',
        description: 'Utility functions or library code'
      }
    }
  }

  private findEntryPoints(files: FileAnalysis[]): string[] {
    const entryPoints: string[] = []
    
    files.forEach(file => {
      const fileName = file.name.toLowerCase()
      if (fileName.includes('index.') || fileName.includes('main.') || 
          fileName.includes('app.') || fileName === 'package.json') {
        entryPoints.push(file.path)
      }
    })
    
    return entryPoints
  }

  private findConfigFiles(files: FileAnalysis[]): string[] {
    const configFiles: string[] = []
    
    files.forEach(file => {
      const fileName = file.name.toLowerCase()
      if (fileName.includes('config') || fileName.includes('.json') || 
          fileName.includes('.env') || fileName.includes('tailwind') ||
          fileName.includes('next.config') || fileName.includes('package.json')) {
        configFiles.push(file.path)
      }
    })
    
    return configFiles
  }

  private generateAnalysisReport(structure: ProjectStructure): string {
    return `# Project Analysis Report

## 🏗️ Architecture
**Type**: ${structure.architecture.type}
**Description**: ${structure.architecture.description}

## 📊 Overview
- **Files**: ${structure.files.length}
- **Dependencies**: ${structure.dependencies.size}
- **Frameworks**: ${Array.from(structure.frameworks).join(', ') || 'None detected'}
- **Components**: ${structure.components.size}
- **Types**: ${structure.types.size}

## 🔧 Technologies Detected
${Array.from(structure.frameworks).map(fw => `- ${fw}`).join('\n') || '- No frameworks detected'}

## 📝 Code Patterns
${Array.from(structure.patterns).map(pattern => `- ${pattern}`).join('\n') || '- No patterns detected'}

## 🎯 Entry Points
${structure.entryPoints.map(ep => `- ${ep}`).join('\n') || '- No entry points identified'}

## ⚙️ Configuration Files
${structure.configFiles.map(cf => `- ${cf}`).join('\n') || '- No config files found'}

## 📦 Dependencies
${Array.from(structure.dependencies).sort().map(dep => `- ${dep}`).join('\n') || '- No dependencies found'}

## 🧩 Available Components
${Array.from(structure.components).sort().map(comp => `- ${comp}`).join('\n') || '- No components found'}

## 🏷️ Type Definitions
${Array.from(structure.types).sort().map(type => `- ${type}`).join('\n') || '- No types found'}

## 🛠️ Utility Functions
${Array.from(structure.utilities).sort().map(util => `- ${util}`).join('\n') || '- No utilities found'}
`
  }

  private generateRecommendations(structure: ProjectStructure): string[] {
    const recommendations: string[] = []
    
    if (structure.dependencies.size === 0) {
      recommendations.push("Consider adding package.json to define project dependencies")
    }
    
    if (structure.frameworks.has('React') && !structure.frameworks.has('TypeScript')) {
      recommendations.push("Consider migrating to TypeScript for better type safety")
    }
    
    if (structure.components.size > 10 && !Array.from(structure.patterns).includes('Error Handling')) {
      recommendations.push("Add comprehensive error handling patterns for production readiness")
    }
    
    if (structure.files.some(f => f.name.includes('test') || f.name.includes('spec'))) {
      recommendations.push("Existing test files detected - maintain test coverage for new features")
    } else {
      recommendations.push("Consider adding unit tests for better code reliability")
    }
    
    if (structure.frameworks.has('Next.js') && !structure.configFiles.some(f => f.includes('next.config'))) {
      recommendations.push("Add Next.js configuration file for optimization")
    }
    
    return recommendations
  }
}