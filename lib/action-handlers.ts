import type React from "react"
import type { LLMModelConfig } from "@/lib/models"
import type { TemplateId } from "@/lib/templates"
import { FigmaIntegration } from "@/lib/figma-integration"

export interface ActionHandlerProps {
  setChatInput: (input: string) => void
  setFiles: (files: File[]) => void
  setSelectedTemplate: (template: "auto" | TemplateId) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  languageModel: LLMModelConfig
}

// Screenshot cloning functionality
export const handleCloneScreenshot = async ({ setChatInput, setFiles, setSelectedTemplate }: ActionHandlerProps) => {
  // Create file input for image upload
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.multiple = false

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image file is too large. Please select an image under 10MB.")
        return
      }

      setFiles([file])
      setChatInput(
        `🖼️ **Clone this screenshot and recreate it as a functional web component**

Please analyze this image and:

1. **Match the exact visual design** - colors, fonts, spacing, layout
2. **Recreate all UI elements** - buttons, forms, navigation, content sections
3. **Make it responsive** - ensure it works on mobile and desktop
4. **Add interactivity** - implement any buttons, forms, or interactive elements
5. **Use modern practices** - semantic HTML, accessibility, clean CSS
6. **Optimize for performance** - efficient code structure and loading

Create a pixel-perfect, functional recreation that captures both the design and implied functionality of the original.`,
      )
      setSelectedTemplate("nextjs-developer")

      // Auto-submit after a brief delay to allow state updates
      setTimeout(() => {
        const form = document.querySelector("form") as HTMLFormElement
        if (form) {
          form.requestSubmit()
        }
      }, 100)
    }
  }

  input.click()
}

// Enhanced Figma import functionality
export const handleFigmaImport = async ({ setChatInput, setSelectedTemplate }: ActionHandlerProps) => {
  const figmaUrl = prompt(
    "🎨 Enter your Figma file URL or share link:\n\nExample: https://www.figma.com/file/abc123/My-Design",
  )

  if (!figmaUrl) return

  if (!figmaUrl.includes("figma.com")) {
    alert("❌ Please enter a valid Figma URL that includes 'figma.com'")
    return
  }

  // Show loading state
  setChatInput("🔄 Analyzing Figma design... Please wait while I fetch and analyze your design.")

  try {
    const figmaIntegration = new FigmaIntegration()
    const fileId = figmaIntegration.extractFileId(figmaUrl)

    if (!fileId) {
      alert("❌ Could not extract file ID from the Figma URL. Please check the URL format.")
      return
    }

    // Try to fetch and analyze the Figma file
    const response = await fetch("/api/figma/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ figmaUrl }),
    })

    if (response.ok) {
      const { analysis, fileName } = await response.json()
      setChatInput(`🎨 **Import from Figma: ${fileName}**

${analysis}

**Additional Requirements:**
- Ensure all interactive elements are functional
- Add proper TypeScript types for all props and state
- Include error boundaries and loading states where appropriate
- Optimize for accessibility (WCAG 2.1 AA compliance)
- Make the design system reusable with proper component composition`)
    } else {
      // Fallback to basic prompt if API fails
      setChatInput(`🎨 **Import and recreate this Figma design**: ${figmaUrl}

Please analyze the Figma design and create a functional web component that:

1. **Matches the visual design** - Extract and use the exact colors, typography, spacing, and layout
2. **Identifies design tokens** - Create a consistent design system with reusable values
3. **Recreates all components** - Build each UI element as a proper React component
4. **Implements interactions** - Add any buttons, forms, or interactive elements shown
5. **Ensures responsiveness** - Make it work perfectly on all screen sizes
6. **Follows best practices** - Use semantic HTML, proper accessibility, and modern CSS
7. **Creates reusable code** - Structure components for maintainability and reuse

Generate a comprehensive, production-ready implementation that perfectly matches the Figma design.`)
    }

    setSelectedTemplate("nextjs-developer")

    // Auto-submit
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  } catch (error) {
    console.error("Figma import error:", error)
    alert("❌ Error importing from Figma. Please try again or check your internet connection.")
  }
}

// Enhanced project upload functionality
export const handleUploadProject = async ({ setChatInput, setFiles, setSelectedTemplate }: ActionHandlerProps) => {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".zip,.tar,.gz,.json,.js,.ts,.jsx,.tsx,.html,.css,.md,.txt,.py,.java,.php,.rb,.go,.rs"
  input.multiple = true

  input.onchange = (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || [])
    if (files.length === 0) return

    // Validate total file size (max 50MB)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 50 * 1024 * 1024) {
      alert("Total file size is too large. Please select files under 50MB total.")
      return
    }

    // Validate file count (max 20 files)
    if (files.length > 20) {
      alert("Too many files selected. Please select up to 20 files.")
      return
    }

    setFiles(files)
    setChatInput(`📁 **Analyze and enhance this uploaded project**

I've uploaded ${files.length} file(s) for analysis. Please provide a comprehensive review and enhancement:

## 🔍 **Analysis Required:**
1. **Code Architecture Review** - Analyze structure, patterns, and organization
2. **Technology Stack Assessment** - Identify frameworks, libraries, and tools used
3. **Code Quality Evaluation** - Check for best practices, code smells, and issues
4. **Security Analysis** - Identify potential vulnerabilities and security concerns
5. **Performance Review** - Find bottlenecks and optimization opportunities
6. **Accessibility Audit** - Check for WCAG compliance and usability issues

## 🚀 **Enhancement Suggestions:**
1. **Modernization** - Upgrade to latest best practices and technologies
2. **TypeScript Integration** - Add proper type safety if missing
3. **Error Handling** - Improve error boundaries and validation
4. **Testing Strategy** - Suggest unit, integration, and e2e testing approaches
5. **Documentation** - Generate comprehensive docs and comments
6. **CI/CD Setup** - Recommend deployment and automation strategies

## 📋 **Deliverables:**
- Detailed analysis report with specific recommendations
- Refactored code with improvements implemented
- Updated documentation and setup instructions
- Testing examples and best practices guide

Please provide actionable insights and improved code that follows modern development standards.`)

    setSelectedTemplate("auto")

    // Auto-submit
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  input.click()
}

