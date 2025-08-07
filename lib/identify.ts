import type { Attributes } from '@flags-sdk/growthbook';
import type { Identify } from 'flags';
import { dedupe } from 'flags/next';
import { headers, cookies } from 'next/headers';
import { createServerClient } from './supabase-server';

export const identify = dedupe(async () => {
  try {
    // Get user from Supabase
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get request headers for additional context
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const host = headersList.get('host') || '';
    const referer = headersList.get('referer') || '';
    
    // Parse user agent for device/browser info
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
    
    // Extract browser info
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';
    
    // Parse URL components if available
    const url = new URL(referer || `https://${host}`);
    const utmParams = {
      utmSource: url.searchParams.get('utm_source') || undefined,
      utmMedium: url.searchParams.get('utm_medium') || undefined,
      utmCampaign: url.searchParams.get('utm_campaign') || undefined,
      utmTerm: url.searchParams.get('utm_term') || undefined,
      utmContent: url.searchParams.get('utm_content') || undefined,
    };

    return {
      // User identification
      id: user?.id || 'anonymous',
      email: user?.email,
      
      // Request context
      url: url.href,
      path: url.pathname,
      host: host,
      query: url.search,
      
      // Device/Browser info
      deviceType,
      browser,
      userAgent,
      
      // UTM parameters
      ...utmParams,
      
      // Additional user metadata
      isAuthenticated: !!user,
      userRole: user?.user_metadata?.role || 'user',
      signupDate: user?.created_at,
      
      // Timestamp
      timestamp: new Date().toISOString(),
    } as Attributes;
  } catch (error) {
    console.error('Error in identify function:', error);
    
    // Fallback attributes
    return {
      id: 'anonymous',
      deviceType: 'desktop',
      browser: 'unknown',
      isAuthenticated: false,
      timestamp: new Date().toISOString(),
    } as Attributes;
  }
}) satisfies Identify<Attributes>;