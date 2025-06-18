import { NextResponse } from 'next/server';

const SAMPLE_TEMPLATES = [
  {
    id: "nextjs-app",
    name: "nextjs-app",
    display_name: "Next.js Application",
    description: "Modern React application with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui components. Perfect for building fast, SEO-friendly web applications.",
    category: "web",
    language: "typescript",
    framework: "nextjs",
    tags: ["typescript", "tailwind", "app-router", "ssr", "seo"],
    config: {
      template: "nextjs-developer",
      features: ["typescript", "tailwind", "app-router", "shadcn-ui"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 1250,
    demo_url: "https://nextjs-template-demo.vercel.app"
  },
  {
    id: "react-component",
    name: "react-component",
    display_name: "React Component Library",
    description: "Reusable React component library with TypeScript, Storybook for documentation, and comprehensive testing setup.",
    category: "library",
    language: "typescript",
    framework: "react",
    tags: ["components", "storybook", "testing", "npm-package"],
    config: {
      template: "nextjs-developer",
      features: ["components", "storybook", "testing", "rollup"]
    },
    is_official: true,
    is_featured: false,
    usage_count: 450
  },
  {
    id: "vue-app",
    name: "vue-app",
    display_name: "Vue.js Application",
    description: "Modern Vue 3 application with Composition API, Vite build tool, TypeScript support, and Vuetify components.",
    category: "web",
    language: "typescript",
    framework: "vue",
    tags: ["vue3", "composition-api", "vite", "vuetify"],
    config: {
      template: "vue-developer",
      features: ["vue3", "composition-api", "vite", "typescript"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 780
  },
  {
    id: "python-api",
    name: "python-api",
    display_name: "FastAPI Backend",
    description: "High-performance Python API with FastAPI, async support, automatic OpenAPI documentation, and PostgreSQL integration.",
    category: "api",
    language: "python",
    framework: "fastapi",
    tags: ["fastapi", "async", "openapi", "postgresql", "uvicorn"],
    config: {
      template: "code-interpreter-v1",
      features: ["fastapi", "async", "openapi", "database"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 920
  },
  {
    id: "streamlit-dashboard",
    name: "streamlit-app",
    display_name: "Streamlit Dashboard",
    description: "Interactive data dashboard with Streamlit, Plotly charts, pandas data processing, and machine learning integration.",
    category: "data",
    language: "python",
    framework: "streamlit",
    tags: ["dashboard", "charts", "data-analysis", "ml", "plotly"],
    config: {
      template: "streamlit-developer",
      features: ["dashboard", "charts", "ml", "data-processing"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 650
  },
  {
    id: "landing-page",
    name: "landing-page",
    display_name: "Landing Page",
    description: "High-converting landing page with modern design, SEO optimization, analytics integration, and conversion tracking.",
    category: "marketing",
    language: "typescript",
    framework: "nextjs",
    tags: ["landing", "seo", "conversion", "analytics", "marketing"],
    config: {
      template: "nextjs-developer",
      features: ["landing", "seo", "conversion", "analytics"]
    },
    is_official: true,
    is_featured: false,
    usage_count: 380
  },
  {
    id: "mobile-app",
    name: "react-native-app",
    display_name: "React Native App",
    description: "Cross-platform mobile application with React Native, Expo, TypeScript, and native device integrations.",
    category: "mobile",
    language: "typescript",
    framework: "react-native",
    tags: ["mobile", "expo", "cross-platform", "ios", "android"],
    config: {
      template: "nextjs-developer", // Adapted for React Native
      features: ["expo", "navigation", "async-storage", "push-notifications"]
    },
    is_official: true,
    is_featured: false,
    usage_count: 290
  },
  {
    id: "fullstack-app",
    name: "fullstack-app",
    display_name: "Full-Stack Application",
    description: "Complete full-stack application with Next.js frontend, FastAPI backend, PostgreSQL database, and deployment ready.",
    category: "web",
    language: "typescript",
    framework: "nextjs",
    tags: ["fullstack", "nextjs", "fastapi", "postgresql", "deployment"],
    config: {
      template: "nextjs-developer",
      features: ["frontend", "backend", "database", "auth", "deployment"]
    },
    is_official: true,
    is_featured: true,
    usage_count: 560
  }
];

export async function GET() {
  try {
    return NextResponse.json({ templates: SAMPLE_TEMPLATES });
  } catch (error) {
    console.error("Error fetching project templates:", error);
    return NextResponse.json({ error: "Failed to fetch project templates" }, { status: 500 });
  }
}
