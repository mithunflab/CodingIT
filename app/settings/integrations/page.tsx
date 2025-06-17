"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Github, 
  Slack, 
  MessageCircle, 
  Chrome, 
  Webhook,
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings,
  AlertCircle,
  RefreshCw,
  Zap
} from "lucide-react";
import { getUserIntegrations, updateIntegration, type IntegrationData } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "development" | "communication" | "productivity" | "automation";
  status: "available" | "connected" | "coming_soon";
  features: string[];
  permissions: string[];
}

const availableIntegrations: AvailableIntegration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect your GitHub repositories for seamless code integration and project management",
    icon: <Github className="h-5 w-5" />,
    category: "development",
    status: "available",
    features: [
      "Import repositories",
      "Sync code changes",
      "Create pull requests",
      "Manage issues",
      "Deploy to GitHub Pages"
    ],
    permissions: ["Read repositories", "Read issues", "Write commits", "Manage webhooks"]
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and interact with your workspace directly from CodinIT.dev",
    icon: <Slack className="h-5 w-5" />,
    category: "communication",
    status: "available",
    features: [
      "Send notifications",
      "Share project updates",
      "Collaborative coding",
      "Status updates",
      "Custom commands"
    ],
    permissions: ["Send messages", "Read channels", "Manage notifications", "Access workspace info"]
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect to Discord servers and receive notifications about your projects",
    icon: <MessageCircle className="h-5 w-5" />,
    category: "communication",
    status: "available",
    features: [
      "Project notifications",
      "Bot commands",
      "Server integration",
      "Voice channel status",
      "Custom webhooks"
    ],
    permissions: ["Send messages", "Read messages", "Manage webhooks", "Access server info"]
  },
  {
    id: "chrome",
    name: "Chrome Extension",
    description: "Browser extension for quick access to CodinIT.dev and web automation features",
    icon: <Chrome className="h-5 w-5" />,
    category: "productivity",
    status: "coming_soon",
    features: [
      "Quick project access",
      "Web scraping",
      "Page automation",
      "Bookmark sync",
      "Context menu actions"
    ],
    permissions: ["Access browsing data", "Modify web pages", "Read bookmarks", "Manage downloads"]
  },
  {
    id: "webhooks",
    name: "Custom Webhooks",
    description: "Create custom webhook endpoints for external integrations and automations",
    icon: <Webhook className="h-5 w-5" />,
    category: "automation",
    status: "available",
    features: [
      "Custom endpoints",
      "Event triggers",
      "Data processing",
      "Third-party integrations",
      "Real-time updates"
    ],
    permissions: ["Receive HTTP requests", "Send responses", "Process data", "Manage endpoints"]
  }
];

const categories = {
  development: { name: "Development", icon: <Github className="h-4 w-4" /> },
  communication: { name: "Communication", icon: <MessageCircle className="h-4 w-4" /> },
  productivity: { name: "Productivity", icon: <Zap className="h-4 w-4" /> },
  automation: { name: "Automation", icon: <Settings className="h-4 w-4" /> }
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const userIntegrations = await getUserIntegrations();
      setIntegrations(userIntegrations);
      setError(null);
    } catch (err) {
      setError("Failed to load integrations. Please try again.");
      console.error("Error loading integrations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    try {
      setError(null);
      
      // Simulate OAuth flow for demo purposes
      if (integrationId === "github") {
        setSuccess("Redirecting to GitHub for authorization...");
        // In real implementation, redirect to OAuth URL
        window.open(`/api/integrations/github/connect`, "_blank");
      } else if (integrationId === "slack") {
        setSuccess("Redirecting to Slack for authorization...");
        window.open(`/api/integrations/slack/connect`, "_blank");
      } else {
        setSuccess(`Connecting to ${integrationId}...`);
      }
    } catch (err) {
      setError("Failed to initiate connection. Please try again.");
      console.error("Error connecting:", err);
    }
  };

  const handleDisconnect = async (integrationId: string, integrationName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrationName}? This will remove all associated data and permissions.`)) {
      return;
    }

    try {
      const integration = integrations.find(i => i.provider === integrationId);
      if (!integration) return;

      const result = await updateIntegration(integration.id!, { 
        last_sync_at: undefined,
        access_token: undefined,
        refresh_token: undefined
      });
      
      if (result.success) {
        setSuccess(`${integrationName} disconnected successfully!`);
        await loadIntegrations(); // Refresh the list
      } else {
        setError(result.error?.message || "Failed to disconnect integration. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error disconnecting:", err);
    }
  };

  const handleSync = async (integrationId: string, integrationName: string) => {
    try {
      setSuccess(`Syncing ${integrationName}...`);
      
      // Find the integration to sync
      const integration = integrations.find(i => i.provider === integrationId);
      if (!integration) return;

      const result = await updateIntegration(integration.id!, { 
        last_sync_at: new Date().toISOString()
      });
      
      if (result.success) {
        setSuccess(`${integrationName} synced successfully!`);
        await loadIntegrations(); // Refresh the list
      } else {
        setError(result.error?.message || "Failed to sync integration. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error syncing:", err);
    }
  };

  const getIntegrationStatus = (integrationId: string) => {
    const connected = integrations.find(i => i.provider === integrationId);
    return connected ? "connected" : "available";
  };

  const getConnectedIntegration = (integrationId: string) => {
    return integrations.find(i => i.provider === integrationId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredIntegrations = availableIntegrations.filter(
    integration => activeFilter === "all" || integration.category === activeFilter
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">
            Connect external services to enhance your CodinIT.dev experience.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3" />
          {integrations.length} Connected
        </Badge>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Category Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(categories).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              {category.icon}
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <IntegrationsGrid />
        </TabsContent>
        
        {Object.keys(categories).map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            <IntegrationsGrid />
          </TabsContent>
        ))}
      </Tabs>

      {/* Integration Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-2xl">
          {selectedIntegration && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedIntegration.icon}
                  {selectedIntegration.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedIntegration.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="space-y-1">
                    {selectedIntegration.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Permissions Required</h4>
                  <ul className="space-y-1">
                    {selectedIntegration.permissions.map((permission, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Settings className="h-3 w-3" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfigDialog(false)}
                >
                  Cancel
                </Button>
                {selectedIntegration.status === "coming_soon" ? (
                  <Button disabled>
                    Coming Soon
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleConnect(selectedIntegration.id);
                      setShowConfigDialog(false);
                    }}
                  >
                    Connect {selectedIntegration.name}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  function IntegrationsGrid() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => {
          const status = getIntegrationStatus(integration.id);
          const connectedIntegration = getConnectedIntegration(integration.id);
          
          return (
            <Card key={integration.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {integration.icon}
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  {status === "connected" ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : integration.status === "coming_soon" ? (
                    <Badge variant="secondary">
                      Coming Soon
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Available
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {status === "connected" && connectedIntegration && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Connected as: <span className="font-medium">{connectedIntegration.provider_username || "Unknown"}</span>
                    </div>
                    {connectedIntegration.last_sync_at && (
                      <div className="text-xs text-muted-foreground">
                        Last synced: {formatDate(connectedIntegration.last_sync_at)}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {status === "connected" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(integration.id, integration.name)}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowConfigDialog(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id, integration.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  ) : integration.status === "coming_soon" ? (
                    <Button disabled size="sm" className="flex-1">
                      Coming Soon
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(integration.id)}
                        className="flex-1"
                      >
                        Connect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowConfigDialog(true);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }
}