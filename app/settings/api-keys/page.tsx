"use client";

import * as React from "react";
import { PlusIcon, CopyIcon, EyeOpenIcon, EyeNoneIcon, TrashIcon } from "@radix-ui/react-icons";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string;
  created: string;
  permissions: string[];
}

const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API",
    key: "ak_live_1234567890abcdefghijklmnopqrstuvwxyz",
    lastUsed: "2 hours ago",
    created: "Jan 15, 2024",
    permissions: ["read", "write"]
  },
  {
    id: "2", 
    name: "Development API",
    key: "ak_test_9876543210zyxwvutsrqponmlkjihgfedcba",
    lastUsed: "1 day ago",
    created: "Jan 10, 2024",
    permissions: ["read"]
  }
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(mockApiKeys);
  const [showNewKeyDialog, setShowNewKeyDialog] = React.useState(false);
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyPermissions, setNewKeyPermissions] = React.useState<string[]>([]);

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== keyId));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `ak_${newKeyPermissions.includes('write') ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 42)}`,
      lastUsed: "Never",
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      permissions: newKeyPermissions
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
    setNewKeyPermissions([]);
    setShowNewKeyDialog(false);
  };

  const togglePermission = (permission: string) => {
    setNewKeyPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const maskKey = (key: string) => {
    const prefix = key.substring(0, 12);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'•'.repeat(16)}${suffix}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for accessing your account programmatically.
          </p>
        </div>
        <button
          onClick={() => setShowNewKeyDialog(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          New API Key
        </button>
      </div>

      {/* Create New Key Dialog */}
      {showNewKeyDialog && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-4 text-base font-medium">Create New API Key</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Enter a name for this key"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="space-y-2">
                {["read", "write"].map((permission) => (
                  <label key={permission} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewKeyDialog(false)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <div className="text-sm text-muted-foreground">
              No API keys found. Create your first API key to get started.
            </div>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{apiKey.name}</h4>
                    <div className="flex gap-1">
                      {apiKey.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created {apiKey.created}</span>
                    <span>Last used {apiKey.lastUsed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeNoneIcon className="h-3 w-3" />
                      ) : (
                        <EyeOpenIcon className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                    >
                      <CopyIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => deleteApiKey(apiKey.id)}
                  className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Guidelines */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="mb-2 text-sm font-medium">API Usage Guidelines</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Keep your API keys secure and never share them publicly</li>
          <li>• Use read-only keys when possible to limit potential damage</li>
          <li>• Rotate your keys regularly for better security</li>
          <li>• Monitor usage and revoke unused keys immediately</li>
        </ul>
      </div>
    </div>
  );
}