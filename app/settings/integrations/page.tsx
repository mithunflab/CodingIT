"use client";

import * as React from "react";
import { 
  GitHubLogoIcon, 
  DiscordLogoIcon,
  ExternalLinkIcon,
  CheckIcon,
  Cross2Icon,
  GearIcon
} from "@radix-ui/react-icons";
import { Slack, Chrome, Webhook } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "development" | "communication" | "productivity" | "automation";
  connected: boolean;
  lastSync?: string;
  permissions?: string[];
}

const integrations: Integration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect your GitHub repositories for seamless code integration",
    icon: <GitHubLogoIcon className="h-5 w-5" />,
    category: "development",
    connected: true,
    lastSync: "2 hours ago",
    permissions: ["Read repositories", "Read issues", "Write commits"]
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and interact with your workspace",
    icon: <Slack className="h-5 w-5" />,
    category: "communication",
    connected: true,
    lastSync: "1 hour ago",
    permissions: ["Send messages", "Read channels", "Manage notifications"]
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect to Discord servers and receive notifications",
    icon: <DiscordLogoIcon className="h-5 w-5" />,
    category: "communication",
    connected: false,
    permissions: ["Send messages", "Read messages", "Manage webhooks"]
  },
  {
    id: "chrome",
    name: "Chrome Extension",
    description: "Browser extension for quick access and web automation",
    icon: <Chrome className="h-5 w-5" />,
    category: "productivity",
    connected: false,
    permissions: ["Access browsing data", "Modify web pages", "Read bookmarks"]
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Custom webhook endpoints for external integrations",
    icon: <Webhook className="h-5 w-5" />,
    category: "automation",
    connected: true,
    lastSync: "Active",
    permissions: ["Receive HTTP requests", "Send responses", "Process data"]
  }
];

const categories = {
  development: "Development",
  communication: "Communication", 
  productivity: "Productivity",
  automation: "Automation"
};

export default function IntegrationsPage() {
  const [activeFilter, setActiveFilter] = React.useState<string>("all");
  const [integrationStates, setIntegrationStates] = React.useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  );

  const filteredIntegrations = integrations.filter(
    integration => activeFilter === "all" || integration.category === activeFilter
  );

  const toggleIntegration = (integrationId: string) => {
    setIntegrationStates(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }));
  };

  const getStatusColor = (connected: boolean) => {
    return connected
      ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
      : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external services and tools to enhance your workflow.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Connected Integrations Summary */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Connected Services</h4>
            <p className="text-xs text-muted-foreground">
              {Object.values(integrationStates).filter(Boolean).length} of {integrations.length} integrations connected
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {Object.values(integrationStates).filter(Boolean).length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>
      </div>

      {/* Integrations List */}
      <div className="space-y-4">
        {filteredIntegrations.map((integration) => {
          const isConnected = integrationStates[integration.id];
          
          return (
            <div key={integration.id} className="rounded-lg border p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    {integration.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{integration.name}</h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          isConnected
                        )}`}
                      >
                        <div className={`mr-1 h-1.5 w-1.5 rounded-full ${
                          isConnected ? "bg-green-500" : "bg-gray-400"
                        }`} />
                        {isConnected ? "Connected" : "Not connected"}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    
                    {isConnected && integration.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {integration.lastSync}
                      </p>
                    )}
                    
                    {integration.permissions && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Permissions:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {integration.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="rounded bg-muted px-2 py-1 text-xs"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                      <GearIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleIntegration(integration.id)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isConnected
                        ? "border border-border text-foreground hover:bg-accent"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Integration */}
      <div className="rounded-lg border border-dashed p-6">
        <div className="text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mx-auto">
            <ExternalLinkIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">Need a custom integration?</h4>
            <p className="text-sm text-muted-foreground">
              Use our API to build custom integrations for your specific needs.
            </p>
          </div>
          <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
            View API documentation
          </button>
        </div>
      </div>
    </div>
  );
}