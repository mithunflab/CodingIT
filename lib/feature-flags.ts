// Utility functions for feature flag management
import * as flags from '@/flags';

// Type for all available feature flags
export type FeatureFlagKey = keyof typeof flags;

// Helper function to check if a feature is enabled
export async function isFeatureEnabled(flagKey: FeatureFlagKey): Promise<boolean> {
  try {
    const flagFunction = flags[flagKey];
    if (typeof flagFunction === 'function') {
      const result = await flagFunction();
      return Boolean(result);
    }
    return false;
  } catch (error) {
    console.error(`Error checking feature flag ${flagKey}:`, error);
    return false;
  }
}

// Helper function to get all feature flag statuses
export async function getAllFeatureFlags(): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  
  for (const [key, flagFunction] of Object.entries(flags)) {
    try {
      if (typeof flagFunction === 'function') {
        results[key] = await flagFunction();
      }
    } catch (error) {
      console.error(`Error getting flag ${key}:`, error);
      results[key] = false;
    }
  }
  
  return results;
}

// Helper to conditionally render components based on feature flags
export async function withFeatureFlag<T>(
  flagKey: FeatureFlagKey,
  component: T,
  fallback?: T
): Promise<T | undefined> {
  const isEnabled = await isFeatureEnabled(flagKey);
  return isEnabled ? component : fallback;
}

// Feature flag middleware for API routes
export async function checkFeatureAccess(
  flagKey: FeatureFlagKey,
  errorMessage = 'Feature not available'
): Promise<boolean> {
  const isEnabled = await isFeatureEnabled(flagKey);
  
  if (!isEnabled) {
    console.warn(`Feature access denied for ${flagKey}: ${errorMessage}`);
  }
  
  return isEnabled;
}