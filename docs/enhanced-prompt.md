# Enhanced Prompt System Documentation

## Overview

The Enhanced Prompt System transforms the static prompt generation into an intelligent, learning system that adapts to user patterns, project contexts, and performance metrics. It provides intelligent template selection, user behavior learning, error recovery, and performance optimization.

## Architecture

```
lib/prompt/
├── types.ts              # TypeScript definitions
├── analyzers/
│   └── index.ts          # Context and user pattern analyzers
├── optimizers/
│   └── index.ts          # Performance optimizers
├── templates/
│   └── index.ts          # Template-specific refinements
├── config.ts             # Configuration and constants
├── utils.ts              # Utility functions
└── index.ts              # Main enhanced prompt generator
```

## Key Features

### 1. Intelligent Template Selection
- **Multi-factor scoring** with keyword analysis (40%), project context (25%), user preferences (20%), and framework alignment (15%)
- **Automatic detection** based on user input, uploaded files, and project structure
- **Confidence scoring** with fallback recommendations

### 2. User Pattern Learning
- **Skill level detection** (beginner/intermediate/expert) based on success rates and usage patterns
- **Preference tracking** for templates, coding styles, and frameworks
- **Success pattern analysis** to improve future recommendations

### 3. Error Recovery & Learning
- **Error categorization** (syntax, runtime, dependency, template, timeout, etc.)
- **Automatic prompt enhancement** based on failure patterns
- **Retry optimization** with improved prompts after failures

### 4. Performance Optimization
- **Real-time metrics tracking** with execution time monitoring
- **Optimization triggers** based on success rates and performance thresholds
- **Dynamic prompt adjustment** for improved results

## Installation & Setup

### 1. Install Enhanced System

The enhanced prompt system is already integrated into the codebase. No additional installation required.

### 2. Environment Configuration

Add these optional environment variables to customize behavior:

```bash
# Feature flags (default: true)
NEXT_PUBLIC_ENABLE_INTELLIGENT_TEMPLATES=true
NEXT_PUBLIC_ENABLE_USER_LEARNING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_OPT=true
NEXT_PUBLIC_ENABLE_ERROR_RECOVERY=true

# Development settings
NODE_ENV=development  # Enables debug logging and extended retry counts
```

## Usage Examples

### Basic Usage (Backward Compatible)

The system maintains full backward compatibility with existing code:

```typescript
import { toPrompt } from '@/lib/prompt'
import { Templates } from '@/lib/templates'

// Original usage still works
const prompt = toPrompt(templates)
```

### Enhanced Usage

#### Simple Enhanced Prompt Generation

```typescript
import { toPromptEnhanced } from '@/lib/prompt'
import { Templates } from '@/lib/templates'

const result = await toPromptEnhanced(
  "Create a data visualization dashboard",
  templates,
  {
    userId: "user123",
    skillLevel: 'intermediate'
  }
)

console.log('Selected template:', result.selectedTemplate)
console.log('Confidence:', result.confidence)
console.log('Applied optimizations:', result.optimizations)
```

#### Advanced Usage with Project Context

```typescript
import { generateSmartPrompt } from '@/lib/prompt/utils'

const result = await generateSmartPrompt(
  "Build a machine learning demo interface",
  templates,
  {
    userId: "user123",
    teamId: "team456",
    files: uploadedFiles,
    projectData: {
      packageJson: JSON.stringify(packageData),
      files: projectFiles
    },
    retryCount: 0
  }
)
```

### API Integration

#### Enhanced Chat API Usage

```typescript
// app/api/chat/route.ts
const enhancedBody = {
  messages,
  userID,
  teamID,
  template,
  model,
  config,
  retryCount,
  projectContext: {
    uploadedFiles: files,
    dependencies: extractedDeps,
    frameworks: detectedFrameworks
  },
  sessionId: currentSessionId
}

const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify(enhancedBody)
})
```

#### Recording Execution Results

```typescript
import { recordExecutionOutcome } from '@/lib/prompt/utils'

// After code execution
recordExecutionOutcome(
  userId,
  sessionId,
  success,
  executionTime,
  errorType
)
```

### Frontend Integration

#### React Component with Enhanced Features

```typescript
import { useState, useCallback } from 'react'
import { generateSmartPrompt, recordExecutionOutcome } from '@/lib/prompt/utils'

function EnhancedChatComponent() {
  const [sessionId] = useState(() => 
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )
  const [retryCount, setRetryCount] = useState(0)
  const [optimizations, setOptimizations] = useState<string[]>([])

  const handleSubmit = useCallback(async (userPrompt: string, files: File[]) => {
    try {
      const result = await generateSmartPrompt(userPrompt, templates, {
        userId: user.id,
        files,
        retryCount
      })
      
      setOptimizations(result.optimizations)
      
      // Execute with enhanced prompt
      const execution = await executeCode(result.prompt)
      
      // Record result
      recordExecutionOutcome(
        user.id,
        sessionId,
        execution.success,
        execution.time,
        execution.errorType
      )
      
    } catch (error) {
      // Handle retry logic
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1)
        // Retry automatically
        setTimeout(() => handleSubmit(userPrompt, files), 1000)
      }
    }
  }, [retryCount, sessionId])

  return (
    <div>
      {optimizations.length > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p>Applied optimizations: {optimizations.join(', ')}</p>
        </div>
      )}
      
      {retryCount > 0 && (
        <div className="bg-yellow-50 p-3 rounded">
          <p>Retry attempt {retryCount}/3 - Optimizing prompt...</p>
        </div>
      )}
      
      {/* Rest of component */}
    </div>
  )
}
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  enableIntelligentSelection: true,
  enableUserLearning: true,
  enablePerformanceOptimization: true,
  enableErrorRecovery: true,
  maxRetries: 3,
  optimizationThreshold: 0.7,
  storageRetentionDays: 30
}
```

