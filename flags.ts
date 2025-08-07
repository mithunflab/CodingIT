import { growthbookAdapter } from '@flags-sdk/growthbook';
import { flag } from 'flags/next';
import { identify } from '@/lib/identify';

// Example feature flags for CodingIT platform

// New workflow builder feature
export const newWorkflowBuilder = flag<boolean>({
  key: 'new-workflow-builder',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
  identify,
});

// Enhanced code editor
export const enhancedCodeEditor = flag<boolean>({
  key: 'enhanced-code-editor',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
  identify,
});

// AI model selection feature
export const aiModelSelection = flag<boolean>({
  key: 'ai-model-selection',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: true, // Default to true since this is likely already implemented
  identify,
});

// Dark mode toggle
export const darkModeToggle = flag<boolean>({
  key: 'dark-mode-toggle',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: true,
  identify,
});

// Premium features access
export const premiumFeatures = flag<boolean>({
  key: 'premium-features',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
  identify,
});

// Beta template support
export const betaTemplates = flag<boolean>({
  key: 'beta-templates',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
  identify,
});

// Advanced analytics
export const advancedAnalytics = flag<boolean>({
  key: 'advanced-analytics',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
  identify,
});

// Collaborative editing
export const collaborativeEditing = flag<boolean>({
  key: 'collaborative-editing',
  adapter: growthbookAdapter.feature<boolean>(),
  defaultValue: false,
  identify,
});

// Multi-variant flag for testing different UI layouts
export const uiLayout = flag<'classic' | 'modern' | 'compact'>({
  key: 'ui-layout',
  adapter: growthbookAdapter.feature<'classic' | 'modern' | 'compact'>(),
  defaultValue: 'classic',
  identify,
});

// Feature flag for different pricing tiers
export const pricingTier = flag<'free' | 'pro' | 'enterprise'>({
  key: 'pricing-tier',
  adapter: growthbookAdapter.feature<'free' | 'pro' | 'enterprise'>(),
  defaultValue: 'free',
  identify,
});