import { get } from '@vercel/edge-config';
import { growthbookAdapter } from '@flags-sdk/growthbook';

/**
 * Edge Config adapter for GrowthBook feature flags
 * This provides faster access to feature flags by using Vercel's Edge Config
 * which is cached at the edge, reducing latency compared to API calls
 */

export interface EdgeConfigFeatureData {
  features: Record<string, any>;
  experiments: any[];
  dateUpdated: string;
}

export class EdgeConfigAdapter {
  private clientKey: string;
  private fallbackAdapter: typeof growthbookAdapter;

  constructor(clientKey: string, fallbackAdapter: typeof growthbookAdapter) {
    this.clientKey = clientKey;
    this.fallbackAdapter = fallbackAdapter;
  }

  /**
   * Get feature flag data from Edge Config with fallback to GrowthBook API
   */
  async getFeatureData(): Promise<EdgeConfigFeatureData | null> {
    // Check if Edge Config is properly configured
    const edgeConfigConnectionString = process.env.EDGE_CONFIG;
    if (!edgeConfigConnectionString || !edgeConfigConnectionString.startsWith('https://')) {
      console.log('⚠️ Edge Config not configured, using fallback data');
      return await this.fallbackToAPI();
    }

    try {
      // Try to get data from Edge Config first (fastest)
      const edgeData = await get(this.clientKey) as EdgeConfigFeatureData;
      
      if (edgeData && edgeData.features) {
        console.log('✅ Features loaded from Edge Config (cached)', {
          featuresCount: Object.keys(edgeData.features).length,
          dateUpdated: edgeData.dateUpdated
        });
        return edgeData;
      }
    } catch (error) {
      // Suppress error logging for invalid connection strings in development
      if (error instanceof Error && error.message.includes('Invalid connection string')) {
        console.log('⚠️ Edge Config connection string invalid, using fallback');
      } else {
        console.warn('Edge Config not available, falling back:', error);
      }
    }

    return await this.fallbackToAPI();
  }

  private async fallbackToAPI(): Promise<EdgeConfigFeatureData | null> {
    // Fallback to direct API call or mock data
    try {
      const apiEndpoint = process.env.GROWTHBOOK_API_ENDPOINT;
      if (!apiEndpoint) {
        console.log('⚠️ GrowthBook API not configured, using mock data');
        return this.getMockFeatureData();
      }

      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`GrowthBook API returned ${response.status}`);
      }

      const apiData = await response.json();
      console.log('📡 Features loaded from GrowthBook API', {
        featuresCount: Object.keys(apiData.features || {}).length,
        dateUpdated: apiData.dateUpdated
      });
      
      return apiData;
    } catch (error) {
      console.warn('❌ Failed to fetch from API, using mock data:', error);
      return this.getMockFeatureData();
    }
  }

  private getMockFeatureData(): EdgeConfigFeatureData {
    return {
      features: {
        'workflow-builder-v2': { defaultValue: false },
        'enhanced-code-editor': { defaultValue: false },
        'premium-templates': { defaultValue: false },
        'advanced-analytics': { defaultValue: false },
        'beta-ai-models': { defaultValue: false },
        'theme-customization': { defaultValue: false },
        'subscription-tier': { defaultValue: 'free' },
      },
      experiments: [],
      dateUpdated: new Date().toISOString()
    };
  }

  /**
   * Check if a specific feature is enabled
   */
  async isFeatureEnabled(featureKey: string, context: any = {}): Promise<boolean> {
    const featureData = await this.getFeatureData();
    
    if (!featureData || !featureData.features) {
      return false;
    }

    const feature = featureData.features[featureKey];
    if (!feature) {
      return false;
    }

    // Simple feature flag evaluation
    // For more complex rules, you'd implement the full GrowthBook evaluation logic
    if (feature.defaultValue !== undefined) {
      return Boolean(feature.defaultValue);
    }

    return false;
  }

  /**
   * Get the value of a feature flag
   */
  async getFeatureValue(featureKey: string, defaultValue: any = false, context: any = {}): Promise<any> {
    const featureData = await this.getFeatureData();
    
    if (!featureData || !featureData.features) {
      return defaultValue;
    }

    const feature = featureData.features[featureKey];
    if (!feature) {
      return defaultValue;
    }

    return feature.defaultValue !== undefined ? feature.defaultValue : defaultValue;
  }

  /**
   * Get all feature flags as a simple object
   */
  async getAllFeatures(): Promise<Record<string, any>> {
    const featureData = await this.getFeatureData();
    
    if (!featureData || !featureData.features) {
      return {};
    }

    // Transform features into a simple key-value object
    const features: Record<string, any> = {};
    
    for (const [key, feature] of Object.entries(featureData.features)) {
      if (feature && typeof feature === 'object' && 'defaultValue' in feature) {
        features[key] = feature.defaultValue;
      } else {
        features[key] = feature;
      }
    }

    return features;
  }
}

// Create a singleton instance
export const edgeConfigAdapter = new EdgeConfigAdapter(
  process.env.GROWTHBOOK_CLIENT_KEY || 'mock-client-key',
  growthbookAdapter
);

/**
 * Utility functions for easy use in components
 */
export async function getFromEdgeConfig(key: string, defaultValue: any = null) {
  try {
    // Only try Edge Config if properly configured
    if (!process.env.EDGE_CONFIG || !process.env.EDGE_CONFIG.startsWith('https://')) {
      return defaultValue;
    }
    
    const value = await get(key);
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    // Suppress error logging for invalid connection strings
    if (error instanceof Error && error.message.includes('Invalid connection string')) {
      return defaultValue;
    }
    console.warn(`Error getting ${key} from Edge Config:`, error);
    return defaultValue;
  }
}

export async function getFeatureFromEdgeConfig(featureKey: string, defaultValue: any = false) {
  return await edgeConfigAdapter.getFeatureValue(featureKey, defaultValue);
}