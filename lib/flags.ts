import { growthbookAdapter } from '@flags-sdk/growthbook';

// Set up experiment tracking callback
growthbookAdapter.setTrackingCallback((experiment, result) => {
  // Fire and forget async tracking (compatible with Next.js 14)
  Promise.resolve().then(async () => {
    try {
      console.log('Viewed Experiment', {
        experimentId: experiment.key,
        variationId: result.key,
        timestamp: new Date().toISOString(),
      });
      
      // Here you could add additional tracking logic like:
      // - Send to analytics service
      // - Log to external service
      // - Store in database
    } catch (error) {
      console.error('Error tracking experiment:', error);
    }
  });
});

export { growthbookAdapter };