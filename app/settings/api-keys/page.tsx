"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Plus, Copy, Eye, EyeOff, Trash2, AlertCircle, CheckCircle, Key } from "lucide-react";
import { getUserApiKeys, createApiKey, deleteApiKey, type ApiKeyData } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NewApiKeyForm {
  name: string;
  permissions: string[];
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyForm, setNewKeyForm] = useState<NewApiKeyForm>({
    name: "",
    permissions: []
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const availablePermissions = [
    { id: "read", label: "Read", description: "View data and resources" },
    { id: "write", label: "Write", description: "Create and modify data" },
    { id: "delete", label: "Delete", description: "Remove data and resources" },
    { id: "admin", label: "Admin", description: "Full administrative access" }
  ];

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
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

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await getUserApiKeys();
      setApiKeys(keys);
      setError(null);
    } catch (err) {
      setError("Failed to load API keys. Please try again.");
      console.error("Error loading API keys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyForm.name.trim()) {
      setError("Please enter a name for the API key.");
      return;
    }

    if (newKeyForm.permissions.length === 0) {
      setError("Please select at least one permission.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const result = await createApiKey({
        name: newKeyForm.name.trim(),
        key_prefix: newKeyForm.permissions.includes('write') ? 'ak_live' : 'ak_test',
        permissions: newKeyForm.permissions
      });
      
      if (result.success && result.apiKey) {
        setSuccess("API key created successfully!");
        setNewlyCreatedKey(Array.isArray(result.apiKey.full_key) ? result.apiKey.full_key[0] || "" : result.apiKey.full_key || "");
        setNewKeyForm({ name: "", permissions: [] });
        await loadApiKeys(); // Refresh the list
      } else {
        setError(result.error?.message || "Failed to create API key. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error creating API key:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteApiKey(keyId);
      
      if (result.success) {
        setSuccess("API key deleted successfully!");
        await loadApiKeys(); // Refresh the list
      } else {
        setError(result.error?.message || "Failed to delete API key. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error deleting API key:", err);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`API key "${keyName}" copied to clipboard!`);
    } catch (err) {
      setError("Failed to copy to clipboard.");
    }
  };

  const togglePermission = (permission: string) => {
    setNewKeyForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const maskKey = (keyPrefix: string) => {
    return `${keyPrefix}_${'•'.repeat(32)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric", 
      year: "numeric"
    });
  };

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
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage API keys for accessing your account programmatically.
          </p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key with specific permissions for your application.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production API, Development Key"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={newKeyForm.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={permission.id} className="text-sm font-medium">
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewKeyDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateKey}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* New Key Display */}
      {newlyCreatedKey && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              API Key Created Successfully
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-300">
              Make sure to copy your API key now. You will not be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 rounded-md">
              <code className="flex-1 text-sm font-mono">{newlyCreatedKey}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(newlyCreatedKey, "New API Key")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setNewlyCreatedKey(null)}
            >
              I have saved this key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            {apiKeys.length === 0 
              ? "You haven't created any API keys yet."
              : `You have ${apiKeys.length} API key${apiKeys.length === 1 ? '' : 's'}.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No API keys found.</p>
              <p className="text-sm text-muted-foreground">Create your first API key to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={apiKey.key_prefix.includes('live') ? 'default' : 'secondary'}>
                          {apiKey.key_prefix.includes('live') ? 'Production' : 'Development'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {formatDate(apiKey.created_at!)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKey(apiKey.id!, apiKey.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* API Key Display */}
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono p-2 bg-muted rounded">
                        {visibleKeys.has(apiKey.id!) ? `${apiKey.key_prefix}_${'*'.repeat(32)}` : maskKey(apiKey.key_prefix)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id!)}
                      >
                        {visibleKeys.has(apiKey.id!) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${apiKey.key_prefix}_${'*'.repeat(32)}`, apiKey.name)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Permissions */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Permissions</Label>
                      <div className="flex gap-1 mt-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Last Used */}
                    <div className="text-sm text-muted-foreground">
                      Last used: {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : "Never"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Keep your API keys secure and never share them publicly. 
          If you believe an API key has been compromised, delete it immediately and create a new one.
        </AlertDescription>
      </Alert>
    </div>
  );
}