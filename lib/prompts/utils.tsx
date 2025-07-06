import Templates from '@/lib/templates'

export function analyzeProjectContext(files: string[]): {
  framework?: string
  language?: string
  complexity: 'simple' | 'medium' | 'complex'
  hasDatabase: boolean
  hasAPI: boolean
} {
  const fileExtensions = files.map(f => f.split('.').pop()?.toLowerCase()).filter(Boolean)
  const frameworks = []
  
  if (files.includes('package.json')) {
    frameworks.push('node')
  }
  if (files.some(f => f.includes('react') || f.includes('jsx') || f.includes('tsx'))) {
    frameworks.push('react-developer')
  }
  if (files.some(f => f.includes('vue'))) {
    frameworks.push('vue-developer')
  }
  if (files.some(f => f.includes('next'))) {
    frameworks.push('nextjs-developer')
  }
  if (files.some(f => f.includes('svelte'))) {
    frameworks.push('svelte-developer')
  }

  // Detect languages
  const languages = []
  if (fileExtensions.includes('ts') || fileExtensions.includes('tsx')) {
    languages.push('typescript')
  }
  if (fileExtensions.includes('js') || fileExtensions.includes('jsx')) {
    languages.push('javascript')
  }
  if (fileExtensions.includes('py')) {
    languages.push('python')
  }

  // Assess complexity
  let complexity: 'simple' | 'medium' | 'complex' = 'simple'
  if (files.length > 10) complexity = 'medium'
  if (files.length > 25 || frameworks.length > 2) complexity = 'complex'

  // Check for database/API
  const hasDatabase = files.some(f => 
    f.includes('db') || 
    f.includes('database') || 
    f.includes('supabase') ||
    f.includes('prisma') ||
    f.includes('.sql')
  )
  
  const hasAPI = files.some(f => 
    f.includes('api') || 
    f.includes('server') ||
    f.includes('route')
  )

  return {
    framework: frameworks[0],
    language: languages[0],
    complexity,
    hasDatabase,
    hasAPI
  }
}

export function getTemplateRecommendation(
  userInput: string,
  projectContext?: ReturnType<typeof analyzeProjectContext>
): (typeof Templates)[keyof typeof Templates] {
  const input = userInput.toLowerCase()
  
  // Mobile app detection
  if (input.includes('mobile') || 
      input.includes('react native') || 
      input.includes('expo') ||
      input.includes('ios') ||
      input.includes('android')) {
    return Templates['nextjs-developer'] // or another valid key from Templates
  }

  // Data analysis detection
  if (input.includes('data') ||
      input.includes('analysis') ||
      input.includes('pandas') ||
      input.includes('matplotlib') ||
      input.includes('jupyter')) {
    return Templates['code-interpreter-v1']
  }

  // Web framework detection
  if (input.includes('next') || projectContext?.framework === 'nextjs') {
    return Templates['nextjs-developer']
  }
  
  if (input.includes('vue') || input.includes('nuxt') || projectContext?.framework === 'vue') {
    return Templates['vue-developer']
  }

  if (input.includes('streamlit') || input.includes('dashboard')) {
    return Templates['streamlit-developer']
  }

  if (input.includes('gradio') || input.includes('demo') || input.includes('interface')) {
    return Templates['gradio-developer']
  }

  // Default based on project context or fallback
  if (projectContext?.framework === 'next.js') {
    return Templates['nextjs-developer']
  }

  return Templates['nextjs-developer'] // Safe default
}