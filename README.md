![opengraph](https://github.com/user-attachments/assets/de684e88-a65c-42ea-b067-d1a3bc85a420)


<p align="center">
  <a href="https://e2b.dev/startups">
    <img src="https://img.shields.io/badge/SPONSORED%20BY-E2B%20FOR%20STARTUPS-32CD32?style=for-the-badge" alt="SPONSORED BY E2B.DEV" />
  </a>
</p>

**CodinIT.dev** is a comprehensive AI-powered software development platform that combines multiple Large Language Models (LLMs), secure code execution environments, and advanced workflow automation to create a complete development ecosystem. Build, test, and deploy applications using natural language with the power of AI.

## 🚀 What Makes CodinIT.dev Special

- **Multi-LLM Integration**: Choose from 50+ AI models including GPT-5, Claude Sonnet 4, Gemini 2.5, Mistral, and more
- **Secure Code Execution**: Run code safely in isolated E2B sandbox environments
- **Visual Workflow Builder**: Create complex automation workflows with drag-and-drop interface
- **Fragment-Based Development**: Modular, reusable code components with real-time preview
- **Multiple Tech Stacks**: Support for Python, Next.js, Vue.js, Streamlit, and Gradio applications
- **Team Collaboration**: Real-time project sharing with authentication and billing management
- **GitHub Integration**: Direct repository access and deployment capabilities
- **Enterprise Ready**: Stripe billing, usage tracking, and team management

## 🔥 Core Features

### AI-Powered Code Generation
- **50+ LLM Models**: GPT-5, Claude Sonnet 4, Gemini 2.5 Pro, Mistral Large, Grok 4, DeepSeek, and more
- **Multi-Modal Support**: Text, image, and code understanding across providers
- **Streaming Responses**: Real-time AI code generation with live preview
- **Smart Template Detection**: Automatically selects optimal tech stack for your project

### Secure Development Environment
- **E2B Sandboxes**: Isolated, secure code execution environments
- **Multiple Runtimes**: Python, Node.js, and custom Docker environments
- **Package Management**: Automatic npm/pip package installation
- **File System Access**: Full file tree browser and editor

### Development Templates
- **🐍 Python Data Analyst**: Jupyter-style notebooks with data visualization
- **⚛️ Next.js Developer**: Full-stack React applications with TypeScript
- **🟢 Vue.js Developer**: Modern Vue 3 applications with Nuxt
- **📊 Streamlit Developer**: Interactive data apps and dashboards
- **🤗 Gradio Developer**: ML model interfaces and demos

### Advanced Workflow System
- **Visual Workflow Builder**: Drag-and-drop interface for complex automations
- **Multi-Step Execution**: Chain multiple AI operations and code executions
- **Fragment System**: Reusable code components with dependency management
- **Workflow Templates**: Pre-built automation patterns

### Collaboration & Management
- **Team Workspaces**: Shared projects with role-based access control
- **Real-time Sync**: Live collaboration with Supabase real-time subscriptions
- **Project History**: Version control and execution tracking
- **Usage Analytics**: Detailed insights with PostHog integration

### Integrations & Deployment
- **GitHub Integration**: Repository browsing, cloning, and webhook support
- **Cloud Deployment**: Direct deployment to various cloud platforms
- **Stripe Billing**: Subscription management and usage-based pricing
- **API Access**: RESTful API for programmatic access

### Supported AI Providers
- **OpenAI**: GPT-5, GPT-4o, o1, o3 series
- **Anthropic**: Claude Opus 4, Sonnet 4, Haiku 3.5
- **Google**: Gemini 2.5 Pro, Flash, and Vertex AI models
- **Mistral**: Magistral, Large, Codestral, Pixtral
- **xAI**: Grok 4, Grok 3 series
- **DeepSeek**: V3 and R1 models
- **Groq**: High-speed inference for Llama, Qwen models
- **Fireworks**: Fast deployment for open-source models
- **Together AI**: Collaborative AI model serving
- **Ollama**: Local model deployment

## Get started

### Prerequisites

- [git](https://git-scm.com)
- Recent version of [Node.js](https://nodejs.org) and npm package manager
- [E2B API Key](https://e2b.dev)
- LLM Provider API Key

### 1. Clone the repository

In your terminal:

```
git clone https://github.com/Gerome-Elassaad/CodinIT.dev-2.git
```
Replace `Gerome-Elassaad/CodinIT.dev-2.git` with your actual repository details.

## 🏧 Technology Stack

### Frontend
- **Next.js 14**: App Router, Server Actions, and React 18
- **TypeScript**: Full type safety throughout the application
- **TailwindCSS**: Utility-first CSS framework with custom design system
- **shadcn/ui**: Modern React component library
- **Framer Motion**: Smooth animations and transitions
- **Monaco Editor**: VS Code-style code editing experience

### Backend & Infrastructure
- **Supabase**: PostgreSQL database with real-time subscriptions
- **E2B Sandboxes**: Secure, isolated code execution environments
- **Vercel AI SDK**: Unified interface for multiple LLM providers
- **Stripe**: Payment processing and subscription management
- **Upstash Redis**: Rate limiting and caching
- **PostHog**: User analytics and feature flags

### AI & Machine Learning
- **Multi-Provider Support**: OpenAI, Anthropic, Google, Mistral, xAI, DeepSeek
- **Code Interpreter**: AI-powered code analysis and execution
- **Workflow Engine**: Multi-step AI automation system
- **Fragment System**: Modular AI-generated code components

### Development & Deployment
- **GitHub Integration**: OAuth, repository access, webhooks
- **Cloud Deployment**: Multi-platform deployment support
- **Docker**: Containerized sandbox environments
- **WebSocket**: Real-time collaboration and updates

### 2. Install the dependencies

Navigate into the cloned project directory (if you're not already in it) and run the following to install the required dependencies:

```
npm install
```

### 3. Set the environment variables

Create a `.env.local` file and set the following:

```sh
# Core Services
# =============

# E2B (Code Execution) - Required
# Get your API key at https://e2b.dev/
E2B_API_KEY="your-e2b-api-key"

# Supabase (Database & Authentication) - Required
# Get your credentials at https://supabase.com/
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# AI Providers (at least one required)
# ===================================

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Anthropic (Claude)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Google AI
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Google Vertex AI (requires service account JSON)
GOOGLE_VERTEX_CREDENTIALS="your-vertex-service-account-json"

# Mistral
MISTRAL_API_KEY="your-mistral-api-key"

# xAI (Grok)
XAI_API_KEY="your-xai-api-key"

# DeepSeek
DEEPSEEK_API_KEY="your-deepseek-api-key"

# Groq
GROQ_API_KEY="your-groq-api-key"

# Fireworks
FIREWORKS_API_KEY="your-fireworks-api-key"

# Together AI
TOGETHER_API_KEY="your-together-api-key"

# Integrations & Features
# ======================

# GitHub OAuth (for repository access)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe (for billing and subscriptions)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Vercel/Upstash KV (for rate limiting)
KV_REST_API_URL="your-kv-rest-api-url"
KV_REST_API_TOKEN="your-kv-rest-api-token"

# PostHog (analytics and feature flags)
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="https://us.posthog.com"

# Application Configuration
# ========================

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW="900000"

# Feature Flags (optional)
# =======================

# Disable API key input in chat interface
# NEXT_PUBLIC_NO_API_KEY_INPUT=true

# Disable base URL input in chat interface  
# NEXT_PUBLIC_NO_BASE_URL_INPUT=true

# Hide local models (Ollama) from model list
# NEXT_PUBLIC_HIDE_LOCAL_MODELS=true
```

### 4. Start the development server

```
npm run dev

The application will be available at `http://localhost:3000`
```

### 5. Build the web app

```
npm run build

### 6. Run linting (optional)

```
npm run lint
```

## 🏡 Architecture Overview

### Core Systems

**Fragment System**: Modular code components that can be composed, reused, and shared across projects. Each fragment contains:
- Code implementation
- Dependencies and libraries
- Execution context and environment
- Preview and testing capabilities

**Workflow Engine**: Visual workflow builder that allows chaining multiple AI operations:
- Drag-and-drop node interface
- Multi-step automation sequences  
- Variable passing between nodes
- Conditional execution paths
- Real-time execution monitoring

**Sandbox Management**: Secure, isolated execution environments:
- E2B-powered sandboxes
- Multiple runtime templates (Python, Node.js, Docker)
- File system isolation
- Network security controls
- Automatic cleanup and resource management

**AI Orchestration**: Intelligent routing and management of LLM requests:
- Provider failover and load balancing
- Model-specific optimization
- Streaming response handling
- Usage tracking and analytics
- Cost optimization algorithms

### Data Architecture

**Database Schema** (Supabase/PostgreSQL):
- User management and authentication
- Project and fragment storage
- Workflow definitions and execution history
- Usage tracking and billing data
- Team collaboration and permissions

**Real-time Features**:
- Live collaboration via Supabase subscriptions
- Real-time code execution updates
- Shared cursors and selections
- Instant notification system
```

## 🗁️ Project Structure

```
CodinIT.dev/
├── app/                    # Next.js app router
│   ├── api/                # API routes
│   │   ├── chat/           # AI chat endpoints
│   │   ├── sandbox/        # Code execution
│   │   ├── workflows/      # Workflow management
│   │   ├── auth/           # Authentication
│   │   └── integrations/   # GitHub, Stripe
│   ├── workflows/          # Workflow builder UI
│   └── settings/           # User settings pages
├── components/             # React components
│   ├── ui/                 # Base UI components (shadcn)
│   ├── workflow-builder/   # Workflow visual editor
│   ├── fragment-*/         # Fragment system components
│   └── deployment/         # Deployment dashboard
├── lib/                    # Core libraries
│   ├── models.ts           # LLM provider configurations
│   ├── templates.json      # Sandbox templates
│   ├── workflow-engine.ts  # Workflow execution logic
│   ├── auth.ts             # Authentication helpers
│   ├── database.ts         # Database operations
│   └── prompts/            # AI prompt management
├── sandbox-templates/      # E2B sandbox configurations
│   ├── nextjs-developer/   # Next.js template
│   ├── streamlit-developer/ # Streamlit template
│   └── gradio-developer/   # Gradio template
└── schemas/                # Database schemas
```

### Key Components

- **Chat Interface** (`components/chat.tsx`): Main AI interaction component
- **Code Editor** (`components/code-editor.tsx`): Monaco-based code editing
- **Preview System** (`components/preview.tsx`): Live application preview
- **Workflow Canvas** (`components/workflow-builder/`): Visual workflow editor
- **Fragment System** (`components/fragment-*/`): Modular code components
- **IDE Integration** (`components/ide.tsx`): Full development environment

## 🔧 Customize

### Adding Custom Development Templates

1. Make sure [E2B CLI](https://e2b.dev/docs/cli) is installed and you're logged in.

2. Add a new folder under [sandbox-templates/](sandbox-templates/)

3. Initialize a new template using E2B CLI:

    ```bash
    e2b template init
    ```

    This will create a new file called `e2b.Dockerfile`.

4. **Configure the Dockerfile**

    Example Streamlit template:

    ```dockerfile
    # Use Debian-based base image
    FROM python:3.11-slim

    # Install dependencies
    RUN pip3 install --no-cache-dir streamlit pandas numpy matplotlib requests seaborn plotly

    # Set working directory
    WORKDIR /home/user
    COPY . /home/user
    ```

5. **Set the start command** in `e2b.toml`:

    ```toml
    start_cmd = "cd /home/user && streamlit run app.py --server.port 8501 --server.address 0.0.0.0"
    ```

6. **Deploy the template**

    ```bash
    e2b template build --name <template-name>
    ```

    Success message:
    ```
    ✅ Building sandbox template <template-id> <template-name> finished.
    ```

7. **Register in templates.json**

    Add your template to [`lib/templates.json`](lib/templates.json):

    ```json
    "custom-template": {
      "name": "Custom Template",
      "lib": ["dependency1", "dependency2"],
      "file": "main.py",
      "instructions": "Template-specific instructions for the AI.",
      "port": 8080
    }
    ```

8. **Add template logo** (optional)

    Place logo SVG in [`public/thirdparty/templates/`](public/thirdparty/templates)

### Adding Custom LLM Models

1. **Register the model** in [`lib/models.json`](lib/models.json):

    ```json
    {
      "id": "custom-model-id",
      "name": "Custom Model Name", 
      "provider": "Provider Name",
      "providerId": "provider-id",
      "multiModal": true
    }
    ```

    Parameters:
    - `id`: Unique model identifier
    - `name`: Display name in the UI
    - `provider`: Human-readable provider name
    - `providerId`: Provider configuration key
    - `multiModal`: Whether the model supports images/vision

### Adding Custom LLM Providers

1. **Configure provider** in [`lib/models.ts`](lib/models.ts):

    Add to the `providerConfigs` object:

    ```typescript
    'custom-provider': () => createOpenAI({ 
      apiKey: apiKey || process.env.CUSTOM_PROVIDER_API_KEY, 
      baseURL: baseURL || 'https://api.customprovider.com/v1' 
    })(modelNameString)
    ```

2. **Set output mode** (optional) in `getDefaultMode`:

    ```typescript
    if (providerId === 'custom-provider') {
      return 'json' // or 'tool' or 'object'
    }
    ```

3. **Add environment variable**:

    ```bash
    CUSTOM_PROVIDER_API_KEY="your-api-key"
    ```

4. **Add provider logo** (optional):

    Place SVG logo in [`public/thirdparty/logos/`](public/thirdparty/logos)

## 🚀 Advanced Usage

### Workflow Automation

CodinIT.dev supports complex multi-step workflows:

```typescript
// Example workflow definition
const workflow = {
  name: 'Data Analysis Pipeline',
  fragments: [
    { type: 'data-import', config: { source: 'csv' } },
    { type: 'data-cleaning', config: { method: 'pandas' } },
    { type: 'visualization', config: { charts: ['scatter', 'histogram'] } }
  ],
  connections: [
    { from: 'data-import', to: 'data-cleaning' },
    { from: 'data-cleaning', to: 'visualization' }
  ]
}
```

### Team Collaboration

Setup team workspaces:

1. Configure team billing in Stripe dashboard
2. Invite team members via settings
3. Set role-based permissions
4. Share projects and workflows

### API Integration

Access CodinIT.dev programmatically:

```typescript
// Execute code via API
const response = await fetch('/api/code/execute', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    code: 'print("Hello from API")',
    template: 'code-interpreter-v1'
  })
})
```

## 📝 API Documentation

CodinIT.dev provides a comprehensive REST API. Key endpoints:

- `POST /api/chat` - AI code generation
- `POST /api/sandbox` - Create execution environments  
- `POST /api/code/execute` - Execute code in sandboxes
- `GET /api/workflows` - List workflows
- `POST /api/workflows/{id}/execute` - Execute workflows
- `GET /api/files/sandbox/list` - Browse sandbox files

For detailed API documentation, see [`openapi.yaml`](openapi.yaml) or import the Postman collection from [`postman-collection.json`](postman-collection.json).

## 👥 Contributing

We welcome contributions to CodinIT.dev! Please see our contributing guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Run linting: `npm run lint`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas for Contribution

- 🤖 New AI provider integrations
- 📊 Additional sandbox templates
- 🔧 Workflow automation improvements
- 📝 Documentation and tutorials
- 🐛 Bug fixes and performance optimizations
- 🎨 UI/UX enhancements

## 📞 Support

- **Documentation**: Comprehensive guides in [`docs/`](docs/)
- **GitHub Issues**: Report bugs and request features
- **Community**: Join our Discord server
- **Email**: Contact team@codinit.dev

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [E2B](https://e2b.dev) for secure code execution environments
- [Supabase](https://supabase.com) for database and authentication
- [Vercel](https://vercel.com) for deployment and hosting
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- All the amazing AI providers making this possible

---

<p align="center">
  <strong>Built with ❤️ by the CodinIT.dev team</strong>
</p>