// Enhanced landing page template
export const handleLandingPage = async ({ setChatInput, setSelectedTemplate }: ActionHandlerProps) => {
  setChatInput(`🏠 **Create a modern, high-converting landing page**

Build a professional landing page with these comprehensive features:

## 🎯 **Hero Section**
- **Compelling headline** that clearly communicates value proposition
- **Engaging subheadline** with supporting details
- **Primary CTA button** with strong action-oriented copy
- **Hero visual** (image, video, or illustration)
- **Social proof indicators** (customer logos, testimonials, stats)

## 📋 **Essential Sections**
- **Features/Benefits** - Highlight key value propositions with icons
- **How It Works** - Step-by-step process explanation
- **Social Proof** - Customer testimonials, reviews, case studies
- **Pricing** - Clear pricing tiers with feature comparisons
- **FAQ** - Address common questions and objections
- **Contact/Footer** - Contact info, links, legal pages

## 🎨 **Design Requirements**
- **Modern, clean aesthetic** with professional color scheme
- **Mobile-first responsive design** that works on all devices
- **Smooth animations** and micro-interactions for engagement
- **Fast loading performance** with optimized images and code
- **Accessibility compliant** (WCAG 2.1 AA standards)
- **SEO optimized** with proper meta tags and structure

## 🔧 **Technical Features**
- **Contact form** with validation and submission handling
- **Newsletter signup** with email validation
- **Analytics tracking** ready (Google Analytics, etc.)
- **Social media integration** with sharing buttons
- **Performance optimized** with lazy loading and compression
- **Security headers** and CSRF protection

## 💼 **Conversion Optimization**
- **Clear value proposition** above the fold
- **Strategic CTA placement** throughout the page
- **Trust signals** and credibility indicators
- **Urgency/scarcity elements** where appropriate
- **Mobile conversion optimization**
- **A/B testing ready** structure

Create a landing page that not only looks amazing but converts visitors into customers!`)

  setSelectedTemplate("nextjs-developer")

  // Auto-submit
  setTimeout(() => {
    const form = document.querySelector("form") as HTMLFormElement
    if (form) {
      form.requestSubmit()
    }
  }, 100)
}

// Enhanced sign up form template
export const handleSignUpForm = async ({ setChatInput, setSelectedTemplate }: ActionHandlerProps) => {
  setChatInput(`👤 **Create a comprehensive, secure sign-up form**

Build a professional registration form with these advanced features:

## 📝 **Form Fields & Validation**
- **Email address** with real-time format validation and duplicate checking
- **Password** with strength indicator and security requirements
- **Confirm password** with real-time matching validation
- **Full name** (first & last) with proper formatting
- **Optional fields** - phone number, company, job title
- **Terms & conditions** checkbox with modal/popup for full terms
- **Newsletter opt-in** with clear privacy explanation
- **CAPTCHA integration** for bot protection

## 🔒 **Security & Privacy**
- **Password requirements** - minimum length, complexity rules
- **Real-time validation** with helpful error messages
- **Secure password handling** - no plain text storage
- **CSRF protection** and form security headers
- **Rate limiting** to prevent abuse
- **Privacy compliance** (GDPR, CCPA ready)
- **Data encryption** for sensitive information

## 🎨 **UI/UX Excellence**
- **Clean, modern design** with intuitive layout
- **Progressive disclosure** - show fields as needed
- **Loading states** during form submission
- **Success/error messaging** with clear next steps
- **Responsive design** optimized for mobile
- **Accessibility features** - screen reader support, keyboard navigation
- **Visual feedback** - field validation states, progress indicators

## ⚡ **Advanced Features**
- **Social login options** (Google, GitHub, Apple, Facebook)
- **Email verification** workflow with resend functionality
- **Welcome email** automation setup
- **User onboarding** flow integration
- **Analytics tracking** for conversion optimization
- **A/B testing** ready structure

## 🔧 **Technical Implementation**
- **Form state management** with proper validation logic
- **Error handling** with user-friendly messages
- **Success redirects** to onboarding or dashboard
- **Integration ready** for popular auth services (Supabase, Auth0, Firebase)
- **TypeScript types** for all form data and validation
- **Testing examples** for form validation and submission

## 📊 **Conversion Optimization**
- **Minimal friction** - only essential fields initially
- **Trust indicators** - security badges, privacy statements
- **Social proof** - user count, testimonials
- **Clear value proposition** - benefits of signing up
- **Mobile optimization** for touch interfaces
- **Performance optimized** for fast loading

Create a sign-up form that maximizes conversions while maintaining security and user experience!`)

  setSelectedTemplate("nextjs-developer")

  // Auto-submit
  setTimeout(() => {
    const form = document.querySelector("form") as HTMLFormElement
    if (form) {
      form.requestSubmit()
    }
  }, 100)
}
