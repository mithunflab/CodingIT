import { newWorkflowBuilder, enhancedCodeEditor, uiLayout } from '@/flags';

export async function FeatureFlagExample() {
  // Check feature flags
  const hasNewWorkflowBuilder = await newWorkflowBuilder();
  const hasEnhancedEditor = await enhancedCodeEditor();
  const currentLayout = await uiLayout();

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-3">Feature Flags Status</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>New Workflow Builder:</span>
          <span className={hasNewWorkflowBuilder ? 'text-green-600' : 'text-red-600'}>
            {hasNewWorkflowBuilder ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Enhanced Code Editor:</span>
          <span className={hasEnhancedEditor ? 'text-green-600' : 'text-red-600'}>
            {hasEnhancedEditor ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>UI Layout:</span>
          <span className="capitalize text-blue-600">
            {currentLayout}
          </span>
        </div>
      </div>

      {hasNewWorkflowBuilder && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            🎉 New Workflow Builder is enabled! You can access advanced workflow features.
          </p>
        </div>
      )}

      {hasEnhancedEditor && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-sm">
            ✨ Enhanced Code Editor is active with improved syntax highlighting and autocomplete.
          </p>
        </div>
      )}
    </div>
  );
}