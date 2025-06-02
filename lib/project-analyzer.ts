export interface ProjectFile {
  name: string
  content: string
  type: string
  size: number
}

export interface ProjectAnalysis {
  structure: string[]
  technologies: string[]
  issues: string[]
  suggestions: string[]
  summary: string
}

export class ProjectAnalyzer {
  async analyzeProject(files: File[]): Promise<ProjectAnalysis> {
    const projectFiles: ProjectFile[] = []

    // Read all files
    for (const file of files) {
      if (file.size > 1024 * 1024) {
        // Skip files larger than 1MB
        continue
      }

      try {
        const content = await this.readFileContent(file)
        projectFiles.push({
          name: file.name,
          content,
          type: this.getFileType(file.name),
          size: file.size,
        })
      } catch (error) {
        console.warn(`Could not read file ${file.name}:`, error)
      }
    }

    return this.performAnalysis(projectFiles)
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase()

    const typeMap: Record<string, string> = {
      js: "javascript",
      jsx: "react",
      ts: "typescript",
      tsx: "react-typescript",
      html: "html",
      css: "css",
      scss: "sass",
      json: "json",
      md: "markdown",
      py: "python",
      java: "java",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      cpp: "cpp",
      c: "c",
    }

    return typeMap[extension || ""] || "unknown"
  }

  private performAnalysis(files: ProjectFile[]): ProjectAnalysis {
    const structure = this.analyzeStructure(files)
    const technologies = this.detectTechnologies(files)
    const issues = this.findIssues(files)
    const suggestions = this.generateSuggestions(files, technologies)
    const summary = this.generateSummary(files, technologies, issues)

    return {
      structure,
      technologies,
      issues,
      suggestions,
      summary,
    }
  }

  private analyzeStructure(files: ProjectFile[]): string[] {
    const structure = []
    const directories = new Set<string>()

    files.forEach((file) => {
      const parts = file.name.split("/")
      if (parts.length > 1) {
        directories.add(parts[0])
      }
    })

    structure.push(`📁 Project contains ${files.length} files`)
    structure.push(`📂 Main directories: ${Array.from(directories).join(", ")}`)

    const fileTypes = files.reduce(
      (acc, file) => {
        acc[file.type] = (acc[file.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    structure.push(
      `📄 File types: ${Object.entries(fileTypes)
        .map(([type, count]) => `${type} (${count})`)
        .join(", ")}`,
    )

    return structure
  }

  private detectTechnologies(files: ProjectFile[]): string[] {
    const technologies = new Set<string>()

    files.forEach((file) => {
      // Check file extensions
      if (file.name.endsWith(".jsx") || file.name.endsWith(".tsx")) {
        technologies.add("React")
      }
      if (file.name.endsWith(".ts") || file.name.endsWith(".tsx")) {
        technologies.add("TypeScript")
      }
      if (file.name.endsWith(".vue")) {
        technologies.add("Vue.js")
      }
      if (file.name.endsWith(".py")) {
        technologies.add("Python")
      }

      // Check file content for frameworks/libraries
      const content = file.content.toLowerCase()

      if (content.includes("next") || content.includes("next.js")) {
        technologies.add("Next.js")
      }
      if (content.includes("express")) {
        technologies.add("Express.js")
      }
      if (content.includes("tailwind")) {
        technologies.add("Tailwind CSS")
      }
      if (content.includes("styled-components")) {
        technologies.add("Styled Components")
      }
      if (content.includes("prisma")) {
        technologies.add("Prisma")
      }
      if (content.includes("supabase")) {
        technologies.add("Supabase")
      }
      if (content.includes("firebase")) {
        technologies.add("Firebase")
      }
    })

    return Array.from(technologies)
  }

  private findIssues(files: ProjectFile[]): string[] {
    const issues: string[] = []

    files.forEach((file) => {
      const content = file.content

      // Check for common issues
      if (content.includes("console.log") && file.type.includes("javascript")) {
        issues.push(`🐛 Debug console.log statements found in ${file.name}`)
      }

      if (content.includes("TODO") || content.includes("FIXME")) {
        issues.push(`⚠️ TODO/FIXME comments found in ${file.name}`)
      }

      if (file.type.includes("javascript") && !content.includes("use strict") && !file.name.includes(".ts")) {
        issues.push(`📝 Consider using strict mode in ${file.name}`)
      }

      // Check for missing error handling
      if (content.includes("fetch(") && !content.includes("catch")) {
        issues.push(`🚨 Missing error handling for fetch in ${file.name}`)
      }
    })

    return issues
  }

  private generateSuggestions(files: ProjectFile[], technologies: string[]): string[] {
    const suggestions = []

    // Technology-specific suggestions
    if (technologies.includes("React") && !technologies.includes("TypeScript")) {
      suggestions.push("💡 Consider migrating to TypeScript for better type safety")
    }

    if (technologies.includes("JavaScript") && !technologies.includes("ESLint")) {
      suggestions.push("💡 Add ESLint for code quality and consistency")
    }

    if (!technologies.includes("Tailwind CSS") && files.some((f) => f.name.endsWith(".css"))) {
      suggestions.push("💡 Consider using Tailwind CSS for utility-first styling")
    }

    // General suggestions
    const hasTests = files.some((f) => f.name.includes("test") || f.name.includes("spec"))
    if (!hasTests) {
      suggestions.push("🧪 Add unit tests to improve code reliability")
    }

    const hasReadme = files.some((f) => f.name.toLowerCase().includes("readme"))
    if (!hasReadme) {
      suggestions.push("📚 Add a README.md file with project documentation")
    }

    return suggestions
  }

  private generateSummary(files: ProjectFile[], technologies: string[], issues: string[]): string {
    return `This project contains ${files.length} files using ${technologies.join(", ")}. ${issues.length > 0 ? `Found ${issues.length} potential issues to address.` : "No major issues detected."} The codebase appears to be a ${this.guessProjectType(technologies)} project.`
  }

  private guessProjectType(technologies: string[]): string {
    if (technologies.includes("React") || technologies.includes("Next.js")) {
      return "React/Next.js web application"
    }
    if (technologies.includes("Vue.js")) {
      return "Vue.js web application"
    }
    if (technologies.includes("Express.js")) {
      return "Node.js backend application"
    }
    if (technologies.includes("Python")) {
      return "Python application"
    }
    return "web development"
  }
}