### Custom Configuration

```typescript
import { EnhancedPromptGenerator } from '@/lib/prompt'

const customGenerator = new EnhancedPromptGenerator({
  maxRetries: 5,
  optimizationThreshold: 0.8,
  enableUserLearning: false  // Disable for privacy-sensitive environments
})
```

## Template-Specific Features

### Code Interpreter (Python)
- **Data analysis focus** with pandas/numpy optimizations
- **Visualization enhancements** for matplotlib/plotly
- **Error handling** for data processing scenarios

### Next.js Developer
- **TypeScript strict mode** enforcement
- **shadcn/ui component** integration
- **Performance optimizations** for React patterns

### Vue Developer
- **Composition API** patterns
- **Nuxt 3 conventions** enforcement
- **Vue 3 reactivity** optimizations

### Streamlit Developer
- **Session state** management patterns
- **Interactive widget** optimizations
- **Performance** for data apps

### Gradio Developer
- **ML model interface** patterns
- **Demo-specific** optimizations
- **User experience** enhancements

## Analytics & Insights

### Getting Optimization Insights

```typescript
import { getOptimizationInsights } from '@/lib/prompt/utils'

const insights = getOptimizationInsights()

console.log('Common errors:', insights.commonErrors)
console.log('Successful optimizations:', insights.successfulOptimizations)
console.log('Average performance gain:', insights.averagePerformanceGain)
```

### Custom Analytics Integration

```typescript
// Track enhanced prompt events
analytics.track('enhanced_prompt_generated', {
  selectedTemplate: result.selectedTemplate,
  confidence: result.confidence,
  optimizations: result.optimizations,
  executionTime: result.metrics.promptGenerationTime
})
```

## Development & Debugging

### Debug Mode

In development, the system provides extensive debugging information:

```javascript
// Access debug interface in browser console
window.CodinITEnhancedPrompt.getGlobalGenerator()
```

### Storage Management

```typescript
import { clearExpiredStorage } from '@/lib/prompt/utils'

// Clean up old data (runs automatically)
clearExpiredStorage(30 * 24 * 60 * 60 * 1000) // 30 days
```

### Performance Monitoring

```typescript
import { createPerformanceMetrics, updatePerformanceMetrics } from '@/lib/prompt/utils'

const metrics = createPerformanceMetrics()
// ... measure operations
const updatedMetrics = updatePerformanceMetrics(metrics, {
  executionTime: measureTime(),
  success: true
})
```

## Migration Guide

### Phase 1: Backward Compatible Integration
1. Import enhanced functions alongside existing ones
2. Test with feature flags disabled
3. Gradually enable features

### Phase 2: Enhanced Features
1. Update API routes to use enhanced prompt generation
2. Add frontend integration for retry logic
3. Implement user context tracking

### Phase 3: Full Optimization
1. Enable all optimization features
2. Add custom analytics integration
3. Fine-tune configuration for your use case

## Best Practices

### 1. User Privacy
- Enhanced learning can be disabled for privacy-sensitive environments
- All data is stored locally in browser (no external transmission)
- Implement data retention policies as needed

### 2. Performance
- Monitor prompt generation times (should be <500ms)
- Use global generator instance to avoid reinitialization
- Clean up expired storage regularly

### 3. Error Handling
- Always implement fallback to base prompts
- Monitor retry counts and success rates
- Provide user feedback during optimization

### 4. Testing
- Test with different user skill levels
- Validate template selection accuracy
- Monitor optimization effectiveness

## Troubleshooting

### Common Issues

#### 1. Template Selection Not Working
```typescript
// Check if intelligent selection is enabled
import { ENHANCED_PROMPT_FEATURES } from '@/lib/prompt'
console.log(ENHANCED_PROMPT_FEATURES.intelligentTemplateSelection)
```

#### 2. User Learning Not Persisting
```typescript
// Check storage functionality
import { saveToStorage, loadFromStorage } from '@/lib/prompt/utils'
saveToStorage('test', { data: 'test' })
console.log(loadFromStorage('test'))
```

#### 3. Performance Issues
```typescript
const startTime = Date.now()
const result = await generateSmartPrompt(prompt, templates)
console.log('Generation time:', Date.now() - startTime)
```

## Support

For issues and questions:
1. Check the debug logs in development mode
2. Review the configuration settings
3. Monitor browser console for errors
4. Verify feature flags are correctly set

The enhanced prompt system is designed to be robust and fail gracefully, always falling back to the original prompt system when needed.